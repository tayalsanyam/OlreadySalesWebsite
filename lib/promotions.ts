import type {Coupon, Site} from './schema';
import {quote} from './commerce';

export type Promotion = Site['promotions'][number];

const blockedPaths = new Set(['/checkout', '/terms', '/privacy', '/refunds']);

export function promotionPagesMatch(promo: Promotion, path: string) {
 if (blockedPaths.has(path)) return false;
 if (promo.pages === 'all') return true;
 if (promo.pages === 'home') return path === '/';
 if (promo.pages === 'plans') return path === '/plans';
 if (promo.pages === 'home_plans') return path === '/' || path === '/plans';
 return false;
}

export function promotionInWindow(promo: Promotion, now = Date.now()) {
 if (!promo.enabled) return false;
 if (!promo.starts || !promo.ends) return false;
 const start = Date.parse(promo.starts);
 const end = Date.parse(promo.ends);
 if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
 return start <= now && end > now;
}

export function resolvePromotionCoupon(site: Site, promo: Promotion): Coupon | undefined {
 if (promo.couponId) {
  const c = site.coupons.find((x) => x.id === promo.couponId);
  if (c?.enabled) return c;
 }
 if (promo.couponCode?.trim()) {
  const code = promo.couponCode.trim().toUpperCase();
  return site.coupons.find((c) => c.enabled && c.code.toUpperCase() === code);
 }
 return undefined;
}

export function activePromotions(site: Site, path: string, now = Date.now()) {
 return (site.promotions || [])
  .filter((p) => promotionInWindow(p, now) && promotionPagesMatch(p, path))
  .map((p) => ({...p, coupon: resolvePromotionCoupon(site, p)}));
}

export function activeCouponsForFacts(site: Site, now = Date.now()) {
 return site.coupons
  .filter((c) => {
   if (!c.enabled) return false;
   const start = Date.parse(c.starts);
   const end = Date.parse(c.ends);
   if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
   return start <= now && end > now;
  })
  .map((c) => {
   let example = '';
   try {
    const plan = site.plans.find((p) => p.approved && (!c.plans.length || c.plans.includes(p.id)));
    if (plan) example = quote(plan, c, now).discount ? `e.g. saves on ${plan.name}` : '';
   } catch {
    /* omit example if quote fails */
   }
   return {
    code: c.code,
    kind: c.kind,
    value: c.value,
    plans: c.plans.length ? c.plans : ['all plans'],
    minimumPaise: c.minimumPaise,
    ends: c.ends.slice(0, 10),
    note: example,
   };
  });
}

/** One-time: mirror legacy popup settings into a promotion row. */
export function upgradePromotions(site: Site) {
 site.promotions ??= [];
 if (site.settings.promotionsRelease === '1') return site;
 if (!site.promotions.length && site.settings.popupEnabled) {
  const now = new Date();
  const end = new Date(now);
  end.setFullYear(end.getFullYear() + 1);
  site.promotions.push({
   id: crypto.randomUUID(),
   enabled: true,
   type: 'contact_popup',
   headline: site.settings.popupTitle || 'Talk to OLREADY',
   body: site.settings.popupBody || '',
   couponId: '',
   couponCode: '',
   image: '',
   ctaLabel: '',
   pages: 'all',
   starts: now.toISOString(),
   ends: end.toISOString(),
   delaySeconds: site.settings.popupDelay || 30,
  });
 }
 site.settings.promotionsRelease = '1';
 return site;
}
