import { TopBar } from '@/components/layout/TopBar';
import { getCurrentUser } from '@/lib/currentUser';
import { dataProvider } from '@/services';
import type { Supplier } from '@/types/database';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TrayForm } from './TrayForm';

export function CreateTrayPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedSupplierId = searchParams.get('supplierId') ?? undefined;
  const [suppliers, setSuppliers] = useState<Supplier[] | null>(null);

  useEffect(() => {
    dataProvider.getSuppliers().then((all) => setSuppliers(all.filter((s) => s.active)));
  }, []);

  return (
    <div>
      <TopBar title="Neues Sieb erfassen" showBack />
      {suppliers === null && <p className="px-4 py-10 text-center text-sm text-ink-400">Wird geladen …</p>}
      {suppliers !== null && suppliers.length === 0 && (
        <p className="px-4 py-10 text-center text-sm text-ink-500">
          Es sind keine aktiven Lieferanten vorhanden. Bitte zuerst einen Lieferanten anlegen oder aktivieren.
        </p>
      )}
      {suppliers !== null && suppliers.length > 0 && (
        <TrayForm
          suppliers={suppliers}
          initialSupplierId={preselectedSupplierId}
          submitLabel="Sieb anlegen"
          onSubmit={async (input) => {
            const tray = await dataProvider.createTray(input);
            await dataProvider.appendAuditEntry({
              id: crypto.randomUUID(),
              entityType: 'tray',
              entityId: tray.id,
              action: 'tray_created',
              performedBy: getCurrentUser(),
              details: { code: tray.code, name: tray.name, supplierId: tray.supplierId },
              createdAt: new Date().toISOString(),
            });
            navigate(`/lieferanten/${tray.supplierId}`, { replace: true });
          }}
        />
      )}
    </div>
  );
}
