import {readFile} from 'node:fs/promises';
import {createClient} from '@supabase/supabase-js';
import {upgradeV7} from '../lib/refinement-copy';
import {upgradeSales} from '../lib/sales-release';
import {upgradeSEO,ensureArtistSlugs} from '../lib/seo';
import {seed} from '../lib/seed';
import type {State} from '../lib/schema';

function normalize(s:State):State{
 upgradeSales(s.draft);upgradeSales(s.published);upgradeV7(s.draft);upgradeV7(s.published);upgradeSEO(s.draft);upgradeSEO(s.published);ensureArtistSlugs(s.draft);ensureArtistSlugs(s.published);
 s.draft.copy={...seed.copy,...s.draft.copy};s.published.copy={...seed.copy,...s.published.copy};return s;
}

async function main(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key){console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');process.exit(1);}
 const local=normalize(JSON.parse(await readFile('.data/state.json','utf8')));
 const db=createClient(url,key,{auth:{persistSession:false}});
 for(let attempt=0;attempt<10;attempt++){
  const {data,error}=await db.from('partner_workspace').select('lock_version,state').eq('id','main').single();
  if(error){console.error(error.message);process.exit(1);}
  const merged={...local,revision:Math.max(local.revision||0,data.state.revision||0)+1};
  const {data:updated,error:updateError}=await db.from('partner_workspace').update({state:merged,lock_version:data.lock_version+1}).eq('id','main').eq('lock_version',data.lock_version).select('id');
  if(updateError){console.error(updateError.message);process.exit(1);}
  if(updated?.length){console.log('Synced normalized workspace to Supabase. revision=',merged.revision);return;}
 }
 console.error('Concurrent update — retry.');process.exit(1);
}
main().catch(e=>{console.error(e);process.exit(1);});
