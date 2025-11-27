import { createClient } from '@supabase/supabase-js';

// Safely get environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Validate that environment variables are present
if (!supabaseUrl) {
  console.warn('EXPO_PUBLIC_SUPABASE_URL is not defined. Supabase client will not be initialized properly.');
}

if (!supabaseAnonKey) {
  console.warn('EXPO_PUBLIC_SUPABASE_ANON_KEY is not defined. Supabase client will not be initialized properly.');
}

// Create a dummy client if environment variables are missing to prevent crashes
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      storage: {
        from: () => ({
          upload: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
          remove: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
          list: () => Promise.resolve({ data: [], error: new Error('Supabase not configured') }),
          getPublicUrl: () => ({ data: { publicUrl: '' } })
        })
      }
    };

// Log for debugging purposes
if (__DEV__) {
  console.log("SUPABASE URL:", supabaseUrl || 'NOT SET');
  console.log("SUPABASE KEY:", supabaseAnonKey ? "Loaded" : "Missing");
}