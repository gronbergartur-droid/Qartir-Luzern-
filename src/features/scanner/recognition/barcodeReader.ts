import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType, NotFoundException } from '@zxing/library';

export interface BarcodeReadResult {
  qrValues: string[];
  barcodeValues: string[];
}

const QR_FORMATS = new Set([BarcodeFormat.QR_CODE, BarcodeFormat.DATA_MATRIX, BarcodeFormat.AZTEC]);

let reader: BrowserMultiFormatReader | null = null;

function getReader(): BrowserMultiFormatReader {
  if (!reader) {
    const hints = new Map();
    hints.set(DecodeHintType.TRY_HARDER, true);
    reader = new BrowserMultiFormatReader(hints);
  }
  return reader;
}

/**
 * Attempts to decode any barcode/QR code visible in the captured photo.
 * ZXing's single-shot decode only returns the first code it locates, which
 * matches the expected use case (one tray label per photo); a future
 * iteration could crop/retry sub-regions to find multiple codes.
 */
export async function readBarcodesFromImage(imageDataUrl: string): Promise<BarcodeReadResult> {
  const result: BarcodeReadResult = { qrValues: [], barcodeValues: [] };

  try {
    const decoded = await getReader().decodeFromImageUrl(imageDataUrl);
    const text = decoded.getText();
    const format = decoded.getBarcodeFormat();
    if (QR_FORMATS.has(format)) {
      result.qrValues.push(text);
    } else {
      result.barcodeValues.push(text);
    }
  } catch (error) {
    if (!(error instanceof NotFoundException)) {
      console.warn('Barcode/QR-Erkennung fehlgeschlagen', error);
    }
  }

  return result;
}
