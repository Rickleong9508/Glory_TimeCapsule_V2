import { useState, useEffect } from "react";
import { WishRecord, Language } from "./types";
import { motion, AnimatePresence } from "motion/react";
import ParticleCanvas from "./components/ParticleCanvas";
import TimeCapsuleObject from "./components/TimeCapsuleObject";
import WishReveal from "./components/WishReveal";
import AdminPanel from "./components/AdminPanel";
import { Settings, Sparkles, AlertCircle, HelpCircle, Loader2, ArrowRight } from "lucide-react";
import { translations } from "./locales";

export default function App() {
  // Locale State
  const [lang, setLang] = useState<Language>("en");
  const t = translations[lang];

  // Database states
  const [wishes, setWishes] = useState<WishRecord[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);

  // Interaction/Query states
  const [identifier, setIdentifier] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [capsuleStatus, setCapsuleStatus] = useState<"idle" | "error" | "found">("idle");
  const [searchError, setSearchError] = useState<string | null>(null);

  // Optical flash overlay transition state
  const [flashActive, setFlashActive] = useState(false);

  // Reveal states
  const [isOpen, setIsOpen] = useState(false);
  const [focusedWish, setFocusedWish] = useState<WishRecord | null>(null);

  // Canvas visual trigger (count-based force trigger)
  const [burstTrigger, setBurstTrigger] = useState(0);

  // Panel states
  const [showAdmin, setShowAdmin] = useState(false);

  // Admin password validation states
  const [showPasswordGate, setShowPasswordGate] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isAdminVerified, setIsAdminVerified] = useState(false);

  // Fetch all wishes on mount to feed admin panel and keep stats accurate
  const fetchWishes = async () => {
    try {
      const res = await fetch("/api/wishes");
      const data = await res.json();
      if (data.success) {
        setWishes(data.wishes);
      }
    } catch (err) {
      console.error("Failed to sync wishes database:", err);
    } finally {
      setLoadingDb(false);
    }
  };

  useEffect(() => {
    fetchWishes();
  }, []);

  // Standard user queries their wish
  const handleQueryWish = async (overrideIdentifier?: string) => {
    const searchVal = (overrideIdentifier || identifier).trim();
    if (!searchVal) {
      setSearchError(t.inputError);
      setCapsuleStatus("error");
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setCapsuleStatus("idle");

    try {
      const res = await fetch("/api/wishes/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: searchVal }),
      });

      const data = await res.json();

      if (data.success && data.wish) {
        // Successful verification!
        setFocusedWish(data.wish);
        setCapsuleStatus("found");
        
        // Timeout to simulate magical mechanical unpacking mechanism
        setTimeout(() => {
          setIsOpen(true);
          setFlashActive(true); // Fire golden-white nostalgic light flash
          setBurstTrigger((prev) => prev + 1); // Blast particle sparkles
          setIsSearching(false);

          // Fade out flash smoothly
          setTimeout(() => {
            setFlashActive(false);
          }, 900);
        }, 1200);
      } else {
        // Record not found
        setCapsuleStatus("error");
        setSearchError(data.error || t.notFoundError);
        setIsSearching(false);
      }
    } catch {
      setCapsuleStatus("error");
      setSearchError(t.serverError);
      setIsSearching(false);
    }
  };

  // Close the current postcard reveal, fold down capsule
  const handleResetCapsule = () => {
    setIsOpen(false);
    setFocusedWish(null);
    setCapsuleStatus("idle");
    setSearchError(null);
  };

  // Pre-fill a query search directly from clicking on Admin Preview List
  const handleAdminPreviewCall = (targetIdentifier: string) => {
    setIdentifier(targetIdentifier);
    handleQueryWish(targetIdentifier);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#050505] overflow-x-hidden flex flex-col justify-between">
      
      {/* 1. Starry sky canvas layer */}
      <ParticleCanvas triggerBurst={burstTrigger} />

      {/* 1.1 Magical Screen Flash Overlay */}
      <AnimatePresence>
        {flashActive && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: [1, 0.8, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="fixed inset-0 bg-white/45 pointer-events-none z-50 mix-blend-screen"
          />
        )}
      </AnimatePresence>

      {/* 2. Abstract Ambient Nebula Orbs */}
      <div className="absolute top-[10%] left-[20%] w-[50vw] h-[50vw] nebula-glow-1 rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-[20%] right-[10%] w-[45vw] h-[45vw] nebula-glow-2 rounded-full pointer-events-none z-0" />
      <div className="absolute top-[40%] right-[30%] w-[35vw] h-[35vw] nebula-glow-3 rounded-full pointer-events-none z-0" />

      {/* 3. Header Actions Panel */}
      <header className="relative w-full z-20 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        
        {/* Company Title */}
        <div className="flex items-center gap-2.5">
          <div className="relative p-2.5 bg-white/5 rounded-full border border-white/10 shadow-lg text-blue-400">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div className="text-left">
            <h1 className="text-sm md:text-base font-display font-semibold tracking-wider text-white uppercase">
              {t.appTitle}
            </h1>
            <p className="text-[10px] md:text-xs text-white/40 font-mono tracking-wide">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Floating controls */}
        <div className="flex items-center gap-3">
          
          {/* Language Switcher */}
          <div className="flex bg-white/5 border border-white/10 p-0.5 rounded-full backdrop-blur-md">
            {(["en", "zh", "ja"] as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`text-[9px] md:text-[10px] font-mono font-bold tracking-wider px-2 py-1 rounded-full transition-all cursor-pointer ${
                  lang === l
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-white/40 hover:text-white/80"
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Coordinator Panel Button */}
          <button
            id="btn-admin-panel"
            onClick={() => {
              if (isAdminVerified) {
                setShowAdmin(true);
              } else {
                setShowPasswordGate(true);
                setPasswordInput("");
                setPasswordError(null);
              }
            }}
            className="flex items-center gap-2 py-2 px-3 md:px-4 bg-white/5 hover:bg-white/10 text-xs text-white/80 hover:text-white border border-white/10 rounded-full font-display font-medium shadow-md transition-all cursor-pointer backdrop-blur-md select-none"
          >
            <Settings className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">{t.adminPanel}</span>
            {wishes.length > 0 && (
              <span className="bg-blue-500/20 border border-blue-400/25 text-blue-300 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold">
                {wishes.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* 4. Core Central Stage Content */}
      <motion.main
        animate={isSearching ? {
          x: [0, -1.5, 1.5, -1, 1, -1.5, 1.5, 0],
          y: [0, 1.2, -1.2, 0.8, -0.8, 1.2, -1.2, 0]
        } : {}}
        transition={{ duration: 0.15, repeat: Infinity, ease: "linear" }}
        className="relative flex-1 z-20 flex flex-col items-center justify-center max-w-5xl w-full mx-auto px-6 py-4"
      >
        <AnimatePresence mode="wait">
          {!isOpen ? (
            
            // Search & Capsule Selection Mode
            <motion.div
              key="capsule-search-stage"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full flex flex-col items-center justify-center space-y-10"
            >
              
              {/* Introduction Text Block */}
              <div className="text-center space-y-3.5 mt-2">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-light tracking-tight text-white leading-tight">
                  {t.mainHeadingStart}<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-blue-300">{t.mainHeadingEnd}</span>
                </h2>
                
                <p className="text-sm md:text-base text-white/45 max-w-xl mx-auto leading-relaxed font-light">
                  {t.mainDescription}
                </p>
              </div>

              {/* Time Capsule Animative Core Canvas */}
              <TimeCapsuleObject
                isOpen={isOpen}
                onClick={() => handleQueryWish()}
                isSearching={isSearching}
                status={capsuleStatus}
                lang={lang}
              />

              {/* Precise Query Box Controller */}
              <div className="w-full max-w-md space-y-3.5">
                <div className="flex flex-col md:flex-row items-stretch gap-2 bg-white/5 border border-white/10 rounded-full p-2 shadow-2xl focus-within:border-blue-500/40 transition-all backdrop-blur-2xl">
                  <div className="flex-1 flex items-center px-4 py-1">
                    <input
                      type="text"
                      required
                      placeholder={t.inputPlaceholder}
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        if (searchError) setSearchError(null);
                        if (capsuleStatus === "error") setCapsuleStatus("idle");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleQueryWish();
                      }}
                      disabled={isSearching}
                      className="w-full bg-transparent border-none text-white/80 placeholder-white/20 text-sm focus:outline-none focus:ring-0"
                    />
                  </div>
                  
                  <button
                    id="btn-trigger-reveal"
                    onClick={() => handleQueryWish()}
                    disabled={isSearching}
                    className="py-3 px-6 bg-blue-600 text-white font-display font-bold uppercase tracking-widest transition-all ease-out rounded-full text-xs flex items-center justify-center gap-1.5 hover:bg-blue-500 active:scale-95 cursor-pointer disabled:opacity-50 select-none"
                  >
                    {isSearching ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        {t.openCapsuleBtn}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>

                {/* Inline Helper / Error Alerts */}
                <AnimatePresence mode="wait">
                  {searchError ? (
                    <motion.div
                      key="error-badge"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-start gap-2 text-xs bg-red-950/30 border border-red-500/20 text-red-400 px-5 py-3.5 rounded-2xl text-left"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">{t.failCheck}</p>
                        <p className="text-[11px] text-red-400/80 mt-0.5">{searchError}</p>
                      </div>
                    </motion.div>
                  ) : (
                    // Default helpful demo indicators
                    <motion.div
                      key="demo-badge"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[10px] md:text-xs text-white/20 uppercase tracking-[0.2em] font-mono text-center flex items-center justify-center gap-2"
                    >
                      <HelpCircle className="w-3.5 h-3.5 opacity-60" />
                      <span>{t.demoHelperText}<strong className="text-white/40">alice</strong>{t.or}<strong className="text-white/40">bob</strong></span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </motion.div>
          ) : (
            
            // Postcard Reveal Wish mode
            <motion.div
              key="wish-reveal-stage"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex items-center justify-center p-2"
            >
              {focusedWish && (
                <WishReveal
                  wish={focusedWish}
                  allWishes={wishes}
                  onReset={handleResetCapsule}
                  lang={lang}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.main>

      {/* 5. Fine polished credit banner footer */}
      <footer className="z-10 w-full max-w-7xl mx-auto px-6 md:px-12 py-8 flex justify-between items-end border-t border-white/5 text-left pointer-events-none">
        <div className="space-y-1">
          <p className="text-[9px] text-white/30 uppercase tracking-tighter">{t.projectCapsule}</p>
          <p className="text-xs font-semibold tracking-widest text-white/60">{t.fiveYearRec}</p>
        </div>
        <div className="text-[10px] text-white/20 text-right font-mono uppercase tracking-wider">
          {t.confidentialNotice}<br />
          {t.legacyDept}
        </div>
      </footer>

      {/* 6. Coordinator Control Panel drawer portal */}
      <AnimatePresence>
        {showAdmin && (
          <AdminPanel
            onClose={() => setShowAdmin(false)}
            wishes={wishes}
            onRefresh={fetchWishes}
            onPreviewWish={handleAdminPreviewCall}
            lang={lang}
          />
        )}
      </AnimatePresence>

      {/* 7. Beautiful Cyber-Themed Admin Password Gate Modal */}
      <AnimatePresence>
        {showPasswordGate && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 z-50 select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 border-blue-500/20"
            >
              <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto">
                <Settings className="w-5 h-5 animate-pulse" />
              </div>

              <div className="text-center space-y-1.5 animate-pulse-slow">
                <h4 className="text-sm font-semibold text-slate-100 uppercase tracking-widest font-display">
                  {lang === "zh" ? "系统安全钥匙" : "System Security Key"}
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto font-sans">
                  {lang === "zh"
                    ? "此区块属于专属后台控制台。请输入默认系统钥匙以访问数据修改权限。"
                    : "This tier belongs to direct database administration. Please supply the system password to obtain full modifications control."}
                </p>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="password"
                    autoFocus
                    placeholder={lang === "zh" ? "请输入默认系统密码" : "Enter management password"}
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (passwordInput === "glory1234") {
                          setIsAdminVerified(true);
                          setShowPasswordGate(false);
                          setShowAdmin(true);
                        } else {
                          setPasswordError(lang === "zh" ? "安全钥匙不正确，访问被拒绝" : "Credential error. Verification unsuccessful.");
                        }
                      }
                    }}
                    className="w-full bg-[#101726]/90 text-center font-mono text-sm tracking-widest text-emerald-400 placeholder-slate-700 border border-slate-800/80 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all shadow-inner"
                  />
                </div>

                {passwordError && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/15 text-red-400 text-[10px] text-center font-medium font-mono"
                  >
                    {passwordError}
                  </motion.div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordGate(false);
                    setPasswordError(null);
                  }}
                  className="flex-1 bg-slate-800/80 hover:bg-slate-700 hover:text-white border border-slate-700/60 py-2 rounded-xl text-xs font-medium text-slate-300 transition cursor-pointer"
                >
                  {lang === "zh" ? "取消" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (passwordInput === "glory1234") {
                      setIsAdminVerified(true);
                      setShowPasswordGate(false);
                      setShowAdmin(true);
                    } else {
                      setPasswordError(lang === "zh" ? "安全钥匙不正确，访问被拒绝" : "Credential error. Verification unsuccessful.");
                    }
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white py-2 rounded-xl text-xs font-semibold shadow-md transition cursor-pointer"
                >
                  {lang === "zh" ? "验证访问" : "Verify Key"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
