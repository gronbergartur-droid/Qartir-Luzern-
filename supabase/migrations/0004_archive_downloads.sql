-- IDM Mobile - Audit-Trail fuer heruntergeladene Monats-Archive
--
-- Kein neues Datenfeld: das Archiv selbst wird clientseitig aus bereits
-- vorhandenen Daten gebaut (siehe src/features/archive/). Diese Migration
-- erlaubt lediglich, den Download-Vorgang im bestehenden append-only
-- audit_log zu protokollieren - es gibt keine einzelne Zeile, auf die sich
-- ein Archiv-Download bezieht, daher der neue entity_type 'archive' mit
-- einer synthetischen entity_id (der eigentliche Monat steht in details).

alter table audit_log drop constraint if exists audit_log_entity_type_check;
alter table audit_log add constraint audit_log_entity_type_check check (entity_type in (
  'scan', 'tray', 'supplier', 'case', 'archive'
));

alter table audit_log drop constraint if exists audit_log_action_check;
alter table audit_log add constraint audit_log_action_check check (action in (
  'scan_started', 'scan_matched', 'scan_unmatched', 'scan_confirmed',
  'scan_cancelled', 'instrument_manually_adjusted',
  'supplier_created', 'supplier_updated', 'supplier_activated',
  'supplier_deactivated', 'supplier_deleted',
  'tray_created', 'tray_updated',
  'case_intake', 'case_outtake', 'case_compared', 'case_readiness_notified',
  'archive_downloaded'
));
