import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {sameOrigin,json,fail} from '@/lib/api';
import {rateLimit} from '@/lib/limit';
import {mutate,readState,publicSite} from '@/lib/store';
import {phoneCountryCodeField,phoneFromParts,phoneLocalField,requiredNameField} from '@/lib/contact-validation';
import {trimAssistantSessions} from '@/lib/assistant-sessions';

const input=z.object({
 name:requiredNameField,
 countryCode:phoneCountryCodeField,
 phone:phoneLocalField,
 consent:z.literal(true),
});

export async function POST(req:NextRequest){
 try{
  sameOrigin(req);
  await rateLimit(req,'assistant-register',20);
  const body=input.parse(await json(req));
  const state=await readState();
  const site=publicSite(state.published);
  if(!site.assistant.enabled)throw new Error('Assistant is paused');
  const phone=phoneFromParts(body.countryCode,body.phone);
  const sessionId=await mutate(s=>{
   s.assistantSessions??=[];
   const id=crypto.randomUUID();
   s.assistantSessions.unshift({id,name:body.name.trim(),phone,created_at:new Date().toISOString(),completed:false,messages:[]});
   trimAssistantSessions(s);
   return id;
  });
  return NextResponse.json({sessionId,greeting:site.assistant.greeting},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return fail(e);}
}
