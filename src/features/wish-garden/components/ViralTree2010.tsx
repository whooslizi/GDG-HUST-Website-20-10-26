import { useState } from "react";
import type { Boy } from "@/types/database";

interface ViralTree2010Props {
  treeTitle: string;
  recipientName?: string;
  boys: Boy[];
  isUnlocked: boolean;
  isBoyUnlocked?: (boy: Boy) => boolean;
  onSelectBoy: (boy: Boy) => void;
  onOpenBoyLoginModal: () => void;
  onOpenGirlAccountModal: () => void;
}

const ORNAMENT_ICONS: Record<string, string> = {
  lotus: "🪷",
  peach: "🌸",
  giftbox: "🎁",
  snowglobe: "🔮",
  teddy: "🧸",
};

const BRANCH_COORDINATES = [
  { x: 26, y: 36 },
  { x: 50, y: 17 },
  { x: 74, y: 36 },
  { x: 37, y: 25 },
  { x: 63, y: 25 },
  { x: 20, y: 46 },
  { x: 80, y: 46 },
  { x: 50, y: 33 },
  { x: 30, y: 50 },
  { x: 70, y: 50 },
  { x: 43, y: 13 },
  { x: 57, y: 13 },
];

export function ViralTree2010({
  treeTitle,
  recipientName,
  boys,
  isUnlocked,
  isBoyUnlocked,
  onSelectBoy,
  onOpenBoyLoginModal,
  onOpenGirlAccountModal,
}: ViralTree2010Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const totalPages = Math.max(1, Math.ceil(boys.length / itemsPerPage));

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentBoys = boys.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="relative w-full min-h-screen flex flex-col justify-between bg-gradient-to-b from-[#FAF7F2] via-[#F6ECE9] to-[#F1DEE3] text-[#2C1820] overflow-x-hidden font-sans select-none pb-28 pt-4 sm:pt-6">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(252,232,237,0.6),transparent),radial-gradient(circle_at_15%_45%,rgba(250,210,220,0.3),transparent_40%),radial-gradient(circle_at_85%_45%,rgba(253,240,230,0.4),transparent_40%)]" />

        {[...Array(14)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-[#E06D88]/20 pointer-events-none"
            style={{
              top: `${(i * 7) % 94}%`,
              left: `${(i * 14) % 96}%`,
              width: `${(i % 3) + 4}px`,
              height: `${(i % 3) + 7}px`,
              transform: `rotate(${i * 28}deg)`,
              animation: `petalFallGentle ${8 + (i % 4)}s linear infinite`,
              animationDelay: `${i * 0.6}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 px-4 max-w-2xl mx-auto w-full text-center">
        <div className="inline-flex items-center gap-2 mb-1.5">
          <span className="h-px w-5 sm:w-6 bg-[#C5A059]/60" />
          <span className="text-[10px] sm:text-xs font-medium tracking-[0.2em] uppercase text-[#826A73]">
            {treeTitle || "GDGoC HUST"} · 20 Tháng 10
          </span>
          <span className="h-px w-5 sm:w-6 bg-[#C5A059]/60" />
        </div>

        <h1 className="text-2xl sm:text-4xl font-serif font-bold text-[#2C1820] tracking-tight">
          Cây Ước Nguyện
        </h1>

        <p className="text-xs sm:text-sm text-[#826A73] mt-1 max-w-md mx-auto leading-relaxed">
          {recipientName
            ? `Thương gửi đến bạn ${recipientName}`
            : "Những lời chúc và món quà kỷ niệm 20/10 gửi tặng bạn"}
        </p>

        <div className="mt-1.5 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onOpenGirlAccountModal}
            className="text-[11px] text-[#826A73] hover:text-[#C25953] transition-colors underline underline-offset-4 cursor-pointer"
          >
            {recipientName ? "Đổi tài khoản nhận quà" : "Bạn nữ đăng ký nhận quà"}
          </button>
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-5xl mx-auto px-2 sm:px-4 my-auto">
        <div className="relative w-full max-w-[calc(72vh*1000/620)] aspect-[1000/620] mx-auto">
          <svg
            viewBox="0 0 1000 620"
            className="w-full h-full block select-none pointer-events-none"
          >
            <defs>
              <linearGradient id="trunkBark" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#25140C" />
                <stop offset="25%" stopColor="#3E2014" />
                <stop offset="50%" stopColor="#542E1D" />
                <stop offset="75%" stopColor="#3E2014" />
                <stop offset="100%" stopColor="#20100A" />
              </linearGradient>

              <linearGradient id="branchWood" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#5E3321" />
                <stop offset="100%" stopColor="#30190F" />
              </linearGradient>

              <radialGradient id="blossomDeep" cx="45%" cy="40%" r="65%">
                <stop offset="0%" stopColor="#FFA6C1" />
                <stop offset="55%" stopColor="#DB597E" />
                <stop offset="100%" stopColor="#A8284C" />
              </radialGradient>
              <radialGradient id="blossomMid" cx="40%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#FFF2F6" />
                <stop offset="50%" stopColor="#F9B3C7" />
                <stop offset="100%" stopColor="#E26589" />
              </radialGradient>
              <radialGradient id="blossomSoft" cx="35%" cy="30%" r="60%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="55%" stopColor="#FEE4ED" />
                <stop offset="100%" stopColor="#F59EBA" />
              </radialGradient>
              <radialGradient id="blossomAura" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(255, 230, 238, 0.6)" />
                <stop offset="100%" stopColor="rgba(255, 230, 238, 0)" />
              </radialGradient>

              <linearGradient id="mossHill" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#5D8562" />
                <stop offset="40%" stopColor="#446648" />
                <stop offset="100%" stopColor="#263D2A" />
              </linearGradient>

              <g id="flower-petal-cluster">
                <circle cx="0" cy="-6" r="4.2" fill="#FFAEC5" opacity="0.95" />
                <circle cx="5.7" cy="-1.8" r="4.2" fill="#FFAEC5" opacity="0.95" />
                <circle cx="3.5" cy="4.8" r="4.2" fill="#FF9EBA" opacity="0.95" />
                <circle cx="-3.5" cy="4.8" r="4.2" fill="#FF9EBA" opacity="0.95" />
                <circle cx="-5.7" cy="-1.8" r="4.2" fill="#FFAEC5" opacity="0.95" />
                <circle cx="0" cy="0" r="2" fill="#FFE899" />
                <circle cx="0" cy="0" r="0.9" fill="#E67E22" />
              </g>

              <g id="leaf-duo">
                <ellipse cx="-4" cy="-2" rx="7" ry="3.2" fill="#507F58" transform="rotate(-25 -4 -2)" />
                <ellipse cx="4" cy="1" rx="6" ry="2.8" fill="#6A9A72" transform="rotate(20 4 1)" />
              </g>
            </defs>

            <path
              d="M -50 620 Q 220 540, 500 550 Q 780 560, 1050 535 L 1050 620 Z"
              fill="url(#mossHill)"
            />
            <path
              d="M 50 620 Q 320 555, 520 558 Q 740 562, 950 548"
              stroke="#769E7A"
              strokeWidth="2.5"
              fill="none"
              opacity="0.45"
            />

            <ellipse cx="500" cy="220" rx="380" ry="160" fill="url(#blossomAura)" />

            <g>
              <path
                d="M 410 575 Q 460 550, 470 500 L 530 500 Q 540 550, 590 575 Q 545 565, 500 562 Q 455 565, 410 575 Z"
                fill="url(#trunkBark)"
              />
              <path
                d="M 465 510 C 475 440, 480 390, 465 340 C 450 290, 480 250, 492 230 L 512 230 C 525 250, 550 290, 535 340 C 520 390, 525 440, 535 510 Z"
                fill="url(#trunkBark)"
              />
              <path
                d="M 485 490 Q 480 430, 485 370 Q 492 320, 498 260"
                stroke="#6E3D27"
                strokeWidth="1.5"
                fill="none"
                opacity="0.55"
              />
              <path
                d="M 515 480 Q 522 420, 516 360 Q 510 310, 506 260"
                stroke="#331A0F"
                strokeWidth="1.5"
                fill="none"
                opacity="0.6"
              />
              <path
                d="M 470 340 C 390 305, 300 280, 190 240 C 230 250, 310 270, 400 300 C 440 315, 465 330, 470 340 Z"
                fill="url(#branchWood)"
              />
              <path
                d="M 330 285 Q 260 220, 190 190 Q 250 215, 335 260 Z"
                fill="url(#branchWood)"
              />
              <path
                d="M 475 280 C 430 225, 370 185, 300 135 C 340 160, 400 200, 455 245 Z"
                fill="url(#branchWood)"
              />
              <path
                d="M 530 340 C 610 305, 700 280, 810 240 C 770 250, 690 270, 600 300 C 560 315, 535 330, 530 340 Z"
                fill="url(#branchWood)"
              />
              <path
                d="M 670 285 Q 740 220, 810 190 Q 750 215, 665 260 Z"
                fill="url(#branchWood)"
              />
              <path
                d="M 525 280 C 570 225, 630 185, 700 135 C 660 160, 600 200, 545 245 Z"
                fill="url(#branchWood)"
              />
              <path
                d="M 495 230 C 485 170, 460 135, 435 95 C 460 115, 485 150, 500 200 C 515 150, 540 115, 565 95 C 540 135, 515 170, 505 230 Z"
                fill="url(#branchWood)"
              />
            </g>

            <g>
              <g opacity="0.82">
                <ellipse cx="230" cy="245" rx="105" ry="70" fill="url(#blossomDeep)" />
                <ellipse cx="360" cy="195" rx="115" ry="78" fill="url(#blossomDeep)" />
                <ellipse cx="500" cy="160" rx="135" ry="90" fill="url(#blossomDeep)" />
                <ellipse cx="640" cy="195" rx="115" ry="78" fill="url(#blossomDeep)" />
                <ellipse cx="770" cy="245" rx="105" ry="70" fill="url(#blossomDeep)" />
                <ellipse cx="500" cy="230" rx="110" ry="70" fill="url(#blossomDeep)" />
              </g>

              <g opacity="0.94">
                <ellipse cx="195" cy="240" rx="85" ry="62" fill="url(#blossomMid)" />
                <ellipse cx="275" cy="210" rx="95" ry="70" fill="url(#blossomMid)" />
                <ellipse cx="355" cy="165" rx="100" ry="72" fill="url(#blossomMid)" />
                <ellipse cx="445" cy="130" rx="100" ry="72" fill="url(#blossomMid)" />
                <ellipse cx="500" cy="115" rx="105" ry="78" fill="url(#blossomMid)" />
                <ellipse cx="555" cy="130" rx="100" ry="72" fill="url(#blossomMid)" />
                <ellipse cx="645" cy="165" rx="100" ry="72" fill="url(#blossomMid)" />
                <ellipse cx="725" cy="210" rx="95" ry="70" fill="url(#blossomMid)" />
                <ellipse cx="805" cy="240" rx="85" ry="62" fill="url(#blossomMid)" />
                <ellipse cx="500" cy="205" rx="115" ry="75" fill="url(#blossomMid)" />
              </g>

              <g opacity="0.96">
                <ellipse cx="370" cy="140" rx="72" ry="52" fill="url(#blossomSoft)" />
                <ellipse cx="500" cy="98" rx="80" ry="58" fill="url(#blossomSoft)" />
                <ellipse cx="630" cy="140" rx="72" ry="52" fill="url(#blossomSoft)" />
                <ellipse cx="270" cy="190" rx="65" ry="48" fill="url(#blossomSoft)" />
                <ellipse cx="730" cy="190" rx="65" ry="48" fill="url(#blossomSoft)" />
                <ellipse cx="500" cy="180" rx="85" ry="55" fill="url(#blossomSoft)" />
              </g>

              {[
                { x: 140, y: 220, rot: -20 },
                { x: 220, y: 155, rot: 15 },
                { x: 320, y: 110, rot: -35 },
                { x: 420, y: 70, rot: -10 },
                { x: 580, y: 70, rot: 15 },
                { x: 680, y: 110, rot: 30 },
                { x: 780, y: 155, rot: -20 },
                { x: 860, y: 220, rot: 25 },
                { x: 300, y: 260, rot: 40 },
                { x: 700, y: 260, rot: -35 },
              ].map((leaf, idx) => (
                <use
                  key={`leaf-accent-${idx}`}
                  href="#leaf-duo"
                  x={leaf.x}
                  y={leaf.y}
                  transform={`rotate(${leaf.rot} ${leaf.x} ${leaf.y})`}
                  opacity="0.9"
                />
              ))}

              {[
                { x: 190, y: 215, s: 1.1 },
                { x: 250, y: 170, s: 1.2 },
                { x: 330, y: 135, s: 1.25 },
                { x: 420, y: 95, s: 1.3 },
                { x: 500, y: 70, s: 1.35 },
                { x: 580, y: 95, s: 1.3 },
                { x: 670, y: 135, s: 1.25 },
                { x: 750, y: 170, s: 1.2 },
                { x: 810, y: 215, s: 1.1 },
                { x: 280, y: 240, s: 1.15 },
                { x: 380, y: 200, s: 1.2 },
                { x: 500, y: 150, s: 1.3 },
                { x: 620, y: 200, s: 1.2 },
                { x: 720, y: 240, s: 1.15 },
                { x: 450, y: 240, s: 1.1 },
                { x: 550, y: 240, s: 1.1 },
              ].map((fl, idx) => (
                <use
                  key={`blossom-accent-${idx}`}
                  href="#flower-petal-cluster"
                  x={fl.x}
                  y={fl.y}
                  transform={`scale(${fl.s})`}
                  style={{ transformOrigin: `${fl.x}px ${fl.y}px` }}
                />
              ))}

              {[
                { x: 130, y: 270, r: 25 },
                { x: 210, y: 290, r: -40 },
                { x: 340, y: 270, r: 60 },
                { x: 660, y: 270, r: -30 },
                { x: 790, y: 290, r: 45 },
                { x: 870, y: 270, r: -15 },
              ].map((pt, idx) => (
                <circle
                  key={`float-petal-${idx}`}
                  cx={pt.x}
                  cy={pt.y}
                  r="4"
                  fill="#FFAEC5"
                  opacity="0.8"
                  transform={`rotate(${pt.r} ${pt.x} ${pt.y})`}
                />
              ))}
            </g>
          </svg>

          {currentBoys.map((boy, idx) => {
            const coord = BRANCH_COORDINATES[idx % BRANCH_COORDINATES.length];
            const unlocked = isBoyUnlocked ? isBoyUnlocked(boy) : isUnlocked;
            const giftIcon = ORNAMENT_ICONS[boy.ornament_type] || "🌸";
            return (
              <div
                key={boy.id}
                onClick={() => onSelectBoy(boy)}
                style={{ top: `${coord.y}%`, left: `${coord.x}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group transition-transform duration-300 hover:scale-110 active:scale-95 z-20 touch-manipulation"
              >
                <div className="w-[1px] h-3.5 sm:h-5 bg-gradient-to-b from-[#C5A059] to-[#916B14] shadow-xs -mb-0.5" />

                <div className="relative flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-[#FFFDF9]/95 border border-[#E8D7DC] shadow-[0_4px_16px_-2px_rgba(136,73,90,0.14)] group-hover:border-[#E06D88] group-hover:shadow-[0_8px_24px_-3px_rgba(224,109,136,0.3)] transition-all">
                  <span className="shrink-0 flex items-center justify-center size-4 sm:size-5 rounded-full bg-[#FAF0EE] border border-[#F0D5DA] text-[10px] sm:text-xs">
                    {giftIcon}
                  </span>

                  <span className="text-[10px] sm:text-xs font-serif font-semibold text-[#2C1820] tracking-tight whitespace-nowrap max-w-[62px] sm:max-w-none truncate">
                    {boy.name}
                  </span>

                  <span
                    className={`size-1.5 rounded-full shrink-0 ${
                      unlocked ? "bg-emerald-500 shadow-[0_0_6px_#10B981]" : "bg-[#C25953]"
                    }`}
                  />
                </div>
              </div>
            );
          })}

          {boys.length === 0 && (
            <div className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center p-4 sm:p-5 rounded-2xl bg-white/90 backdrop-blur-md border border-[#F0D5DA] shadow-xl text-center max-w-[240px] sm:max-w-[280px] pointer-events-auto animate-fade-in">
              <span className="text-2xl sm:text-3xl mb-1">🌸</span>
              <h3 className="text-xs sm:text-sm font-serif font-bold text-[#2C1820]">
                Cây Đang Chờ Lời Chúc
              </h3>
              <p className="text-[10px] sm:text-[11px] text-[#826A73] mt-0.5 leading-relaxed">
                Chưa có bức thư nào được treo. Các bạn nam hãy gửi gắm lời chúc đầu tiên nhé!
              </p>
              <button
                type="button"
                onClick={onOpenBoyLoginModal}
                className="mt-2.5 px-3.5 py-1.5 rounded-full bg-[#D94B76] hover:bg-[#C23D66] text-white text-[11px] sm:text-xs font-semibold shadow-sm cursor-pointer transition-all active:scale-95"
              >
                Gửi lời chúc ngay
              </button>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-3 mt-2 z-20">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="size-7 rounded-full bg-white/90 border border-[#E8D7DC] flex items-center justify-center text-xs text-[#2C1820] disabled:opacity-30 hover:bg-white shadow-sm transition-colors cursor-pointer"
            >
              ‹
            </button>
            <div className="px-3.5 py-0.5 rounded-full bg-white/95 border border-[#E8D7DC] text-[11px] font-serif font-medium text-[#826A73] shadow-sm">
              Trang {currentPage} / {totalPages}
            </div>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="size-7 rounded-full bg-white/90 border border-[#E8D7DC] flex items-center justify-center text-xs text-[#2C1820] disabled:opacity-30 hover:bg-white shadow-sm transition-colors cursor-pointer"
            >
              ›
            </button>
          </div>
        )}
      </div>

      <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1.5 sm:gap-2 max-w-[95vw] w-full sm:w-auto px-2">
        <div className="flex items-center gap-2.5 sm:gap-4 text-[10px] sm:text-[11px] text-[#826A73]">
          <button
            type="button"
            onClick={onOpenBoyLoginModal}
            className="hover:text-[#2C1820] transition-colors cursor-pointer underline underline-offset-4"
          >
            Dành cho bạn nam gửi lời chúc →
          </button>
          <span>·</span>
          <span>{boys.length} lời chúc trên cây</span>
        </div>
      </div>
    </div>
  );
}
