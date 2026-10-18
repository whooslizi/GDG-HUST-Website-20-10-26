import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface GirlWelcomeProps {
  name: string;
  code: string;
  wish: string;
  onDone: () => void;
}

const STEP_MS = 850;

function authSteps(code: string) {
  return [
    { task: `Kiểm tra mã ${code}`, result: "hợp lệ" },
    { task: "Quét khuôn mặt qua webcam", result: "đùa thôi, không bật camera đâu" },
    { task: "Đo độ xinh đẹp", result: "vượt quá thang đo" },
    { task: "Xin chữ ký Ban Chủ Nhiệm", result: "đã duyệt" },
  ];
}

export function GirlWelcome({ name, code, wish, onDone }: GirlWelcomeProps) {
  const steps = authSteps(code);
  const [done, setDone] = useState(0);
  const [phase, setPhase] = useState<"auth" | "envelope" | "letter">("auth");

  useEffect(() => {
    if (phase !== "auth") return;
    if (done < steps.length) {
      const t = setTimeout(() => setDone((d) => d + 1), STEP_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setPhase("envelope"), 1100);
    return () => clearTimeout(t);
  }, [phase, done, steps.length]);

  return (
    <main className="w-full min-h-screen bg-gradient-to-b from-[#FFF5F7] via-[#FDE8EF] to-[#F7D5DF] text-[#381A2B] flex flex-col items-center justify-center p-4 font-sans">
      <AnimatePresence mode="wait">
        {phase === "auth" && (
          <motion.div
            key="auth"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="w-full max-w-[440px] rounded-2xl bg-[#2C1820] text-[#F7E6EC] p-6 shadow-xl font-mono text-xs"
          >
            <p className="text-[#E8A5B8]">GDG-HUST SECURE LOGIN v20.10</p>
            <p className="mt-1 text-[#B8949F]">Đang xác thực danh tính…</p>

            <ul className="mt-5 space-y-2.5">
              {steps.map((s, i) => {
                if (i > done) return null;
                const finished = i < done;
                return (
                  <motion.li
                    key={s.task}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-2 leading-relaxed"
                  >
                    <span className={finished ? "text-emerald-400" : "text-[#E8A5B8] animate-pulse"}>
                      {finished ? "✓" : "›"}
                    </span>
                    <span>
                      {s.task}
                      {finished ? <span className="text-[#B8949F]"> … {s.result}</span> : "…"}
                    </span>
                  </motion.li>
                );
              })}
            </ul>

            <div className="mt-5 h-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-[#E06D88] transition-all duration-700"
                style={{ width: `${(done / steps.length) * 100}%` }}
              />
            </div>

            {done >= steps.length && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-emerald-400">
                Xác thực thành công. Chào {name}!
              </motion.p>
            )}
          </motion.div>
        )}

        {phase === "envelope" && (
          <motion.button
            key="envelope"
            type="button"
            onClick={() => setPhase("letter")}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05, y: -20 }}
            whileHover={{ y: -4 }}
            className="relative w-full max-w-[360px] aspect-[8/5] rounded-2xl bg-[#F2E5D9] border border-[#E8D2C2] shadow-xl cursor-pointer overflow-hidden"
          >
            <span className="absolute inset-x-0 top-0 h-1/2 bg-[#EAD8C8] [clip-path:polygon(0_0,100%_0,50%_100%)]" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-14 rounded-full bg-[#C25953] text-white flex flex-col items-center justify-center shadow-md">
              <span className="text-xs font-bold">20/10</span>
            </span>
            <span className="absolute bottom-4 inset-x-0 text-center text-xs text-[#826A73]">
              Có thư cho {name} · bấm để mở
            </span>
          </motion.button>
        )}

        {phase === "letter" && (
          <motion.div
            key="letter"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", damping: 22, stiffness: 220 }}
            className="w-full max-w-[440px] rounded-2xl bg-[#FFFDF9] border border-[#EBDCCF] shadow-xl p-7 sm:p-8"
          >
            <p className="text-xs text-[#826A73]">Gửi {name},</p>
            <p className="mt-5 text-lg sm:text-xl font-serif text-[#431936] leading-relaxed whitespace-pre-line">
              {wish}
            </p>
            <p className="mt-6 text-right text-sm font-serif text-[#826A73]">— GDG HUST</p>

            <button
              type="button"
              onClick={onDone}
              className="mt-7 w-full h-11 rounded-xl bg-[#D94B76] hover:bg-[#C23D66] text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
            >
              Bắt đầu thử thách
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
