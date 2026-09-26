import {z} from 'zod';
import type {Site,State} from './schema';

export type StaffAlertKind='contact'|'purchase'|'assistant';

export function parseStaffEmails(settings:Site['settings']):string[]{
 const envOverride=process.env.NODE_ENV==='development'&&!process.env.VERCEL?process.env.STAFF_ALERT_EMAILS?.trim():'';
 const raw=envOverride||settings.staffAlertEmails?.trim()||'sanyam@olready.in, Kanika@olready.in';
 return [...new Set(raw.split(/[,;\n]+/).map(e=>e.trim().toLowerCase()).filter(Boolean))].filter(e=>z.string().email().safeParse(e).success);
}

export function staffNotifyEnabled(settings:Site['settings'],kind:StaffAlertKind){
 if(!parseStaffEmails(settings).length)return false;
 if(kind==='contact')return settings.staffNotifyContact!==false;
 if(kind==='purchase')return settings.staffNotifyPurchase!==false;
 return settings.staffNotifyAssistant!==false;
}

export function enqueueStaffAlert(s:State,opts:{topic:string;body:string;id?:string;kind:StaffAlertKind}){
 if(!staffNotifyEnabled(s.published.settings,opts.kind))return;
 const emails=parseStaffEmails(s.published.settings);
 if(!emails.length)return;
 const id=opts.id||`staff:${crypto.randomUUID()}`;
 if(s.jobs.some(j=>j.id===id))return;
 s.jobs.push({id,kind:'staff-alert',status:'queued',payload:{to:emails.join(',')},rendered:{subject:`[OLREADY] ${opts.topic}`,body:opts.body},created_at:new Date().toISOString()});
}

export function staffNotifyContact(s:State,entry:{name:string;phone:string;email?:string;message:string;source:string;contactId?:string}){
 if(!staffNotifyEnabled(s.published.settings,'contact'))return;
 const lines=[`Name: ${entry.name}`,`Phone: ${entry.phone}`,entry.email?`Email: ${entry.email}`:'',`Source: ${entry.source}`,`Message: ${entry.message||'—'}`,`Time: ${new Date().toISOString()}`].filter(Boolean);
 enqueueStaffAlert(s,{kind:'contact',topic:'New contact request',body:lines.join('\n'),id:entry.contactId?`staff-contact:${entry.contactId}`:undefined});
}

export function staffNotifyPurchase(s:State,order:NonNullable<State['orders']>[number]){
 if(!staffNotifyEnabled(s.published.settings,'purchase'))return;
 const c=order.customer;
 const lines=[`Plan: ${order.plan.name}`,`Total: ₹${(order.total/100).toLocaleString('en-IN')} (incl. GST)`,`Customer: ${c.name}`,`Email: ${c.email}`,`Phone: ${c.phone}`,c.business?`Business: ${c.business}`:'',`Order ID: ${order.id}`,`Mode: ${order.mode}`,`Time: ${order.paidAt||order.updatedAt}`].filter(Boolean);
 enqueueStaffAlert(s,{kind:'purchase',topic:`New purchase — ${order.plan.name}`,body:lines.join('\n'),id:`staff-purchase:${order.id}`});
}

export function staffNotifyAssistantChat(s:State,session:{id:string;name:string;phone:string;messages:{role:string;text:string}[]}){
 if(!staffNotifyEnabled(s.published.settings,'assistant'))return;
 const transcript=session.messages.length?session.messages.map(m=>`${m.role==='user'?'Visitor':'Assistant'}: ${m.text}`).join('\n\n'):'(No messages recorded)';
 const lines=[`Name: ${session.name}`,`Phone: ${session.phone}`,`Session: ${session.id}`,'','--- Chat transcript ---','',transcript];
 enqueueStaffAlert(s,{kind:'assistant',topic:'Sales assistant chat',body:lines.join('\n'),id:`staff-assistant:${session.id}`});
}

export function staffNotifyAssistantCallback(
 s:State,
 session:{id:string;name:string;phone:string;messages:{role:string;text:string}[]},
 triggerMessage:string,
){
 if(!staffNotifyEnabled(s.published.settings,'assistant'))return;
 const id=`staff-assistant-callback:${session.id}`;
 if(s.jobs.some(j=>j.id===id))return;
 const recent=session.messages.slice(-8);
 const transcript=recent.length
  ? recent.map(m=>`${m.role==='user'?'Visitor':'Assistant'}: ${m.text}`).join('\n\n')
  : '(No prior messages)';
 const lines=[
  'Type: Callback / human handoff requested in sales assistant',
  `Name: ${session.name}`,
  `Phone: ${session.phone}`,
  `Session: ${session.id}`,
  `Trigger: ${triggerMessage.slice(0, 500)}`,
  `Time: ${new Date().toISOString()}`,
  '',
  '--- Recent chat ---',
  '',
  transcript,
 ];
 enqueueStaffAlert(s,{kind:'assistant',topic:'Callback requested — sales assistant',body:lines.join('\n'),id});
}
