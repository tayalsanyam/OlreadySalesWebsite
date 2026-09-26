import {rateLimit} from '@/lib/limit';
import {NextRequest,NextResponse} from 'next/server';import {cookies} from 'next/headers';import {mutate,readState} from '@/lib/store';import {quote} from '@/lib/commerce';import {hash,secret} from '@/lib/secrets';import {sameOrigin,json,fail} from '@/lib/api';import {z} from 'zod';
import {normalizeOptionalEmail,normalizeOptionalGstin,normalizePhoneField,phoneCountryCodeField,phoneFromParts,phoneLocalField} from '@/lib/contact-validation';
import {resolveCheckoutCartFromCookie} from '@/lib/cart-rotate-server';
const input=z.object({intent:z.enum(['full','coupon']).optional(),planId:z.enum(['pro','phoenix','privy']),email:z.string().trim().max(254).default(''),name:z.string().trim().max(100).default(''),countryCode:phoneCountryCodeField.optional(),phone:z.string().trim().max(16).default(''),business:z.string().max(160).default(''),gstin:z.string().max(20).default(''),marketing:z.boolean().default(false),terms:z.boolean().default(false),coupon:z.string().max(50).default('')}).transform(d=>{const email=d.email?normalizeOptionalEmail(d.email):'';let phone='';if(d.phone){if(d.countryCode)phone=phoneFromParts(d.countryCode,d.phone);else phone=normalizePhoneField(d.phone);}const gstin=normalizeOptionalGstin(d.gstin);return {...d,email,phone,gstin};});

function resolveCoupon(s:Awaited<ReturnType<typeof readState>>,code:string){
 const trimmed=code.trim();
 if(!trimmed)return undefined;
 const coupon=s.published.coupons.find(c=>c.code.toLowerCase()===trimmed.toLowerCase());
 if(!coupon)throw new Error('Offer code not recognised');
 return coupon;
}

function assertCouponRedemption(s:Awaited<ReturnType<typeof readState>>,coupon:NonNullable<ReturnType<typeof resolveCoupon>>,email:string){
 const used=s.carts.filter(c=>c.status==='paid'&&c.coupon.toLowerCase()===coupon.code.toLowerCase());
 const em=email.toLowerCase();
 if(used.length>=coupon.limit)throw new Error('Offer redemption limit reached');
 if(em&&used.filter(c=>c.email.toLowerCase()===em).length>=coupon.perCustomer)throw new Error('Offer redemption limit reached');
 const reserved=s.orders?.filter(o=>o.coupon?.id===coupon.id&&o.status!=='cancelled'&&['pending','creating','paid','partially_refunded','refunded','needs_review'].includes(o.status))||[];
 if(reserved.length>=coupon.limit)throw new Error('Offer redemption limit reached');
 if(em&&reserved.filter(o=>o.customer.email.toLowerCase()===em).length>=coupon.perCustomer)throw new Error('Offer redemption limit reached');
}
export async function GET(){try{const resolved=await resolveCheckoutCartFromCookie();return NextResponse.json(resolved,{headers:{'Cache-Control':'no-store'}});}catch(e){return fail(e);}}
export async function POST(req:NextRequest){try{sameOrigin(req);await rateLimit(req,'cart',120);const data=input.parse(await json(req));const intent=data.intent==='coupon'?'coupon':'full';const jar=await cookies();const token=jar.get('olready_cart')?.value||secret();const result=await mutate(s=>{const p=s.published.plans.find(p=>p.id===data.planId);if(!p)throw new Error('Plan not found');let cart=s.carts.find(c=>c.tokenHash===hash(token));if(cart&&cart.status!=='open')throw new Error('This cart can no longer be changed');const now=new Date().toISOString();if(intent==='coupon'){const coupon=data.coupon.trim()?resolveCoupon(s,data.coupon):undefined;if(data.coupon.trim()&&!coupon)throw new Error('Offer code not recognised');const emailForLimit=data.email||cart?.email||'';if(coupon)assertCouponRedemption(s,coupon,emailForLimit);const totals=quote(p,coupon);if(!cart){cart={id:crypto.randomUUID(),tokenHash:hash(token),planId:p.id,planVersion:p.version,email:'',name:'',phone:'',business:'',gstin:'',marketing:false,terms:false,coupon:'',...totals,status:'open',created_at:now,updated_at:now};s.carts.push(cart);}else{cart.planId=p.id;cart.planVersion=p.version;cart.coupon=coupon?coupon.code:'';Object.assign(cart,totals,{updated_at:now});}const {tokenHash,...safe}=cart;return safe;}const coupon=data.coupon.trim()?resolveCoupon(s,data.coupon):undefined;if(data.coupon.trim()&&!coupon)throw new Error('Offer code not recognised');if(coupon)assertCouponRedemption(s,coupon,data.email||cart?.email||'');const totals=quote(p,coupon);if(!cart){cart={id:crypto.randomUUID(),tokenHash:hash(token),planId:p.id,planVersion:p.version,email:'',name:'',phone:'',marketing:false,terms:false,coupon:'',...totals,status:'open',created_at:now,updated_at:now};s.carts.push(cart);}Object.assign(cart,data,totals,{planVersion:p.version,updated_at:now});const {tokenHash,...safe}=cart;return safe;});jar.set('olready_cart',token,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:60*60*24*30});return NextResponse.json({cart:result});}catch(e){return fail(e);}}
