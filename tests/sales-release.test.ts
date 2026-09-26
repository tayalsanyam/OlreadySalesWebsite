import {test} from 'node:test';import assert from 'node:assert/strict';
import {seed} from '../lib/seed';import {upgradeSales} from '../lib/sales-release';import {guideAnswer} from '../lib/plan-guide';
test('upgrade corrects legacy tax data without altering the advertised price',()=>{const s=structuredClone(seed);delete s.copy.salesRelease;s.plans[0].taxPercent=0;const price=s.plans[0].pricePaise;upgradeSales(s);assert.equal(s.plans[0].pricePaise,price);assert.equal(s.plans[0].taxPercent,18);assert.equal(s.copy.taxPending,'Includes 18% GST');});
test('versioned upgrade preserves subsequent admin copy and pricing edits',()=>{const s=structuredClone(seed);s.copy.salesProductTitle='My custom title';s.plans[0].pricePaise=2000000;const before=JSON.stringify(s);upgradeSales(s);assert.equal(JSON.stringify(s),before);});
test('profile question is not incorrectly interpreted as Pro',()=>assert.equal(guideAnswer(seed,'How do I create my profile?').topic,'profile'));
test('GST question is answered directly and is inclusive',()=>{const a=guideAnswer(seed,'Does Pro include GST?');assert.equal(a.topic,'tax');assert.match(a.answer,/include 18% GST/);});
test('Privy answer preserves invitation and written terms',()=>{const a=guideAnswer(seed,'Privy');assert.match(a.answer,/invite-only/);assert.match(a.answer,/written conditions/);});
