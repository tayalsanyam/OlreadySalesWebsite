import 'server-only';
import {createHash,timingSafeEqual} from 'node:crypto';
import {applyPayUPayment,bindPayUCheckout,type Order} from './orders';
import {assertGatewayAccount,gatewayCatalog} from './payment-config';
import {mutate,readState} from './store';

function sha512(input:string){return createHash('sha512').update(input).digest('hex');}

export function payuBase(mode:'test'|'live'){
 return mode==='live'?'https://secure.payu.in':'https://test.payu.in';
}

export function payuInfoUrl(mode:'test'|'live'){
 return mode==='live'?'https://info.payu.in/merchant/postservice?form=2':'https://test.payu.in/merchant/postservice?form=2';
}

export function payuAmount(totalPaise:number){return (totalPaise/100).toFixed(2);}

export function payuRequestHash(input:{key:string;salt:string;txnid:string;amount:string;productinfo:string;firstname:string;email:string;udf1?:string}){
 const udf1=input.udf1||'';
 // https://docs.payu.in/docs/prebuilt-checkout-page-integration — sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
 const seq=[input.key,input.txnid,input.amount,input.productinfo,input.firstname,input.email,udf1,'','','','','','','','','',input.salt].join('|');
 return sha512(seq);
}

export function payuResponseHash(input:{salt:string;status:string;email:string;firstname:string;productinfo:string;amount:string;txnid:string;key:string;udf1?:string}){
 const udf1=input.udf1||'';
 // Reverse hash — https://docs.payu.in/docs/prebuilt-checkout-page-integration — sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
 const seq=[input.salt,input.status,'','','','','','','','','','',udf1,input.email,input.firstname,input.productinfo,input.amount,input.txnid,input.key].join('|');
 return sha512(seq);
}

export function validPayUHash(received:string,expected:string){
 if(!/^[a-f0-9]{128}$/i.test(received||''))return false;
 try{return timingSafeEqual(Buffer.from(received.toLowerCase(),'hex'),Buffer.from(expected.toLowerCase(),'hex'));}catch{return false;}
}

export function buildPayUCheckout(o:Order,origin:string){
 const cfg=gatewayCatalog().payu;
 const salt=process.env.PAYU_MERCHANT_SALT||'';
 const amount=payuAmount(o.total);
 const productinfo=o.plan.name.slice(0,100);
 const firstname=o.customer.name.slice(0,60);
 const email=o.customer.email;
 const phone=o.customer.phone.replace(/\D/g,'').slice(-10);
 const txnid=o.id;
 const surl=`${origin}/api/payments/payu/callback`;
 const furl=surl;
 const udf1=o.id;
 const hash=payuRequestHash({key:cfg.key,salt,txnid,amount,productinfo,firstname,email,udf1});
 return {
  action:`${payuBase(cfg.mode)}/_payment`,
  fields:{
   key:cfg.key,txnid,amount,productinfo,firstname,email,phone,surl,furl,hash,udf1,
   service_provider:'payu_paisa',
  },
 };
}

export type PayUCallback={
 status:string;
 txnid:string;
 amount:string;
 mihpayid?:string;
 hash:string;
 mode?:string;
 error_Message?:string;
 productinfo?:string;
 firstname?:string;
 email?:string;
 udf1?:string;
};

export function verifyPayUCallback(body:PayUCallback){
 const cfg=gatewayCatalog().payu;
 const salt=process.env.PAYU_MERCHANT_SALT||'';
 const expected=payuResponseHash({
  salt,status:body.status||'',email:body.email||'',firstname:body.firstname||'',productinfo:body.productinfo||'',
  amount:body.amount||'',txnid:body.txnid||'',key:cfg.key,udf1:body.udf1,
 });
 if(!validPayUHash(body.hash||'',expected))throw new Error('PayU response hash could not be verified.');
}

export async function verifyPayUTransaction(txnid:string){
 const cfg=gatewayCatalog().payu;
 const salt=process.env.PAYU_MERCHANT_SALT||'';
 const command='verify_payment';
 const hash=sha512(`${cfg.key}|${command}|${txnid}|${salt}`);
 const body=new URLSearchParams({key:cfg.key,command,var1:txnid,hash});
 const r=await fetch(payuInfoUrl(cfg.mode),{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body,signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw new Error(`PayU could not verify this transaction (${r.status}).`);
 const data=await r.json();
 return data;
}

function payuDetailRow(data:unknown,txnid:string):Record<string,string>|null{
 if(!data||typeof data!=='object')return null;
 const root=data as Record<string,unknown>;
 const bucket=root.transaction_details;
 if(!bucket||typeof bucket!=='object')return null;
 const row=(bucket as Record<string,unknown>)[txnid];
 if(!row||typeof row!=='object')return null;
 const out:Record<string,string>={};
 for(const [k,v] of Object.entries(row as Record<string,unknown>))out[k]=v==null?'':String(v);
 return out;
}

export async function reconcilePayUOrder(id:string){
 const snapshot=(await readState()).orders?.find(o=>o.id===id);
 if(!snapshot)throw new Error('Order not found');
 if(snapshot.gateway!=='payu')throw new Error('This order is not a PayU checkout.');
 assertGatewayAccount(snapshot);
 const data=await verifyPayUTransaction(snapshot.id);
 const detail=payuDetailRow(data,snapshot.id);
 if(!detail)throw new Error('PayU has no transaction record for this order yet.');
 return mutate(s=>{
  const o=s.orders!.find(x=>x.id===id)!;
  bindPayUCheckout(o);
  const amountPaise=Math.round(parseFloat(detail.amt||detail.transaction_amount||'0')*100);
  applyPayUPayment(s,o,{mihpayid:detail.mihpayid||detail.bank_ref_num||snapshot.id,status:detail.status||detail.unmappedstatus||'failure',amountPaise,mode:detail.mode,error:detail.error_Message||detail.field9},`sync:${detail.mihpayid||snapshot.id}:${detail.status}`);
  return o;
 });
}
