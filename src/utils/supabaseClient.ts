import { createClient } from '@supabase/supabase-js';

// Validate environment variables at build time
const getEnvVar = (key: string): string => {
  const value = import.meta.env[key];
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// A fixed, valid UUID for single-user mode to ensure upserts work correctly.
// This is intentionally hardcoded as per requirements.
export const SINGLE_USER_ID = '00000000-0000-0000-0000-000000000001';

// Add a helper to ensure RLS is working
export const withRLS = async <T>(callback: () => Promise<T>): Promise<T> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }
  
  return callback();
};