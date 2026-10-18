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

// Used when no questions have been added from the dashboard.
export const DEFAULT_QUESTIONS: Question[] = [
  {
    id: "q_1",
    group_id: "grp_hust",
    question_type: "multiple_choice",
    text: "Câu lạc bộ GDG-HUST chính thức được thành lập vào năm nào?",
    options: [
      { key: "a", label: "2018" },
      { key: "b", label: "2019" },
      { key: "c", label: "2020" },
      { key: "d", label: "2021" },
    ],
    correct_key: "c",
    clue: "Nhận kí tự: K",
  },
  {
    id: "q_2",
    group_id: "grp_hust",
    question_type: "multiple_choice",
    text: "Sự kiện thường niên nổi bật nhất do GDG-HUST tổ chức là gì?",
    options: [
      { key: "a", label: "Hackathon" },
      { key: "b", label: "CodeCamp" },
      { key: "c", label: "TechDay" },
      { key: "d", label: "DevFest" },
    ],
    correct_key: "a",
    clue: "Nhận kí tự: T",
  },
  {
    id: "q_3",
    group_id: "grp_hust",
    question_type: "multiple_choice",
    text: "Tên ban tập hợp những đầu não của GDG-HUST là gì?",
    options: [
      { key: "a", label: "Operation" },
      { key: "b", label: "Innovation" },
      { key: "c", label: "Education" },
      { key: "d", label: "Foundation" },
    ],
    correct_key: "b",
    clue: "Nhận kí tự: R",
  },
  {
    id: "q_4",
    group_id: "grp_hust",
    question_type: "multiple_choice",
    text: "Trang phục truyền thống của người con gái Việt Nam là gì?",
    options: [
      { key: "a", label: "Áo tứ thân" },
      { key: "b", label: "Áo bà ba" },
      { key: "c", label: "Áo dài" },
      { key: "d", label: "Áo nhật bình" },
    ],
    correct_key: "c",
    clue: "Nhận kí tự: M",
  },
  {
    id: "q_5",
    group_id: "grp_hust",
    question_type: "multiple_choice",
    text: "Trụ sở chính của tập đoàn Google nằm ở tiểu bang nào của Hoa Kỳ?",
    options: [
      { key: "a", label: "New York" },
      { key: "b", label: "Washington" },
      { key: "c", label: "California" },
      { key: "d", label: "Texas" },
    ],
    correct_key: "c",
    clue: "Nhận kí tự: X",
  },
];

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
    this.storageKey = options?.storageKey || "bloom_2010_database_realtime_v1";
    this.isMemoryOnly = Boolean(options?.isMemoryOnly);
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
      const [remoteGroups, remoteBoys, remoteGirls, remoteQuestions] = await Promise.all([
        supabase.from<Group>("groups"),
        supabase.from<Boy>("boys"),
        supabase.from<Girl>("girls"),
        supabase.from<Question>("questions"),
      ]);

      let changed = false;

      if (Array.isArray(remoteGroups)) {
        if (remoteGroups.length > 0) {
          if (JSON.stringify(this.state.groups) !== JSON.stringify(remoteGroups)) {
            this.state.groups = remoteGroups;
            changed = true;
          }
        } else {
          // Initialize default group on remote if none exists
          supabase.insert<Group>("groups", DEFAULT_GROUPS[0]).catch(() => {});
        }
      }

      if (Array.isArray(remoteBoys)) {
        if (JSON.stringify(this.state.boys) !== JSON.stringify(remoteBoys)) {
          this.state.boys = remoteBoys;
          changed = true;
        }
      }

      if (Array.isArray(remoteGirls)) {
        if (JSON.stringify(this.state.girls) !== JSON.stringify(remoteGirls)) {
          this.state.girls = remoteGirls;
          changed = true;
        }
      }

      if (Array.isArray(remoteQuestions)) {
        if (JSON.stringify(this.state.questions) !== JSON.stringify(remoteQuestions)) {
          this.state.questions = remoteQuestions;
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

  public getGirlByToken(token: string): Girl | null {
    const clean = token.trim();
    if (!clean) return null;
    return this.state.girls.find((g) => g.token === clean) || null;
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
    return this.state.questions.length > 0 ? this.state.questions : DEFAULT_QUESTIONS;
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

      if (this.isUsingSupabase()) {
        supabase.update<Girl>("girls", `token=eq.${girl.token}`, {
          current_question_index: girl.current_question_index,
          wrong_attempts: 0,
          stage: girl.stage,
          completed_at: girl.completed_at,
        }).catch(() => {});
      }

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

      if (this.isUsingSupabase()) {
        supabase.update<Girl>("girls", `token=eq.${girl.token}`, {
          wrong_attempts: newWrong,
          stage: "quiz",
        }).catch(() => {});
      }

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

    if (this.isUsingSupabase()) {
      supabase.update<Girl>("girls", `token=eq.${girl.token}`, {
        current_question_index: 0,
        wrong_attempts: 0,
        stage: "not_started",
        completed_at: null as any,
      }).catch(() => {});
    }

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
    if (this.isUsingSupabase()) {
      supabase.update<Girl>("girls", `token=eq.${girl.token}`, {
        current_question_index: nextIndex,
        wrong_attempts: 0,
        stage: girl.stage,
        completed_at: girl.completed_at,
      }).catch(() => {});
    }
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
        g.group_access_code.toUpperCase() === cleanCode ||
        g.secret_code.toUpperCase() === cleanCode
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

    if (this.isUsingSupabase()) {
      // Ensure group exists then upsert boy and gifts
      supabase.insert<Group>("groups", group).then(() => {
        supabase.insert<Boy>("boys", boy!);
        if (boy?.secret_code) {
          void Promise.resolve(
            supabase.client.from("gifts").upsert({
              id: boy.id,
              code: boy.secret_code.trim().toUpperCase(),
              recipient_name: boy.assigned_girl_name || "",
              sender_name: boy.name,
              message: boy.personal_wish || "",
              gift_content: boy.gift_hint || "",
              ornament_type: boy.ornament_type || "lotus",
            })
          ).catch(() => {});
        }
      }).catch((err) => console.warn("[Supabase] submitBoyWish error:", err));
    }

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
      try {
        const group = this.state.groups[0] || DEFAULT_GROUPS[0];
        await supabase.insert<Group>("groups", group);
        await supabase.insert<Boy>("boys", res.boy);
        if (res.boy.secret_code) {
          await supabase.client.from("gifts").upsert({
            id: res.boy.id,
            code: res.boy.secret_code.trim().toUpperCase(),
            recipient_name: res.boy.assigned_girl_name || "",
            sender_name: res.boy.name,
            message: res.boy.personal_wish || "",
            gift_content: res.boy.gift_hint || "",
            ornament_type: res.boy.ornament_type || "lotus",
          });
        }
      } catch (err) {
        console.warn("[Supabase] submitBoyWishAsync error:", err);
      }
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
  } {
    const clean = code.trim().toUpperCase();
    if (!clean) return { success: false };

    const matchingGroup = this.state.groups.find(
      (g) => g.secret_code.toUpperCase() === clean
    );
    const matchingBoy = this.state.boys.find(
      (b) => b.secret_code && b.secret_code.trim().toUpperCase() === clean
    );

    const isGroupCode = Boolean(matchingGroup);

    if (!isGroupCode && !matchingBoy) {
      return { success: false };
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
    if (syncResult.success) {
      return syncResult;
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

  public getTreeData(girlToken?: string, preferredGroupId?: string) {
    let activeGroup: Group | null = null;
    let girl: Girl | null = null;

    if (preferredGroupId) {
      activeGroup = this.state.groups.find((g) => g.id === preferredGroupId) || null;
    }

    if (!activeGroup && girlToken) {
      girl = this.getGirlByToken(girlToken);
      if (girl) {
        const girlGroupId = girl.group_id;
        activeGroup = this.state.groups.find((g) => g.id === girlGroupId) || null;
      }
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

    const isGlobalUnlocked = Boolean(
      activeGroup &&
      unlockedCodes.has(activeGroup.secret_code.toUpperCase())
    );

    return {
      group: activeGroup,
      groups: this.state.groups,
      boys: groupBoys,
      allBoys: this.state.boys,
      isUnlocked: isGlobalUnlocked,
      unlockedCodes: Array.from(unlockedCodes),
      isBoyUnlocked: (boy: Boy) => {
        if (isGlobalUnlocked) return true;
        if (!boy.secret_code) return isGlobalUnlocked;
        return unlockedCodes.has(boy.secret_code.trim().toUpperCase());
      },
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
  storageKey: "bloom_2010_database_realtime_v1",
  enableSupabase: true,
  isMemoryOnly: false,
});
