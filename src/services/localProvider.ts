import { suppliers, trayInstruments, trays } from '@/data/referenceData';
import type {
  AuditLogEntry,
  ScanRecord,
  Supplier,
  Tray,
  TrayInstrument,
} from '@/types/database';
import type { DataProvider } from './dataProvider';

const SCAN_HISTORY_KEY = 'idm-mobile.scan-history.v1';
const AUDIT_LOG_KEY = 'idm-mobile.audit-log.v1';

function readFromStorage<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeToStorage<T>(key: string, value: T[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable (e.g. private browsing quota) - fail silently,
    // the in-memory session state still works for the current visit.
  }
}

/**
 * Default provider for local development and demo use, and the fallback
 * whenever Supabase credentials are not configured. Persists to
 * localStorage so a confirmed scan survives a reload during a shift.
 */
export class LocalDataProvider implements DataProvider {
  private scanHistory: ScanRecord[] = readFromStorage<ScanRecord>(SCAN_HISTORY_KEY);
  private auditLog: AuditLogEntry[] = readFromStorage<AuditLogEntry>(AUDIT_LOG_KEY);

  async getSuppliers(): Promise<Supplier[]> {
    return suppliers;
  }

  async getSupplier(id: string): Promise<Supplier | null> {
    return suppliers.find((s) => s.id === id) ?? null;
  }

  async getTrays(): Promise<Tray[]> {
    return trays;
  }

  async findTrayByIdentifier(identifier: string): Promise<Tray | null> {
    const normalized = normalizeIdentifier(identifier);
    return (
      trays.find((tray) => {
        if (normalizeIdentifier(tray.code) === normalized) return true;
        return tray.aliases.some((alias) => normalizeIdentifier(alias) === normalized);
      }) ?? null
    );
  }

  async getTrayInstruments(trayId: string): Promise<TrayInstrument[]> {
    return trayInstruments
      .filter((instrument) => instrument.trayId === trayId)
      .sort((a, b) => a.position - b.position);
  }

  async saveScan(scan: ScanRecord): Promise<ScanRecord> {
    const existingIndex = this.scanHistory.findIndex((s) => s.id === scan.id);
    if (existingIndex >= 0) {
      this.scanHistory[existingIndex] = scan;
    } else {
      this.scanHistory = [scan, ...this.scanHistory];
    }
    writeToStorage(SCAN_HISTORY_KEY, this.scanHistory);
    return scan;
  }

  async getScanHistory(): Promise<ScanRecord[]> {
    return [...this.scanHistory].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  async getScan(id: string): Promise<ScanRecord | null> {
    return this.scanHistory.find((s) => s.id === id) ?? null;
  }

  async appendAuditEntry(entry: AuditLogEntry): Promise<AuditLogEntry> {
    this.auditLog = [entry, ...this.auditLog];
    writeToStorage(AUDIT_LOG_KEY, this.auditLog);
    return entry;
  }

  async getAuditLog(): Promise<AuditLogEntry[]> {
    return [...this.auditLog].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
}

function normalizeIdentifier(value: string): string {
  return value.trim().toUpperCase().replace(/[\s_]+/g, '-');
}
