import { TopBar } from '@/components/layout/TopBar';
import { useAuth } from '@/lib/auth/AuthContext';
import { dataProvider } from '@/services';
import type { Supplier, Tray, TrayInstrument } from '@/types/database';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TrayForm } from './TrayForm';

export function EditTrayPage() {
  const { trayId } = useParams<{ trayId: string }>();
  const navigate = useNavigate();
  const { performedBy } = useAuth();
  const [tray, setTray] = useState<Tray | null | undefined>(undefined);
  const [instruments, setInstruments] = useState<TrayInstrument[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    if (!trayId) return;
    (async () => {
      const [trays, allSuppliers] = await Promise.all([dataProvider.getTrays(), dataProvider.getSuppliers()]);
      const found = trays.find((t) => t.id === trayId) ?? null;
      setTray(found);
      setSuppliers(allSuppliers.filter((s) => s.active || s.id === found?.supplierId));
      if (found) setInstruments(await dataProvider.getTrayInstruments(found.id));
    })();
  }, [trayId]);

  if (tray === undefined) {
    return (
      <div>
        <TopBar title="Sieb bearbeiten" showBack />
        <p className="px-4 py-10 text-center text-sm text-ink-400">Wird geladen …</p>
      </div>
    );
  }

  if (tray === null || !trayId) {
    return (
      <div>
        <TopBar title="Sieb bearbeiten" showBack />
        <p className="px-4 py-10 text-center text-sm text-ink-400">Sieb nicht gefunden.</p>
      </div>
    );
  }

  return (
    <div>
      <TopBar title="Sieb bearbeiten" subtitle={tray.code} showBack />
      <TrayForm
        suppliers={suppliers}
        initialTray={tray}
        initialInstruments={instruments}
        submitLabel="Änderungen speichern"
        onSubmit={async (input) => {
          const updated = await dataProvider.updateTray(trayId, input);
          await dataProvider.appendAuditEntry({
            id: crypto.randomUUID(),
            entityType: 'tray',
            entityId: updated.id,
            action: 'tray_updated',
            performedBy,
            details: { code: updated.code, name: updated.name },
            createdAt: new Date().toISOString(),
          });
          navigate(`/lieferanten/${updated.supplierId}`, { replace: true });
        }}
      />
    </div>
  );
}
