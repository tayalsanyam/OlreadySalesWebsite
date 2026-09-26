import {upgradeSEO} from './seo';
import type {Site,Page} from './schema';
export const refinementCopy={
 aboutMessageLabel:'A message from Kanika',aboutTeamTitle:'Meet the team',aboutTeamBody:'The people behind your OLREADY experience.',
 benefitRmLabel:'Relationship Manager',benefitCompareEyebrow:'LOOK BEYOND A LIST OF NUMBERS',benefitCompareTitle:'An enquiry deserves more than a phone number.',benefitCompareBody:'Compare the process behind the contact—not just the price of access.',benefitCompareFeature:'What matters',benefitCompareOlready:'OLREADY',benefitCompareDatabase:'Database providers',benefitCompareOther:'Other brands',benefitCompareNote:'A buying checklist, not a rating of named competitors. Provider processes vary: confirm each feature and its written terms directly.',
 benefitCompare1:'Three-step verification',benefitCompare1Value:'Three-stage verification before sharing',benefitCompare1Database:'Ask whether each requirement is verified',benefitCompare1Other:'Check the verification process',
 benefitCompare2:'Lead delisting',benefitCompare2Value:'Delisting helps limit repeated outreach',benefitCompare2Database:'Ask how contacts are retired',benefitCompare2Other:'Check delisting and sharing rules',
 benefitCompare3:'Active enquiries',benefitCompare3Value:'Only active leads on the dashboard',benefitCompare3Database:'Check when intent was last confirmed',benefitCompare3Other:'Check how inactive leads are removed',
 benefitCompare4:'Relationship manager',benefitCompare4Value:'Included with Phoenix & Privy',benefitCompare4Database:'Ask whether support is included',benefitCompare4Other:'Check support by plan',
 benefitCompare5:'Non-responsive leads',benefitCompare5Value:'Lead reversal on eligible plans, as per policy',benefitCompare5Database:'Ask about replacement terms',benefitCompare5Other:'Check eligibility and reversal policy',
 roiEyebrow:'PUT THE NUMBERS IN PERSPECTIVE',roiTitle:'What could a few conversations become?',roiBody:'Explore an illustration using a 5–10% conversion rate and ₹25,000 average booking value. Adjust the assumptions to suit your business.',roiPlanLabel:'Your plan',roiRateLabel:'Illustrative conversion rate',roiValueLabel:'Average booking value (₹)',roiBookingsLabel:'Illustrative bookings',roiRevenueLabel:'Gross booking value',roiFeeLabel:'Plan price, including GST',roiDifferenceLabel:'Gross value less plan price',roiDisclaimer:'Illustration only—not a forecast or guaranteed ROI. Fractional bookings are mathematical averages. Gross booking value is not profit: delivery costs, travel, taxes and other expenses are excluded. Actual results depend on demand, pricing, availability and follow-up.',
 contactEyebrow:'LET’S TALK ABOUT YOUR BUSINESS',contactTitle:'Want us to contact you?',contactBody:'Leave your details and the OLREADY team can help you understand plans and enquiry access.',contactName:'Your name',contactPhone:'Mobile number',contactEmail:'Email (optional)',contactMessage:'What would you like help with?',contactConsent:'I agree to be contacted by OLREADY about this request.',contactButton:'Request a conversation',contactSuccessTitle:'Thank you — we’ve received your request',contactSuccessBody:'A member of the OLREADY team will reach out shortly using the contact details you provided.',contactSuccessWhatsapp:'Prefer WhatsApp?',contactSubmitAnother:'Send another request',contactSuccess:'Thank you — we’ve received your request. Our team will reach out shortly.',contactFailure:'We couldn’t save your request. Please try again, or message us on WhatsApp.',contactDismiss:'Maybe later',brochureEyebrow:'PLAN BROCHURE',brochureTitle:'Download the OLREADY plan brochure',brochureBody:'Share your mobile number to open the PDF. Name and email are optional if you would like a follow-up.',brochureName:'Your name (optional)',brochureEmail:'Email (optional)',brochurePhone:'Mobile number',brochureConsent:'I agree OLREADY may contact me about plans and offers using these details.',brochureButton:'Download brochure',brochureSuccess:'Your download should open in a new tab. Our team may follow up on WhatsApp or email.', brochureFailure:'We could not start your download. Please try again or contact us on WhatsApp.',assistantIntakeTitle:'Before we chat',assistantIntakeBody:'Share your name and mobile number so our team can follow up if needed.',assistantIntakeConsent:'I agree OLREADY may contact me about plans using these details.',assistantIntakeButton:'Start chatting',assistantIntakeFailure:'We could not start the assistant. Please try again or contact us on WhatsApp.',navAbout:'About us',footerExplore:'Explore OLREADY',footerContact:'Let’s connect',footerLegal:'The details',
};
export function upgradeV7(site:Site){
 upgradeSEO(site);
 site.copy={...refinementCopy,...site.copy};
 if(site.copy.refinementRelease==='7')return;
 if(!site.pages.some(p=>p.slug==='/about')){const page:Page={slug:'/about',title:'About OLREADY',description:'Meet the people behind OLREADY.',eyebrow:'THE PEOPLE BEHIND THE PLATFORM',heading:'Built around the people behind the brush.',accent:'',body:'OLREADY brings makeup artists closer to client enquiries, with plan options and human support for the next step in their business.',primaryLabel:'Talk to our team',primaryHref:'/help',secondaryLabel:'Explore plans',secondaryHref:'/plans',sections:[{id:'kanika',eyebrow:'MEET KANIKA',title:'Kanika Khanna',body:'Our focus is simple: help makeup artists understand the opportunity, find a plan that fits, and approach their next client conversation with confidence.',image:'',button:'Talk to OLREADY',href:'/help'}]};site.pages.push(page);}
 for(const p of site.plans)if(!p.features.some(f=>/all lead budgets/i.test(f)))p.features.push('All lead budgets accessible');
 if(site.copy.benefitMatchBudget==='Your budget preference')site.copy.benefitMatchBudget='All lead budgets';
 site.copy.benefitMatchBody='Review location, your availability and the client’s stated budget. All lead budgets are accessible; the example below lets you explore location and date.';
 site.copy.demoBody='Explore sample enquiries by location and date. Each card shows the client’s stated budget for you to review.';
 site.copy.demoButton='Try the enquiry demo';
 site.copy.navHelp='Help & contact';
 site.settings.popupEnabled=true;site.settings.popupDelay=25;
 site.settings.popupTitle=refinementCopy.contactTitle;site.settings.popupBody=refinementCopy.contactBody;
 site.copy.refinementRelease='7';
}
/** Keeps contact confirmation copy current without resetting other admin edits. */
export function upgradeContactFeedback(site:Site){
 const d=refinementCopy;
 const c=site.copy;
 if(c.contactFeedbackRelease==='2')return;
 c.contactSuccessTitle=d.contactSuccessTitle;
 c.contactSuccessBody=d.contactSuccessBody;
 c.contactSuccessWhatsapp=d.contactSuccessWhatsapp;
 c.contactSubmitAnother=d.contactSubmitAnother;
 c.contactSuccess=d.contactSuccess;
 c.contactFailure=d.contactFailure;
 c.contactFeedbackRelease='2';
}
