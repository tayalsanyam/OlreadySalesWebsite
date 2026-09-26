import type {State,Site} from './schema';
import {hash} from './secrets';
import {renderTemplate} from './commerce';
export type Job=State['jobs'][number];
export function enqueueRecovery(s:State,now=Date.now()){
 if(!s.published.recovery.enabled)return 0;let count=0;
 const config=s.published.recovery;
 for(const cart of s.carts){const person=s.subscribers.find(p=>p.email===cart.email.toLowerCase());if(cart.status!=='open'||!cart.marketing||person?.status!=='confirmed')continue;
 for(const [step,hours] of [[1,config.firstHours],[2,config.secondHours]]){const key=`recovery:${cart.id}:${step}`;
 if(now-Date.parse(cart.updated_at)<Math.max(hours*3600000,config.abandonMinutes*60000)||s.jobs.some(j=>j.id===key))continue;
 s.jobs.push({id:key,kind:'recovery',status:'queued',payload:{cartId:cart.id,subscriberId:person.id,email:cart.email},created_at:new Date(now).toISOString()});count++;}}
 return count;
}
export function eligible(s:State,j:Job){if(j.kind==='staff-alert')return Boolean(j.rendered?.subject&&j.rendered?.body&&j.payload.to?.trim());if(j.kind==='purchase'){const o=s.orders?.find(o=>o.id===j.payload.orderId);return !!o&&o.mode==='live'&&['paid','partially_refunded'].includes(o.status)&&o.customer.email===j.payload.email;}const person=s.subscribers.find(p=>p.id===j.payload.subscriberId);
 if(j.kind==='list-confirmation')return person?.status==='pending'&&person.tokenHash===hash(j.payload.token||'')&&Date.parse(person.created_at)>Date.now()-86400000;
 if(!person||person.status!=='confirmed')return false;
 if(j.kind==='campaign')return true;
 if(j.kind==='recovery'){const cart=s.carts.find(c=>c.id===j.payload.cartId);return s.published.recovery.enabled&&cart?.status==='open'&&cart.marketing&&cart.email===person.email&&Date.parse(cart.updated_at)<Date.now()-s.published.recovery.abandonMinutes*60000;}
 return false;
}
export function jobTemplate(s:State,j:Job){const id=j.kind==='list-confirmation'?'confirmation':j.kind==='recovery'?'recovery':j.payload.templateId;return s.published.templates.find(t=>t.id===id&&t.enabled);}
export function validatePublication(s:Site){
 for(const m of s.metrics)if(m.approved&&(!m.period||!m.evidence||!Number.isFinite(Date.parse(m.expires))||Date.parse(m.expires)<=Date.now()))throw new Error('Approved statistics need evidence, period and a valid future review date');
 for(const a of s.artists){if(!a.approved)continue;if(!a.consent||!a.name.trim()||!a.city.trim()||!a.bio?.trim()||!a.image)throw new Error('Published artist profiles need permission, name, city, bio and a portrait.');if(a.featuredTopGrossing&&(!a.evidence||!a.period||!Number.isFinite(Date.parse(a.expires))||Date.parse(a.expires)<=Date.now()||a.amountPaise===null||!a.definition))throw new Error('Top Grossing artists need internal verification fields (amount, definition, evidence, period, review date).');}
 for(const t of s.testimonials||[])if(t.enabled&&!t.video)throw new Error('Enabled testimonials need a video URL.');
 for(const p of s.plans)if(p.approved&&(p.pricePaise===null||!p.term||!p.features.length))throw new Error('Approved plans need a price, term and inclusions');
 const ids=s.plans.map(p=>p.id);if(ids.length!==3||new Set(ids).size!==3)throw new Error('Keep exactly Pro, Phoenix and Privy');
 const codes=new Set<string>();for(const c of s.coupons){if(codes.has(c.code.toLowerCase()))throw new Error('Coupon codes must be unique');codes.add(c.code.toLowerCase());if(c.enabled&&(!Number.isFinite(Date.parse(c.starts))||!Number.isFinite(Date.parse(c.ends))||Date.parse(c.starts)>=Date.parse(c.ends)||c.kind==='percent'&&c.value>100))throw new Error('Enabled coupons need a valid date range and percentage');}
 const values={name:'Artist',plan:'Pro',order_id:'Preview',merchant_url:'https://merchant.olready.in/makeup/login',support_url:'https://wa.me/918699889901',confirm_url:'https://example.invalid',cart_url:'https://example.invalid',unsubscribe_url:'https://example.invalid',plans_url:'https://example.invalid'};
 for(const t of s.templates){renderTemplate(t.subject,values);renderTemplate(t.body,values);if(t.enabled&&['recovery','monthly-offer'].includes(t.id)&&!t.body.includes('{{unsubscribe_url}}'))throw new Error('Marketing templates require {{unsubscribe_url}}');}
}
