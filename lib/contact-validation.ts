import {z} from 'zod';

export const phoneCountryOptions=[{code:'91',label:'India (+91)'},{code:'971',label:'UAE (+971)'},{code:'1',label:'US / Canada (+1)'},{code:'44',label:'UK (+44)'},{code:'61',label:'Australia (+61)'}] as const;
export const defaultPhoneCountry='91';

export function digitsOnly(value:string){return value.replace(/\D/g,'');}

/** Normalize to E.164 (+…, 10–15 digits after +). */
export function normalizePhone(countryCode:string,localNumber:string):string{
 const cc=digitsOnly(countryCode);
 let local=digitsOnly(localNumber);
 if(!cc||cc.length>3)throw new Error('Choose a valid country code.');
 if(local.startsWith('0'))local=local.replace(/^0+/,'');
 if(local.startsWith(cc)&&local.length>cc.length+6)local=local.slice(cc.length);
 const full=cc+local;
 if(!/^\d{10,15}$/.test(full))throw new Error('Enter a valid mobile number for the selected country.');
 return '+'+full;
}

export function normalizePhoneField(value:string):string{
 const trimmed=value.trim();
 if(!trimmed)throw new Error('Phone number is required.');
 if(trimmed.startsWith('+')){const d=digitsOnly(trimmed);if(d.length<10||d.length>15)throw new Error('Enter a valid phone number with country code.');return '+'+d;}
 return normalizePhone(defaultPhoneCountry,trimmed);
}

export function normalizeOptionalEmail(value:unknown):string{
 const raw=typeof value==='string'?value.trim():'';
 if(!raw)return '';
 const parsed=z.string().email().max(254).safeParse(raw.toLowerCase());
 if(!parsed.success)throw new Error('Enter a valid email address or leave it blank.');
 return parsed.data;
}

export const phoneCountryCodeField=z.string().trim().regex(/^\d{1,3}$/,'Choose a country code.');
export const phoneLocalField=z.string().trim().min(6).max(16);
export const optionalNameField=z.string().trim().max(100).optional().transform(v=>v||'');
export const requiredNameField=z.string().trim().min(1).max(100);

export function phoneFromParts(countryCode:string,phoneLocal:string){return normalizePhone(countryCode,phoneLocal);}

const GSTIN_RE=/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

/** Optional Indian GSTIN (15 characters). Empty is allowed. */
export function normalizeOptionalGstin(value:unknown):string{
 const raw=typeof value==='string'?value.trim().toUpperCase().replace(/\s/g,''):'';
 if(!raw)return '';
 if(raw.length!==15||!GSTIN_RE.test(raw))throw new Error('Enter a valid 15-character GSTIN or leave this blank.');
 return raw;
}

export function splitPhone(stored:string){const d=digitsOnly(stored);if(!d)return {countryCode:defaultPhoneCountry,local:''};const codes=[...phoneCountryOptions].map(o=>o.code).sort((a,b)=>b.length-a.length);for(const code of codes)if(d.startsWith(code))return {countryCode:code,local:d.slice(code.length)};return {countryCode:defaultPhoneCountry,local:d};}
