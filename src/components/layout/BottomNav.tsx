import { useAuth } from '@/lib/auth/AuthContext';
import { Archive, ClipboardList, LayoutGrid, ListChecks, ScanLine, ShieldCheck, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const baseItems = [
  { to: '/', label: 'Start', icon: LayoutGrid, end: true },
  { to: '/scanner', label: 'Scanner', icon: ScanLine, end: false },
  { to: '/faelle', label: 'Fälle', icon: ListChecks, end: false },
  { to: '/historie', label: 'Historie', icon: ClipboardList, end: false },
  { to: '/audit', label: 'Audit', icon: ShieldCheck, end: false },
];

const adminItem = { to: '/benutzer', label: 'Benutzer', icon: Users, end: false };
const archiveItem = { to: '/archiv', label: 'Archiv', icon: Archive, end: false };

export function BottomNav() {
  const { profile } = useAuth();
  const items = [
    ...baseItems,
    ...(profile?.role === 'admin' || profile?.role === 'op_leitung' ? [archiveItem] : []),
    ...(profile?.role === 'admin' ? [adminItem] : []),
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-100 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
      aria-label="Hauptnavigation"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {items.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium transition-colors',
                  isActive ? 'text-brand-600' : 'text-ink-400',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} strokeWidth={isActive ? 2.4 : 1.9} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
