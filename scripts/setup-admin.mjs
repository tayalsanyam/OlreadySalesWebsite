import {createInterface} from 'node:readline/promises';
import {randomBytes} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
const input=createInterface({input:process.stdin,output:process.stdout});
try {
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.');
 const email=(await input.question('Your admin email address: ')).trim().toLowerCase();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Enter a valid email address.');
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {count,error:checkError}=await db.from('partner_staff').select('user_id',{count:'exact',head:true}).eq('active',true).eq('role','admin');
 if(checkError)throw new Error('Cannot read staff table. Install the combined migration and check the server key.');
 if(count)throw new Error('An active admin already exists. This one-time setup does not change existing accounts.');
 const password=randomBytes(24).toString('base64url')+'aA1!';
 const {data,error}=await db.auth.admin.createUser({email,password,email_confirm:true});
 if(error)throw new Error('Could not create admin user: '+error.message);
 const {error:grantError}=await db.from('partner_staff').insert({user_id:data.user.id,role:'admin',active:true});
 if(grantError)throw new Error('User created, but staff grant failed. Use supabase/create-first-admin.sql for this email. Do not rerun account creation.');
 console.log('\nAdmin created. Save these credentials in your password manager.');
 console.log('Email: '+email+'\nPassword: '+password);
 console.log('\nSet LOCAL_DEMO=false in .env.local and restart the app. Open /admin, sign in and enrol your authenticator app. No email was sent.');
} catch(error){console.error(error.message);process.exitCode=1;}finally{input.close();}
