import type {Coupon,Plan} from './schema';

/** Invite-only plans cannot use hosted checkout (see reserveOrder). */
export function planAllowsOnlinePayment(planId:Plan['id']|string){return planId!=='privy';}
export function quote(plan:Plan,coupon?:Coupon,now=Date.now()){
 if(plan.pricePaise===null||!plan.approved)return {subtotal:null,discount:0,tax:0,total:null};
 const subtotal=plan.pricePaise;let discount=0;
 if(coupon){if(!coupon.enabled||Date.parse(coupon.starts)>now||Date.parse(coupon.ends)<=now||!Number.isFinite(Date.parse(coupon.starts))||!Number.isFinite(Date.parse(coupon.ends)))throw new Error('This offer is not active');if(coupon.plans.length&&!coupon.plans.includes(plan.id))throw new Error('This offer does not apply to this plan');if(subtotal<coupon.minimumPaise)throw new Error('The minimum amount for this offer has not been reached');discount=coupon.kind==='percent'?Math.round(subtotal*Math.min(coupon.value,100)/100):Math.round(coupon.value);if(coupon.maxDiscountPaise!==null)discount=Math.min(discount,coupon.maxDiscountPaise);discount=Math.min(subtotal,discount);}
 // Prices and discounts are GST-inclusive. Extract embedded tax; never add it again.
 const total=subtotal-discount;const tax=Math.round(total*plan.taxPercent/(100+plan.taxPercent));return {subtotal,discount,tax,total};
}
export const money=(paise:number|null)=>paise===null?'Price on request':new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(paise/100);
export function renderTemplate(body:string,values:Record<string,string>){return body.replace(/\{\{\s*([a-z_]+)\s*\}\}/g,(_,key)=>{if(!(key in values))throw new Error(`Missing template field: ${key}`);return values[key];});}

export const exactMoney=(paise:number|null)=>paise===null?'—':new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',minimumFractionDigits:2,maximumFractionDigits:2}).format(paise/100);
