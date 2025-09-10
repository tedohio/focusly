import { createClient } from '@supabase/supabase-js';
import { createBrowserClient, createServerClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client - use singleton pattern to prevent multiple instances
let clientInstance: ReturnType<typeof createBrowserClient> | null = null;

export const createClientComponentClient = () => {
  if (!clientInstance) {
    clientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return clientInstance;
};

// Server-side Supabase client
export const createServerComponentClient = () => {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(_name: string) {
        // This will be handled by the middleware
        return undefined;
      },
      set(_name: string, _value: string, _options: { [key: string]: unknown }) {
        // This will be handled by the middleware
      },
      remove(_name: string, _options: { [key: string]: unknown }) {
        // This will be handled by the middleware
      },
    },
  });
};

// Legacy client for non-SSR usage
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
