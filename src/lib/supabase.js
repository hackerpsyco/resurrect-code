import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

const createMockSupabase = () => {
  const handler = {
    get: (target, prop) => {
      if (prop === 'auth') {
        return { 
          getSession: async () => ({ data: { session: null } }), 
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }) 
        };
      }
      return () => new Proxy({}, handler);
    }
  };
  return new Proxy({}, handler);
};

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockSupabase();
