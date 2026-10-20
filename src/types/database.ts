export interface Group {
  id: string;
  group_name: string;
  secret_code: string;
  group_access_code: string;
  wish_message: string;
  created_at: string;
}

export type OrnamentType =
  | "lotus"
  | "peach"
  | "rose"
  | "giftbox"
  | "snowglobe"
  | "ribbon"
  | "lantern"
  | "teddy"
  | "cookie";

export interface Boy {
  id: string;
  group_id: string;
  name: string;
  email?: string;
  token?: string;
  secret_code?: string;
  description: string;
  personal_wish: string;
  ornament_type: OrnamentType;
  gift_hint?: string;
  has_written_wish?: boolean;
  assigned_girl_id?: string;
  assigned_girl_name?: string;
}

export type GirlStage = "not_started" | "quiz" | "finding_boys" | "completed";

export interface Girl {
  id: string;
  group_id: string;
  name: string;
  email?: string;
  token: string;
  current_question_index: number;
  wrong_attempts: number;
  stage: GirlStage;
  completed_at?: string;
  unlocked_codes?: string[];
  assigned_boy_id?: string;
  assigned_boy_name?: string;
  team?: string;
  quiz_group?: string; // "Nhóm 1".."Nhóm 7", picks quiz questions 4-5
  is_checker?: boolean; // checker code: sees every group's answers instead of playing
  welcome_wish?: string;
}

export type OptionKey = "a" | "b" | "c" | "d";
export type QuestionType = "multiple_choice" | "boolean";

export interface Question {
  id: string;
  group_id?: string;
  boy_id?: string;
  question_type?: QuestionType;
  text: string;
  options: {
    key: OptionKey;
    label: string;
  }[];
  correct_key: OptionKey;
  clue: string;
}

export interface EmailPreviewData {
  recipientType: "girl" | "boy";
  recipientName: string;
  recipientEmail: string;
  subject: string;
  htmlContent: string;
  plainText: string;
  actionUrl: string;
}

export interface EmailExportItem {
  id: string;
  name: string;
  email: string;
  role: "girl" | "boy";
  groupName: string;
  token: string;
  actionUrl: string;
  secretCode?: string;
  assignedPartner?: string;
}

