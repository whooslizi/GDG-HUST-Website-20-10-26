import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { dbService } from "@/services/app-database";

// Girl logged in on this browser (set by QuizPlay), or null for boys/admins.
function readActiveGirl() {
  try {
    const token = localStorage.getItem("active_girl_token");
    return token ? dbService.getGirlByToken(token) : null;
  } catch {
    return null;
  }
}

export function SiteHeader() {
  const router = useRouterState();
  const currentPath = router.location.pathname;
  const [girl, setGirl] = useState(readActiveGirl);
  useEffect(() => {
    setGirl(readActiveGirl());
    return dbService.subscribe(() => setGirl(readActiveGirl()));
  }, [currentPath]);
  // Visitors only see the wish tree; girls see the challenge, plus the tree once done. Dashboard is URL-only.
  const showTree = !girl || girl.stage === "completed";

  return (
    <header className="fixed top-3 sm:top-4 left-3 right-3 sm:left-6 sm:right-6 z-40 h-13 sm:h-14 flex items-center justify-between px-3.5 sm:px-6 rounded-full backdrop-blur-xl bg-[rgba(255,255,255,0.82)] border border-[rgba(255,255,255,0.9)] shadow-[0_12px_28px_-6px_rgba(136,73,90,0.12)]">
      <Link to={showTree ? "/boy" : "/play"} className="flex items-center gap-1.5 sm:gap-2.5 no-underline group shrink-0">
        <span className="font-display text-sm sm:text-lg tracking-tight text-[var(--text-primary)] font-semibold whitespace-nowrap">
          Bloom With Us
        </span>
        <span className="inline-flex items-center justify-center px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold tracking-wider uppercase border border-[rgba(212,175,55,0.5)] bg-[rgba(212,175,55,0.14)] text-[#916b14]">
          20/10
        </span>
      </Link>

      <nav className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-medium shrink-0">
        {showTree && (
        <Link
          to="/boy"
          className={`px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full transition-all no-underline whitespace-nowrap ${
            currentPath === "/boy"
              ? "bg-[#F7E6EC] text-[var(--accent-blush-hover)] font-semibold"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/50"
          }`}
        >
          Cây ước nguyện
        </Link>
        )}
        {girl && (
        <Link
          to="/play"
          className={`px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full transition-all no-underline whitespace-nowrap ${
            currentPath === "/" || currentPath === "/play"
              ? "bg-[#F7E6EC] text-[var(--accent-blush-hover)] font-semibold"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/50"
          }`}
        >
          Thử thách
        </Link>
        )}
      </nav>
    </header>
  );
}
