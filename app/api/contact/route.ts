import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {sameOrigin,json,fail} from '@/lib/api';
import {rateLimit} from '@/lib/limit';
import {mutate} from '@/lib/store';
import {recordContact} from '@/lib/contacts-store';
import {flushImmediateJobs} from '@/lib/delivery';
import {normalizeOptionalEmail,phoneCountryCodeField,phoneFromParts,phoneLocalField,requiredNameField} from '@/lib/contact-validation';

const input=z.object({
 name:requiredNameField,
 countryCode:phoneCountryCodeField,
 phone:phoneLocalField,
 email:z.string().max(254).optional().transform(v=>v?.trim()||''),
 message:z.string().trim().max(1000).default(''),
 source:z.string().max(200).startsWith('/'),
 consent:z.literal(true),
});

export async function POST(req:NextRequest){try{sameOrigin(req);await rateLimit(req,'contact',5);const body=input.parse(await json(req));const phone=phoneFromParts(body.countryCode,body.phone);const email=normalizeOptionalEmail(body.email);const contactId=await mutate(s=>recordContact(s,{name:body.name,phone,email:email||undefined,message:body.message,source:body.source}));
 if(contactId)await flushImmediateJobs([`staff-contact:${contactId}`]);
 return NextResponse.json({ok:true});}catch(e){return fail(e);}}
