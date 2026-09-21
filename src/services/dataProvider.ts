import type {
  AuditLogEntry,
  ScanRecord,
  Supplier,
  Tray,
  TrayInstrument,
} from '@/types/database';

/**
 * Storage/backend-agnostic contract used by every screen. Two implementations
 * exist: `LocalDataProvider` (in-memory + localStorage, used until a Supabase
 * project is provisioned) and `SupabaseDataProvider` (see supabaseProvider.ts,
 * mirrors the same methods 1:1 against Postgres tables + RLS).
 *
 * Screens must depend on this interface, never on a concrete provider, so the
 * swap in `services/index.ts` is the only place that needs to change.
 */
export interface DataProvider {
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | null>;

  getTrays(): Promise<Tray[]>;
  /** Resolve a tray by its primary code or any of its known aliases (case-insensitive). */
  findTrayByIdentifier(identifier: string): Promise<Tray | null>;
  getTrayInstruments(trayId: string): Promise<TrayInstrument[]>;

  saveScan(scan: ScanRecord): Promise<ScanRecord>;
  getScanHistory(): Promise<ScanRecord[]>;
  getScan(id: string): Promise<ScanRecord | null>;

  appendAuditEntry(entry: AuditLogEntry): Promise<AuditLogEntry>;
  getAuditLog(): Promise<AuditLogEntry[]>;
}
