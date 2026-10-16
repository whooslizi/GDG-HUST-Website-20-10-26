import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function getQueryParam(param: string): string {
  if (typeof window !== "undefined" && window.location) {
    try {
      const val = new URLSearchParams(window.location.search).get(param);
      if (val) return val.trim();
    } catch {
      // ignore
    }
  }
  return "";
}

function getStored(key: string): string {
  if (typeof localStorage !== "undefined") {
    try {
      return (localStorage.getItem(key) || "").trim();
    } catch {
      // ignore
    }
  }
  return "";
}

// 1. Static Vite compile-time replacements (MUST use static property access)
const staticViteUrl =
  typeof import.meta !== "undefined" && import.meta.env
    ? import.meta.env.VITE_SUPABASE_URL
    : "";

const staticViteKey =
  typeof import.meta !== "undefined" && import.meta.env
    ? import.meta.env.VITE_SUPABASE_ANON_KEY
    : "";

// 2. Query param overrides (useful for testing or fallback links)
const queryUrl = getQueryParam("supabase_url");
const queryKey = getQueryParam("supabase_key") || getQueryParam("supabase_anon_key") || getQueryParam("key");

if (typeof localStorage !== "undefined") {
  if (queryUrl) localStorage.setItem("VITE_SUPABASE_URL", queryUrl);
  if (queryKey) localStorage.setItem("VITE_SUPABASE_ANON_KEY", queryKey);
}

export const supabaseUrl =
  (queryUrl ? queryUrl : "") ||
  (staticViteUrl ? String(staticViteUrl).trim() : "") ||
  getStored("VITE_SUPABASE_URL") ||
  getStored("SUPABASE_URL") ||
  "";

export const supabaseAnonKey =
  (queryKey ? queryKey : "") ||
  (staticViteKey ? String(staticViteKey).trim() : "") ||
  getStored("VITE_SUPABASE_ANON_KEY") ||
  getStored("SUPABASE_ANON_KEY") ||
  getStored("KEY") ||
  "";

// Ensure URL has http(s) prefix if provided
const validUrl =
  supabaseUrl && supabaseUrl.startsWith("http")
    ? supabaseUrl.replace(/\/+$/, "")
    : "https://placeholder-project.supabase.co";

const validKey = supabaseAnonKey || "placeholder-anon-key";

// Official Supabase JS Client
export const supabase: SupabaseClient = createClient(validUrl, validKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      supabaseUrl.startsWith("http") &&
      !supabaseUrl.includes("placeholder-project")
  );
}

if (typeof window !== "undefined") {
  if (isSupabaseConfigured()) {
    console.log("[Supabase] Connected to:", validUrl);
  } else {
    console.warn(
      "[Supabase] Not configured or missing credentials. Running in local fallback mode. URL:",
      supabaseUrl ? "(provided)" : "(empty)"
    );
  }
}
