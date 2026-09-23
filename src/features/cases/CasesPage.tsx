import { TopBar } from '@/components/layout/TopBar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { dataProvider } from '@/services';
import type { LoanCase, Physician, Supplier, Tray } from '@/types/database';
import { ClipboardList, PackageOpen, ScanLine } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export function CasesPage() {
  const [cases, setCases] = useState<LoanCase[] | null>(null);
  const [trays, setTrays] = useState<Tray[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [physicians, setPhysicians] = useState<Physician[]>([]);

  useEffect(() => {
    Promise.all([
      dataProvider.getCases(),
      dataProvider.getTrays(),
      dataProvider.getSuppliers(),
      dataProvider.getPhysicians(),
    ]).then(([caseList, trayList, supplierList, physicianList]) => {
      setCases(caseList);
      setTrays(trayList);
      setSuppliers(supplierList);
      setPhysicians(physicianList);
    });
  }, []);

  const openCases = cases?.filter((c) => c.status === 'outtake_pending') ?? [];
  const comparedCases = cases?.filter((c) => c.status === 'compared') ?? [];

  return (
    <div>
      <TopBar title="Sieb-Fälle" subtitle="Eingang, Ausgang & Vorher/Nachher-Vergleich" />

      <div className="px-4 py-4">
        <Link to="/faelle/eingang">
          <Card className="flex items-center gap-3 border-brand-600 bg-gradient-to-br from-brand-600 to-brand-800 p-4 text-white active:opacity-95">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <ScanLine size={22} />
            </div>
            <div>
              <p className="font-semibold">Neues Leihsieb erfassen</p>
              <p className="text-xs text-brand-100">Eingangs-Scan starten und Fall eröffnen</p>
            </div>
          </Card>
        </Link>

        {cases === null && <p className="py-10 text-center text-sm text-ink-400">Wird geladen …</p>}

        {cases !== null && cases.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-400">
              <ClipboardList size={26} />
            </div>
            <p className="text-sm font-medium text-ink-700">Noch keine Sieb-Fälle</p>
          </div>
        )}

        {openCases.length > 0 && (
          <>
            <p className="mb-2 mt-6 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
              <PackageOpen size={14} /> Offen – wartet auf Ausgang ({openCases.length})
            </p>
            <div className="space-y-2">
              {openCases.map((c) => (
                <CaseCard
                  key={c.id}
                  loanCase={c}
                  tray={trays.find((t) => t.id === c.trayId)}
                  supplier={suppliers.find((s) => s.id === c.supplierId)}
                  operateur={physicians.find((p) => p.id === c.operateurId)}
                />
              ))}
            </div>
          </>
        )}

        {comparedCases.length > 0 && (
          <>
            <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-ink-500">
              Abgeschlossen ({comparedCases.length})
            </p>
            <div className="space-y-2">
              {comparedCases.map((c) => (
                <CaseCard
                  key={c.id}
                  loanCase={c}
                  tray={trays.find((t) => t.id === c.trayId)}
                  supplier={suppliers.find((s) => s.id === c.supplierId)}
                  operateur={physicians.find((p) => p.id === c.operateurId)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CaseCard({
  loanCase,
  tray,
  supplier,
  operateur,
}: {
  loanCase: LoanCase;
  tray?: Tray;
  supplier?: Supplier;
  operateur?: Physician;
}) {
  const statusBadge =
    loanCase.status === 'outtake_pending' ? (
      <Badge tone="neutral">Offen</Badge>
    ) : loanCase.comparison?.hasDeviations ? (
      <Badge tone="warning">Abweichung</Badge>
    ) : (
      <Badge tone="success">Vollständig</Badge>
    );

  return (
    <Card className="p-3.5">
      <Link to={`/faelle/${loanCase.id}`} className="block">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-mono text-xs font-medium text-brand-600">{tray?.code ?? '–'}</p>
            <p className="text-sm font-semibold text-ink-900">{tray?.name ?? 'Unbekanntes Sieb'}</p>
            <p className="mt-0.5 text-xs text-ink-500">
              {supplier?.name ?? '–'} · {formatDate(loanCase.createdAt)}
            </p>
          </div>
          {statusBadge}
        </div>
        {loanCase.operationNote && <p className="mt-2 text-xs text-ink-500">Operation: {loanCase.operationNote}</p>}
        {operateur && <p className="mt-0.5 text-xs text-ink-500">Operateur: {operateur.name}</p>}
      </Link>

      {loanCase.status === 'outtake_pending' && (
        <Link to={`/faelle/${loanCase.id}/ausgang`}>
          <Button variant="secondary" size="md" fullWidth className="mt-3">
            Ausgang erfassen
          </Button>
        </Link>
      )}
    </Card>
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
