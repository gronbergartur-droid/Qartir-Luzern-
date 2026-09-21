import type { RecognitionStage } from '../recognition/runRecognition';

const STAGE_TEXT: Record<RecognitionStage, string> = {
  barcode: 'Barcode & QR-Code werden gesucht …',
  ocr: 'Textinhalt wird gelesen (OCR) …',
  done: 'Ergebnisse werden zusammengeführt …',
};

export function RecognizingStep({
  imageDataUrl,
  stage,
}: {
  imageDataUrl: string | null;
  stage: RecognitionStage;
}) {
  return (
    <div className="flex flex-col items-center gap-6 px-4 py-10">
      {imageDataUrl && (
        <div className="relative h-48 w-36 overflow-hidden rounded-xl border border-ink-200">
          <img src={imageDataUrl} alt="Aufgenommenes Leihsieb" className="h-full w-full object-cover" />
          <div className="absolute inset-0 animate-pulse bg-brand-600/10" />
        </div>
      )}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
        <p className="text-sm font-medium text-ink-700">{STAGE_TEXT[stage]}</p>
        <p className="max-w-xs text-xs text-ink-500">
          Barcode, QR-Code und Text werden automatisch erkannt. Das Ergebnis muss anschliessend
          bestätigt werden.
        </p>
      </div>
    </div>
  );
}
