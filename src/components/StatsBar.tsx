"use client";

import type { ChannelSummary } from "@/lib/youtube";
import { Eye, TrendingUp, BarChart2, Clock } from "lucide-react";

function fmt(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function StatsBar({ channel }: { channel: ChannelSummary }) {
  const stats = [
    {
      icon: Eye,
      label: "Avg Views / Video",
      value: fmt(channel.averageViews),
      sub: `Median ${fmt(channel.medianViews)}`,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      icon: TrendingUp,
      label: "Top Trend Score",
      value: channel.topTrendScore.toFixed(1),
      sub: channel.topVideoTitle.length > 30
        ? channel.topVideoTitle.slice(0, 30) + "…"
        : channel.topVideoTitle,
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
    {
      icon: BarChart2,
      label: "Total Views Sampled",
      value: fmt(channel.totalViewsAcrossSample),
      sub: `${channel.totalVideosAnalyzed} videos`,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      icon: Clock,
      label: "Upload Cadence",
      value: `${channel.uploadCadencePerMonth}×`,
      sub: "per month (est.)",
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map(({ icon: Icon, label, value, sub, color, bg }) => (
        <div
          key={label}
          className="rounded-xl border border-gray-800 bg-gray-900 p-4 flex flex-col gap-2"
        >
          <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">{label}</p>
            <p className="text-xl font-bold text-white leading-none">{value}</p>
            <p className="text-xs text-gray-600 mt-1 truncate" title={sub}>{sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
