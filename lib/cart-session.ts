import type {Cart, State} from './schema';
import {quote} from './commerce';
import {hash, secret} from './secrets';

export type LastOrderSummary={id:string;plan:string;paidAt?:string};

/** After a completed purchase, start a new open cart (new cookie) and keep contact details. */
export function startFreshCartAfterPaid(s:State,paidCart:Cart,newToken=secret(),now=new Date().toISOString()){
 const plan=s.published.plans.find(p=>p.id===paidCart.planId)||s.published.plans.find(p=>p.id==='pro')||s.published.plans[0];
 if(!plan)throw new Error('No plan configured');
 const totals=quote(plan);
 const order=s.orders?.find(o=>o.cartId===paidCart.id&&['paid','partially_refunded','refunded'].includes(o.status));
 const cart:Cart={
  id:crypto.randomUUID(),
  tokenHash:hash(newToken),
  planId:plan.id,
  planVersion:plan.version,
  email:paidCart.email,
  name:paidCart.name,
  phone:paidCart.phone,
  business:paidCart.business||'',
  gstin:paidCart.gstin||'',
  marketing:paidCart.marketing,
  terms:false,
  coupon:'',
  ...totals,
  status:'open',
  created_at:now,
  updated_at:now,
 };
 s.carts.push(cart);
 const lastOrder:LastOrderSummary|null=order?{id:order.id,plan:order.plan.name,paidAt:order.paidAt||order.updatedAt}:null;
 return {cart,newToken,lastOrder};
}
