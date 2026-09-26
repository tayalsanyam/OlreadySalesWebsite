#!/usr/bin/env node
import {createClient} from '@supabase/supabase-js';

const warnings=[];
const failures=[];
const ok=(m)=>console.log('OK:',m);
const warn=(m)=>{console.warn('WARN:',m);warnings.push(m);};
const fail=(m)=>{console.error('FAIL:',m);failures.push(m);};

const demo=process.env.LOCAL_DEMO==='true';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const service=process.env.SUPABASE_SERVICE_ROLE_KEY;
const publishable=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const appUrl=process.env.APP_URL||'';

if(demo)warn('LOCAL_DEMO=true — development uses .data/state.json instead of Supabase.');
else ok('LOCAL_DEMO=false — website reads/writes partner_workspace in Supabase.');

if(!url||!service||!publishable)fail('Supabase: set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.');
else{
 const db=createClient(url,service,{auth:{persistSession:false}});
 const {data,error}=await db.from('partner_workspace').select('id,lock_version,state').eq('id','main').maybeSingle();
 if(error)fail('partner_workspace: '+error.message);
 else if(!data)fail('Run OLREADY_Combined_Migration.sql in the Supabase SQL editor.');
 else{
  ok(`partner_workspace (lock_version=${data.lock_version}, revision=${data.state?.revision??'?'})`);
  if(data.state?.published?.plans?.[0]?.taxPercent!==18)warn('Published plans missing 18% GST — run npm run sync:supabase or publish from admin.');
  if(!data.state?.published?.settings?.policiesApproved)warn('policiesApproved=false — Razorpay checkout blocked until Settings → Terms are approved for publication.');
  const {error:staffErr}=await db.from('partner_staff').select('user_id').limit(1);
  if(staffErr)fail('partner_staff: '+staffErr.message);
  else ok('partner_staff table reachable (create staff via supabase/create-first-admin.sql).');
 }
}

const rp=process.env.RAZORPAY_KEY_ID;
const rs=process.env.RAZORPAY_KEY_SECRET;
const rw=process.env.RAZORPAY_WEBHOOK_SECRET;
const re=process.env.RAZORPAY_ENABLED==='true';
if(!rp||!rs||!rw)warn('Razorpay: add RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET to .env.local.');
else{
 ok(`Razorpay credentials loaded (${rp.startsWith('rzp_live_')?'live':'test'} key).`);
 if(!re)warn('Set RAZORPAY_ENABLED=true after webhook is configured on a public HTTPS URL.');
 else if(demo&&rp.startsWith('rzp_live_'))fail('Live Razorpay keys cannot be used with LOCAL_DEMO=true.');
 else ok('RAZORPAY_ENABLED=true.');
}

if(!/^https?:\/\//.test(appUrl))warn('Set APP_URL to your public site origin (SEO canonical URLs and webhooks).');

if(failures.length){console.error('\nFix failures before launch.');process.exit(1);}
if(warnings.length){console.log('\nWarnings only — review before production checkout.');process.exit(0);}
console.log('\nStack check passed.');process.exit(0);
