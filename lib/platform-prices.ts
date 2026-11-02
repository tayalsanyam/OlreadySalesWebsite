// Plan prices come from OLREADY Marketplace Ops (the platform), so the price shown and
// charged here always matches the price there. This file is pure so it can be tested.
import type {State} from './schema';

export const SYNCED_PLANS=['pro','phoenix','privy'] as const;
type Pack={code:string;kind:string;price_inr:number};

/** Reads the platform's public price list. Returns plan id → GST-inclusive price in paise. */
export function parsePlatformPacks(body:unknown):Record<string,number>{
 const packs=(body as {packs?:Pack[]})?.packs;if(!Array.isArray(packs))throw new Error('Platform price list is malformed');
 const out:Record<string,number>={};
 for(const p of packs){if(p?.kind!=='plan'||!(SYNCED_PLANS as readonly string[]).includes(p.code))continue;if(!Number.isInteger(p.price_inr)||p.price_inr<=0)throw new Error(`Platform price for ${p.code} is invalid`);out[p.code]=p.price_inr*100;}
 return out;
}

/** True when any plan here differs from the platform price. */
export function pricesDiffer(s:State,prices:Record<string,number>){return s.published.plans.some(p=>prices[p.id]!==undefined&&p.pricePaise!==prices[p.id]);}

/**
 * Copies platform prices into the draft and the published site. Published plans get a new version,
 * so carts started at the old price are re-quoted at checkout. Approval stays with the admin:
 * an unapproved plan gets the price but stays hidden until an admin publishes it.
 */
export function applyPlatformPrices(s:State,prices:Record<string,number>,at=new Date().toISOString()){
 const changed:string[]=[];
 for(const site of [s.draft,s.published])for(const p of site.plans){const next=prices[p.id];if(next===undefined||p.pricePaise===next)continue;if(site===s.published){changed.push(`${p.name}: ${p.pricePaise===null?'no price':'₹'+(p.pricePaise/100).toLocaleString('en-IN')} → ₹${(next/100).toLocaleString('en-IN')}`);p.version+=1;}p.pricePaise=next;}
 if(changed.length)s.audit.push({at,by:'platform-sync',action:`Plan prices synced from Marketplace Ops. ${changed.join('; ')}`});
 return changed;
}

/** While prices are managed in Ops, an admin save or restore keeps the synced prices instead of the edited ones. */
export function keepSyncedPrices(target:State['draft'],source:State['draft']){for(const p of target.plans){const s=source.plans.find(x=>x.id===p.id);if(s)p.pricePaise=s.pricePaise;}return target;}
export const pricesManagedByPlatform=()=>Boolean(process.env.PLATFORM_URL);
