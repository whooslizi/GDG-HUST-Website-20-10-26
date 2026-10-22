import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { dbService, TEAM_QUESTIONS, type AppDatabaseService } from "@/services/app-database";
import type { Girl, Question, OptionKey } from "@/types/database";
import { GirlWelcome } from "@/features/quiz/components/GirlWelcome";
import { LetterSheet } from "@/features/quiz/components/LetterSheet";
import { INVITE_TITLE, INVITE_PS, inviteBody, THANKS_TITLE, THANKS } from "@/features/quiz/invitation";
import { QuestionReview } from "@/features/quiz/components/QuestionReview";

// Event opens 18:00 22/10/2026 Vietnam time; girls who log in earlier only see a countdown.
const OPEN_AT = new Date("2026-10-22T18:00:00+07:00").getTime();
const DEFAULT_WISH = "Chúc bạn một ngày 20/10 thật rạng rỡ, ngập tràn niềm vui và yêu thương!";

function formatCountdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${Math.floor(s / 86400)} ngày ${pad(Math.floor(s / 3600) % 24)}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
}

export function QuizPlay({
  token,
  customDb,
}: {
  token: string;
  customDb?: AppDatabaseService;
}) {
  const activeDb = customDb || dbService;
  const navigate = useNavigate();
  const [girl, setGirl] = useState<Girl | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pickedKey, setPickedKey] = useState<OptionKey | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [feedback, setFeedback] = useState<"idle" | "wrong_1" | "wrong_2_reveal" | "correct">("idle");
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  // Boys' code: which group's game they picked ("" = show the picker), or the answer sheet.
  const [boyTeam, setBoyTeam] = useState("");
  const [showAnswers, setShowAnswers] = useState(false);
  const [letterDone, setLetterDone] = useState(false);
  const reduceMotion = useReducedMotion();
  const [now, setNow] = useState(() => Date.now());
  const isOpen = now >= OPEN_AT;

  useEffect(() => {
    if (isOpen) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [isOpen]);

  const loadGirlByToken = useCallback(
    async (userToken: string): Promise<boolean> => {
      const clean = userToken.trim();
      if (!clean) return false;

      // The roster is private: Supabase only returns the girl whose code matches.
      const found = await activeDb.loginGirl(clean);
      if (!found) return false;

      setGirl(found);
      setShowWelcome(found.stage === "not_started");
      const list = activeDb.getQuestionsForGirl(found);
      setQuestions(list);
      setCurrentIndex(found.current_question_index || 0);

      if (typeof localStorage !== "undefined") {
        localStorage.setItem("active_girl_token", found.token);
      }
      activeDb.notifyListeners();
      return true;
    },
    [activeDb]
  );

  useEffect(() => {
    let resolvedToken = token;
    if (!resolvedToken && typeof localStorage !== "undefined") {
      resolvedToken = localStorage.getItem("active_girl_token") || "";
    }

    if (!resolvedToken) {
      setLoading(false);
      return;
    }
    loadGirlByToken(resolvedToken).then((ok) => {
      if (!ok && typeof localStorage !== "undefined") localStorage.removeItem("active_girl_token");
      setLoading(false);
    });
  }, [token, loadGirlByToken]);

  function handleResetQuiz() {
    if (!girl) return;
    girl.current_question_index = 0;
    girl.wrong_attempts = 0;
    girl.stage = "quiz";
    activeDb.saveToStorage();
    setCurrentIndex(0);
    setFeedback("idle");
    setPickedKey(null);
  }

  // Boys' code: replay a group from the start. Kept local; saveGirlProgress skips this account.
  function startBoyTeam(team: string) {
    const g = activeDb.getGirlByToken(girl!.token);
    if (!g) return;
    Object.assign(g, {
      quiz_group: `Nhóm ${team}`,
      current_question_index: 0,
      wrong_attempts: 0,
      stage: "not_started",
      completed_at: undefined,
    });
    setGirl({ ...g });
    setQuestions(activeDb.getQuestionsForGirl(g));
    setCurrentIndex(0);
    setFeedback("idle");
    setPickedKey(null);
    setShowWelcome(true);
    setBoyTeam(team);
  }

  function handleSwitchAccount() {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("active_girl_token");
    }
    activeDb.notifyListeners();
    setGirl(null);
    setBoyTeam("");
    setShowAnswers(false);
    setFeedback("idle");
    setPickedKey(null);
    setLetterDone(false);
  }

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#FFF5F7] flex items-center justify-center text-[#431936] text-sm">
        Đang tải thử thách...
      </div>
    );
  }

  // No code: everyone gets the thank-you letter, with nothing behind it.
  if (!girl) {
    return <LetterSheet to="" title={THANKS_TITLE}>{THANKS}</LetterSheet>;
  }

  // Boys' code (girls.is_checker, set only in Supabase): pick any group's game, skip the countdown.
  if (girl.is_checker && showAnswers) {
    return <QuestionReview onExit={() => setShowAnswers(false)} />;
  }
  if (girl.is_checker && !boyTeam) {
    return (
      <main className="w-full min-h-screen bg-gradient-to-b from-[#FFF5F7] via-[#FDE8EF] to-[#F7D5DF] text-[#381A2B] flex items-center justify-center px-4 pt-28 pb-16">
        <div className="w-full max-w-[460px] rounded-3xl bg-[#FFFDFB] p-7 border border-pink-200/90 shadow-2xl text-center">
          <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#B4475A]">Dành cho bạn nam</p>
          <h1 className="mt-1 text-2xl font-serif font-bold text-[#431936]">Chọn nhóm để chơi thử</h1>
          <p className="mt-2 text-xs text-[#826A73]">Chơi thử không lưu tiến độ, chơi lại bao nhiêu lần cũng được.</p>

          <div className="mt-5 grid grid-cols-3 sm:grid-cols-4 gap-2">
            {Object.keys(TEAM_QUESTIONS).map((team) => (
              <button
                key={team}
                type="button"
                onClick={() => startBoyTeam(team)}
                className="h-11 rounded-xl border border-pink-200 bg-white text-sm font-semibold text-[#B4475A] hover:bg-pink-50 cursor-pointer"
              >
                Nhóm {team}
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-2.5">
            <Link
              to="/boy"
              search={{ token: girl.token, group: girl.group_id, view: "compose" }}
              className="w-full h-11 rounded-xl bg-[#D94B76] hover:bg-[#C23D66] text-white font-bold text-xs flex items-center justify-center no-underline"
            >
              Viết lời chúc lên cây →
            </Link>
            <button
              type="button"
              onClick={() => setShowAnswers(true)}
              className="w-full h-11 rounded-xl border border-pink-200 text-[#B4475A] font-semibold text-xs hover:bg-pink-50 cursor-pointer"
            >
              Xem đáp án các nhóm
            </button>
            <button type="button" onClick={handleSwitchAccount} className="mt-1 text-xs text-slate-500 hover:text-slate-700 cursor-pointer">
              Đổi mã
            </button>
          </div>
        </div>
      </main>
    );
  }

  // The letter always comes first; once the game is open it ends with a play button.
  if (!girl.is_checker && (!isOpen || !letterDone)) {
    return (
      <LetterSheet
        to={girl.name}
        title={THANKS_TITLE}
        signature="GDG-HUST"
        pages={[
          <>
            <p className="mb-5 text-center text-[21px] sm:text-[24px] leading-snug text-[#B4475A]">{INVITE_TITLE}</p>
            <p>{`Kính gửi ${girl.name.trim() || "bạn"},`}</p>
            <div className="mt-4">{inviteBody(girl.name)}</div>
            <p className="mt-6">Thân gửi và kính thư,</p>
          </>,
          INVITE_PS,
        ]}
        footer={
          <div role="status" className="text-center border-t border-dashed border-[#D9C7B0] pt-6">
            {isOpen ? (
              <button
                type="button"
                onClick={() => setLetterDone(true)}
                className="w-full h-11 rounded-xl bg-[#D94B76] hover:bg-[#C23D66] text-white font-bold text-sm cursor-pointer"
              >
                Bắt đầu chơi →
              </button>
            ) : (
              <>
                <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#B4475A]">
                  Trò chơi mở lúc 18:00 ngày 22/10/2026
                </p>
                <p className="mt-1 text-2xl font-mono font-bold text-[#B4475A] tabular-nums">
                  {formatCountdown(OPEN_AT - now)}
                </p>
              </>
            )}
            <p className="mt-4 text-xs text-[#826A73] leading-relaxed">
              Các bạn nam GDG cũng gửi các lời chúc đến cậu, hãy ấn vào{" "}
              <Link
                to="/boy"
                search={{ token: girl.token, group: girl.group_id, view: "tree" }}
                className="font-bold text-[#B4475A] bg-pink-100 px-1.5 py-0.5 rounded hover:bg-pink-200 no-underline"
              >
                cây ước nguyện
              </Link>{" "}
              để xem nhé.
            </p>
            <button
              type="button"
              onClick={handleSwitchAccount}
              className="mt-4 text-xs text-[#8C7464] hover:text-[#3A2230] underline underline-offset-4 cursor-pointer"
            >
              Đổi mã
            </button>
          </div>
        }
      >
        {THANKS}
      </LetterSheet>
    );
  }

  if (showWelcome) {
    return (
      <GirlWelcome
        name={girl.name}
        code={girl.token}
        wish={girl.welcome_wish || DEFAULT_WISH}
        onDone={() => setShowWelcome(false)}
      />
    );
  }

  const isFinished = girl.stage === "completed" || currentIndex >= questions.length;

  if (isFinished) {
    return (
      <main className="w-full min-h-screen bg-gradient-to-b from-[#FFF5F7] via-[#FDE8EF] to-[#F7D5DF] text-[#381A2B] flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-full max-w-[440px] rounded-3xl bg-[#FFFDFB] p-6 sm:p-7 border border-pink-200/80 shadow-xl shadow-pink-900/5 text-center">
          <div className="size-16 rounded-full bg-pink-100/80 border border-pink-200 flex items-center justify-center text-pink-600 mx-auto mb-3">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>

          <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold uppercase tracking-wider mb-2">
            Đã Hoàn Thành Thử Thách
          </span>

          <h1 className="text-2xl font-bold font-serif text-[#431936]">
            Chúc Mừng {girl.name}!
          </h1>

          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Bạn đã hoàn thành minigame! Hãy dùng manh mối bên dưới để tìm bạn nam và nhận mã mở quà.
          </p>

          <div className="mt-5 p-4 rounded-2xl bg-pink-50/70 border border-pink-100 text-left space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-pink-700">
              Gợi ý manh mối nhận quà:
            </span>
            <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
              {questions.map((q, idx) => (
                <li key={q.id}>
                  <strong>Câu {idx + 1}:</strong> {q.clue || "Lời chúc ấm áp từ các bạn nam"}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 flex flex-col gap-2.5">
            <Link
              to="/boy"
              search={{ token: girl.token, group: girl.group_id, view: "tree" }}
              className="w-full h-11 rounded-xl bg-[#D94B76] hover:bg-[#C23D66] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer no-underline"
            >
              <span>Đến Cây Ước Nguyện Nhận Quà</span>
              <span>→</span>
            </Link>

            <button
              type="button"
              onClick={handleResetQuiz}
              className="text-xs text-slate-500 hover:text-slate-700 py-1 cursor-pointer"
            >
              Làm lại minigame từ đầu
            </button>
          </div>
        </div>
      </main>
    );
  }

  const currentQuestion = questions[currentIndex];

  function handlePickOption(key: OptionKey) {
    if (feedback === "correct" || feedback === "wrong_2_reveal") return;
    setPickedKey(key);
    submitAnswer(key);
  }

  function handleTypedSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (feedback === "correct" || feedback === "wrong_2_reveal" || !typedAnswer.trim()) return;
    submitAnswer(typedAnswer);
  }

  function submitAnswer(answer: string) {
    const result = activeDb.submitQuizAnswer(girl!.token, currentIndex, answer);
    setGirl(result.girl);

    if (result.correct) {
      setFeedback("correct");
      setTimeout(() => {
        setPickedKey(null);
        setTypedAnswer("");
        setFeedback("idle");
        setCurrentIndex(result.nextIndex);
        if (result.completed) goToTree(result.girl);
      }, 1800);
      return;
    }

    if (result.reveal) {
      setFeedback("wrong_2_reveal");
      return;
    }

    setFeedback("wrong_1");
  }

  function handleContinueAfterReveal() {
    const result = activeDb.advanceAfterReveal(girl!.token, currentIndex);
    setGirl(result.girl);
    setPickedKey(null);
    setTypedAnswer("");
    setFeedback("idle");
    setCurrentIndex(result.nextIndex);
    if (result.completed) goToTree(result.girl);
  }

  function goToTree(g: Girl) {
    activeDb.notifyListeners();
    navigate({ to: "/boy", search: { token: g.token, group: g.group_id, view: "tree" } });
  }

  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <main className="w-full min-h-screen bg-gradient-to-b from-[#FFF5F7] via-[#FDE8EF] to-[#F7D5DF] text-[#381A2B] flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-[440px] rounded-3xl bg-[#FFFDFB] p-6 sm:p-7 border border-pink-200/80 shadow-xl shadow-pink-900/5">
        <div className="flex items-center justify-between text-xs text-[#826A73] mb-3">
          <span className="font-semibold text-pink-700">
            Câu hỏi {currentIndex + 1} / {questions.length}
          </span>
          <div className="flex items-center gap-2">
            <span className="font-medium text-[#431936]">🌸 {girl.name}</span>
            <button
              type="button"
              onClick={handleSwitchAccount}
              className="text-[10px] text-pink-600 hover:underline cursor-pointer"
            >
              (Đổi mã)
            </button>
          </div>
        </div>

        <div className="w-full h-1.5 rounded-full bg-pink-100 overflow-hidden mb-6">
          <div
            className="h-full bg-[#D94B76] transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <h2 className="text-lg font-bold text-[#381A2B] leading-snug">
          {currentQuestion?.text}
        </h2>
        {currentQuestion?.hint && (
          <p className="mt-3 px-3 py-2 rounded-xl bg-pink-50 border border-pink-100 text-sm text-[#B4475A]">
            {currentQuestion.hint}
          </p>
        )}

        {currentQuestion?.question_type === "text" ? (
          <form onSubmit={handleTypedSubmit} className="mt-5 space-y-2.5">
            <label htmlFor="typed-answer" className="sr-only">
              Câu trả lời của bạn
            </label>
            <input
              id="typed-answer"
              key={currentQuestion.id}
              type="text"
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="characters"
              spellCheck={false}
              disabled={feedback === "correct" || feedback === "wrong_2_reveal"}
              value={typedAnswer}
              onChange={(e) => {
                setTypedAnswer(e.target.value.toUpperCase());
                if (feedback === "wrong_1") setFeedback("idle");
              }}
              placeholder="Nhập câu trả lời"
              aria-invalid={feedback === "wrong_1"}
              className={`w-full h-12 px-4 rounded-2xl border bg-white font-mono uppercase tracking-[0.25em] text-center text-base text-[#381A2B] focus:outline-none placeholder:normal-case placeholder:tracking-normal placeholder:font-sans placeholder:text-sm placeholder:text-slate-400 ${
                feedback === "correct"
                  ? "border-emerald-400 bg-emerald-50"
                  : feedback === "wrong_1"
                    ? "border-red-400 bg-red-50 animate-shake"
                    : "border-pink-200 focus:border-pink-500"
              }`}
            />
            <button
              type="submit"
              disabled={!typedAnswer.trim() || feedback === "correct" || feedback === "wrong_2_reveal"}
              className="w-full h-11 rounded-xl bg-[#D94B76] hover:bg-[#C23D66] disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              Trả lời
            </button>
          </form>
        ) : (
        <div className="mt-5 space-y-2.5">
          {currentQuestion?.options.map((option) => {
            const isPicked = pickedKey === option.key;
            const isRightKey = option.key.toLowerCase() === currentQuestion.correct_key.toLowerCase();

            let btnStyle = "bg-white border-pink-200/70 text-[#381A2B] hover:bg-pink-50/50 hover:border-pink-300 shadow-sm";
            let badgeStyle = "bg-pink-100/70 text-pink-700 font-bold border border-pink-200/60";

            if (feedback === "correct" && isRightKey) {
              btnStyle = "bg-emerald-50 border-emerald-400 text-emerald-900 font-bold shadow-sm shadow-emerald-500/10";
              badgeStyle = "bg-emerald-600 text-white font-bold border-emerald-600";
            } else if (feedback === "wrong_2_reveal") {
              if (isRightKey) {
                btnStyle = "bg-emerald-50 border-emerald-400 text-emerald-900 font-bold";
                badgeStyle = "bg-emerald-600 text-white font-bold border-emerald-600";
              } else if (isPicked) {
                btnStyle = "bg-red-50 border-red-300 text-red-900";
                badgeStyle = "bg-red-500 text-white font-bold border-red-500";
              }
            } else if (feedback === "wrong_1" && isPicked) {
              btnStyle = "bg-red-50 border-red-400 text-red-900 animate-shake";
              badgeStyle = "bg-red-500 text-white font-bold border-red-500";
            }

            return (
              <button
                key={option.key}
                type="button"
                onClick={() => handlePickOption(option.key)}
                className={`w-full p-3.5 rounded-2xl border text-left text-xs sm:text-sm font-medium flex items-center gap-3 transition-all cursor-pointer ${btnStyle}`}
              >
                <span className={`size-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${badgeStyle}`}>
                  {option.key.toUpperCase()}
                </span>
                <span className="flex-1 leading-snug">{option.label}</span>
              </button>
            );
          })}
        </div>
        )}

        {feedback === "wrong_1" && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <span>Chưa chính xác rồi, bạn thử lại lần nữa nhé!</span>
          </div>
        )}

        {feedback === "wrong_2_reveal" && (
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2.5">
            <p className="leading-relaxed">
              Bạn chưa trả lời chính xác sau 2 lần thử. Đáp án đúng là:{" "}
              <strong>
                {currentQuestion?.question_type === "text"
                  ? currentQuestion.answer
                  : `${currentQuestion?.correct_key.toUpperCase()}. ${
                      currentQuestion?.options.find((o) => o.key.toLowerCase() === currentQuestion.correct_key.toLowerCase())?.label
                    }`}
              </strong>
            </p>
            {currentQuestion?.clue && (
              <div className="p-2.5 rounded-xl bg-white/80 border border-amber-200 text-[11px] text-amber-800">
                <strong>Manh mối:</strong> {currentQuestion.clue}
              </div>
            )}
            <button
              type="button"
              onClick={handleContinueAfterReveal}
              className="w-full h-10 rounded-xl bg-[#D94B76] hover:bg-[#C23D66] text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              Tiếp tục câu tiếp theo →
            </button>
          </div>
        )}

        {feedback === "correct" && (
          <motion.div
            role="status"
            initial={reduceMotion ? false : { scale: 0.6, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 12, stiffness: 320 }}
            className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center"
          >
            <p className="text-xs font-semibold text-emerald-700">Chính xác! Kí tự mở khóa:</p>
            <p className="mt-1 text-4xl font-mono font-bold text-emerald-800 tracking-widest">
              {/* clue is "Nhận kí tự: K" -> show just the letter */}
              {currentQuestion?.clue.split(":").pop()?.trim() || currentQuestion?.clue}
            </p>
          </motion.div>
        )}
      </div>
    </main>
  );
}
