import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {requireRole} from '@/lib/auth';
import {sameOrigin,json,fail} from '@/lib/api';
import {rateLimit} from '@/lib/limit';
import {service} from '@/lib/store';
import {STAFF_ROLES,ROLE_ACCESS,ROLE_LABELS,type StaffRole} from '@/lib/staff-roles';
import {assertCanChangeAdminTarget,listStaffMembers,staffPasswordFromBody,tempPassword} from '@/lib/staff-admin';

const roleSchema=z.enum(STAFF_ROLES);

export async function GET(){try{await requireRole(['admin']);const members=await listStaffMembers();return NextResponse.json({members,roles:STAFF_ROLES.map(r=>({id:r,label:ROLE_LABELS[r],...ROLE_ACCESS[r]})),},{headers:{'Cache-Control':'no-store'}});}catch(e){return fail(e,403);}}

export async function POST(req:NextRequest){try{sameOrigin(req);const actor=await requireRole(['admin']);await rateLimit(req,'staff-admin',40);const body=await json(req,8000);const db=service();
 if(body.action==='create'){const email=z.string().email().transform(v=>v.toLowerCase()).parse(body.email);const password=staffPasswordFromBody(body.password,tempPassword);const role=roleSchema.parse(body.role||'editor');const {data,error}=await db.auth.admin.createUser({email,password,email_confirm:true});if(error)throw new Error(error.message.includes('already')?'That email already has an account. Update their role below or reset their password.':'Could not create user: '+error.message);const {error:grant}=await db.from('partner_staff').upsert({user_id:data.user!.id,role,active:true},{onConflict:'user_id'});if(grant){await db.auth.admin.deleteUser(data.user!.id);throw new Error('Account created but workspace access failed. Try again.');}return NextResponse.json({member:{userId:data.user!.id,email,role,active:true},temporaryPassword:typeof body.password==='string'&&body.password.length>=12?undefined:password});}
 if(body.action==='update'){const userId=z.string().uuid().parse(body.userId);if(userId===actor.id&&body.active===false)throw new Error('You cannot deactivate your own account.');const patch:{role?:StaffRole;active?:boolean}={};if(body.role!==undefined)patch.role=roleSchema.parse(body.role);if(body.active!==undefined)patch.active=z.boolean().parse(body.active);if(!Object.keys(patch).length)throw new Error('Nothing to update.');await assertCanChangeAdminTarget(userId,patch);const {error}=await db.from('partner_staff').update(patch).eq('user_id',userId);if(error)throw error;return NextResponse.json({ok:true});}
 if(body.action==='reset-password'){const userId=z.string().uuid().parse(body.userId);const {data:row}=await db.from('partner_staff').select('user_id').eq('user_id',userId).maybeSingle();if(!row)throw new Error('Staff member not found.');const generated=!body.password||body.password==='';const password=staffPasswordFromBody(body.password,tempPassword);const {error}=await db.auth.admin.updateUserById(userId,{password});if(error)throw new Error('Could not reset password.');return NextResponse.json(generated?{temporaryPassword:password}:{ok:true});}
 if(body.action==='remove'){const userId=z.string().uuid().parse(body.userId);if(userId===actor.id)throw new Error('You cannot remove your own account.');await assertCanChangeAdminTarget(userId,{remove:true});const {error:delStaff}=await db.from('partner_staff').delete().eq('user_id',userId);if(delStaff)throw delStaff;const {error:delUser}=await db.auth.admin.deleteUser(userId);if(delUser)throw new Error('Workspace access removed, but the login could not be deleted. Remove the user in Supabase Authentication if needed.');return NextResponse.json({ok:true});}
 throw new Error('Unknown action');
}catch(e){return fail(e);}}
