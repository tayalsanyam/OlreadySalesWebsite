-- OLREADY partner website: additive bootstrap for a dedicated Supabase project.
-- No existing merchant tables are modified. Run in the Supabase SQL editor.
begin;
create table if not exists public.partner_staff (
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null check (role in ('admin','editor','commercial','sales')),
 active boolean not null default true,
 created_at timestamptz not null default now()
);
alter table public.partner_staff enable row level security;
revoke all on public.partner_staff from anon, authenticated;
grant select on public.partner_staff to authenticated;
grant all on public.partner_staff to service_role;
do $policy$
begin
 if not exists (select 1 from pg_policies where schemaname='public' and tablename='partner_staff' and policyname='Staff can read own membership') then
  create policy "Staff can read own membership" on public.partner_staff for select to authenticated using ((select auth.uid()) = user_id);
 end if;
end $policy$;

-- Versioned CMS document plus private operational state. Server-only access.
-- Optimistic lock_version is used for compare-and-swap across Vercel instances.
-- Not exposed to anonymous or ordinary authenticated API clients.
create table if not exists public.partner_workspace (
 id text primary key check (id = 'main'),
 state jsonb not null,
 lock_version bigint not null default 1,
 updated_at timestamptz not null default now()
);
alter table public.partner_workspace enable row level security;
revoke all on public.partner_workspace from anon, authenticated;
grant all on public.partner_workspace to service_role;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('partner-media','partner-media',true,20971520,array['image/jpeg','image/png','image/webp','video/mp4'])
on conflict(id) do nothing;
-- Public bucket contains only approved website media, never private evidence.
-- Uploads pass through server staff/MFA/role checks using the service key.
commit;
