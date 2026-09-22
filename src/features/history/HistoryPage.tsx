import { TopBar } from '@/components/layout/TopBar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { dataProvider } from '@/services';
import type { ScanRecord, Supplier, Tray } from '@/types/database';
import { ClipboardList } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export function HistoryPage() {
  const [scans, setScans] = useState<ScanRecord[] | null>(null);
  const [trays, setTrays] = useState<Tray[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    Promise.all([dataProvider.getScanHistory(), dataProvider.getTrays(), dataProvider.getSuppliers()]).then(
      ([scanHistory, trayList, supplierList]) => {
        setScans(scanHistory);
        setTrays(trayList);
        setSuppliers(supplierList);
      },
    );
  }, []);

  return (
    <div>
      <TopBar title="Sieb-Historie" subtitle="Alle durchgeführten Kontrollen" />

      <div className="px-4 py-4">
        {scans === null && <p className="py-10 text-center text-sm text-ink-400">Wird geladen …</p>}

        {scans !== null && scans.length === 0 && <EmptyState />}

        <div className="space-y-2.5">
          {scans?.map((scan) => {
            const tray = trays.find((t) => t.id === scan.trayId);
            const supplier = suppliers.find((s) => s.id === scan.supplierId);
            const hasDeviation = scan.missingInstrumentIds.length > 0 || scan.extraInstruments.length > 0;

            return (
              <Link key={scan.id} to={`/historie/${scan.id}`} className="block">
                <Card className="p-3.5 active:bg-ink-50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-medium text-brand-600">
                        {tray?.code ?? scan.matchedIdentifier ?? 'Unbekannt'}
                      </p>
                      <p className="truncate text-sm font-semibold text-ink-900">
                        {tray?.name ?? 'Sieb ohne Referenz'}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-500">
                        {supplier?.name ?? '–'} · {formatDate(scan.createdAt)}
                      </p>
                    </div>
                    <Badge tone={hasDeviation ? 'warning' : 'success'}>
                      {hasDeviation ? 'Abweichung' : 'Vollständig'}
                    </Badge>
                  </div>
                  <div className="mt-2.5 flex gap-4 text-xs text-ink-500">
                    <span>Erwartet: {scan.expectedCount}</span>
                    <span>Erkannt: {scan.detectedCount}</span>
                    {scan.missingInstrumentIds.length > 0 && (
                      <span className="text-danger-600">Fehlend: {scan.missingInstrumentIds.length}</span>
                    )}
                    {scan.extraInstruments.length > 0 && (
                      <span className="text-warning-600">Zusätzlich: {scan.extraInstruments.length}</span>
                    )}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-400">
        <ClipboardList size={26} />
      </div>
      <p className="text-sm font-medium text-ink-700">Noch keine Kontrollen erfasst</p>
      <p className="max-w-[220px] text-xs text-ink-500">
        Starten Sie im Modul LEIH-SIEB SCANNER Ihre erste Sieb-Kontrolle.
      </p>
    </div>
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
