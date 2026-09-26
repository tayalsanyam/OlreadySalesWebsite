import {capturedTotal,refundedTotal} from './order-report';
import {createHmac,timingSafeEqual} from 'node:crypto';
import type {State,Plan,Coupon,Cart} from './schema';
import {staffNotifyPurchase} from './staff-notify';
import {quote,planAllowsOnlinePayment} from './commerce';
export type OrderStatus='creating'|'pending'|'failed'|'paid'|'partially_refunded'|'refunded'|'needs_review';
export type PaymentAttempt={id:string;status:string;amount:number;currency:string;method:string;bank:string;wallet:string;createdAt:string;verifiedAt:string;capturedAt?:string;error:string};
export type PaymentGatewayId='razorpay'|'payu';
export type Order={id:string;cartId:string;createdAt:string;updatedAt:string;paidAt?:string;status:OrderStatus;gateway:PaymentGatewayId;mode:'test'|'live';keyId:string;providerOrderId:string;customer:{name:string;email:string;phone:string;business:string;gstin:string};plan:Plan;coupon:Coupon|null;subtotal:number;discount:number;tax:number;total:number;currency:'INR';attempts:PaymentAttempt[];refunds:{id:string;paymentId:string;amount:number;status:string;createdAt:string}[];events:{id:string;at:string;message:string}[];reviewReason:string;invoice:{status:'not_configured'|'pending'|'issued';number:string;url:string};followUp:{status:'new'|'contacted'|'resolved';note:string}};
export function validSignature(raw:string,signature:string,secret:string){if(!/^[a-f0-9]{64}$/i.test(signature)||!secret)return false;return timingSafeEqual(Buffer.from(signature,'hex'),createHmac('sha256',secret).update(raw).digest());}
export function appendEvent(o:Order,id:string,message:string,at=new Date().toISOString()){if(o.events.some(e=>e.id===id))return;o.events.push({id,message,at});o.updatedAt=at;}
export function reserveOrder(s:State,c:Cart,ctx:{gateway:PaymentGatewayId;keyId:string;mode:'test'|'live'},now=new Date().toISOString()):{order:Order;created:boolean}{
 const {gateway,keyId,mode}=ctx;
 s.orders??=[];const existing=s.orders.find(o=>o.cartId===c.id);if(existing)return {order:existing,created:false};
 if(c.status!=='open'||!c.terms||!c.name.trim()||!/^\S+@\S+\.\S+$/.test(c.email)||!/^\+?[\d\s()-]{8,20}$/.test(c.phone))throw new Error('Save your name, valid email, phone and acceptance of terms before paying.');
 if(!s.published.settings.policiesApproved)throw new Error('Online checkout is not yet available. Please contact OLREADY.');
 const plan=s.published.plans.find(p=>p.id===c.planId);if(!plan||!planAllowsOnlinePayment(plan.id))throw new Error('This plan requires a conversation with OLREADY.');
 const coupon=c.coupon?s.published.coupons.find(x=>x.code.toLowerCase()===c.coupon.toLowerCase()):undefined;if(c.coupon&&!coupon)throw new Error('Offer no longer available. Save your selection again.');
 const totals=quote(plan,coupon);if(totals.total===null||totals.total<100)throw new Error('This plan is not available for online payment.');
 if(c.planVersion!==plan.version||c.total!==totals.total||c.discount!==totals.discount||c.tax!==totals.tax)throw new Error('Your quote has changed. Save your selection again to review the updated total.');
 if(coupon){const reserved=s.orders.filter(o=>o.coupon?.id===coupon.id);const legacy=s.carts.filter(x=>x.status==='paid'&&x.coupon.toLowerCase()===coupon.code.toLowerCase()&&!s.orders!.some(o=>o.cartId===x.id));if(reserved.length+legacy.length>=coupon.limit||reserved.filter(o=>o.customer.email===c.email.toLowerCase()).length+legacy.filter(x=>x.email.toLowerCase()===c.email.toLowerCase()).length>=coupon.perCustomer)throw new Error('This offer has reached its redemption limit.');}
 const o:Order={id:crypto.randomUUID(),cartId:c.id,createdAt:now,updatedAt:now,status:'creating',gateway,mode,keyId,providerOrderId:'',customer:{name:c.name.trim(),email:c.email.toLowerCase(),phone:c.phone,business:c.business||'',gstin:c.gstin||''},plan:structuredClone(plan),coupon:coupon?structuredClone(coupon):null,subtotal:totals.subtotal!,discount:totals.discount,tax:totals.tax,total:totals.total,currency:'INR',attempts:[],refunds:[],events:[],reviewReason:'',invoice:{status:'not_configured',number:'',url:''},followUp:{status:'new',note:''}};
 appendEvent(o,'created','Order reserved. Awaiting payment.',now);s.orders.push(o);c.status='pending';c.updated_at=now;return {order:o,created:true};
}
export function bindProviderOrder(o:Order,p:{id:string;amount:number;currency:string;receipt:string}){if(o.gateway!=='razorpay')throw new Error('This order is not a Razorpay checkout.');if(p.receipt!==o.id||p.amount!==o.total||p.currency!==o.currency||!/^order_[A-Za-z0-9]+$/.test(p.id))throw new Error('Provider order did not match the saved purchase.');if(o.providerOrderId&&o.providerOrderId!==p.id)throw new Error('Order already linked to a different provider order.');o.providerOrderId=p.id;if(o.status==='creating'||o.status==='needs_review'&&o.reviewReason==='creation_unconfirmed'){o.status='pending';o.reviewReason='';}appendEvent(o,'provider-linked','Razorpay order linked.');}
export function bindPayUCheckout(o:Order){if(o.gateway!=='payu')throw new Error('This order is not a PayU checkout.');if(o.providerOrderId&&o.providerOrderId!==o.id)throw new Error('Order already linked to a different PayU transaction.');o.providerOrderId=o.id;if(o.status==='creating'||(o.status==='needs_review'&&o.reviewReason==='creation_unconfirmed')){o.status='pending';o.reviewReason='';}appendEvent(o,'provider-linked','PayU checkout prepared.');}
export {capturedTotal,refundedTotal} from './order-report';
function derive(s:State,o:Order){const captured=capturedTotal(o),refunded=refundedTotal(o);if(o.reviewReason){o.status='needs_review';return;}o.status=captured>0?(refunded>=captured?'refunded':refunded>0?'partially_refunded':'paid'):o.attempts.some(p=>p.status==='authorized')?'pending':o.attempts.length&&o.attempts.every(p=>p.status==='failed')?'failed':'pending';if(captured>0){o.paidAt??=o.attempts.find(p=>p.capturedAt)?.capturedAt;const c=s.carts.find(c=>c.id===o.cartId);if(c)c.status='paid';const id=`purchase:${o.id}`;if(o.mode==='live'){if(!s.jobs.some(j=>j.id===id))s.jobs.push({id,kind:'purchase',status:'queued',payload:{orderId:o.id,email:o.customer.email,templateId:'thank-you'},created_at:new Date().toISOString()});staffNotifyPurchase(s,o);}}}
export type ProviderPayment={id:string;order_id:string;amount:number;currency:string;status:string;method?:string;bank?:string|null;wallet?:string|null;created_at:number;error_description?:string|null;captured?:boolean};
export function applyPayUPayment(s:State,o:Order,input:{mihpayid:string;status:string;amountPaise:number;mode?:string;error?:string},eventId:string,at=new Date().toISOString()){
 if(o.gateway!=='payu')throw new Error('This order is not a PayU checkout.');
 if(input.amountPaise!==o.total)throw new Error('Payment amount mismatch.');
 const payId=input.mihpayid||eventId;
 const captured=input.status.toLowerCase()==='success';
 const next:PaymentAttempt={id:payId,status:captured?'captured':'failed',amount:o.total,currency:o.currency,method:input.mode||'PayU',bank:'',wallet:'',createdAt:at,verifiedAt:at,capturedAt:captured?at:undefined,error:input.error?.slice(0,500)||''};
 const previous=o.attempts.find(a=>a.id===payId);
 if(previous)Object.assign(previous,next);else o.attempts.push(next);
 if(capturedTotal(o)>o.total)o.reviewReason='Multiple captured payments; review in PayU';
 appendEvent(o,eventId,`PayU ${payId}: ${next.status}`,at);derive(s,o);
}
export function applyPayment(s:State,o:Order,p:ProviderPayment,eventId:string,at=new Date().toISOString()){
 if(o.gateway!=='razorpay')throw new Error('This order is not a Razorpay checkout.');
 if(p.order_id!==o.providerOrderId||!/^pay_[A-Za-z0-9]+$/.test(p.id))throw new Error('Payment does not belong to this order.');
 if(p.amount!==o.total||p.currency!==o.currency){o.reviewReason='Payment amount or currency mismatch';o.status='needs_review';appendEvent(o,eventId,o.reviewReason,at);return;}
 const previous=o.attempts.find(a=>a.id===p.id);const captured=previous?.capturedAt||((p.status==='captured'||p.status==='refunded')?at:undefined);
 const next:PaymentAttempt={id:p.id,status:captured?(p.status==='refunded'?'refunded':'captured'):previous?.status==='authorized'&&p.status==='created'?'authorized':p.status,amount:p.amount,currency:p.currency,method:p.method||previous?.method||'Unknown',bank:p.bank||previous?.bank||'',wallet:p.wallet||previous?.wallet||'',createdAt:new Date(p.created_at*1000).toISOString(),verifiedAt:at,capturedAt:captured,error:p.error_description?.slice(0,500)||''};
 if(previous)Object.assign(previous,next);else o.attempts.push(next);
 if(capturedTotal(o)>o.total)o.reviewReason='Multiple captured payments; review in Razorpay';
 appendEvent(o,eventId,`Payment ${p.id}: ${next.status}`,at);derive(s,o);
}
export function applyRefund(s:State,o:Order,r:{id:string;payment_id:string;amount:number;status:string;created_at:number},eventId:string){if(!o.attempts.some(p=>p.id===r.payment_id)||!Number.isSafeInteger(r.amount)||r.amount<=0)throw new Error('Invalid refund payment or amount.');const existing=o.refunds.find(x=>x.id===r.id);if(existing?.status!=='processed'){const next={id:r.id,paymentId:r.payment_id,amount:r.amount,status:r.status,createdAt:new Date(r.created_at*1000).toISOString()};if(existing)Object.assign(existing,next);else o.refunds.push(next);}if(refundedTotal(o)>capturedTotal(o))o.reviewReason='Refund total exceeds verified collection';appendEvent(o,eventId,`Refund ${r.id}: ${r.status}`);derive(s,o);}
