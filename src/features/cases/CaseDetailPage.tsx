import { TopBar } from '@/components/layout/TopBar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { dataProvider } from '@/services';
import type { LoanCase, Physician, ScanRecord, Supplier, Tray } from '@/types/database';
import { ArrowRight, Calendar, Camera, Mail, ScanLine, Stethoscope, Truck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ComparisonResultView } from './ComparisonResultView';

export function CaseDetailPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const [loanCase, setLoanCase] = useState<LoanCase | null | undefined>(undefined);
  const [tray, setTray] = useState<Tray | null>(null);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [operateur, setOperateur] = useState<Physician | null>(null);
  const [intakeScan, setIntakeScan] = useState<ScanRecord | null>(null);
  const [outtakeScan, setOuttakeScan] = useState<ScanRecord | null>(null);

  useEffect(() => {
    if (!caseId) return;
    dataProvider.getCase(caseId).then(async (found) => {
      setLoanCase(found);
      if (!found) return;
      const [trays, intake] = await Promise.all([dataProvider.getTrays(), dataProvider.getScan(found.intakeScanId)]);
      const foundTray = trays.find((t) => t.id === found.trayId) ?? null;
      setTray(foundTray);
      setIntakeScan(intake);
      if (foundTray) setSupplier(await dataProvider.getSupplier(foundTray.supplierId));
      if (found.outtakeScanId) setOuttakeScan(await dataProvider.getScan(found.outtakeScanId));
      if (found.operateurId) {
        const physicians = await dataProvider.getPhysicians();
        setOperateur(physicians.find((p) => p.id === found.operateurId) ?? null);
      }
    });
  }, [caseId]);

  if (loanCase === undefined) {
    return (
      <div>
        <TopBar title="Sieb-Fall" showBack />
        <p className="px-4 py-10 text-center text-sm text-ink-400">Wird geladen …</p>
      </div>
    );
  }

  if (loanCase === null) {
    return (
      <div>
        <TopBar title="Sieb-Fall" showBack />
        <p className="px-4 py-10 text-center text-sm text-ink-400">Fall nicht gefunden.</p>
      </div>
    );
  }

  return (
    <div>
      <TopBar title={tray?.code ?? 'Sieb-Fall'} subtitle={tray?.name} showBack />

      <div className="px-4 py-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {supplier && (
                <Badge tone="brand">
                  <Truck size={12} />
                  {supplier.name}
                </Badge>
              )}
            </div>
            <Badge tone={loanCase.status === 'outtake_pending' ? 'neutral' : loanCase.comparison?.hasDeviations ? 'warning' : 'success'}>
              {loanCase.status === 'outtake_pending' ? 'Offen' : loanCase.comparison?.hasDeviations ? 'Abweichung' : 'Vollständig'}
            </Badge>
          </div>

          {(loanCase.operationNote || loanCase.operationDate) && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-600">
              <Calendar size={13} className="shrink-0 text-ink-400" />
              {loanCase.operationNote}
              {loanCase.operationDate && ` · ${loanCase.operationDate}`}
            </p>
          )}

          {operateur && (
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-600">
              <Stethoscope size={13} className="shrink-0 text-ink-400" />
              {operateur.name}
            </p>
          )}
        </Card>

        <p className="mb-2 mt-6 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
          <ScanLine size={14} /> Eingang
        </p>
        <ScanSummaryCard scan={intakeScan} performedBy={loanCase.performedByIntake} />

        <p className="mb-2 mt-6 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
          <ScanLine size={14} /> Ausgang
        </p>
        {loanCase.status === 'outtake_pending' ? (
          <Link to={`/faelle/${loanCase.id}/ausgang`}>
            <Button size="lg" fullWidth icon={<ArrowRight size={16} />}>
              Ausgang erfassen
            </Button>
          </Link>
        ) : (
          <ScanSummaryCard scan={outtakeScan} performedBy={loanCase.performedByOuttake} />
        )}

        {loanCase.comparison && (
          <div className="mt-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Vergleich</p>
            <ComparisonResultView comparison={loanCase.comparison} />
          </div>
        )}

        {loanCase.status === 'compared' && (
          <div className="mt-6">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
              <Camera size={14} /> Sieb-Bereitschaft
            </p>
            {loanCase.readinessNotifiedAt ? (
              <Card className="p-3.5">
                <div className="flex items-center gap-2 text-success-700">
                  <Mail size={16} />
                  <p className="text-sm font-medium">Lieferant benachrichtigt</p>
                </div>
                <p className="mt-1 text-xs text-ink-500">{formatDate(loanCase.readinessNotifiedAt)}</p>
                {loanCase.hygienePassportPhotoUrl && (
                  <img
                    src={loanCase.hygienePassportPhotoUrl}
                    alt="Hygiene-Pass"
                    className="mt-3 max-h-48 w-full rounded-xl object-contain"
                  />
                )}
              </Card>
            ) : (
              <Link to={`/faelle/${loanCase.id}/hygiene-pass`}>
                <Button size="lg" fullWidth icon={<Camera size={16} />}>
                  Hygiene-Pass fotografieren & Lieferant benachrichtigen
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ScanSummaryCard({ scan, performedBy }: { scan: ScanRecord | null; performedBy: string | null }) {
  if (!scan) return <p className="text-sm text-ink-400">Nicht verfügbar.</p>;
  return (
    <Link to={`/historie/${scan.id}`} className="block">
      <Card className="flex items-center justify-between p-3.5 active:bg-ink-50">
        <div>
          <p className="text-sm font-medium text-ink-900">{formatDate(scan.createdAt)}</p>
          <p className="text-xs text-ink-500">{performedBy}</p>
        </div>
        <div className="text-right text-xs text-ink-500">
          <p>
            {scan.detectedCount}/{scan.expectedCount} Instrumente
          </p>
        </div>
      </Card>
    </Link>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
