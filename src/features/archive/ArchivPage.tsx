import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/lib/auth/AuthContext';
import { dataProvider } from '@/services';
import { buildMonthlyArchive, formatMonthLabel, listAvailableMonths, statsForMonth } from './generateMonthlyArchive';
import type { AuditLogEntry, LoanCase, Physician, ScanRecord, Supplier, Tray } from '@/types/database';
import { Archive, Download } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Monthly compliance archive for Swiss 10-year retention: one ZIP per
 * month (Lieferanten, Siebe, Sieb-Fälle, Scans, Sterilisation/Hygiene-Pass
 * photos, Audit-Log - see generateMonthlyArchive.ts for the exact layout).
 * Meant as a second, locally-kept copy alongside the data that stays in
 * Supabase indefinitely - this page never deletes anything, it only
 * exports.
 */
export function ArchivPage() {
  const { profile: me, performedBy } = useAuth();
  const [data, setData] = useState<{
    suppliers: Supplier[];
    trays: Tray[];
    cases: LoanCase[];
    scans: ScanRecord[];
    auditLog: AuditLogEntry[];
    physicians: Physician[];
  } | null>(null);
  const [downloadingMonth, setDownloadingMonth] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      dataProvider.getSuppliers(),
      dataProvider.getTrays(),
      dataProvider.getCases(),
      dataProvider.getScanHistory(),
      dataProvider.getAuditLog(),
      dataProvider.getPhysicians(),
    ]).then(([suppliers, trays, cases, scans, auditLog, physicians]) =>
      setData({ suppliers, trays, cases, scans, auditLog, physicians }),
    );
  }, []);

  const allowed = !me || me.role === 'admin' || me.role === 'op_leitung';

  if (!allowed) {
    return (
      <div>
        <TopBar title="Archiv" showBack />
        <p className="px-4 py-10 text-center text-sm text-ink-400">
          Nur Admins und OP-Leitung können das Archiv herunterladen.
        </p>
      </div>
    );
  }

  const handleDownload = async (month: string) => {
    if (!data) return;
    setDownloadingMonth(month);
    setError(null);
    try {
      const blob = await buildMonthlyArchive(data, month, performedBy);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `IDM_LEIH_SIEB_ARCHIV_${month}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      await dataProvider.appendAuditEntry({
        id: crypto.randomUUID(),
        // No single record this action is "about" - entity_id is a
        // synthetic id for this download event, the month lives in details.
        entityType: 'archive',
        entityId: crypto.randomUUID(),
        action: 'archive_downloaded',
        performedBy,
        details: { month },
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Archiv konnte nicht erstellt werden.');
    } finally {
      setDownloadingMonth(null);
    }
  };

  const months = data ? listAvailableMonths(data) : [];

  return (
    <div>
      <TopBar title="Archiv" subtitle="Monatliches Backup - 10 Jahre Aufbewahrung" />
      <div className="px-4 py-4">
        <p className="mb-4 text-sm text-ink-600">
          Jeder Monat lässt sich als ZIP-Datei herunterladen (Lieferanten, Siebe, Sieb-Fälle, Scans,
          Sterilisationsfotos, Audit-Log) - als zusätzliche lokale Kopie neben den Daten in Supabase.
        </p>

        {error && <p className="mb-3 rounded-xl bg-danger-50 p-3 text-sm text-danger-600">{error}</p>}

        {!data && <p className="py-10 text-center text-sm text-ink-400">Wird geladen …</p>}

        {data && months.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-400">
              <Archive size={26} />
            </div>
            <p className="text-sm font-medium text-ink-700">Noch keine Daten</p>
            <p className="max-w-[220px] text-xs text-ink-500">
              Sobald Scans, Fälle oder Audit-Einträge vorliegen, erscheinen hier monatliche Archive.
            </p>
          </div>
        )}

        <div className="space-y-2">
          {data &&
            months.map((month) => {
              const stats = statsForMonth(data, month);
              return (
                <Card key={month} className="flex items-center justify-between gap-3 p-3.5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold capitalize text-ink-900">{formatMonthLabel(month)}</p>
                    <p className="text-xs text-ink-500">
                      {stats.caseCount} Fälle · {stats.scanCount} Scans · {stats.supplierCount} Lieferanten ·{' '}
                      {stats.auditCount} Audit-Einträge
                    </p>
                  </div>
                  <Button
                    size="md"
                    icon={<Download size={16} />}
                    onClick={() => handleDownload(month)}
                    disabled={downloadingMonth !== null}
                  >
                    {downloadingMonth === month ? 'Wird erstellt …' : 'Herunterladen'}
                  </Button>
                </Card>
              );
            })}
        </div>
      </div>
    </div>
  );
}
