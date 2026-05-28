import { useEffect, useRef, useState, useCallback } from "react";
import { Flame, Flag, Zap, Award, RefreshCw, BadgeCheck, Star, Rocket } from "lucide-react";
import { toggleReaction } from "../../services/reviewReactionService.js";
import { useCustomerAuth } from "../../context/CustomerAuthContext.jsx";
import toast from "react-hot-toast";

const REACTIONS = [
  { type: "fire-build",        icon: Flame,     label: "Fire Build",      emoji: "🔥",
    bg: "linear-gradient(135deg, #f97316, #e11d48)",
    glow: "rgba(249,115,22,0.5)" },
  { type: "treasure-find",     icon: Award,     label: "Treasure Find",   emoji: "💎",
    bg: "linear-gradient(135deg, #22d3ee, #6366f1)",
    glow: "rgba(34,211,238,0.5)" },
  { type: "speed-king",        icon: Zap,       label: "Speed King",      emoji: "⚡",
    bg: "linear-gradient(135deg, #facc15, #f97316)",
    glow: "rgba(250,204,21,0.5)" },
  { type: "track-ready",       icon: Flag,      label: "Track Ready",     emoji: "🏁",
    bg: "linear-gradient(135deg, #64748b, #334155)",
    glow: "rgba(100,116,139,0.5)" },
  { type: "wheel-spin",        icon: RefreshCw, label: "Wheel Spin",      emoji: "🛞",
    bg: "linear-gradient(135deg, #60a5fa, #8b5cf6)",
    glow: "rgba(96,165,250,0.5)" },
  { type: "collector-approved",icon: BadgeCheck,label: "Collector OK",    emoji: "🎌",
    bg: "linear-gradient(135deg, #34d399, #10b981)",
    glow: "rgba(52,211,153,0.5)" },
  { type: "showcase-worthy",   icon: Star,      label: "Showcase",        emoji: "⭐",
    bg: "linear-gradient(135deg, #fbbf24, #f97316)",
    glow: "rgba(251,191,36,0.5)" },
  { type: "must-have",         icon: Rocket,    label: "Must Have",       emoji: "🚀",
    bg: "linear-gradient(135deg, #fb7185, #e11d48)",
    glow: "rgba(244,63,94,0.5)" },
];

const KEYFRAMES = `
@keyframes re-tray-in { 0%{opacity:0;transform:scale(0.7) translateY(10px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
@keyframes re-bounce { 0%{opacity:0;transform:scale(0.3)} 50%{transform:scale(1.2)} 70%{transform:scale(0.9)} 100%{opacity:1;transform:scale(1)} }
@keyframes re-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
@keyframes re-pop { 0%{transform:scale(1)} 50%{transform:scale(1.4)} 100%{transform:scale(1)} }
`;

const CollectorReactions = ({ reviewId, reactionCounts: propCounts = {}, userReactions: propUser = null }) => {
  const { isAuthenticated } = useCustomerAuth();
  const [showTray, setShowTray] = useState(false);
  const [pending, setPending] = useState(null);
  const [local, setLocal] = useState(null);
  const [animPop, setAnimPop] = useState(null);
  const trayRef = useRef(null);
  const btnRef = useRef(null);
  const hovTimer = useRef(null);
  const lpTimer = useRef(null);
  const initRef = useRef(false);

  if (!initRef.current && reviewId) {
    initRef.current = true;
  }

  const counts = local?.counts ?? propCounts;
  const userReacts = local?.user ?? propUser;

  useEffect(() => {
    if (reviewId && initRef.current && local === null) {
      setLocal({ counts: propCounts, user: propUser });
    }
  }, [reviewId, propCounts, propUser, local]);

  useEffect(() => {
    const handler = (e) => {
      if (showTray && trayRef.current && !trayRef.current.contains(e.target) && btnRef.current && !btnRef.current.contains(e.target)) {
        setShowTray(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showTray]);

  const handleToggle = useCallback((type) => {
    if (!isAuthenticated) { toast.error("Login to react."); return; }
    setShowTray(false);

    const current = userReacts;
    const isSame = current === type;
    let newUser;
    let newCounts;

    if (current && !isSame) {
      newUser = type;
      newCounts = { ...counts };
      newCounts[current] = Math.max(0, (newCounts[current] || 0) - 1);
      newCounts[type] = (newCounts[type] || 0) + 1;
    } else if (isSame) {
      newUser = null;
      newCounts = { ...counts, [type]: Math.max(0, (counts[type] || 0) - 1) };
    } else {
      newUser = type;
      newCounts = { ...counts, [type]: (counts[type] || 0) + 1 };
    }

    setLocal({ counts: newCounts, user: newUser });
    setPending(type);
    setAnimPop(type);
    setTimeout(() => setAnimPop(null), 500);

    toggleReaction(reviewId, type)
      .then((res) => {
        setPending(null);
        setLocal((prev) => prev ? { counts: res.summary, user: res.added ? type : null } : null);
      })
      .catch((err) => {
        setPending(null);
        setLocal({ counts: propCounts, user: propUser });
        toast.error(err?.response?.data?.message || "Could not react.");
      });
  }, [reviewId, counts, userReacts, propCounts, propUser, isAuthenticated]);

  const openTray = () => { if (isAuthenticated) setShowTray(true); };
  const closeTray = () => setShowTray(false);

  const handleBtnEnter = () => {
    clearTimeout(hovTimer.current);
    if (isAuthenticated) hovTimer.current = setTimeout(openTray, 180);
  };
  const handleBtnLeave = () => {
    clearTimeout(hovTimer.current);
    hovTimer.current = setTimeout(closeTray, 350);
  };
  const handleTouchStart = () => { lpTimer.current = setTimeout(openTray, 400); };
  const handleTouchEnd = () => { clearTimeout(lpTimer.current); };

  const totalReactions = Object.values(counts).reduce((a, b) => a + b, 0);
  const topTypes = Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 3).map(([t]) => t);

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div className="relative inline-flex" onMouseLeave={handleBtnLeave}>
        <button
          ref={btnRef}
          onClick={() => { if (isAuthenticated) setShowTray(!showTray); else toast.error("Login to react."); }}
          onMouseEnter={handleBtnEnter}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative inline-flex items-center gap-1.5 rounded-xl border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-3.5 py-2 text-sm font-bold text-amber-700 shadow-sm transition-all duration-200 hover:border-amber-300 hover:shadow-md hover:shadow-amber-200/50 active:scale-95"
        >
          {totalReactions > 0 ? (
            <>
              <span className="flex -space-x-1">
                {topTypes.map((t) => {
                  const r = REACTIONS.find((x) => x.type === t);
                  return (
                    <span key={t} className="relative" style={animPop === t ? { animation: "re-pop 0.4s ease" } : {}}>
                      {r?.emoji || "⚡"}
                    </span>
                  );
                })}
              </span>
              <span>{totalReactions}</span>
            </>
          ) : (
            <>
              <span className="text-lg leading-none">⚡</span>
              <span>React</span>
            </>
          )}
        </button>

        {showTray && (
          <div
            ref={trayRef}
            onMouseEnter={() => clearTimeout(hovTimer.current)}
            onMouseLeave={handleBtnLeave}
            style={{ animation: "re-tray-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both" }}
            className="absolute bottom-full left-1/2 z-50 mb-3 -translate-x-1/2"
          >
            <div className="flex gap-1.5 rounded-2xl border border-white/30 bg-white/95 px-3 py-2.5 shadow-2xl shadow-black/15 backdrop-blur-xl">
              {REACTIONS.map((r, idx) => {
                const isActive = userReacts === r.type;
                const count = counts[r.type] || 0;
                const isLoading = pending === r.type;
                const Icon = r.icon;

                return (
                  <button
                    key={r.type}
                    onClick={() => handleToggle(r.type)}
                    disabled={isLoading}
                    style={{ animation: `re-bounce 0.35s ${idx * 0.04}s both` }}
                    className="group relative flex flex-col items-center gap-1 rounded-xl p-1.5 transition-all duration-200 hover:-translate-y-1.5"
                  >
                    <div
                      className={`relative flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-lg transition-all duration-200 group-hover:scale-125 group-hover:shadow-xl ${isActive ? "scale-110" : ""}`}
                      style={{
                        background: r.bg,
                        boxShadow: isActive ? `0 0 22px ${r.glow}` : `0 4px 12px ${r.glow}44`,
                      }}
                    >
                      {isLoading ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <span className={`text-[10px] font-bold whitespace-nowrap transition-colors ${isActive ? "text-gray-900" : "text-gray-400 group-hover:text-gray-700"}`}>
                      {r.label}
                    </span>
                    {count > 0 && (
                      <span
                        className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1.5 text-[10px] font-bold shadow-md"
                        style={{ animation: animPop === r.type ? "re-pop 0.3s ease" : "none" }}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="absolute left-1/2 -bottom-[5px] h-2.5 w-2.5 -translate-x-1/2 rotate-45 bg-white border-r border-b border-gray-100" />
          </div>
        )}
      </div>
    </>
  );
};

export default CollectorReactions;
