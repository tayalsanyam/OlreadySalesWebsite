/**
 * Queue sample staff + mailing-list jobs, then run the delivery worker.
 * Usage: node --import tsx --env-file=.env.local scripts/send-test-emails.ts
 */
import {mutate,readState} from '../lib/store';
import {processJobs} from '../lib/delivery';
import {enqueueStaffAlert} from '../lib/staff-notify';
import {hash,secret} from '../lib/secrets';
import {emailFrom,resendConfigured,emailDeliveryEnabled} from '../lib/email-env';

const testEmail=process.env.EMAIL_TEST_RECIPIENT||'tayalsanyam@gmail.com';

async function main(){
 console.log('From:',emailFrom()||'(missing EMAIL_FROM or RESEND_FROM_EMAIL)');
 console.log('Delivery enabled:',emailDeliveryEnabled());
 console.log('Resend configured:',resendConfigured());
 console.log('Staff alerts →',process.env.STAFF_ALERT_EMAILS||'(published settings)');
 console.log('Test redirect →',testEmail);

 await mutate(s=>{
  enqueueStaffAlert(s,{
   kind:'contact',
   topic:'Test contact alert',
   body:`This is a Resend test from ${new Date().toISOString()}.\nIf you see this, staff alerts are working.`,
   id:`staff-test-contact:${Date.now()}`,
  });
  enqueueStaffAlert(s,{
   kind:'assistant',
   topic:'Test assistant chat',
   body:`Visitor: Test User\nPhone: +919876543210\n\nAssistant: Sample reply for email test.`,
   id:`staff-test-assistant:${Date.now()}`,
  });
  const token=secret();
  const id=crypto.randomUUID();
  const now=new Date().toISOString();
  s.subscribers=s.subscribers.filter(p=>p.email!==testEmail.toLowerCase());
  s.subscribers.push({id,email:testEmail.toLowerCase(),status:'pending',tokenHash:hash(token),created_at:now});
  s.jobs.push({
   id:`test-list-confirm:${Date.now()}`,
   kind:'list-confirmation',
   status:'queued',
   payload:{subscriberId:id,email:testEmail,token},
   created_at:now,
  });
 });

 const before=(await readState()).jobs.filter(j=>['queued','retry'].includes(j.status)).length;
 console.log(`Queued jobs (queued/retry): ${before}`);
 const results=await processJobs();
 console.log('Process results:',results);
 const after=await readState();
 for(const r of results){
  const j=after.jobs.find(x=>x.id===r.id);
  if(j)console.log(`  ${j.id} → ${j.status}${j.lastError?` (${j.lastError})`:''}${j.providerId?` resend:${j.providerId}`:''}`);
 }
}

main().catch(e=>{console.error(e);process.exit(1);});
