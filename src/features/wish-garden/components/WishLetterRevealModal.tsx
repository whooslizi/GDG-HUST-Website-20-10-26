import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Boy } from "@/types/database";

interface WishLetterRevealModalProps {
  boy: Boy | null;
  isUnlocked: boolean;
  onClose: () => void;
  onOpenCodeInput?: () => void;
  onDirectUnlockCode?: (code: string) => boolean | Promise<boolean>;
}

export function WishLetterRevealModal({
  boy,
  isUnlocked,
  onClose,
  onOpenCodeInput: _onOpenCodeInput,
  onDirectUnlockCode,
}: WishLetterRevealModalProps) {
  const [phase, setPhase] = useState<"envelope" | "opening" | "revealed">("envelope");
  const [codeInput, setCodeInput] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [isLocallyUnlocked, setIsLocallyUnlocked] = useState(false);

  const isEffectivelyUnlocked = isUnlocked || isLocallyUnlocked;

  useEffect(() => {
    setIsLocallyUnlocked(false);
    setCodeInput("");
    setUnlockError("");
  }, [boy]);

  useEffect(() => {
    if (boy && isEffectivelyUnlocked) {
      setPhase("envelope");
      const t1 = setTimeout(() => setPhase("opening"), 350);
      const t2 = setTimeout(() => setPhase("revealed"), 1100);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else {
      setPhase("envelope");
    }
  }, [boy, isEffectivelyUnlocked]);

  if (!boy) return null;

  async function handleUnlockSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUnlockError("");
    const clean = codeInput.trim().toUpperCase();
    if (!clean) return;

    let ok = false;
    if (onDirectUnlockCode) {
      ok = await onDirectUnlockCode(clean);
    }

    if (ok) {
      setIsLocallyUnlocked(true);
      setPhase("opening");
      setTimeout(() => setPhase("revealed"), 900);
    } else {
      setUnlockError("Mã chưa chính xác. Bạn kiểm tra lại với bạn nam nhé!");
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto font-sans">
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: "spring", damping: 24, stiffness: 300 }}
          className="relative z-10 w-full max-w-[500px] my-6"
        >
          {!isEffectivelyUnlocked ? (
            <div className="relative rounded-3xl bg-[#FFFDF9] text-[#2C1820] p-7 border-2 border-pink-200/90 shadow-2xl overflow-hidden text-center">
              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full bg-pink-100/60 hover:bg-pink-100 text-[#431936] transition-colors cursor-pointer"
              >
                ✕
              </button>

              <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-pink-100 text-pink-700 mb-3 shadow-inner">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>

              <span className="inline-block px-3 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                Thư chưa mở khóa
              </span>

              <h2 className="text-xl font-bold font-serif text-[#431936] mt-1">
                Lời chúc từ {boy.name}
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                Bức thư này được khóa bằng mã bí mật. Bạn hãy nhập mã do {boy.name} gửi để mở thư nhé!
              </p>

              <form onSubmit={handleUnlockSubmit} className="mt-4 space-y-2.5">
                {unlockError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                    {unlockError}
                  </div>
                )}

                <input
                  type="text"
                  required
                  autoFocus
                  placeholder={`Nhập mã bí mật từ ${boy.name}...`}
                  value={codeInput}
                  onChange={(e) => {
                    setCodeInput(e.target.value.toUpperCase());
                    setUnlockError("");
                  }}
                  className="w-full h-11 px-4 rounded-xl border border-pink-200 bg-white font-mono uppercase tracking-wider text-xs text-slate-800 text-center focus:outline-none focus:border-pink-500 shadow-sm placeholder:normal-case placeholder:font-sans placeholder:tracking-normal placeholder:text-slate-400"
                />

                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-[#D94B76] hover:bg-[#C23D66] text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
                >
                  Mở Thư Ngay
                </button>
              </form>
            </div>
          ) : (
            <div className="relative">
              {phase !== "revealed" ? (
                <div className="relative w-full h-[320px] rounded-3xl bg-[#FAF4EE] border-2 border-pink-200/90 shadow-2xl p-6 flex flex-col items-center justify-center text-center overflow-hidden">
                  <motion.div
                    animate={phase === "opening" ? { scale: [1, 1.2, 0], opacity: [1, 1, 0] } : {}}
                    transition={{ duration: 0.5 }}
                    className="size-16 rounded-full bg-gradient-to-tr from-[#C25953] to-[#E06D88] text-white flex flex-col items-center justify-center border-2 border-dashed border-[#FAD2D8] shadow-lg mb-3 z-30"
                  >
                    <span className="text-sm font-bold tracking-tight">20/10</span>
                    <span className="text-[7px] font-semibold tracking-tighter uppercase">GDGoC</span>
                  </motion.div>

                  <motion.div
                    initial={{ rotateX: 0 }}
                    animate={phase === "opening" ? { rotateX: 180 } : { rotateX: 0 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    style={{ transformOrigin: "top" }}
                    className="w-64 h-24 bg-[#F2E5D9] border-t-2 border-pink-300/60 rounded-t-2xl shadow-md flex items-center justify-center text-xs font-serif font-bold text-pink-700"
                  >
                    Đang mở phong thư...
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={phase === "opening" ? { y: -40, opacity: 1 } : { y: 20, opacity: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="w-56 h-28 bg-[#FFFDF9] rounded-xl border border-pink-200 shadow-md p-3 text-[11px] text-[#431936] font-serif"
                  >
                    Thư từ {boy.name}...
                  </motion.div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.88, y: 25 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: "spring", damping: 22, stiffness: 260 }}
                  className="relative rounded-3xl bg-[#FFFDF9] text-[#2C1820] p-6 sm:p-8 border-2 border-pink-200/90 shadow-2xl overflow-hidden"
                >
                  <div className="absolute top-5 right-5 flex flex-col items-center justify-center size-14 rounded-lg border-2 border-dashed border-pink-300 bg-pink-50 rotate-3 p-1 shadow-sm">
                    <span className="text-base font-bold text-pink-600">20/10</span>
                    <span className="text-[8px] font-semibold text-pink-800 tracking-tighter uppercase">GDGoC HUST</span>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-5 left-5 flex size-8 items-center justify-center rounded-full bg-pink-100/60 hover:bg-pink-100 text-[#431936] transition-colors cursor-pointer"
                  >
                    ✕
                  </button>

                  <div className="pt-8">
                    <div className="border-b border-pink-150 pb-3">
                      <span className="text-[11px] font-semibold tracking-wider uppercase text-pink-600">
                        Thư chúc mừng 20/10 từ bạn nam
                      </span>
                      <h2 className="text-2xl font-bold font-serif text-[#431936] mt-0.5">
                        {boy.name}
                      </h2>
                    </div>

                    <div className="my-5 p-5 rounded-2xl bg-[#FAF6F0] border border-pink-100 shadow-inner">
                      <p className="text-sm leading-relaxed text-[#2C1820] font-sans whitespace-pre-line italic">
                        "{boy.personal_wish || "Chúc bạn ngày 20/10 ngập tràn niềm vui, luôn xinh tươi, rạng rỡ và nhận được thật nhiều yêu thương nhé!"}"
                      </p>
                    </div>

                    <div className="pt-4 border-t border-dashed border-pink-200 flex flex-col items-center justify-center text-center">
                      <div className="size-8 rounded-full bg-pink-100 border border-pink-200 flex items-center justify-center text-pink-600 mb-1">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                      </div>
                      <p className="font-serif text-base font-bold text-[#431936] tracking-tight">
                        Chúc mừng 20/10
                      </p>
                      <p className="font-mono text-xs font-bold text-pink-600 tracking-wider uppercase mt-0.5">
                        GDGoC-HUST
                      </p>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setPhase("envelope");
                          setTimeout(() => setPhase("opening"), 200);
                          setTimeout(() => setPhase("revealed"), 900);
                        }}
                        className="text-[11px] text-pink-600 hover:text-pink-700 font-medium underline underline-offset-4 cursor-pointer"
                      >
                        Mở lại phong thư
                      </button>

                      <button
                        type="button"
                        onClick={onClose}
                        className="h-10 px-6 rounded-full bg-[#D94B76] hover:bg-[#C23D66] text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
                      >
                        Gấp thư lại
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
