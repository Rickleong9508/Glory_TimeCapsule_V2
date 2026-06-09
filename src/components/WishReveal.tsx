import { motion } from "motion/react";
import { WishRecord, Language, ColleagueGroup } from "../types";
import { Mail, Sparkles, RefreshCw, Eye, Shield, Cpu, Link, Gauge, HelpCircle } from "lucide-react";
import { translations } from "../locales";

interface WishRevealProps {
  wish: WishRecord;
  allWishes: WishRecord[];
  onReset: () => void;
  lang: Language;
}

// Map metadata for each of the 6 core groups (color, border, icons)
const getGroupMetadata = (group: ColleagueGroup) => {
  switch (group) {
    case "Visionary":
      return {
        bannerGlow: "from-purple-500/20 via-indigo-500/20 to-purple-500/10",
        badgeBg: "bg-purple-500/10 border-purple-400/20 text-purple-300",
        icon: Sparkles
      };
    case "Lead":
      return {
        bannerGlow: "from-amber-500/20 via-rose-500/20 to-amber-500/10",
        badgeBg: "bg-amber-500/10 border-amber-400/20 text-amber-300",
        icon: Shield
      };
    case "Builder":
      return {
        bannerGlow: "from-emerald-500/20 via-teal-500/20 to-emerald-500/10",
        badgeBg: "bg-emerald-500/10 border-emerald-400/20 text-emerald-300",
        icon: Cpu
      };
    case "Connector":
      return {
        bannerGlow: "from-pink-500/20 via-rose-500/20 to-pink-500/10",
        badgeBg: "bg-pink-500/10 border-pink-400/20 text-pink-300",
        icon: Link
      };
    case "Pragmatist":
      return {
        bannerGlow: "from-cyan-500/20 via-sky-500/20 to-cyan-500/10",
        badgeBg: "bg-cyan-500/10 border-cyan-400/20 text-cyan-300",
        icon: Gauge
      };
    case "Skeptic":
      return {
        bannerGlow: "from-slate-500/20 via-zinc-500/20 to-slate-500/10",
        badgeBg: "bg-slate-500/10 border-slate-400/20 text-slate-300",
        icon: HelpCircle
      };
    default:
      return {
        bannerGlow: "from-blue-500/20 via-sky-500/20 to-blue-500/10",
        badgeBg: "bg-blue-500/10 border-blue-400/20 text-blue-300",
        icon: Sparkles
      };
  }
};

export default function WishReveal({ wish, allWishes = [], onReset, lang }: WishRevealProps) {
  const t = translations[lang];

  const groupValue = wish.group || "Builder";
  const meta = getGroupMetadata(groupValue);
  const GroupIcon = meta.icon;

  // Filter colleagues in the same group, excluding the currently revealed person
  const sameGroupWishes = allWishes.filter(
    (item) => (item.group || "Builder") === groupValue && item.id !== wish.id
  );

  // Format the ISO date nicely based on current language selection
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (lang === "zh") {
        return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
      }
      if (lang === "ja") {
        return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
      }
      // English format
      const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    } catch {
      return lang === "en" ? "June 9, 2026" : "2026年06月09日";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 30 }}
      transition={{ type: "spring", damping: 20, stiffness: 100 }}
      className="relative max-w-2xl w-full p-0.5 mt-12"
    >
      {/* Decorative Outer Celestial Hover Blur Glow tuned to the group specific colors */}
      <div className={`absolute -inset-1 bg-gradient-to-r ${meta.bannerGlow} rounded-3xl blur-[20px] opacity-75 animate-pulse pointer-events-none`} />

      {/* Main Glass Postcard Container */}
      <div className="relative bg-[#050505]/95 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-2xl overflow-visible flex flex-col items-center">
        
        {/* Sparkle background elements inside card */}
        <div className="absolute -left-10 -top-10 w-40 h-40 nebula-glow-1 rounded-full pointer-events-none" />
        <div className="absolute -right-10 -bottom-10 w-40 h-40 nebula-glow-2 rounded-full pointer-events-none" />

        {/* Decorative thin corner elements */}
        <div className="absolute top-4 left-4 w-2 h-2 border-t border-l border-white/20"></div>
        <div className="absolute top-4 right-4 w-2 h-2 border-t border-r border-white/20"></div>
        <div className="absolute bottom-4 left-4 w-2 h-2 border-b border-l border-white/20"></div>
        <div className="absolute bottom-4 right-4 w-2 h-2 border-b border-r border-white/20"></div>

        {/* 1. Employee Photo/Avatar masked with pure dark body offset */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 md:w-26 md:h-26"
        >
          {/* Outer elegant dash orbit rim */}
          <div className="absolute -inset-1.5 rounded-full border border-dashed border-white/10 animate-spin pointer-events-none" style={{ animationDuration: "14s" }} />

          {/* Spheroid Photo Frame */}
          <div className="w-full h-full rounded-full overflow-hidden border-4 border-[#050505] bg-[#1A1A1A] shadow-2xl flex items-center justify-center">
            {wish.photoUrl.startsWith("data:") || wish.photoUrl.startsWith("http") ? (
              <img
                src={wish.photoUrl}
                alt={wish.username}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover select-none pointer-events-none hover:scale-110 transition-all duration-500"
              />
            ) : (
              // Backup Initials Display
              <span className="text-2xl font-light text-white/40 font-display">
                {wish.username.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
        </motion.div>

        {/* 2. Headline Time Flag */}
        <div className="text-center w-full mt-12 mb-4">
          <p className="text-[10px] uppercase tracking-[0.3em] text-blue-400 mb-2 font-mono font-medium flex items-center justify-center gap-1.5">
            <Sparkles className="w-3 h-3 text-blue-400 animate-pulse" />
            {t.retrievedLegacy}: {formatDate(wish.createdAt)}
          </p>
        </div>

        {/* Archetype group tag */}
        <div className="mb-6">
          <span className={`inline-flex items-center gap-1.5 px-3.5 py-1 text-xs font-mono font-bold rounded-full border ${meta.badgeBg}`}>
            <GroupIcon className="w-3.5 h-3.5" />
            {t[`group${groupValue}` as keyof typeof t] || groupValue}
          </span>
        </div>

        {/* 3. The Goal Content (Elegant light italic with quotation margins) */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full text-center px-4 mb-5"
        >
          <p className="text-xl md:text-2xl font-light tracking-tight text-white leading-relaxed italic whitespace-pre-wrap font-sans max-h-52 overflow-y-auto pr-1 select-text">
            "{wish.wish}"
          </p>
        </motion.div>

        {/* 4. Employee metadata details */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center w-full flex flex-col items-center mb-6"
        >
          <span className="text-sm font-semibold text-white/95 tracking-wide">
            {wish.username}
          </span>
          <span className="text-[11px] text-white/40 font-mono mt-1 flex items-center gap-1 select-all">
            <Mail className="w-3.5 h-3.5 opacity-60 text-blue-400" />
            {wish.email}
          </span>
        </motion.div>

        {/* 5. Same Archetype Companions Corridor */}
        {sameGroupWishes.length > 0 && (
          <div className="w-full mt-2 pt-6 border-t border-white/5 text-left mb-6">
            <h4 className="text-[11px] uppercase tracking-[0.2em] text-white/70 mb-1 font-display font-semibold flex items-center gap-2">
              <GroupIcon className="w-3.5 h-3.5 text-blue-400 opacity-80" />
              <span>{t.sameGroupColleagues} ({sameGroupWishes.length})</span>
            </h4>
            <p className="text-[10px] text-white/30 mb-3.5">
              {t.sameGroupDesc}
            </p>
            
            {/* Scrollable listing */}
            <div className="flex gap-3.5 overflow-x-auto pb-4 scrollbar-thin snap-x">
              {sameGroupWishes.map((peer) => (
                <div 
                  key={peer.id}
                  className="flex-shrink-0 w-64 bg-white/[0.03] border border-white/5 hover:border-white/10 rounded-2xl p-4 snap-center transition"
                >
                  <div className="flex items-center gap-3 mb-2.5">
                    <img 
                      src={peer.photoUrl} 
                      alt={peer.username} 
                      className="w-7 h-7 rounded-full object-cover border border-white/10"
                    />
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-white/95 truncate">{peer.username}</p>
                      <p className="text-[9px] text-white/40 font-mono truncate w-40">{peer.email}</p>
                    </div>
                  </div>
                  <p className="text-xs text-white/70 line-clamp-3 leading-relaxed italic select-text">
                    "{peer.wish}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. Safe Action re-seal button */}
        <motion.button
          id="btn-reseal-capsule"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white text-xs font-bold uppercase tracking-widest rounded-full transition-all cursor-pointer select-none"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {t.resealCapsule}
        </motion.button>
      </div>
    </motion.div>
  );
}
