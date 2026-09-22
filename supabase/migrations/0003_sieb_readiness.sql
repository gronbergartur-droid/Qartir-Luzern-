-- IDM Mobile - Sieb-Bereitschaft nach Sterilisation
--
-- Nach dem Ausgangs-Scan eines Sieb-Falls wird das Instrument sterilisiert.
-- Jeder Sterilisationszyklus erzeugt einen eigenen Hygiene-Pass (Chargen-
-- Ausdruck), der fotografiert und dem Lieferanten per E-Mail als Beleg der
-- Abholbereitschaft zugestellt wird (siehe
-- supabase/functions/send-sieb-ready-email).

alter table loan_cases
  add column if not exists hygiene_passport_photo_url text,
  add column if not exists readiness_notified_at timestamptz;

alter table audit_log drop constraint if exists audit_log_action_check;
alter table audit_log add constraint audit_log_action_check check (action in (
  'scan_started', 'scan_matched', 'scan_unmatched', 'scan_confirmed',
  'scan_cancelled', 'instrument_manually_adjusted',
  'supplier_created', 'supplier_updated', 'supplier_activated',
  'supplier_deactivated', 'supplier_deleted',
  'tray_created', 'tray_updated',
  'case_intake', 'case_outtake', 'case_compared', 'case_readiness_notified'
));
