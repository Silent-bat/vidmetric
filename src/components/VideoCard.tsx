"use client";

import type { ChannelVideo } from "@/lib/youtube";
import { Eye, Clock, TrendingUp, TrendingDown, Minus } from "lucide-react";
import Image from "next/image";
import clsx from "clsx";

function fmtViews(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

const tierConfig = {
  outperforming: {
    label: "Outperforming",
    icon: TrendingUp,
    classes: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    bar: "bg-emerald-500",
  },
  steady: {
    label: "Steady",
    icon: Minus,
    classes: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    bar: "bg-yellow-500",
  },
  underperforming: {
    label: "Underperforming",
    icon: TrendingDown,
    classes: "text-red-400 bg-red-500/10 border-red-500/30",
    bar: "bg-red-500",
  },
};

export function VideoCard({
  video,
  channelAvg,
}: {
  video: ChannelVideo;
  channelAvg: number;
}) {
  const tier = tierConfig[video.performanceTier];
  const TierIcon = tier.icon;
  const barPct = Math.min(Math.round((video.views / (channelAvg * 2 || 1)) * 100), 100);

  return (
    <a
      href={video.videoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-col bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-600 transition-all hover:shadow-xl hover:shadow-black/40 focus:outline-none focus:ring-2 focus:ring-red-500/60"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-800 overflow-hidden">
        {video.thumbnailUrl ? (
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-700">
            <Eye className="w-8 h-8" />
          </div>
        )}
        {/* Duration badge */}
        {video.durationLabel !== "—" && (
          <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-mono px-1.5 py-0.5 rounded">
            {video.durationLabel}
          </span>
        )}
        {/* Tier badge */}
        <span
          className={clsx(
            "absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
            tier.classes,
          )}
        >
          <TierIcon className="w-3 h-3" />
          {tier.label}
        </span>
      </div>

      {/* Card body */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <h3 className="text-sm font-medium text-white leading-snug line-clamp-2 group-hover:text-red-300 transition-colors">
          {video.title}
        </h3>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {fmtViews(video.views)} views
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {video.publishedLabel}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs mt-auto pt-1">
          <div className="flex items-center gap-1 text-gray-400">
            <TrendingUp className="w-3 h-3 text-red-400" />
            <span className="font-medium">{video.trendScore.toFixed(1)}</span>
            <span className="text-gray-600">trend score</span>
          </div>
          <div className="text-gray-600 ml-auto">{fmtViews(Math.round(video.viewsPerDay))}/day</div>
        </div>

        {/* Performance bar */}
        <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
          <div
            className={clsx("h-full rounded-full transition-all", tier.bar)}
            style={{ width: `${barPct}%` }}
          />
        </div>
      </div>
    </a>
  );
}
