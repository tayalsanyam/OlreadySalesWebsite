import test from 'node:test';
import assert from 'node:assert/strict';
import {wantsCallbackHandoff} from '../lib/assistant-handoff';
import {guideAnswer} from '../lib/plan-guide';
import {seed} from '../lib/seed';
import {initialState} from '../lib/seed';
import {staffNotifyAssistantCallback} from '../lib/staff-notify';

test('detects callback and handoff phrasing', () => {
 assert.equal(wantsCallbackHandoff('okay arrange a call back please'), true);
 assert.equal(wantsCallbackHandoff('Can someone call me tomorrow?'), true);
 assert.equal(wantsCallbackHandoff('What is GST on Pro?'), false);
});

test('guided mode acknowledges callback with support hours', () => {
 const r = guideAnswer(seed, 'Please call me back');
 assert.equal(r.topic, 'callback');
 assert.match(r.answer, /follow up/i);
 assert.ok(r.answer.includes(seed.settings.supportHours.slice(0, 20)));
});

test('staff callback alert is idempotent per session', () => {
 const s = initialState();
 s.assistantSessions = [
  {
   id: '550e8400-e29b-41d4-a716-446655440000',
   name: 'Test Artist',
   phone: '+919999999999',
   created_at: new Date().toISOString(),
   completed: false,
   messages: [{role: 'user', text: 'Call me back'}],
  },
 ];
 staffNotifyAssistantCallback(s, s.assistantSessions![0], 'Call me back');
 staffNotifyAssistantCallback(s, s.assistantSessions![0], 'Call me again');
 assert.equal(s.jobs.filter((j) => j.id === 'staff-assistant-callback:550e8400-e29b-41d4-a716-446655440000').length, 1);
 assert.match(s.jobs[0].rendered!.subject, /Callback requested/);
});
