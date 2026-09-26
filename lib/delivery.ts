import 'server-only';
import {mutate,readState,demo} from './store';
import {enqueueRecovery,eligible,jobTemplate} from './workflows';
import {signLink} from './signed-links';
import {renderTemplate} from './commerce';
import {applyTestRecipient,emailDeliveryEnabled,emailFrom,resendConfigured} from './email-env';

export type ProcessJobsOptions={skipRecovery?:boolean;kinds?:string[];ids?:string[];limit?:number};

/** Transactional mail flushed right after enqueue; cron still retries failures and runs recovery. */
export const IMMEDIATE_JOB_KINDS=['staff-alert','list-confirmation','purchase'] as const;

function pickJob(s:import('./schema').State,opts:ProcessJobsOptions,now:number){
 const idSet=opts.ids?.length?new Set(opts.ids):null;
 const kinds=opts.kinds?.length?new Set(opts.kinds):null;
 return s.jobs.find(j=>{
  if(idSet&&!idSet.has(j.id))return false;
  if(kinds&&!kinds.has(j.kind))return false;
  const due=['queued','retry'].includes(j.status)||j.status==='sending'&&Date.parse(j.leaseUntil||'')<now;
  if(!due)return false;
  if(j.retryAt&&Date.parse(j.retryAt)>now)return false;
  return true;
 })||null;
}

export async function flushImmediateJobs(ids:string[]){
 if(!ids.length)return [];
 try{return await processJobs({skipRecovery:true,ids,limit:Math.max(ids.length,1)});}
 catch{return [];}
}

export async function processJobs(opts:ProcessJobsOptions={}){
 if(!opts.skipRecovery)await mutate(s=>enqueueRecovery(s));
 const enabled=!demo()&&emailDeliveryEnabled();
 if(enabled&&!resendConfigured())throw new Error('Email provider is not configured');
 const from=emailFrom();
 const limit=opts.limit??10;
 const results=[];
 for(let i=0;i<limit;i++){
  const lease=crypto.randomUUID();
  const j=await mutate(s=>{
   const now=Date.now();
   const job=pickJob(s,opts,now);
   if(!job)return null;
   if(!eligible(s,job)){job.status='suppressed';return null;}
   job.status='sending';
   job.leaseUntil=new Date(now+120000).toISOString();
   job.payload.lease=lease;
   job.attempts=(job.attempts||0)+1;
   return structuredClone(job);
  });
  if(!j)break;
  try{
   const s=await readState();
   if(!eligible(s,j))throw new Error('Recipient or cart no longer eligible');
   let subject:string,body:string,to:string[];
   if(j.kind==='staff-alert'){
    subject=j.rendered!.subject;body=j.rendered!.body;
    to=j.payload.to.split(',').map(e=>e.trim()).filter(Boolean);
    if(!to.length)throw new Error('No staff alert recipients');
   }else{
    const template=jobTemplate(s,j);
    if(!template)throw new Error('Template disabled or missing');
    const base=process.env.APP_URL||'http://localhost:4170';
    const cart=s.carts.find(c=>c.id===j.payload.cartId);
    const order=s.orders?.find(o=>o.id===j.payload.orderId);
    const person=order?{id:order.id,email:order.customer.email}:s.subscribers.find(p=>p.id===j.payload.subscriberId)!;
    const token=enabled&&!order?signLink('unsubscribe',person.id,8760):'preview-only';
    const values={name:order?.customer.name||cart?.name||'Artist',plan:order?.plan.name||s.published.plans.find(p=>p.id===cart?.planId)?.name||'',order_id:order?.id||'',merchant_url:s.published.settings.merchantUrl,support_url:`https://wa.me/${s.published.settings.whatsapp}`,confirm_url:`${base}/email-preferences?token=${encodeURIComponent(j.payload.token||'')}&action=confirm`,cart_url:`${base}/resume?token=${enabled?signLink('cart',cart?.id||''):'preview-only'}`,unsubscribe_url:`${base}/email-preferences?token=${token}&action=unsubscribe`,plans_url:`${base}/plans`};
    subject=j.rendered?.subject||renderTemplate(template.subject,values);
    body=j.rendered?.body||renderTemplate(template.body,values);
    to=[person.email];
   }
   await mutate(s=>{const job=s.jobs.find(x=>x.id===j.id);if(job?.payload.lease===lease)job.rendered={subject,body};});
   let providerId='';
   if(enabled){
    if(!eligible(await readState(),j))throw new Error('Recipient or cart no longer eligible');
    const routed=applyTestRecipient(to,subject);
    const res=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':j.id},body:JSON.stringify({from,to:routed.to,subject:routed.subject,text:body}),signal:AbortSignal.timeout(20000)});
    if(!res.ok){const detail=await res.text().catch(()=>'');throw new Error(`Email provider returned ${res.status}${detail?`: ${detail.slice(0,200)}`:''}`);}
    providerId=(await res.json()).id;
   }
   await mutate(s=>{const job=s.jobs.find(x=>x.id===j.id);if(job?.payload.lease===lease){job.status=enabled?'sent':'previewed';job.providerId=providerId;delete job.payload.lease;delete job.payload.token;}});
   results.push({id:j.id,status:enabled?'sent':'previewed'});
  }catch(e){
   await mutate(s=>{
    const job=s.jobs.find(x=>x.id===j.id);
    if(job?.payload.lease!==lease||!job)return;
    job.lastError=e instanceof Error?e.message:'Delivery error';
    job.status=eligible(s,job)?(job.attempts||0)>=5?'failed':'retry':'suppressed';
    job.retryAt=new Date(Date.now()+Math.pow(2,job.attempts||1)*60000).toISOString();
    delete job.payload.lease;
   });
   results.push({id:j.id,status:'retry or suppressed'});
  }
 }
 return results;
}
