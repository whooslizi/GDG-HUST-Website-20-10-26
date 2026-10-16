import { useState, useEffect, useCallback } from "react";
import { useRouterState } from "@tanstack/react-router";
import { dbService } from "@/services/app-database";
import { ViralTree2010 } from "@/features/wish-garden/components/ViralTree2010";
import { SecretCodeModal } from "@/features/wish-garden/components/SecretCodeModal";
import { WishLetterRevealModal } from "@/features/wish-garden/components/WishLetterRevealModal";
import { GirlAccountModal } from "@/features/wish-garden/components/GirlAccountModal";
import type { Boy, Girl, Group, OrnamentType } from "@/types/database";

const ORNAMENT_LIST: { type: OrnamentType; label: string; icon: string; desc: string; color: string }[] = [
  { type: "lotus", label: "Hoa Sen", icon: "🪷", desc: "Thanh khiết & Dịu dàng", color: "from-pink-500/20 to-rose-500/20 border-pink-400" },
  { type: "peach", label: "Hoa Đào", icon: "🌸", desc: "Rạng rỡ & May mắn", color: "from-rose-500/20 to-orange-500/20 border-rose-400" },
  { type: "giftbox", label: "Hộp Quà", icon: "🎁", desc: "Bất ngờ & Chu đáo", color: "from-amber-500/20 to-pink-500/20 border-amber-400" },
  { type: "snowglobe", label: "Cầu Tuyết", icon: "🔮", desc: "Mộng mơ & Lấp lánh", color: "from-purple-500/20 to-indigo-500/20 border-purple-400" },
  { type: "teddy", label: "Gấu Bông", icon: "🧸", desc: "Ấm áp & Ngọt ngào", color: "from-yellow-500/20 to-amber-500/20 border-yellow-400" },
];

export function BoyWishPage() {
  const router = useRouterState();
  const searchParams = new URLSearchParams(router.location.search);
  const queryToken = searchParams.get("token") || undefined;
  const queryGroup = searchParams.get("group") || undefined;
  const queryView = searchParams.get("view") || "";

  // Determine initial tab:
  // If explicitly view=tree or if queryToken belongs to a girl, show tree
  // Otherwise, default to "compose" for boys
  const [activeTab, setActiveTab] = useState<"compose" | "tree">(() => {
    if (queryView === "tree") return "tree";
    if (queryToken && dbService.getGirlByToken(queryToken)) return "tree";
    return "compose";
  });

  const [activeToken, setActiveToken] = useState<string | undefined>(() => {
    if (queryToken) return queryToken;
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem("active_girl_token") || undefined;
    }
    return undefined;
  });

  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(queryGroup);
  const [treeData, setTreeData] = useState(() => dbService.getTreeData(activeToken, queryGroup));
  const [selectedBoy, setSelectedBoy] = useState<Boy | null>(null);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isGirlAccountModalOpen, setIsGirlAccountModalOpen] = useState(false);
  const [notification, setNotification] = useState("");

  // Boy composer form state
  const detectedBoy = queryToken ? dbService.getBoyByToken(queryToken) : null;
  const [boyName, setBoyName] = useState(detectedBoy?.name || "");
  const [assignedGirlName, setAssignedGirlName] = useState(detectedBoy?.assigned_girl_name || "");
  const [secretCode, setSecretCode] = useState(detectedBoy?.secret_code || "");
  const [personalWish, setPersonalWish] = useState(detectedBoy?.personal_wish || "");
  const [giftHint, setGiftHint] = useState(detectedBoy?.gift_hint || "");
  const [ornamentType, setOrnamentType] = useState<OrnamentType>(detectedBoy?.ornament_type || "lotus");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [confirmedData, setConfirmedData] = useState<{
    boyName: string;
    secretCode: string;
    ornamentType: OrnamentType;
    wish: string;
    assignedGirlName?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Subscribe to real-time changes
  const refreshTree = useCallback(() => {
    setTreeData(dbService.getTreeData(activeToken, selectedGroupId));
  }, [activeToken, selectedGroupId]);

  useEffect(() => {
    const unsubscribe = dbService.subscribe(() => {
      refreshTree();
    });
    return unsubscribe;
  }, [refreshTree]);

  useEffect(() => {
    if (queryToken) {
      setActiveToken(queryToken);
      const b = dbService.getBoyByToken(queryToken);
      if (b) {
        setBoyName(b.name);
        setSecretCode(b.secret_code || "");
        setPersonalWish(b.personal_wish || "");
        if (b.ornament_type) setOrnamentType(b.ornament_type);
        if (b.assigned_girl_name) setAssignedGirlName(b.assigned_girl_name);
        if (b.gift_hint) setGiftHint(b.gift_hint);
      }
    }
  }, [queryToken]);

  function generateRandomCode() {
    const prefixes = ["GDG", "HUST", "HOA", "WISH", "LOVE", "SUN", "BLOOM"];
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    setSecretCode(`${prefix}${randomNum}`);
    setFormError("");
  }

  async function handleSubmitWish(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!boyName.trim()) {
      setFormError("Vui lòng nhập tên của bạn nhé!");
      return;
    }
    if (!secretCode.trim()) {
      setFormError("Vui lòng đặt mã bí mật để bạn nữ mở quà trên cây!");
      return;
    }
    if (!personalWish.trim()) {
      setFormError("Vui lòng nhập lời chúc 20/10 gửi tặng bạn nữ!");
      return;
    }

    setIsSubmitting(true);
    const cleanSecret = secretCode.trim().toUpperCase();

    try {
      const res = await dbService.submitBoyWishAsync(
        "GDGOC2010",
        boyName.trim(),
        cleanSecret,
        personalWish.trim(),
        ornamentType,
        assignedGirlName.trim(),
        giftHint.trim()
      );

      if (!res.success) {
        setFormError(res.message || "Không thể lưu lời chúc. Bạn thử lại nhé!");
        setIsSubmitting(false);
        return;
      }

      // Also trigger cloud sync immediately
      if (dbService.isUsingSupabase()) {
        await dbService.syncFromSupabase();
      }

      refreshTree();
      setConfirmedData({
        boyName: boyName.trim(),
        secretCode: cleanSecret,
        ornamentType,
        wish: personalWish.trim(),
        assignedGirlName: assignedGirlName.trim() || undefined,
      });

      setNotification(`Đã treo lời chúc của bạn ${boyName.trim()} lên Cây Ước Nguyện thành công!`);
      setTimeout(() => setNotification(""), 4500);
    } catch (err: any) {
      setFormError(err.message || "Đã xảy ra lỗi khi lưu lời chúc.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCopyCode() {
    if (confirmedData?.secretCode && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(confirmedData.secretCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  function handleUnlockSuccess(group: Group, _boys: Boy[], unlockedBoy?: Boy) {
    refreshTree();
    if (unlockedBoy) {
      setSelectedBoy(unlockedBoy);
      setNotification(`Mã chính xác! Đã mở thư của bạn ${unlockedBoy.name}!`);
    } else {
      setNotification(`Toàn bộ quà từ ${group.group_name} đã được mở thành công trên cây!`);
    }
    setTimeout(() => setNotification(""), 4500);
  }

  function handleGirlRegistered(girl: Girl) {
    setActiveToken(girl.token);
    setSelectedGroupId(girl.group_id);
    setActiveTab("tree");
    setNotification(`Chào mừng bạn ${girl.name} đến với Cây Lời Chúc 20/10!`);
    setTimeout(() => setNotification(""), 4500);
  }

  async function handleDirectUnlock(code: string): Promise<boolean> {
    const clean = code.trim().toUpperCase();
    if (!clean) return false;
    const res = await dbService.verifySecretCodeAsync(clean, activeToken);
    if (res.success) {
      refreshTree();
      if (res.unlockedBoy) {
        setNotification(`Mã chính xác! Đã mở thư của bạn ${res.unlockedBoy.name}!`);
        setSelectedBoy(res.unlockedBoy);
      } else if (res.group) {
        handleUnlockSuccess(res.group, res.boys || []);
      }
      setTimeout(() => setNotification(""), 4500);
      return true;
    } else {
      setNotification("Mã chưa chính xác. Bạn kiểm tra lại giúp mình nhé!");
      setTimeout(() => setNotification(""), 3500);
      return false;
    }
  }

  const selectedOrnamentItem = ORNAMENT_LIST.find((o) => o.type === (confirmedData?.ornamentType || ornamentType));
  const totalWishes = treeData.boys.filter((b) => b.has_written_wish || b.personal_wish).length;

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-[#FAF7F2] via-[#F8ECEF] to-[#F1DEE3] text-[#2C1820] flex flex-col items-center">
      {/* Toast notification */}
      {notification && (
        <div className="fixed top-20 z-50 px-5 py-2.5 rounded-full bg-[#E06D88] text-white text-xs font-semibold shadow-xl animate-bounce">
          {notification}
        </div>
      )}

      {/* Top Header & Switcher */}
      <header className="w-full max-w-4xl mx-auto px-4 pt-20 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4 z-30">
        <div className="text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100/90 text-pink-700 text-[11px] font-bold uppercase tracking-wider mb-1">
            <span>🌸</span>
            <span>GDGoC HUST · 20/10 Bloom With Us</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-[#431936]">
            Cây Ước Nguyện & Lời Chúc 20/10
          </h1>
          <p className="text-xs text-[#826A73]">
            {totalWishes > 0 ? `${totalWishes} món quà và lời chúc trên cây` : "Chưa có lời chúc nào trên cây"}
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center p-1 rounded-2xl bg-white/80 backdrop-blur-md border border-pink-200/80 shadow-md">
          <button
            type="button"
            onClick={() => setActiveTab("compose")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "compose"
                ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/20"
                : "text-slate-600 hover:text-pink-600"
            }`}
          >
            <span>Soạn Thư & Treo Quà</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tree")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "tree"
                ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/20"
                : "text-slate-600 hover:text-pink-600"
            }`}
          >
            <span>Xem Cây Ước Nguyện</span>
            {totalWishes > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === "tree" ? "bg-white/20 text-white" : "bg-pink-100 text-pink-700"
              }`}>
                {totalWishes}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="w-full flex-1 flex flex-col items-center">
        {activeTab === "compose" ? (
          <section className="w-full max-w-xl mx-auto px-4 py-4 mb-16 animate-fade-in">
            {confirmedData ? (
              /* Success / Voucher State */
              <div className="rounded-3xl bg-white/95 backdrop-blur-md border border-pink-200 p-6 sm:p-8 shadow-2xl text-center space-y-5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 border border-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <span>✓</span> Đã Treo Lời Chúc Lên Cây!
                </span>

                <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#431936]">
                  Thẻ Xác Nhận Mã Bí Mật
                </h2>
                <p className="text-xs text-[#826A73] max-w-md mx-auto leading-relaxed">
                  Gửi mã này cho bạn nữ để mở thư trên cây.
                </p>

                {/* Printable / Screenshot Voucher */}
                <div className="p-6 rounded-3xl bg-gradient-to-b from-[#FFFDF9] via-[#FAF6F0] to-[#FDF0F3] border-2 border-dashed border-[#E06D88] shadow-lg text-left relative overflow-hidden">
                  <div className="absolute top-4 right-4 flex flex-col items-center justify-center size-12 rounded-xl bg-pink-100 border border-pink-300 text-pink-700 shadow-sm">
                    <span className="text-base font-bold font-serif">20/10</span>
                    <span className="text-[7px] uppercase font-mono font-bold tracking-tighter">GDGoC</span>
                  </div>

                  <div className="pr-14">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#E06D88]">
                      GDGoC HUST · Thư Ước Nguyện 20/10
                    </span>
                    <h3 className="text-lg font-bold font-serif text-[#431936] mt-0.5">
                      Món Quà Từ: {confirmedData.boyName}
                    </h3>
                    {confirmedData.assignedGirlName && (
                      <p className="text-xs text-pink-600 font-semibold mt-0.5">
                        Gửi tặng: {confirmedData.assignedGirlName}
                      </p>
                    )}
                  </div>

                  <div className="my-4 p-4 rounded-2xl bg-white border-2 border-pink-300 shadow-inner text-center">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-pink-700 mb-1">
                      Mã Bí Mật Mở Quà (Secret Code)
                    </span>
                    <div className="text-2xl sm:text-3xl font-mono font-extrabold text-[#E06D88] tracking-widest select-all">
                      {confirmedData.secretCode}
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{selectedOrnamentItem?.icon}</span>
                      <span>
                        <strong>Vật phẩm trên cây:</strong> {selectedOrnamentItem?.label} ({selectedOrnamentItem?.desc})
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-pink-50/70 border border-pink-100 italic text-xs leading-relaxed text-[#431936]">
                      "{confirmedData.wish}"
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-pink-200 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Bloom With Us 20/10</span>
                    <span className="font-semibold text-pink-700">Gửi mã này cho bạn nữ</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="w-full sm:w-1/2 h-11 rounded-2xl bg-white border border-pink-200 hover:bg-pink-50 text-pink-700 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <span>{copied ? "Đã sao chép!" : "Sao chép mã"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("tree")}
                    className="w-full sm:w-1/2 h-11 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-pink-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Xem Trên Cây Ước Nguyện</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setConfirmedData(null);
                    setPersonalWish("");
                    setSecretCode("");
                    setFormError("");
                  }}
                  className="text-xs text-slate-500 hover:text-pink-600 transition-colors pt-2 cursor-pointer"
                >
                  Treo thêm một lời chúc khác
                </button>
              </div>
            ) : (
              /* Boy Wish Form */
              <div className="rounded-3xl bg-white/95 backdrop-blur-md border border-pink-200/90 p-6 sm:p-8 shadow-xl">
                <div className="border-b border-pink-100 pb-4 mb-5">
                  <h2 className="text-lg sm:text-xl font-bold font-serif text-[#431936] flex items-center gap-2">
                    <span>Treo Lời Chúc & Tạo Mã Bí Mật</span>
                  </h2>
                  <p className="text-xs text-[#826A73] mt-1">
                    Điền thông tin và lời chúc gửi tặng các bạn nữ.
                  </p>
                </div>

                {formError && (
                  <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
                    <span>{formError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmitWish} className="space-y-4">
                  {/* Boy Name */}
                  <div>
                    <label className="block text-xs font-bold text-[#431936] mb-1.5">
                      Họ và tên của bạn (Bạn Nam) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nhập họ và tên..."
                      value={boyName}
                      onChange={(e) => setBoyName(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-2xl bg-pink-50/40 border border-pink-200 focus:border-pink-500 focus:bg-white focus:outline-none text-xs text-[#2C1820] font-medium transition-all"
                    />
                  </div>

                  {/* Assigned Girl Name (Optional) */}
                  <div>
                    <label className="block text-xs font-bold text-[#431936] mb-1.5 flex items-center justify-between">
                      <span>Bạn nữ nhận lời chúc (Tùy chọn)</span>
                      <span className="text-[10px] text-slate-400 font-normal">Có thể để trống gửi tất cả</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Nhập tên người nhận (để trống nếu gửi chung)..."
                      value={assignedGirlName}
                      onChange={(e) => setAssignedGirlName(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-2xl bg-pink-50/40 border border-pink-200 focus:border-pink-500 focus:bg-white focus:outline-none text-xs text-[#2C1820] font-medium transition-all"
                    />
                  </div>

                  {/* Ornament Picker */}
                  <div>
                    <label className="block text-xs font-bold text-[#431936] mb-1.5">
                      Chọn vật phẩm treo lên cây <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {ORNAMENT_LIST.map((item) => {
                        const isSelected = ornamentType === item.type;
                        return (
                          <button
                            key={item.type}
                            type="button"
                            onClick={() => setOrnamentType(item.type)}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? "bg-gradient-to-br from-pink-50 to-rose-50 border-pink-500 shadow-md ring-2 ring-pink-400/40"
                                : "bg-white/60 border-slate-200 hover:border-pink-300 hover:bg-pink-50/20"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-2xl">{item.icon}</span>
                              {isSelected && <span className="text-xs text-pink-600 font-bold">✓</span>}
                            </div>
                            <div className="mt-2">
                              <div className="text-xs font-bold text-[#431936]">{item.label}</div>
                              <div className="text-[10px] text-slate-500 line-clamp-1">{item.desc}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Secret Code Input */}
                  <div>
                    <label className="block text-xs font-bold text-[#431936] mb-1.5 flex items-center justify-between">
                      <span>Mã Bí Mật (Secret Code) <span className="text-rose-500">*</span></span>
                      <button
                        type="button"
                        onClick={generateRandomCode}
                        className="text-[11px] text-pink-600 hover:text-pink-700 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span>Tạo mã tự động</span>
                      </button>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="Nhập mã bí mật..."
                        value={secretCode}
                        onChange={(e) => setSecretCode(e.target.value.toUpperCase())}
                        className="w-full h-11 px-3.5 rounded-2xl bg-pink-50/40 border border-pink-200 focus:border-pink-500 focus:bg-white focus:outline-none font-mono text-sm tracking-widest text-[#D84D74] font-bold uppercase transition-all"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 italic">
                      Mã này bạn sẽ gửi hoặc đọc cho bạn nữ để bạn ấy mở thư.
                    </p>
                  </div>

                  {/* Clue / Gift Hint (Optional) */}
                  <div>
                    <label className="block text-xs font-bold text-[#431936] mb-1.5 flex items-center justify-between">
                      <span>Gợi ý tìm bạn / Món quà (Tùy chọn)</span>
                      <span className="text-[10px] text-slate-400 font-normal">Gợi ý cho bạn nữ</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Nhập gợi ý nhận diện hoặc vị trí gặp mặt..."
                      value={giftHint}
                      onChange={(e) => setGiftHint(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-2xl bg-pink-50/40 border border-pink-200 focus:border-pink-500 focus:bg-white focus:outline-none text-xs text-[#2C1820] font-medium transition-all"
                    />
                  </div>

                  {/* Personal Wish Letter */}
                  <div>
                    <label className="block text-xs font-bold text-[#431936] mb-1.5 flex items-center justify-between">
                      <span>Lời chúc 20/10 gửi bạn nữ <span className="text-rose-500">*</span></span>
                      <span className="text-[10px] text-slate-400">{personalWish.length} ký tự</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Nhập lời chúc 20/10 gửi tặng bạn nữ..."
                      value={personalWish}
                      onChange={(e) => setPersonalWish(e.target.value)}
                      className="w-full p-3.5 rounded-2xl bg-pink-50/40 border border-pink-200 focus:border-pink-500 focus:bg-white focus:outline-none text-xs text-[#2C1820] leading-relaxed transition-all resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-12 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-pink-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="animate-spin text-sm inline-block">●</span>
                          <span>Đang lưu...</span>
                        </>
                      ) : (
                        <>
                          <span>🌸</span>
                          <span>Treo Lời Chúc Lên Cây Ước Nguyện</span>
                          <span>→</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </section>
        ) : (
          /* Tree View */
          <section className="w-full flex-1 flex flex-col items-center animate-fade-in">
            <ViralTree2010
              treeTitle={treeData.group?.group_name || "GDGoC HUST"}
              recipientName={treeData.girl?.name}
              boys={treeData.boys}
              isUnlocked={treeData.isUnlocked}
              isBoyUnlocked={treeData.isBoyUnlocked}
              onSelectBoy={(boy) => setSelectedBoy(boy)}
              onOpenSecretCodeModal={() => setIsCodeModalOpen(true)}
              onOpenBoyLoginModal={() => setActiveTab("compose")}
              onOpenGirlAccountModal={() => setIsGirlAccountModalOpen(true)}
              onDirectUnlockCode={handleDirectUnlock}
            />
          </section>
        )}
      </div>

      {/* Secret Code Modal for girls unlocking gifts */}
      <SecretCodeModal
        isOpen={isCodeModalOpen}
        girlToken={activeToken}
        onClose={() => setIsCodeModalOpen(false)}
        onSuccessUnlock={handleUnlockSuccess}
      />

      {/* Wish Letter Reveal Modal when clicking an ornament */}
      <WishLetterRevealModal
        boy={selectedBoy}
        isUnlocked={Boolean(
          selectedBoy &&
          treeData.isBoyUnlocked &&
          treeData.isBoyUnlocked(selectedBoy)
        )}
        onClose={() => setSelectedBoy(null)}
        onOpenCodeInput={() => setIsCodeModalOpen(true)}
        onDirectUnlockCode={handleDirectUnlock}
      />

      {/* Girl Account Modal */}
      <GirlAccountModal
        isOpen={isGirlAccountModalOpen}
        onClose={() => setIsGirlAccountModalOpen(false)}
        onRegistered={handleGirlRegistered}
      />
    </div>
  );
}
