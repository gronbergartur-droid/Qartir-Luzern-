import { TopBar } from '@/components/layout/TopBar';
import { useAuth } from '@/lib/auth/AuthContext';
import { dataProvider } from '@/services';
import type { Supplier } from '@/types/database';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SupplierForm } from './SupplierForm';

export function EditSupplierPage() {
  const { supplierId } = useParams<{ supplierId: string }>();
  const navigate = useNavigate();
  const { performedBy } = useAuth();
  const [supplier, setSupplier] = useState<Supplier | null | undefined>(undefined);

  useEffect(() => {
    if (!supplierId) return;
    dataProvider.getSupplier(supplierId).then(setSupplier);
  }, [supplierId]);

  if (supplier === undefined) {
    return (
      <div>
        <TopBar title="Lieferant bearbeiten" showBack />
        <p className="px-4 py-10 text-center text-sm text-ink-400">Wird geladen …</p>
      </div>
    );
  }

  if (supplier === null || !supplierId) {
    return (
      <div>
        <TopBar title="Lieferant bearbeiten" showBack />
        <p className="px-4 py-10 text-center text-sm text-ink-400">Lieferant nicht gefunden.</p>
      </div>
    );
  }

  return (
    <div>
      <TopBar title="Lieferant bearbeiten" subtitle={supplier.name} showBack />
      <SupplierForm
        initial={supplier}
        submitLabel="Änderungen speichern"
        onSubmit={async (input) => {
          const updated = await dataProvider.updateSupplier(supplierId, input);
          await dataProvider.appendAuditEntry({
            id: crypto.randomUUID(),
            entityType: 'supplier',
            entityId: updated.id,
            action: 'supplier_updated',
            performedBy,
            details: { name: updated.name },
            createdAt: new Date().toISOString(),
          });
          navigate(`/lieferanten/${updated.id}`, { replace: true });
        }}
      />
    </div>
  );
}
