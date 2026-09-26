import {NextRequest, NextResponse} from 'next/server';
import {mutate} from '@/lib/store';
import {sameOrigin, json, fail} from '@/lib/api';
import {journeyEventNames} from '@/lib/journey-events';
import {z} from 'zod';

const schema = z.object({
 session: z.string().uuid(),
 name: z.enum(journeyEventNames),
 path: z.string().regex(/^\/[a-z0-9/-]*$/).max(100),
 target: z.string().max(60).optional(),
 referrer: z.string().max(120).optional(),
 landing: z.string().regex(/^\/[a-z0-9/-]*$/).max(100).optional(),
 campaign: z.string().max(120).optional(),
});

export async function POST(req: NextRequest) {
 try {
  sameOrigin(req);
  if (req.cookies.get('olready_consent')?.value !== 'yes') {
   return NextResponse.json({ok: true, recorded: false});
  }
  const event = schema.parse(await json(req));
  await mutate((s) => {
   const now = Date.now();
   if (s.events.filter((e) => e.session === event.session && Date.parse(e.created_at) > now - 60000).length >= 40) {
    throw new Error('Event rate exceeded');
   }
   s.events = s.events.filter((e) => Date.parse(e.created_at) > now - 90 * 86400000).slice(-9999);
   s.events.push({...event, id: crypto.randomUUID(), created_at: new Date().toISOString()});
  });
  return NextResponse.json({ok: true});
 } catch (e) {
  return fail(e);
 }
}
