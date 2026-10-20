import { createClient, type SupabaseClient as OfficialSupabaseClient } from "@supabase/supabase-js";
import {
  supabase as globalSupabase,
  supabaseUrl as initialUrl,
  supabaseAnonKey as initialKey,
} from "../supabase.ts";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export class SupabaseService {
  private config: SupabaseConfig;
  public client: OfficialSupabaseClient;

  constructor() {
    this.config = {
      url: initialUrl,
      anonKey: initialKey,
    };
    this.client = globalSupabase;
  }

  public isConfigured(): boolean {
    return (
      Boolean(this.config.url && this.config.anonKey) &&
      !this.config.url.includes("placeholder-project")
    );
  }

  public getUrl(): string {
    return this.config.url;
  }

  public getConfig(): SupabaseConfig {
    return { ...this.config };
  }

  public setConfig(url: string, anonKey: string): void {
    const cleanUrl = url.trim().replace(/\/+$/, "");
    const cleanKey = anonKey.trim();
    this.config = {
      url: cleanUrl,
      anonKey: cleanKey,
    };

    if (typeof localStorage !== "undefined") {
      localStorage.setItem("VITE_SUPABASE_URL", cleanUrl);
      localStorage.setItem("VITE_SUPABASE_ANON_KEY", cleanKey);
    }

    if (cleanUrl && cleanKey) {
      this.client = createClient(cleanUrl, cleanKey, {
        auth: { persistSession: false, autoRefreshToken: false },
        realtime: { params: { eventsPerSecond: 10 } },
      });
    }
  }

  public clearConfig(): void {
    this.config = { url: "", anonKey: "" };
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("VITE_SUPABASE_URL");
      localStorage.removeItem("VITE_SUPABASE_ANON_KEY");
    }
    this.client = createClient("https://placeholder-project.supabase.co", "placeholder-key");
  }

  public async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured()) {
      return { success: false, message: "Chưa cấu hình Supabase URL hoặc Anon Key." };
    }
    try {
      const { error } = await this.client.from("groups").select("id").limit(1);
      if (error) {
        return {
          success: false,
          message: `Lỗi Supabase: ${error.message} (mã: ${error.code}). Bạn kiểm tra bảng 'groups' hoặc RLS nhé!`,
        };
      }
      return { success: true, message: "Kết nối tới Supabase thành công!" };
    } catch (err: any) {
      return { success: false, message: `Lỗi kết nối: ${err.message || String(err)}` };
    }
  }

  // columns: the public key may only read some columns (supabase/secure.sql), so "*" is refused there.
  public async from<T>(table: string, columns: string = "*"): Promise<T[] | null> {
    if (!this.isConfigured()) return null;

    try {
      const { data, error } = await this.client.from(table).select(columns);
      if (error) {
        console.warn(`[Supabase] SELECT from ${table} failed:`, error.message);
        return null;
      }
      return (data as T[]) || [];
    } catch (err) {
      console.warn(`[Supabase] Query error on ${table}:`, err);
      return null;
    }
  }

  public async insert<T>(table: string, data: Partial<T>): Promise<T | null> {
    if (!this.isConfigured()) return null;

    try {
      const { data: res, error } = await this.client.from(table).upsert(data as any).select();
      if (error) {
        console.warn(`[Supabase] UPSERT into ${table} failed:`, error.message);
        return null;
      }
      return Array.isArray(res) && res.length > 0 ? (res[0] as T) : null;
    } catch (err) {
      console.warn(`[Supabase] Insert error on ${table}:`, err);
      return null;
    }
  }

  public async update<T>(
    table: string,
    filterParam: string,
    data: Partial<T>
  ): Promise<T | null> {
    if (!this.isConfigured()) return null;

    try {
      let query = this.client.from(table).update(data as any);
      const match = filterParam.match(/^([a-zA-Z0-9_]+)=eq\.(.+)$/);
      if (match) {
        const [, col, val] = match;
        query = query.eq(col, val);
      }

      const { data: res, error } = await query.select();
      if (error) {
        console.warn(`[Supabase] UPDATE on ${table} failed:`, error.message);
        return null;
      }
      return Array.isArray(res) && res.length > 0 ? (res[0] as T) : null;
    } catch (err) {
      console.warn(`[Supabase] Update error on ${table}:`, err);
      return null;
    }
  }

  public async delete(table: string, filterParam: string): Promise<boolean> {
    if (!this.isConfigured()) return false;

    try {
      let query = this.client.from(table).delete();
      const match = filterParam.match(/^([a-zA-Z0-9_]+)=eq\.(.+)$/);
      if (match) {
        const [, col, val] = match;
        query = query.eq(col, val);
      }
      const { error } = await query;
      if (error) {
        console.warn(`[Supabase] DELETE on ${table} failed:`, error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn(`[Supabase] Delete error on ${table}:`, err);
      return false;
    }
  }
}

export const supabase = new SupabaseService();
