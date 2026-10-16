import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { dbService } from "@/services/app-database";
import type { Girl } from "@/types/database";

interface GirlAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegistered: (girl: Girl) => void;
}

export function GirlAccountModal({
  isOpen,
  onClose,
  onRegistered,
}: GirlAccountModalProps) {
  const groups = dbService.getState().groups;
  const [name, setName] = useState("");
  const [groupId, setGroupId] = useState(groups[0]?.id || "");
  const [existingToken, setExistingToken] = useState("");
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Vui lòng điền họ và tên của bạn nhé!");
      return;
    }

    const token = `girl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newGirl = dbService.addGirl(groupId, name.trim(), "", token);

    if (typeof localStorage !== "undefined") {
      localStorage.setItem("active_girl_token", newGirl.token);
    }

    setError("");
    onRegistered(newGirl);
    onClose();
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!existingToken.trim()) return;

    const girl = dbService.getGirlByToken(existingToken.trim());
    if (!girl) {
      setError("Mã tham gia không tồn tại. Vui lòng kiểm tra lại email hoặc đăng ký mới.");
      return;
    }

    if (typeof localStorage !== "undefined") {
      localStorage.setItem("active_girl_token", girl.token);
    }

    setError("");
    onRegistered(girl);
    onClose();
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-[440px] rounded-3xl bg-[#FFFDFB] text-[#381A2B] p-7 border border-pink-200 shadow-2xl my-6"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 flex size-8 items-center justify-center rounded-full bg-black/5 hover:bg-black/10 text-slate-500 transition-colors"
          >
            ✕
          </button>

          <div className="border-b border-pink-100 pb-4 pr-6">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-700 text-[10px] font-bold uppercase tracking-wider mb-2">
              Dành Riêng Cho Bạn Nữ
            </span>
            <h2 className="text-xl font-bold font-serif text-[#431936]">
              {isLoginMode ? "Đăng Nhập Bằng Mã Cá Nhân" : "Đăng Ký Tham Gia 20/10"}
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {isLoginMode
                ? "Nhập mã tham gia (Token) của bạn để vào cây ước nguyện."
                : "Điền thông tin để nhận mã tham gia minigame và mở quà trên cây ước nguyện."}
            </p>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          {!isLoginMode ? (
            <form onSubmit={handleRegister} className="mt-5 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Họ và tên của bạn *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nhập họ và tên..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-pink-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-pink-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Chọn Nhóm / Khoa của bạn
                </label>
                <select
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-pink-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-pink-500 shadow-sm"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.group_name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full h-12 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-pink-500/20 transition-all cursor-pointer"
              >
                Bắt Đầu Tham Gia
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginMode(true);
                    setError("");
                  }}
                  className="text-xs text-pink-600 hover:underline font-medium"
                >
                  Đã có mã token từ trước? Đăng nhập tại đây
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="mt-5 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Mã tham gia cá nhân (Token) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nhập mã tham gia cá nhân..."
                  value={existingToken}
                  onChange={(e) => setExistingToken(e.target.value.trim())}
                  className="w-full h-11 px-3.5 rounded-xl border border-pink-200 bg-white font-mono text-xs text-slate-800 focus:outline-none focus:border-pink-500 shadow-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full h-12 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-pink-500/20 transition-all cursor-pointer"
              >
                Vào Cây Của Bạn
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginMode(false);
                    setError("");
                  }}
                  className="text-xs text-pink-600 hover:underline font-medium"
                >
                  Chưa có tài khoản? Đăng ký mới tại đây
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

