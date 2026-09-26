import type {Site} from './schema';
import {featuredArtist, publishedArtist} from './artist-catalog';
import {artistPath} from './seo';
import {activeCouponsForFacts, promotionInWindow} from './promotions';

function approvedMetric(site: Site) {
 const now = Date.now();
 return site.metrics
  .filter((m) => m.approved && m.evidence && m.period && Date.parse(m.expires) > now)
  .map((m) => ({value: m.value, label: m.label, period: m.period}));
}

function publicArtists(site: Site) {
 return site.artists
  .filter(publishedArtist)
  .slice(0, 24)
  .map((a) => ({
   name: a.name,
   city: a.city,
   path: artistPath(a),
   featured: featuredArtist(a),
   bio: (a.bio || '').slice(0, 160),
  }));
}

function publicTestimonials(site: Site) {
 return (site.testimonials || [])
  .filter((t) => t.enabled && (t.title || t.caption))
  .slice(0, 12)
  .map((t) => ({title: t.title, caption: t.caption.slice(0, 200)}));
}

function siteNavigation(site: Site) {
 const core = ['/', '/plans', '/how-it-works', '/benefits', '/checkout', '/help', '/about', '/top-grossing-artists'];
 const pages = site.pages
  .filter((p) => core.includes(p.slug) || p.slug.startsWith('/'))
  .map((p) => ({
   path: p.slug,
   title: p.title || p.heading,
   purpose: p.description.slice(0, 120),
  }));
 const artistSamples = site.artists.filter(publishedArtist).slice(0, 8).map((a) => ({path: artistPath(a), name: a.name}));
 return {pages, artistSamples};
}

export function buildAssistantFacts(site: Site, now = Date.now()) {
 return {
  plans: site.plans.filter((p) => p.approved),
  faqs: site.faqs,
  contact: {
   merchantUrl: site.settings.merchantUrl,
   whatsapp: site.settings.whatsapp,
   supportEmail: site.settings.supportEmail,
   supportHours: site.settings.supportHours,
  },
  policies: {terms: '/terms', privacy: '/privacy', refunds: '/refunds'},
  publishedSiteGuide: {
   navigation: siteNavigation(site),
   visitorJourney:
    'Compare plans at /plans → save details and accept terms at /checkout → pay securely on checkout (not in chat) → create or complete artist profile at merchant URL.',
   help: '/help',
   brochure: site.settings.brochureUrl || null,
  },
  metrics: approvedMetric(site),
  artists: publicArtists(site),
  testimonials: publicTestimonials(site),
  activeOffers: activeCouponsForFacts(site, now),
  activePromotions: (site.promotions || [])
   .filter((p) => promotionInWindow(p, now))
   .map((p) => ({
    type: p.type,
    headline: p.headline,
    body: p.body.slice(0, 200),
    pages: p.pages,
    couponCode: p.couponCode || site.coupons.find((c) => c.id === p.couponId)?.code || null,
   })),
 };
}
