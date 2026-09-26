import {createClient} from '@supabase/supabase-js';import {initialState} from '../lib/seed';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!key)throw new Error('Load .env.local before running this script');
const db=createClient(url,key,{auth:{persistSession:false}});
const {data,error}=await db.from('partner_workspace').select('id').eq('id','main').maybeSingle();
if(error)throw new Error('Apply supabase/bootstrap.sql first. '+error.message);
if(data){console.log('Workspace already exists; existing content left intact.');}else{const {error}=await db.from('partner_workspace').insert({id:'main',state:initialState()});if(error)throw new Error(error.message);console.log('OLREADY workspace created. Claims and prices remain unapproved.');}
