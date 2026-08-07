import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create the client only if credentials exist to prevent a top-level crash on boot.
// If missing, export a proxy or a dummy that logs errors on use.
let supabaseInstance;

if (!url || !anonKey) {
  console.warn("Supabase credentials missing. Community features will be unavailable.");
  supabaseInstance = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: async () => {},
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: new Error("Missing config") }) }) }),
    }),
  };
} else {
  supabaseInstance = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: "fitlog:auth",
    },
  });
}

export const supabase = supabaseInstance;
