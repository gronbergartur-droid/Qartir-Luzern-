-- IDM Mobile - real Supabase Auth + roles
--
-- Replaces the anonymous-sign-in bootstrap with real email/password login,
-- four roles (admin, op_leitung, mitarbeiter, lieferant) and audit-proof
-- attribution of every write to the authenticated user. The tables/RLS from
-- 0001_init.sql are kept as-is and extended here, not replaced.

create type user_role as enum ('admin', 'op_leitung', 'mitarbeiter', 'lieferant');

-- ---------------------------------------------------------------------------
-- profiles (one row per auth.users account)
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text not null,
  role user_role not null default 'mitarbeiter',
  -- Set for role = 'lieferant' accounts, linking them to their own supplier.
  supplier_id uuid references suppliers (id) on delete set null,
  -- New accounts start inactive; an admin must activate them before they can
  -- read or write hospital data. The very first account ever created is
  -- auto-activated as admin (see handle_new_auth_user) so the system is
  -- never left without an admin.
  active boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on profiles (role);
create index if not exists profiles_supplier_id_idx on profiles (supplier_id);

-- ---------------------------------------------------------------------------
-- Security-definer helpers used throughout RLS below. security definer +
-- an empty search_path avoids both RLS recursion on profiles and
-- search-path hijacking.
-- ---------------------------------------------------------------------------
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.active
  );
$$;

create or replace function is_active_user()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.active
  );
$$;

-- Used to make performed_by columns tamper-evident: the value written must
-- match the caller's own profile, never a client-supplied name.
create or replace function current_display_name()
returns text
language sql
security definer
set search_path = ''
stable
as $$
  select display_name from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Auto-provision a profile row on signup.
-- ---------------------------------------------------------------------------
create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  is_first boolean;
begin
  select not exists (select 1 from public.profiles) into is_first;
  insert into public.profiles (id, email, display_name, role, active)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    (case when is_first then 'admin' else 'mitarbeiter' end)::public.user_role,
    is_first
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- Only an admin may change someone's role/active/supplier_id - prevents a
-- pending or regular account from self-approving or self-promoting via the
-- "update own row" policy below.
create or replace function prevent_self_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    if new.role is distinct from old.role
       or new.active is distinct from old.active
       or new.supplier_id is distinct from old.supplier_id then
      raise exception 'Nur Admins duerfen Rolle, Freigabe-Status oder Lieferanten-Zuordnung aendern.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_self_escalation on profiles;
create trigger profiles_prevent_self_escalation
  before update on profiles
  for each row execute function prevent_self_role_escalation();

-- ---------------------------------------------------------------------------
-- RLS: profiles
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;

create policy "Read own profile or admin reads all" on profiles
  for select to authenticated using (id = auth.uid() or is_admin());

create policy "Update own profile or admin updates any" on profiles
  for update to authenticated using (id = auth.uid() or is_admin()) with check (id = auth.uid() or is_admin());

-- No insert/delete policy: rows are created only by the handle_new_auth_user
-- trigger (security definer, bypasses RLS) and accounts are deactivated
-- rather than deleted, keeping the audit trail's performed_by references intact.

-- ---------------------------------------------------------------------------
-- RLS: tighten existing business tables to require an active profile.
-- Read access now also requires an active profile (previously any
-- `authenticated` session, including anonymous sign-in, could read). Writes
-- additionally require performed_by / performed_by_intake / performed_by_outtake
-- to match the caller's own profile, so attribution can't be spoofed.
-- ---------------------------------------------------------------------------

drop policy if exists "Authenticated read suppliers" on suppliers;
create policy "Active users read suppliers" on suppliers
  for select to authenticated using (is_active_user());
drop policy if exists "Authenticated write suppliers" on suppliers;
create policy "Active users write suppliers" on suppliers
  for insert to authenticated with check (is_active_user());
drop policy if exists "Authenticated update suppliers" on suppliers;
create policy "Active users update suppliers" on suppliers
  for update to authenticated using (is_active_user()) with check (is_active_user());
drop policy if exists "Authenticated delete suppliers" on suppliers;
create policy "Active users delete suppliers" on suppliers
  for delete to authenticated using (is_active_user());

drop policy if exists "Authenticated read trays" on trays;
create policy "Active users read trays" on trays
  for select to authenticated using (is_active_user());
drop policy if exists "Authenticated write trays" on trays;
create policy "Active users write trays" on trays
  for insert to authenticated with check (is_active_user());
drop policy if exists "Authenticated update trays" on trays;
create policy "Active users update trays" on trays
  for update to authenticated using (is_active_user()) with check (is_active_user());

drop policy if exists "Authenticated read tray_instruments" on tray_instruments;
create policy "Active users read tray_instruments" on tray_instruments
  for select to authenticated using (is_active_user());
drop policy if exists "Authenticated write tray_instruments" on tray_instruments;
create policy "Active users write tray_instruments" on tray_instruments
  for insert to authenticated with check (is_active_user());
drop policy if exists "Authenticated update tray_instruments" on tray_instruments;
create policy "Active users update tray_instruments" on tray_instruments
  for update to authenticated using (is_active_user()) with check (is_active_user());
drop policy if exists "Authenticated delete tray_instruments" on tray_instruments;
create policy "Active users delete tray_instruments" on tray_instruments
  for delete to authenticated using (is_active_user());

drop policy if exists "Authenticated read scans" on scans;
create policy "Active users read scans" on scans
  for select to authenticated using (is_active_user());
drop policy if exists "Authenticated write scans" on scans;
create policy "Active users write scans" on scans
  for insert to authenticated with check (is_active_user() and performed_by = current_display_name());
drop policy if exists "Authenticated update scans" on scans;
create policy "Active users update scans" on scans
  for update to authenticated using (is_active_user())
  with check (is_active_user() and performed_by = current_display_name());

drop policy if exists "Authenticated read loan_cases" on loan_cases;
create policy "Active users read loan_cases" on loan_cases
  for select to authenticated using (is_active_user());
drop policy if exists "Authenticated write loan_cases" on loan_cases;
create policy "Active users write loan_cases" on loan_cases
  for insert to authenticated
  with check (is_active_user() and performed_by_intake = current_display_name());
drop policy if exists "Authenticated update loan_cases" on loan_cases;
create policy "Active users update loan_cases" on loan_cases
  for update to authenticated using (is_active_user())
  with check (
    is_active_user()
    and (performed_by_outtake is null or performed_by_outtake = current_display_name())
  );

drop policy if exists "Authenticated read audit_log" on audit_log;
create policy "Active users read audit_log" on audit_log
  for select to authenticated using (is_active_user());
drop policy if exists "Authenticated append audit_log" on audit_log;
create policy "Active users append audit_log" on audit_log
  for insert to authenticated with check (is_active_user() and performed_by = current_display_name());
