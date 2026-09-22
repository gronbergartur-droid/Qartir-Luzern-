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
 * Runs the full assistive recognition pipeline over one captured photo:
 * barcode/QR decoding and OCR, run in parallel, then merges every match
 * into a ranked list of tray-identifier candidates. Nothing here is final -
 * the calling screen always requires the user to confirm the identifier
 * (or pick a different candidate / enter one manually) before a match is
 * looked up against the reference database.
 */
export async function runRecognition(
  imageDataUrl: string,
  onStage?: (stage: RecognitionStage) => void,
): Promise<RecognitionResult> {
  const started = performance.now();

  onStage?.('barcode');
  const barcodePromise = readBarcodesFromImage(imageDataUrl);

  onStage?.('ocr');
  const ocrPromise = withTimeout(readTextFromImage(imageDataUrl), OCR_TIMEOUT_MS, {
    text: '',
    confidence: 0,
  });

  const [barcodeResult, ocrResult] = await Promise.all([barcodePromise, ocrPromise]);

  const candidates = dedupeCandidates([
    ...barcodeResult.qrValues.flatMap((v) => extractIdentifierCandidates(v, 'qr', 0.98)),
    ...barcodeResult.barcodeValues.flatMap((v) => extractIdentifierCandidates(v, 'barcode', 0.95)),
    ...extractIdentifierCandidates(ocrResult.text, 'ocr', Math.max(ocrResult.confidence / 100, 0.3)),
  ]);

  onStage?.('done');

  return {
    barcodeValues: barcodeResult.barcodeValues,
    qrValues: barcodeResult.qrValues,
    ocrText: ocrResult.text,
    candidateIdentifiers: candidates,
    ocrConfidence: ocrResult.confidence || null,
    processingTimeMs: Math.round(performance.now() - started),
  };
}
