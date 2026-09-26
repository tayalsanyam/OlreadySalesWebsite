'use client';
import {useState} from 'react';
import {ArrowRight,FilePdf} from '@phosphor-icons/react';
import type {Site} from '@/lib/schema';
import {defaultPhoneCountry} from '@/lib/contact-validation';
import {PhoneFields} from './PhoneFields';

export function BrochureDownload({site}:{site:Site}){
 const c=site.copy;
 const url=site.settings.brochureUrl?.trim();
 if(!url)return null;
 const [countryCode,setCountryCode]=useState(defaultPhoneCountry);
 const [phoneLocal,setPhoneLocal]=useState('');
 const [status,setStatus]=useState('');
 const [busy,setBusy]=useState(false);
 return <section className="section brochure-download" id="brochure"><div><p className="eyebrow">{c.brochureEyebrow}</p><h2>{c.brochureTitle}</h2><p>{c.brochureBody}</p></div><form className="brochure-form" onSubmit={async e=>{e.preventDefault();setBusy(true);setStatus('');const form=e.currentTarget;const f=new FormData(form);try{const res=await fetch('/api/brochure',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({countryCode:f.get('countryCode'),phone:f.get('phoneLocal'),name:f.get('name'),email:f.get('email'),consent:f.get('consent')==='on',source:window.location.pathname+'#brochure'})});const data=await res.json();if(!res.ok)throw new Error(data.error||'Unable to start download.');window.open(data.url,'_blank','noopener,noreferrer');setStatus(c.brochureSuccess);form.reset();setCountryCode(defaultPhoneCountry);setPhoneLocal('');}catch(err){setStatus((err as Error).message||c.brochureFailure);}finally{setBusy(false);}}}><label>{c.brochureName}<input name="name" autoComplete="name" maxLength={100}/></label><label>{c.brochureEmail}<input name="email" type="email" autoComplete="email" maxLength={254}/></label><PhoneFields countryCode={countryCode} phoneLocal={phoneLocal} onCountryCodeChange={setCountryCode} onPhoneLocalChange={setPhoneLocal} phoneLabel={c.brochurePhone} idPrefix="brochure-phone"/><label className="check"><input name="consent" type="checkbox" required/>{c.brochureConsent}</label><button className="button primary" disabled={busy}><FilePdf size={20}/>{busy?'Preparing…':c.brochureButton}<ArrowRight/></button><p role="status">{status}</p></form></section>;
}
