import type { RecognitionResult } from '@/types/database';
import { readBarcodesFromImage } from './barcodeReader';
import { dedupeCandidates, extractIdentifierCandidates } from './identifierPatterns';
import { readTextFromImage } from './ocrReader';

export type RecognitionStage = 'barcode' | 'ocr' | 'done';

/** OCR must never block the flow indefinitely (slow network, worker crash, unsupported device). */
const OCR_TIMEOUT_MS = 15000;

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        console.warn('OCR fehlgeschlagen', error);
        resolve(fallback);
      },
    );
  });
}

/**
 * Runs the full assistive recognition pipeline over one or more captured
 * photos of the same Sieb (e.g. an overview shot plus a barcode close-up):
 * barcode/QR decoding and OCR run per photo in parallel, then every match
 * across all photos is merged into a single ranked list of tray-identifier
 * candidates. Nothing here is final - the calling screen always requires
 * the user to confirm the identifier (or pick a different candidate / enter
 * one manually) before a match is looked up against the reference database.
 */
export async function runRecognition(
  imageDataUrls: string[],
  onStage?: (stage: RecognitionStage) => void,
): Promise<RecognitionResult> {
  const started = performance.now();

  onStage?.('barcode');
  const barcodeResults = await Promise.all(imageDataUrls.map((url) => readBarcodesFromImage(url)));

  onStage?.('ocr');
  const ocrResults = await Promise.all(
    imageDataUrls.map((url) => withTimeout(readTextFromImage(url), OCR_TIMEOUT_MS, { text: '', confidence: 0 })),
  );

  const barcodeValues = dedupeStrings(barcodeResults.flatMap((r) => r.barcodeValues));
  const qrValues = dedupeStrings(barcodeResults.flatMap((r) => r.qrValues));
  const ocrText = ocrResults
    .map((r) => r.text.trim())
    .filter(Boolean)
    .join('\n');
  const ocrConfidence = ocrResults.reduce((max, r) => Math.max(max, r.confidence), 0);

  const candidates = dedupeCandidates([
    ...qrValues.flatMap((v) => extractIdentifierCandidates(v, 'qr', 0.98)),
    ...barcodeValues.flatMap((v) => extractIdentifierCandidates(v, 'barcode', 0.95)),
    ...ocrResults.flatMap((r) => extractIdentifierCandidates(r.text, 'ocr', Math.max(r.confidence / 100, 0.3))),
  ]);

  onStage?.('done');

  return {
    barcodeValues,
    qrValues,
    ocrText,
    candidateIdentifiers: candidates,
    ocrConfidence: ocrConfidence || null,
    processingTimeMs: Math.round(performance.now() - started),
  };
}

function dedupeStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}
