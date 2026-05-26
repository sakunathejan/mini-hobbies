import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const SPARK_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#2dd4bf"];
const RING_COLORS = ["rgba(239,68,68,0.4)", "rgba(251,191,36,0.3)", "rgba(34,197,94,0.35)", "rgba(59,130,246,0.3)"];

const MESSAGES = [
  "Your collection just got better!",
  "Another masterpiece added to your garage!",
  "Collector level upgraded!",
  "Rare acquisition confirmed!",
  "Unlocked: Premium Collectors' Club!",
  "A new legend joins your lineup!",
  "Garage status: Legendary +1!",
];

const rnd = (min, max) => Math.random() * (max - min) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ---------------------------------------------------------------------------
// SVG icons
// ---------------------------------------------------------------------------
const CarIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <rect x="4" y="18" width="40" height="16" rx="4" fill="currentColor" opacity="0.9" />
    <rect x="8" y="22" width="8" height="6" rx="1" fill="currentColor" opacity="0.3" />
    <rect x="20" y="22" width="12" height="6" rx="1" fill="currentColor" opacity="0.3" />
    <circle cx="15" cy="36" r="5" fill="currentColor" opacity="0.4" />
    <circle cx="33" cy="36" r="5" fill="currentColor" opacity="0.4" />
    <circle cx="15" cy="36" r="2.5" fill="currentColor" />
    <circle cx="33" cy="36" r="2.5" fill="currentColor" />
  </svg>
);

const WheelIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.5" />
    <circle cx="20" cy="20" r="8" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.7" />
    <circle cx="20" cy="20" r="3" fill="currentColor" />
    <line x1="20" y1="4" x2="20" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    <line x1="20" y1="28" x2="20" y2="36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    <line x1="4" y1="20" x2="12" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    <line x1="28" y1="20" x2="36" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
  </svg>
);

const StarIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 40 40" fill="none">
    <path d="M20 2l5.5 11.2L38 15.4l-9 8.8 2.1 12.4L20 30.6 8.9 36.6 11 24.2 2 15.4l12.5-1.8L20 2z" fill="currentColor" />
  </svg>
);

const SparkIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none">
    <path d="M16 0l3.5 12.5L32 16l-12.5 3.5L16 32l-3.5-12.5L0 16l12.5-3.5L16 0z" fill="currentColor" opacity="0.8" />
    <circle cx="16" cy="16" r="3" fill="currentColor" />
  </svg>
);

const ICONS = [CarIcon, WheelIcon, StarIcon, SparkIcon];

// ---------------------------------------------------------------------------
// Sub-components (each is a static, memoized effect)
// ---------------------------------------------------------------------------
function SpeedStreaks() {
  const items = useMemo(() => Array.from({ length: 12 }).map(() => ({
    left: Math.random() > 0.5,
    top: rnd(10, 90),
    w: rnd(40, 180),
    delay: rnd(0, 0.4),
    dur: rnd(0.4, 0.8),
    color: pick(SPARK_COLORS),
  })), []);
  return items.map((s, i) => (
    <motion.div
      key={i}
      className="absolute h-[2px] rounded-full"
      style={{
        top: `${s.top}%`,
        left: s.left ? 0 : "auto",
        right: s.left ? "auto" : 0,
        width: 1,
        background: `linear-gradient(${s.left ? "90deg" : "270deg"},${s.color},transparent)`,
      }}
      initial={{ width: 1, opacity: 0 }}
      animate={{ width: s.w, opacity: [0, 0.9, 0] }}
      transition={{ duration: s.dur, delay: s.delay, ease: "easeOut" }}
    />
  ));
}

function RingBurst() {
  return RING_COLORS.map((c, i) => (
    <motion.div
      key={i}
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{ width: 40, height: 40, border: `2px solid ${c}` }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: [0, 14, 20], opacity: [0, 0.7, 0] }}
      transition={{ duration: 1.2, delay: 0.15 + i * 0.1, ease: "easeOut" }}
    />
  ));
}

function FloatingIcons() {
  const items = useMemo(() => Array.from({ length: 18 }).map(() => {
    const Icon = pick(ICONS);
    return { Icon, x: rnd(5, 95), delay: rnd(0.5, 2.5), dur: rnd(2.5, 4.5), size: rnd(14, 28), r: rnd(-30, 30), color: pick(SPARK_COLORS), drift: rnd(-60, 60) };
  }), []);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((s, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: `${s.x}%`, bottom: "-40px", width: s.size, height: s.size, color: s.color }}
          initial={{ y: 0, opacity: 0, rotate: 0 }}
          animate={{ y: [0, -(typeof window !== "undefined" ? window.innerHeight + 80 : 800)], opacity: [0, 0.9, 0.6, 0], rotate: [0, s.r, s.r * 1.5], x: [0, s.drift] }}
          transition={{ duration: s.dur, delay: s.delay, ease: "easeOut" }}
        >
          <s.Icon />
        </motion.div>
      ))}
    </div>
  );
}

function SparkBurst() {
  const items = useMemo(() => Array.from({ length: 30 }).map((_, i) => {
    const angle = (i / 30) * Math.PI * 2;
    const dist = rnd(80, 250);
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, delay: rnd(0.1, 0.5), dur: rnd(0.8, 1.6), size: rnd(3, 7), color: pick(SPARK_COLORS) };
  }), []);
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {items.map((s, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ width: s.size, height: s.size, backgroundColor: s.color }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
          animate={{ x: s.x, y: s.y, opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
          transition={{ duration: s.dur, delay: s.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

function PremiumConfetti() {
  const items = useMemo(() => Array.from({ length: 50 }).map(() => ({
    x: rnd(0, 100), delay: rnd(0, 1.8), dur: rnd(2, 4), color: pick(SPARK_COLORS), w: rnd(5, 12), h: rnd(8, 20), r: rnd(-360, 360), drift: rnd(-40, 40),
  })), []);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((s, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: `${s.x}%`, top: "-20px", width: s.w, height: s.h, backgroundColor: s.color, borderRadius: Math.random() > 0.5 ? "50%" : "2px" }}
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{ y: [0, typeof window !== "undefined" ? window.innerHeight + 40 : 800], opacity: [1, 0.9, 0.4, 0], rotate: [0, s.r, s.r * 1.5], x: [0, s.drift] }}
          transition={{ duration: s.dur, delay: s.delay, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}

// ===========================================================================
// MAIN EXPORT
// ===========================================================================
export default function OrderCelebration({ customerName = "", items = [], total = 0 }) {
  const prefersReduced = useReducedMotion();
  const [show, setShow] = useState(true);
  const message = useMemo(() => pick(MESSAGES), []);

  useEffect(() => {
    if (prefersReduced) return;
    const t = setTimeout(() => setShow(false), 5000);
    return () => clearTimeout(t);
  }, [prefersReduced]);

  if (prefersReduced) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="celebration-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />

          <SpeedStreaks />
          <SparkBurst />
          <RingBurst />
          <FloatingIcons />
          <PremiumConfetti />

          {/* Center content */}
          <motion.div
            className="relative z-10 flex flex-col items-center px-4 text-center"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
              transition: { type: "spring", stiffness: 200, damping: 16, delay: 0.15 },
            }}
            exit={{ scale: 0.8, opacity: 0, transition: { duration: 0.35 } }}
          >
            <motion.div
              className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-2xl shadow-green-500/40 sm:h-28 sm:w-28"
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1.4, 1],
                opacity: [0, 1, 1],
                boxShadow: [
                  "0 0 0 0 rgba(34,197,94,0)",
                  "0 0 60px 20px rgba(34,197,94,0.3)",
                  "0 0 80px 30px rgba(34,197,94,0.15)",
                ],
              }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            >
              <motion.svg
                viewBox="0 0 24 24"
                className="h-10 w-10 text-white sm:h-12 sm:w-12"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.35 }}
              >
                <polyline points="20 6 9 17 4 12" />
              </motion.svg>
            </motion.div>

            <motion.div
              className="mt-6 space-y-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.9, duration: 0.5, ease: "easeOut" } }}
            >
              <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Order Confirmed!</h2>
              {customerName && (
                <p className="text-base font-semibold text-white/80 sm:text-lg">Great job, {customerName}!</p>
              )}
              <motion.p
                className="text-sm font-medium sm:text-base"
                style={{
                  background: "linear-gradient(135deg, #f97316, #ef4444, #eab308, #22c55e)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3, duration: 0.5 }}
              >
                {message}
              </motion.p>
            </motion.div>

            {items.length > 0 && (
              <motion.div
                className="mt-6 flex flex-wrap justify-center gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6, duration: 0.5 }}
              >
                {items.slice(0, 4).map((item, i) => (
                  <motion.div
                    key={item.product || i}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 backdrop-blur"
                    initial={{ opacity: 0, y: 15, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: 1.7 + i * 0.1, duration: 0.35 } }}
                  >
                    {item.image && (
                      <img src={item.image} alt={item.name} className="h-8 w-8 flex-shrink-0 rounded-md object-cover" />
                    )}
                    <div className="text-left">
                      <p className="max-w-[120px] truncate text-xs font-semibold text-white">{item.name}</p>
                      <p className="text-[10px] text-white/60">x{item.quantity}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
