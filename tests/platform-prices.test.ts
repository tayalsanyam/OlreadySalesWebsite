import {test} from 'node:test';import assert from 'node:assert/strict';
import {initialState} from '../lib/seed';
import {applyPlatformPrices,keepSyncedPrices,parsePlatformPacks,pricesDiffer} from '../lib/platform-prices';
import {quote} from '../lib/commerce';

const list={currency:'INR',gst_included:true,packs:[{code:'pro',kind:'plan',price_inr:19999},{code:'phoenix',kind:'plan',price_inr:35000},{code:'privy',kind:'plan',price_inr:50000},{code:'topup-10',kind:'topup',price_inr:4999}]};

test('reads only the three plans from the platform list, in paise',()=>assert.deepEqual(parsePlatformPacks(list),{pro:1999900,phoenix:3500000,privy:5000000}));
test('rejects a malformed or zero-priced list rather than blanking prices',()=>{assert.throws(()=>parsePlatformPacks({}));assert.throws(()=>parsePlatformPacks({packs:[{code:'pro',kind:'plan',price_inr:0}]}));});
test('a changed price reaches draft and published, bumps the plan version and is audited',()=>{
 const s=initialState();for(const site of [s.draft,s.published])for(const p of site.plans){p.pricePaise=({pro:1899900,phoenix:3500000,privy:5000000} as Record<string,number>)[p.id];p.approved=true;p.taxPercent=18;}
 const before=s.published.plans.find(p=>p.id==='pro')!.version;const prices=parsePlatformPacks(list);
 assert.equal(pricesDiffer(s,prices),true);
 const changed=applyPlatformPrices(s,prices,'2026-11-03T00:00:00Z');
 assert.equal(changed.length,1);assert.match(changed[0],/Pro: ₹18,999 → ₹19,999/);
 const pro=s.published.plans.find(p=>p.id==='pro')!;assert.equal(pro.pricePaise,1999900);assert.equal(pro.version,before+1);
 assert.equal(s.draft.plans.find(p=>p.id==='pro')!.pricePaise,1999900);
 assert.equal(quote(pro).total,1999900);
 assert.equal(s.audit.at(-1)!.by,'platform-sync');
 assert.equal(pricesDiffer(s,prices),false);assert.deepEqual(applyPlatformPrices(s,prices),[]);
});
test('an unapproved plan gets the price but stays unpublished',()=>{const s=initialState();const p=s.published.plans.find(p=>p.id==='privy')!;p.approved=false;applyPlatformPrices(s,{privy:5000000});assert.equal(p.approved,false);assert.equal(quote(p).total,null);});
test('an admin save keeps the synced price instead of a stale edit',()=>{const s=initialState();applyPlatformPrices(s,{pro:1999900});const edited=structuredClone(s.draft);edited.plans.find(p=>p.id==='pro')!.pricePaise=100;keepSyncedPrices(edited,s.draft);assert.equal(edited.plans.find(p=>p.id==='pro')!.pricePaise,1999900);});
