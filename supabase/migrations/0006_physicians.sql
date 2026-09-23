-- IDM Mobile - Belegaerzte/Operateure (Aerzteliste) + Operateur-Feld am Sieb-Fall
--
-- Angefragt: eine Liste der Belegaerzte/Operateure (vorerst Orthopaedie und
-- Gynaekologie, aus der internen Telefonliste), plus ein "Operateur"-Feld am
-- Sieb-Fall - das entspricht der Spalte auf dem intern gefuehrten Whiteboard
-- (OP-Datum / Leih-Set / Operateur / Retour). Retour selbst ist bereits ueber
-- den bestehenden Fall-Status + die Lieferanten-Benachrichtigung abgebildet,
-- hier fehlte nur die strukturierte Zuordnung des Operateurs.

create table if not exists physicians (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- Fachbereich (z.B. "Orthopaedie", "Gynaekologie") - bewusst Freitext,
  -- damit weitere Fachbereiche ohne Schema-Aenderung ergaenzt werden koennen.
  department text not null,
  mobile_phone text,
  practice_phone text,
  email text,
  created_at timestamptz not null default now()
);

alter table physicians enable row level security;

create policy "Active users read physicians" on physicians
  for select to authenticated using (is_active_user());
create policy "Active users write physicians" on physicians
  for insert to authenticated with check (is_active_user());

alter table loan_cases
  add column if not exists operateur_id uuid references physicians (id) on delete set null;

alter table audit_log drop constraint if exists audit_log_entity_type_check;
alter table audit_log add constraint audit_log_entity_type_check check (entity_type in (
  'scan', 'tray', 'supplier', 'case', 'archive', 'physician'
));

alter table audit_log drop constraint if exists audit_log_action_check;
alter table audit_log add constraint audit_log_action_check check (action in (
  'scan_started', 'scan_matched', 'scan_unmatched', 'scan_confirmed',
  'scan_cancelled', 'instrument_manually_adjusted',
  'supplier_created', 'supplier_updated', 'supplier_activated',
  'supplier_deactivated', 'supplier_deleted',
  'tray_created', 'tray_updated',
  'case_intake', 'case_outtake', 'case_compared', 'case_readiness_notified',
  'archive_downloaded', 'physician_created'
));
