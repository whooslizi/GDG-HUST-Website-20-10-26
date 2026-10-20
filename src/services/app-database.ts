import type {
  Group,
  Boy,
  Girl,
  Question,
  OptionKey,
  OrnamentType,
  EmailPreviewData,
  EmailExportItem,
} from "../types/database.ts";
import { supabase } from "./supabase.ts";
import {
  generateGirlInvitationEmail,
  generateBoyInvitationEmail,
  exportAllRecipientsToCSV,
  exportAllRecipientsToJSON,
} from "./email-template.ts";

export interface DatabaseState {
  groups: Group[];
  boys: Boy[];
  girls: Girl[];
  questions: Question[];
}

export const DEFAULT_GROUPS: Group[] = [
  {
    id: "grp_hust",
    group_name: "GDGoC HUST",
    secret_code: "2010",
    group_access_code: "GDGOC2010",
    wish_message:
      "Chúc toàn thể các bạn nữ GDGoC HUST ngày 20/10 luôn xinh đẹp, rạng rỡ và ngập tràn hạnh phúc!",
    created_at: "2026-10-15T00:00:00.000Z",
  },
];

// In production, no demo recipients. These are strictly fixtures for unit testing in memory mode.
const TEST_BOYS_FIXTURE: Boy[] = [
  {
    id: "boy_1",
    group_id: "grp_hust",
    name: "Minh Anh",
    email: "minhanh@hust.edu.vn",
    token: "minhanh_2010",
    secret_code: "SEN",
    description: "Bạn nam Core Team Tech đeo kính gọng đen, hay mặc áo khoác nỉ xám.",
    personal_wish: "Chúc bạn 20/10 thật nhẹ nhàng, bình an và luôn cười tươi nhé!",
    ornament_type: "lotus",
    gift_hint: "Một bookmark giấy dó thủ công kèm kẹp tóc xinh xắn",
    has_written_wish: true,
    assigned_girl_id: "girl_1",
    assigned_girl_name: "Lan Chi",
  },
];

const TEST_GIRLS_FIXTURE: Girl[] = [
  {
    id: "girl_1",
    group_id: "grp_hust",
    name: "Lan Chi",
    email: "lanchi.hust@gmail.com",
    token: "lanchi_2010",
    current_question_index: 0,
    wrong_attempts: 0,
    stage: "not_started",
    unlocked_codes: [],
    assigned_boy_id: "boy_1",
    assigned_boy_name: "Minh Anh",
  },
];

const TEST_QUESTIONS_FIXTURE: Question[] = [
  {
    id: "q_1",
    group_id: "grp_hust",
    boy_id: "boy_1",
    question_type: "multiple_choice",
    text: "Ngày Phụ nữ Việt Nam 20/10 tôn vinh ai?",
    options: [
      { key: "a", label: "Phụ nữ Việt Nam" },
      { key: "b", label: "Phương án khác" },
    ],
    correct_key: "a",
    clue: "Gợi ý: Tìm gặp các bạn nam để cùng nhận mã bí mật nhé!",
  },
];

// Clue letter per question position, shared by every team.
const CLUES = ["K", "T", "R", "M", "X"];

function mc(id: string, n: number, text: string, labels: string[], correct: OptionKey): Question {
  const keys: OptionKey[] = ["a", "b", "c", "d"];
  return {
    id,
    group_id: "grp_hust",
    question_type: "multiple_choice",
    text,
    options: labels.map((label, i) => ({ key: keys[i], label })),
    correct_key: correct,
    clue: `Nhận kí tự: ${CLUES[n - 1]}`,
  };
}

const COMMON_QUESTIONS: Question[] = [
  mc("q_1", 1, "Câu lạc bộ GDG-HUST chính thức được thành lập vào năm nào?", ["2018", "2019", "2020", "2021"], "c"),
  mc("q_2", 2, "Sự kiện thường niên nổi bật nhất do GDG-HUST tổ chức là gì?", ["Hackathon", "CodeCamp", "TechDay", "DevFest"], "a"),
  mc("q_3", 3, "Trang phục truyền thống của người con gái Việt Nam là gì?", ["Áo tứ thân", "Áo bà ba", "Áo dài", "Áo nhật bình"], "c"),
];

// Questions 4–5 differ per group ("Nhóm 1".."Nhóm 7"); picked from girl.quiz_group.
export const TEAM_QUESTIONS: Record<string, Question[]> = {
  "1": [
    ...COMMON_QUESTIONS,
    mc("t1_q_4", 4, "Cho phương trình: 2x + 6 = 10. Tính x. Dãy số sau đã bị cộng thêm x đơn vị: 18, 27, 22, 10, 17, 16. Giải phương trình và giải mã thông điệp.", ["PASCAL", "PYTHON", "PYTORCH", "PHOTON"], "b"),
    mc("t1_q_5", 5, "Giải mã chuỗi mật mã dạng Base64 sau để tìm từ khóa bí ẩn: R0RHSFVTVDIwMjU=", ["GDGHUST2024", "GDGOCHUST", "GDGHUST2025", "HUSTGDG2025"], "c"),
  ],
  "2": [
    ...COMMON_QUESTIONS,
    mc("t2_q_4", 4, "Cho phương trình x^2 - 9 = 0 (x > 0). Dãy số sau đã bị trừ đi x: 0, 5, 15, 12, 10, 2. Giải mã thông điệp.", ["CHROME", "CHARGE", "CHOOSE", "CLOSED"], "a"),
    mc("t2_q_5", 5, "Giải mã chuỗi số ở hệ cơ số 16 (Hexadecimal) sau sang dạng văn bản ASCII: 47 44 47 48 55 53 54", ["GDGHUTS", "GDGOHUST", "HUSTGDG", "GDGHUST"], "d"),
  ],
  "3": [
    ...COMMON_QUESTIONS,
    mc("t3_q_4", 4, "Tính biểu thức k = 15 - 3 × 4. Dãy số sau đã bị cộng thêm k: 7, 4, 23, 4. Giải mã thông điệp.", ["DART", "DATA", "JAVA", "GATE"], "b"),
    mc("t3_q_5", 5, "Giải mã chuỗi thuật toán xoay 13 vị trí (ROT13): TQTUHFG", ["GDGHUST", "GDGOHUS", "HUSTGDG", "GDHGUST"], "a"),
  ],
  "4": [
    ...COMMON_QUESTIONS,
    mc("t4_q_4", 4, "Cho biểu thức: x = √16 + 1. Dãy số sau đã bị trừ đi x: 8, -4, 15, -2, 3. Tìm x và giải mã thông điệp.", ["MARCH", "WATCH", "MATCH", "MACRO"], "c"),
    mc("t4_q_5", 5, "Giải mã chuỗi mã Nhị phân (Binary) 8-bit sau sang chữ cái: 01000111 01000100 01000111", ["GDE", "DGD", "GGD", "GDG"], "d"),
  ],
  "5": [
    ...COMMON_QUESTIONS,
    mc("t5_q_4", 4, "Cho phương trình: 3x - 5 = 10. Tính x. Dãy số mã hóa (cộng thêm x): 16, 10, 30, 7, 20, 6, 23, 9. Hãy tìm x và giải mã.", ["KEYBOARD", "KEYWORDS", "KEYCHAIN", "BILLBOARD"], "a"),
    mc("t5_q_5", 5, "Giải mã chuỗi mã Morse sau: --. -.. --. / .... ..- ... -", ["GDG HUTS", "GDG HUST", "GDE HUST", "DGD HUST"], "b"),
  ],
  "6": [
    ...COMMON_QUESTIONS,
    mc("t6_q_4", 4, "Cho phép tính: x = 10 - √36. Dãy số mã hóa (trừ đi x): -1, 11, 0, 5, 10, 3. Hãy tìm x và giải mã thông điệp.", ["CODING", "CODERS", "COOKIE", "CORING"], "a"),
    mc("t6_q_5", 5, "Giải mã chuỗi zích-zắc (Rail Fence Cipher - 2 dòng): Dòng 1: G G U T — Dòng 2: D H S", ["GGUTDHS", "GDGHUST", "GDGUHST", "HUSTGDG"], "b"),
  ],
  "7": [
    ...COMMON_QUESTIONS,
    mc("t7_q_4", 4, "Cho phép tính: x = 2^3 - 5. Dãy số sau đã bị trừ đi x: 8, 2, 22, 20, 12, 15, 1. Tìm x và giải mã thông điệp.", ["KEYCODE", "KEYWORD", "KEYNOTE", "KEYPORT"], "b"),
    mc("t7_q_5", 5, "Giải mật mã Vigenère với bản mã là QHE và từ khóa (Key) là KEY:", ["GDG", "GHG", "DGD", "HUS"], "a"),
  ],
};

// Used when no questions have been added from the dashboard and the girl has no known quiz group.
export const DEFAULT_QUESTIONS: Question[] = TEAM_QUESTIONS["1"];

// What the public key may read (must match the GRANTs in supabase/secure.sql).
const PUBLIC_GROUP_COLUMNS = "id, group_name, wish_message, created_at";
const PUBLIC_BOY_COLUMNS =
  "id, group_id, name, description, personal_wish, ornament_type, gift_hint, has_written_wish, assigned_girl_name";

declare const __DEMO_GIRL_CODE__: string | undefined; // set by vite.config.ts for npm run dev only

// Local test girl for `npm run dev` (code = DEMO_GIRL_CODE in .env). Never in builds or Supabase.
export function demoGirl(code: string): Girl | null {
  const demoCode = typeof __DEMO_GIRL_CODE__ === "string" ? __DEMO_GIRL_CODE__ : "";
  if (!demoCode || code.trim().toUpperCase() !== demoCode.toUpperCase()) return null;
  return {
    id: "girl_demo",
    group_id: "grp_hust",
    name: "Bạn Demo",
    token: demoCode,
    quiz_group: "Nhóm 1",
    current_question_index: 0,
    wrong_attempts: 0,
    stage: "not_started",
    welcome_wish: "Đây là lá thư thử nghiệm của GDG-HUST. Chúc bạn một ngày 20/10 thật rạng rỡ!",
  };
}

// How many letters on the tree each girl can open. Girls are not told about the limit.
export const OPENABLE_PER_GIRL = 3;

function hashString(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface AppDatabaseOptions {
  storageKey?: string;
  isMemoryOnly?: boolean;
  enableSupabase?: boolean;
}

export class AppDatabaseService {
  private state: DatabaseState;
  private storageKey: string;
  private isMemoryOnly: boolean;
  private enableSupabase: boolean;
  private sessionUnlockedCodes: Set<string>;
  private listeners: Set<() => void> = new Set();
  private realtimeChannel: any = null;
  private syncTimer: any = null;

  constructor(options?: AppDatabaseOptions) {
    this.storageKey = options?.storageKey || "bloom_2010_database_realtime_v2";
    this.isMemoryOnly = Boolean(options?.isMemoryOnly);
    // v1 cached every girl's code from before supabase/secure.sql; drop it.
    if (!this.isMemoryOnly && typeof localStorage !== "undefined") {
      try {
        localStorage.removeItem("bloom_2010_database_realtime_v1");
      } catch {
        // ignore
      }
    }
    this.enableSupabase = Boolean(options?.enableSupabase);
    this.sessionUnlockedCodes = this.loadSessionUnlockedCodes();
    this.state = this.loadFromStorage();

    if (this.enableSupabase && !this.isMemoryOnly) {
      this.initRealtime();
    }
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  public notifyListeners(): void {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error("[AppDatabase] Listener error:", err);
      }
    });
  }

  private initRealtime(): void {
    if (typeof window === "undefined") return;

    // Initial fetch from Supabase
    this.syncFromSupabase();

    // Subscribe to Postgres Realtime changes across all clients
    try {
      if (supabase.isConfigured()) {
        this.realtimeChannel = supabase.client
          .channel("bloom_realtime_sync")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "boys" },
            () => {
              this.syncFromSupabase();
            }
          )
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "girls" },
            () => {
              this.syncFromSupabase();
            }
          )
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "groups" },
            () => {
              this.syncFromSupabase();
            }
          )
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "questions" },
            () => {
              this.syncFromSupabase();
            }
          )
          .subscribe();
      }
    } catch (err) {
      console.warn("[AppDatabase] Realtime subscription init error:", err);
    }

    // Polling fallback every 4.5s so cross-device sync is guaranteed even without web sockets
    this.syncTimer = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        this.syncFromSupabase();
      }
    }, 4500);
  }

  public destroy(): void {
    if (this.syncTimer) clearInterval(this.syncTimer);
    if (this.realtimeChannel && supabase.client) {
      try {
        supabase.client.removeChannel(this.realtimeChannel);
      } catch (err) {
        void err;
      }
    }
    this.listeners.clear();
  }

  private loadSessionUnlockedCodes(): Set<string> {
    const set = new Set<string>();
    if (this.isMemoryOnly || typeof localStorage === "undefined") return set;
    try {
      const raw = localStorage.getItem("bloom_session_unlocked_codes");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((c) => set.add(String(c).trim().toUpperCase()));
        }
      }
    } catch {
      // ignore
    }
    return set;
  }

  private saveSessionUnlockedCodes(): void {
    if (this.isMemoryOnly || typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(
        "bloom_session_unlocked_codes",
        JSON.stringify(Array.from(this.sessionUnlockedCodes))
      );
    } catch {
      // ignore
    }
  }

  private loadFromStorage(): DatabaseState {
    if (this.isMemoryOnly) {
      return {
        groups: JSON.parse(JSON.stringify(DEFAULT_GROUPS)),
        boys: JSON.parse(JSON.stringify(TEST_BOYS_FIXTURE)),
        girls: JSON.parse(JSON.stringify(TEST_GIRLS_FIXTURE)),
        questions: JSON.parse(JSON.stringify(TEST_QUESTIONS_FIXTURE)),
      };
    }

    if (typeof localStorage === "undefined") {
      return {
        groups: JSON.parse(JSON.stringify(DEFAULT_GROUPS)),
        boys: [],
        girls: [],
        questions: [],
      };
    }

    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        return {
          groups: JSON.parse(JSON.stringify(DEFAULT_GROUPS)),
          boys: [],
          girls: [],
          questions: [],
        };
      }
      const parsed = JSON.parse(raw) as DatabaseState;
      // Filter out legacy demo items if present from old builds
      const cleanBoys = (parsed.boys || []).filter(
        (b) => !["demo_1", "demo_2", "boy_1", "boy_2", "boy_3", "boy_4"].includes(b.id)
      );
      const cleanGirls = (parsed.girls || []).filter(
        (g) => !["demo_1", "girl_1", "girl_2", "girl_3"].includes(g.id)
      );

      return {
        groups: parsed.groups && parsed.groups.length > 0 ? parsed.groups : JSON.parse(JSON.stringify(DEFAULT_GROUPS)),
        boys: cleanBoys,
        girls: cleanGirls,
        questions: parsed.questions || [],
      };
    } catch {
      return {
        groups: JSON.parse(JSON.stringify(DEFAULT_GROUPS)),
        boys: [],
        girls: [],
        questions: [],
      };
    }
  }

  public saveToStorage(): void {
    if (this.isMemoryOnly || typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch {
      // ignore
    }
  }

  public async syncFromSupabase(): Promise<boolean> {
    if (!this.enableSupabase || !supabase.isConfigured()) return false;

    try {
      // Girls and questions are private (supabase/secure.sql): girls come one at a time via loginGirl,
      // questions from TEAM_QUESTIONS in this bundle.
      const [remoteGroups, remoteBoys] = await Promise.all([
        supabase.from<Group>("groups", PUBLIC_GROUP_COLUMNS),
        supabase.from<Boy>("boys", PUBLIC_BOY_COLUMNS),
      ]);

      let changed = false;

      if (Array.isArray(remoteGroups)) {
        if (remoteGroups.length > 0) {
          if (JSON.stringify(this.state.groups) !== JSON.stringify(remoteGroups)) {
            this.state.groups = remoteGroups;
            changed = true;
          }
        }
      }

      if (Array.isArray(remoteBoys)) {
        if (JSON.stringify(this.state.boys) !== JSON.stringify(remoteBoys)) {
          this.state.boys = remoteBoys;
          changed = true;
        }
      }

      if (changed) {
        this.saveToStorage();
        this.notifyListeners();
      }
      return true;
    } catch (err) {
      console.warn("[AppDatabase] Sync with Supabase error:", err);
      return false;
    }
  }

  public isUsingSupabase(): boolean {
    return this.enableSupabase && supabase.isConfigured();
  }

  // Asks Supabase for just this girl (girl_login RPC) and caches her locally. Falls back to the local list.
  public async loginGirl(token: string): Promise<Girl | null> {
    const clean = token.trim();
    if (!clean) return null;
    const demo = demoGirl(clean);
    if (demo) {
      this.state.girls = [...this.state.girls.filter((g) => g.id !== demo.id), demo];
      return demo;
    }
    if (!this.isUsingSupabase()) return this.getGirlByToken(clean);

    const { data, error } = await supabase.client.rpc("girl_login", { p_token: clean });
    if (error) {
      console.warn("[Supabase] girl_login error:", error.message);
      return this.getGirlByToken(clean);
    }
    if (!data) return null;

    const remote = data as Girl;
    const idx = this.state.girls.findIndex((g) => g.id === remote.id);
    if (idx >= 0) this.state.girls[idx] = remote;
    else this.state.girls.push(remote);
    this.saveToStorage();
    return remote;
  }

  private saveGirlProgress(girl: Girl): void {
    // The shared boys' code replays groups freely; its progress is never stored.
    if (!this.isUsingSupabase() || girl.is_checker) return;
    Promise.resolve(
      supabase.client.rpc("girl_save_progress", {
        p_token: girl.token,
        p_index: girl.current_question_index,
        p_wrong: girl.wrong_attempts,
        p_stage: girl.stage,
        p_completed_at: girl.completed_at ?? null,
      })
    ).then(({ error }) => {
      if (error) console.warn("[Supabase] girl_save_progress error:", error.message);
    });
  }

  public getGirlByToken(token: string): Girl | null {
    const clean = token.trim();
    if (!clean) return null;
    const upper = clean.toUpperCase();
    return this.state.girls.find((g) => g.token.toUpperCase() === upper) || null;
  }

  public getBoyByToken(token: string): Boy | null {
    const clean = token.trim();
    if (!clean) return null;
    return (
      this.state.boys.find(
        (b) =>
          b.token === clean ||
          b.id === clean ||
          (b.secret_code && b.secret_code.toUpperCase() === clean.toUpperCase())
      ) || null
    );
  }

  public getOrCreateGirl(token: string, name?: string): Girl {
    const existing = this.getGirlByToken(token);
    if (existing) return existing;

    const group = this.state.groups[0] || DEFAULT_GROUPS[0];
    const newGirl: Girl = {
      id: `girl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      group_id: group.id,
      name: name || `Bạn Nữ (${token.slice(0, 6)})`,
      token: token.trim(),
      current_question_index: 0,
      wrong_attempts: 0,
      stage: "not_started",
      unlocked_codes: [],
    };
    this.state.girls.push(newGirl);
    this.saveToStorage();
    this.notifyListeners();

    if (this.isUsingSupabase()) {
      supabase.insert<Girl>("girls", newGirl).catch(() => {});
    }

    return newGirl;
  }

  public getQuestionsForGirl(girl: Girl): Question[] {
    const groupQuestions = this.state.questions.filter(
      (q) => !q.group_id || q.group_id === girl.group_id
    );
    if (groupQuestions.length > 0) return groupQuestions;
    if (this.state.questions.length > 0) return this.state.questions;
    // quiz_group may be stored as "3", "Nhóm 3", "nhom_3"...
    const team = girl.quiz_group?.match(/\d+/)?.[0];
    return (team && TEAM_QUESTIONS[team]) || DEFAULT_QUESTIONS;
  }

  public submitQuizAnswer(
    token: string,
    questionIndex: number,
    pickedKey: OptionKey
  ): {
    correct: boolean;
    wrong_attempts: number;
    reveal: boolean;
    nextIndex: number;
    completed: boolean;
    clue?: string;
    girl: Girl;
  } {
    const girl = this.getGirlByToken(token);
    if (!girl) {
      throw new Error("Không tìm thấy bạn nữ với mã token này");
    }

    const questions = this.getQuestionsForGirl(girl);
    const question = questions[questionIndex];
    if (!question) {
      throw new Error("Không tìm thấy câu hỏi này");
    }

    const isCorrect = question.correct_key === pickedKey;

    if (isCorrect) {
      const nextIndex = questionIndex + 1;
      const isCompleted = nextIndex >= questions.length;

      girl.current_question_index = nextIndex;
      girl.wrong_attempts = 0;
      girl.stage = isCompleted ? "completed" : "quiz";
      if (isCompleted && !girl.completed_at) {
        girl.completed_at = new Date().toISOString();
      }

      this.saveToStorage();
      this.notifyListeners();

      this.saveGirlProgress(girl);

      return {
        correct: true,
        wrong_attempts: 0,
        reveal: false,
        nextIndex,
        completed: isCompleted,
        clue: question.clue,
        girl,
      };
    } else {
      const newWrong = (girl.wrong_attempts || 0) + 1;
      girl.wrong_attempts = newWrong;
      girl.stage = "quiz";
      this.saveToStorage();
      this.notifyListeners();

      this.saveGirlProgress(girl);

      return {
        correct: false,
        wrong_attempts: newWrong,
        reveal: newWrong >= 2,
        nextIndex: questionIndex,
        completed: false,
        clue: newWrong >= 2 ? question.clue : undefined,
        girl,
      };
    }
  }

  public resetGirlProgress(token: string): Girl | null {
    const girl = this.getGirlByToken(token);
    if (!girl) return null;

    girl.current_question_index = 0;
    girl.wrong_attempts = 0;
    girl.stage = "not_started";
    girl.completed_at = undefined;
    this.saveToStorage();
    this.notifyListeners();

    this.saveGirlProgress(girl);

    return girl;
  }

  public advanceAfterReveal(
    token: string,
    questionIndex: number
  ): { nextIndex: number; completed: boolean; girl: Girl } {
    const girl = this.getGirlByToken(token);
    if (!girl) throw new Error("Girl not found");
    const questions = this.getQuestionsForGirl(girl);
    const nextIndex = questionIndex + 1;
    const isCompleted = nextIndex >= questions.length;

    girl.current_question_index = nextIndex;
    girl.wrong_attempts = 0;
    girl.stage = isCompleted ? "completed" : "quiz";
    if (isCompleted && !girl.completed_at) {
      girl.completed_at = new Date().toISOString();
    }
    this.saveToStorage();
    this.notifyListeners();
    this.saveGirlProgress(girl);
    return { nextIndex, completed: isCompleted, girl };
  }

  public submitBoyWish(
    accessCode: string,
    boyName: string,
    secretCode: string,
    wish: string,
    ornamentType?: OrnamentType,
    assignedGirlName?: string,
    giftHint?: string
  ): { success: boolean; boy?: Boy; message?: string } {
    const cleanCode = accessCode.trim().toUpperCase();
    const cleanName = boyName.trim();
    const cleanSecret = secretCode.trim().toUpperCase();

    if (!cleanName) {
      return { success: false, message: "Vui lòng nhập tên của bạn nhé!" };
    }
    if (!cleanSecret) {
      return { success: false, message: "Vui lòng đặt mã bí mật để bạn nữ mở thư!" };
    }
    if (!wish.trim()) {
      return { success: false, message: "Vui lòng nhập lời chúc gửi các bạn nữ!" };
    }

    let group = this.state.groups.find(
      (g) =>
        g.group_access_code?.toUpperCase() === cleanCode ||
        g.secret_code?.toUpperCase() === cleanCode
    );
    if (!group) {
      group = this.state.groups[0] || DEFAULT_GROUPS[0];
      if (!this.state.groups.some((g) => g.id === group!.id)) {
        this.state.groups.push(group);
      }
    }

    let boy = this.state.boys.find(
      (b) =>
        b.name.trim().toLowerCase() === cleanName.toLowerCase() ||
        (cleanSecret && b.secret_code?.toUpperCase() === cleanSecret)
    );

    if (boy) {
      boy.secret_code = cleanSecret;
      boy.personal_wish = wish.trim();
      if (ornamentType) boy.ornament_type = ornamentType;
      if (assignedGirlName) boy.assigned_girl_name = assignedGirlName.trim();
      if (giftHint) boy.gift_hint = giftHint.trim();
      boy.has_written_wish = true;
    } else {
      boy = {
        id: `boy_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        group_id: group.id,
        name: cleanName,
        email: "",
        token: `boy_${cleanName.toLowerCase().replace(/[^a-z0-9]/g, "")}_${Date.now().toString(36)}`,
        secret_code: cleanSecret,
        description: giftHint?.trim() || `Bạn nam ${cleanName} gửi lời chúc 20/10.`,
        personal_wish: wish.trim(),
        ornament_type: ornamentType || "lotus",
        gift_hint: giftHint?.trim() || "",
        has_written_wish: true,
        assigned_girl_name: assignedGirlName?.trim() || "",
      };
      this.state.boys.push(boy);
    }

    this.saveToStorage();
    this.notifyListeners();

    return { success: true, boy: { ...boy } };
  }

  public async submitBoyWishAsync(
    accessCode: string,
    rawName: string,
    secretCode: string,
    wish: string,
    ornamentType?: OrnamentType,
    assignedGirlName?: string,
    giftHint?: string
  ): Promise<{ success: boolean; boy?: Boy; message?: string }> {
    const res = this.submitBoyWish(
      accessCode,
      rawName,
      secretCode,
      wish,
      ornamentType,
      assignedGirlName,
      giftHint
    );
    if (!res.success || !res.boy) return res;

    if (this.isUsingSupabase()) {
      const b = res.boy;
      // Supabase only accepts the wish with the boys' code (supabase/secure.sql).
      const { error } = await supabase.client.rpc("submit_boy_wish", {
        p_code: accessCode.trim(),
        p_group_id: b.group_id,
        p_name: b.name,
        p_secret_code: b.secret_code || "",
        p_wish: b.personal_wish,
        p_ornament: b.ornament_type,
        p_assigned_girl_name: b.assigned_girl_name || "",
        p_gift_hint: b.gift_hint || "",
      });
      if (error) {
        console.warn("[Supabase] submit_boy_wish error:", error.message);
        return { success: false, message: "Chưa gửi được lời chúc, bạn thử lại giúp mình nhé!" };
      }
      // Pull the saved row (server-made id) so the tree matches Supabase.
      await this.syncFromSupabase();
    }

    return res;
  }

  public verifySecretCode(
    code: string,
    girlToken?: string
  ): {
    success: boolean;
    group?: Group;
    boys?: Boy[];
    unlockedBoy?: Boy;
    blocked?: boolean;
  } {
    const clean = code.trim().toUpperCase();
    if (!clean) return { success: false };

    const matchingGroup = this.state.groups.find(
      (g) => g.secret_code?.toUpperCase() === clean
    );
    const matchingBoy = this.state.boys.find(
      (b) => b.secret_code && b.secret_code.trim().toUpperCase() === clean
    );

    const isGroupCode = Boolean(matchingGroup);

    if (!isGroupCode && !matchingBoy) {
      return { success: false };
    }

    const girlForLimit = girlToken ? this.getGirlByToken(girlToken) : null;
    if (girlForLimit && matchingBoy && !this.getOpenableBoyIds(girlForLimit).has(matchingBoy.id)) {
      return { success: false, blocked: true };
    }

    const group =
      matchingGroup ||
      (matchingBoy ? this.state.groups.find((g) => g.id === matchingBoy.group_id) : undefined) ||
      this.state.groups[0];

    const boys = group
      ? this.state.boys.filter((b) => b.group_id === group.id)
      : this.state.boys;

    this.sessionUnlockedCodes.add(clean);
    if (isGroupCode && group) {
      this.sessionUnlockedCodes.add(group.secret_code.toUpperCase());
    }
    if (matchingBoy?.secret_code) {
      this.sessionUnlockedCodes.add(matchingBoy.secret_code.trim().toUpperCase());
    }
    this.saveSessionUnlockedCodes();

    if (girlToken) {
      const girl = this.getGirlByToken(girlToken);
      if (girl) {
        const unlocked = new Set((girl.unlocked_codes || []).map((c) => c.toUpperCase()));
        unlocked.add(clean);
        if (isGroupCode && group) unlocked.add(group.secret_code.toUpperCase());
        if (matchingBoy?.secret_code) unlocked.add(matchingBoy.secret_code.trim().toUpperCase());
        girl.unlocked_codes = [...unlocked];
        this.saveToStorage();
        this.notifyListeners();

        if (this.isUsingSupabase()) {
          supabase.update<Girl>("girls", `token=eq.${girl.token}`, {
            unlocked_codes: girl.unlocked_codes,
          }).catch(() => {});
        }
      }
    }

    return { success: true, group, boys, unlockedBoy: matchingBoy };
  }

  public async verifySecretCodeAsync(
    code: string,
    girlToken?: string
  ): Promise<{
    success: boolean;
    group?: Group;
    boys?: Boy[];
    unlockedBoy?: Boy;
  }> {
    const syncResult = this.verifySecretCode(code, girlToken);
    if (syncResult.success || syncResult.blocked) {
      return { success: syncResult.success };
    }

    const clean = code.trim().toUpperCase();
    if (!clean) return { success: false };

    // Check remote Supabase using RPC get_gift(p_code)
    if (this.isUsingSupabase()) {
      try {
        const { data, error } = await supabase.client.rpc("get_gift", { p_code: clean });
        if (!error && Array.isArray(data) && data.length > 0) {
          const gift = data[0] as {
            id?: string;
            code?: string;
            recipient_name?: string;
            sender_name?: string;
            message?: string;
            gift_content?: string;
            ornament_type?: OrnamentType;
          };

          const group = this.state.groups[0] || DEFAULT_GROUPS[0];
          if (!this.state.groups.some((g) => g.id === group.id)) {
            this.state.groups.push(group);
          }

          let existingBoy = this.state.boys.find(
            (b) => b.secret_code?.trim().toUpperCase() === clean || (gift.id && b.id === gift.id)
          );

          if (!existingBoy) {
            existingBoy = {
              id: gift.id || `gift_${Date.now()}`,
              group_id: group.id,
              name: gift.sender_name || "Bạn Nam",
              email: "",
              token: gift.code || clean,
              secret_code: clean,
              description: gift.gift_content || gift.message || "",
              personal_wish: gift.message || "",
              ornament_type: (gift.ornament_type as OrnamentType) || "lotus",
              gift_hint: gift.gift_content || "",
              has_written_wish: true,
              assigned_girl_name: gift.recipient_name || "",
            };
            this.state.boys.push(existingBoy);
          } else {
            existingBoy.personal_wish = gift.message || existingBoy.personal_wish;
            existingBoy.gift_hint = gift.gift_content || existingBoy.gift_hint;
          }

          const limitedGirl = girlToken ? this.getGirlByToken(girlToken) : null;
          if (limitedGirl && !this.getOpenableBoyIds(limitedGirl).has(existingBoy.id)) {
            this.saveToStorage();
            this.notifyListeners();
            return { success: false };
          }

          this.sessionUnlockedCodes.add(clean);
          this.saveSessionUnlockedCodes();
          this.saveToStorage();
          this.notifyListeners();

          if (girlToken) {
            const girl = this.getGirlByToken(girlToken);
            if (girl) {
              const unlocked = new Set((girl.unlocked_codes || []).map((c) => c.toUpperCase()));
              unlocked.add(clean);
              girl.unlocked_codes = [...unlocked];
              this.saveToStorage();
              this.notifyListeners();
              supabase.update<Girl>("girls", `token=eq.${girl.token}`, {
                unlocked_codes: girl.unlocked_codes,
              }).catch(() => {});
            }
          }

          const boys = this.state.boys.filter((b) => b.group_id === group.id);
          return { success: true, group, boys, unlockedBoy: existingBoy };
        }
      } catch (err) {
        console.warn("[Supabase] get_gift RPC error:", err);
      }
    }

    return { success: false };
  }

  // Stable per girl: boys are ranked by a hash of girl token + boy id, so the pick survives reloads.
  public getOpenableBoyIds(girl: Girl): Set<string> {
    const boys = this.state.boys.filter(
      (b) => b.secret_code && (!b.group_id || b.group_id === girl.group_id)
    );
    const ranked = [...boys].sort(
      (a, b) => hashString(girl.token + a.id) - hashString(girl.token + b.id)
    );
    const ids = new Set(ranked.slice(0, OPENABLE_PER_GIRL).map((b) => b.id));
    // Letters she already opened stay open even if new boys change the ranking.
    const opened = new Set((girl.unlocked_codes || []).map((c) => c.toUpperCase()));
    boys.forEach((b) => {
      if (opened.has(b.secret_code!.trim().toUpperCase())) ids.add(b.id);
    });
    return ids;
  }

  public getTreeData(girlToken?: string, preferredGroupId?: string) {
    let activeGroup: Group | null = null;
    let girl: Girl | null = null;

    if (preferredGroupId) {
      activeGroup = this.state.groups.find((g) => g.id === preferredGroupId) || null;
    }

    if (girlToken) girl = this.getGirlByToken(girlToken);

    if (!activeGroup && girl) {
      const girlGroupId = girl.group_id;
      activeGroup = this.state.groups.find((g) => g.id === girlGroupId) || null;
    }

    if (!activeGroup && this.state.groups.length > 0) {
      activeGroup = this.state.groups[0];
    }

    const groupBoys = activeGroup
      ? this.state.boys.filter((b) => !b.group_id || b.group_id === activeGroup.id)
      : this.state.boys;

    const unlockedCodes = new Set<string>([
      ...(girl?.unlocked_codes || []).map((c) => c.toUpperCase()),
      ...Array.from(this.sessionUnlockedCodes).map((c) => c.toUpperCase()),
    ]);


    return {
      group: activeGroup,
      groups: this.state.groups,
      boys: groupBoys,
      allBoys: this.state.boys,
      // The tree is open: every wish can be read without a code.
      isUnlocked: true,
      unlockedCodes: Array.from(unlockedCodes),
      isBoyOpenable: (_boy: Boy) => true,
      isBoyUnlocked: (_boy: Boy) => true,
      girl,
    };
  }

  public getState(): DatabaseState {
    return {
      groups: [...this.state.groups],
      boys: [...this.state.boys],
      girls: [...this.state.girls],
      questions: [...this.state.questions],
    };
  }

  public addGroup(name: string, secretCode?: string, accessCode?: string, wishMessage?: string): Group {
    const group: Group = {
      id: `grp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      group_name: name.trim(),
      secret_code: (secretCode || "2010").trim().toUpperCase(),
      group_access_code: (accessCode || `GDG${Date.now().toString().slice(-4)}`).trim().toUpperCase(),
      wish_message: wishMessage || "Chúc toàn thể các bạn nữ 20/10 ngập tràn niềm vui!",
      created_at: new Date().toISOString(),
    };
    this.state.groups.push(group);
    this.saveToStorage();
    this.notifyListeners();

    if (this.isUsingSupabase()) {
      supabase.insert<Group>("groups", group).catch(() => {});
    }

    return group;
  }

  public addBoy(
    groupId: string,
    name: string,
    email?: string,
    description?: string,
    personalWish?: string,
    giftHint?: string
  ): Boy {
    const boy: Boy = {
      id: `boy_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      group_id: groupId,
      name: name.trim(),
      email: email?.trim(),
      token: `boy_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      description: description?.trim() || `Bạn nam ${name} gửi gắm lời chúc 20/10.`,
      personal_wish: personalWish?.trim() || "",
      ornament_type: "lotus",
      gift_hint: giftHint?.trim(),
      has_written_wish: Boolean(personalWish?.trim()),
    };
    this.state.boys.push(boy);
    this.saveToStorage();
    this.notifyListeners();

    if (this.isUsingSupabase()) {
      supabase.insert<Boy>("boys", boy).catch(() => {});
    }

    return boy;
  }

  public addGirl(groupId: string, name: string, email?: string, customToken?: string): Girl {
    const token = (customToken || `girl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`).trim();
    const girl: Girl = {
      id: `girl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      group_id: groupId,
      name: name.trim(),
      email: email?.trim(),
      token,
      current_question_index: 0,
      wrong_attempts: 0,
      stage: "not_started",
      unlocked_codes: [],
    };
    this.state.girls.push(girl);
    this.saveToStorage();
    this.notifyListeners();

    if (this.isUsingSupabase()) {
      supabase.insert<Girl>("girls", girl).catch(() => {});
    }

    return girl;
  }

  public assignBoyToGirl(boyId: string, girlId: string): boolean {
    const boy = this.state.boys.find((b) => b.id === boyId);
    const girl = this.state.girls.find((g) => g.id === girlId);
    if (!boy || !girl) return false;

    boy.assigned_girl_id = girl.id;
    boy.assigned_girl_name = girl.name;
    girl.assigned_boy_id = boy.id;
    girl.assigned_boy_name = boy.name;

    this.saveToStorage();
    this.notifyListeners();

    if (this.isUsingSupabase()) {
      supabase.update<Boy>("boys", `id=eq.${boy.id}`, {
        assigned_girl_id: boy.assigned_girl_id,
        assigned_girl_name: boy.assigned_girl_name,
      }).catch(() => {});
      supabase.update<Girl>("girls", `id=eq.${girl.id}`, {
        assigned_boy_id: girl.assigned_boy_id,
        assigned_boy_name: girl.assigned_boy_name,
      }).catch(() => {});
    }
    return true;
  }

  public addQuestion(
    groupId: string,
    text: string,
    options: { key: OptionKey; label: string }[],
    correctKey: OptionKey,
    clue?: string
  ): Question {
    const question: Question = {
      id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      group_id: groupId,
      question_type: "multiple_choice",
      text: text.trim(),
      options,
      correct_key: correctKey,
      clue: clue?.trim() || "Gợi ý: Tìm bạn nam để nhận mã bí mật nhé!",
    };
    this.state.questions.push(question);
    this.saveToStorage();
    this.notifyListeners();

    if (this.isUsingSupabase()) {
      supabase.insert<Question>("questions", question).catch(() => {});
    }

    return question;
  }

  public deleteBoy(boyId: string): boolean {
    const initialLen = this.state.boys.length;
    this.state.boys = this.state.boys.filter((b) => b.id !== boyId);
    if (this.state.boys.length !== initialLen) {
      this.saveToStorage();
      this.notifyListeners();
      if (this.isUsingSupabase()) {
        supabase.delete("boys", `id=eq.${boyId}`).catch(() => {});
      }
      return true;
    }
    return false;
  }

  public deleteGirl(girlId: string): boolean {
    const initialLen = this.state.girls.length;
    this.state.girls = this.state.girls.filter((g) => g.id !== girlId);
    if (this.state.girls.length !== initialLen) {
      this.saveToStorage();
      this.notifyListeners();
      if (this.isUsingSupabase()) {
        supabase.delete("girls", `id=eq.${girlId}`).catch(() => {});
      }
      return true;
    }
    return false;
  }

  public deleteQuestion(questionId: string): boolean {
    const initialLen = this.state.questions.length;
    this.state.questions = this.state.questions.filter((q) => q.id !== questionId);
    if (this.state.questions.length !== initialLen) {
      this.saveToStorage();
      this.notifyListeners();
      if (this.isUsingSupabase()) {
        supabase.delete("questions", `id=eq.${questionId}`).catch(() => {});
      }
      return true;
    }
    return false;
  }

  public deleteGroup(groupId: string): boolean {
    const initialLen = this.state.groups.length;
    this.state.groups = this.state.groups.filter((g) => g.id !== groupId);
    if (this.state.groups.length !== initialLen) {
      this.saveToStorage();
      this.notifyListeners();
      if (this.isUsingSupabase()) {
        supabase.delete("groups", `id=eq.${groupId}`).catch(() => {});
      }
      return true;
    }
    return false;
  }

  public updateBoyWish(
    boyId: string,
    secretCode: string,
    personalWish: string,
    ornamentType?: OrnamentType,
    giftHint?: string
  ): boolean {
    const boy = this.state.boys.find((b) => b.id === boyId);
    if (!boy) return false;

    boy.secret_code = secretCode.trim().toUpperCase();
    boy.personal_wish = personalWish.trim();
    if (ornamentType) boy.ornament_type = ornamentType;
    if (giftHint) boy.gift_hint = giftHint.trim();
    boy.has_written_wish = true;
    this.saveToStorage();
    this.notifyListeners();

    if (this.isUsingSupabase()) {
      supabase.update<Boy>("boys", `id=eq.${boy.id}`, {
        secret_code: boy.secret_code,
        personal_wish: boy.personal_wish,
        ornament_type: boy.ornament_type,
        gift_hint: boy.gift_hint,
        has_written_wish: true,
      }).catch(() => {});
    }

    return true;
  }

  public resetDatabase(): void {
    this.state = {
      groups: JSON.parse(JSON.stringify(DEFAULT_GROUPS)),
      boys: [],
      girls: [],
      questions: [],
    };
    this.saveToStorage();
    this.notifyListeners();
  }

  public getEmailPreviewForGirl(girlToken: string, baseUrl?: string): EmailPreviewData | null {
    const girl = this.getGirlByToken(girlToken);
    if (!girl) return null;
    const group = this.state.groups.find((g) => g.id === girl.group_id) || this.state.groups[0];
    return generateGirlInvitationEmail(girl, group, baseUrl);
  }

  public getEmailPreviewForBoy(boyToken: string, baseUrl?: string): EmailPreviewData | null {
    const boy = this.getBoyByToken(boyToken);
    if (!boy) return null;
    const group = this.state.groups.find((g) => g.id === boy.group_id) || this.state.groups[0];
    return generateBoyInvitationEmail(boy, group, baseUrl);
  }

  public exportRecipientsCSV(baseUrl?: string): string {
    return exportAllRecipientsToCSV(
      this.state.boys,
      this.state.girls,
      this.state.groups,
      baseUrl
    );
  }

  public exportEmailCSV(baseUrl?: string): string {
    return this.exportRecipientsCSV(baseUrl);
  }

  public exportRecipientsJSON(baseUrl?: string): EmailExportItem[] {
    return exportAllRecipientsToJSON(
      this.state.boys,
      this.state.girls,
      this.state.groups,
      baseUrl
    );
  }
}

export const dbService = new AppDatabaseService({
  storageKey: "bloom_2010_database_realtime_v2",
  enableSupabase: true,
  isMemoryOnly: false,
});
