import { TopBar } from '@/components/layout/TopBar';
import { useAuth } from '@/lib/auth/AuthContext';
import { dataProvider } from '@/services';
import { useNavigate } from 'react-router-dom';
import { PhysicianForm } from './PhysicianForm';

export function CreatePhysicianPage() {
  const navigate = useNavigate();
  const { performedBy } = useAuth();

  return (
    <div>
      <TopBar title="Neuer Arzt" showBack />
      <PhysicianForm
        submitLabel="Arzt anlegen"
        onSubmit={async (input) => {
          const physician = await dataProvider.createPhysician(input);
          await dataProvider.appendAuditEntry({
            id: crypto.randomUUID(),
            entityType: 'physician',
            entityId: physician.id,
            action: 'physician_created',
            performedBy,
            details: { name: physician.name, department: physician.department },
            createdAt: new Date().toISOString(),
          });
          navigate('/aerzte', { replace: true });
        }}
      />
    </div>
  );
}
