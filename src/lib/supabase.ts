import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';
const disabledProjectRefs = new Set([
  // Historical Render env typo: this project ref does not resolve and makes the
  // live app look broken even though every page has a demo/local fallback.
  'zsprxlssunrjkacohamj',
]);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = (): boolean => {
  try {
    const host = new URL(supabaseUrl).hostname;
    const projectRef = host.split('.')[0];
    return (
      supabaseUrl !== 'https://placeholder.supabase.co' &&
      supabaseAnonKey !== 'placeholder-key' &&
      !disabledProjectRefs.has(projectRef)
    );
  } catch {
    return false;
  }
};
