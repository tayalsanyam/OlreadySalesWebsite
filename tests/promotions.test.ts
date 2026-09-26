import test from 'node:test';
import assert from 'node:assert/strict';
import {seed} from '../lib/seed';
import {activePromotions, activeCouponsForFacts, promotionPagesMatch, upgradePromotions} from '../lib/promotions';

test('promotion page targeting respects checkout blocklist', () => {
 const promo = seed.promotions[0] || {
  id: '1',
  enabled: true,
  type: 'coupon_modal' as const,
  headline: 'Test',
  body: '',
  couponId: '',
  couponCode: 'SAVE10',
  image: '',
  ctaLabel: '',
  pages: 'all' as const,
  starts: new Date().toISOString(),
  ends: new Date(Date.now() + 86400000).toISOString(),
  delaySeconds: 10,
 };
 assert.equal(promotionPagesMatch({...promo, pages: 'all'}, '/plans'), true);
 assert.equal(promotionPagesMatch({...promo, pages: 'home'}, '/'), true);
 assert.equal(promotionPagesMatch({...promo, pages: 'home'}, '/plans'), false);
 assert.equal(promotionPagesMatch({...promo, pages: 'all'}, '/checkout'), false);
});

test('active coupons for facts respect enabled window', () => {
 const site = structuredClone(seed);
 const now = Date.now();
 site.coupons = [
  {
   id: 'c1',
   code: 'FEST',
   kind: 'percent',
   value: 10,
   maxDiscountPaise: null,
   minimumPaise: 0,
   plans: [],
   starts: new Date(now - 86400000).toISOString(),
   ends: new Date(now + 86400000).toISOString(),
   limit: 100,
   perCustomer: 1,
   enabled: true,
  },
 ];
 const offers = activeCouponsForFacts(site, now);
 assert.equal(offers.length, 1);
 assert.equal(offers[0].code, 'FEST');
});

test('upgrade migrates legacy popup into promotions once', () => {
 const site = structuredClone(seed);
 site.promotions = [];
 site.settings.popupEnabled = true;
 site.settings.popupTitle = 'Hello';
 upgradePromotions(site);
 assert.equal(site.promotions.length, 1);
 assert.equal(site.promotions[0].type, 'contact_popup');
 upgradePromotions(structuredClone(site));
 assert.equal(site.settings.promotionsRelease, '1');
});
