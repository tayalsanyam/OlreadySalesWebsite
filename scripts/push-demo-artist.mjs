/**
 * One-off demo artist for Top Grossing Artists QA.
 * Usage: node --env-file=.env.local scripts/push-demo-artist.mjs push|remove
 */
import {createClient} from '@supabase/supabase-js';

const DEMO_ID='00000000-0000-4000-a000-000000demo01';
const action=process.argv[2]||'push';

function validatePublication(s){
 for(const m of s.metrics)if(m.approved&&(!m.period||!m.evidence||!Number.isFinite(Date.parse(m.expires))||Date.parse(m.expires)<=Date.now()))throw new Error('Approved statistics need evidence, period and a valid future review date');
 for(const a of s.artists)if(a.approved&&(!a.name||!a.image||a.amountPaise===null||!a.definition||!a.consent||!a.evidence||!a.period||!Number.isFinite(Date.parse(a.expires))||Date.parse(a.expires)<=Date.now()))throw new Error('Published artists need a name, portrait, amount, definition, consent, evidence, period and future review date');
 for(const p of s.plans)if(p.approved&&(p.pricePaise===null||!p.term||!p.features.length))throw new Error('Approved plans need a price, term and inclusions');
}

function demoArtist(){
 return {id:DEMO_ID,slug:'riya-mehta-mumbai-demo',name:'Riya Mehta (Demo)',city:'Mumbai',bio:'Demo artist for testing Top Grossing Artists. Remove anytime from Admin → Top Grossing Artists.',keywords:'demo, bridal makeup',services:['Bridal makeup','Party glam'],instagram:'@riyademo',gallery:[],image:'/hero.png',profileUrl:'https://merchant.olready.in/makeup/login',amountPaise:8500000,definition:'Gross booking value',period:'Jan–Mar 2026',evidence:'Internal demo record for QA',consent:true,approved:true,expires:'2099-12-31T23:59:00+05:30',video:'',poster:'',transcript:''};
}

const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!key){console.error('Missing Supabase env in .env.local');process.exit(1);}
const db=createClient(url,key,{auth:{persistSession:false}});

async function update(fn){
 for(let attempt=0;attempt<8;attempt++){
  const {data,error}=await db.from('partner_workspace').select('state,lock_version').eq('id','main').single();
  if(error)throw error;
  const s=structuredClone(data.state);
  fn(s);
  validatePublication(s.draft);
  s.published=structuredClone(s.draft);
  s.revision++;
  s.audit.unshift({at:new Date().toISOString(),by:'push-demo-artist',action:action==='remove'?'demo-artist-remove':'demo-artist-push'});
  s.audit=s.audit.slice(0,1000);
  const {data:updated,error:updateError}=await db.from('partner_workspace').update({state:s,lock_version:data.lock_version+1}).eq('id','main').eq('lock_version',data.lock_version).select('id');
  if(updateError)throw updateError;
  if(updated?.length)return s;
 }
 throw new Error('Concurrent update. Retry.');
}

if(action==='push'){
 const out=await update(s=>{
  s.draft.artists=s.draft.artists.filter(a=>a.id!==DEMO_ID);
  s.draft.artists.unshift(demoArtist());
 });
 const a=out.published.artists.find(x=>x.id===DEMO_ID);
 console.log('Published demo artist:',a.name,'→','/artists/'+a.slug,'(revision',out.revision+')');
}else if(action==='remove'){
 await update(s=>{
  s.draft.artists=s.draft.artists.filter(a=>a.id!==DEMO_ID);
 });
 console.log('Removed demo artist and published (revision updated).');
}else{
 console.error('Usage: push|remove');
 process.exit(1);
}
