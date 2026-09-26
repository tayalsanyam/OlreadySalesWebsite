import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {sameOrigin,json,fail} from '@/lib/api';
import {rateLimit} from '@/lib/limit';
import {mutate} from '@/lib/store';
import {completeAssistantSession,appendAssistantMessage} from '@/lib/assistant-sessions';
import {flushImmediateJobs} from '@/lib/delivery';

const input=z.object({
 sessionId:z.string().uuid(),
 transcript:z.array(z.object({role:z.enum(['user','assistant']),text:z.string().max(4000)})).max(40).optional(),
});

export async function POST(req:NextRequest){
 try{
  sameOrigin(req);
  await rateLimit(req,'assistant-complete',30);
  const body=input.parse(await json(req));
  let hadSession=false;
  await mutate(s=>{
   const session=s.assistantSessions?.find(x=>x.id===body.sessionId);
   if(!session)return;
   hadSession=true;
   if(body.transcript?.length&&!session.messages.length){
    for(const m of body.transcript)appendAssistantMessage(session,m.role,m.text);
   }
   completeAssistantSession(s,body.sessionId);
  });
  if(hadSession)await flushImmediateJobs([`staff-assistant:${body.sessionId}`]);
  return NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return fail(e);}
}
