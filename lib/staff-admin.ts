import 'server-only';
import {randomBytes} from 'node:crypto';
import {service} from './store';
import type {StaffRole} from './staff-roles';

export function tempPassword(){return randomBytes(24).toString('base64url')+'aA1!';}

export function staffPasswordFromBody(raw:unknown,fallback:()=>string){if(raw===undefined||raw===null||raw==='')return fallback();if(typeof raw!=='string'||raw.length<12)throw new Error('Use at least 12 characters for the password.');return raw;}

export async function listAuthUsersById(){const db=service();const map=new Map<string,{email:string;createdAt:string;confirmed:boolean}>();for(let page=1;page<=20;page++){const {data,error}=await db.auth.admin.listUsers({page,perPage:200});if(error)throw error;if(!data.users.length)break;for(const u of data.users){if(u.email)map.set(u.id,{email:u.email.toLowerCase(),createdAt:u.created_at,confirmed:!!u.email_confirmed_at});}}return map;}

export async function listStaffMembers(){const db=service();const {data:rows,error}=await db.from('partner_staff').select('user_id,role,active,created_at').order('created_at',{ascending:true});if(error)throw error;const users=await listAuthUsersById();return (rows||[]).map(r=>({userId:r.user_id,role:r.role as StaffRole,active:r.active,createdAt:r.created_at,email:users.get(r.user_id)?.email||'(unknown)',emailConfirmed:users.get(r.user_id)?.confirmed??false}));}

export async function countActiveAdmins(excludeUserId?:string){const db=service();let q=db.from('partner_staff').select('user_id',{count:'exact',head:true}).eq('role','admin').eq('active',true);if(excludeUserId)q=q.neq('user_id',excludeUserId);const {count,error}=await q;if(error)throw error;return count||0;}

export async function assertCanChangeAdminTarget(targetUserId:string,next:{role?:StaffRole;active?:boolean;remove?:boolean}){const db=service();const {data:row}=await db.from('partner_staff').select('role,active').eq('user_id',targetUserId).maybeSingle();if(!row)throw new Error('Staff member not found.');const wasAdmin=row.role==='admin'&&row.active;const willBeAdmin=!next.remove&&(next.role??row.role)==='admin'&&(next.active??row.active);if(wasAdmin&&!willBeAdmin){const remaining=await countActiveAdmins(targetUserId);if(remaining<1)throw new Error('Keep at least one active administrator.');}}
