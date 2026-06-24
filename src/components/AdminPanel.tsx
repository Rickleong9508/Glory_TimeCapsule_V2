import { useState, useRef, useEffect, DragEvent, ChangeEvent, FormEvent } from "react";
import { WishRecord, Language, ColleagueGroup, COLLEAGUE_GROUPS, PosterTemplate } from "../types";
import { X, Upload, Trash2, Plus, Sparkles, AlertCircle, FileSpreadsheet, Eye, Search, Check, Download, Settings2, Palette } from "lucide-react";
import { translations } from "../locales";

interface AdminPanelProps {
  onClose: () => void;
  wishes: WishRecord[];
  onRefresh: () => Promise<void>;
  onPreviewWish: (identifier: string) => void;
  lang: Language;
}

export default function AdminPanel({ onClose, wishes, onRefresh, onPreviewWish, lang }: AdminPanelProps) {
  const t = translations[lang];
  
  // Tab State
  const [adminTab, setAdminTab] = useState<"database" | "posters">("database");

  // Poster Template States
  const [selectedPosterGroup, setSelectedPosterGroup] = useState<ColleagueGroup>("Visionary");
  const [posterTemplates, setPosterTemplates] = useState<Record<string, PosterTemplate>>({});
  const [loadingPosterTemplates, setLoadingPosterTemplates] = useState(true);
  const [bgDragActive, setBgDragActive] = useState(false);
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const [posterMessage, setPosterMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSavingPoster, setIsSavingPoster] = useState(false);

  // Fetch poster templates on mount
  useEffect(() => {
    const loadPosterTemplates = async () => {
      try {
        const res = await fetch("/api/poster-templates");
        const data = await res.json();
        if (data.success) {
          setPosterTemplates(data.templates);
        }
      } catch (err) {
        console.error("Error fetching templates:", err);
      } finally {
        setLoadingPosterTemplates(false);
      }
    };
    loadPosterTemplates();
  }, []);

  // Form states
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [group, setGroup] = useState<ColleagueGroup>("Builder");
  const [wish, setWish] = useState("");
  const [photoBase64, setPhotoBase64] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Custom delete confirmation modal states
  const [deletingItem, setDeletingItem] = useState<{ id: string; username: string } | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSelectEdit = (item: WishRecord) => {
    setEditingId(item.id);
    setEmail(item.email);
    setUsername(item.username);
    setGroup(item.group || "Builder");
    setWish(item.wish);
    setPhotoBase64(item.photoUrl);
    setFormMessage(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEmail("");
    setUsername("");
    setGroup("Builder");
    setWish("");
    setPhotoBase64("");
    setFormMessage(null);
  };
  
  // Statuses
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // File upload input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bulk Import Stats
  const [csvStatus, setCsvStatus] = useState<{ count: number; error: string | null } | null>(null);

  // Auto-generate a beautiful random styled vector avatar SVG (data URL)
  const generateRandomAvatar = () => {
    const colors = ["#6366F1", "#10B981", "#EC4899", "#F59E0B", "#8B5CF6", "#06B6D4", "#EF4444"];
    const shadowColors = ["#312E81", "#064E3B", "#500724", "#78350F", "#4C1D95", "#164E63", "#7F1D1D"];
    const randomIdx = Math.floor(Math.random() * colors.length);
    const color = colors[randomIdx];
    const shadowColor = shadowColors[randomIdx];
    
    // Choose eye types
    const eyeOption = Math.random() > 0.5;
    const smileOption = Math.random() > 0.4;
    
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
      <rect width='100' height='100' fill='${color.replace("#", "%23")}' rx='50' />
      <circle cx='50' cy='42' r='18' fill='%23FFFFFF' opacity='0.9' />
      <path d='M25,82 C25,65 75,65 75,82' fill='%23FFFFFF' opacity='0.9' />
      <circle cx='38' cy='42' r='2' fill='${shadowColor.replace("#", "%23")}' />
      <circle cx='62' cy='42' r='2' fill='${shadowColor.replace("#", "%23")}' />
      ${smileOption ? `<path d='M44,50 Q50,54 56,50' stroke='${shadowColor.replace("#", "%23")}' stroke-width='2' fill='none' />` : `<path d='M45,49 Q50,45 55,49' stroke='${shadowColor.replace("#", "%23")}' stroke-width='2' fill='none' />`}
    </svg>`;
    
    setPhotoBase64(`data:image/svg+xml;utf8,${svg}`);
  };

  // Convert/Resize local photo to Base64 (max 200px wide for optimal lightweight storage in the JSON DB)
  const processAndResizeFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFormMessage({ type: "error", text: "Please upload image files only" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set dimensions (Max 240px width/height to keep JSON lightweight)
        const maxDim = 240;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Make it round border drawing if we want, or simple image resize
        ctx.drawImage(img, 0, 0, width, height);
        
        // Export to low quality JPEG base64
        const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
        setPhotoBase64(dataUrl);
        setFormMessage(null);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processAndResizeFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processAndResizeFile(e.target.files[0]);
    }
  };

  // Write single record database
  const handleSubmitNewWish = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !username.trim() || !wish.trim()) {
      setFormMessage({ type: "error", text: t.requiredFieldsError });
      return;
    }

    setIsSubmitting(true);
    setFormMessage(null);

    try {
      const payload = {
        id: editingId,
        email: email.trim(),
        username: username.trim(),
        wish: wish.trim(),
        photoUrl: photoBase64 || null,
        group,
      };

      const res = await fetch("/api/wishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setFormMessage({
          type: "success",
          text: t.savedSuccess,
        });
        // Reset form except base64 if they want to load successive
        setEmail("");
        setUsername("");
        setWish("");
        setPhotoBase64("");
        setGroup("Builder");
        setEditingId(null);
        await onRefresh();
      } else {
        setFormMessage({ type: "error", text: data.error || "Save failed" });
      }
    } catch {
      setFormMessage({ type: "error", text: t.connectionFailed });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Custom fully responsive delete mechanism
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    setDeleteErrorMessage(null);

    try {
      const res = await fetch(`/api/wishes/${deletingItem.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setDeletingItem(null);
        await onRefresh();
      } else {
        setDeleteErrorMessage(data.error || "Failed to delete");
      }
    } catch {
      setDeleteErrorMessage("Error deleting record from server.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk CSV parser & uploader
  const handleCsvImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split("\n").filter(row => row.trim());
        
        let importedCount = 0;
        let errors: string[] = [];

        // Simple CSV parser supporting: Email, Username, Group, Wish (where Group is optional)
        // Discard headers
        const startIndex = rows[0].toLowerCase().includes("email") ? 1 : 0;

        for (let i = startIndex; i < rows.length; i++) {
          const row = rows[i];
          // Regex to parse comma separated fields (supporting basic quotes)
          const fields = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
          
          if (fields.length < 3) continue;

          const rawEmail = fields[0]?.replace(/^"|"$/g, "").trim() || "";
          const rawUser = fields[1]?.replace(/^"|"$/g, "").trim() || "";
          let rawGroup = "Builder";
          let rawWish = "";

          if (fields.length >= 4) {
            rawGroup = fields[2]?.replace(/^"|"$/g, "").trim() || "Builder";
            rawWish = fields[3]?.replace(/^"|"$/g, "").trim() || "";
          } else {
            rawWish = fields[2]?.replace(/^"|"$/g, "").trim() || "";
          }

          if (!rawEmail || !rawUser || !rawWish) continue;

          // Normalise group to match valid options
          const validGroups = ["Visionary", "Lead", "Builder", "Connector", "Pragmatist", "Skeptic"];
          const matchedGroup = validGroups.find(g => g.toLowerCase() === rawGroup.toLowerCase()) || "Builder";

          // Attempt to upload each inline
          try {
            const res = await fetch("/api/wishes", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: rawEmail, username: rawUser, group: matchedGroup, wish: rawWish }),
            });
            const data = await res.json();
            if (data.success) {
              importedCount++;
            } else {
              errors.push(`Row ${i + 1}: ${data.error}`);
            }
          } catch {
            errors.push(`Row ${i + 1}: Connection error`);
          }
        }

        setCsvStatus({
          count: importedCount,
          error: errors.length > 0 ? `${errors.length} ${t.rowsFailed}: ${errors.slice(0, 3).join("; ")}...` : null
        });

        await onRefresh();
      } catch (err) {
        setCsvStatus({ count: 0, error: t.malformedCsv });
      }
    };
    reader.readAsText(file);
  };

  // Export current wishes to sample CSV
  const handleExportCsv = () => {
    const headers = "Email,Username,Group,Goal\n";
    const content = wishes.map((w) => {
      const escapedWish = w.wish.replace(/"/g, '""');
      const grp = w.group || "Builder";
      return `"${w.email}","${w.username}","${grp}","${escapedWish}"`;
    }).join("\n");
    
    const blob = new Blob([headers + content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "company_time_capsule_goals.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter lists based on search
  const filteredWishes = wishes.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.username.toLowerCase().includes(q) ||
      item.email.toLowerCase().includes(q) ||
      item.wish.toLowerCase().includes(q)
    );
  });

  // Background Poster Upload Handler
  const handleBgDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setBgDragActive(true);
    } else if (e.type === "dragleave") {
      setBgDragActive(false);
    }
  };

  const processBgFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPosterMessage({ type: "error", text: "Please upload image files only" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        // Standard resolution for backdrop: 640 x 960 (standard mobile poster aspect 2:3 ratio)
        canvas.width = 640;
        canvas.height = 960;
        ctx.drawImage(img, 0, 0, 640, 960);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
        
        setPosterTemplates((prev) => ({
          ...prev,
          [selectedPosterGroup]: {
            ...prev[selectedPosterGroup],
            background: dataUrl
          }
        }));
        setPosterMessage(null);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleBgDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBgDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processBgFile(e.dataTransfer.files[0]);
    }
  };

  const handleBgFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processBgFile(e.target.files[0]);
    }
  };

  const handleSavePosterTemplate = async () => {
    const currentTpl = posterTemplates[selectedPosterGroup];
    if (!currentTpl) return;

    setIsSavingPoster(true);
    setPosterMessage(null);

    try {
      const res = await fetch("/api/poster-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentTpl),
      });

      const data = await res.json();
      if (data.success) {
        setPosterMessage({
          type: "success",
          text: lang === "zh" ? "海报底板及布局配置成功封存入库！" : "Layout template sealed successfully!"
        });
      } else {
        setPosterMessage({ type: "error", text: data.error || "Failed to save template" });
      }
    } catch {
      setPosterMessage({ type: "error", text: "Connection error saving poster template to master ledger." });
    } finally {
      setIsSavingPoster(false);
    }
  };

  const handleCopyTemplate = async (sourceGroup: ColleagueGroup) => {
    setIsSavingPoster(true);
    setPosterMessage(null);
    try {
      const res = await fetch("/api/poster-templates/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceGroup, targetGroup: selectedPosterGroup }),
      });
      const data = await res.json();
      if (data.success && data.template) {
        setPosterTemplates((prev) => ({
          ...prev,
          [selectedPosterGroup]: data.template,
        }));
        setPosterMessage({
          type: "success",
          text: lang === "zh" ? "海报配置复制成功并已应用！" : "Poster settings copied and applied successfully!"
        });
      } else {
        setPosterMessage({ type: "error", text: data.error || "Failed to copy template" });
      }
    } catch {
      setPosterMessage({ type: "error", text: "Connection error copying template settings." });
    } finally {
      setIsSavingPoster(false);
    }
  };

  const [draggingItem, setDraggingItem] = useState<"photo" | "name" | "group" | "email" | "goal" | null>(null);

  useEffect(() => {
    if (!draggingItem) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = document.getElementById("sandbox-poster-container");
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const relativeY = e.clientY - rect.top;

      let pctX = Math.round((relativeX / rect.width) * 100);
      let pctY = Math.round((relativeY / rect.height) * 100);

      pctX = Math.max(0, Math.min(100, pctX));
      pctY = Math.max(0, Math.min(100, pctY));

      setPosterTemplates((prev) => {
        const current = prev[selectedPosterGroup];
        if (!current) return prev;
        return {
          ...prev,
          [selectedPosterGroup]: {
            ...current,
            ...(draggingItem === "photo" && { photoX: pctX, photoY: pctY }),
            ...(draggingItem === "name" && { nameX: pctX, nameY: pctY }),
            ...(draggingItem === "group" && { groupX: pctX, groupY: pctY }),
            ...(draggingItem === "email" && { emailX: pctX, emailY: pctY }),
            ...(draggingItem === "goal" && { goalX: pctX, goalY: pctY }),
          }
        };
      });
    };

    const handleMouseUp = () => {
      setDraggingItem(null);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseup", handleMouseUp, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingItem, selectedPosterGroup]);

  const updateTplField = (field: keyof PosterTemplate, val: any) => {
    setPosterTemplates((prev) => ({
      ...prev,
      [selectedPosterGroup]: {
        ...prev[selectedPosterGroup],
        [field]: val
      }
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in text-slate-200">
      <div className="w-full max-w-2xl bg-[#090d16] h-full shadow-2xl border-l border-slate-800 flex flex-col overflow-hidden">
        
        {/* Header rail */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
          <div>
            <h2 className="text-xl font-display font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-amber-300 flex items-center gap-2">
              <span>{t.adminControlCenter}</span>
              <span className="text-xs bg-indigo-500/20 text-indigo-300 font-mono px-2 py-0.5 rounded-full border border-indigo-500/20">
                Admin Port
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {t.adminSubtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-900/25">
          <button
            onClick={() => setAdminTab("database")}
            className={`py-3 px-4 text-xs font-display font-medium tracking-wide border-b-2 transition-all cursor-pointer ${
              adminTab === "database"
                ? "border-indigo-500 text-indigo-400 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {lang === "zh" ? "📋 员工数据账本 / Database" : "📋 Colleagues Ledger"}
          </button>
          <button
            onClick={() => setAdminTab("posters")}
            className={`py-3 px-4 text-xs font-display font-medium tracking-wide border-b-2 transition-all cursor-pointer ${
              adminTab === "posters"
                ? "border-indigo-500 text-indigo-400 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {lang === "zh" ? "🎨 时空海报底模设计 / Poster Templates" : "🎨 Poster Backdrops"}
          </button>
        </div>

        {adminTab === "database" ? (
          /* Dynamic scroll database content */
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* Quick Database CSV Actions */}
            <div className="bg-[#101726]/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1">
                <h3 className="text-sm font-medium flex items-center gap-2 text-slate-100">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  {t.bulkImportExport}
                </h3>
                <p className="text-xs text-slate-400">
                  {t.csvFormatInfo}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-900/30 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-900/50 hover:border-indigo-400/30 transition text-xs rounded-lg cursor-pointer font-medium">
                  <Upload className="w-3.5 h-3.5" />
                  {t.importCsv}
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvImport}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={handleExportCsv}
                  disabled={wishes.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 disabled:opacity-50 text-xs rounded-lg cursor-pointer font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  {t.exportCsv}
                </button>
              </div>

              {/* CSV stats display */}
              {csvStatus && (
                <div className="w-full flex items-center justify-between bg-slate-900/50 p-2.5 rounded-lg border border-slate-800 text-xs mt-1">
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    {t.rowsLoadedSuccess.replace("{count}", String(csvStatus.count))}
                  </span>
                  {csvStatus.error && (
                    <span className="text-red-400 max-w-xs text-right truncate">
                      {csvStatus.error}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Form writing */}
              <div className="bg-[#101726]/60 border border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-inner">
                <h3 className="text-sm font-semibold tracking-wider text-slate-100 border-b border-slate-800 pb-2 flex items-center justify-between uppercase">
                  <span className="flex items-center gap-2">
                    {editingId ? <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" /> : <Plus className="w-4 h-4 text-amber-400" />}
                    {editingId ? "编辑同事档案 / Edit Profile" : t.addEditColleague}
                  </span>
                  {editingId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="text-[10px] text-rose-400 hover:text-rose-300 font-mono border border-rose-500/20 px-2 py-0.5 rounded-lg hover:bg-rose-500/10 transition cursor-pointer normal-case font-bold"
                    >
                      {lang === "zh" ? "取消" : "Cancel"}
                    </button>
                  )}
                </h3>

                <form onSubmit={handleSubmitNewWish} className="space-y-4">
                  
                  {/* Email Address */}
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-slate-400">{t.emailLabel}</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. alice@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-sm transition"
                    />
                  </div>

                  {/* Nickname / Username */}
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-slate-400">{t.usernameLabel}</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. alice"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-sm transition"
                    />
                  </div>

                  {/* Group Selector */}
                  <div className="space-y-1 text-left">
                    <label className="text-xs font-mono text-slate-400">{t.groupLabel}</label>
                    <select
                      value={group}
                      onChange={(e) => setGroup(e.target.value as ColleagueGroup)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-sm transition text-slate-100 cursor-pointer"
                    >
                      {COLLEAGUE_GROUPS.map((grpName) => (
                        <option key={grpName} value={grpName} className="bg-slate-900">
                          {t[`group${grpName}` as keyof typeof t] || grpName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Image Uploader */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono text-slate-400">{t.photoLabel}</label>
                      <button
                        type="button"
                        onClick={generateRandomAvatar}
                        className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" /> {t.generateAvatar}
                      </button>
                    </div>

                    {/* Drag drop area */}
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative border border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition min-h-24 ${
                        dragActive
                          ? "border-amber-400 bg-amber-500/10"
                          : photoBase64
                          ? "border-slate-700 bg-slate-900/30"
                          : "border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900/20"
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />

                      {photoBase64 ? (
                        <div className="flex items-center gap-3">
                          <img
                            src={photoBase64}
                            alt="preview"
                            className="w-12 h-12 rounded-full object-cover border-2 border-slate-700"
                          />
                          <div className="text-left">
                            <p className="text-xs text-slate-300 font-medium">{t.photoLoaded}</p>
                            <p className="text-[10px] text-slate-500">{t.clickDragChange}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center space-y-1">
                          <Upload className="w-5 h-5 text-slate-500 mx-auto" />
                          <p className="text-xs text-slate-400">
                            {t.dragDropPhoto}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Wish Content */}
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-slate-400">{t.wishLabel}</label>
                    <textarea
                      required
                      rows={3}
                      placeholder={t.wishInputPlaceholder}
                      value={wish}
                      onChange={(e) => setWish(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-sm transition resize-none leading-relaxed"
                    />
                  </div>

                  {/* Form Message */}
                  {formMessage && (
                    <div className={`p-3 rounded-lg flex items-start gap-2 text-xs ${
                      formMessage.type === "success" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border border-red-500/20 text-red-400"
                    }`}>
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{formMessage.text}</span>
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white py-2.5 rounded-xl text-xs font-display font-medium shadow-md hover:shadow-lg disabled:opacity-50 transition cursor-pointer"
                  >
                    {isSubmitting ? t.saveWishBtnSaving : editingId ? (lang === "zh" ? "保存更改 / Save Changes" : "Save Changes") : t.saveWishBtn}
                  </button>
                </form>
              </div>

              {/* General quick lookup listing */}
              <div className="bg-[#101726]/40 border border-slate-800/60 rounded-2xl p-5 flex flex-col h-[520px]">
                <h3 className="text-sm font-semibold tracking-wider text-slate-100 border-b border-slate-800 pb-2 flex items-center justify-between uppercase mb-4">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {t.activeColleagues} ({wishes.length})
                  </span>
                </h3>

                {/* Search bar */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder={t.searchColleaguesPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Records scroll desk */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {filteredWishes.length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center text-xs text-slate-500 space-y-2">
                      <Search className="w-7 h-7 text-slate-700" />
                      <p>{t.noMatches || "None"}</p>
                    </div>
                  ) : (
                    filteredWishes.map((item) => {
                      const isEditingThis = editingId === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelectEdit(item)}
                          className={`border rounded-xl p-3 flex items-center justify-between group py-3 cursor-pointer transition-all duration-200 ${
                            isEditingThis
                              ? "bg-indigo-950/40 border-indigo-500/80 shadow-[0_0_12px_rgba(99,102,241,0.2)]"
                              : "bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={item.photoUrl}
                              alt={item.username}
                              className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-800 bg-slate-950 select-none"
                            />
                            <div className="min-w-0 text-left">
                              <p className="text-xs font-semibold text-slate-200 truncate font-display group-hover:text-amber-300 transition-colors">
                                {item.username}
                              </p>
                              <p className="text-[10px] text-slate-500 font-mono truncate">
                                {item.email}
                              </p>
                              <span className="inline-block text-[9px] font-medium tracking-wide px-1.5 py-0.5 bg-slate-800 text-slate-400 font-mono rounded mt-1 border border-slate-700/50">
                                {t[`group${item.group || "Builder"}` as keyof typeof t] || item.group || "Builder"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 ml-2" onClick={(e) => { e.stopPropagation(); }}>
                            {/* Direct Preview Lookup */}
                            <button
                              onClick={() => {
                                onPreviewWish(item.email);
                                onClose();
                              }}
                              title={t.previewToolTip}
                              className="p-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            
                            {/* Delete action */}
                            <button
                              onClick={() => setDeletingItem({ id: item.id, username: item.username })}
                              title={t.deleteToolTip}
                              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Custom Visual Poster Board Templates Configuration Workspace */
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex bg-[#101726]/80 border border-slate-800 p-4 rounded-2xl items-center justify-between gap-4">
              <div className="space-y-1 text-left w-full">
                <span className="text-[10px] bg-indigo-505 bg-indigo-500/20 text-indigo-300 font-mono px-3 py-1 rounded-full border border-indigo-500/20 font-bold">
                  TEMPLATE STUDIO CANVAS
                </span>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {lang === "zh" 
                    ? "配置您所上传的底模文件。通过滑块和位置坐标，您可以让照片、名字和誓言卡高精度契合您的海报设计！" 
                    : "Upload high-fidelity JPG/PNG backdrop and adjust X/Y coordinates for the chosen group."}
                </p>
              </div>
            </div>

            {/* Select Group Grid */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-mono font-medium text-slate-400">选择需要编辑底模与坐标的海报组别 / Choose Group</label>
              <div className="grid grid-cols-3 gap-2">
                {COLLEAGUE_GROUPS.map((grp) => (
                  <button
                    key={grp}
                    type="button"
                    onClick={() => {
                      setSelectedPosterGroup(grp);
                      setPosterMessage(null);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-mono font-bold border transition text-center cursor-pointer ${
                      selectedPosterGroup === grp
                        ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/10"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    {t[`group${grp}` as keyof typeof t] || grp}
                  </button>
                ))}
              </div>

              {/* Template settings replication helper */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 border border-slate-800/80 p-3.5 rounded-2xl mt-3 shadow-inner">
                <div className="space-y-0.5 text-left">
                  <p className="text-xs font-bold text-slate-200">
                    {lang === "zh" ? "复用其他组别设置" : "Copy settings from another group"}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {lang === "zh" ? "一键将选定组别的排版参数复制到当前编辑组别" : "Clone layout coordinate configurations from another group template."}
                  </p>
                </div>
                <select
                  onChange={async (e) => {
                    const source = e.target.value;
                    if (!source) return;
                    
                    const sourceLabel = t[`group${source as ColleagueGroup}` as keyof typeof t] || source;
                    const targetLabel = t[`group${selectedPosterGroup}` as keyof typeof t] || selectedPosterGroup;
                    
                    if (window.confirm(lang === "zh" 
                      ? `确定要将【${sourceLabel}】的排版坐标设置覆盖复制给【${targetLabel}】吗？`
                      : `Are you sure you want to clone coordinates from [${sourceLabel}] to [${targetLabel}]?`
                    )) {
                      await handleCopyTemplate(source as ColleagueGroup);
                    }
                    e.target.value = ""; // reset selector
                  }}
                  className="bg-[#0f172a] text-slate-300 border border-slate-800 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="">{lang === "zh" ? "选择来源组别..." : "Select source..."}</option>
                  {COLLEAGUE_GROUPS.filter(g => g !== selectedPosterGroup).map(g => (
                    <option key={g} value={g}>
                      {t[`group${g}` as keyof typeof t] || g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loadingPosterTemplates ? (
              <div className="h-40 flex items-center justify-center text-xs text-slate-500">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                正在加载底版参数...
              </div>
            ) : (() => {
              const currentTpl = posterTemplates[selectedPosterGroup] || {
                group: selectedPosterGroup,
                background: "",
                photoX: 50,
                photoY: 28,
                photoSize: 180,
                nameX: 50,
                nameY: 44,
                nameColor: "#FFFFFF",
                nameSize: 28,
                emailX: 50,
                emailY: 49,
                emailColor: "#94A3B8",
                emailSize: 16,
                groupX: 50,
                groupY: 41,
                groupColor: "#60A5FA",
                groupSize: 14,
                groupVisible: true,
                goalX: 50,
                goalY: 65,
                goalWidth: 80,
                goalColor: "#E2E8F0",
                goalSize: 18
              };

              // Let's find a sample colleague wish for visual preview
              const sampleWish = wishes.find(w => (w.group || "Builder") === selectedPosterGroup) || wishes[0] || {
                username: "ALICE (Sample)",
                email: "alice@company.com",
                wish: "Here is sample five-year professional dream to let you preview the margins, alignment, and spacing.",
                photoUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%236B7280' rx='50' /><text x='50' y='55' fill='%23FFFFFF' font-size='24' font-family='sans-serif' font-weight='bold' text-anchor='middle'>AL</text></svg>",
                group: selectedPosterGroup
              };

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  
                  {/* Left Column: Backdrop Upload + Coordinates Sliders */}
                  <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1">
                    
                    {/* Backdrop Uploader */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-mono text-slate-400">
                        {lang === "zh" ? "上传海报底图背景 (JPG/PNG)" : "Backdrop JPG/PNG (Prefer 2:3 ratio, e.g. 800x1200)"}
                      </label>

                      <div
                        onDragEnter={handleBgDrag}
                        onDragOver={handleBgDrag}
                        onDragLeave={handleBgDrag}
                        onDrop={handleBgDrop}
                        onClick={() => bgFileInputRef.current?.click()}
                        className={`border border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition min-h-24 ${
                          bgDragActive
                            ? "border-indigo-400 bg-indigo-500/10"
                            : currentTpl.background
                            ? "border-slate-700 bg-slate-900/30"
                            : "border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900/20"
                        }`}
                      >
                        <input
                          type="file"
                          ref={bgFileInputRef}
                          onChange={handleBgFileChange}
                          accept="image/*"
                          className="hidden"
                        />

                        {currentTpl.background ? (
                          <div className="text-center space-y-1.5">
                            <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                              CUSTOM BOTTOM BACKGROUND LOADED
                            </span>
                            <p className="text-[10px] text-slate-500">点击或将新文件拖至此处以覆盖海报背景</p>
                          </div>
                        ) : (
                          <div className="text-center space-y-1">
                            <Upload className="w-5 h-5 text-slate-500 mx-auto" />
                            <p className="text-xs text-slate-400">
                              {lang === "zh" ? "拖放或点击本地文件导入海报底底片" : "Drag drop or click to upload backdrop"}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Remove custom background button */}
                      {currentTpl.background && (
                        <button
                          type="button"
                          onClick={() => updateTplField("background", "")}
                          className="text-[10px] text-rose-400 hover:underline cursor-pointer block text-right w-full"
                        >
                          {lang === "zh" ? "重置为炫彩渐变背景" : "Reset backdrop to dynamic gradient"}
                        </button>
                      )}
                    </div>

                    {/* SLIDERS FOR PHOTO COORDS */}
                    <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-3.5 space-y-3.5 text-left">
                      <span className="text-[11px] uppercase font-mono font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                        1. 头像位置设置 / Photo Coordinates
                      </span>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono text-slate-400">
                          <span>水平位置 X (Horizontal X)</span>
                          <span className="text-slate-300 font-bold">{currentTpl.photoX}%</span>
                        </div>
                        <input 
                          type="range" min="0" max="100" value={currentTpl.photoX}
                          onChange={(e) => updateTplField("photoX", Number(e.target.value))}
                          className="w-full accent-indigo-500 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono text-slate-400">
                          <span>垂直位置 Y (Vertical Y)</span>
                          <span className="text-slate-300 font-bold">{currentTpl.photoY}%</span>
                        </div>
                        <input 
                          type="range" min="0" max="100" value={currentTpl.photoY}
                          onChange={(e) => updateTplField("photoY", Number(e.target.value))}
                          className="w-full accent-indigo-500 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono text-slate-400">
                          <span>尺寸大小 (Frame Size)</span>
                          <span className="text-slate-300 font-bold">{currentTpl.photoSize}px</span>
                        </div>
                        <input 
                          type="range" min="80" max="300" value={currentTpl.photoSize}
                          onChange={(e) => updateTplField("photoSize", Number(e.target.value))}
                          className="w-full accent-indigo-500 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* SLIDERS FOR NAME COORDS */}
                    <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-3.5 space-y-3.5 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] uppercase font-mono font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-orange-400">
                          2. 同事姓名设置 / Name Coordinates
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono text-slate-400">
                          <span>文字对齐 (Text Align)</span>
                          <span className="text-indigo-400 font-bold uppercase">{currentTpl.nameAlign || "center"}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 bg-slate-950 border border-slate-800/80 p-0.5 rounded-lg">
                          {(["left", "center", "right"] as const).map((align) => (
                            <button
                              key={align}
                              type="button"
                              onClick={() => updateTplField("nameAlign", align)}
                              className={`py-1 text-[10px] font-mono rounded cursor-pointer capitalize transition ${
                                (currentTpl.nameAlign || "center") === align
                                  ? "bg-indigo-600 font-bold text-white shadow"
                                  : "text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              {align === "left" ? "左 (Left)" : align === "center" ? "中 (Center)" : "右 (Right)"}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono text-slate-400">
                          <span>姓名水平 X (Horizontal X)</span>
                          <span className="text-slate-300 font-bold">{currentTpl.nameX}%</span>
                        </div>
                        <input 
                          type="range" min="0" max="100" value={currentTpl.nameX}
                          onChange={(e) => updateTplField("nameX", Number(e.target.value))}
                          className="w-full accent-indigo-500 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono text-slate-400">
                          <span>姓名垂直 Y (Vertical Y)</span>
                          <span className="text-slate-300 font-bold">{currentTpl.nameY}%</span>
                        </div>
                        <input 
                          type="range" min="10" max="95" value={currentTpl.nameY}
                          onChange={(e) => updateTplField("nameY", Number(e.target.value))}
                          className="w-full accent-indigo-500 cursor-pointer"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-slate-400">字体大小 (Font Size)</label>
                          <input 
                            type="number" min="14" max="64" value={currentTpl.nameSize}
                            onChange={(e) => updateTplField("nameSize", Number(e.target.value))}
                            className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-indigo-400 text-center"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-slate-400">字体颜色 (Hex Color)</label>
                          <div className="flex gap-2">
                            <input 
                              type="color" value={currentTpl.nameColor}
                              onChange={(e) => updateTplField("nameColor", e.target.value)}
                              className="w-7 h-5 border-none p-0 bg-transparent rounded cursor-pointer"
                            />
                            <input 
                              type="text" value={currentTpl.nameColor}
                              onChange={(e) => updateTplField("nameColor", e.target.value)}
                              className="w-full text-[10px] font-mono bg-slate-950 border border-slate-800 rounded text-slate-300 px-1 text-center"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SLIDERS FOR EMAIL COORDS */}
                    <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-3.5 space-y-3.5 text-left">
                      <span className="text-[11px] uppercase font-mono font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-sky-400">
                        2.5. 同事邮箱设置 / Email Coordinates
                      </span>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono text-slate-400">
                          <span>文字对齐 (Text Align)</span>
                          <span className="text-sky-400 font-bold uppercase">{currentTpl.emailAlign || "center"}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 bg-slate-950 border border-slate-800/80 p-0.5 rounded-lg">
                          {(["left", "center", "right"] as const).map((align) => (
                            <button
                              key={align}
                              type="button"
                              onClick={() => updateTplField("emailAlign", align)}
                              className={`py-1 text-[10px] font-mono rounded cursor-pointer capitalize transition ${
                                (currentTpl.emailAlign || "center") === align
                                  ? "bg-sky-600 font-bold text-white shadow"
                                  : "text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              {align === "left" ? "左 (Left)" : align === "center" ? "中 (Center)" : "右 (Right)"}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono text-slate-400">
                          <span>邮箱水平 X (Horizontal X)</span>
                          <span className="text-slate-300 font-bold">{currentTpl.emailX !== undefined ? currentTpl.emailX : 50}%</span>
                        </div>
                        <input 
                          type="range" min="0" max="100" value={currentTpl.emailX !== undefined ? currentTpl.emailX : 50}
                          onChange={(e) => updateTplField("emailX", Number(e.target.value))}
                          className="w-full accent-indigo-500 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono text-slate-400">
                          <span>邮箱垂直 Y (Vertical Y)</span>
                          <span className="text-slate-300 font-bold">{currentTpl.emailY !== undefined ? currentTpl.emailY : 49}%</span>
                        </div>
                        <input 
                          type="range" min="10" max="95" value={currentTpl.emailY !== undefined ? currentTpl.emailY : 49}
                          onChange={(e) => updateTplField("emailY", Number(e.target.value))}
                          className="w-full accent-indigo-500 cursor-pointer"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-slate-400">字体大小 (Font Size)</label>
                          <input 
                            type="number" min="10" max="48" value={currentTpl.emailSize !== undefined ? currentTpl.emailSize : 16}
                            onChange={(e) => updateTplField("emailSize", Number(e.target.value))}
                            className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-sky-400 text-center"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-slate-400">字体颜色 (Hex Color)</label>
                          <div className="flex gap-2">
                            <input 
                              type="color" value={currentTpl.emailColor || "#94A3B8"}
                              onChange={(e) => updateTplField("emailColor", e.target.value)}
                              className="w-7 h-5 border-none p-0 bg-transparent rounded cursor-pointer"
                            />
                            <input 
                              type="text" value={currentTpl.emailColor || "#94A3B8"}
                              onChange={(e) => updateTplField("emailColor", e.target.value)}
                              className="w-full text-[10px] font-mono bg-slate-950 border border-slate-800 rounded text-slate-300 px-1 text-center"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SLIDERS FOR GROUP ARCHETYPE BADGE COORDS */}
                    <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-3.5 space-y-3.5 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] uppercase font-mono font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
                          2.6. 双色分组标签设置 / Group Archetype Label
                        </span>
                        <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-mono text-indigo-300">
                          <input 
                            type="checkbox" 
                            checked={currentTpl.groupVisible !== false}
                            onChange={(e) => updateTplField("groupVisible", e.target.checked)}
                            className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0 cursor-pointer w-3.5 h-3.5"
                          />
                          <span>显示 (Show)</span>
                        </label>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono text-slate-400">
                          <span>文字对齐 (Text Align)</span>
                          <span className="text-violet-400 font-bold uppercase">{currentTpl.groupAlign || "center"}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 bg-slate-950 border border-slate-800/80 p-0.5 rounded-lg">
                          {(["left", "center", "right"] as const).map((align) => (
                            <button
                              key={align}
                              type="button"
                              onClick={() => updateTplField("groupAlign", align)}
                              className={`py-1 text-[10px] font-mono rounded cursor-pointer capitalize transition ${
                                (currentTpl.groupAlign || "center") === align
                                  ? "bg-indigo-600 font-bold text-white shadow"
                                  : "text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              {align === "left" ? "左 (Left)" : align === "center" ? "中 (Center)" : "右 (Right)"}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono text-slate-400">
                          <span>标签水平 X (Horizontal X)</span>
                          <span className="text-slate-300 font-bold">{currentTpl.groupX !== undefined ? currentTpl.groupX : 50}%</span>
                        </div>
                        <input 
                          type="range" min="0" max="100" value={currentTpl.groupX !== undefined ? currentTpl.groupX : 50}
                          onChange={(e) => updateTplField("groupX", Number(e.target.value))}
                          className="w-full accent-indigo-500 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono text-slate-400">
                          <span>标签垂直 Y (Vertical Y)</span>
                          <span className="text-slate-300 font-bold">{currentTpl.groupY !== undefined ? currentTpl.groupY : 41}%</span>
                        </div>
                        <input 
                          type="range" min="10" max="95" value={currentTpl.groupY !== undefined ? currentTpl.groupY : 41}
                          onChange={(e) => updateTplField("groupY", Number(e.target.value))}
                          className="w-full accent-indigo-500 cursor-pointer"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-slate-400">字体大小 (Font Size)</label>
                          <input 
                            type="number" min="8" max="48" value={currentTpl.groupSize !== undefined ? currentTpl.groupSize : 14}
                            onChange={(e) => updateTplField("groupSize", Number(e.target.value))}
                            className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-indigo-400 text-center"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-slate-400">标签颜色 (Hex Color)</label>
                          <div className="flex gap-2">
                            <input 
                              type="color" value={currentTpl.groupColor || "#38BDF8"}
                              onChange={(e) => updateTplField("groupColor", e.target.value)}
                              className="w-7 h-5 border-none p-0 bg-transparent rounded cursor-pointer"
                            />
                            <input 
                              type="text" value={currentTpl.groupColor || "#38BDF8"}
                              onChange={(e) => updateTplField("groupColor", e.target.value)}
                              className="w-full text-[10px] font-mono bg-slate-950 border border-slate-800 rounded text-slate-300 px-1 text-center"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SLIDERS FOR GOAL BLOCK COORDS */}
                    <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-3.5 space-y-3.5 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] uppercase font-mono font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                          3. 誓词设置 / Goal Coordinates
                        </span>
                        <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-mono text-emerald-400">
                          <input 
                            type="checkbox" 
                            checked={currentTpl.goalBgVisible !== false}
                            onChange={(e) => updateTplField("goalBgVisible", e.target.checked)}
                            className="rounded border-slate-800 bg-slate-950 text-emerald-600 focus:ring-0 cursor-pointer w-3.5 h-3.5"
                          />
                          <span>背部底框 (Show Box)</span>
                        </label>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono text-slate-400">
                          <span>文字对齐 (Text Align)</span>
                          <span className="text-emerald-400 font-bold uppercase">{currentTpl.goalAlign || "center"}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 bg-slate-950 border border-slate-800/80 p-0.5 rounded-lg">
                          {(["left", "center", "right"] as const).map((align) => (
                            <button
                              key={align}
                              type="button"
                              onClick={() => updateTplField("goalAlign", align)}
                              className={`py-1 text-[10px] font-mono rounded cursor-pointer capitalize transition ${
                                (currentTpl.goalAlign || "center") === align
                                  ? "bg-emerald-600 font-bold text-white shadow"
                                  : "text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              {align === "left" ? "左 (Left)" : align === "center" ? "中 (Center)" : "右 (Right)"}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono text-slate-400">
                          <span>内容水平 X (Horizontal X)</span>
                          <span className="text-slate-300 font-bold">{currentTpl.goalX}%</span>
                        </div>
                        <input 
                          type="range" min="0" max="100" value={currentTpl.goalX}
                          onChange={(e) => updateTplField("goalX", Number(e.target.value))}
                          className="w-full accent-indigo-500 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono text-slate-400">
                          <span>内容垂直 Y (Vertical Y)</span>
                          <span className="text-slate-300 font-bold">{currentTpl.goalY}%</span>
                        </div>
                        <input 
                          type="range" min="10" max="95" value={currentTpl.goalY}
                          onChange={(e) => updateTplField("goalY", Number(e.target.value))}
                          className="w-full accent-indigo-500 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono text-slate-400">
                          <span>区域/底框宽度 (Card Width %)</span>
                          <span className="text-slate-300 font-bold">{currentTpl.goalWidth}%</span>
                        </div>
                        <input 
                          type="range" min="30" max="95" value={currentTpl.goalWidth}
                          onChange={(e) => updateTplField("goalWidth", Number(e.target.value))}
                          className="w-full accent-indigo-500 cursor-pointer"
                        />
                      </div>

                      <div className="bg-slate-900/40 p-2.5 rounded-lg space-y-2.5 border border-slate-900/60">
                        <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wide">
                          内边距设置 / Padding Coordinates (px)
                        </span>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-mono text-slate-400">
                              <span>上 (Top)</span>
                              <span className="text-slate-300 font-bold">{currentTpl.goalPaddingTop !== undefined ? currentTpl.goalPaddingTop : 20}px</span>
                            </div>
                            <input 
                              type="range" min="0" max="100" value={currentTpl.goalPaddingTop !== undefined ? currentTpl.goalPaddingTop : 20}
                              onChange={(e) => updateTplField("goalPaddingTop", Number(e.target.value))}
                              className="w-full accent-indigo-500 cursor-pointer h-1"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-mono text-slate-400">
                              <span>下 (Bottom)</span>
                              <span className="text-slate-300 font-bold">{currentTpl.goalPaddingBottom !== undefined ? currentTpl.goalPaddingBottom : 20}px</span>
                            </div>
                            <input 
                              type="range" min="0" max="100" value={currentTpl.goalPaddingBottom !== undefined ? currentTpl.goalPaddingBottom : 20}
                              onChange={(e) => updateTplField("goalPaddingBottom", Number(e.target.value))}
                              className="w-full accent-indigo-500 cursor-pointer h-1"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-mono text-slate-400">
                              <span>左 (Left)</span>
                              <span className="text-slate-300 font-bold">{currentTpl.goalPaddingLeft !== undefined ? currentTpl.goalPaddingLeft : 40}px</span>
                            </div>
                            <input 
                              type="range" min="0" max="150" value={currentTpl.goalPaddingLeft !== undefined ? currentTpl.goalPaddingLeft : 40}
                              onChange={(e) => updateTplField("goalPaddingLeft", Number(e.target.value))}
                              className="w-full accent-indigo-500 cursor-pointer h-1"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-mono text-slate-400">
                              <span>右 (Right)</span>
                              <span className="text-slate-300 font-bold">{currentTpl.goalPaddingRight !== undefined ? currentTpl.goalPaddingRight : 40}px</span>
                            </div>
                            <input 
                              type="range" min="0" max="150" value={currentTpl.goalPaddingRight !== undefined ? currentTpl.goalPaddingRight : 40}
                              onChange={(e) => updateTplField("goalPaddingRight", Number(e.target.value))}
                              className="w-full accent-indigo-500 cursor-pointer h-1"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-slate-400">文字大小 (Font Size)</label>
                          <input 
                            type="number" min="10" max="48" value={currentTpl.goalSize}
                            onChange={(e) => updateTplField("goalSize", Number(e.target.value))}
                            className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-emerald-400 text-center"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-slate-400">文字颜色 (Hex Color)</label>
                          <div className="flex gap-2">
                            <input 
                              type="color" value={currentTpl.goalColor}
                              onChange={(e) => updateTplField("goalColor", e.target.value)}
                              className="w-7 h-5 border-none p-0 bg-transparent rounded cursor-pointer"
                            />
                            <input 
                              type="text" value={currentTpl.goalColor}
                              onChange={(e) => updateTplField("goalColor", e.target.value)}
                              className="w-full text-[10px] font-mono bg-slate-950 border border-slate-800 rounded px-1 text-center text-slate-300"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Messages */}
                    {posterMessage && (
                      <div className={`p-3 rounded-lg flex items-start gap-2 text-xs ${
                        posterMessage.type === "success" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border border-red-500/20 text-red-400"
                      }`}>
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{posterMessage.text}</span>
                      </div>
                    )}

                    {/* Submit template config to server */}
                    <button
                      type="button"
                      onClick={handleSavePosterTemplate}
                      disabled={isSavingPoster}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl py-3 text-xs font-display font-bold tracking-wider uppercase transition disabled:opacity-50 cursor-pointer"
                    >
                      {isSavingPoster ? "正在封印布局参数..." : "💾 保存底板与坐标布局 / Lock settings"}
                    </button>

                  </div>

                  {/* Right Column: Dynamic Live Preview Poster Mock */}
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-mono text-slate-500 mb-1 uppercase tracking-widest">
                      实时预制预览 (Live Sandbox Preview)
                    </span>
                    <span className="text-[10px] text-indigo-400 mb-2 font-display text-center opacity-90 max-w-[280px]">
                      💡 提示：你可以直接在下方框内，用鼠标拖动头像或文字调整位置坐标！
                    </span>
                    
                    <div id="sandbox-poster-container" className="relative w-full max-w-[280px] aspect-[2/3] bg-slate-950 shadow-inner rounded-xl border border-white/10 overflow-hidden select-none">
                      
                      {/* background */}
                      {currentTpl.background ? (
                        <img 
                          src={currentTpl.background} 
                          alt="" 
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        // Default styled gradient
                        <div className={`absolute inset-0 bg-gradient-to-b ${
                          selectedPosterGroup === "Visionary" ? "from-indigo-950 via-slate-900 to-purple-950" :
                          selectedPosterGroup === "Lead" ? "from-indigo-950 via-slate-900 to-amber-950" :
                          selectedPosterGroup === "Builder" ? "from-slate-950 via-slate-900 to-emerald-950" :
                          selectedPosterGroup === "Connector" ? "from-slate-950 via-slate-900 to-rose-950" :
                          selectedPosterGroup === "Pragmatist" ? "from-teal-950 via-slate-900 to-blue-950" :
                          "from-zinc-950 via-slate-900 to-slate-950"
                        }`} />
                      )}

                      {/* Mock Photo */}
                      <div 
                        className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing hover:outline hover:outline-1 hover:outline-dashed hover:outline-indigo-500/80 hover:outline-offset-2 ${draggingItem === 'photo' ? 'outline outline-1 outline-solid outline-indigo-500 ring-4 ring-indigo-500/20' : ''}`}
                        style={{
                          left: `${currentTpl.photoX}%`,
                          top: `${currentTpl.photoY}%`,
                        }}
                        onMouseDown={(e) => setDraggingItem("photo")}
                        title="按住鼠标拖动来调整头像坐标 / Drag to reposition photo"
                      >
                        <div 
                          className="rounded-full border border-white/20 shadow-lg overflow-hidden bg-slate-900 pointer-events-none"
                          style={{
                            width: `${currentTpl.photoSize * 0.4}px`,
                            height: `${currentTpl.photoSize * 0.4}px`,
                          }}
                        >
                          <img 
                            src={sampleWish.photoUrl} 
                            alt="" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      {/* Mock Name */}
                      <div 
                        className={`absolute cursor-grab active:cursor-grabbing hover:outline hover:outline-1 hover:outline-dashed hover:outline-indigo-500/80 hover:outline-offset-2 ${draggingItem === 'name' ? 'outline outline-1 outline-solid outline-indigo-500 ring-4 ring-indigo-500/20' : ''}`}
                        style={{
                          left: currentTpl.nameAlign === "right" ? "auto" : `${currentTpl.nameX}%`,
                          right: currentTpl.nameAlign === "right" ? `${100 - currentTpl.nameX}%` : "auto",
                          top: `${currentTpl.nameY}%`,
                          transform: currentTpl.nameAlign === "left" ? "translateY(-50%)" : currentTpl.nameAlign === "right" ? "translateY(-50%)" : "translate(-50%, -50%)",
                          textAlign: currentTpl.nameAlign || "center",
                        }}
                        onMouseDown={(e) => setDraggingItem("name")}
                        title="按住鼠标拖动来调整姓名位置 / Drag to reposition name"
                      >
                        <h5 
                          className="font-display font-extrabold uppercase tracking-wide truncate max-w-[150px] pointer-events-none"
                          style={{
                            fontSize: `${currentTpl.nameSize * 0.45}px`,
                            color: currentTpl.nameColor,
                            textAlign: currentTpl.nameAlign || "center",
                          }}
                        >
                          {sampleWish.username}
                        </h5>
                      </div>

                      {/* Mock Group Archetype Label */}
                      {currentTpl.groupVisible !== false && (
                        <div 
                          className={`absolute cursor-grab active:cursor-grabbing hover:outline hover:outline-1 hover:outline-dashed hover:outline-indigo-500/80 hover:outline-offset-2 ${draggingItem === 'group' ? 'outline outline-1 outline-solid outline-indigo-500 ring-4 ring-indigo-500/20' : ''}`}
                          style={{
                            left: currentTpl.groupAlign === "right" ? "auto" : `${currentTpl.groupX !== undefined ? currentTpl.groupX : 50}%`,
                            right: currentTpl.groupAlign === "right" ? `${100 - (currentTpl.groupX !== undefined ? currentTpl.groupX : 50)}%` : "auto",
                            top: `${currentTpl.groupY !== undefined ? currentTpl.groupY : 41}%`,
                            transform: currentTpl.groupAlign === "left" ? "translateY(-50%)" : currentTpl.groupAlign === "right" ? "translateY(-50%)" : "translate(-50%, -50%)",
                            textAlign: currentTpl.groupAlign || "center",
                          }}
                          onMouseDown={(e) => setDraggingItem("group")}
                          title="按住鼠标拖动来调整属性标签位置 / Drag to reposition group label"
                        >
                          <p 
                            className="font-mono uppercase tracking-[0.15em] font-extrabold truncate max-w-[180px] pointer-events-none"
                            style={{
                              fontSize: `${(currentTpl.groupSize !== undefined ? currentTpl.groupSize : 14) * 0.45}px`,
                              color: currentTpl.groupColor || "#38BDF8",
                              textAlign: currentTpl.groupAlign || "center",
                            }}
                          >
                            {selectedPosterGroup}
                          </p>
                        </div>
                      )}

                      {/* Mock Email */}
                      <div 
                        className={`absolute cursor-grab active:cursor-grabbing hover:outline hover:outline-1 hover:outline-dashed hover:outline-indigo-500/80 hover:outline-offset-2 ${draggingItem === 'email' ? 'outline outline-1 outline-solid outline-indigo-500 ring-4 ring-indigo-500/20' : ''}`}
                        style={{
                          left: currentTpl.emailAlign === "right" ? "auto" : `${currentTpl.emailX !== undefined ? currentTpl.emailX : 50}%`,
                          right: currentTpl.emailAlign === "right" ? `${100 - (currentTpl.emailX !== undefined ? currentTpl.emailX : 50)}%` : "auto",
                          top: `${currentTpl.emailY !== undefined ? currentTpl.emailY : 49}%`,
                          transform: currentTpl.emailAlign === "left" ? "translateY(-50%)" : currentTpl.emailAlign === "right" ? "translateY(-50%)" : "translate(-50%, -50%)",
                          textAlign: currentTpl.emailAlign || "center",
                        }}
                        onMouseDown={(e) => setDraggingItem("email")}
                        title="按住鼠标拖动来调整邮箱位置 / Drag to reposition email"
                      >
                        <p 
                          className="font-mono tracking-normal truncate max-w-[200px] pointer-events-none"
                          style={{
                            fontSize: `${(currentTpl.emailSize !== undefined ? currentTpl.emailSize : 16) * 0.45}px`,
                            color: currentTpl.emailColor || "#94A3B8",
                            textAlign: currentTpl.emailAlign || "center",
                          }}
                        >
                          {sampleWish.email}
                        </p>
                      </div>

                      {/* Mock Goal Text */}
                      <div 
                        className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col justify-center shadow-sm cursor-grab active:cursor-grabbing hover:outline hover:outline-1 hover:outline-dashed hover:outline-indigo-500/80 hover:outline-offset-2 ${
                          currentTpl.goalBgVisible !== false ? "rounded-lg border border-white/5 bg-black/40 backdrop-blur-sm" : ""
                        } ${draggingItem === 'goal' ? 'outline outline-1 outline-solid outline-indigo-500 ring-4 ring-indigo-500/20' : ''}`}
                        style={{
                          left: `${currentTpl.goalX}%`,
                          top: `${currentTpl.goalY}%`,
                          width: `${currentTpl.goalWidth}%`,
                          paddingTop: `${(currentTpl.goalPaddingTop !== undefined ? currentTpl.goalPaddingTop : 20) * 0.45}px`,
                          paddingBottom: `${(currentTpl.goalPaddingBottom !== undefined ? currentTpl.goalPaddingBottom : 20) * 0.45}px`,
                          paddingLeft: `${(currentTpl.goalPaddingLeft !== undefined ? currentTpl.goalPaddingLeft : 40) * 0.45}px`,
                          paddingRight: `${(currentTpl.goalPaddingRight !== undefined ? currentTpl.goalPaddingRight : 40) * 0.45}px`,
                          textAlign: currentTpl.goalAlign || "center",
                          alignItems: currentTpl.goalAlign === "left" ? "flex-start" : currentTpl.goalAlign === "right" ? "flex-end" : "center",
                        }}
                        onMouseDown={(e) => setDraggingItem("goal")}
                        title="按住鼠标拖动来调整目标金句卡位置 / Drag to reposition goal card"
                      >
                        <p 
                          className="italic leading-normal select-none overflow-hidden text-ellipsis line-clamp-3 pointer-events-none w-full"
                          style={{
                            fontSize: `${currentTpl.goalSize * 0.45}px`,
                            color: currentTpl.goalColor
                          }}
                        >
                          "{sampleWish.wish}"
                        </p>
                      </div>

                    </div>
                  </div>

                </div>
              );
            })()}

          </div>
        )}
        {/* Custom Confirmation Modal */}
        {deletingItem && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-6 z-50 animate-fade-in">
            <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-scale-up border-red-500/20">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mx-auto">
                <AlertCircle className="w-6 h-6 animate-pulse" />
              </div>
              <div className="text-center space-y-2">
                <h4 className="text-base font-semibold text-slate-100">
                  {lang === "zh" ? "确认删除档案" : "Confirm Deletion"}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {lang === "zh"
                    ? `您确定要永久删除 ${deletingItem.username} 的心愿目标与奋斗档案吗？此操作将立即从胶囊主账本中抹除。`
                    : `Are you sure you want to permanently delete the profile and goals for ${deletingItem.username}? This action is irreversible.`}
                </p>
              </div>

              {deleteErrorMessage && (
                <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/20 text-red-400 text-xs text-left">
                  {deleteErrorMessage}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => {
                    setDeletingItem(null);
                    setDeleteErrorMessage(null);
                  }}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700/60 py-2 rounded-xl text-xs font-medium text-slate-300 transition cursor-pointer"
                >
                  {lang === "zh" ? "取消" : "Cancel"}
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="flex-1 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white py-2 rounded-xl text-xs font-semibold shadow-md hover:shadow-lg disabled:opacity-50 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isDeleting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {lang === "zh" ? "正在擦除..." : "Deleting..."}
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      {lang === "zh" ? "确定删除" : "Delete"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
