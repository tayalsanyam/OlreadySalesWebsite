import {rateLimit} from '@/lib/limit';
import {NextRequest,NextResponse} from 'next/server';
import {mutate,demo} from '@/lib/store';
import {hash,secret} from '@/lib/secrets';
import {sameOrigin,json,fail} from '@/lib/api';
import {emailDeliveryEnabled,resendConfigured} from '@/lib/email-env';
import {flushImmediateJobs} from '@/lib/delivery';
import {z} from 'zod';

export async function POST(req:NextRequest){
 try{
  sameOrigin(req);
  await rateLimit(req,'subscribe',10);
  const {email}=z.object({email:z.string().email().max(254),consent:z.literal(true)}).parse(await json(req));
  if(!demo()&&(!resendConfigured()||!process.env.LINK_SIGNING_SECRET||!emailDeliveryEnabled()))throw new Error('Email updates are not available yet. Please contact our team.');
  const jobId=await mutate(s=>{
   const old=s.subscribers.find(x=>x.email===email.toLowerCase());
   if(old?.status==='confirmed')return '';
   if(old?.status==='pending'&&Date.parse(old.created_at)>Date.now()-60000)return '';
   const token=secret();
   const now=new Date().toISOString();
   const id=old?.id||crypto.randomUUID();
   if(old)Object.assign(old,{status:'pending',tokenHash:hash(token),created_at:now});
   else s.subscribers.push({id,email:email.toLowerCase(),status:'pending',tokenHash:hash(token),created_at:now});
   const confirmId=crypto.randomUUID();
   s.jobs.push({id:confirmId,kind:'list-confirmation',status:'queued',payload:{subscriberId:id,email,token},created_at:now});
   return confirmId;
  });
  if(jobId)await flushImmediateJobs([jobId]);
  return NextResponse.json({message:demo()?'Preview: confirmation queued for review. No email has been sent.':'Please check your email to confirm your subscription.'});
 }catch(e){return fail(e);}
}
export async function GET(){return NextResponse.json({error:'Use the email preferences page to confirm your choice.'},{status:405});}
