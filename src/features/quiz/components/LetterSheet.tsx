import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

// Handwritten 20/10 letter on cream paper with pressed flowers.
// Used for the welcome letter and the pre-event countdown letter.

const PAPER = "#FBF6EC";
const INK = "#3A2230";

function Flower({ color, center, size, rotate = 0 }: { color: string; center: string; size: number; rotate?: number }) {
  return (
    <svg width={size} height={size} viewBox="-50 -50 100 100" style={{ transform: `rotate(${rotate}deg)` }}>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="0" cy="-24" rx="15" ry="24" fill={color} opacity="0.9" transform={`rotate(${a})`} />
      ))}
      {[36, 108, 180, 252, 324].map((a) => (
        <ellipse key={a} cx="0" cy="-17" rx="9" ry="15" fill="#FFFFFF" opacity="0.18" transform={`rotate(${a})`} />
      ))}
      <circle r="9" fill={center} />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <circle key={a} cx="0" cy="-5" r="1.6" fill="#7A4A12" transform={`rotate(${a})`} />
      ))}
    </svg>
  );
}

function Sprig({ size, rotate = 0 }: { size: number; rotate?: number }) {
  return (
    <svg width={size} height={size * 1.6} viewBox="0 0 40 64" style={{ transform: `rotate(${rotate}deg)` }}>
      <path d="M20 64 C20 44 18 24 22 2" stroke="#6E8B5B" strokeWidth="1.6" fill="none" />
      {[10, 22, 34, 46].map((y, i) => (
        <ellipse
          key={y}
          cx={i % 2 ? 27 : 13}
          cy={y}
          rx="7"
          ry="3.4"
          fill={i % 2 ? "#8FA77C" : "#7C9868"}
          transform={`rotate(${i % 2 ? -35 : 35} ${i % 2 ? 27 : 13} ${y})`}
        />
      ))}
    </svg>
  );
}

function Bouquet({ flip = false }: { flip?: boolean }) {
  return (
    <div aria-hidden className="relative w-[120px] h-[120px] sm:w-[150px] sm:h-[150px]" style={{ transform: flip ? "scale(-1,-1)" : undefined }}>
      <div className="absolute left-[46%] top-[30%]"><Sprig size={34} rotate={40} /></div>
      <div className="absolute left-[8%] top-[48%]"><Sprig size={28} rotate={-60} /></div>
      <div className="absolute left-[30%] top-[6%]"><Flower color="#E58BA0" center="#F4C35A" size={62} rotate={12} /></div>
      <div className="absolute left-[2%] top-[22%]"><Flower color="#F3B6C3" center="#F2D27A" size={42} rotate={-20} /></div>
      <div className="absolute left-[50%] top-[46%]"><Flower color="#C25953" center="#F4C35A" size={36} rotate={30} /></div>
    </div>
  );
}

interface LetterSheetProps {
  to: string;
  title?: string;
  children: ReactNode;
  signature?: string;
  footer?: ReactNode;
}

export function LetterSheet({ to, title, children, signature = "GDG HUST", footer }: LetterSheetProps) {
  const reduceMotion = useReducedMotion();

  return (
    <main className="w-full min-h-screen bg-gradient-to-b from-[#FFF5F7] via-[#FDE8EF] to-[#F7D5DF] flex justify-center px-4 pt-28 pb-16 overflow-x-hidden">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 40, rotate: 0 }}
        animate={{ opacity: 1, y: 0, rotate: -1.2 }}
        transition={{ type: "spring", damping: 20, stiffness: 140 }}
        className="relative w-full max-w-[620px] h-fit"
      >
        {/* Second sheet peeking out behind */}
        <div aria-hidden className="absolute inset-0 rounded-[3px] shadow-lg" style={{ background: "#F3ECDD", transform: "rotate(3deg) translate(10px, 6px)" }} />

        <article
          className="relative rounded-[3px] shadow-2xl px-7 sm:px-14 pt-14 pb-12"
          style={{
            background: PAPER,
            color: INK,
            backgroundImage: "radial-gradient(rgba(140,110,80,0.06) 1px, transparent 1px)",
            backgroundSize: "4px 4px",
          }}
        >
          {/* Washi tape */}
          <div aria-hidden className="absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-7 rotate-[-3deg] opacity-80" style={{ background: "repeating-linear-gradient(45deg, #F3C5CF 0 8px, #F8DCE2 8px 16px)" }} />

          <div className="absolute -top-10 -right-8 sm:-right-12"><Bouquet /></div>
          <div className="absolute -bottom-10 -left-8 sm:-left-12"><Bouquet flip /></div>

          <div className="relative font-hand text-[21px] sm:text-[23px] leading-[1.75]">
            {title && <h1 className="mb-6 text-center text-[26px] sm:text-[30px] leading-snug text-[#B4475A]">{title}</h1>}
            <p>Gửi {to.trim() || "bạn"},</p>
            <div className="mt-5 whitespace-pre-line">{children}</div>
            <p className="mt-8">Thương mến,</p>
            <p className="font-script text-[34px] leading-tight text-[#B4475A]">{signature}</p>
          </div>

          {footer && <div className="relative mt-8 font-sans">{footer}</div>}
        </article>
      </motion.div>
    </main>
  );
}
