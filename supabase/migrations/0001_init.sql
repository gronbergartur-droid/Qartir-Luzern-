-- IDM Mobile - initial schema
-- Modules covered: LEIH-SIEB SCANNER (trays, tray_instruments, scans),
-- audit log, and the data suppliers/tray-history/before-after modules build on.
--
-- Column names are snake_case and map 1:1 to the camelCase domain types in
-- src/types/database.ts via src/services/supabaseProvider.ts.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- suppliers
-- ---------------------------------------------------------------------------
create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_code text not null unique,
  location text, -- Swiss site, e.g. "Biberist, SO"
  specialties text[] not null default '{}', -- Fachgebiete / typische Sets
  loan_service_confirmed boolean not null default false,
  loan_service_note text,
  contact_phone text,
  contact_email text,
  contact_note text, -- address or other free-text contact hint
  source text, -- traceability: where this supplier's data was sourced from
  logo_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists suppliers_specialties_gin_idx on suppliers using gin (specialties);

-- ---------------------------------------------------------------------------
-- trays (reference/master tray definitions)
-- ---------------------------------------------------------------------------
create table if not exists trays (
  id uuid primary key default gen_random_uuid(),
  code text not null unique, -- e.g. "SSW-LEIH-04-02"
  aliases text[] not null default '{}', -- e.g. {"LEIH 04", "LEIH-04"}
  name text not null,
  supplier_id uuid not null references suppliers (id) on delete restrict,
  reference_photo_url text,
  expected_instrument_count integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trays_supplier_id_idx on trays (supplier_id);
create index if not exists trays_aliases_gin_idx on trays using gin (aliases);

-- ---------------------------------------------------------------------------
-- tray_instruments (reference composition of a tray)
-- ---------------------------------------------------------------------------
create table if not exists tray_instruments (
  id uuid primary key default gen_random_uuid(),
  tray_id uuid not null references trays (id) on delete cascade,
  name text not null,
  quantity integer not null default 1,
  position integer not null default 0,
  critical boolean not null default false,
  reference_image_url text
);

create index if not exists tray_instruments_tray_id_idx on tray_instruments (tray_id);

-- ---------------------------------------------------------------------------
-- scans (one LEIH-SIEB SCANNER run: capture -> recognition -> confirmed result)
-- ---------------------------------------------------------------------------
create table if not exists scans (
  id uuid primary key default gen_random_uuid(),
  tray_id uuid references trays (id) on delete set null,
  supplier_id uuid references suppliers (id) on delete set null,
  -- Set when this scan is the intake or outtake scan of a loan_cases row.
  case_id uuid,
  -- Path/URL into Supabase Storage, not a base64 blob.
  captured_image_url text,
  -- Raw assistive AI output (barcode/QR values, OCR text, ranked candidates).
  -- Kept for traceability; never used to auto-finalize a result.
  recognition jsonb,
  matched_identifier text,
  status text not null default 'processing'
    check (status in (
      'processing', 'awaiting_match', 'matched', 'unmatched',
      'awaiting_confirmation', 'confirmed', 'cancelled'
    )),
  expected_count integer not null default 0,
  detected_count integer not null default 0,
  instrument_checks jsonb not null default '[]',
  extra_instruments jsonb not null default '[]',
  missing_instrument_ids uuid[] not null default '{}',
  notes text,
  performed_by text not null,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create index if not exists scans_tray_id_idx on scans (tray_id);
create index if not exists scans_supplier_id_idx on scans (supplier_id);
create index if not exists scans_case_id_idx on scans (case_id);
create index if not exists scans_created_at_idx on scans (created_at desc);
create index if not exists scans_status_idx on scans (status);

-- ---------------------------------------------------------------------------
-- loan_cases (Vorher/Nachher-Vergleich: one loaner-tray-in-use lifecycle)
-- ---------------------------------------------------------------------------
create table if not exists loan_cases (
  id uuid primary key default gen_random_uuid(),
  tray_id uuid not null references trays (id) on delete restrict,
  supplier_id uuid not null references suppliers (id) on delete restrict,
  status text not null default 'outtake_pending'
    check (status in ('outtake_pending', 'compared')),
  operation_note text,
  operation_date date,
  intake_scan_id uuid not null references scans (id) on delete restrict,
  outtake_scan_id uuid references scans (id) on delete set null,
  -- Deterministic diff of the confirmed intake/outtake checklists - see
  -- src/features/cases/comparison.ts. Not an automated image/vision result.
  comparison jsonb,
  performed_by_intake text not null,
  performed_by_outtake text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table scans
  add constraint scans_case_id_fkey foreign key (case_id) references loan_cases (id) on delete set null;

create index if not exists loan_cases_tray_id_idx on loan_cases (tray_id);
create index if not exists loan_cases_supplier_id_idx on loan_cases (supplier_id);
create index if not exists loan_cases_intake_scan_id_idx on loan_cases (intake_scan_id);
create index if not exists loan_cases_outtake_scan_id_idx on loan_cases (outtake_scan_id);
create index if not exists loan_cases_status_idx on loan_cases (status);
create index if not exists loan_cases_created_at_idx on loan_cases (created_at desc);

-- ---------------------------------------------------------------------------
-- audit_log (append-only trail for every scan/tray/supplier/case action)
-- ---------------------------------------------------------------------------
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('scan', 'tray', 'supplier', 'case')),
  entity_id uuid not null,
  action text not null check (action in (
    'scan_started', 'scan_matched', 'scan_unmatched', 'scan_confirmed',
    'scan_cancelled', 'instrument_manually_adjusted',
    'supplier_created', 'supplier_updated', 'supplier_activated',
    'supplier_deactivated', 'supplier_deleted',
    'tray_created', 'tray_updated',
    'case_intake', 'case_outtake', 'case_compared'
  )),
  performed_by text not null,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists audit_log_entity_idx on audit_log (entity_type, entity_id);
create index if not exists audit_log_created_at_idx on audit_log (created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trays_set_updated_at on trays;
create trigger trays_set_updated_at
  before update on trays
  for each row execute function set_updated_at();

drop trigger if exists loan_cases_set_updated_at on loan_cases;
create trigger loan_cases_set_updated_at
  before update on loan_cases
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- Default posture: any authenticated hospital/AEMP staff account may read
-- and write. This is intentionally coarse for the first module; tighten to
-- per-site or per-role policies once user/organisation management (part of
-- the supplier management & multi-site roadmap) is introduced. The audit
-- log is append-only - no update/delete policy is defined for it, matching
-- its purpose as a tamper-evident trail.
-- ---------------------------------------------------------------------------
alter table suppliers enable row level security;
alter table trays enable row level security;
alter table tray_instruments enable row level security;
alter table scans enable row level security;
alter table loan_cases enable row level security;
alter table audit_log enable row level security;

create policy "Authenticated read suppliers" on suppliers
  for select to authenticated using (true);
create policy "Authenticated write suppliers" on suppliers
  for insert to authenticated with check (true);
create policy "Authenticated update suppliers" on suppliers
  for update to authenticated using (true) with check (true);
create policy "Authenticated delete suppliers" on suppliers
  for delete to authenticated using (true);

create policy "Authenticated read trays" on trays
  for select to authenticated using (true);
create policy "Authenticated write trays" on trays
  for insert to authenticated with check (true);
create policy "Authenticated update trays" on trays
  for update to authenticated using (true) with check (true);

create policy "Authenticated read tray_instruments" on tray_instruments
  for select to authenticated using (true);
create policy "Authenticated write tray_instruments" on tray_instruments
  for insert to authenticated with check (true);
create policy "Authenticated update tray_instruments" on tray_instruments
  for update to authenticated using (true) with check (true);

create policy "Authenticated read scans" on scans
  for select to authenticated using (true);
create policy "Authenticated write scans" on scans
  for insert to authenticated with check (true);
create policy "Authenticated update scans" on scans
  for update to authenticated using (true) with check (true);

create policy "Authenticated read loan_cases" on loan_cases
  for select to authenticated using (true);
create policy "Authenticated write loan_cases" on loan_cases
  for insert to authenticated with check (true);
create policy "Authenticated update loan_cases" on loan_cases
  for update to authenticated using (true) with check (true);

create policy "Authenticated read audit_log" on audit_log
  for select to authenticated using (true);
create policy "Authenticated append audit_log" on audit_log
  for insert to authenticated with check (true);
