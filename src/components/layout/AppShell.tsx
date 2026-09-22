import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export function AppShell() {
  return (
    <div className="min-h-screen-safe min-h-screen bg-ink-50">
      <div className="mx-auto flex min-h-screen max-w-md flex-col bg-ink-50 shadow-[0_0_40px_rgba(20,30,40,0.06)]">
        <main className="flex-1 pb-24">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
