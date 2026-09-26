import {upgradeContactFeedback,upgradeV7} from './refinement-copy';
import {upgradeSales,upgradeCheckoutOnline} from './sales-release';
import {upgradeLegalV31} from './legal-release';
import {upgradeSEO,ensureArtistSlugs} from './seo';
import {upgradeArtistCatalog,publishedArtist} from './artist-catalog';
import {upgradePromotions} from './promotions';
import 'server-only';
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import path from 'node:path';
import {createClient} from '@supabase/supabase-js';
import {State,Site} from './schema';
import {initialState,seed} from './seed';
export const demo=()=>process.env.LOCAL_DEMO==='true'&&process.env.NODE_ENV==='development'&&!process.env.VERCEL;
export const configured=()=>!!process.env.NEXT_PUBLIC_SUPABASE_URL&&!!process.env.SUPABASE_SERVICE_ROLE_KEY;
export function service(){if(!configured())throw new Error('Supabase connection is not configured');return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});}
function ensureBrochureSettings(site:Site){if(site.settings.brochureUrl===undefined)site.settings.brochureUrl='';}
function ensurePaymentSettings(site:Site){
 const st=site.settings as Site['settings']&Record<string,unknown>;
 if(st.paymentGateway!=='razorpay'&&st.paymentGateway!=='payu')st.paymentGateway='razorpay';
}
function ensureOrderGateways(s:State){
 for(const o of s.orders||[]){
  const g=(o as {gateway?:string}).gateway;
  if(g!=='razorpay'&&g!=='payu')(o as {gateway:'razorpay'|'payu'}).gateway='razorpay';
  if(o.customer.gstin===undefined)o.customer.gstin='';
 }
}
function ensureCartGstin(s:State){
 for(const c of s.carts)if(c.gstin===undefined)c.gstin='';
}
function ensureStaffAlertSettings(site:Site){
 const st=site.settings as Site['settings']&Record<string,unknown>;
 if(st.staffAlertEmails===undefined)st.staffAlertEmails='sanyam@olready.in, Kanika@olready.in';
 if(st.staffNotifyContact===undefined)st.staffNotifyContact=true;
 if(st.staffNotifyPurchase===undefined)st.staffNotifyPurchase=true;
 if(st.staffNotifyAssistant===undefined)st.staffNotifyAssistant=true;
 if(site.assistant.requireLeadCapture===undefined)site.assistant.requireLeadCapture=true;
 if(!site.assistant.subtitle?.trim())site.assistant.subtitle='Plans, pricing & enquiries';
}
function normalize(s:State):State{upgradeSales(s.draft);upgradeSales(s.published);upgradePromotions(s.draft);upgradePromotions(s.published);upgradeCheckoutOnline(s.draft);upgradeCheckoutOnline(s.published);upgradeLegalV31(s.draft);upgradeLegalV31(s.published);upgradeV7(s.draft);upgradeV7(s.published);upgradeContactFeedback(s.draft);upgradeContactFeedback(s.published);ensureBrochureSettings(s.draft);ensureBrochureSettings(s.published);ensurePaymentSettings(s.draft);ensurePaymentSettings(s.published);ensureStaffAlertSettings(s.draft);ensureStaffAlertSettings(s.published);ensureOrderGateways(s);ensureCartGstin(s);upgradeSEO(s.draft);upgradeSEO(s.published);upgradeArtistCatalog(s.draft);upgradeArtistCatalog(s.published);ensureArtistSlugs(s.draft);ensureArtistSlugs(s.published);s.draft.copy={...seed.copy,...s.draft.copy};s.published.copy={...seed.copy,...s.published.copy};return s;}
const file=path.join(process.cwd(),'.data','state.json');
let queue:Promise<unknown>=Promise.resolve();
/** Coalesce hot read-only paths (checkout poll, cart) without stale writes. */
const READ_CACHE_MS=4000;
let stateCache:{version:number;state:State;at:number}|null=null;
export function invalidateStateCache(){stateCache=null;}
export async function readState():Promise<State>{if(demo()){try{return normalize(JSON.parse(await readFile(file,'utf8')));}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;return initialState();}}const {data,error}=await service().from('partner_workspace').select('state,lock_version').eq('id','main').single();if(error)throw new Error('Database is unavailable or schema has not been installed');const version=Number(data.lock_version)||0;const now=Date.now();if(stateCache&&stateCache.version===version&&now-stateCache.at<READ_CACHE_MS)return stateCache.state;const s=normalize(data.state as State);stateCache={version,state:s,at:now};return s;}
export async function mutate<T>(fn:(s:State)=>T):Promise<T>{const run=async()=>{if(demo()){const s=await readState();const result=fn(s);await mkdir(path.dirname(file),{recursive:true});await writeFile(file+'.tmp',JSON.stringify(s,null,2));await rename(file+'.tmp',file);invalidateStateCache();return result;}
// Optimistic compare-and-swap prevents writes from separate server instances being lost.
for(let attempt=0;attempt<8;attempt++){invalidateStateCache();const db=service();const {data,error}=await db.from('partner_workspace').select('state,lock_version').eq('id','main').single();if(error)throw error;const s=normalize(data.state as State);const result=fn(s);const {data:updated,error:updateError}=await db.from('partner_workspace').update({state:s,lock_version:data.lock_version+1}).eq('id','main').eq('lock_version',data.lock_version).select('id');if(updateError)throw updateError;if(updated?.length){invalidateStateCache();return result;}}throw new Error('Concurrent update. Please retry.');};const result=queue.then(run,run);queue=result.catch(()=>{});return result;}
export function approvedMetric(m:Site['metrics'][number]){return m.approved&&!!m.evidence&&!!m.period&&!!m.expires&&new Date(m.expires).getTime()>Date.now();}
export function publicSite(s:Site):Site{const copy=structuredClone(s);copy.metrics=copy.metrics.filter(approvedMetric).map(m=>({...m,evidence:''}));copy.artists=copy.artists.filter(publishedArtist).map(a=>({...a,evidence:'',amountPaise:null,definition:'',period:''}));copy.directory=[];copy.testimonials=(copy.testimonials||[]).filter(t=>t.enabled&&t.video);copy.coupons=[];copy.templates=[];copy.assistant.guidance='';return copy;}
export async function content(){const state=await readState();const site=publicSite({...state.published,copy:{...seed.copy,...state.published.copy}});if(demo())site.metrics=state.published.metrics.map(m=>({...m,evidence:''}));return site;}
