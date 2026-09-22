import { useCallback, useEffect, useState } from 'react';

/**
 * Lightweight, non-authenticated "who is using this device" identity used as
 * `performedBy` across scans, cases and CRUD actions - the digital
 * equivalent of a staff member signing their initials on a paper log. This
 * is NOT authentication (no login, no access control); real Supabase Auth
 * is a separate future step once user/role management is introduced.
 */

const STORAGE_KEY = 'idm-mobile.current-user.v1';
export const DEFAULT_USER_LABEL = 'AEMP-Mitarbeiter:in';

type Listener = () => void;
const listeners = new Set<Listener>();

function readStored(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY)?.trim() || null;
  } catch {
    return null;
  }
}

export function getCurrentUser(): string {
  return readStored() ?? DEFAULT_USER_LABEL;
}

export function isCurrentUserSet(): boolean {
  return readStored() !== null;
}

export function setCurrentUser(name: string): void {
  if (typeof window === 'undefined') return;
  try {
    const trimmed = name.trim();
    if (trimmed) {
      window.localStorage.setItem(STORAGE_KEY, trimmed);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Storage unavailable - the in-memory default still works for this visit.
  }
  listeners.forEach((listener) => listener());
}

/** Reactive access to the current-user identity; re-renders when it changes anywhere in the app. */
export function useCurrentUser(): { name: string; isSet: boolean; setName: (name: string) => void } {
  const [name, setName] = useState(getCurrentUser);
  const [isSet, setIsSet] = useState(isCurrentUserSet);

  useEffect(() => {
    const listener = () => {
      setName(getCurrentUser());
      setIsSet(isCurrentUserSet());
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const update = useCallback((next: string) => setCurrentUser(next), []);

  return { name, isSet, setName: update };
}
