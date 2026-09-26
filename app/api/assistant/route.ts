import {rateLimit} from '@/lib/limit';
import {NextRequest, NextResponse} from 'next/server';
import {z} from 'zod';
import {readState, publicSite, mutate} from '@/lib/store';
import {sameOrigin, json, fail} from '@/lib/api';
import {guideAnswer} from '@/lib/plan-guide';
import {aiEnabled, aiModel, aiDailyLimit, openai} from '@/lib/openai';
import {responsePayload, parseResponse} from '@/lib/assistant-ai';
import {wantsCallbackHandoff, callbackAcknowledgement} from '@/lib/assistant-handoff';
import {staffNotifyAssistantCallback} from '@/lib/staff-notify';
import {flushImmediateJobs} from '@/lib/delivery';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
 try {
  sameOrigin(req);
  await rateLimit(req, 'assistant', 30);
  const body = z
   .object({
    sessionId: z.string().uuid().optional(),
    message: z.string().trim().min(1).max(1000),
    history: z
     .array(z.object({role: z.enum(['user', 'assistant']), content: z.string().max(4000)}))
     .max(8)
     .default([]),
   })
   .parse(await json(req));
  const state = await readState();
  const site = publicSite(state.published);
  if (!site.assistant.enabled) throw new Error('Assistant is paused');
  const session = body.sessionId
   ? state.assistantSessions?.find((x) => x.id === body.sessionId && !x.completed)
   : undefined;
  if (site.assistant.requireLeadCapture !== false && !session) {
   throw new Error('Share your name and mobile number to start the assistant.');
  }

  const handoffIntent = wantsCallbackHandoff(body.message);
  let answer: string;
  let mode: string;
  let sources: string[] = [];
  let handoffQueued = false;

  if (handoffIntent && !aiEnabled()) {
   const guided = guideAnswer(site, body.message);
   answer = guided.answer;
   mode = 'guided';
   sources = [];
  } else if (aiEnabled()) {
   try {
    await mutate((s) => {
     const day = new Date().toISOString().slice(0, 10);
     if (s.aiUsage?.day !== day) s.aiUsage = {day, count: 0};
     if (s.aiUsage!.count >= aiDailyLimit()) throw new Error('Daily AI allowance reached');
     s.aiUsage!.count++;
    });
    const payload = responsePayload(
     {...site, assistant: {...site.assistant, guidance: state.published.assistant.guidance}},
     state.knowledge,
     body.message,
     body.history,
     aiModel(),
    );
    const data = await openai('responses', {method: 'POST', body: payload});
    const parsed = parseResponse(data, state.knowledge);
    answer = parsed.answer;
    mode = parsed.mode || 'openai';
    sources = parsed.sources || [];
    if (handoffIntent && !/follow up|follow-up|noted|team will|whatsapp/i.test(answer)) {
     answer = `${answer}\n\n${callbackAcknowledgement(state.published.settings.supportHours)}`;
    }
   } catch {
    const guided = guideAnswer(site, body.message);
    answer = guided.answer;
    mode = 'guided-fallback';
    sources = [];
   }
  } else {
   const guided = guideAnswer(site, body.message);
   answer = guided.answer;
   mode = 'guided';
   sources = [];
  }

  if (body.sessionId) {
   const flushIds: string[] = [];
   await mutate((s) => {
    const live = s.assistantSessions?.find((x) => x.id === body.sessionId && !x.completed);
    if (!live) return;
    live.messages.push(
     {role: 'user', text: body.message.slice(0, 4000)},
     {role: 'assistant', text: answer.slice(0, 4000)},
    );
    if (live.messages.length > 40) live.messages.splice(0, live.messages.length - 40);
    if (handoffIntent && !live.callbackRequested) {
     live.callbackRequested = true;
     live.callbackRequestedAt = new Date().toISOString();
     staffNotifyAssistantCallback(s, live, body.message);
     handoffQueued = true;
     flushIds.push(`staff-assistant-callback:${live.id}`);
    }
   });
   if (handoffQueued && flushIds.length) await flushImmediateJobs(flushIds);
  }

  const topic = handoffIntent ? 'callback' : guideAnswer(site, body.message).topic;
  return NextResponse.json(
   {answer, mode, topic, sources, handoff: handoffIntent},
   {headers: {'Cache-Control': 'no-store'}},
  );
 } catch (e) {
  return fail(e);
 }
}
