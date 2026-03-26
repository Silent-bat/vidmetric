"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import type { ChannelAnalysis, ChannelVideo } from "@/lib/youtube";
import { ChannelHeader } from "./ChannelHeader";
import { StatsBar } from "./StatsBar";
import { SortFilterBar } from "./SortFilterBar";
import { VideoCard } from "./VideoCard";
import { ViewsChart } from "./ViewsChart";
import { Search, Loader2, AlertCircle, TrendingUp } from "lucide-react";

type SortKey = "views" | "viewsPerDay" | "trendScore" | "publishedAt" | "durationSeconds";
type FilterTier = "all" | "outperforming" | "steady" | "underperforming";

export function AnalyzerApp() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ChannelAnalysis | null>(null);

  const [sortKey, setSortKey] = useState<SortKey>("views");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [filterTier, setFilterTier] = useState<FilterTier>("all");
  const [search, setSearch] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  const analyze = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setData(null);
    setFilterTier("all");
    setSearch("");
    setSortKey("views");
    setSortDir("desc");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelUrl: trimmed }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Analysis failed.");
      setData(json as ChannelAnalysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  }, [url]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") analyze();
    },
    [analyze],
  );

  const filteredVideos = useMemo<ChannelVideo[]>(() => {
    if (!data) return [];
    let vids = data.videos;
    if (filterTier !== "all") vids = vids.filter((v) => v.performanceTier === filterTier);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      vids = vids.filter((v) => v.title.toLowerCase().includes(q));
    }
    vids = [...vids].sort((a, b) => {
      const av = a[sortKey] as number | string | null;
      const bv = b[sortKey] as number | string | null;
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "desc"
          ? bv.localeCompare(av)
          : av.localeCompare(bv);
      }
      const diff = (av as number) - (bv as number);
      return sortDir === "desc" ? -diff : diff;
    });
    return vids;
  }, [data, filterTier, search, sortKey, sortDir]);

  const handleExport = useCallback(() => {
    if (!data) return;
    const rows = [
      ["Title", "Published", "Views", "Views/Day", "Trend Score", "Duration", "Tier", "URL"],
      ...filteredVideos.map((v) => [
        `"${v.title.replace(/"/g, '""')}"`,
        v.publishedLabel,
        v.views,
        v.viewsPerDay,
        v.trendScore,
        v.durationLabel,
        v.performanceTier,
        v.videoUrl,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${data.channel.title.replace(/\s+/g, "_")}_analysis.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, [data, filteredVideos]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
      {/* Top nav */}
      <header className="border-b border-gray-800 bg-gray-950/80 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <TrendingUp className="w-5 h-5 text-red-500" />
            <span className="font-semibold text-sm tracking-tight text-white">VidMetrics</span>
          </div>
          <div className="flex items-center gap-2 flex-1 max-w-xl">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="youtube.com/@channel  or  youtube.com/channel/UC…"
                className="w-full h-9 bg-gray-800 border border-gray-700 rounded-lg text-sm pl-3 pr-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/60 focus:border-red-500 transition"
              />
            </div>
            <button
              onClick={analyze}
              disabled={loading || !url.trim()}
              className="shrink-0 h-9 px-4 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing…</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Analyze</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero / empty state */}
        {!loading && !data && !error && (
          <div className="flex flex-col items-center justify-center py-32 text-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-red-600/10 flex items-center justify-center ring-1 ring-red-600/30">
              <TrendingUp className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
                Competitor Channel Analyzer
              </h1>
              <p className="text-gray-400 text-base max-w-md">
                Paste any YouTube channel URL above to instantly surface which videos are
                crushing it — views, momentum, and trend scores at a glance.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 text-sm text-gray-500">
              {[
                "youtube.com/@mkbhd",
                "youtube.com/@veritasium",
                "youtube.com/channel/UCBcRF18a7Qf58cCRy5xuWwQ",
              ].map((ex) => (
                <button
                  key={ex}
                  onClick={() => setUrl(`https://www.${ex}`)}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-md transition font-mono text-xs"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-6 animate-pulse">
            <div className="flex gap-4 items-center">
              <div className="w-16 h-16 rounded-full bg-gray-800 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-48 bg-gray-800 rounded" />
                <div className="h-3 w-80 bg-gray-800 rounded" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-gray-800 rounded-xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-48 bg-gray-800 rounded-xl" />
              ))}
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center ring-1 ring-red-500/30">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-white font-semibold mb-1">Analysis failed</p>
              <p className="text-gray-400 text-sm max-w-sm">{error}</p>
            </div>
            <button
              onClick={() => { setError(null); inputRef.current?.focus(); }}
              className="text-sm text-red-400 hover:text-red-300 underline underline-offset-2 transition"
            >
              Try again
            </button>
          </div>
        )}

        {/* Results */}
        {data && !loading && (
          <div className="space-y-8">
            <ChannelHeader channel={data.channel} />
            <StatsBar channel={data.channel} />
            <ViewsChart videos={data.videos} />
            <SortFilterBar
              sortKey={sortKey}
              sortDir={sortDir}
              filterTier={filterTier}
              search={search}
              totalCount={data.videos.length}
              filteredCount={filteredVideos.length}
              onSortKey={setSortKey}
              onSortDir={setSortDir}
              onFilterTier={setFilterTier}
              onSearch={setSearch}
              onExport={handleExport}
            />
            {filteredVideos.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                No videos match the current filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVideos.map((video) => (
                  <VideoCard key={video.id} video={video} channelAvg={data.channel.averageViews} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-gray-800 mt-16 py-6 text-center text-xs text-gray-600">
        VidMetrics © {new Date().getFullYear()} · Built for enterprise creators &amp; agencies
      </footer>
    </div>
  );
}
