import { AppShell } from '@/components/layout/AppShell';
import { AuditLogPage } from '@/features/audit/AuditLogPage';
import { ComparisonPage } from '@/features/comparison/ComparisonPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { ScanDetailPage } from '@/features/history/ScanDetailPage';
import { HistoryPage } from '@/features/history/HistoryPage';
import { SuppliersPage } from '@/features/suppliers/SuppliersPage';
import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

// Barcode/QR + OCR libraries are only needed on this screen, so it is split
// into its own chunk instead of bloating the initial dashboard bundle.
const ScannerFlow = lazy(() =>
  import('@/features/scanner/ScannerFlow').then((m) => ({ default: m.ScannerFlow })),
);

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route
          path="/scanner"
          element={
            <Suspense fallback={<ScannerLoadingFallback />}>
              <ScannerFlow />
            </Suspense>
          }
        />
        <Route path="/historie" element={<HistoryPage />} />
        <Route path="/historie/:scanId" element={<ScanDetailPage />} />
        <Route path="/audit" element={<AuditLogPage />} />
        <Route path="/lieferanten" element={<SuppliersPage />} />
        <Route path="/vergleich" element={<ComparisonPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function ScannerLoadingFallback() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
    </div>
  );
}

export default App;
