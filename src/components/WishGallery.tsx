import { useState, useMemo } from "react";
import { WishRecord, Language, ColleagueGroup, COLLEAGUE_GROUPS } from "../types";
import { Search, Calendar, ArrowUpRight, Sparkles, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { translations } from "../locales";

interface WishGalleryProps {
  wishes: WishRecord[];
  onSelectWish: (wish: WishRecord) => void;
  lang: Language;
}

type SortOption = "date_desc" | "date_asc" | "name_asc" | "name_desc";

export default function WishGallery({ wishes, onSelectWish, lang }: WishGalleryProps) {
  const t = translations[lang];
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date_desc");
  const [selectedGroup, setSelectedGroup] = useState<string>("All");

  // Format dates beautifully
  const formatWishDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
    } catch {
      return "2026/06";
    }
  };

  // Compute filtered & sorted wishes
  const processedWishes = useMemo(() => {
    let result = [...wishes];

    // 1. Text Search Filter (Matches username, email, group, and goal content)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        item =>
          item.username.toLowerCase().includes(query) ||
          item.email.toLowerCase().includes(query) ||
          item.wish.toLowerCase().includes(query) ||
          (item.group || "Builder").toLowerCase().includes(query)
      );
    }

    // 2. Archetype Group Filter Tab
    if (selectedGroup !== "All") {
      result = result.filter(item => (item.group || "Builder") === selectedGroup);
    }

    // 3. Sorting Mechanics
    result.sort((a, b) => {
      if (sortBy === "date_desc") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "date_asc") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === "name_asc") {
        return a.username.localeCompare(b.username);
      }
      if (sortBy === "name_desc") {
        return b.username.localeCompare(a.username);
      }
      return 0;
    });

    return result;
  }, [wishes, searchQuery, sortBy, selectedGroup]);

  return (
    <div id="wish-corridor-section" className="w-full mt-16 pt-12 border-t border-white/5 space-y-8">
      
      {/* Gallery Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="text-left space-y-1.5">
          <h3 className="text-xl md:text-2xl font-display font-light text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            {t.galleryTitle}
          </h3>
          <p className="text-xs text-white/40 tracking-wide">
            {t.gallerySubtitle}
          </p>
        </div>

        {/* Live Counters */}
        <div className="text-right">
          <span className="text-xs font-mono bg-white/5 text-white/50 border border-white/10 px-3 py-1.5 rounded-full">
            {t.galleryCounterPrefix} <strong className="text-blue-400 font-bold">{wishes.length}</strong> {t.galleryCounterSuffix}
          </span>
        </div>
      </div>

      {/* Filter and Search Dashboard Control Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-3xl backdrop-blur-xl">
        
        {/* Keyword Input */}
        <div className="lg:col-span-6 relative flex items-center">
          <Search className="absolute left-4 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/5 hover:border-white/10 focus:border-blue-500/30 rounded-2xl text-xs text-white placeholder-white/30 focus:outline-none transition-all font-light"
          />
        </div>

        {/* Date / Name Sorting Options */}
        <div className="lg:col-span-3 relative flex items-center">
          <ArrowUpDown className="absolute left-4 w-4 h-4 text-white/30" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/5 hover:border-white/10 focus:border-blue-500/30 rounded-2xl text-xs text-white/80 focus:outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="date_desc" className="bg-[#0c0d12]">{t.sortByDateDesc}</option>
            <option value="date_asc" className="bg-[#0c0d12]">{t.sortByDateAsc}</option>
            <option value="name_asc" className="bg-[#0c0d12]">{t.sortByNameAsc}</option>
            <option value="name_desc" className="bg-[#0c0d12]">{t.sortByNameDesc}</option>
          </select>
        </div>

        {/* Group Filter */}
        <div className="lg:col-span-3 relative flex items-center">
          <SlidersHorizontal className="absolute left-4 w-4 h-4 text-white/30" />
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/5 hover:border-white/10 focus:border-blue-500/30 rounded-2xl text-xs text-white/80 focus:outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="All" className="bg-[#0c0d12]">{t.alphabetFilter}</option>
            {COLLEAGUE_GROUPS.map(grpName => (
              <option key={grpName} value={grpName} className="bg-[#0c0d12]">
                {t[`group${grpName}` as keyof typeof t] || grpName}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Wish list Grid Cards */}
      {processedWishes.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center bg-white/[0.01] border border-dashed border-white/5 rounded-3xl space-y-3">
          <Search className="w-8 h-8 text-white/10 animate-pulse" />
          <p className="text-sm text-white/40 font-light">
            {t.noMatches}
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedGroup("All");
              setSortBy("date_desc");
            }}
            className="text-xs text-blue-400 hover:text-blue-300 underline font-mono cursor-pointer"
          >
            {t.resetFilters}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {processedWishes.map((item) => {
            const grp = item.group || "Builder";
            return (
              <div
                key={item.id}
                onClick={() => onSelectWish(item)}
                className="relative p-6 bg-white/5 hover:bg-white/[0.08] border border-white/5 hover:border-white/10 rounded-3xl backdrop-blur-md transition-all duration-300 flex flex-col justify-between text-left group cursor-pointer hover:-translate-y-1 shadow-md hover:shadow-xl"
              >
                {/* Card top edge micro line decoration */}
                <div className="absolute top-4 right-4 w-1.5 h-1.5 border-t border-r border-white/20 group-hover:border-blue-400/50 transition-colors" />
                <div className="absolute bottom-4 left-4 w-1.5 h-1.5 border-b border-l border-white/20 group-hover:border-blue-400/50 transition-colors" />

                {/* Card body */}
                <div className="space-y-4">
                  {/* Employee Header Metadata */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white/10 bg-white/5 shrink-0">
                      <img
                        src={item.photoUrl}
                        alt={item.username}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-medium text-white truncate group-hover:text-blue-300 transition-colors">
                        {item.username}
                      </h4>
                      <span className="text-[10px] text-white/30 truncate block font-mono">
                        {item.email}
                      </span>
                      {/* Character Division Badge */}
                      <span className="inline-block text-[9px] font-mono font-medium tracking-wide px-1.5 py-0.5 mt-1 bg-white/5 border border-white/10 rounded text-sky-300/80">
                        {t[`group${grp}` as keyof typeof t] || grp}
                      </span>
                    </div>
                  </div>

                  {/* Truncated Goal Content */}
                  <p className="text-xs text-white/60 leading-relaxed font-light line-clamp-3 italic min-h-[54px] select-text">
                    "{item.wish}"
                  </p>
                </div>

                {/* Bottom detail row */}
                <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-white/30">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-400/50" />
                    {formatWishDate(item.createdAt)}
                  </span>
                  <span className="flex items-center gap-0.5 text-blue-400 opacity-60 group-hover:opacity-100 font-sans font-bold uppercase tracking-wider text-[9px] transition-opacity">
                    {t.summonWish}
                    <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
