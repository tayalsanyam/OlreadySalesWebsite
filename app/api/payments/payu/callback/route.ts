import {NextRequest,NextResponse} from 'next/server';
import {mutate,readState} from '@/lib/store';
import {applyPayUPayment} from '@/lib/orders';
import {flushImmediateJobs} from '@/lib/delivery';
import {verifyPayUCallback,type PayUCallback} from '@/lib/payu';
import {assertGatewayAccount} from '@/lib/payment-config';

function origin(req:NextRequest){return (process.env.APP_URL||req.nextUrl.origin).replace(/\/$/,'');}

function fields(form:FormData):PayUCallback{
 const pick=(k:string)=>String(form.get(k)||'');
 return {
  status:pick('status'),txnid:pick('txnid'),amount:pick('amount'),mihpayid:pick('mihpayid'),hash:pick('hash'),
  mode:pick('mode'),error_Message:pick('error_Message'),productinfo:pick('productinfo'),firstname:pick('firstname'),
  email:pick('email'),udf1:pick('udf1'),
 };
}

async function handle(req:NextRequest){
 const form=await req.formData();
 const body=fields(form);
 verifyPayUCallback(body);
 const orderId=body.udf1||body.txnid;
 if(!orderId)throw new Error('PayU callback did not include an order reference.');
 const known=(await readState()).orders?.find(o=>o.id===orderId);
 if(!known||known.gateway!=='payu')throw new Error('Order not found for this PayU payment.');
 assertGatewayAccount(known);
 const amountPaise=Math.round(parseFloat(body.amount||'0')*100);
 let flushIds:string[]=[];
 await mutate(s=>{
  const o=s.orders!.find(x=>x.id===orderId)!;
  const eventId=`payu:${body.mihpayid||body.txnid}:${body.status}`;
  if(o.events.some(e=>e.id===eventId))return;
  const wasPaid=['paid','partially_refunded'].includes(o.status);
  applyPayUPayment(s,o,{mihpayid:body.mihpayid||body.txnid,status:body.status,amountPaise,mode:body.mode,error:body.error_Message},eventId);
  if(!wasPaid&&['paid','partially_refunded'].includes(o.status)&&o.mode==='live')flushIds=[`purchase:${o.id}`,`staff-purchase:${o.id}`];
 });
 if(flushIds.length)await flushImmediateJobs(flushIds);
 const flag=body.status.toLowerCase()==='success'?'success':body.status.toLowerCase()==='pending'?'pending':'failed';
 return NextResponse.redirect(`${origin(req)}/checkout?payu=${flag}&ref=${encodeURIComponent(orderId)}`,303);
}

export async function POST(req:NextRequest){try{return await handle(req);}catch{return NextResponse.redirect(`${origin(req)}/checkout?payu=error`,303);}}
export async function GET(req:NextRequest){try{return await handle(req);}catch{return NextResponse.redirect(`${origin(req)}/checkout?payu=error`,303);}}
