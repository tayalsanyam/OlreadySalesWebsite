import {NextRequest,NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {sameOrigin,json,fail} from '@/lib/api';
import {mutate,readState} from '@/lib/store';
import {hash} from '@/lib/secrets';
import {reserveOrder,bindProviderOrder,bindPayUCheckout,appendEvent,validSignature,applyPayment,type Order} from '@/lib/orders';
import {flushImmediateJobs} from '@/lib/delivery';
import {razorpay,assertAccount,reconcileOrder} from '@/lib/razorpay';
import {gatewaysPublic,resolveCheckoutGateway} from '@/lib/payment-config';
import {buildPayUCheckout} from '@/lib/payu';
import {rateLimit} from '@/lib/limit';
import {planAllowsOnlinePayment} from '@/lib/commerce';

const safe=(o:Order)=>({id:o.id,status:o.status,total:o.total,plan:o.plan.name,mode:o.mode,gateway:o.gateway});
async function token(){return hash((await cookies()).get('olready_cart')?.value||'');}

export async function GET(){
 const s=await readState();
 const gateways=gatewaysPublic();
 const anyEnabled=gateways.razorpay.enabled||gateways.payu.enabled;
 const t=await token();
 const cart=s.carts.find(c=>c.tokenHash===t);
 const o=s.orders?.find(o=>o.cartId===cart?.id);
 const onlinePaymentAllowed=cart?planAllowsOnlinePayment(cart.planId):true;
 return NextResponse.json({
  enabled:anyEnabled&&onlinePaymentAllowed,
  onlinePaymentAllowed,
  gateways,
  order:o?safe(o):null,
 },{headers:{'Cache-Control':'no-store'}});
}

export async function POST(req:NextRequest){
 try{
  sameOrigin(req);await rateLimit(req,'payment',30);
  const body=await json(req,5000);
  const s0=await readState();
  const t=await token();
  const origin=(process.env.APP_URL||req.nextUrl.origin).replace(/\/$/,'');

  if(body.action==='create'){
   const g=resolveCheckoutGateway(body.gateway,s0.published.settings);
   if(!g.enabled)return NextResponse.json({error:`${g.label} checkout is not enabled.`},{status:503});
   const ctx={gateway:g.id,keyId:g.key,mode:g.mode};
   const reservation=await mutate(s=>{const cart=s.carts.find(c=>c.tokenHash===t);if(!cart)throw new Error('Save your selection first.');return reserveOrder(s,cart,ctx);});
   let o=reservation.order;
   if(o.gateway!==g.id)throw new Error(`This purchase is already linked to ${o.gateway==='payu'?'PayU':'Razorpay'}. Continue that payment below or contact OLREADY.`);
   assertAccount(o);

   if(reservation.created&&g.id==='razorpay'){
    try{
     const p=await razorpay('orders',{amount:o.total,currency:o.currency,receipt:o.id,notes:{olready_order_id:o.id,plan:o.plan.name}});
     o=await mutate(s=>{const saved=s.orders!.find(x=>x.id===o.id)!;bindProviderOrder(saved,p);return saved;});
    }catch{
     await mutate(s=>{const saved=s.orders!.find(x=>x.id===o.id)!;if(!saved.providerOrderId){saved.status='needs_review';saved.reviewReason='creation_unconfirmed';appendEvent(saved,'creation-unconfirmed','Creation could not be confirmed. Reconcile receipt in Razorpay before any new charge.');}});
     throw new Error('We could not confirm checkout setup. Please contact OLREADY with reference '+o.id+'. Do not pay again.');
    }
   }else if(reservation.created&&g.id==='payu'){
    o=await mutate(s=>{const saved=s.orders!.find(x=>x.id===o.id)!;bindPayUCheckout(saved);return saved;});
   }

   if(g.id==='razorpay'&&(!o.providerOrderId||o.status==='needs_review'))throw new Error('This order needs verification by OLREADY. Reference: '+o.id);
   if(!['pending','failed'].includes(o.status))return NextResponse.json({order:safe(o)});

   if(g.id==='payu'){
    const payu=buildPayUCheckout(o,origin);
    return NextResponse.json({order:safe(o),checkout:{gateway:'payu',action:payu.action,fields:payu.fields}});
   }
   return NextResponse.json({order:safe(o),checkout:{gateway:'razorpay',key:g.key,order_id:o.providerOrderId,amount:o.total,currency:o.currency,name:'OLREADY',description:o.plan.name,prefill:{name:o.customer.name,email:o.customer.email,contact:o.customer.phone}}});
  }

  const s=await readState();
  const c=s.carts.find(c=>c.tokenHash===t);
  const o=s.orders?.find(o=>o.cartId===c?.id);
  if(!o)throw new Error('Order not found.');
  assertAccount(o);

  if(body.action==='verify'){
   if(o.gateway!=='razorpay')throw new Error('Use PayU return or Check payment status for this order.');
   if(body.razorpay_order_id!==o.providerOrderId||typeof body.razorpay_payment_id!=='string'||!/^pay_[A-Za-z0-9]+$/.test(body.razorpay_payment_id)||!validSignature(o.providerOrderId+'|'+body.razorpay_payment_id,body.razorpay_signature||'',process.env.RAZORPAY_KEY_SECRET||''))return NextResponse.json({error:'Payment signature could not be verified.'},{status:400});
   const p=await razorpay('payments/'+body.razorpay_payment_id);
   let flushIds:string[]=[];
   const updated=await mutate(s=>{const saved=s.orders!.find(x=>x.id===o.id)!;const wasPaid=['paid','partially_refunded'].includes(saved.status);applyPayment(s,saved,p,`callback:${p.id}:${p.status}`);if(!wasPaid&&['paid','partially_refunded'].includes(saved.status)&&saved.mode==='live')flushIds=[`purchase:${saved.id}`,`staff-purchase:${saved.id}`];return saved;});
   if(flushIds.length)await flushImmediateJobs(flushIds);
   return NextResponse.json({order:safe(updated)});
  }

  if(body.action==='refresh')return NextResponse.json({order:safe(await reconcileOrder(o.id))});
  throw new Error('Unknown payment action');
 }catch(e){return fail(e);}
}
