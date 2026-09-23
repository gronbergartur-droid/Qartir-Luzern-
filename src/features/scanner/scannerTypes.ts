import type {
  ExtraInstrumentEntry,
  InstrumentCheckEntry,
  RecognitionResult,
  ScanRecord,
  Supplier,
  Tray,
  TrayInstrument,
} from '@/types/database';

/**
 * Which lifecycle this run of the scanner serves. `standalone` is the
 * original ad-hoc "Kontrolle starten" flow (unchanged). `case-intake` opens
 * a new loaner case. `case-outtake` records the return scan for an already
 * open case and is compared against that case's intake scan.
 */
export type ScannerMode =
  | { kind: 'standalone' }
  | { kind: 'case-intake' }
  | { kind: 'case-outtake'; caseId: string; tray: Tray; supplier: Supplier | null; intakeScan: ScanRecord };

export type ScannerStep =
  | 'capture'
  | 'recognizing'
  | 'identify'
  | 'matching'
  | 'unmatched'
  | 'matched'
  | 'instruments'
  | 'summary'
  | 'done';

export interface ScannerState {
  scanId: string;
  step: ScannerStep;
  imageDataUrl: string | null;
  /** Extra photos beyond the primary one (e.g. a barcode/detail close-up of the same Sieb). */
  additionalImageDataUrls: string[];
  recognition: RecognitionResult | null;
  selectedIdentifier: string | null;
  tray: Tray | null;
  supplier: Supplier | null;
  instruments: TrayInstrument[];
  checks: InstrumentCheckEntry[];
  extraInstruments: ExtraInstrumentEntry[];
  notes: string;
}

export const STEP_ORDER: ScannerStep[] = [
  'capture',
  'recognizing',
  'identify',
  'matched',
  'instruments',
  'summary',
  'done',
];

export const STEP_LABELS: Record<ScannerStep, string> = {
  capture: 'Foto aufnehmen',
  recognizing: 'Erkennung läuft',
  identify: 'Sieb-Code bestätigen',
  matching: 'Abgleich',
  unmatched: 'Kein Treffer',
  matched: 'Sieb erkannt',
  instruments: 'Instrumenten-Kontrolle',
  summary: 'Bestätigung',
  done: 'Abgeschlossen',
};

export function normalizeTrayIdentifier(value: string): string {
  return value.trim().toUpperCase().replace(/[\s_]+/g, '-');
}

export function createInitialScannerState(): ScannerState {
  return {
    scanId: crypto.randomUUID(),
    step: 'capture',
    imageDataUrl: null,
    additionalImageDataUrls: [],
    recognition: null,
    selectedIdentifier: null,
    tray: null,
    supplier: null,
    instruments: [],
    checks: [],
    extraInstruments: [],
    notes: '',
  };
}
