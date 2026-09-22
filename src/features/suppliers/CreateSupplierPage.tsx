import { TopBar } from '@/components/layout/TopBar';
import { useAuth } from '@/lib/auth/AuthContext';
import { dataProvider } from '@/services';
import { useNavigate } from 'react-router-dom';
import { SupplierForm } from './SupplierForm';

export function CreateSupplierPage() {
  const navigate = useNavigate();
  const { performedBy } = useAuth();

  return (
    <div>
      <TopBar title="Neuer Lieferant" showBack />
      <SupplierForm
        submitLabel="Lieferant anlegen"
        onSubmit={async (input) => {
          const supplier = await dataProvider.createSupplier(input);
          await dataProvider.appendAuditEntry({
            id: crypto.randomUUID(),
            entityType: 'supplier',
            entityId: supplier.id,
            action: 'supplier_created',
            performedBy,
            details: { name: supplier.name, shortCode: supplier.shortCode },
            createdAt: new Date().toISOString(),
          });
          navigate(`/lieferanten/${supplier.id}`, { replace: true });
        }}
      />
    </div>
  );
}
