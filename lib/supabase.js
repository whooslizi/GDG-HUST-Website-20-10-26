import { createClient } from "@supabase/supabase-js";

function getQueryParam(param) {
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

function getStored(key) {
  if (typeof localStorage !== "undefined") {
    try {
      return (localStorage.getItem(key) || "").trim();
    } catch {
      // ignore
    }
  }
  return "";
}

const staticViteUrl =
  typeof import.meta !== "undefined" && import.meta.env
    ? import.meta.env.VITE_SUPABASE_URL
    : "";

const staticViteKey =
  typeof import.meta !== "undefined" && import.meta.env
    ? import.meta.env.VITE_SUPABASE_ANON_KEY
    : "";

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

const validUrl =
  supabaseUrl && supabaseUrl.startsWith("http")
    ? supabaseUrl.replace(/\/+$/, "")
    : "https://placeholder-project.supabase.co";

const validKey = supabaseAnonKey || "placeholder-anon-key";

export const supabase = createClient(validUrl, validKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export function isSupabaseConfigured() {
  return Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      supabaseUrl.startsWith("http") &&
      !supabaseUrl.includes("placeholder-project")
  );
}
