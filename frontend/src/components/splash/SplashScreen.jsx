import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PARTICLE_COUNT = 30;

const SplashScreen = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [exit, setExit] = useState(false);
  const [ready, setReady] = useState(false);
  const frameRef = useRef(null);

  const particles = useMemo(() =>
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      driftX: (Math.random() - 0.5) * 0.3,
      driftY: (Math.random() - 0.5) * 0.3 - 0.1,
      delay: Math.random() * 2
    })), []);

  useEffect(() => {
    const start = performance.now();
    const duration = 2200;

    const tick = (now) => {
      const elapsed = now - start;
      const p = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setProgress(Math.round(eased * 100));
      if (p < 1) { frameRef.current = requestAnimationFrame(tick); }
      else { setReady(true); }
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, []);

  const handleExit = useCallback(() => {
    setExit(true);
    setTimeout(onFinish, 800);
  }, [onFinish]);

  useEffect(() => {
    if (ready) {
      const timer = setTimeout(handleExit, 600);
      return () => clearTimeout(timer);
    }
  }, [ready, handleExit]);

  return (
    <AnimatePresence>
      {!exit && (
        <motion.div
          key="splash"
          exit={{ opacity: 0, scale: 1.05, transition: { duration: 0.8, ease: [0.45, 0, 0.1, 1] } }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: "linear-gradient(135deg, #0a0a0f 0%, #14141f 40%, #1a1a2e 70%, #0f0f1a 100%)" }}
        >
          <motion.div
            className="pointer-events-none absolute inset-0 opacity-30"
            animate={{ backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(239,68,68,0.08) 0%, transparent 50%)", backgroundSize: "200% 200%" }}
          />

          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%`, backgroundColor: "rgba(255,255,255,0.15)", boxShadow: "0 0 4px rgba(255,255,255,0.1)" }}
              animate={{ y: [0, p.driftY * 100, 0], x: [0, p.driftX * 100, 0], opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 6 + p.delay, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
            />
          ))}

          <div className="relative flex flex-col items-center">
            <div className="relative mb-8">
              <motion.div
                className="absolute -inset-8 rounded-full"
                animate={{ boxShadow: ["0 0 20px rgba(255,255,255,0.05)", "0 0 40px rgba(255,255,255,0.1)", "0 0 20px rgba(255,255,255,0.05)"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />

              <motion.div
                className="absolute -inset-4 rounded-full"
                style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(239,68,68,0.05))", filter: "blur(20px)" }}
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />

              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1], delay: 0.1 }}
                className="relative z-10 h-24 w-24 overflow-hidden rounded-2xl bg-white/5 p-2 backdrop-blur-sm sm:h-28 sm:w-28"
              >
                <motion.div
                  className="absolute inset-0 z-20"
                  style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)", transform: "skewX(-20deg)" }}
                  animate={{ x: ["-150%", "250%"] }}
                  transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
                />
                <img src="/logo.png" alt="Mini Hobbies" className="h-full w-full object-contain" />
              </motion.div>
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xl font-bold tracking-wider text-white/90 sm:text-2xl"
            >
              MINI HOBBIES
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-1 text-xs tracking-[0.3em] text-white/40 sm:text-sm"
            >
              COLLECTIBLES & DIE-CAST
            </motion.p>

            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="relative mt-10 h-[2px] w-48 overflow-hidden rounded-full bg-white/10 sm:w-64"
            >
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)" }}
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #ef4444, #3b82f6)" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1, ease: "linear" }}
              />
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.9 }}
              className="mt-3 text-xs tabular-nums text-white/30"
            >
              {progress}%
            </motion.p>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="absolute bottom-8 text-[10px] tracking-widest text-white/15"
          >
            Loading Experience
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
