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

test("verifySecretCode unlocks tree and individual boy letters even without girl token", () => {
  const db = new AppDatabaseService({
    isMemoryOnly: true,
    enableSupabase: false,
  });

  const treeBefore = db.getTreeData();
  const minhAnh = treeBefore.boys.find((b) => b.name === "Minh Anh");
  assert.ok(minhAnh);
  assert.equal(treeBefore.isBoyUnlocked(minhAnh!), false);
  assert.equal(treeBefore.isUnlocked, false);

  // Unlock specifically with boy's secret code (SEN)
  const resBoy = db.verifySecretCode("  sen  ");
  assert.equal(resBoy.success, true);
  assert.equal(resBoy.unlockedBoy?.name, "Minh Anh");

  const treeAfterBoy = db.getTreeData();
  assert.equal(treeAfterBoy.isBoyUnlocked(minhAnh!), true);

  // Group code (2010) unlocks all boys
  const resGroup = db.verifySecretCode("2010");
  assert.equal(resGroup.success, true);
  const treeAfterGroup = db.getTreeData();
  assert.equal(treeAfterGroup.isUnlocked, true);
  treeAfterGroup.boys.forEach((b) => {
    assert.equal(treeAfterGroup.isBoyUnlocked(b), true);
  });
});


test("getQuestionsForGirl falls back to the default questions when none are stored", () => {
  // No localStorage under node, so this starts with no stored questions.
  const db = new AppDatabaseService({ enableSupabase: false });
  const girl = db.getOrCreateGirl("fallback_token");
  const questions = db.getQuestionsForGirl(girl);
  assert.equal(questions.length, 5);
  assert.equal(questions.map((q) => q.clue.slice(-1)).join(""), "KTRMX");
});
