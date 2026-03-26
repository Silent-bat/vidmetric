"use client";

import type { ChannelVideo } from "@/lib/youtube";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
} from "recharts";
import { useMemo } from "react";

function fmtViews(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

const TIER_COLORS: Record<string, string> = {
  outperforming: "#10b981",
  steady: "#eab308",
  underperforming: "#ef4444",
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChannelVideo & { shortTitle: string } }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs shadow-xl max-w-xs">
      <p className="text-white font-medium mb-1 line-clamp-2">{d.title}</p>
      <p className="text-gray-400">{fmtViews(d.views)} views</p>
      <p className="text-gray-500">{d.publishedLabel}</p>
      <p className="text-gray-500">{d.trendScore.toFixed(1)} trend score</p>
    </div>
  );
}

export function ViewsChart({ videos }: { videos: ChannelVideo[] }) {
  const data = useMemo(() => {
    const sorted = [...videos]
      .sort((a, b) => {
        const at = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const bt = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return at - bt;
      })
      .slice(-30); // last 30 by publish date
    return sorted.map((v) => ({
      ...v,
      shortTitle:
        v.title.length > 20 ? v.title.slice(0, 20) + "…" : v.title,
    }));
  }, [videos]);

  const avg = useMemo(() => {
    if (!data.length) return 0;
    return data.reduce((s, v) => s + v.views, 0) / data.length;
  }, [data]);

  if (!data.length) return null;

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Views by Video</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Showing up to 30 most recent · dashed line = channel average
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />Outperforming
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-yellow-500" />Steady
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500" />Under
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="shortTitle"
            tick={{ fontSize: 9, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={fmtViews}
            tick={{ fontSize: 9, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
            width={42}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <ReferenceLine
            y={avg}
            stroke="#6b7280"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
          <Bar dataKey="views" radius={[3, 3, 0, 0]} maxBarSize={40}>
            {data.map((entry) => (
              <Cell
                key={entry.id}
                fill={TIER_COLORS[entry.performanceTier] ?? "#6b7280"}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
