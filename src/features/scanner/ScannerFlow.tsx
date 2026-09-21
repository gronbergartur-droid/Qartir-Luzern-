import { TopBar } from '@/components/layout/TopBar';
import { dataProvider } from '@/services';
import type {
  AuditLogEntry,
  ExtraInstrumentEntry,
  InstrumentCheckEntry,
  ScanRecord,
  Supplier,
  Tray,
} from '@/types/database';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CameraCapture } from './CameraCapture';
import { StepProgress } from './components/StepProgress';
import type { RecognitionStage } from './recognition/runRecognition';
import { runRecognition } from './recognition/runRecognition';
import { createInitialScannerState, STEP_LABELS } from './scannerTypes';
import { DoneStep } from './steps/DoneStep';
import { IdentifyStep } from './steps/IdentifyStep';
import { InstrumentCheckStep } from './steps/InstrumentCheckStep';
import { RecognizingStep } from './steps/RecognizingStep';
import { SummaryStep } from './steps/SummaryStep';
import { TrayMatchedStep } from './steps/TrayMatchedStep';
import { UnmatchedStep } from './steps/UnmatchedStep';

export function ScannerFlow() {
  const navigate = useNavigate();
  const [state, setState] = useState(createInitialScannerState);
  const [recognitionStage, setRecognitionStage] = useState<RecognitionStage>('barcode');
  const [allTrays, setAllTrays] = useState<Tray[]>([]);
  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);
  const [saving, setSaving] = useState(false);

  const patch = useCallback((p: Partial<typeof state>) => setState((prev) => ({ ...prev, ...p })), []);

  const resetFlow = useCallback(() => {
    setState(createInitialScannerState());
    setRecognitionStage('barcode');
  }, []);

  const handleCapture = useCallback(
    async (imageDataUrl: string) => {
      patch({ imageDataUrl, step: 'recognizing' });
      try {
        const recognition = await runRecognition(imageDataUrl, setRecognitionStage);
        patch({
          recognition,
          selectedIdentifier: recognition.candidateIdentifiers[0]?.value ?? null,
          step: 'identify',
        });
      } catch (error) {
        console.error('Erkennung fehlgeschlagen', error);
        patch({
          recognition: {
            barcodeValues: [],
            qrValues: [],
            ocrText: '',
            candidateIdentifiers: [],
            ocrConfidence: null,
            processingTimeMs: 0,
          },
          step: 'identify',
        });
      }
    },
    [patch],
  );

  const loadTrayIntoState = useCallback(
    async (tray: Tray) => {
      const [supplier, instruments] = await Promise.all([
        dataProvider.getSupplier(tray.supplierId),
        dataProvider.getTrayInstruments(tray.id),
      ]);
      const checks: InstrumentCheckEntry[] = instruments.map((instrument) => ({
        instrumentId: instrument.id,
        name: instrument.name,
        quantityExpected: instrument.quantity,
        quantityConfirmed: 0,
        critical: instrument.critical,
        userConfirmed: false,
      }));
      patch({
        tray,
        supplier,
        instruments,
        checks,
        step: 'matched',
      });

      await dataProvider.appendAuditEntry(
        buildAuditEntry(state.scanId, 'scan_matched', { trayCode: tray.code }),
      );
    },
    [patch, state.scanId],
  );

  const handleConfirmIdentifier = useCallback(
    async (identifier: string) => {
      patch({ selectedIdentifier: identifier, step: 'matching' });
      const tray = await dataProvider.findTrayByIdentifier(identifier);
      if (tray) {
        await loadTrayIntoState(tray);
      } else {
        const [trays, suppliers] = await Promise.all([dataProvider.getTrays(), dataProvider.getSuppliers()]);
        setAllTrays(trays);
        setAllSuppliers(suppliers);
        await dataProvider.appendAuditEntry(
          buildAuditEntry(state.scanId, 'scan_unmatched', { identifier }),
        );
        patch({ step: 'unmatched' });
      }
    },
    [loadTrayIntoState, patch, state.scanId],
  );

  const handleUpdateCheck = useCallback(
    (instrumentId: string, checkPatch: Partial<InstrumentCheckEntry>) => {
      setState((prev) => ({
        ...prev,
        checks: prev.checks.map((c) => (c.instrumentId === instrumentId ? { ...c, ...checkPatch } : c)),
      }));
    },
    [],
  );

  const handleAddExtra = useCallback((entry: Omit<ExtraInstrumentEntry, 'id'>) => {
    setState((prev) => ({
      ...prev,
      extraInstruments: [...prev.extraInstruments, { ...entry, id: crypto.randomUUID() }],
    }));
  }, []);

  const handleRemoveExtra = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      extraInstruments: prev.extraInstruments.filter((e) => e.id !== id),
    }));
  }, []);

  const handleConfirmAndSave = useCallback(async () => {
    if (!state.tray) return;
    setSaving(true);
    try {
      const detectedCount =
        state.checks.reduce((sum, c) => sum + c.quantityConfirmed, 0) +
        state.extraInstruments.reduce((sum, e) => sum + e.quantity, 0);
      const missingInstrumentIds = state.checks
        .filter((c) => c.quantityConfirmed < c.quantityExpected)
        .map((c) => c.instrumentId);

      const record: ScanRecord = {
        id: state.scanId,
        trayId: state.tray.id,
        supplierId: state.supplier?.id ?? null,
        capturedImageDataUrl: state.imageDataUrl,
        recognition: state.recognition,
        matchedIdentifier: state.selectedIdentifier,
        status: 'confirmed',
        expectedCount: state.tray.expectedInstrumentCount,
        detectedCount,
        instrumentChecks: state.checks,
        extraInstruments: state.extraInstruments,
        missingInstrumentIds,
        notes: state.notes || null,
        performedBy: state.performedBy,
        createdAt: new Date().toISOString(),
        confirmedAt: new Date().toISOString(),
      };

      await dataProvider.saveScan(record);
      await dataProvider.appendAuditEntry(
        buildAuditEntry(state.scanId, 'scan_confirmed', {
          trayCode: state.tray.code,
          expectedCount: record.expectedCount,
          detectedCount: record.detectedCount,
          missing: missingInstrumentIds.length,
          extra: state.extraInstruments.length,
        }),
      );

      patch({ step: 'done' });
    } finally {
      setSaving(false);
    }
  }, [patch, state]);

  return (
    <div>
      <TopBar
        title={STEP_LABELS[state.step]}
        subtitle="LEIH-SIEB SCANNER"
        showBack={state.step !== 'capture' && state.step !== 'done'}
        onBack={() => {
          if (state.step === 'identify') patch({ step: 'capture' });
          else if (state.step === 'unmatched') patch({ step: 'identify' });
          else if (state.step === 'matched') patch({ step: 'identify' });
          else if (state.step === 'instruments') patch({ step: 'matched' });
          else if (state.step === 'summary') patch({ step: 'instruments' });
          else navigate(-1);
        }}
      />
      <StepProgress step={state.step} />

      {state.step === 'capture' && <div className="px-4 py-4"><CameraCapture onCapture={handleCapture} /></div>}

      {state.step === 'recognizing' && (
        <RecognizingStep imageDataUrl={state.imageDataUrl} stage={recognitionStage} />
      )}

      {state.step === 'identify' && state.recognition && (
        <IdentifyStep
          imageDataUrl={state.imageDataUrl}
          recognition={state.recognition}
          onConfirm={handleConfirmIdentifier}
          onRetake={resetFlow}
        />
      )}

      {state.step === 'matching' && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
        </div>
      )}

      {state.step === 'unmatched' && state.selectedIdentifier && (
        <UnmatchedStep
          identifier={state.selectedIdentifier}
          trays={allTrays}
          suppliers={allSuppliers}
          onSelectTray={loadTrayIntoState}
          onRetake={resetFlow}
        />
      )}

      {state.step === 'matched' && state.tray && (
        <TrayMatchedStep
          tray={state.tray}
          supplier={state.supplier}
          imageDataUrl={state.imageDataUrl}
          onContinue={() => patch({ step: 'instruments' })}
          onWrongMatch={() => patch({ step: 'identify' })}
        />
      )}

      {state.step === 'instruments' && state.tray && (
        <InstrumentCheckStep
          checks={state.checks}
          extras={state.extraInstruments}
          expectedCount={state.tray.expectedInstrumentCount}
          onUpdateCheck={handleUpdateCheck}
          onAddExtra={handleAddExtra}
          onRemoveExtra={handleRemoveExtra}
          onContinue={() => patch({ step: 'summary' })}
        />
      )}

      {state.step === 'summary' && state.tray && (
        <SummaryStep
          tray={state.tray}
          supplier={state.supplier}
          checks={state.checks}
          extras={state.extraInstruments}
          notes={state.notes}
          onNotesChange={(notes) => patch({ notes })}
          onConfirmAndSave={handleConfirmAndSave}
          saving={saving}
        />
      )}

      {state.step === 'done' && <DoneStep scanId={state.scanId} onStartNew={resetFlow} />}
    </div>
  );
}

function buildAuditEntry(scanId: string, action: AuditLogEntry['action'], details: Record<string, unknown>): AuditLogEntry {
  return {
    id: crypto.randomUUID(),
    entityType: 'scan',
    entityId: scanId,
    action,
    performedBy: 'AEMP-Mitarbeiter:in',
    details,
    createdAt: new Date().toISOString(),
  };
}
