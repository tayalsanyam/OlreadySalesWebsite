import 'server-only';
import {cookies} from 'next/headers';
import {createServerClient} from '@supabase/ssr';
import {demo} from './store';
export async function authClient(){const jar=await cookies();if(!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)throw new Error('Staff authentication is not configured');return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{cookies:{getAll:()=>jar.getAll(),setAll:values=>{for(const v of values)jar.set(v.name,v.value,v.options);}}});}
export async function staff(){if(demo())return {id:'local-preview',role:'admin'};const db=await authClient();const {data:{user}}=await db.auth.getUser();if(!user)throw new Error('Staff sign-in required');const {data:member}=await db.from('partner_staff').select('role').eq('user_id',user.id).eq('active',true).single();if(!member)throw new Error('Staff access required');const {data:assurance}=await db.auth.mfa.getAuthenticatorAssuranceLevel();if(assurance?.currentLevel!=='aal2')throw new Error('MFA verification required');return {id:user.id,role:member.role as string};}
export async function requireRole(roles:string[]){const user=await staff();if(!roles.includes(user.role))throw new Error('This action requires another staff role');return user;}
