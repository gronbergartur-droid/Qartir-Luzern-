import { TopBar } from '@/components/layout/TopBar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { dataProvider } from '@/services';
import type { ScanRecord, Supplier, Tray } from '@/types/database';
import { useEffect, useState, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';

export function ScanDetailPage() {
  const { scanId } = useParams<{ scanId: string }>();
  const [scan, setScan] = useState<ScanRecord | null | undefined>(undefined);
  const [tray, setTray] = useState<Tray | null>(null);
  const [supplier, setSupplier] = useState<Supplier | null>(null);

  useEffect(() => {
    if (!scanId) return;
    dataProvider.getScan(scanId).then(async (found) => {
      setScan(found);
      if (found?.trayId) {
        const trays = await dataProvider.getTrays();
        const matchedTray = trays.find((t) => t.id === found.trayId) ?? null;
        setTray(matchedTray);
        if (matchedTray) setSupplier(await dataProvider.getSupplier(matchedTray.supplierId));
      }
    });
  }, [scanId]);

  if (scan === undefined) {
    return (
      <div>
        <TopBar title="Scan-Details" showBack />
        <p className="px-4 py-10 text-center text-sm text-ink-400">Wird geladen …</p>
      </div>
    );
  }

  if (scan === null) {
    return (
      <div>
        <TopBar title="Scan-Details" showBack />
        <p className="px-4 py-10 text-center text-sm text-ink-400">Scan nicht gefunden.</p>
      </div>
    );
  }

  const missing = scan.instrumentChecks.filter((c) => c.quantityConfirmed < c.quantityExpected);

  return (
    <div>
      <TopBar title={tray?.code ?? 'Scan-Details'} subtitle={tray?.name} showBack />

      <div className="px-4 py-4">
        {scan.capturedImageDataUrl && (
          <img
            src={scan.capturedImageDataUrl}
            alt="Aufgenommenes Leihsieb"
            className="mb-4 h-44 w-full rounded-xl object-cover"
          />
        )}

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-ink-500">{supplier?.name ?? '–'}</p>
              <p className="text-sm font-semibold text-ink-900">{formatDate(scan.createdAt)}</p>
            </div>
            <Badge tone={missing.length > 0 || scan.extraInstruments.length > 0 ? 'warning' : 'success'}>
              {missing.length > 0 || scan.extraInstruments.length > 0 ? 'Abweichung' : 'Vollständig'}
            </Badge>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-ink-50 p-3 text-center">
              <p className="text-lg font-bold text-ink-900">{scan.expectedCount}</p>
              <p className="text-[11px] text-ink-500">Erwartet</p>
            </div>
            <div className="rounded-xl bg-ink-50 p-3 text-center">
              <p className="text-lg font-bold text-ink-900">{scan.detectedCount}</p>
              <p className="text-[11px] text-ink-500">Erkannt / bestätigt</p>
            </div>
          </div>
        </Card>

        {missing.length > 0 && (
          <Section title={`Fehlende Instrumente (${missing.length})`} tone="danger">
            {missing.map((m) => (
              <Row key={m.instrumentId} label={m.name} value={`${m.quantityConfirmed}/${m.quantityExpected}`} />
            ))}
          </Section>
        )}

        {scan.extraInstruments.length > 0 && (
          <Section title={`Zusätzliche Instrumente (${scan.extraInstruments.length})`} tone="warning">
            {scan.extraInstruments.map((e) => (
              <Row key={e.id} label={e.name} value={`×${e.quantity}`} />
            ))}
          </Section>
        )}

        {scan.notes && (
          <Section title="Bemerkung" tone="neutral">
            <p className="px-3 py-2 text-sm text-ink-700">{scan.notes}</p>
          </Section>
        )}

        {scan.matchedIdentifier && (
          <p className="mt-4 text-xs text-ink-400">
            Erkannter Code: <span className="font-mono">{scan.matchedIdentifier}</span> · Bestätigt von{' '}
            {scan.performedBy}
          </p>
        )}
      </div>
    </div>
  );
}

function Section({ title, tone, children }: { title: string; tone: 'danger' | 'warning' | 'neutral'; children: ReactNode }) {
  const bg = tone === 'danger' ? 'bg-danger-50' : tone === 'warning' ? 'bg-warning-50' : 'bg-ink-50';
  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">{title}</p>
      <div className={`space-y-1.5 rounded-xl ${tone === 'neutral' ? bg : ''}`}>{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2 text-sm">
      <span className="text-ink-700">{label}</span>
      <span className="font-medium text-ink-500">{value}</span>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
