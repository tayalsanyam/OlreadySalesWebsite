import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {initialState,seed} from '../lib/seed';
import {enrichContent} from '../lib/content-release';
import {siteSchema,State} from '../lib/schema';
async function main(){
siteSchema.parse(seed);
const arg=process.argv[2];
if(arg==='--sql') {
 const patch=JSON.stringify({pages:seed.pages,plans:seed.plans,faqs:seed.faqs,copy:seed.copy,settings:seed.settings}).replaceAll("'","''");
 const sql=`-- Content release from owner-supplied September 15 plan brochure.\n-- Run only once against the original revision 1 workspace. Other states are preserved.\nbegin;\nupdate public.partner_workspace set state=jsonb_set(jsonb_set(jsonb_set(state,'{draft}',(state->'draft') || '${patch}'::jsonb),'{published}',(state->'published') || '${patch}'::jsonb),'{revision}','2'::jsonb), lock_version=lock_version+1, updated_at=now() where id='main' and lock_version=1 and state->>'revision'='1';\ncommit;\n`;
 await writeFile('OLREADY_Content_Update.sql',sql);console.log('Content SQL generated.');
} else {
 await mkdir('.data',{recursive:true});let state:State;
 try{const raw=await readFile('.data/state.json','utf8');state=JSON.parse(raw);await writeFile('.data/before-content-update-'+Date.now()+'.json',raw);}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;state=initialState();}
 if(!state.audit.some(a=>a.action==='September plan content release')){
 state.history.unshift({revision:state.revision,at:new Date().toISOString(),by:'content-release',content:structuredClone(state.published)});
 state.draft.copy={...seed.copy,...state.draft.copy};state.published.copy={...seed.copy,...state.published.copy};enrichContent(state.draft);enrichContent(state.published);state.revision++;
 state.audit.unshift({at:new Date().toISOString(),by:'local-owner',action:'September plan content release'});
 await writeFile('.data/state.json',JSON.stringify(state,null,2));console.log('Local content updated. Previous content backed up; customer records preserved.');
 }else console.log('This content release is already installed.');
}

}
main().catch(e=>{console.error(e);process.exitCode=1;});
