-- Run after creating YOUR staff account in Supabase Authentication.
-- Replace the placeholder with that user's exact email.
insert into public.partner_staff (user_id, role, active)
select id, 'admin', true from auth.users
where lower(email) = lower('REPLACE_WITH_YOUR_STAFF_EMAIL')
on conflict (user_id) do update set role = 'admin', active = true;
-- Verify exactly the intended staff user is listed.
select user_id, role, active from public.partner_staff;
