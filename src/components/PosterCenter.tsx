import { useState, useEffect, useMemo, useRef } from "react";
import { WishRecord, Language, PosterTemplate, ColleagueGroup } from "../types";
import { Search, Loader2, ArrowRight, Download, Sparkles, AlertCircle, Eye, RefreshCw, User, Mail, Award } from "lucide-react";
import { translations } from "../locales";
import { motion, AnimatePresence } from "motion/react";

interface PosterCenterProps {
  wishes: WishRecord[];
  lang: Language;
  previewIdentifier?: string | null;
  onClearPreview?: () => void;
}

export default function PosterCenter({ wishes, lang, previewIdentifier, onClearPreview }: PosterCenterProps) {
  const t = translations[lang];

  // States
  const [searchVal, setSearchVal] = useState("");
  const [activeWish, setActiveWish] = useState<WishRecord | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  const [templates, setTemplates] = useState<Record<string, PosterTemplate>>({});
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  // Monitor previewIdentifier to auto-select and load a colleague's wish for poster previewing
  useEffect(() => {
    if (previewIdentifier) {
      const queryClean = previewIdentifier.toLowerCase();
      const matched = wishes.find(item => {
        return item.email.toLowerCase() === queryClean || item.username.toLowerCase() === queryClean;
      });
      if (matched) {
        setActiveWish(matched);
        setSearchVal(matched.username);
        setSearchError(null);
      }
      if (onClearPreview) {
        onClearPreview();
      }
    }
  }, [previewIdentifier, wishes, onClearPreview]);

  // Fetch poster templates on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch("/api/poster-templates");
        const data = await res.json();
        if (data.success) {
          setTemplates(data.templates);
        }
      } catch (err) {
        console.error("Failed to load poster templates:", err);
      } finally {
        setLoadingTemplates(false);
      }
    };
    fetchTemplates();
  }, []);

  // Filter colleague wishes who are in the same group as the active wish
  const sameGroupWishes = useMemo(() => {
    if (!activeWish) return [];
    const grpValue = activeWish.group || "Builder";
    return wishes.filter(w => (w.group || "Builder") === grpValue);
  }, [wishes, activeWish]);

  // Handle searching and creating a poster
  const handleSearchPoster = async (overrideValue?: string) => {
    const val = (overrideValue || searchVal).trim();
    if (!val) {
      setSearchError(lang === "zh" ? "请输入电子邮箱或拼音名进行海报检索" : "Please enter your email or name!");
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    // Simulate search
    const queryClean = val.toLowerCase();
    const matched = wishes.find(item => {
      return item.email.toLowerCase() === queryClean || item.username.toLowerCase() === queryClean;
    });

    setTimeout(() => {
      if (matched) {
        setActiveWish(matched);
        setSearchVal(matched.username);
      } else {
        setSearchError(lang === "zh" ? "未能在时空数据库中找到您的心愿，请联系管理员录入首版数据。" : "Profile not found. Suggest checking spelling or contacting admin.");
      }
      setIsSearching(false);
    }, 600);
  };

  // Helper to draw gradients for canvas fallback
  const drawVerticalGradient = (ctx: CanvasRenderingContext2D, width: number, height: number, group: ColleagueGroup) => {
    const grad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, Math.max(width, height) * 0.8);
    
    switch (group) {
      case "Visionary":
        grad.addColorStop(0, "#1e1b4b");
        grad.addColorStop(0.5, "#0f172a");
        grad.addColorStop(1, "#311042");
        break;
      case "Lead":
        grad.addColorStop(0, "#1e1b4b");
        grad.addColorStop(0.5, "#0f172a");
        grad.addColorStop(1, "#451a03");
        break;
      case "Builder":
        grad.addColorStop(0, "#022c22");
        grad.addColorStop(0.5, "#0f172a");
        grad.addColorStop(1, "#064e3b");
        break;
      case "Connector":
        grad.addColorStop(0, "#4c0519");
        grad.addColorStop(0.5, "#0f172a");
        grad.addColorStop(1, "#500724");
        break;
      case "Pragmatist":
        grad.addColorStop(0, "#083344");
        grad.addColorStop(0.5, "#0f172a");
        grad.addColorStop(1, "#0f172a");
        break;
      case "Skeptic":
        grad.addColorStop(0, "#18181b");
        grad.addColorStop(0.5, "#09090b");
        grad.addColorStop(1, "#27272a");
        break;
      default:
        grad.addColorStop(0, "#0c1024");
        grad.addColorStop(0.5, "#05070e");
        grad.addColorStop(1, "#1e3a8a");
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Subtle overlay effects like digital grid or stardust
    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  // Generate and Download high-resolution PNG poster
  const downloadPoster = async () => {
    if (!activeWish) return;
    setIsDownloading(true);

    const groupVal = activeWish.group || "Builder";
    const template = templates[groupVal] || {
      group: groupVal,
      background: "",
      photoX: 50,
      photoY: 28,
      photoSize: 180,
      nameX: 50,
      nameY: 44,
      nameColor: "#FFFFFF",
      nameSize: 28,
      goalX: 50,
      goalY: 65,
      goalWidth: 80,
      goalColor: "#ECFDF5",
      goalSize: 18,
      goalLineHeight: 1.5,
    };

    const getCorsSafeUrl = (url: string) => {
      if (!url) return "";
      if (url.startsWith("data:")) return url;
      const separator = url.includes("?") ? "&" : "?";
      return `${url}${separator}t=${Date.now()}`;
    };

    try {
      // Ensure google web fonts are loaded so they draw properly on Canvas
      if (typeof document !== "undefined" && document.fonts) {
        await document.fonts.ready;
      }

      const width = 800;
      const height = 1200;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // 1. Draw Background
      if (template.background) {
        const bgImg = new Image();
        bgImg.crossOrigin = "anonymous";
        await new Promise((resolve) => {
          bgImg.onload = () => {
            ctx.drawImage(bgImg, 0, 0, width, height);
            resolve(true);
          };
          bgImg.onerror = () => {
            // fallback
            drawVerticalGradient(ctx, width, height, groupVal);
            resolve(false);
          };
          bgImg.src = getCorsSafeUrl(template.background);
        });
      } else {
        drawVerticalGradient(ctx, width, height, groupVal);
      }

      // Add a cool technical overlay (corner brackets, headers)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 2;
      // Corner elements
      const offset = 30;
      const len = 25;
      // top left
      ctx.beginPath(); ctx.moveTo(offset, offset + len); ctx.lineTo(offset, offset); ctx.lineTo(offset + len, offset); ctx.stroke();
      // top right
      ctx.beginPath(); ctx.moveTo(width - offset, offset + len); ctx.lineTo(width - offset, offset); ctx.lineTo(width - offset - len, offset); ctx.stroke();
      // bottom left
      ctx.beginPath(); ctx.moveTo(offset, height - offset - len); ctx.lineTo(offset, height - offset); ctx.lineTo(offset + len, height - offset); ctx.stroke();
      // bottom right
      ctx.beginPath(); ctx.moveTo(width - offset, height - offset - len); ctx.lineTo(width - offset, height - offset); ctx.lineTo(width - offset - len, height - offset); ctx.stroke();

      // Top branding text
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.font = "bold 13px 'JetBrains Mono', monospace";
      ctx.letterSpacing = "4px";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("GLORY V2035 TIME CAPSULE RECORD", width / 2, 60);

      // Bottom chronicle watermark
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      ctx.font = "12px 'JetBrains Mono', monospace";
      ctx.letterSpacing = "2px";
      ctx.fillText("EST. 2026 // CHRONICLE FUTURE LOGISTICS", width / 2, height - 60);

      // 2. Load and Draw employee profile photo
      const photoImg = new Image();
      photoImg.crossOrigin = "anonymous";
      const phX = (template.photoX / 100) * width;
      const phY = (template.photoY / 100) * height;
      const r = template.photoSize / 2;

      await new Promise((resolve) => {
        photoImg.onload = () => {
          ctx.save();
          ctx.beginPath();
          ctx.arc(phX, phY, r, 0, Math.PI * 2, true);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(photoImg, phX - r, phY - r, r * 2, r * 2);
          ctx.restore();

          // draw golden or metallic glowing thin border outline
          ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(phX, phY, r + 2, 0, Math.PI * 2);
          ctx.stroke();
          resolve(true);
        };
        photoImg.onerror = () => {
          // Empty avatar circle if it fails
          ctx.fillStyle = "#334155";
          ctx.beginPath();
          ctx.arc(phX, phY, r, 0, Math.PI * 2);
          ctx.fill();
          resolve(false);
        };
        photoImg.src = getCorsSafeUrl(activeWish.photoUrl);
      });

      // 3. Draw Colleague's Name
      const scaleFactor = 800 / 420; // Exact scaling factor from preview DOM size to high-res canvas size
      const nameFontSize = (template.nameSize || 28) * 0.7 * scaleFactor;
      const groupFontSize = (template.groupSize || 14) * 0.7 * scaleFactor;
      const emailFontSize = (template.emailSize || 16) * 0.7 * scaleFactor;
      const goalFontSize = (template.goalSize || 18) * 0.72 * scaleFactor;

      const nX = (template.nameX / 100) * width;
      const nY = (template.nameY / 100) * height;
      ctx.fillStyle = template.nameColor || "#FFFFFF";
      ctx.font = `bold ${nameFontSize}px 'Outfit', sans-serif`;
      ctx.letterSpacing = "0px";
      ctx.textAlign = (template.nameAlign || "center") as CanvasTextAlign;
      ctx.textBaseline = "middle";
      ctx.fillText(activeWish.username.toUpperCase(), nX, nY);

      // Draw Group Archetype text badge customizable layout
      if ((template.groupVisible ?? true) !== false) {
        const grpValStr = lang === "zh" ? (translations.zh[`group${groupVal as ColleagueGroup}` as keyof typeof translations.zh] || groupVal) : groupVal;
        const gpX = ((template.groupX !== undefined ? template.groupX : 50) / 100) * width;
        const gpY = ((template.groupY !== undefined ? template.groupY : 41) / 100) * height;
        ctx.fillStyle = template.groupColor || "#38BDF8";
        ctx.font = `bold ${groupFontSize}px 'JetBrains Mono', monospace`;
        ctx.letterSpacing = "2px";
        ctx.textAlign = (template.groupAlign || "center") as CanvasTextAlign;
        ctx.textBaseline = "middle";
        ctx.fillText(grpValStr.toUpperCase(), gpX, gpY);
      }

      // 3.5. Draw Colleague's Email
      const eX = ((template.emailX !== undefined ? template.emailX : 50) / 100) * width;
      const eY = ((template.emailY !== undefined ? template.emailY : 49) / 100) * height;
      ctx.fillStyle = template.emailColor || "#94A3B8";
      ctx.font = `${emailFontSize}px 'JetBrains Mono', monospace`;
      ctx.letterSpacing = "0px";
      ctx.textAlign = (template.emailAlign || "center") as CanvasTextAlign;
      ctx.textBaseline = "middle";
      ctx.fillText(activeWish.email, eX, eY);

      // 4. Draw Goal / Wish Setting text
      const gX = (template.goalX / 100) * width;
      const gY = (template.goalY / 100) * height;
      const gW = (template.goalWidth / 100) * width;
      
      ctx.fillStyle = template.goalColor || "#E0E7FF";
      ctx.font = `italic ${goalFontSize}px 'Inter', sans-serif`;
      ctx.letterSpacing = "0px";
      
      const alignVal = template.goalAlign || "center";
      ctx.textAlign = alignVal as CanvasTextAlign;

      const padTop = template.goalPaddingTop !== undefined ? template.goalPaddingTop : 20;
      const padBottom = template.goalPaddingBottom !== undefined ? template.goalPaddingBottom : 20;
      const padLeft = template.goalPaddingLeft !== undefined ? template.goalPaddingLeft : 40;
      const padRight = template.goalPaddingRight !== undefined ? template.goalPaddingRight : 40;

      const padTopScaled = padTop * scaleFactor;
      const padBottomScaled = padBottom * scaleFactor;
      const padLeftScaled = padLeft * scaleFactor;
      const padRightScaled = padRight * scaleFactor;

      let textX = gX;
      if (alignVal === "left") {
        textX = gX - gW / 2 + padLeftScaled;
      } else if (alignVal === "right") {
        textX = gX + gW / 2 - padRightScaled;
      }

      const showBgBox = (template.goalBgVisible ?? true) !== false;
      const wishVal = `“${activeWish.wish}”`;
      const approxLineHeight = goalFontSize * (template.goalLineHeight ?? 1.5);
      
      // Compute wrapping lines
      const hasSpaces = wishVal.includes(" ");
      const words = hasSpaces ? wishVal.split(" ") : wishVal.split("");
      let line = "";
      const lines: string[] = [];

      for (let n = 0; n < words.length; n++) {
        const spacer = hasSpaces ? " " : "";
        const testLine = line + words[n] + spacer;
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > gW - (padLeftScaled + padRightScaled) && n > 0) {
          lines.push(line);
          line = words[n] + spacer;
        } else {
          line = testLine;
        }
      }
      lines.push(line);

      // Vertically center the card box around gY, matching the CSS flex/translate behaviour
      const boxHeight = lines.length * approxLineHeight + padTopScaled + padBottomScaled;
      const cardTopY = gY - boxHeight / 2;

      if (showBgBox) {
        // Draw a subtle translucent card background to capture modern frosted glass
        ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.beginPath();
        ctx.roundRect(gX - gW / 2, cardTopY, gW, boxHeight, 12 * scaleFactor);
        ctx.fill();
        ctx.stroke();
      }

      // Write lines inside card
      ctx.fillStyle = template.goalColor || "#ECFDF5";
      ctx.font = `italic ${goalFontSize}px 'Inter', sans-serif`;
      ctx.textBaseline = "alphabetic";

      lines.forEach((l, idx) => {
        const lineY = cardTopY + padTopScaled + (idx + 0.72) * approxLineHeight;
        ctx.fillText(l.trim(), textX, lineY);
      });

      // Export as PNG
      const link = document.createElement("a");
      link.download = `${activeWish.username}_Glory2035_Poster.png`;
      link.href = canvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      console.error("Error creating poster for download:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  // Pre-load default or custom styling for card view in browser
  const activeTemplate = activeWish ? (templates[activeWish.group || "Builder"]) : null;

  return (
    <div className="w-full space-y-12 py-4">
      
      {/* Search Bar / Entry Form */}
      <div className="max-w-xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-2xl md:text-3xl font-display font-semibold tracking-wide text-white uppercase flex items-center justify-center gap-2">
            <Award className="w-6 h-6 text-amber-400" />
            {lang === "zh" ? "专属时空海报生成" : "Poster Creator Studio"}
          </h3>
          <p className="text-xs text-white/50 font-sans tracking-wide">
            {lang === "zh" 
              ? "系统将自动合并您所属组别的定制海报，包含您的照片、英文简称以及五载奋斗目标目标规划。" 
              : "Automatically formats your exclusive group visual design with your name, photo, and 5-year career blueprint."}
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-stretch gap-2.5 bg-white/5 border border-white/10 rounded-full p-2 backdrop-blur-md shadow-2xl focus-within:border-blue-500/40 transition">
          <div className="flex-1 flex items-center px-4 py-1">
            <Search className="w-4 h-4 text-blue-400/60 mr-2.5 shrink-0" />
            <input
              type="text"
              placeholder={lang === "zh" ? "输入您的注册电子邮箱或拼音名字" : "Enter registered email or username"}
              value={searchVal}
              onChange={(e) => {
                setSearchVal(e.target.value);
                if (searchError) setSearchError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearchPoster();
              }}
              disabled={isSearching}
              className="w-full bg-transparent border-none text-white text-sm focus:outline-none placeholder-white/20"
            />
          </div>

          <button
            onClick={() => handleSearchPoster()}
            disabled={isSearching}
            className="py-3 px-6 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-display font-medium rounded-full text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <>
                <span>{lang === "zh" ? "生成专属海报" : "Generate Poster"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {searchError && (
          <div className="p-3 bg-red-950/20 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-start gap-2 max-w-md mx-auto">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{searchError}</span>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeWish && (
          <motion.div
            key={`poster-display-${activeWish.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start max-w-5xl mx-auto"
          >
            {/* LEFT: Live Interactive Poster Canvas Mockup */}
            <div className="lg:col-span-7 flex flex-col items-center">
              
              {/* Poster frame mimicking paper layout */}
              <div 
                id="interactive-poster-card"
                className="relative w-full max-w-[420px] aspect-[2/3] bg-slate-950 shadow-2xl rounded-2xl border border-white/10 overflow-hidden select-none"
              >
                {/* 1. Backdrop layer: Uploaded design or default gradients */}
                {activeTemplate?.background ? (
                  <img 
                    src={activeTemplate.background} 
                    alt="Poster background" 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  // Gradient fallback
                  <div className={`absolute inset-0 bg-gradient-to-b ${
                    activeWish.group === "Visionary" ? "from-indigo-950 via-slate-900 to-purple-950" :
                    activeWish.group === "Lead" ? "from-indigo-950 via-slate-900 to-amber-950" :
                    activeWish.group === "Builder" ? "from-slate-950 via-slate-900 to-emerald-950" :
                    activeWish.group === "Connector" ? "from-slate-950 via-slate-900 to-rose-950" :
                    activeWish.group === "Pragmatist" ? "from-teal-950 via-slate-900 to-blue-950" :
                    "from-zinc-950 via-slate-900 to-slate-950"
                  } flex flex-col justify-between`} style={{
                    backgroundImage: "radial-gradient(circle at center, rgba(255,255,255,0.02) 0%, rgba(0,0,0,0) 80%)"
                  }} />
                )}

                {/* Cyber Brackets Overlay */}
                <div className="absolute top-4 left-4 w-12 h-12 border-t border-l border-white/10" />
                <div className="absolute top-4 right-4 w-12 h-12 border-t border-r border-white/10" />
                <div className="absolute bottom-4 left-4 w-12 h-12 border-b border-l border-white/10" />
                <div className="absolute bottom-4 right-4 w-12 h-12 border-b border-r border-white/10" />

                {/* Default Branding Header */}
                <div className="absolute top-10 inset-x-0 text-center pointer-events-none">
                  <span className="text-[9px] uppercase tracking-[0.4em] font-mono text-white/30">
                    Glory V2035 Time Capsule
                  </span>
                </div>

                {/* Bottom Watermark line */}
                <div className="absolute bottom-8 inset-x-0 text-center pointer-events-none">
                  <span className="text-[8px] font-mono text-white/20 tracking-widest">
                    EST. 2026 CORPORATE STRATEGIC FUTURE
                  </span>
                </div>

                {/* 2. Photo Layer dynamically customized based on percentages */}
                <div 
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                  style={{
                    left: `${activeTemplate?.photoX ?? 50}%`,
                    top: `${activeTemplate?.photoY ?? 28}%`,
                  }}
                >
                  <div 
                    className="rounded-full border-2 border-white/20 shadow-2xl overflow-hidden bg-slate-900"
                    style={{
                      width: `${(activeTemplate?.photoSize ?? 180) * 0.55}px`,
                      height: `${(activeTemplate?.photoSize ?? 180) * 0.55}px`,
                    }}
                  >
                    <img 
                      src={activeWish.photoUrl} 
                      alt={activeWish.username} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* 3. Name Layer */}
                <div 
                  className="absolute"
                  style={{
                    left: activeTemplate?.nameAlign === "right" ? "auto" : `${activeTemplate?.nameX ?? 50}%`,
                    right: activeTemplate?.nameAlign === "right" ? `${100 - (activeTemplate?.nameX ?? 50)}%` : "auto",
                    top: `${activeTemplate?.nameY ?? 44}%`,
                    transform: activeTemplate?.nameAlign === "left" ? "translateY(-50%)" : activeTemplate?.nameAlign === "right" ? "translateY(-50%)" : "translate(-50%, -50%)",
                    textAlign: activeTemplate?.nameAlign ?? "center",
                  }}
                >
                  <h4 
                    className="font-display font-extrabold tracking-wide uppercase shadow-text text-white"
                    style={{
                      fontSize: `${(activeTemplate?.nameSize ?? 28) * 0.7}px`,
                      color: activeTemplate?.nameColor ?? "#FFFFFF",
                      textAlign: activeTemplate?.nameAlign ?? "center",
                    }}
                  >
                    {activeWish.username}
                  </h4>
                </div>

                {/* 3.2. Group Archetype Label Layer */}
                {(activeTemplate?.groupVisible ?? true) !== false && (
                  <div 
                    className="absolute pointer-events-none"
                    style={{
                      left: activeTemplate?.groupAlign === "right" ? "auto" : `${activeTemplate?.groupX ?? 50}%`,
                      right: activeTemplate?.groupAlign === "right" ? `${100 - (activeTemplate?.groupX ?? 50)}%` : "auto",
                      top: `${activeTemplate?.groupY ?? 41}%`,
                      transform: activeTemplate?.groupAlign === "left" ? "translateY(-50%)" : activeTemplate?.groupAlign === "right" ? "translateY(-50%)" : "translate(-50%, -50%)",
                      textAlign: activeTemplate?.groupAlign ?? "center",
                    }}
                  >
                    <p 
                      className="font-mono uppercase tracking-[0.14em] font-extrabold shadow-text"
                      style={{
                        fontSize: `${(activeTemplate?.groupSize ?? 14) * 0.7}px`,
                        color: activeTemplate?.groupColor ?? "#38BDF8",
                        textAlign: activeTemplate?.groupAlign ?? "center",
                      }}
                    >
                      {lang === "zh" ? (translations.zh[`group${activeWish.group || "Builder"}` as keyof typeof translations.zh] || activeWish.group) : activeWish.group}
                    </p>
                  </div>
                )}

                {/* 3.5. Email Layer */}
                <div 
                  className="absolute pointer-events-none"
                  style={{
                    left: activeTemplate?.emailAlign === "right" ? "auto" : `${activeTemplate?.emailX ?? 50}%`,
                    right: activeTemplate?.emailAlign === "right" ? `${100 - (activeTemplate?.emailX ?? 50)}%` : "auto",
                    top: `${activeTemplate?.emailY ?? 49}%`,
                    transform: activeTemplate?.emailAlign === "left" ? "translateY(-50%)" : activeTemplate?.emailAlign === "right" ? "translateY(-50%)" : "translate(-50%, -50%)",
                    textAlign: activeTemplate?.emailAlign ?? "center",
                  }}
                >
                  <p 
                    className="font-mono tracking-normal shadow-text"
                    style={{
                      fontSize: `${(activeTemplate?.emailSize ?? 16) * 0.7}px`,
                      color: activeTemplate?.emailColor ?? "#94A3B8",
                      textAlign: activeTemplate?.emailAlign ?? "center",
                    }}
                  >
                    {activeWish.email}
                  </p>
                </div>

                {/* 4. Goal / Wish Content Box */}
                <div 
                  className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col justify-center transition-all ${
                    (activeTemplate?.goalBgVisible ?? true) !== false
                      ? "rounded-xl border border-white/5 bg-black/45 backdrop-blur-sm"
                      : ""
                  }`}
                  style={{
                    left: `${activeTemplate?.goalX ?? 50}%`,
                    top: `${activeTemplate?.goalY ?? 68}%`,
                    width: `${activeTemplate?.goalWidth ?? 80}%`,
                    paddingTop: `${activeTemplate?.goalPaddingTop ?? 20}px`,
                    paddingBottom: `${activeTemplate?.goalPaddingBottom ?? 20}px`,
                    paddingLeft: `${activeTemplate?.goalPaddingLeft ?? 40}px`,
                    paddingRight: `${activeTemplate?.goalPaddingRight ?? 40}px`,
                    textAlign: activeTemplate?.goalAlign ?? "center",
                    alignItems: activeTemplate?.goalAlign === "left" ? "flex-start" : activeTemplate?.goalAlign === "right" ? "flex-end" : "center",
                  }}
                >
                  <p 
                    className="font-normal italic tracking-tight text-white/95 select-text max-h-[140px] overflow-hidden text-ellipsis w-full"
                    style={{
                      fontSize: `${(activeTemplate?.goalSize ?? 18) * 0.72}px`,
                      color: activeTemplate?.goalColor ?? "#E2E8F0",
                      lineHeight: activeTemplate?.goalLineHeight ?? 1.5
                    }}
                  >
                    “{activeWish.wish}”
                  </p>
                </div>

              </div>
              
              {/* DOWNLOAD BUTTON */}
              <button
                onClick={downloadPoster}
                disabled={isDownloading}
                className="mt-6 flex items-center justify-center gap-2 py-3 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] disabled:opacity-50 text-white font-display font-medium text-xs tracking-wider uppercase rounded-full transition shadow-lg w-full max-w-[420px] cursor-pointer"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{lang === "zh" ? "海报生成设计导出中..." : "Rendering Blueprint..."}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>{lang === "zh" ? "下载我的专属海报" : "Download My Poster"}</span>
                  </>
                )}
              </button>
            </div>

            {/* RIGHT: User Goal Metadata + Profile Panel */}
            <div className="lg:col-span-5 space-y-6 text-left">
              <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 space-y-4">
                <h4 className="text-sm font-semibold text-white tracking-widest uppercase font-display border-b border-white/10 pb-2.5">
                  {lang === "zh" ? "数字奋斗档案" : "Profile Ledger Code"}
                </h4>
                
                <div className="space-y-4 text-xs font-sans text-white/70">
                  <div className="flex items-start gap-3">
                    <User className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-white/30 font-mono tracking-wider">{lang === "zh" ? "同僚账号" : "ACCOUNT ID"}</p>
                      <p className="text-slate-200 mt-0.5 font-medium">{activeWish.username}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-white/30 font-mono tracking-wider">{lang === "zh" ? "认证电子邮箱" : "CORPORATE LEDGER"}</p>
                      <p className="text-slate-200 mt-0.5 font-mono">{activeWish.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Award className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-white/30 font-mono tracking-wider">{lang === "zh" ? "特质分区" : "GROUP ALLOCATION"}</p>
                      <p className="text-slate-200 mt-0.5 font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                        {lang === "zh" ? t[`group${activeWish.group || "Builder"}` as keyof typeof t] : activeWish.group}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informational tip box */}
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-200 p-5 rounded-2xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
                <div className="text-xs space-y-1">
                  <h5 className="font-semibold">{lang === "zh" ? "海报生成器小贴士" : "Branding Designer Note"}</h5>
                  <p className="leading-relaxed text-amber-200/80">
                    {lang === "zh" 
                      ? "管理员拥有【后台管理控制台】。他可以直接配置此组别海报底图背景比例。如果您不满意您照片、大名或文字的位置，可以邀请管理员访问海报底板设置进行像素微调！"
                      : "The administrator can custom upload group-specific backdrops and adjust coordinates from the backend controls in real-time. Contact them if you request minor layout updates."}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SAME GROUP COLLEAGUES: "在下方可以看到同组的所有人员的海报" */}
      {activeWish && sameGroupWishes.length > 0 && (
        <div className="space-y-6 pt-10 border-t border-white/5 text-left">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-lg font-display font-semibold text-white uppercase flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                {lang === "zh" ? "同组伙伴的海报" : "Archetype Group Posters"}
              </h4>
              <p className="text-xs text-white/40 tracking-wide">
                {lang === "zh" 
                  ? `以下是同属【${t[`group${activeWish.group || "Builder"}` as keyof typeof t] || activeWish.group}】组别的同事，点击即可一键跳转与浏览海报。`
                  : `Colleagues in the exact same ${activeWish.group} group. Click any to fetch and review their poster.`}
              </p>
            </div>
            
            <div className="text-right">
              <span className="text-xs font-mono px-3 py-1 bg-white/5 border border-white/10 text-white/40 rounded-full">
                {lang === "zh" ? `组内共: ${sameGroupWishes.length} 人` : `Group members: ${sameGroupWishes.length}`}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {sameGroupWishes.map((peer) => {
              const isActiveThis = peer.id === activeWish.id;
              const peerTemplate = templates[peer.group || "Builder"];

              return (
                <div
                  key={peer.id}
                  onClick={() => {
                    setActiveWish(peer);
                    setSearchVal(peer.username);
                  }}
                  className={`relative aspect-[2/3] rounded-xl border overflow-hidden cursor-pointer group transition-all duration-300 ${
                    isActiveThis 
                      ? "ring-2 ring-blue-500 border-blue-500 scale-[1.02] shadow-[0_0_15px_rgba(59,130,246,0.3)]" 
                      : "border-white/10 bg-slate-900/60 hover:scale-[1.02] hover:border-white/30"
                  }`}
                >
                  {/* Backdrop */}
                  {peerTemplate?.background ? (
                    <img 
                      src={peerTemplate.background} 
                      alt="" 
                      className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-100 transition"
                    />
                  ) : (
                    // Default gradient
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-950 opacity-80" />
                  )}

                  {/* Dark Vignette Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />

                  {/* Content Overlays */}
                  <div className="absolute inset-x-3 bottom-3 text-left">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <img 
                        src={peer.photoUrl} 
                        alt="" 
                        className="w-5 h-5 rounded-full object-cover border border-white/10 shrink-0"
                      />
                      <p className="text-[10px] font-semibold text-white truncate font-display">
                        {peer.username}
                      </p>
                    </div>

                    <p className="text-[8px] text-white/50 truncate font-mono">
                      {peer.email}
                    </p>

                    <p className="text-[9px] text-white/60 font-sans italic line-clamp-2 mt-1 border-t border-white/5 pt-1.5 leading-relaxed">
                      "{peer.wish}"
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
