import test from 'node:test';
import assert from 'node:assert/strict';
import {seed} from '../lib/seed';
import {buildAssistantFacts} from '../lib/assistant-facts';
import {responsePayload} from '../lib/assistant-ai';

test('assistant facts include site guide metrics and offers', () => {
 const facts = buildAssistantFacts(seed);
 assert.ok(facts.publishedSiteGuide.navigation);
 assert.ok(facts.publishedSiteGuide.visitorJourney.includes('/checkout'));
 assert.equal(facts.contact.supportHours, seed.settings.supportHours);
 assert.ok(facts.policies.terms === '/terms');
 assert.ok(Array.isArray(facts.metrics));
 assert.ok(Array.isArray(facts.artists));
 assert.ok(Array.isArray(facts.testimonials));
 const payload = responsePayload(seed, undefined, 'Hi', [], 'test');
 assert.match(payload.instructions, /at most one follow-up/);
 assert.match(payload.instructions, /publishedSiteGuide/);
 assert.match(payload.instructions, /supportHours/);
});
