import { createWorker, type Worker } from 'tesseract.js';

export interface OcrReadResult {
  text: string;
  confidence: number;
}

let workerPromise: Promise<Worker> | null = null;

/**
 * The OCR engine (worker script + wasm core) is self-hosted under
 * /public/tesseract/ so recognition works on hospital intranets without a
 * dependency on a third-party CDN. Only the language model ("traineddata")
 * still defaults to tesseract.js's CDN unless VITE_TESSERACT_LANG_PATH
 * points at an internally hosted copy - see README for the offline setup.
 */
const langPath = import.meta.env.VITE_TESSERACT_LANG_PATH as string | undefined;

/** Lazily initialised, reused across scans so repeat captures stay fast. */
function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = createWorker('eng', undefined, {
      workerPath: '/tesseract/worker.min.js',
      corePath: '/tesseract/tesseract-core-lstm.wasm.js',
      ...(langPath ? { langPath } : {}),
      logger: () => {
        // Intentionally silent; caller reports coarse progress instead.
      },
    });
  }
  return workerPromise;
}

/**
 * Runs OCR over the captured tray photo. Tray labels use uppercase Latin
 * alphanumeric codes regardless of hospital language, so the English model
 * is used for speed; this can be extended to a multi-language pipeline
 * later if free-text labels need to be read too.
 */
export async function readTextFromImage(imageDataUrl: string): Promise<OcrReadResult> {
  const worker = await getWorker();
  const { data } = await worker.recognize(imageDataUrl);
  return {
    text: data.text ?? '',
    confidence: data.confidence ?? 0,
  };
}
