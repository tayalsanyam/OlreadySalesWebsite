import type {Site} from './schema';
import {money} from './commerce';
import {callbackAcknowledgement,wantsCallbackHandoff} from './assistant-handoff';
export function guideAnswer(s:Site,input:string){
 const q=input.toLowerCase().trim();
 if(wantsCallbackHandoff(input))return {topic:'callback',answer:callbackAcknowledgement(s.settings.supportHours)};
 const explain=(id:string)=>{const p=s.plans.find(p=>p.id===id);if(!p)return 'Our team can help confirm the current plan options.';return `${p.name}: ${p.description}\n${p.approved?`${money(p.pricePaise)}, including ${p.taxPercent}% GST. ${p.term}.`:'Please ask the team for current pricing.'}\n${p.features.join(' · ')}${id==='privy'?'\nPrivy is invite-only. Ask the team for the written conditions of the assured-business offer.':''}`;};
 if(/\bgst\b|\btax(es)?\b/.test(q))return {topic:'tax',answer:'All displayed plan prices include 18% GST. GST is not added again to the displayed price. Any valid discount is applied to that inclusive price.'};
 if(/\b(profile|login|sign in|sign up|register)\b/.test(q))return {topic:'profile',answer:'Your artist profile lives on the existing OLREADY merchant website. Use Artist login or Create your profile to add your portfolio and manage your details. This website helps you understand and select a plan.'};
 if(/\b(what do you do|what is olready|how does|how it works|verified|verification)\b/.test(q))return {topic:'service',answer:s.faqs.find(f=>f.id==='service')?.answer||'OLREADY provides makeup artists with plan-based access to verified bridal and event enquiries. You review relevant requirements and start conversations with prospective clients. Enquiries are not confirmed bookings.'};
 if(/\b(guarantee|guaranteed|assured)\b/.test(q))return {topic:'guarantee',answer:s.faqs.find(f=>f.id==='guarantee')?.answer||'An enquiry is not a confirmed booking. Ask the team for the written conditions of any plan-specific offer.'};
 const plan=s.plans.find(p=>new RegExp('\\b'+p.id+'\\b','i').test(q));
 if(plan)return {topic:plan.id,answer:explain(plan.id)};
 if(/\b(manager|support|pan.india|national|across india)\b/.test(q))return {topic:'phoenix',answer:explain('phoenix')+'\nPhoenix is a starting point if you want pan-India reach and coordination support. Confirm suitability for your city with the team.'};
 if(/\b(local|states|starting|start|budget|affordable)\b/.test(q))return {topic:'pro',answer:explain('pro')+'\nPro is the lowest-priced current plan and focuses on three-state access. Confirm your selected states with the team.'};
 if(/\b(plan|plans|price|prices|cost|compare|choose)\b/.test(q))return {topic:'plans',answer:s.plans.map(p=>`${p.name}: ${p.approved?money(p.pricePaise):'Ask for pricing'} · ${p.term} · ${p.features.find(f=>/verified/.test(f))||p.geography}`).join('\n')+'\nAll displayed prices include 18% GST. Do you want focused geographical access, or pan-India reach with a relationship manager?'};
 const words=q.split(/\W+/).filter(w=>w.length>3);const ranked=s.faqs.map(f=>({f,score:words.filter(w=>(f.question+' '+f.answer).toLowerCase().includes(w)).length})).sort((a,b)=>b.score-a.score);
 if(ranked[0]?.score>=2)return {topic:'faq',answer:ranked[0].f.answer};
 return {topic:'handoff',answer:'Our team can help check the fit for your city and the clients you want to reach. Use Human support below to continue on WhatsApp. You can also ask me about verified enquiries, GST, Pro, Phoenix or Privy.'};
}
