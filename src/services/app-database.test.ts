import assert from "node:assert/strict";
import test from "node:test";
import { AppDatabaseService } from "./app-database.ts";

test("AppDatabaseService initializes with default groups and girls", () => {
  const db = new AppDatabaseService({
    isMemoryOnly: true,
    enableSupabase: false,
  });
  const state = db.getState();
  assert.ok(state.groups.length > 0);
  assert.ok(state.girls.length > 0);
});

test("verifySecretCode verifies group access code and secret code", () => {
  const db = new AppDatabaseService({
    isMemoryOnly: true,
    enableSupabase: false,
  });
  const resValid = db.verifySecretCode("2010");
  assert.equal(resValid.success, true);
  assert.equal(resValid.group?.group_name, "GDGoC HUST");

  const resInvalid = db.verifySecretCode("WRONG_CODE");
  assert.equal(resInvalid.success, false);
});

test("submitBoyWish creates and updates boy wish with custom code", () => {
  const db = new AppDatabaseService({
    isMemoryOnly: true,
    enableSupabase: false,
  });

  const res = db.submitBoyWish(
    "GDGOC2010",
    "Trần Văn Nam",
    "NAM2010",
    "Chúc các bạn nữ luôn xinh đẹp và thành công!",
    "peach"
  );
  assert.equal(res.success, true);

  const tree = db.getTreeData();
  const boy = tree.boys.find((b) => b.name === "Trần Văn Nam");
  assert.ok(boy);
  assert.equal(boy?.secret_code, "NAM2010");
  assert.equal(boy?.ornament_type, "peach");

  const unlockRes = db.verifySecretCode("NAM2010");
  assert.equal(unlockRes.success, true);
  assert.equal(unlockRes.unlockedBoy?.name, "Trần Văn Nam");
});

test("submitQuizAnswer handles multiple attempts and reveals answer", () => {
  const db = new AppDatabaseService({
    isMemoryOnly: true,
    enableSupabase: false,
  });
  const girl = db.getOrCreateGirl("test_girl_token");
  const questions = db.getQuestionsForGirl(girl);
  assert.ok(questions.length > 0);

  const q = questions[0];
  const wrongKey = q.correct_key === "a" ? "b" : "a";

  const attempt1 = db.submitQuizAnswer(girl.token, 0, wrongKey);
  assert.equal(attempt1.correct, false);
  assert.equal(attempt1.reveal, false);

  const attempt2 = db.submitQuizAnswer(girl.token, 0, wrongKey);
  assert.equal(attempt2.correct, false);
  assert.equal(attempt2.reveal, true);

  const correctAttempt = db.submitQuizAnswer(girl.token, 0, q.correct_key);
  assert.equal(correctAttempt.correct, true);
});

test("getQuestionsForGirl falls back to the default questions when none are stored", () => {
  // No localStorage under node, so this starts with no stored questions.
  const db = new AppDatabaseService({ enableSupabase: false });
  const girl = db.getOrCreateGirl("fallback_token");
  const questions = db.getQuestionsForGirl(girl);
  assert.equal(questions.length, 5);
  assert.equal(questions.map((q) => q.clue.slice(-1)).join(""), "KTRMX");
});

test("the wish tree is open to everyone without a code", () => {
  const db = new AppDatabaseService({ isMemoryOnly: true, enableSupabase: false });
  db.submitBoyWish("GDGOC2010", "Boy 1", "CODE1", "Chúc mừng 20/10!", "peach");
  for (const tree of [db.getTreeData(), db.getTreeData("LANCHI_2010")]) {
    assert.equal(tree.isUnlocked, true);
    tree.boys.forEach((b) => assert.equal(tree.isBoyUnlocked(b), true));
  }
});

test("each team gets its own questions 4-5 with correct answers", () => {
  const db = new AppDatabaseService({ enableSupabase: false });
  const girl = db.getOrCreateGirl("team_token");
  const answer = (team: string) => {
    girl.quiz_group = team;
    return db.getQuestionsForGirl(girl).slice(3).map((q) => q.options.find((o) => o.key === q.correct_key)!.label);
  };
  // Decode the shift puzzles independently so a typo in the data shows up here.
  const shift = (nums: number[], k: number) => nums.map((n) => String.fromCharCode(64 + n + k)).join("");
  assert.deepEqual(answer("Nhóm 1"), [shift([18, 27, 22, 10, 17, 16], -2), atob("R0RHSFVTVDIwMjU=")]);
  assert.deepEqual(answer("2"), [shift([0, 5, 15, 12, 10, 2], 3), "GDGHUST"]);
  assert.deepEqual(answer("3"), [shift([7, 4, 23, 4], -3), "GDGHUST"]);
  assert.deepEqual(answer("4"), [shift([8, -4, 15, -2, 3], 5), "GDG"]);
  assert.deepEqual(answer("5"), [shift([16, 10, 30, 7, 20, 6, 23, 9], -5), "GDG HUST"]);
  assert.deepEqual(answer("6"), [shift([-1, 11, 0, 5, 10, 3], 4), "GDGHUST"]);
  assert.deepEqual(answer("7"), [shift([8, 2, 22, 20, 12, 15, 1], 3), "GDG"]);
  assert.deepEqual(answer("1"), ["PYTHON", "GDGHUST2025"]);
  girl.quiz_group = undefined;
  assert.equal(db.getQuestionsForGirl(girl)[3].id, "t1_q_4");
});
