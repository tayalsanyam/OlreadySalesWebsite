import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {sameOrigin,json,fail} from '@/lib/api';
import {rateLimit} from '@/lib/limit';
import {mutate,readState} from '@/lib/store';
import {recordContact} from '@/lib/contacts-store';
import {flushImmediateJobs} from '@/lib/delivery';
import {normalizeOptionalEmail,phoneCountryCodeField,phoneFromParts,phoneLocalField,optionalNameField} from '@/lib/contact-validation';

const input=z.object({
 countryCode:phoneCountryCodeField,
 phone:phoneLocalField,
 name:optionalNameField,
 email:z.string().max(254).optional().transform(v=>v?.trim()||''),
 consent:z.literal(true),
 source:z.string().max(200).startsWith('/').optional(),
});

export async function POST(req:NextRequest){
 try{
  sameOrigin(req);
  await rateLimit(req,'brochure',8);
  const body=input.parse(await json(req));
  const phone=phoneFromParts(body.countryCode,body.phone);
  const email=normalizeOptionalEmail(body.email);
  const state=await readState();
  const url=state.published.settings.brochureUrl?.trim();
  if(!url)throw new Error('The plan brochure is not available yet. Please contact our team.');
  const contactId=await mutate(s=>recordContact(s,{
   name:body.name||'Brochure download',
   phone,
   email:email||undefined,
   message:'Plan brochure download',
   source:body.source||'/brochure',
  }));
  if(contactId)await flushImmediateJobs([`staff-contact:${contactId}`]);
  return NextResponse.json({ok:true,url});
 }catch(e){return fail(e);}
}
