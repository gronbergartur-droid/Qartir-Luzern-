/**
 * Domain types shared by the whole app. Field names and shapes intentionally
 * mirror the planned Supabase schema (see supabase/migrations/) so that
 * swapping the mock data provider for a real SupabaseDataProvider later is a
 * mechanical change, not a redesign.
 */

export type UUID = string;
export type ISODateString = string;

export interface Supplier {
  id: UUID;
  name: string;
  shortCode: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  logoUrl: string | null;
  active: boolean;
  createdAt: ISODateString;
}

/** A single instrument line that belongs to a reference tray composition. */
export interface TrayInstrument {
  id: UUID;
  trayId: UUID;
  name: string;
  quantity: number;
  /** Position within the tray layout, used for ordered checklists. */
  position: number;
  /** Critical instruments require an explicit manual confirmation, cannot be "assumed present". */
  critical: boolean;
  referenceImageUrl: string | null;
}

/** A reference (master) tray definition against which scans are matched. */
export interface Tray {
  id: UUID;
  /** Primary human-readable code, e.g. "SSW-LEIH-04-02". */
  code: string;
  /** Alternate identifiers / aliases that should also resolve to this tray, e.g. "LEIH 04". */
  aliases: string[];
  name: string;
  supplierId: UUID;
  referencePhotoUrl: string | null;
  expectedInstrumentCount: number;
  active: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type ScanStatus =
  | 'processing'
  | 'awaiting_match'
  | 'matched'
  | 'unmatched'
  | 'awaiting_confirmation'
  | 'confirmed'
  | 'cancelled';

/** Raw output of the on-device recognition pipeline (barcode/QR + OCR), before any DB lookup. */
export interface RecognitionResult {
  barcodeValues: string[];
  qrValues: string[];
  ocrText: string;
  /** Candidate identifiers extracted from barcode/QR/OCR via pattern matching, most likely first. */
  candidateIdentifiers: RecognitionCandidate[];
  ocrConfidence: number | null;
  processingTimeMs: number;
}

export interface RecognitionCandidate {
  value: string;
  source: 'barcode' | 'qr' | 'ocr';
  confidence: number;
}

/** A confirmed/rejected checklist entry for one expected instrument during review. */
export interface InstrumentCheckEntry {
  instrumentId: UUID;
  name: string;
  quantityExpected: number;
  quantityConfirmed: number;
  critical: boolean;
  /** True once the user has explicitly reviewed this line (assistive AI never sets this alone). */
  userConfirmed: boolean;
}

/** An instrument found in the tray but not part of the reference composition. */
export interface ExtraInstrumentEntry {
  id: string;
  name: string;
  quantity: number;
  note: string | null;
}

export interface ScanRecord {
  id: UUID;
  trayId: UUID | null;
  supplierId: UUID | null;
  capturedImageDataUrl: string | null;
  recognition: RecognitionResult | null;
  matchedIdentifier: string | null;
  status: ScanStatus;
  expectedCount: number;
  detectedCount: number;
  instrumentChecks: InstrumentCheckEntry[];
  extraInstruments: ExtraInstrumentEntry[];
  missingInstrumentIds: UUID[];
  notes: string | null;
  performedBy: string;
  createdAt: ISODateString;
  confirmedAt: ISODateString | null;
}

export type AuditAction =
  | 'scan_started'
  | 'scan_matched'
  | 'scan_unmatched'
  | 'scan_confirmed'
  | 'scan_cancelled'
  | 'instrument_manually_adjusted';

export interface AuditLogEntry {
  id: UUID;
  entityType: 'scan' | 'tray' | 'supplier';
  entityId: UUID;
  action: AuditAction;
  performedBy: string;
  details: Record<string, unknown>;
  createdAt: ISODateString;
}
