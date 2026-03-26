"use client";

import type { ChannelSummary } from "@/lib/youtube";
import { ExternalLink } from "lucide-react";
import Image from "next/image";

export function ChannelHeader({ channel }: { channel: ChannelSummary }) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      {channel.avatarUrl ? (
        <Image
          src={channel.avatarUrl}
          alt={channel.title}
          width={64}
          height={64}
          className="w-16 h-16 rounded-full object-cover ring-2 ring-gray-700 shrink-0"
          unoptimized
        />
      ) : (
        <div className="w-16 h-16 rounded-full bg-gray-800 ring-2 ring-gray-700 shrink-0 flex items-center justify-center text-2xl font-bold text-gray-400">
          {channel.title.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-xl font-bold text-white truncate">{channel.title}</h2>
          <a
            href={channel.channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-red-400 transition shrink-0"
            aria-label="Open channel on YouTube"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
        {channel.description && (
          <p className="mt-1 text-sm text-gray-400 line-clamp-2 max-w-2xl">
            {channel.description}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-600">
          Analyzed {channel.totalVideosAnalyzed} recent video
          {channel.totalVideosAnalyzed !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}
