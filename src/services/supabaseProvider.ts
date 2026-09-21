import { supabase } from '@/lib/supabase/client';
import type {
  AuditLogEntry,
  ScanRecord,
  Supplier,
  Tray,
  TrayInstrument,
} from '@/types/database';
import type { DataProvider } from './dataProvider';

/**
 * Backend for a provisioned Supabase project. Table/column names match
 * supabase/migrations/0001_init.sql. Row <-> domain-type mapping is kept
 * explicit (snake_case <-> camelCase) rather than relying on generated
 * types, so this file stays the single place that needs updating if the
 * schema evolves.
 *
 * Not wired up by default yet (see services/index.ts) - future modules
 * (supplier management, tray history sync, before/after comparison, audit
 * log) build on top of this provider once VITE_SUPABASE_URL /
 * VITE_SUPABASE_ANON_KEY are set and the migrations have been applied.
 */
export class SupabaseDataProvider implements DataProvider {
  private get client() {
    if (!supabase) {
      throw new Error(
        'Supabase ist nicht konfiguriert. VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY setzen.',
      );
    }
    return supabase;
  }

  async getSuppliers(): Promise<Supplier[]> {
    const { data, error } = await this.client.from('suppliers').select('*').order('name');
    if (error) throw error;
    return (data ?? []).map(mapSupplierRow);
  }

  async getSupplier(id: string): Promise<Supplier | null> {
    const { data, error } = await this.client.from('suppliers').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? mapSupplierRow(data) : null;
  }

  async getTrays(): Promise<Tray[]> {
    const { data, error } = await this.client.from('trays').select('*').order('code');
    if (error) throw error;
    return (data ?? []).map(mapTrayRow);
  }

  async findTrayByIdentifier(identifier: string): Promise<Tray | null> {
    const normalized = identifier.trim().toUpperCase();
    const { data, error } = await this.client
      .from('trays')
      .select('*')
      .or(`code.ilike.${normalized},aliases.cs.{${normalized}}`)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ? mapTrayRow(data) : null;
  }

  async getTrayInstruments(trayId: string): Promise<TrayInstrument[]> {
    const { data, error } = await this.client
      .from('tray_instruments')
      .select('*')
      .eq('tray_id', trayId)
      .order('position');
    if (error) throw error;
    return (data ?? []).map(mapInstrumentRow);
  }

  async saveScan(scan: ScanRecord): Promise<ScanRecord> {
    const { data, error } = await this.client
      .from('scans')
      .upsert(mapScanToRow(scan))
      .select('*')
      .single();
    if (error) throw error;
    return mapScanRow(data);
  }

  async getScanHistory(): Promise<ScanRecord[]> {
    const { data, error } = await this.client
      .from('scans')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapScanRow);
  }

  async getScan(id: string): Promise<ScanRecord | null> {
    const { data, error } = await this.client.from('scans').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? mapScanRow(data) : null;
  }

  async appendAuditEntry(entry: AuditLogEntry): Promise<AuditLogEntry> {
    const { data, error } = await this.client
      .from('audit_log')
      .insert(mapAuditToRow(entry))
      .select('*')
      .single();
    if (error) throw error;
    return mapAuditRow(data);
  }

  async getAuditLog(): Promise<AuditLogEntry[]> {
    const { data, error } = await this.client
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapAuditRow);
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any -- Supabase row shapes come from the DB, not TS */

function mapSupplierRow(row: any): Supplier {
  return {
    id: row.id,
    name: row.name,
    shortCode: row.short_code,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    logoUrl: row.logo_url,
    active: row.active,
    createdAt: row.created_at,
  };
}

function mapTrayRow(row: any): Tray {
  return {
    id: row.id,
    code: row.code,
    aliases: row.aliases ?? [],
    name: row.name,
    supplierId: row.supplier_id,
    referencePhotoUrl: row.reference_photo_url,
    expectedInstrumentCount: row.expected_instrument_count,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapInstrumentRow(row: any): TrayInstrument {
  return {
    id: row.id,
    trayId: row.tray_id,
    name: row.name,
    quantity: row.quantity,
    position: row.position,
    critical: row.critical,
    referenceImageUrl: row.reference_image_url,
  };
}

function mapScanRow(row: any): ScanRecord {
  return {
    id: row.id,
    trayId: row.tray_id,
    supplierId: row.supplier_id,
    capturedImageDataUrl: row.captured_image_url,
    recognition: row.recognition,
    matchedIdentifier: row.matched_identifier,
    status: row.status,
    expectedCount: row.expected_count,
    detectedCount: row.detected_count,
    instrumentChecks: row.instrument_checks ?? [],
    extraInstruments: row.extra_instruments ?? [],
    missingInstrumentIds: row.missing_instrument_ids ?? [],
    notes: row.notes,
    performedBy: row.performed_by,
    createdAt: row.created_at,
    confirmedAt: row.confirmed_at,
  };
}

function mapScanToRow(scan: ScanRecord) {
  return {
    id: scan.id,
    tray_id: scan.trayId,
    supplier_id: scan.supplierId,
    // Large captured images belong in Supabase Storage in production; this
    // column is a placeholder for a storage object path/URL, not a base64 blob.
    captured_image_url: scan.capturedImageDataUrl,
    recognition: scan.recognition,
    matched_identifier: scan.matchedIdentifier,
    status: scan.status,
    expected_count: scan.expectedCount,
    detected_count: scan.detectedCount,
    instrument_checks: scan.instrumentChecks,
    extra_instruments: scan.extraInstruments,
    missing_instrument_ids: scan.missingInstrumentIds,
    notes: scan.notes,
    performed_by: scan.performedBy,
    created_at: scan.createdAt,
    confirmed_at: scan.confirmedAt,
  };
}

function mapAuditRow(row: any): AuditLogEntry {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    action: row.action,
    performedBy: row.performed_by,
    details: row.details ?? {},
    createdAt: row.created_at,
  };
}

function mapAuditToRow(entry: AuditLogEntry) {
  return {
    id: entry.id,
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    action: entry.action,
    performed_by: entry.performedBy,
    details: entry.details,
    created_at: entry.createdAt,
  };
}
