/**
 * Push or remove 15 QA MUAs (10 featured, 7 cities).
 * Usage: node --env-file=.env.local scripts/push-test-muas.mjs push|remove [--local]
 */
import {createClient} from '@supabase/supabase-js';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {TEST_MUA_IDS,testMuaArtists} from './test-mua-data.mjs';

const action=process.argv[2]||'push';
const local=process.argv.includes('--local');

function validatePublication(s){
 for(const m of s.metrics)if(m.approved&&(!m.period||!m.evidence||!Number.isFinite(Date.parse(m.expires))||Date.parse(m.expires)<=Date.now()))throw new Error('Approved statistics need evidence, period and a valid future review date');
 for(const a of s.artists){
  if(!a.approved)continue;
  if(!a.consent||!a.name.trim()||!a.city.trim()||!a.bio?.trim()||!a.image)throw new Error('Published artist profiles need permission, name, city, bio and a portrait.');
  if(a.featuredTopGrossing&&(!a.evidence||!a.period||!Number.isFinite(Date.parse(a.expires))||Date.parse(a.expires)<=Date.now()||a.amountPaise===null||!a.definition))throw new Error('Top Grossing artists need internal verification fields.');
 }
 for(const p of s.plans)if(p.approved&&(p.pricePaise===null||!p.term||!p.features.length))throw new Error('Approved plans need a price, term and inclusions');
}

function applyCatalog(site){
 const ids=new Set(TEST_MUA_IDS);
 site.artists=(site.artists||[]).filter(a=>!ids.has(a.id));
 if(action==='push'){
  const batch=testMuaArtists();
  site.artists=[...batch,...site.artists];
 }
 return site;
}

async function pushLocal(){
 const file=path.join(process.cwd(),'.data','state.json');
 const state=JSON.parse(await readFile(file,'utf8'));
 applyCatalog(state.draft);
 applyCatalog(state.published);
 validatePublication(state.draft);
 validatePublication(state.published);
 state.revision=(state.revision||0)+1;
 await writeFile(file,JSON.stringify(state,null,2));
 const featured=testMuaArtists().filter(a=>a.featuredTopGrossing).length;
 console.log(`Local state: ${action==='push'?`15 test MUAs (${featured} featured)`:'removed test MUAs'} · revision ${state.revision}`);
}

async function pushSupabase(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw new Error('Missing Supabase env in .env.local');
 const db=createClient(url,key,{auth:{persistSession:false}});
 for(let attempt=0;attempt<8;attempt++){
  const {data,error}=await db.from('partner_workspace').select('state,lock_version').eq('id','main').single();
  if(error)throw error;
  const s=structuredClone(data.state);
  applyCatalog(s.draft);
  validatePublication(s.draft);
  s.published=structuredClone(s.draft);
  s.revision++;
  s.audit.unshift({at:new Date().toISOString(),by:'push-test-muas',action:action==='remove'?'test-mua-remove':'test-mua-push'});
  s.audit=s.audit.slice(0,1000);
  const {data:updated,error:updateError}=await db.from('partner_workspace').update({state:s,lock_version:data.lock_version+1}).eq('id','main').eq('lock_version',data.lock_version).select('id');
  if(updateError)throw updateError;
  if(updated?.length){
   const n=s.published.artists.filter(a=>TEST_MUA_IDS.includes(a.id)).length;
   const featured=s.published.artists.filter(a=>TEST_MUA_IDS.includes(a.id)&&a.featuredTopGrossing).length;
   const cities=[...new Set(s.published.artists.filter(a=>TEST_MUA_IDS.includes(a.id)).map(a=>a.city))];
   console.log(action==='push'?`Published ${n} test MUAs (${featured} featured) across ${cities.length} cities: ${cities.join(', ')}`:`Removed test MUAs · revision ${s.revision}`);
   console.log('Homepage strip & /top-grossing-artists show featured only. Sample: /artists/ananya-kapoor-mumbai-mua');
   return;
  }
 }
 throw new Error('Concurrent update. Retry.');
}

if(!['push','remove'].includes(action)){console.error('Usage: push|remove [--local]');process.exit(1);}
try{
 if(local)await pushLocal();
 else await pushSupabase();
}catch(e){console.error(e.message);process.exit(1);}
