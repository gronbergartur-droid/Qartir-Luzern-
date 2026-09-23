import type { Gs1Fields } from '@/types/database';

/**
 * GS1 Application Identifier (AI) parsing for medical-device UDI labels.
 * Nearly every EU medical device manufacturer (KARL STORZ, MITEK, etc.) has
 * had to print UDI data in this format since the EU MDR took effect, either
 * as a GS1-128/DataMatrix barcode or as the accompanying human-readable text
 * "(01)10886705012633(17)261231(10)2501001(21)000123" - the OCR/barcode
 * pipeline captures that text, this extracts the fields out of it.
 *
 * Only the AIs relevant to loaner-Sieb identification and traceability are
 * parsed; everything else is ignored. Fields:
 *   (01) gtin   - Global Trade Item Number, the manufacturer's product-wide code
 *   (240) ref   - Additional product identification, usually the manufacturer's own REF/Artikelnummer
 *   (10) lot    - Batch/lot number
 *   (21) serial - Serial number
 *   (17) expiryDate - Expiry date, raw as printed (YYMMDD)
 */
const GS1_AI_PATTERN = /\((\d{2,4})\)\s*([A-Za-z0-9.\-/]+)/g;

export function parseGs1ApplicationIdentifiers(text: string): Gs1Fields {
  const fields: Gs1Fields = {};
  for (const match of text.matchAll(GS1_AI_PATTERN)) {
    const [, ai, rawValue] = match;
    const value = rawValue.trim();
    if (!value) continue;
    switch (ai) {
      case '01':
        fields.gtin = value;
        break;
      case '240':
        fields.ref = value;
        break;
      case '10':
        fields.lot = value;
        break;
      case '21':
        fields.serial = value;
        break;
      case '17':
        fields.expiryDate = value;
        break;
    }
  }
  return fields;
}

export function hasGs1Fields(fields: Gs1Fields): boolean {
  return Boolean(fields.gtin || fields.ref || fields.lot || fields.serial || fields.expiryDate);
}

/** Formats a raw AI (17) YYMMDD value as "DD.MM.20YY"; returns null if it isn't 6 digits. */
export function formatGs1Date(value: string): string | null {
  if (!/^\d{6}$/.test(value)) return null;
  const yy = value.slice(0, 2);
  const mm = value.slice(2, 4);
  const dd = value.slice(4, 6);
  return `${dd}.${mm}.20${yy}`;
}
