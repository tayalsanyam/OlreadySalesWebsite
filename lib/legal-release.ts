import type {Site} from './schema';
import {LEGAL_PRIVACY_V31,LEGAL_REFUNDS_V31,LEGAL_TERMS_V31} from './legal-v31';

export const LEGAL_RELEASE = '3.1-20260501';

export const footerLegalCopy = {
 footerOperator: 'OLREADY is operated by Katalyst Infomedia',
 footerUdyam: 'Udyam registration UDYAM-CH-01-0064870',
 footerCopyright: 'Copyright © 2026 Katalyst Infomedia. All rights reserved.',
 footerPolicyTerms: 'Terms of Use',
 footerPolicyPrivacy: 'Privacy Policy',
 footerPolicyRefunds: 'Refund & Cancellation',
};

function policiesNeedV31(site: Site) {
 if (site.copy.legalRelease === LEGAL_RELEASE) return false;
 const blob = `${site.settings.terms}\n${site.settings.privacy}\n${site.settings.refunds}`;
 return (
  /being finalised|will be published before launch|Please ask our team for the applicable refund/i.test(blob)
  || !/Version 3\.1/.test(blob)
  || !/Effective date: 1 May 2026/.test(blob)
 );
}

/** Publish v3.1 legal policies from Legal Docs and enable checkout once in place. */
export function upgradeLegalV31(site: Site): Site {
 if (!policiesNeedV31(site)) return site;

 site.settings.terms = LEGAL_TERMS_V31;
 site.settings.privacy = LEGAL_PRIVACY_V31;
 site.settings.refunds = LEGAL_REFUNDS_V31;
 site.settings.policiesApproved = true;
 if (!site.settings.supportEmail?.trim()) site.settings.supportEmail = 'care@olready.in';
 site.settings.paymentGateway = 'payu';

 site.copy = {
  ...site.copy,
  ...footerLegalCopy,
  legalRelease: LEGAL_RELEASE,
 };

 const refundsFaq = site.faqs.find((f) => f.id === 'refunds');
 if (refundsFaq && /Review the applicable written terms with the team before you purchase/i.test(refundsFaq.answer)) {
  refundsFaq.answer =
   'Pro and Phoenix purchases follow our published Refund and Cancellation Policy (Version 3.1). Read it at /refunds before checkout. Privy is invitation-only with separate written terms.';
 }

 return site;
}
