import { TEAM_QUESTIONS } from "@/services/app-database";
import type { Question } from "@/types/database";

// Answer sheet for the checker code (girls.is_checker): every group's questions with the right answer marked.

function QuestionCard({ q, n }: { q: Question; n: number }) {
  return (
    <li className="rounded-2xl bg-white border border-pink-100 p-4">
      <p className="text-sm text-[#431936]">
        <span className="font-bold text-[#B4475A]">Câu {n}.</span> {q.text}
      </p>
      {q.hint && <p className="mt-2 text-xs text-[#B4475A]">{q.hint}</p>}
      {q.question_type === "text" ? (
        <p className="mt-3 px-3 py-2 rounded-lg border bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold text-xs">
          Gõ đáp án: <span className="font-mono tracking-wider">{q.answer}</span> ✓
        </p>
      ) : (
      <ul className="mt-3 grid gap-1.5 sm:grid-cols-2 text-xs">
        {q.options.map((o) => {
          const correct = o.key === q.correct_key;
          return (
            <li
              key={o.key}
              className={`px-3 py-2 rounded-lg border ${
                correct ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold" : "border-slate-200 text-slate-600"
              }`}
            >
              {o.key.toUpperCase()}. {o.label} {correct && "✓"}
            </li>
          );
        })}
      </ul>
      )}
      <p className="mt-2 text-[11px] text-[#826A73]">{q.clue}</p>
    </li>
  );
}

export function QuestionReview({ onExit }: { onExit: () => void }) {
  const groups = Object.entries(TEAM_QUESTIONS);
  const common = groups[0][1].slice(0, 3);

  return (
    <main className="w-full min-h-screen bg-gradient-to-b from-[#FFF5F7] via-[#FDE8EF] to-[#F7D5DF] text-[#381A2B] px-4 pt-28 pb-16">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-serif font-bold text-[#431936]">Đáp án các nhóm</h1>
          <button type="button" onClick={onExit} className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-4 cursor-pointer">
            Đổi mã
          </button>
        </div>

        <nav className="mt-4 flex flex-wrap gap-2 text-xs">
          {groups.map(([team]) => (
            <a key={team} href={`#nhom-${team}`} className="px-3 py-1.5 rounded-full bg-white border border-pink-200 text-[#B4475A] font-semibold no-underline">
              Nhóm {team}
            </a>
          ))}
        </nav>

        <section className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#B4475A]">Câu 1–3 · chung cho mọi nhóm</h2>
          <ol className="mt-3 space-y-3">
            {common.map((q, i) => (
              <QuestionCard key={q.id} q={q} n={i + 1} />
            ))}
          </ol>
        </section>

        {groups.map(([team, qs]) => (
          <section key={team} id={`nhom-${team}`} className="mt-10 scroll-mt-28">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#B4475A]">Nhóm {team} · câu 4–5</h2>
            <ol className="mt-3 space-y-3">
              {qs.slice(3).map((q, i) => (
                <QuestionCard key={q.id} q={q} n={i + 4} />
              ))}
            </ol>
          </section>
        ))}
      </div>
    </main>
  );
}
