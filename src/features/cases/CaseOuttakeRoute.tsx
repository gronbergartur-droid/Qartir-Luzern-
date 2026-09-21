import { TopBar } from '@/components/layout/TopBar';
import { dataProvider } from '@/services';
import type { LoanCase, ScanRecord, Supplier, Tray } from '@/types/database';
import type { ScannerMode } from '@/features/scanner/scannerTypes';
import { Suspense, lazy, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const ScannerFlow = lazy(() =>
  import('@/features/scanner/ScannerFlow').then((m) => ({ default: m.ScannerFlow })),
);

/**
 * Loads an open case (and its tray/supplier/intake scan) before handing off
 * to the shared ScannerFlow in case-outtake mode - the outtake scan is
 * always compared against exactly this case's intake scan.
 */
export function CaseOuttakeRoute() {
  const { caseId } = useParams<{ caseId: string }>();
  const [state, setState] = useState<
    | { status: 'loading' }
    | { status: 'not-found' }
    | { status: 'already-closed' }
    | { status: 'ready'; mode: ScannerMode }
  >({ status: 'loading' });

  useEffect(() => {
    if (!caseId) return;
    (async () => {
      const loanCase: LoanCase | null = await dataProvider.getCase(caseId);
      if (!loanCase) {
        setState({ status: 'not-found' });
        return;
      }
      if (loanCase.status === 'compared') {
        setState({ status: 'already-closed' });
        return;
      }
      const trays: Tray[] = await dataProvider.getTrays();
      const tray = trays.find((t) => t.id === loanCase.trayId) ?? null;
      if (!tray) {
        setState({ status: 'not-found' });
        return;
      }
      const [supplier, intakeScan]: [Supplier | null, ScanRecord | null] = await Promise.all([
        dataProvider.getSupplier(tray.supplierId),
        dataProvider.getScan(loanCase.intakeScanId),
      ]);
      if (!intakeScan) {
        setState({ status: 'not-found' });
        return;
      }
      setState({
        status: 'ready',
        mode: { kind: 'case-outtake', caseId: loanCase.id, tray, supplier, intakeScan },
      });
    })();
  }, [caseId]);

  if (state.status === 'loading') {
    return (
      <div>
        <TopBar title="Ausgang erfassen" showBack />
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
        </div>
      </div>
    );
  }

  if (state.status === 'not-found') {
    return (
      <div>
        <TopBar title="Ausgang erfassen" showBack />
        <p className="px-4 py-10 text-center text-sm text-ink-400">Fall nicht gefunden.</p>
      </div>
    );
  }

  if (state.status === 'already-closed') {
    return (
      <div>
        <TopBar title="Ausgang erfassen" showBack />
        <p className="px-4 py-10 text-center text-sm text-ink-400">
          Für diesen Fall wurde der Ausgang bereits erfasst.
        </p>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="flex items-center justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" /></div>}>
      <ScannerFlow mode={state.mode} />
    </Suspense>
  );
}
