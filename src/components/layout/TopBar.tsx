import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { CurrentUserBadge } from './CurrentUserBadge';

interface TopBarProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
  right?: ReactNode;
}

export function TopBar({ title, subtitle, onBack, showBack, right }: TopBarProps) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-20 border-b border-ink-100 bg-white/95 backdrop-blur pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-3">
        {showBack && (
          <button
            type="button"
            onClick={onBack ?? (() => navigate(-1))}
            className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full text-ink-600 active:bg-ink-100"
            aria-label="Zurück"
          >
            <ChevronLeft size={22} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[17px] font-semibold text-ink-900">{title}</h1>
          {subtitle && <p className="truncate text-xs text-ink-500">{subtitle}</p>}
        </div>
        {right}
        <CurrentUserBadge />
      </div>
    </header>
  );
}
