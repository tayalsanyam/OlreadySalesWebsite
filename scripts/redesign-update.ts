import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {salesCopy} from '../lib/sales-copy';
import {initialState} from '../lib/seed';
async function main(){await mkdir('.data',{recursive:true});let state;
try{const raw=await readFile('.data/state.json','utf8');state=JSON.parse(raw);await writeFile('.data/before-redesign-'+Date.now()+'.json',raw);}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;state=initialState();}
for(const key of ['draft','published']){state[key].copy={...salesCopy,...state[key].copy};const home=state[key].pages.find((p:any)=>p.slug==='/');if(home?.primaryHref==='/top-grossing-artists'&&home.primaryLabel==='Explore artist results'){home.primaryHref='/#find-your-plan';home.primaryLabel='Find my plan';}}
await writeFile('.data/state.json',JSON.stringify(state,null,2));console.log('Redesign copy installed; existing custom content and records preserved.');}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
