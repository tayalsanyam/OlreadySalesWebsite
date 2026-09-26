import type {ContactRequest,State} from './schema';
import {staffNotifyContact} from './staff-notify';

/** Returns new contact id, or null when deduped within 60s. */
export function recordContact(s:State,entry:Omit<ContactRequest,'id'|'created_at'|'status'>):string|null{
 s.contacts??=[];
 const recent=s.contacts.some(c=>c.phone===entry.phone&&Date.parse(c.created_at)>Date.now()-60000);
 if(recent)return null;
 const id=crypto.randomUUID();
 s.contacts.unshift({id,status:'new',created_at:new Date().toISOString(),...entry});
 staffNotifyContact(s,{...entry,contactId:id});
 return id;
}
