import { useState, useRef, useEffect, DragEvent, ChangeEvent, FormEvent } from "react";
import { WishRecord, Language, ColleagueGroup, COLLEAGUE_GROUPS } from "../types";
import { X, Upload, Trash2, Plus, Sparkles, AlertCircle, FileSpreadsheet, Eye, Search, Check, Download } from "lucide-react";
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

        {/* Dynamic scroll content */}
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
