import type {Site} from './schema';
export const conversionCopy={
 salesGuideEnquiries:'What does OLREADY do?',salesGuideCompare:'Compare the plans',salesGuideTax:'Is GST included?',salesEyebrow:'VERIFIED ENQUIRIES FOR MAKEUP ARTISTS',salesTitle:'Your artistry.\nMore client conversations.',salesBody:'OLREADY connects makeup artists with verified bridal and event enquiries. Choose your reach, access requirements on your artist dashboard, and speak directly with prospective clients.',salesPrimary:'Compare plans',salesSecondary:'See how it works',salesMicro:'',
 salesProductLabel:'YOUR NEXT CONVERSATION STARTS HERE',salesProductTitle:'A client requirement.\nA chance to show your work.',salesProductBody:'Understand the occasion, location and requirement. Find the right fit, share your portfolio and discuss the client’s brief.',salesIllustration:'Illustrative enquiry preview—not a live client or a screenshot of the merchant dashboard.',salesBriefTitle:'Bridal makeup enquiry',salesBriefLocation:'Location & occasion',salesBriefLocationValue:'Check the client’s requirements',salesBriefDate:'Date & availability',salesBriefDateValue:'Find a fit for your calendar',salesBriefBudget:'Services & expectations',salesBriefBudgetValue:'Discuss the brief with the client',salesBriefStatus:'Verified enquiry',salesBriefAction:'Explore the process',
 salesProcessEyebrow:'FROM ENQUIRY TO CONVERSATION',salesProcessTitle:'You bring the talent.\nHere’s how we connect it.',salesStep1:'We verify enquiries',salesStep1Body:'Bridal and event requirements pass through OLREADY’s three-stage verification process.',salesStep2:'You find relevant briefs',salesStep2Body:'Explore dashboard enquiries within your plan’s allowance and geographical access.',salesStep3:'You start the conversation',salesStep3Body:'Share your work, discuss availability and work towards a booking. Results depend on your fit and follow-up.',
 salesBenefitsTitle:'More than visibility.\nA reason to connect.',salesBenefitsBody:'A portfolio shows your style. A relevant enquiry gives you a conversation to start. Choose access and support around the business you want to build.',salesBenefitsEyebrow:'WHAT YOUR PLAN MAKES POSSIBLE',salesBenefit1:'An enquiry with a purpose.',salesBenefit1Body:'Connect around a bridal or event requirement. Bring your portfolio into a conversation about what the client needs.',salesBenefit2:'Reach that fits your ambition.',salesBenefit2Body:'Choose three-state access with Pro, or pan-India access with Phoenix and Privy. Confirm the locations you serve before choosing.',salesBenefit3:'Support in your corner.',salesBenefit3Body:'Phoenix and Privy include a dedicated relationship manager for coordination support through the booking journey.',salesBenefit4:'Your work. Your conversation.',salesBenefit4Body:'Create your artist profile, show your portfolio and discuss the client’s brief, your availability and your services.',salesBenefitsCta:'Choose your enquiry plan',salesSupportLabel:'DEDICATED RELATIONSHIP MANAGER',salesSupportCaption:'Included with Phoenix & Privy',
 salesPlansEyebrow:'CHOOSE YOUR NEXT MOVE',salesPlansTitle:'A clear plan.\nA bigger opportunity.',salesPlansBody:'Compare your enquiry allowance, duration and reach. Every price below includes 18% GST.',salesPlanPro:'For focused geographical reach',salesPlanPhoenix:'For pan-India reach with support',salesPlanPrivy:'For an invite-only partnership',salesPlanButton:'Review this plan',salesPlanDetails:'See full plan terms',salesPlanNote:'Enquiries are opportunities to connect, not confirmed bookings. Privy’s assured-business offer is subject to written eligibility and fulfilment terms.',salesHuman:'Need help choosing?',salesHumanBody:'Tell us where you work and the kind of clients you want to reach.',salesHumanButton:'Discuss my fit on WhatsApp',salesJoinTitle:'Your next steps, made clear.',salesJoin1:'Choose your plan',salesJoin1Body:'Compare inclusions and review the plan that fits your business.',salesJoin2:'Confirm & pay',salesJoin2Body:'Add your details on checkout and pay securely—or save your selection and WhatsApp us if you want guidance first.',salesJoin3:'Complete your artist profile',salesJoin3Body:'Create or sign in to your OLREADY merchant profile and add your portfolio.',salesJoinProfile:'Create or log in to your profile',salesProofTitle:'See the experience behind the numbers.',salesProofBody:'Ask our team for available artist references and the context behind their results before deciding.',salesProofButton:'Ask for artist references',salesFinalTitle:'Ready to put your\nartistry in the conversation?',salesFinalBody:'Choose the enquiry access and support that fit where you want to take your business.',salesTax:'Includes 18% GST',salesCheckoutEyebrow:'ONE STEP AWAY',salesCheckoutTitle:'You’re one step from your next chapter.',salesCheckoutBody:'Lock in your plan and how we reach you. Your GST-inclusive total is on the right—pay securely when you’re ready. Prefer a conversation first? WhatsApp our team below.',salesCheckoutSave:'Save my selection',salesCheckoutNext:'Talk on WhatsApp',salesCheckoutSaved:'Saved. Complete payment on the right, or message us on WhatsApp if you need help.',salesCheckoutPrivyTitle:'Invite-only',salesCheckoutPrivyBody:'Privy is by invitation only—online payment is not available on this page. Save your details if useful, then request an invitation on WhatsApp and our team will guide eligibility and payment.',salesFaqEmpty:'No matching answers. Try “plans”, “GST” or “profile”, or ask us on WhatsApp.',
};
/** One-time content upgrade; a persisted version marker preserves subsequent admin edits. */
export function upgradeSales(site:Site):Site{
 if(site.copy.salesRelease==='6')return site;
 site.copy={...site.copy,...conversionCopy,salesRelease:'6',taxPending:'Includes 18% GST',plansNote:conversionCopy.salesPlanNote,checkoutSave:conversionCopy.salesCheckoutSave,checkoutDiscuss:conversionCopy.salesCheckoutNext,closingBody:'Choose your enquiry access, understand the inclusions and start your next chapter with OLREADY.',pitchPlansTitle:conversionCopy.salesPlansTitle,pitchPlansBody:conversionCopy.salesPlansBody};
 site.plans=site.plans.map(p=>({...p,description:({pro:'For focused geographical reach across three states.',phoenix:'For pan-India reach with a dedicated relationship manager.',privy:'An invite-only partnership with pan-India reach and dedicated support.'})[p.id],taxPercent:18,version:p.version+1,features:p.features.map(f=>f.replace(/verified leads/gi,'verified enquiries')),leadModel:p.leadModel.replace(/verified leads/gi,'verified enquiries')}));
 const home=site.pages.find(p=>p.slug==='/');if(home)Object.assign(home,{heading:'Your artistry.',accent:'More client conversations.',body:conversionCopy.salesBody,eyebrow:conversionCopy.salesEyebrow,primaryLabel:'Compare plans',primaryHref:'/plans',secondaryLabel:'See how it works',secondaryHref:'/how-it-works',description:conversionCopy.salesBody});
 site.settings.checkoutHeading=conversionCopy.salesCheckoutTitle;site.settings.checkoutBody=conversionCopy.salesCheckoutBody;site.settings.paymentDisabled='Online checkout is temporarily unavailable. Save your details and WhatsApp our team.';site.settings.planButton='Review this plan';site.settings.emptyArtists=conversionCopy.salesProofBody;
 site.assistant.greeting='Hi, I’m your OLREADY plan guide. I can explain verified enquiries, compare plans and connect you with our team. Where would you like to start?';
 site.faqs=site.faqs.map(f=>f.id==='tax'?{...f,question:'Are the plan prices inclusive of GST?',answer:'Yes. All displayed plan prices include 18% GST. GST is not added again at checkout.'}:f.id==='payment'?{...f,answer:'Yes. On checkout, confirm your plan and contact details, then pay securely with our payment partner. Your plan activates after successful payment. Questions? WhatsApp our team anytime.'}:{...f,answer:f.answer.replace(/verified leads/gi,'verified enquiries')});
 const add=[{id:'service',question:'What exactly does OLREADY provide?',answer:'OLREADY gives makeup artists plan-based access to verified bridal and event enquiries. You review relevant requirements on your merchant dashboard and contact prospective clients. Your plan defines enquiry allowance, geographical access and support.',category:'Getting started'},{id:'verification',question:'What does a verified enquiry mean?',answer:'An enquiry goes through OLREADY’s three-stage verification process before being shared on the dashboard. It is a prospective client requirement, not a confirmed booking. Ask our team for the specific verification checks and enquiry-sharing rules.',category:'Enquiries'},{id:'support-inclusions',question:'Which plans include a relationship manager?',answer:'Phoenix and Privy include a dedicated relationship manager for coordination support through the booking journey. Pro focuses on enquiry access across three states.',category:'Plans'}];
 for(const f of add)if(!site.faqs.some(x=>x.id===f.id))site.faqs.push(f);
 return site;
}

const legacyCheckoutBody='Review your plan and save your details. Then continue on WhatsApp to discuss your selection with our team. Online payment is coming later.';

const checkoutCopyV2={
 eyebrow:'ONE STEP AWAY',
 title:'You’re one step from your next chapter.',
 body:'Lock in your plan and how we reach you. Your GST-inclusive total is on the right—pay securely when you’re ready. Prefer a conversation first? WhatsApp our team below.',
 pageHeading:'Complete your plan',
 pageBody:'Secure checkout for OLREADY enquiry access.',
};

function checkoutFormCopyStale(site:Site){
 const {checkoutHeading,checkoutBody}=site.settings;
 return checkoutBody===legacyCheckoutBody
  ||checkoutHeading==='Your details'
  ||/Online payment is coming later|continue on WhatsApp to discuss your selection|Pay securely on the right when you are ready/i.test(checkoutBody)
  ||/No payment is taken here yet|leave your contact details/i.test(checkoutBody);
}

/** Refresh checkout wording for live payment (preserves other admin edits). */
export function upgradeCheckoutOnline(site:Site){
 const c=conversionCopy;
 const release=site.copy.checkoutOnlineRelease||'0';
 if(release==='2'){
  if(!site.copy.salesCheckoutPrivyTitle)site.copy.salesCheckoutPrivyTitle=c.salesCheckoutPrivyTitle;
  if(!site.copy.salesCheckoutPrivyBody)site.copy.salesCheckoutPrivyBody=c.salesCheckoutPrivyBody;
  return site;
 }

 if(release<'2'&&checkoutFormCopyStale(site)){
  site.settings.checkoutHeading=c.salesCheckoutTitle;
  site.settings.checkoutBody=c.salesCheckoutBody;
 }
 if(release<'2'){
  site.copy.salesCheckoutEyebrow=c.salesCheckoutEyebrow;
  if(!site.copy.salesCheckoutPrivyTitle)site.copy.salesCheckoutPrivyTitle=c.salesCheckoutPrivyTitle;
  if(!site.copy.salesCheckoutPrivyBody)site.copy.salesCheckoutPrivyBody=c.salesCheckoutPrivyBody;
  if(!site.copy.salesCheckoutSaved||site.copy.salesCheckoutSaved.includes('No payment has been taken')||site.copy.salesCheckoutSaved.startsWith('Saved. You can pay'))site.copy.salesCheckoutSaved=c.salesCheckoutSaved;
  if(site.copy.salesJoin2Body?.includes('online payment is being prepared'))site.copy.salesJoin2Body=c.salesJoin2Body;
  if(site.copy.salesJoin2==='Confirm the details')site.copy.salesJoin2=c.salesJoin2;
  const checkoutPage=site.pages.find(p=>p.slug==='/checkout');
  if(checkoutPage&&(/No payment is taken here yet|leave your contact details/i.test(checkoutPage.body)||checkoutPage.heading==='Review your plan.')){
   checkoutPage.heading=checkoutCopyV2.pageHeading;
   checkoutPage.body=checkoutCopyV2.pageBody;
   checkoutPage.eyebrow=checkoutCopyV2.eyebrow;
  }
  const paymentFaq=site.faqs.find(f=>f.id==='payment');
  if(paymentFaq&&/not enabled yet|not available yet|Online payments are not/i.test(paymentFaq.answer)){
   paymentFaq.answer='Yes. On checkout, confirm your plan and contact details, then pay securely with our payment partner. Your plan activates after successful payment. Questions? WhatsApp our team anytime.';
  }
 }
 if(/not enabled yet|not available yet|coming later/i.test(site.settings.paymentDisabled||'')){
  site.settings.paymentDisabled='Online checkout is temporarily unavailable. Save your details and WhatsApp our team.';
 }
 if(site.copy.salesCheckoutNext==='Continue with OLREADY on WhatsApp')site.copy.salesCheckoutNext=c.salesCheckoutNext;
 if(!site.copy.salesCheckoutPrivyTitle)site.copy.salesCheckoutPrivyTitle=c.salesCheckoutPrivyTitle;
 if(!site.copy.salesCheckoutPrivyBody)site.copy.salesCheckoutPrivyBody=c.salesCheckoutPrivyBody;
 site.copy.checkoutOnlineRelease='2';
 return site;
}
