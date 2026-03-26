"use client";

import { Download, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import clsx from "clsx";

type SortKey = "views" | "viewsPerDay" | "trendScore" | "publishedAt" | "durationSeconds";
type FilterTier = "all" | "outperforming" | "steady" | "underperforming";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "views", label: "Total Views" },
  { value: "viewsPerDay", label: "Views / Day" },
  { value: "trendScore", label: "Trend Score" },
  { value: "publishedAt", label: "Published Date" },
  { value: "durationSeconds", label: "Duration" },
];

const TIER_OPTIONS: { value: FilterTier; label: string; dot: string }[] = [
  { value: "all", label: "All", dot: "bg-gray-500" },
  { value: "outperforming", label: "Outperforming", dot: "bg-emerald-500" },
  { value: "steady", label: "Steady", dot: "bg-yellow-500" },
  { value: "underperforming", label: "Underperforming", dot: "bg-red-500" },
];

interface Props {
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  filterTier: FilterTier;
  search: string;
  totalCount: number;
  filteredCount: number;
  onSortKey: (k: SortKey) => void;
  onSortDir: (d: "asc" | "desc") => void;
  onFilterTier: (t: FilterTier) => void;
  onSearch: (s: string) => void;
  onExport: () => void;
}

export function SortFilterBar({
  sortKey,
  sortDir,
  filterTier,
  search,
  totalCount,
  filteredCount,
  onSortKey,
  onSortDir,
  onFilterTier,
  onSearch,
  onExport,
}: Props) {
  return (
    <div className="space-y-3">
      {/* Row 1: filter + export */}
      <div className="flex flex-wrap items-center gap-2">
        <SlidersHorizontal className="w-4 h-4 text-gray-500 shrink-0" />
        {TIER_OPTIONS.map((t) => (
          <button
            key={t.value}
            onClick={() => onFilterTier(t.value)}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition",
              filterTier === t.value
                ? "bg-gray-100 text-gray-900 border-gray-100"
                : "bg-transparent text-gray-400 border-gray-700 hover:border-gray-500 hover:text-gray-200",
            )}
          >
            <span className={clsx("w-2 h-2 rounded-full shrink-0", t.dot)} />
            {t.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      {/* Row 2: sort + search + count */}
      <div className="flex flex-wrap items-center gap-2">
        <ArrowUpDown className="w-4 h-4 text-gray-500 shrink-0" />
        <select
          value={sortKey}
          onChange={(e) => onSortKey(e.target.value as SortKey)}
          className="h-8 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-200 pl-2 pr-6 focus:outline-none focus:ring-1 focus:ring-red-500/50 transition"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button
          onClick={() => onSortDir(sortDir === "desc" ? "asc" : "desc")}
          className="h-8 px-2.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-400 hover:text-white transition"
          title={sortDir === "desc" ? "Descending" : "Ascending"}
        >
          {sortDir === "desc" ? "↓ Desc" : "↑ Asc"}
        </button>
        <div className="flex-1 max-w-xs">
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search videos…"
            className="w-full h-8 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white placeholder:text-gray-500 pl-3 focus:outline-none focus:ring-1 focus:ring-red-500/50 transition"
          />
        </div>
        <span className="text-xs text-gray-600 ml-1">
          {filteredCount === totalCount
            ? `${totalCount} videos`
            : `${filteredCount} of ${totalCount} videos`}
        </span>
      </div>
    </div>
  );
}
