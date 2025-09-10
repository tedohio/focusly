import { createClient } from '@supabase/supabase-js';
import { createBrowserClient, createServerClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client
export const createClientComponentClient = () => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};

// Server-side Supabase client
export const createServerComponentClient = () => {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        // This will be handled by the middleware
        return undefined;
      },
      set(name: string, value: string, options: { [key: string]: any }) {
        // This will be handled by the middleware
      },
      remove(name: string, options: { [key: string]: any }) {
        // This will be handled by the middleware
      },
    },
  });
};

// Legacy client for non-SSR usage
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
