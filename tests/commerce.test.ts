import {test} from 'node:test';import assert from 'node:assert/strict';import {quote,renderTemplate,planAllowsOnlinePayment} from '../lib/commerce';import {seed} from '../lib/seed';import {siteSchema} from '../lib/schema';
const plan={...seed.plans[0],approved:true,pricePaise:100000,taxPercent:18};
const coupon={id:'test',code:'TEST',kind:'percent' as const,value:10,maxDiscountPaise:null,minimumPaise:0,plans:['pro'],starts:'2020-01-01',ends:'2099-01-01',limit:10,perCustomer:1,enabled:true};
test('seed obeys content schema',()=>assert.ok(siteSchema.safeParse(seed).success));
test('Privy is invite-only for online payment',()=>{assert.equal(planAllowsOnlinePayment('pro'),true);assert.equal(planAllowsOnlinePayment('phoenix'),true);assert.equal(planAllowsOnlinePayment('privy'),false);});
test('unapproved prices cannot produce a payable total',()=>assert.equal(quote({...plan,approved:false}).total,null));
test('GST is extracted from the discounted inclusive price',()=>assert.deepEqual(quote(plan,coupon),{subtotal:100000,discount:10000,tax:13729,total:90000}));
test('fixed discounts cannot exceed subtotal',()=>assert.equal(quote(plan,{...coupon,kind:'fixed',value:999999}).total,0));
test('percentage discounts respect maximum cap',()=>assert.equal(quote(plan,{...coupon,maxDiscountPaise:5000}).discount,5000));
test('expired and invalid dates reject',()=>{assert.throws(()=>quote(plan,{...coupon,ends:'2020-01-01'}));assert.throws(()=>quote(plan,{...coupon,starts:''}));});
test('plan restrictions reject mismatched coupon',()=>assert.throws(()=>quote(plan,{...coupon,plans:['privy']})));
test('minimum spend is enforced',()=>assert.throws(()=>quote(plan,{...coupon,minimumPaise:200000})));
test('missing template fields reject',()=>assert.throws(()=>renderTemplate('Hi {{name}}',{})));
test('template renders text with literal dollar signs',()=>assert.equal(renderTemplate('{{name}}',{name:'$100'}),'$100'));
test('untrusted schemes rejected',()=>assert.equal(siteSchema.safeParse({...seed,settings:{...seed.settings,heroImage:'javascript:alert(1)'}}).success,false));
test('merchant redirect restricted to official hostname',()=>assert.equal(siteSchema.safeParse({...seed,settings:{...seed.settings,merchantUrl:'https://example.com'}}).success,false));
import {initialState} from '../lib/seed';import {enqueueRecovery,eligible,validatePublication} from '../lib/workflows';import {hash} from '../lib/secrets';
function recoveryState(){const s=initialState();s.published.recovery.enabled=true;s.subscribers.push({id:'person',email:'qa@example.invalid',status:'confirmed',tokenHash:hash('token'),created_at:new Date().toISOString()});s.carts.push({id:'cart',tokenHash:'private',planId:'pro',planVersion:1,email:'qa@example.invalid',name:'QA',phone:'',marketing:true,terms:false,coupon:'',subtotal:100000,discount:0,tax:0,total:100000,status:'open',created_at:new Date(Date.now()-30*3600000).toISOString(),updated_at:new Date(Date.now()-30*3600000).toISOString()});return s;}
test('recovery scheduling is idempotent',()=>{const s=recoveryState();assert.equal(enqueueRecovery(s),2);assert.equal(enqueueRecovery(s),0);});
test('unsubscribed or unconfirmed recipients cannot be queued',()=>{const s=recoveryState();s.subscribers[0].status='pending';assert.equal(enqueueRecovery(s),0);s.subscribers[0].status='unsubscribed';assert.equal(enqueueRecovery(s),0);});
test('late paid and pending payment states stop queued recovery',()=>{const s=recoveryState();enqueueRecovery(s);assert.equal(eligible(s,s.jobs[0]),true);s.carts[0].status='paid';assert.equal(eligible(s,s.jobs[0]),false);s.carts[0].status='pending';assert.equal(eligible(s,s.jobs[0]),false);});
test('late opt-out suppresses recovery',()=>{const s=recoveryState();enqueueRecovery(s);s.carts[0].marketing=false;assert.equal(eligible(s,s.jobs[0]),false);});
test('invalid approval date is rejected',()=>{const s=structuredClone(seed);s.metrics[0]={...s.metrics[0],approved:true,evidence:'source',period:'2026',expires:'not-a-date'};assert.throws(()=>validatePublication(s));});
test('published profile needs consent bio and portrait',()=>{const s=structuredClone(seed);s.artists.push({id:'a',slug:'',name:'Artist',city:'Delhi',bio:'',image:'/hero.png',profileUrl:'',amountPaise:null,definition:'',period:'',evidence:'',consent:false,approved:true,featuredTopGrossing:false,expires:'',video:'',poster:'',transcript:'',gallery:[]} as any);assert.throws(()=>validatePublication(s));});
test('featured artist needs internal verification fields',()=>{const s=structuredClone(seed);s.artists.push({id:'a',slug:'',name:'Artist',city:'Delhi',bio:'Bio',image:'/hero.png',profileUrl:'',amountPaise:100000,definition:'Gross value',period:'2026',evidence:'',consent:true,approved:true,featuredTopGrossing:true,expires:'2099-01-01',video:'',poster:'',transcript:'',gallery:[]} as any);assert.throws(()=>validatePublication(s));});
test('replaced confirmation token invalidates earlier queued mail',()=>{const s=recoveryState();s.subscribers[0].status='pending';const j={id:'j',kind:'list-confirmation',status:'queued',payload:{subscriberId:'person',token:'old-token'},created_at:new Date().toISOString()};assert.equal(eligible(s,j),false);});

test('published brochure totals already include 18 percent GST',()=>{for(const p of seed.plans){const q=quote(p);assert.equal(q.total,p.pricePaise);assert.equal(q.tax,Math.round(p.pricePaise!*18/118));assert.equal(p.taxPercent,18);}});
test('full discount has zero included GST',()=>assert.equal(quote(plan,{...coupon,kind:'fixed',value:100000}).tax,0));
