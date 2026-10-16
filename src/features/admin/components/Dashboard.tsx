import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { dbService } from "@/services/app-database";
import { supabase } from "@/services/supabase";
import type { OptionKey } from "@/types/database";

export function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("admin_auth_gdgoc") === "true";
    }
    return false;
  });
  const [passcodeInput, setPasscodeInput] = useState("");
  const [passcodeError, setPasscodeError] = useState("");

  const [activeTab, setActiveTab] = useState<"groups" | "boys" | "girls" | "questions" | "links">("groups");
  const [state, setState] = useState(() => dbService.getState());
  const [notification, setNotification] = useState("");

  useEffect(() => {
    const unsubscribe = dbService.subscribe(() => {
      setState(dbService.getState());
    });
    return unsubscribe;
  }, []);

  const [groupName, setGroupName] = useState("");
  const [secretCode, setSecretCode] = useState("");
  const [groupAccessCode, setGroupAccessCode] = useState("");
  const [groupWish, setGroupWish] = useState("");

  const [boyGroupId, setBoyGroupId] = useState(state.groups[0]?.id || "");
  const [boyName, setBoyName] = useState("");
  const [boyEmail, setBoyEmail] = useState("");
  const [boyToken, setBoyToken] = useState("");
  const [boySecretCode, setBoySecretCode] = useState("");
  const [boyAssignedGirlId, setBoyAssignedGirlId] = useState("");
  const [boyDesc, setBoyDesc] = useState("");
  const [boyWish, setBoyWish] = useState("");
  const [boyGift, setBoyGift] = useState("");

  const [girlGroupId, setGirlGroupId] = useState(state.groups[0]?.id || "");
  const [girlName, setGirlName] = useState("");
  const [girlEmail, setGirlEmail] = useState("");
  const [girlToken, setGirlToken] = useState("");
  const [girlAssignedBoyId, setGirlAssignedBoyId] = useState("");

  const [qGroupId, setQGroupId] = useState(state.groups[0]?.id || "");
  const [qType, setQType] = useState<"multiple_choice" | "boolean">("multiple_choice");
  const [qText, setQText] = useState("");
  const [optA, setOptA] = useState("");
  const [optB, setOptB] = useState("");
  const [optC, setOptC] = useState("");
  const [optD, setOptD] = useState("");
  const [correctKey, setCorrectKey] = useState<OptionKey>("a");
  const [qClue, setQClue] = useState("");

  function notify(msg: string) {
    setNotification(msg);
    setState({ ...dbService.getState() });
    setTimeout(() => setNotification(""), 3500);
  }

  function handleAddGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!groupName.trim() || !secretCode.trim() || !groupAccessCode.trim()) return;
    dbService.addGroup(groupName, secretCode, groupAccessCode, groupWish);
    setGroupName("");
    setSecretCode("");
    setGroupAccessCode("");
    setGroupWish("");
    notify("Đã thêm nhóm mới thành công!");
  }

  function handleAddBoy(e: React.FormEvent) {
    e.preventDefault();
    if (!boyName.trim() || !boyEmail.trim()) return;
    const token = boyToken.trim() || `boy_${Math.random().toString(36).slice(2, 8)}`;
    const secret = boySecretCode.trim().toUpperCase() || `M${Math.floor(100 + Math.random() * 900)}`;
    const newBoy = dbService.addBoy(boyGroupId, boyName, boyEmail, boyDesc, boyWish, boyGift);
    newBoy.token = token;
    newBoy.secret_code = secret;
    if (boyAssignedGirlId) {
      dbService.assignBoyToGirl(newBoy.id, boyAssignedGirlId);
    }
    dbService.saveToStorage();
    setBoyName("");
    setBoyEmail("");
    setBoyToken("");
    setBoySecretCode("");
    setBoyDesc("");
    setBoyWish("");
    setBoyGift("");
    setBoyAssignedGirlId("");
    notify("Đã thêm bạn nam thành công!");
  }

  function handleAddGirl(e: React.FormEvent) {
    e.preventDefault();
    if (!girlName.trim() || !girlEmail.trim()) return;
    const token = girlToken.trim() || `token_${Math.random().toString(36).slice(2, 8)}`;
    const newGirl = dbService.addGirl(girlGroupId, girlName, girlEmail, token);
    if (girlAssignedBoyId) {
      dbService.assignBoyToGirl(girlAssignedBoyId, newGirl.id);
    }
    dbService.saveToStorage();
    setGirlName("");
    setGirlEmail("");
    setGirlToken("");
    setGirlAssignedBoyId("");
    notify("Đã thêm bạn nữ thành công!");
  }

  function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!qText.trim()) return;

    let options: { key: OptionKey; label: string }[];
    if (qType === "boolean") {
      options = [
        { key: "a" as OptionKey, label: optA.trim() || "Đúng (Chính xác)" },
        { key: "b" as OptionKey, label: optB.trim() || "Sai" },
      ];
    } else {
      if (!optA.trim() || !optB.trim()) return;
      options = [
        { key: "a" as OptionKey, label: optA.trim() },
        { key: "b" as OptionKey, label: optB.trim() },
        { key: "c" as OptionKey, label: optC.trim() || "Lựa chọn C" },
        { key: "d" as OptionKey, label: optD.trim() || "Lựa chọn D" },
      ];
    }

    const q = dbService.addQuestion(qGroupId, qText, options, correctKey, qClue);
    q.question_type = qType;
    dbService.saveToStorage();

    setQText("");
    setOptA("");
    setOptB("");
    setOptC("");
    setOptD("");
    setQClue("");
    notify("Đã thêm câu hỏi minigame thành công!");
  }


  function handleDownloadCSV() {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:8080";
    const csvData = dbService.exportEmailCSV(baseUrl);
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "danh_sach_email_2010_gdgoc.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify("Đã tải xuống file CSV danh sách email và token thành công!");
  }

  function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    const clean = passcodeInput.trim().toUpperCase();
    if (clean === "GDGOC2010" || clean === "GDGOC-HUST" || clean === "2010" || clean === "ADMIN") {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("admin_auth_gdgoc", "true");
      }
      setIsAuthenticated(true);
      setPasscodeError("");
    } else {
      setPasscodeError("Mã điều phối không đúng. Gợi ý: GDGOC2010");
    }
  }

  function handleAdminLogout() {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("admin_auth_gdgoc");
    }
    setIsAuthenticated(false);
    setPasscodeInput("");
  }

  if (!isAuthenticated) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-b from-[#FFF5F7] via-[#FDE8EF] to-[#F7D5DF] text-[#381A2B] flex flex-col items-center justify-center p-4 pt-24 font-sans">
        <div className="w-full max-w-[420px] rounded-3xl bg-[#FFFDFB] p-8 border border-pink-200/80 shadow-2xl text-center">
          <div className="size-16 rounded-2xl bg-pink-100/80 border border-pink-200 flex items-center justify-center text-pink-700 mx-auto mb-4 shadow-sm">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <span className="inline-block px-3 py-1 rounded-full bg-pink-50 text-pink-700 border border-pink-200 text-[11px] font-bold uppercase tracking-wider mb-2">
            Khu Vực Giới Hạn · GDGoC HUST
          </span>
          <h1 className="text-2xl font-bold font-serif text-[#431936]">
            Cổng Điều Phối 20/10
          </h1>
          <p className="text-xs text-[#826A73] mt-2 leading-relaxed">
            Nhập mã PIN điều phối (mặc định: GDGOC2010) để truy cập bảng quản lý sự kiện.
          </p>
          <form onSubmit={handleAdminLogin} className="mt-6 space-y-3">
            <input
              type="password"
              required
              placeholder="Nhập mã PIN điều phối (VD: GDGOC2010)..."
              value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value)}
              className="w-full h-12 px-4 rounded-xl bg-pink-50/50 border border-pink-200 text-[#381A2B] text-center text-sm font-mono tracking-widest focus:outline-none focus:border-pink-500"
            />
            {passcodeError && (
              <p className="text-xs text-rose-600 font-medium">{passcodeError}</p>
            )}
            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold text-xs shadow-lg shadow-pink-500/20 cursor-pointer"
            >
              Mở Khóa Bảng Điều Phối
            </button>
          </form>
          <div className="mt-4 pt-4 border-t border-pink-100 flex justify-center">
            <Link to="/boy" className="text-xs text-[#826A73] hover:text-pink-600 transition-colors">
              ← Quay về Cây Ước Nguyện
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#0F1426] text-white p-4 sm:p-8 pt-24 sm:pt-28 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <span className="text-[11px] font-bold text-pink-400 uppercase tracking-wider">
              Sự Kiện 20/10 · GDGoC HUST
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
              Bảng Điều Phối & Quản Trị
            </h1>
            <p className="text-xs text-white/60 mt-1">
              Quản lý danh sách nam/nữ, ghép nhóm, phân công và tra cứu link sự kiện gửi thủ công.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 select-none ${
                supabase.isConfigured()
                  ? "bg-emerald-500/20 border-emerald-400 text-emerald-300"
                  : "bg-white/10 border-white/20 text-white/50"
              }`}
            >
              <span className={`size-2 rounded-full inline-block ${supabase.isConfigured() ? "bg-emerald-400" : "bg-slate-400"}`} />
              <span>{supabase.isConfigured() ? "Supabase: Đã kết nối" : "Chế độ lưu cục bộ (Local)"}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                dbService.resetDatabase();
                notify("Đã khởi tạo lại dữ liệu thành công!");
              }}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white/70 transition-colors cursor-pointer"
            >
              Khởi tạo lại dữ liệu
            </button>
            <button
              type="button"
              onClick={handleAdminLogout}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-colors cursor-pointer"
            >
              Đăng xuất
            </button>
          </div>
        </div>

        {notification && (
          <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-400 text-emerald-200 text-xs font-semibold">
            {notification}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-2">
          {[
            { key: "groups", label: `Bảng Nhóm (${state.groups.length})` },
            { key: "boys", label: `Danh Sách Bạn Nam (${state.boys.length})` },
            { key: "girls", label: `Danh Sách Bạn Nữ (${state.girls.length})` },
            { key: "questions", label: `Câu Hỏi & Manh Mối (${state.questions.length})` },
            { key: "links", label: "Mã Bí Mật & Link Sự Kiện" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === tab.key
                  ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/20"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "groups" && (
          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6">
            <form onSubmit={handleAddGroup} className="p-6 rounded-3xl bg-[#1E243A] border border-white/15 space-y-4">
              <h3 className="text-base font-bold text-white border-b border-white/10 pb-3">
                Thêm Nhóm Mới (Bảng groups)
              </h3>
              <div>
                <label className="block text-[11px] font-semibold text-white/70 uppercase tracking-wider mb-1">
                  Tên nhóm (group_name) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Nhóm Sen Hồng"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-white/10 border border-white/20 text-xs text-white focus:outline-none focus:border-pink-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-white/70 uppercase tracking-wider mb-1">
                    Mã bí mật (secret_code) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: SEN20"
                    value={secretCode}
                    onChange={(e) => setSecretCode(e.target.value.toUpperCase())}
                    className="w-full h-10 px-3.5 rounded-xl bg-white/10 border border-white/20 text-xs font-mono uppercase text-white focus:outline-none focus:border-pink-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-white/70 uppercase tracking-wider mb-1">
                    Mã đăng nhập boy *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: BOY_SEN"
                    value={groupAccessCode}
                    onChange={(e) => setGroupAccessCode(e.target.value.toUpperCase())}
                    className="w-full h-10 px-3.5 rounded-xl bg-white/10 border border-white/20 text-xs font-mono uppercase text-white focus:outline-none focus:border-pink-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-white/70 uppercase tracking-wider mb-1">
                  Lời chúc chung của nhóm (wish_message)
                </label>
                <textarea
                  rows={3}
                  placeholder="Lời chúc chung gửi các bạn nữ trong nhóm..."
                  value={groupWish}
                  onChange={(e) => setGroupWish(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-xs text-white focus:outline-none focus:border-pink-400 resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full h-10 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 font-semibold text-xs shadow-md cursor-pointer"
              >
                Lưu Nhóm Mới
              </button>
            </form>

            <div className="p-6 rounded-3xl bg-[#1E243A] border border-white/15 overflow-x-auto">
              <h3 className="text-base font-bold text-white border-b border-white/10 pb-3 mb-4">
                Danh Sách Nhóm Hiện Tại
              </h3>
              <div className="space-y-3">
                {state.groups.map((grp) => (
                  <div key={grp.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-pink-300">{grp.group_name}</span>
                      <span className="text-[10px] text-white/40">{grp.id}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span>secret_code: <strong className="text-emerald-300">{grp.secret_code}</strong></span>
                      <span>group_access_code: <strong className="text-amber-300">{grp.group_access_code}</strong></span>
                    </div>
                    <p className="text-xs text-white/70 italic">"{grp.wish_message}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "boys" && (
          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6">
            <form onSubmit={handleAddBoy} className="p-6 rounded-3xl bg-[#1E243A] border border-white/15 space-y-3.5">
              <h3 className="text-base font-bold text-white border-b border-white/10 pb-3">
                Thêm Bạn Nam (Bảng boys)
              </h3>
              <div>
                <label className="block text-[11px] font-semibold text-white/70 uppercase tracking-wider mb-1">
                  Thuộc Nhóm
                </label>
                <select
                  value={boyGroupId}
                  onChange={(e) => setBoyGroupId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-white/10 border border-white/20 text-xs text-white focus:outline-none"
                >
                  {state.groups.map((g) => (
                    <option key={g.id} value={g.id} className="bg-[#1E243A] text-white">
                      {g.group_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-white/70 uppercase tracking-wider mb-1">
                    Họ & Tên
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nhập họ và tên..."
                    value={boyName}
                    onChange={(e) => setBoyName(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-white/10 border border-white/20 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-white/70 uppercase tracking-wider mb-1">
                    Email nhận mã
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="email@hust.edu.vn"
                    value={boyEmail}
                    onChange={(e) => setBoyEmail(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-white/10 border border-white/20 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-white/70 uppercase tracking-wider mb-1">
                  Đặc điểm nhận diện (description để bạn nữ tìm) *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="VD: Đeo kính cận, mặc áo hoodie xám, hay ngồi bàn 3 thư viện Tạ Quang Bửu..."
                  value={boyDesc}
                  onChange={(e) => setBoyDesc(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-xs text-white focus:outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-white/70 uppercase tracking-wider mb-1">
                  Lời chúc riêng (personal_wish)
                </label>
                <textarea
                  rows={2}
                  placeholder="Lời chúc riêng gửi tặng bạn nữ..."
                  value={boyWish}
                  onChange={(e) => setBoyWish(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-xs text-white focus:outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-white/70 uppercase tracking-wider mb-1">
                  Món quà nhỏ đính kèm
                </label>
                <input
                  type="text"
                  placeholder="VD: Bookmark handmade, ly giữ nhiệt..."
                  value={boyGift}
                  onChange={(e) => setBoyGift(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-white/10 border border-white/20 text-xs text-white focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full h-10 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 font-semibold text-xs shadow-md cursor-pointer"
              >
                Lưu Bạn Nam
              </button>
            </form>

            <div className="p-6 rounded-3xl bg-[#1E243A] border border-white/15 overflow-x-auto">
              <h3 className="text-base font-bold text-white border-b border-white/10 pb-3 mb-4">
                Danh Sách Bạn Nam ({state.boys.length})
              </h3>
              <div className="space-y-3">
                {state.boys.map((boy) => {
                  const grp = state.groups.find((g) => g.id === boy.group_id);
                  return (
                    <div key={boy.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{boy.name}</span>
                        <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-[10px]">
                          {grp?.group_name || "Chưa phân nhóm"}
                        </span>
                      </div>
                      <p className="text-white/60">{boy.email}</p>
                      <p className="text-amber-200/90"><strong className="text-amber-400">Manh mối:</strong> {boy.description}</p>
                      {boy.personal_wish && <p className="text-white/80 italic">"{boy.personal_wish}"</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === "girls" && (
          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6">
            <form onSubmit={handleAddGirl} className="p-6 rounded-3xl bg-[#1E243A] border border-white/15 space-y-4">
              <h3 className="text-base font-bold text-white border-b border-white/10 pb-3">
                Thêm Bạn Nữ (Bảng girls)
              </h3>
              <div>
                <label className="block text-[11px] font-semibold text-white/70 uppercase tracking-wider mb-1">
                  Thuộc Nhóm
                </label>
                <select
                  value={girlGroupId}
                  onChange={(e) => setGirlGroupId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-white/10 border border-white/20 text-xs text-white focus:outline-none"
                >
                  {state.groups.map((g) => (
                    <option key={g.id} value={g.id} className="bg-[#1E243A] text-white">
                      {g.group_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-white/70 uppercase tracking-wider mb-1">
                  Họ & Tên Bạn Nữ *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nhập họ và tên..."
                  value={girlName}
                  onChange={(e) => setGirlName(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-white/10 border border-white/20 text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-white/70 uppercase tracking-wider mb-1">
                  Email Gửi Link Chơi
                </label>
                <input
                  type="email"
                  required
                  placeholder="email@hust.edu.vn"
                  value={girlEmail}
                  onChange={(e) => setGirlEmail(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-white/10 border border-white/20 text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-white/70 uppercase tracking-wider mb-1">
                  Token riêng (/play?token=...)
                </label>
                <input
                  type="text"
                  placeholder="Để trống sẽ tự sinh mã ngẫu nhiên"
                  value={girlToken}
                  onChange={(e) => setGirlToken(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-white/10 border border-white/20 text-xs font-mono text-white focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full h-10 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 font-semibold text-xs shadow-md cursor-pointer"
              >
                Lưu Bạn Nữ
              </button>
            </form>

            <div className="p-6 rounded-3xl bg-[#1E243A] border border-white/15 overflow-x-auto">
              <h3 className="text-base font-bold text-white border-b border-white/10 pb-3 mb-4">
                Theo Dõi Tiến Độ Bạn Nữ ({state.girls.length})
              </h3>
              <div className="space-y-3">
                {state.girls.map((girl) => {
                  const grp = state.groups.find((g) => g.id === girl.group_id);
                  const isDone = girl.stage === "completed";
                  return (
                    <div key={girl.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{girl.name}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isDone ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                        }`}>
                          {isDone ? "Đã hoàn thành minigame" : `Đang làm câu ${girl.current_question_index + 1}`}
                        </span>
                      </div>
                      <p className="text-white/60">{girl.email} · Nhóm: {grp?.group_name}</p>
                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        <span className="text-pink-300 font-mono">Link: /play?token={girl.token}</span>
                        <a
                          href={`/play?token=${girl.token}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-pink-400 hover:underline"
                        >
                          Mở lượt chơi →
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === "questions" && (
          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6">
            <form onSubmit={handleAddQuestion} className="p-6 rounded-3xl bg-[#1E243A] border border-white/15 space-y-3.5">
              <h3 className="text-base font-bold text-white border-b border-white/10 pb-3">
                Soạn Câu Hỏi (Bảng questions)
              </h3>
              <div>
                <label className="block text-[11px] font-semibold text-white/70 uppercase tracking-wider mb-1">
                  Áp dụng cho Nhóm
                </label>
                <select
                  value={qGroupId}
                  onChange={(e) => setQGroupId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-white/10 border border-white/20 text-xs text-white focus:outline-none"
                >
                  {state.groups.map((g) => (
                    <option key={g.id} value={g.id} className="bg-[#1E243A] text-white">
                      {g.group_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-white/70 uppercase tracking-wider mb-1">
                  Loại câu hỏi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setQType("multiple_choice");
                      setOptA("");
                      setOptB("");
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      qType === "multiple_choice"
                        ? "bg-pink-500/20 border-pink-400 text-pink-300"
                        : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    Trắc nghiệm (4 đáp án)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQType("boolean");
                      setOptA("Đúng");
                      setOptB("Sai");
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      qType === "boolean"
                        ? "bg-pink-500/20 border-pink-400 text-pink-300"
                        : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    Đúng / Sai
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-white/70 uppercase tracking-wider mb-1">
                  Nội dung câu hỏi *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Nhập nội dung câu hỏi về bạn nam hoặc CLB..."
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-xs text-white focus:outline-none resize-none"
                />
              </div>

              {qType === "boolean" ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-emerald-300">
                    A. Đúng
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-rose-300">
                    B. Sai
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <input
                    type="text"
                    required
                    placeholder="Đáp án A"
                    value={optA}
                    onChange={(e) => setOptA(e.target.value)}
                    className="h-9 px-3 rounded-xl bg-white/10 border border-white/20 text-white"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Đáp án B"
                    value={optB}
                    onChange={(e) => setOptB(e.target.value)}
                    className="h-9 px-3 rounded-xl bg-white/10 border border-white/20 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Đáp án C"
                    value={optC}
                    onChange={(e) => setOptC(e.target.value)}
                    className="h-9 px-3 rounded-xl bg-white/10 border border-white/20 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Đáp án D"
                    value={optD}
                    onChange={(e) => setOptD(e.target.value)}
                    className="h-9 px-3 rounded-xl bg-white/10 border border-white/20 text-white"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-[11px] font-semibold text-white/70 uppercase tracking-wider mb-1">
                    Đáp án đúng
                  </label>
                  <select
                    value={correctKey}
                    onChange={(e) => setCorrectKey(e.target.value as OptionKey)}
                    className="w-full h-9 px-3 rounded-xl bg-white/10 border border-white/20 text-xs text-white"
                  >
                    <option value="a" className="bg-[#1E243A]">A{qType === "boolean" ? " (Đúng)" : ""}</option>
                    <option value="b" className="bg-[#1E243A]">B{qType === "boolean" ? " (Sai)" : ""}</option>
                    {qType === "multiple_choice" && (
                      <>
                        <option value="c" className="bg-[#1E243A]">C</option>
                        <option value="d" className="bg-[#1E243A]">D</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-white/70 uppercase tracking-wider mb-1">
                  Manh mối nhận diện khi trả lời xong
                </label>
                <textarea
                  rows={2}
                  placeholder="Manh mối để bạn nữ đi tìm bạn nam..."
                  value={qClue}
                  onChange={(e) => setQClue(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-xs text-white focus:outline-none resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full h-10 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 font-semibold text-xs shadow-md cursor-pointer"
              >
                Lưu Câu Hỏi
              </button>
            </form>

            <div className="p-6 rounded-3xl bg-[#1E243A] border border-white/15 overflow-x-auto">
              <h3 className="text-base font-bold text-white border-b border-white/10 pb-3 mb-4">
                Danh Sách Câu Hỏi ({state.questions.length})
              </h3>
              <div className="space-y-3">
                {state.questions.map((q, idx) => (
                  <div key={q.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-pink-300">Câu {idx + 1}</span>
                        <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white/70">
                          {q.question_type === "boolean" ? "Đúng/Sai" : "1 trong 4"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-emerald-300 font-mono">
                          Đáp án đúng: {q.correct_key.toUpperCase()}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            dbService.deleteQuestion(q.id);
                            notify("Đã xóa câu hỏi thành công!");
                          }}
                          className="text-rose-400 hover:text-rose-300 text-[11px] transition-colors cursor-pointer"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                    <p className="font-medium text-white">{q.text}</p>
                    <div className="grid grid-cols-2 gap-1 text-white/70 text-[11px]">
                      {q.options.map((opt) => (
                        <span key={opt.key}>{opt.key.toUpperCase()}. {opt.label}</span>
                      ))}
                    </div>
                    <p className="text-amber-200 text-[11px] pt-1">
                      <strong>Manh mối:</strong> {q.clue}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "links" && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-[#1E243A] border border-white/15">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Mã Bí Mật & Liên Kết Gửi Thủ Công
                  </h3>
                  <p className="text-xs text-white/60 mt-0.5">
                    Tra cứu và sao chép link/mã riêng để gửi thiệp hoặc nhắn tin thủ công cho người tham gia.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadCSV}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-xs shadow-lg shadow-pink-500/25 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  Tải File CSV Gửi Thủ Công
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {state.groups.map((grp) => {
                  const boysInGroup = state.boys.filter((b) => b.group_id === grp.id);
                  const girlsInGroup = state.girls.filter((g) => g.group_id === grp.id);
                  return (
                    <div
                      key={grp.id}
                      className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-pink-300">{grp.group_name}</h4>
                        <Link
                          to="/boy"
                          search={{ group: grp.id }}
                          className="px-3 py-1 rounded-full bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-400/30 text-[11px] font-semibold transition-colors no-underline"
                        >
                          Mở Cây Nhóm Này →
                        </Link>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-black/30 border border-white/10">
                          <span className="text-[10px] text-white/50 block">Mã đăng nhập bạn nam:</span>
                          <code className="text-pink-400 font-bold font-mono text-sm">{grp.group_access_code}</code>
                        </div>
                        <div className="p-2.5 rounded-xl bg-black/30 border border-white/10">
                          <span className="text-[10px] text-white/50 block">Mã bí mật mở quà bạn nữ:</span>
                          <code className="text-emerald-400 font-bold font-mono text-sm">{grp.secret_code}</code>
                        </div>
                      </div>

                      <div className="text-[11px] text-white/60 flex items-center justify-between pt-1 border-t border-white/5">
                        <span>{boysInGroup.length} bạn nam gửi quà</span>
                        <span>{girlsInGroup.length} bạn nữ nhận quà</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Girls Links Table */}
            <div className="p-6 rounded-3xl bg-[#1E243A] border border-white/15">
              <h3 className="text-base font-bold text-white border-b border-white/10 pb-3 mb-4 flex items-center justify-between">
                <span>1. Liên Kết Dành Cho Bạn Nữ ({state.girls.length})</span>
                <span className="text-xs font-normal text-white/50">Link minigame giải đố</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-white/50">
                      <th className="pb-3 font-semibold">Bạn Nữ</th>
                      <th className="pb-3 font-semibold">Email</th>
                      <th className="pb-3 font-semibold">Bạn Nam Phụ Trách</th>
                      <th className="pb-3 font-semibold">Trạng Thái</th>
                      <th className="pb-3 font-semibold text-right">Link Minigame</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {state.girls.map((girl) => {
                      const origin = typeof window !== "undefined" ? window.location.origin : "";
                      const playLink = `${origin}/play?token=${girl.token}`;
                      return (
                        <tr key={girl.id} className="hover:bg-white/5">
                          <td className="py-3 font-medium text-white">{girl.name}</td>
                          <td className="py-3 text-white/60 font-mono text-[11px]">{girl.email}</td>
                          <td className="py-3 text-pink-300 font-medium">{girl.assigned_boy_name || "Chưa gán"}</td>
                          <td className="py-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                girl.stage === "completed"
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : girl.stage === "quiz"
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  : "bg-white/10 text-white/60"
                              }`}
                            >
                              {girl.stage === "completed"
                                ? "Đã làm xong"
                                : girl.stage === "quiz"
                                ? "Đang trả lời"
                                : "Chưa bắt đầu"}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                if (typeof navigator !== "undefined" && navigator.clipboard) {
                                  navigator.clipboard.writeText(playLink);
                                  notify(`Đã sao chép link của ${girl.name}!`);
                                }
                              }}
                              className="px-3 py-1 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold text-[11px] shadow-sm hover:opacity-95 transition-all cursor-pointer"
                            >
                              Sao Chép Link
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Boys Links Table */}
            <div className="p-6 rounded-3xl bg-[#1E243A] border border-white/15">
              <h3 className="text-base font-bold text-white border-b border-white/10 pb-3 mb-4 flex items-center justify-between">
                <span>2. Liên Kết Dành Cho Bạn Nam ({state.boys.length})</span>
                <span className="text-xs font-normal text-white/50">Mã bí mật & link viết lời chúc</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-white/50">
                      <th className="pb-3 font-semibold">Bạn Nam</th>
                      <th className="pb-3 font-semibold">Email</th>
                      <th className="pb-3 font-semibold">Bạn Nữ Phụ Trách</th>
                      <th className="pb-3 font-semibold">Mã Bí Mật (Secret Code)</th>
                      <th className="pb-3 font-semibold text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {state.boys.map((boy) => {
                      const origin = typeof window !== "undefined" ? window.location.origin : "";
                      const boyLink = `${origin}/boy?token=${boy.token || boy.id}`;
                      return (
                        <tr key={boy.id} className="hover:bg-white/5">
                          <td className="py-3 font-medium text-white">{boy.name}</td>
                          <td className="py-3 text-white/60 font-mono text-[11px]">{boy.email}</td>
                          <td className="py-3 text-pink-300 font-medium">{boy.assigned_girl_name || "Chưa gán"}</td>
                          <td className="py-3">
                            <code className="px-2 py-0.5 rounded-md bg-white/10 text-emerald-300 font-bold font-mono text-xs">
                              {boy.secret_code || "Chưa đặt"}
                            </code>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                if (typeof navigator !== "undefined" && navigator.clipboard) {
                                  navigator.clipboard.writeText(`Link: ${boyLink}\nMã bí mật: ${boy.secret_code || "N/A"}`);
                                  notify(`Đã sao chép link và mã của ${boy.name}!`);
                                }
                              }}
                              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-[11px] border border-white/20 transition-all cursor-pointer"
                            >
                              Sao Chép Link & Mã
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
