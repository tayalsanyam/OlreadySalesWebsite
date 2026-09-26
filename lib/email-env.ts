/** Resend sender and delivery flags shared by API routes and the job runner. */
export function emailFrom():string{
 return (process.env.EMAIL_FROM||process.env.RESEND_FROM_EMAIL||'').trim();
}

export function emailDeliveryEnabled():boolean{
 return process.env.EMAIL_DELIVERY_ENABLED==='true';
}

export function resendConfigured():boolean{
 return Boolean(process.env.RESEND_API_KEY?.trim()&&emailFrom());
}

/** Local dev only: when set, all outbound messages go here and the subject notes the real recipient(s). */
export function applyTestRecipient(to:string[],subject:string){
 if(process.env.NODE_ENV!=='development'||process.env.VERCEL)return {to,subject};
 const test=process.env.EMAIL_TEST_RECIPIENT?.trim();
 if(!test||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(test))return {to,subject};
 const intended=to.join(', ');
 if(to.length===1&&to[0].toLowerCase()===test.toLowerCase())return {to,subject};
 return {to:[test],subject:`[TEST] ${subject}${intended?` (intended: ${intended})`:''}`};
}
