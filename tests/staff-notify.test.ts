import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../lib/seed';
import {enqueueStaffAlert,parseStaffEmails,staffNotifyContact} from '../lib/staff-notify';

test('parses comma-separated alert emails',()=>{
 const prev=process.env.STAFF_ALERT_EMAILS;
 delete process.env.STAFF_ALERT_EMAILS;
 const emails=parseStaffEmails({...initialState().published.settings,staffAlertEmails:'sanyam@olready.in, Kanika@olready.in; bad'});
 assert.deepEqual(emails,['sanyam@olready.in','kanika@olready.in']);
 if(prev)process.env.STAFF_ALERT_EMAILS=prev;
});

test('queues staff-alert jobs for contacts',()=>{
 const s=initialState();
 staffNotifyContact(s,{name:'A',phone:'+919999999999',message:'Hi',source:'/help',contactId:'c1'});
 assert.equal(s.jobs.some(j=>j.kind==='staff-alert'&&j.id==='staff-contact:c1'),true);
 assert.match(s.jobs[0].payload.to,/sanyam@olready.in/);
 staffNotifyContact(s,{name:'B',phone:'+918888888888',message:'Again',source:'/help',contactId:'c2'});
 assert.equal(s.jobs.filter(j=>j.kind==='staff-alert').length,2);
});

test('respects disabled contact alerts',()=>{
 const s=initialState();
 s.published.settings.staffNotifyContact=false;
 enqueueStaffAlert(s,{kind:'contact',topic:'Test',body:'Body'});
 assert.equal(s.jobs.length,0);
});
