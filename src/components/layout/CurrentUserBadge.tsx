import { useCurrentUser } from '@/lib/currentUser';
import { User } from 'lucide-react';
import { useState } from 'react';

/**
 * Small tappable pill showing who is signed in on this device (see
 * lib/currentUser.ts - not real authentication). Rendered inside TopBar so
 * it's visible on every screen without each page needing to wire it up.
 */
export function CurrentUserBadge() {
  const { name, isSet, setName } = useCurrentUser();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  if (editing) {
    return (
      <form
        className="flex items-center gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          if (draft.trim()) setName(draft);
          setEditing(false);
        }}
      >
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => setEditing(false)}
          placeholder="Name / Kürzel"
          className="w-28 rounded-full border border-brand-300 bg-white px-3 py-1.5 text-xs outline-none focus:border-brand-500"
        />
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(isSet ? name : '');
        setEditing(true);
      }}
      className="flex shrink-0 items-center gap-1 rounded-full bg-ink-100 px-2.5 py-1.5 text-xs font-medium text-ink-600 active:bg-ink-200"
      title="Benutzer wechseln"
    >
      <User size={13} />
      <span className="max-w-[84px] truncate">{isSet ? name : 'Anmelden'}</span>
    </button>
  );
}
