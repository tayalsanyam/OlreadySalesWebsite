'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {track} from '@/lib/client-events';

type Receipt={id:string;status:string;total:number;plan:string;mode:string;gateway:string};
type GatewayInfo={id:'razorpay'|'payu';label:string;enabled:boolean;mode:'test'|'live'};
type Config={enabled:boolean;onlinePaymentAllowed?:boolean;gateways:{razorpay:GatewayInfo;payu:GatewayInfo};order:Receipt|null};
type PayUCheckout={gateway:'payu';action:string;fields:Record<string,string>};
type RazorpayCheckout={gateway:'razorpay';key:string;order_id:string;amount:number;currency:string;name:string;description:string;prefill:{name:string;email:string;contact:string}};

const PAID=['paid','partially_refunded','refunded'] as const;
const WATCH=['pending','creating'] as const;
const POLL_PENDING_MS=4000;
const POLL_IDLE_MS=45000;

function paidStatus(s:string){return (PAID as readonly string[]).includes(s);}

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

export function PaymentCheckout({merchantUrl,paymentDisabled,preparePayment,onLock,onUnlock,editDetailsLabel='Edit my details',onlinePaymentAllowed=true,inviteTitle,inviteBody}:{merchantUrl:string;paymentDisabled:string;preparePayment:()=>Promise<void>;onLock:()=>void;onUnlock:()=>void;editDetailsLabel?:string;onlinePaymentAllowed?:boolean;inviteTitle?:string;inviteBody?:string}){
 const [config,setConfig]=useState<Config|null>(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[paying,setPaying]=useState<'razorpay'|'payu'|null>(null),[watching,setWatching]=useState(false);
 const abandonedRef=useRef('');
 const onLockRef=useRef(onLock);
 const onUnlockRef=useRef(onUnlock);
 onLockRef.current=onLock;
 onUnlockRef.current=onUnlock;

 async function post(body:unknown){const r=await fetch('/api/payments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw new Error(d.error||'Unable to confirm payment.');return d;}

 const applyPaymentState=useCallback(async(d:Config)=>{
  const o=d.order;
  if(!o){
   abandonedRef.current='';
   setWatching(false);
   setConfig(d);
   onUnlockRef.current();
   return d;
  }
  if(paidStatus(o.status)){
   setWatching(false);
   setConfig(d);
   onLockRef.current();
   return d;
  }
  if(o.status==='failed'){
   setConfig(d);
   if(abandonedRef.current!==o.id){
    abandonedRef.current=o.id;
    setBusy(true);
    try{
     await post({action:'abandon'});
     onUnlockRef.current();
     const r=await fetch('/api/payments',{cache:'no-store'});
     const fresh=await r.json();
     if(r.ok)setConfig(fresh);
     setWatching(false);
     setMessage('Payment did not complete. You can update your details and try again.');
     return fresh as Config;
    }catch(e){
     abandonedRef.current='';
     setMessage((e as Error).message);
    }finally{setBusy(false);}
   }else{
    onUnlockRef.current();
    setWatching(false);
   }
   return d;
  }
  setWatching(true);
  setConfig(d);
  onLockRef.current();
  return d;
 },[]);

 async function fetchPayment(){const r=await fetch('/api/payments',{cache:'no-store'});const d=await r.json();if(!r.ok)throw new Error(d.error||'Could not retrieve payment status.');return applyPaymentState(d as Config);}

 async function refresh(){return fetchPayment();}

 useEffect(()=>{
  let active=true;
  let timer:ReturnType<typeof setInterval>|undefined;
  let inflight=false;
  const clear=()=>{if(timer){clearInterval(timer);timer=undefined;}};
  const arm=(ms:number)=>{clear();if(!active||document.hidden)return;timer=setInterval(tick,ms);};
  async function tick(){
   if(!active||inflight||document.hidden)return;
   inflight=true;
   try{
    const r=await fetch('/api/payments',{cache:'no-store'});
    const d=await r.json();
    if(!r.ok||!active)return;
    const state=await applyPaymentState(d as Config);
    const o=state.order;
    if(o&&paidStatus(o.status)){clear();return;}
    if(!o){arm(POLL_IDLE_MS);return;}
    if(o.status==='failed'){arm(POLL_IDLE_MS);return;}
    if((WATCH as readonly string[]).includes(o.status))arm(POLL_PENDING_MS);
    else arm(POLL_IDLE_MS);
   }catch{}finally{inflight=false;}
  }
  tick();
  arm(POLL_IDLE_MS);
  const onVis=()=>{if(document.hidden)clear();else{tick();if(!timer)arm(POLL_IDLE_MS);}};
  document.addEventListener('visibilitychange',onVis);
  return()=>{active=false;clear();document.removeEventListener('visibilitychange',onVis);};
 },[applyPaymentState,onlinePaymentAllowed]);

 useEffect(()=>{
  const o=config?.order;
  if(!o||!paidStatus(o.status))return;
  const key=`olready_journey_paid_${o.id}`;
  if(sessionStorage.getItem(key))return;
  sessionStorage.setItem(key,'1');
  track('payment_paid',o.gateway);
 },[config?.order?.id,config?.order?.status,config?.order?.gateway]);

 useEffect(()=>{
  const params=new URLSearchParams(window.location.search);
  const payu=params.get('payu');
  if(!payu)return;
  const copy:Record<string,string>={success:'Payment confirmed. Thank you for choosing OLREADY.',pending:'Checking payment status with PayU…',failed:'Checking payment result…',error:'We could not verify the PayU return. Use Check payment status below.'};
  setMessage(copy[payu]||'Payment status updated.');
  if(payu==='failed')track('payment_failed','payu');
  (async()=>{
   try{if(payu==='failed'||payu==='pending')await post({action:'refresh'});}catch{}
   await refresh().catch(()=>{});
  })();
  params.delete('payu');
  params.delete('ref');
  const next=params.toString();
  window.history.replaceState({},'',window.location.pathname+(next?`?${next}`:''));
 // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when returning from PayU
 },[]);

 async function pay(gateway:'razorpay'|'payu'){setBusy(true);setPaying(gateway);setMessage('Saving your details…');try{await preparePayment();setMessage('');const result=await post({action:'create',gateway});onLockRef.current();await refresh();if(!result.checkout){setBusy(false);setPaying(null);return;}track('payment_started',gateway);const checkout=result.checkout as PayUCheckout|RazorpayCheckout;if(checkout.gateway==='payu'){setMessage('Redirecting to PayU…');submitPayU(checkout);return;}await loadCheckout();const checkoutModal=new (window as any).Razorpay({...checkout,theme:{color:'#ec0065'},handler:async(response:Record<string,string>)=>{setMessage('Verifying payment…');try{const d=await post({action:'verify',...response});await refresh();setMessage(d.order.status==='paid'?'Payment confirmed. Thank you for choosing OLREADY.':'Your payment is being checked. Please do not pay again.');}catch(e){setMessage((e as Error).message+' If money was debited, do not pay again. Use Check payment status below.');}finally{setBusy(false);setPaying(null);}},modal:{ondismiss:()=>{setBusy(false);setPaying(null);setMessage('Payment window closed. Checking status…');refresh().catch(()=>{});}}});checkoutModal.on('payment.failed',()=>{track('payment_failed',gateway);setMessage('This payment attempt did not complete. You can retry in the payment window, or close it and check the status below.');});checkoutModal.open();}catch(e){setMessage((e as Error).message);setBusy(false);setPaying(null);await refresh().catch(()=>{});}}
 async function check(){setBusy(true);setMessage('Checking payment status…');try{await post({action:'refresh'});const state=await refresh();const ord=state.order;if(!ord)return;if(ord&&paidStatus(ord.status))setMessage('Payment confirmed. Thank you for choosing OLREADY.');else if(ord.status!=='failed')setMessage('Payment status updated.');}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}
 async function editDetails(){setBusy(true);setMessage('');try{await post({action:'abandon'});abandonedRef.current='';setConfig(null);onUnlockRef.current();await refresh();setMessage('You can update your details and pay again. If you left PayU open in another tab, close it before paying.');}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}

 if(!config)return null;
 const o=config.order;
 const paid=o&&paidStatus(o.status);
 const payAllowed=onlinePaymentAllowed&&config.onlinePaymentAllowed!==false;
 const gateways=(['razorpay','payu'] as const).map(id=>config.gateways[id]).filter(g=>g.enabled);
 const showPay=payAllowed&&!paid&&gateways.length>0&&config.enabled&&(!o||['pending','failed','creating'].includes(o.status));
 const showEdit=o&&!paid&&['pending','creating','needs_review'].includes(o.status);
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
   {watching&&<p className="checkout-pay__hint" role="status">Checking payment status… Your details stay locked until we know the payment failed or succeeded.</p>}
   {o&&<><p className="checkout-pay__status">{o.plan} · {o.status.replaceAll('_',' ')}</p><small className="checkout-pay__ref">Reference: {o.id}</small></>}
   {showPay&&<div className="checkout-pay__options">{gateways.map(g=>{const lockedToOther=!!activeGateway&&activeGateway!==g.id;const continueHere=activeGateway===g.id;return <button key={g.id} type="button" className={'button primary checkout-pay__option'+(continueHere?' checkout-pay__option--active':'')} disabled={busy||lockedToOther||watching} onClick={()=>pay(g.id)}>{busy&&paying===g.id?'Please wait…':continueHere?`Continue with ${g.label}`:`Pay with ${g.label}`}{g.mode==='test'?` · test`:''}</button>;})}</div>}
   {activeGateway&&showPay&&gateways.length>1&&<p className="checkout-pay__hint">This order uses {activeGateway==='payu'?'PayU':'Razorpay'}. Switch only after checking status with our team.</p>}
   {showEdit&&<button type="button" className="checkout-pay__edit" disabled={busy} onClick={editDetails}>{editDetailsLabel}</button>}
   {o&&<button type="button" className="checkout-pay__refresh" disabled={busy} onClick={check}>Check payment status</button>}
  </>}
  {message&&<p className="checkout-pay__message" role="status">{message}</p>}
 </div>;
}
