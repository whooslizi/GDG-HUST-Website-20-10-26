import { useEffect, useState, useCallback } from "react";
import { useRouterState } from "@tanstack/react-router";
import { ViralTree2010 } from "@/features/wish-garden/components/ViralTree2010";
import { BoyWishComposerModal } from "@/features/wish-garden/components/BoyWishComposerModal";
import { SecretCodeModal } from "@/features/wish-garden/components/SecretCodeModal";
import { WishLetterRevealModal } from "@/features/wish-garden/components/WishLetterRevealModal";
import { GirlAccountModal } from "@/features/wish-garden/components/GirlAccountModal";
import { dbService, type AppDatabaseService } from "@/services/app-database";
import type { Boy, Girl, Group } from "@/types/database";

export function WishGarden({ customDb }: { customDb?: AppDatabaseService }) {
  const activeDb = customDb || dbService;
  const router = useRouterState();
  const searchParams = new URLSearchParams(router.location.search);
  const queryToken = searchParams.get("token") || undefined;
  const queryGroup = searchParams.get("group") || undefined;

  const [activeToken, setActiveToken] = useState<string | undefined>(() => {
    if (queryToken) return queryToken;
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem("active_girl_token") || undefined;
    }
    return undefined;
  });

  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(queryGroup);
  const detectedBoy = queryToken ? activeDb.getBoyByToken(queryToken) : null;
  const [treeData, setTreeData] = useState(() => activeDb.getTreeData(activeToken, queryGroup));
  const [selectedBoy, setSelectedBoy] = useState<Boy | null>(null);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isBoyLoginModalOpen, setIsBoyLoginModalOpen] = useState(() => {
    return searchParams.get("boy") === "true" || searchParams.get("composer") === "true";
  });
  const [isGirlAccountModalOpen, setIsGirlAccountModalOpen] = useState(false);
  const [notification, setNotification] = useState("");

  const refreshTree = useCallback(() => {
    setTreeData(activeDb.getTreeData(activeToken, selectedGroupId));
  }, [activeDb, activeToken, selectedGroupId]);

  useEffect(() => {
    if (queryToken) {
      setActiveToken(queryToken);
    }
  }, [queryToken]);

  useEffect(() => {
    if (queryGroup) {
      setSelectedGroupId(queryGroup);
    }
  }, [queryGroup]);

  useEffect(() => {
    refreshTree();
    const unsubscribe = activeDb.subscribe(() => {
      refreshTree();
    });
    return unsubscribe;
  }, [refreshTree, activeDb]);

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
    setNotification(`Chào mừng bạn ${girl.name} đến với Cây Lời Chúc 20/10!`);
    setTimeout(() => setNotification(""), 4500);
  }

  async function handleDirectUnlock(code: string): Promise<boolean> {
    const clean = code.trim().toUpperCase();
    if (!clean) return false;
    const res = await activeDb.verifySecretCodeAsync(clean, activeToken);
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

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-[#FAF7F2] via-[#F6ECE9] to-[#F1DEE3] flex flex-col items-center justify-between">
      {notification && (
        <div className="fixed top-20 z-50 px-5 py-2.5 rounded-full bg-[#E06D88] text-white text-xs font-semibold shadow-xl animate-bounce">
          {notification}
        </div>
      )}

      {detectedBoy ? (
        <div className="w-full max-w-xl mx-auto mt-20 px-4 z-40">
          <div className="p-4 rounded-3xl bg-white/95 backdrop-blur-md border border-pink-200/90 shadow-xl text-xs space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="size-8 rounded-xl bg-[#D94B76] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  GDG
                </span>
                <div>
                  <h3 className="font-bold text-sm text-[#431936]">
                    Xin chào {detectedBoy.name}!
                  </h3>
                  <p className="text-[11px] text-[#826A73]">
                    Bạn nữ được phân công: <strong className="text-pink-600 font-bold">{detectedBoy.assigned_girl_name || "Bạn Nữ GDGoC"}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsBoyLoginModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-pink-100/90 hover:bg-pink-100 text-pink-700 font-bold text-[11px] transition-colors cursor-pointer shrink-0"
              >
                Sửa lời chúc & mã
              </button>
            </div>

            <div className="p-2.5 rounded-2xl bg-pink-50/80 border border-pink-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-pink-700/80 uppercase font-bold tracking-wider block">
                  Mã bí mật của bạn (Secret Code):
                </span>
                <code className="text-sm font-bold font-mono text-[#D84D74]">
                  {detectedBoy.secret_code || "CHƯA ĐẶT"}
                </code>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (detectedBoy.secret_code && typeof navigator !== "undefined" && navigator.clipboard) {
                    navigator.clipboard.writeText(detectedBoy.secret_code);
                    setNotification(`Đã sao chép mã bí mật: ${detectedBoy.secret_code}!`);
                    setTimeout(() => setNotification(""), 3000);
                  }
                }}
                className="px-3 py-1 rounded-lg bg-white border border-pink-200 text-[11px] font-semibold text-pink-700 shadow-sm hover:bg-pink-50 cursor-pointer"
              >
                Sao chép mã
              </button>
            </div>
            <p className="text-[11px] text-slate-500 italic">
              Gửi mã này cho bạn nữ để mở thư trên cây.
            </p>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-xl mx-auto mt-20 px-4 z-40 flex justify-center sm:justify-end">
          <button
            type="button"
            onClick={() => setIsBoyLoginModalOpen(true)}
            className="px-4 py-2 rounded-full bg-white/95 hover:bg-white text-[#D84D74] font-bold text-xs border border-pink-200 shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <span>Gửi lời chúc & mã</span>
          </button>
        </div>
      )}

      <ViralTree2010
        treeTitle={treeData.group?.group_name || "GDGoC HUST"}
        recipientName={treeData.girl?.name}
        boys={treeData.boys}
        isUnlocked={treeData.isUnlocked}
        isBoyUnlocked={treeData.isBoyUnlocked}
        onSelectBoy={(boy) => setSelectedBoy(boy)}
        onOpenBoyLoginModal={() => setIsBoyLoginModalOpen(true)}
        onOpenGirlAccountModal={() => setIsGirlAccountModalOpen(true)}
      />

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

      <SecretCodeModal
        isOpen={isCodeModalOpen}
        girlToken={activeToken}
        onClose={() => setIsCodeModalOpen(false)}
        onSuccessUnlock={handleUnlockSuccess}
      />

      <BoyWishComposerModal
        isOpen={isBoyLoginModalOpen}
        initialBoy={detectedBoy}
        onClose={() => setIsBoyLoginModalOpen(false)}
        onWishUpdated={refreshTree}
      />

      <GirlAccountModal
        isOpen={isGirlAccountModalOpen}
        onClose={() => setIsGirlAccountModalOpen(false)}
        onRegistered={handleGirlRegistered}
      />
    </div>
  );
}
