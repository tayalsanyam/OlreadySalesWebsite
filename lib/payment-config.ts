import 'server-only';
import type {Site} from './schema';

export type PaymentGatewayId='razorpay'|'payu';

export type CheckoutGateway={
 id:PaymentGatewayId;
 label:string;
 configured:boolean;
 enabled:boolean;
 mode:'test'|'live';
 key:string;
};

function razorpayEnv(){
 const key=process.env.RAZORPAY_KEY_ID||'';
 const configured=!!key&&!!process.env.RAZORPAY_KEY_SECRET&&!!process.env.RAZORPAY_WEBHOOK_SECRET;
 const enabled=process.env.RAZORPAY_ENABLED==='true'&&configured&&!(process.env.LOCAL_DEMO==='true'&&key.startsWith('rzp_live_'));
 return {id:'razorpay' as const,label:'Razorpay',configured,enabled,mode:(key.startsWith('rzp_live_')?'live':'test') as 'test'|'live',key};
}

function payuEnv(){
 const key=process.env.PAYU_MERCHANT_KEY||'';
 const salt=process.env.PAYU_MERCHANT_SALT||'';
 const configured=!!key&&!!salt;
 const mode:CheckoutGateway['mode']=(process.env.PAYU_MODE||'test').toLowerCase()==='live'?'live':'test';
 const enabled=process.env.PAYU_ENABLED==='true'&&configured&&!(process.env.LOCAL_DEMO==='true'&&mode==='live');
 return {id:'payu' as const,label:'PayU',configured,enabled,mode,key};
}

/** Which gateway checkout should use (published site setting, then env, then fallback). */
export function preferredGateway(settings?:Pick<Site['settings'],'paymentGateway'>):PaymentGatewayId{
 const fromSite=settings?.paymentGateway;
 if(fromSite==='razorpay'||fromSite==='payu')return fromSite;
 const fromEnv=process.env.PAYMENT_GATEWAY;
 if(fromEnv==='payu'||fromEnv==='razorpay')return fromEnv;
 return 'razorpay';
}

export function gatewayCatalog(){return {razorpay:razorpayEnv(),payu:payuEnv()};}

export type GatewayPublic={id:PaymentGatewayId;label:string;enabled:boolean;mode:'test'|'live'};

export function gatewaysPublic():Record<PaymentGatewayId,GatewayPublic>{
 const c=gatewayCatalog();
 return {
  razorpay:{id:'razorpay',label:c.razorpay.label,enabled:c.razorpay.enabled,mode:c.razorpay.mode},
  payu:{id:'payu',label:c.payu.label,enabled:c.payu.enabled,mode:c.payu.mode},
 };
}

export function resolveCheckoutGateway(id:unknown,settings?:Pick<Site['settings'],'paymentGateway'>):CheckoutGateway{
 const catalog=gatewayCatalog();
 if(id==='razorpay'||id==='payu')return catalog[id];
 return checkoutGateway(settings);
}

export function checkoutGateway(settings?:Pick<Site['settings'],'paymentGateway'>):CheckoutGateway{
 const catalog=gatewayCatalog();
 const order:PaymentGatewayId[]=[preferredGateway(settings),preferredGateway(settings)==='razorpay'?'payu':'razorpay'];
 for(const id of order){
  const g=catalog[id];
  if(g.enabled)return g;
 }
 const pick=catalog[preferredGateway(settings)];
 return {...pick,enabled:false};
}

/** @deprecated use checkoutGateway */
export function paymentConfig(settings?:Pick<Site['settings'],'paymentGateway'>){
 const g=checkoutGateway(settings);
 return {configured:g.configured,enabled:g.enabled,mode:g.mode,key:g.key,gateway:g.id};
}

export function assertGatewayAccount(o:{gateway?:PaymentGatewayId;keyId:string}){
 const g=o.gateway||'razorpay';
 const catalog=gatewayCatalog();
 const current=catalog[g];
 if(o.keyId!==current.key)throw new Error(`This order belongs to a different ${current.label} merchant key. Restore the original account configuration to reconcile it.`);
}
