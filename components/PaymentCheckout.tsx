'use client';
import {useEffect,useState} from 'react';
import {track} from '@/lib/client-events';

type Receipt={id:string;status:string;total:number;plan:string;mode:string;gateway:string};
type GatewayInfo={id:'razorpay'|'payu';label:string;enabled:boolean;mode:'test'|'live'};
type Config={enabled:boolean;onlinePaymentAllowed?:boolean;gateways:{razorpay:GatewayInfo;payu:GatewayInfo};order:Receipt|null};
type PayUCheckout={gateway:'payu';action:string;fields:Record<string,string>};
type RazorpayCheckout={gateway:'razorpay';key:string;order_id:string;amount:number;currency:string;name:string;description:string;prefill:{name:string;email:string;contact:string}};

let scriptPromise:Promise<void>|undefined;
function loadCheckout(){if((window as any).Razorpay)return Promise.resolve();if(!scriptPromise)scriptPromise=new Promise<void>((resolve,reject)=>{const script=document.createElement('script');script.src='https://checkout.razorpay.com/v1/checkout.js';script.async=true;const timer=setTimeout(()=>{script.remove();scriptPromise=undefined;reject(new Error('Payment window took too long to load. Check your connection and retry.'));},15000);script.onload=()=>{clearTimeout(timer);resolve();};script.onerror=()=>{clearTimeout(timer);script.remove();scriptPromise=undefined;reject(new Error('Payment window could not load. Check your connection and retry.'));};document.head.appendChild(script);});return scriptPromise;}

function submitPayU(checkout:PayUCheckout){
 const form=document.createElement('form');
 form.method='POST';
 form.action=checkout.action;
 form.style.display='none';
 for(const [name,value] of Object.entries(checkout.fields)){
  const input=document.createElement('input');
  input.type='hidden';
  input.name=name;
  input.value=value;
  form.appendChild(input);
 }
 document.body.appendChild(form);
 form.submit();
}

export function PaymentCheckout({merchantUrl,paymentDisabled,preparePayment,onLock,onlinePaymentAllowed=true,inviteTitle,inviteBody}:{merchantUrl:string;paymentDisabled:string;preparePayment:()=>Promise<void>;onLock:()=>void;onlinePaymentAllowed?:boolean;inviteTitle?:string;inviteBody?:string}){
 const [config,setConfig]=useState<Config|null>(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[paying,setPaying]=useState<'razorpay'|'payu'|null>(null);
 async function refresh(){const r=await fetch('/api/payments',{cache:'no-store'});const d=await r.json();if(!r.ok)throw new Error(d.error||'Could not retrieve payment status.');setConfig(d);if(d.order)onLock();return d as Config;}
 useEffect(()=>{
  let active=true;
  let timer:ReturnType<typeof setInterval>|undefined;
  let inflight=false;
  const clear=()=>{if(timer){clearInterval(timer);timer=undefined;}};
  const arm=(ms:number)=>{clear();if(!active||document.hidden)return;timer=setInterval(read,ms);};
  async function read(){
   if(!active||inflight||document.hidden)return;
   inflight=true;
   try{
    const r=await fetch('/api/payments',{cache:'no-store'});
    const d=await r.json();
    if(!r.ok||!active)return;
    setConfig(d);
    if(d.order)onLock();
    const paid=d.order&&['paid','partially_refunded','refunded'].includes(d.order.status);
    const watch=d.order&&['pending','failed','creating'].includes(d.order.status);
    if(paid||(!onlinePaymentAllowed&&!d.order)){clear();return;}
    arm(watch?12000:45000);
   }catch{}finally{inflight=false;}
  }
  read();
  arm(45000);
  const onVis=()=>{if(document.hidden)clear();else{read();if(!timer)arm(45000);}};
  document.addEventListener('visibilitychange',onVis);
  return()=>{active=false;clear();document.removeEventListener('visibilitychange',onVis);};
 },[onLock,onlinePaymentAllowed]);
 useEffect(()=>{
  const o=config?.order;
  if(!o)return;
  if(!['paid','partially_refunded','refunded'].includes(o.status))return;
  const key=`olready_journey_paid_${o.id}`;
  if(sessionStorage.getItem(key))return;
  sessionStorage.setItem(key,'1');
  track('payment_paid',o.gateway);
 },[config?.order?.id,config?.order?.status,config?.order?.gateway]);
 useEffect(()=>{const params=new URLSearchParams(window.location.search);const payu=params.get('payu');if(!payu)return;const copy:Record<string,string>={success:'Payment confirmed. Thank you for choosing OLREADY.',pending:'Your payment is being checked. Please do not pay again.',failed:'This payment attempt did not complete. Check payment status before trying again.',error:'We could not verify the PayU return. Use Check payment status below.'};setMessage(copy[payu]||'Payment status updated.');if(payu==='failed')track('payment_failed','payu');refresh().catch(()=>{});params.delete('payu');params.delete('ref');const next=params.toString();window.history.replaceState({},'',window.location.pathname+(next?`?${next}`:''));},[]);
 async function post(body:unknown){const r=await fetch('/api/payments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw new Error(d.error||'Unable to confirm payment.');return d;}
 async function pay(gateway:'razorpay'|'payu'){setBusy(true);setPaying(gateway);setMessage('Saving your details…');try{await preparePayment();setMessage('');const result=await post({action:'create',gateway});onLock();await refresh();if(!result.checkout){setBusy(false);setPaying(null);return;}track('payment_started',gateway);const checkout=result.checkout as PayUCheckout|RazorpayCheckout;if(checkout.gateway==='payu'){setMessage('Redirecting to PayU…');submitPayU(checkout);return;}await loadCheckout();const checkoutModal=new (window as any).Razorpay({...checkout,theme:{color:'#ec0065'},handler:async(response:Record<string,string>)=>{setMessage('Verifying payment…');try{const d=await post({action:'verify',...response});await refresh();setMessage(d.order.status==='paid'?'Payment confirmed. Thank you for choosing OLREADY.':'Your payment is being checked. Please do not pay again.');}catch(e){setMessage((e as Error).message+' If money was debited, do not pay again. Use Check payment status below.');}finally{setBusy(false);setPaying(null);}},modal:{ondismiss:()=>{setBusy(false);setPaying(null);setMessage('Payment window closed. Check payment status before trying again.');refresh().catch(()=>{});}}});checkoutModal.on('payment.failed',()=>{track('payment_failed',gateway);setMessage('This payment attempt did not complete. You can retry in the payment window, or close it and check the status below.');});checkoutModal.open();}catch(e){setMessage((e as Error).message);setBusy(false);setPaying(null);await refresh().catch(()=>{});}}
 async function check(){setBusy(true);setMessage('Checking payment status…');try{await post({action:'refresh'});await refresh();setMessage('Payment status updated.');}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}
 if(!config)return null;
 const o=config.order;
 const paid=o&&['paid','partially_refunded','refunded'].includes(o.status);
 const payAllowed=onlinePaymentAllowed&&config.onlinePaymentAllowed!==false;
 const gateways=(['razorpay','payu'] as const).map(id=>config.gateways[id]).filter(g=>g.enabled);
 const showPay=payAllowed&&!paid&&gateways.length>0&&config.enabled&&(!o||['pending','failed'].includes(o.status));
 const activeGateway=o?.gateway;
 const testMode=gateways.some(g=>g.mode==='test');
 if(!payAllowed&&!paid&&!o){
  return <div className="checkout-pay checkout-pay--invite" aria-label="Privy invitation">
   <p className="checkout-pay__title">{inviteTitle||'Invite-only'}</p>
   <p className="checkout-pay__lead">{inviteBody||'This plan is available by invitation. Contact OLREADY on WhatsApp to request access.'}</p>
  </div>;
 }
 if(!config.enabled&&!o)return null;

 return <div className="checkout-pay" aria-label="Online payment">
  {paid?<><p className="checkout-pay__title">Payment confirmed</p><p>{o!.plan} · {o!.status.replaceAll('_',' ')}</p><small className="checkout-pay__ref">Reference: {o!.id}</small><p>Thank you. Create or complete your OLREADY profile, and contact our team if you need help.</p><a className="button primary" href={merchantUrl}>Create or log in to your profile</a></>:<>
   <p className="checkout-pay__title">Pay</p>
   <p className="checkout-pay__lead">We save your details, then open secure payment with your chosen partner.</p>
   {testMode&&<p className="checkout-pay__test"><strong>Test mode</strong> · No real money moves until live credentials are enabled.</p>}
   {!config.enabled&&paymentDisabled&&!paymentDisabled.includes('coming later')&&<p className="checkout-pay__hint">{paymentDisabled}</p>}
   {o&&<><p className="checkout-pay__status">{o.plan} · {o.status.replaceAll('_',' ')}</p><small className="checkout-pay__ref">Reference: {o.id}</small></>}
   {showPay&&<div className="checkout-pay__options">{gateways.map(g=>{const lockedToOther=!!activeGateway&&activeGateway!==g.id;const continueHere=activeGateway===g.id;return <button key={g.id} type="button" className={'button primary checkout-pay__option'+(continueHere?' checkout-pay__option--active':'')} disabled={busy||lockedToOther} onClick={()=>pay(g.id)}>{busy&&paying===g.id?'Please wait…':continueHere?`Continue with ${g.label}`:`Pay with ${g.label}`}{g.mode==='test'?` · test`:''}</button>;})}</div>}
   {activeGateway&&showPay&&gateways.length>1&&<p className="checkout-pay__hint">This order uses {activeGateway==='payu'?'PayU':'Razorpay'}. Switch only after checking status with our team.</p>}
   {o&&<button type="button" className="checkout-pay__refresh" disabled={busy} onClick={check}>Check payment status</button>}
  </>}
  {message&&<p className="checkout-pay__message" role="status">{message}</p>}
 </div>;
}
