import { isSupabaseConfigured } from '@/lib/supabase/client';
import type { DataProvider } from './dataProvider';
import { LocalDataProvider } from './localProvider';
import { SupabaseDataProvider } from './supabaseProvider';

/**
 * Single switch point between the mock/local backend and Supabase. Every
 * screen imports `dataProvider` from here and never touches a concrete
 * implementation directly.
 */
export const dataProvider: DataProvider = isSupabaseConfigured
  ? new SupabaseDataProvider()
  : new LocalDataProvider();

export type { DataProvider } from './dataProvider';
