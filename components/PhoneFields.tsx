'use client';
import {defaultPhoneCountry,phoneCountryOptions} from '@/lib/contact-validation';

type Props={
 countryCode?:string;
 phoneLocal?:string;
 onCountryCodeChange?:(v:string)=>void;
 onPhoneLocalChange?:(v:string)=>void;
 phoneLabel:string;
 countryLabel?:string;
 required?:boolean;
 idPrefix?:string;
};

export function PhoneFields({countryCode=defaultPhoneCountry,phoneLocal='',onCountryCodeChange,onPhoneLocalChange,phoneLabel,countryLabel='Country code',required=true,idPrefix='phone'}:Props){
 return <div className="phone-fields"><label>{countryLabel}<select name="countryCode" value={countryCode} onChange={e=>onCountryCodeChange?.(e.target.value)} aria-label={countryLabel}>{phoneCountryOptions.map(o=><option key={o.code} value={o.code}>{o.label}</option>)}</select></label><label>{phoneLabel}<input type="tel" name="phoneLocal" inputMode="tel" autoComplete="tel-national" required={required} value={phoneLocal} onChange={e=>onPhoneLocalChange?.(e.target.value)} placeholder="9876543210" maxLength={16} id={idPrefix}/></label></div>;
}
