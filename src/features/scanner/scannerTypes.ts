import type {
  ExtraInstrumentEntry,
  InstrumentCheckEntry,
  RecognitionResult,
  Supplier,
  Tray,
  TrayInstrument,
} from '@/types/database';

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
  recognition: RecognitionResult | null;
  selectedIdentifier: string | null;
  tray: Tray | null;
  supplier: Supplier | null;
  instruments: TrayInstrument[];
  checks: InstrumentCheckEntry[];
  extraInstruments: ExtraInstrumentEntry[];
  notes: string;
  performedBy: string;
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

export function createInitialScannerState(): ScannerState {
  return {
    scanId: crypto.randomUUID(),
    step: 'capture',
    imageDataUrl: null,
    recognition: null,
    selectedIdentifier: null,
    tray: null,
    supplier: null,
    instruments: [],
    checks: [],
    extraInstruments: [],
    notes: '',
    performedBy: 'AEMP-Mitarbeiter:in',
  };
}
