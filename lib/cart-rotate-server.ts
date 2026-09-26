import 'server-only';
import {cookies} from 'next/headers';
import {mutate,readState} from './store';
import {hash,secret} from './secrets';
import {startFreshCartAfterPaid,type LastOrderSummary} from './cart-session';
import type {Cart} from './schema';

const cookieOpts={httpOnly:true,sameSite:'lax' as const,secure:process.env.NODE_ENV==='production',path:'/',maxAge:60*60*24*30};

export type CheckoutCartResponse={cart:Omit<Cart,'tokenHash'>|null;renewed:boolean;lastOrder:LastOrderSummary|null};

/** B: paid cart → new open session (new cookie). Same cart if still open/pending. */
export async function resolveCheckoutCartFromCookie():Promise<CheckoutCartResponse>{
 const jar=await cookies();
 const raw=jar.get('olready_cart')?.value;
 if(!raw)return {cart:null,renewed:false,lastOrder:null};
 const s=await readState();
 const existing=s.carts.find(c=>c.tokenHash===hash(raw));
 if(!existing)return {cart:null,renewed:false,lastOrder:null};
 if(existing.status!=='paid'){
  const {tokenHash,...cart}=existing;
  return {cart,renewed:false,lastOrder:null};
 }
 const newToken=secret();
 const rotated=await mutate(st=>startFreshCartAfterPaid(st,existing,newToken));
 jar.set('olready_cart',rotated.newToken,cookieOpts);
 const {tokenHash,...cart}=rotated.cart;
 return {cart,renewed:true,lastOrder:rotated.lastOrder};
}
