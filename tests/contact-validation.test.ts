import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizePhone,normalizePhoneField,normalizeOptionalEmail,phoneFromParts} from '../lib/contact-validation';

test('Indian mobiles normalize to E.164',()=>{
 assert.equal(phoneFromParts('91','9876543210'),'+919876543210');
 assert.equal(normalizePhoneField('+919876543210'),'+919876543210');
 assert.throws(()=>phoneFromParts('91','123'));
});

test('optional email rejects invalid addresses',()=>{
 assert.equal(normalizeOptionalEmail(''),'');
 assert.equal(normalizeOptionalEmail('Artist@Example.com'),'artist@example.com');
 assert.throws(()=>normalizeOptionalEmail('not-an-email'));
});
