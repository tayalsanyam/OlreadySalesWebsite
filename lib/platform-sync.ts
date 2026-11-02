import 'server-only';
import {mutate,readState,invalidateStateCache} from './store';
import {applyPlatformPrices,parsePlatformPacks,pricesDiffer} from './platform-prices';

/** Pulls plan prices from Marketplace Ops. Does nothing unless PLATFORM_URL is set. */
export async function syncPlatformPrices():Promise<{status:'off'|'unchanged'|'updated';changed?:string[]}>{
 const base=process.env.PLATFORM_URL;if(!base)return {status:'off'};
 const res=await fetch(new URL('/api/public/packs',base),{cache:'no-store',signal:AbortSignal.timeout(5000)});
 if(!res.ok)throw new Error(`Platform price list returned ${res.status}`);
 const prices=parsePlatformPacks(await res.json());
 if(!pricesDiffer(await readState(),prices))return {status:'unchanged'};
 const changed=await mutate(s=>applyPlatformPrices(s,prices));invalidateStateCache();
 return {status:changed.length?'updated':'unchanged',changed};
}
