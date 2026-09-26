import test from 'node:test';
import assert from 'node:assert/strict';
import {journeyEventNames} from '../lib/journey-events';
import {z} from 'zod';

const schema = z.object({
 session: z.string().uuid(),
 name: z.enum(journeyEventNames),
 path: z.string().regex(/^\/[a-z0-9/-]*$/).max(100),
 target: z.string().max(60).optional(),
 referrer: z.string().max(120).optional(),
 landing: z.string().regex(/^\/[a-z0-9/-]*$/).max(100).optional(),
 campaign: z.string().max(120).optional(),
});

test('journey event schema accepts payment and assistant events with attribution', () => {
 const parsed = schema.parse({
  session: '550e8400-e29b-41d4-a716-446655440000',
  name: 'payment_started',
  path: '/checkout',
  target: 'payu',
  referrer: 'https://google.com',
  landing: '/plans',
  campaign: 'utm_source=newsletter',
 });
 assert.equal(parsed.name, 'payment_started');
});
