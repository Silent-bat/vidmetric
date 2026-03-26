export type ChannelVideo = {
  id: string;
  title: string;
  description: string;
  publishedLabel: string;
  publishedAt: string | null;
  viewsLabel: string;
  views: number;
  durationLabel: string;
  durationSeconds: number;
  thumbnailUrl: string;
  videoUrl: string;
  viewsPerDay: number;
  trendScore: number;
  performanceTier: "outperforming" | "steady" | "underperforming";
};

export type ChannelSummary = {
  channelId: string;
  title: string;
  description: string;
  avatarUrl: string;
  channelUrl: string;
  sourceUrl: string;
  totalVideosAnalyzed: number;
  averageViews: number;
  medianViews: number;
  totalViewsAcrossSample: number;
  topVideoTitle: string;
  topVideoViews: number;
  topTrendScore: number;
  uploadCadencePerMonth: number;
};

export type ChannelAnalysis = {
  channel: ChannelSummary;
  videos: ChannelVideo[];
};

type TextNode =
  | string
  | {
      simpleText?: string;
      runs?: Array<{ text?: string }>;
      accessibility?: {
        accessibilityData?: {
          label?: string;
        };
      };
    }
  | null
  | undefined;

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
]);

export function normalizeChannelUrl(input: string): string {
  const trimmed = input.trim();

  if (!trimmed) {
    throw new Error("Enter a YouTube channel URL to analyze.");
  }

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;

  try {
    url = new URL(candidate);
  } catch {
    throw new Error("That doesn’t look like a valid URL.");
  }

  if (!YOUTUBE_HOSTS.has(url.hostname)) {
    throw new Error("Please enter a youtube.com channel URL.");
  }

  const segments = url.pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    throw new Error("Please paste a specific channel URL, not the YouTube homepage.");
  }

  let normalizedPath = "";
  const [first, second] = segments;

  if (first.startsWith("@")) {
    normalizedPath = `/${first}/videos`;
  } else if (["channel", "c", "user"].includes(first) && second) {
    normalizedPath = `/${first}/${second}/videos`;
  } else {
    throw new Error(
      "Supported URL formats include /@handle, /channel/ID, /c/name, and /user/name.",
    );
  }

  return `https://www.youtube.com${normalizedPath}?hl=en&gl=US`;
}

export async function analyzeChannel(channelUrl: string): Promise<ChannelAnalysis> {
  const sourceUrl = normalizeChannelUrl(channelUrl);
  const html = await fetchYoutubePage(sourceUrl);
  const initialData = extractInitialData(html);

  const metadata = findFirst(initialData, (value) => Boolean(value?.channelMetadataRenderer))
    ?.channelMetadataRenderer as
    | {
        title?: string;
        description?: string;
        externalId?: string;
        avatar?: { thumbnails?: Array<{ url?: string }> };
        ownerUrls?: string[];
        channelUrl?: string;
      }
    | undefined;

  const videoRenderers = findAll(initialData, (value) => Boolean(value?.videoRenderer)).map(
    (value) => value.videoRenderer,
  ) as Array<Record<string, unknown>>;

  const videos = dedupeById(videoRenderers.map(mapVideoRendererToVideo)).filter(
    (video): video is ChannelVideo => Boolean(video),
  );

  if (!metadata || !videos.length) {
    throw new Error(
      "We couldn’t extract channel data from that page. Try a public channel URL with a visible Videos tab.",
    );
  }

  const averageViews = Math.round(sum(videos.map((video) => video.views)) / videos.length);
  const medianViews = median(videos.map((video) => video.views));
  const topTrendScore = Math.max(...videos.map((video) => video.trendScore), 0);

  const videosWithPerformance = videos.map((video) => {
    const ratio = averageViews > 0 ? video.views / averageViews : 1;
    const performanceTier: ChannelVideo["performanceTier"] =
      ratio >= 1.25 ? "outperforming" : ratio <= 0.8 ? "underperforming" : "steady";

    return {
      ...video,
      performanceTier,
    };
  });

  const sortedByPublished = [...videosWithPerformance].sort((a, b) => {
    const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return bTime - aTime;
  });

  const oldest = sortedByPublished.at(-1)?.publishedAt;
  const newest = sortedByPublished.at(0)?.publishedAt;
  const monthsCovered =
    oldest && newest
      ? Math.max((new Date(newest).getTime() - new Date(oldest).getTime()) / (1000 * 60 * 60 * 24 * 30), 1)
      : 1;

  const topVideo = [...videosWithPerformance].sort((a, b) => b.views - a.views)[0];

  return {
    channel: {
      channelId: metadata.externalId ?? "unknown",
      title: metadata.title ?? "Untitled channel",
      description: metadata.description ?? "",
      avatarUrl: metadata.avatar?.thumbnails?.at(-1)?.url ?? "",
      channelUrl: metadata.ownerUrls?.[0] ?? metadata.channelUrl ?? sourceUrl,
      sourceUrl,
      totalVideosAnalyzed: videosWithPerformance.length,
      averageViews,
      medianViews,
      totalViewsAcrossSample: sum(videosWithPerformance.map((video) => video.views)),
      topVideoTitle: topVideo?.title ?? "—",
      topVideoViews: topVideo?.views ?? 0,
      topTrendScore,
      uploadCadencePerMonth: Math.round((videosWithPerformance.length / monthsCovered) * 10) / 10,
    },
    videos: videosWithPerformance,
  };
}

async function fetchYoutubePage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      "accept-language": "en-US,en;q=0.9",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`YouTube returned ${response.status}.`);
  }

  return response.text();
}

function extractInitialData(html: string): unknown {
  const marker = "var ytInitialData = ";
  const startIndex = html.indexOf(marker);

  if (startIndex === -1) {
    throw new Error("Unable to locate YouTube page data.");
  }

  let cursor = startIndex + marker.length;
  while (cursor < html.length && /\s/.test(html[cursor])) {
    cursor += 1;
  }

  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = cursor; index < html.length; index += 1) {
    const character = html[index];

    if (start === -1) {
      if (character === "{") {
        start = index;
        depth = 1;
      }
      continue;
    }

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }

    if (character === '"') {
      inString = true;
      continue;
    }

    if (character === "{") {
      depth += 1;
      continue;
    }

    if (character === "}") {
      depth -= 1;
      if (depth === 0) {
        return JSON.parse(html.slice(start, index + 1));
      }
    }
  }

  throw new Error("Unable to parse YouTube page data.");
}

function findFirst(
  value: unknown,
  predicate: (candidate: Record<string, unknown>) => boolean,
): Record<string, unknown> | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  if (!Array.isArray(value) && predicate(value as Record<string, unknown>)) {
    return value as Record<string, unknown>;
  }

  const entries = Array.isArray(value) ? value : Object.values(value);
  for (const entry of entries) {
    const result = findFirst(entry, predicate);
    if (result) {
      return result;
    }
  }

  return null;
}

function findAll(
  value: unknown,
  predicate: (candidate: Record<string, unknown>) => boolean,
  matches: Array<Record<string, unknown>> = [],
): Array<Record<string, unknown>> {
  if (!value || typeof value !== "object") {
    return matches;
  }

  if (!Array.isArray(value) && predicate(value as Record<string, unknown>)) {
    matches.push(value as Record<string, unknown>);
  }

  const entries = Array.isArray(value) ? value : Object.values(value);
  for (const entry of entries) {
    findAll(entry, predicate, matches);
  }

  return matches;
}

function mapVideoRendererToVideo(renderer: Record<string, unknown>): ChannelVideo | null {
  const videoId = typeof renderer.videoId === "string" ? renderer.videoId : "";
  const title = getText(renderer.title as TextNode);

  if (!videoId || !title) {
    return null;
  }

  const publishedLabel = getText(renderer.publishedTimeText as TextNode);
  const publishedAt = parseRelativeDate(publishedLabel);
  const viewsLabel = getText(renderer.viewCountText as TextNode) || "No view data";
  const views = parseCompactNumber(viewsLabel);
  const durationLabel =
    getText(renderer.lengthText as TextNode) ||
    getText((renderer.thumbnailOverlays as Array<Record<string, unknown>> | undefined)?.[0] as TextNode) ||
    "—";
  const durationSeconds = parseDuration(durationLabel);
  const thumbnailUrl =
    ((renderer.thumbnail as { thumbnails?: Array<{ url?: string }> } | undefined)?.thumbnails?.at(-1)?.url as
      | string
      | undefined) ?? "";

  const ageInDays = publishedAt
    ? Math.max((Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24), 1)
    : 30;

  const viewsPerDay = Math.round((views / ageInDays) * 10) / 10;
  const trendScore = Math.round((viewsPerDay / 1000) * 10) / 10;

  return {
    id: videoId,
    title,
    description: getText(renderer.descriptionSnippet as TextNode),
    publishedLabel: publishedLabel || "Unknown publish date",
    publishedAt,
    viewsLabel,
    views,
    durationLabel,
    durationSeconds,
    thumbnailUrl,
    videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
    viewsPerDay,
    trendScore,
    performanceTier: "steady",
  };
}

function getText(value: TextNode): string {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (value.simpleText) {
    return value.simpleText;
  }

  if (Array.isArray(value.runs)) {
    return value.runs.map((run) => run.text ?? "").join("");
  }

  return value.accessibility?.accessibilityData?.label ?? "";
}

function parseCompactNumber(input: string): number {
  const lower = input.toLowerCase();

  if (lower.includes("no views")) {
    return 0;
  }

  const match = lower.match(/([\d,.]+)\s*([kmb])?/i);
  if (!match) {
    return 0;
  }

  const value = Number.parseFloat(match[1].replace(/,/g, ""));
  const suffix = match[2]?.toLowerCase();

  if (!suffix) {
    return Math.round(value);
  }

  const multiplier = suffix === "k" ? 1_000 : suffix === "m" ? 1_000_000 : 1_000_000_000;
  return Math.round(value * multiplier);
}

function parseRelativeDate(input: string): string | null {
  if (!input) {
    return null;
  }

  const match = input
    .toLowerCase()
    .match(/(\d+)\s+(minute|hour|day|week|month|year)s?\s+ago/);

  if (!match) {
    return null;
  }

  const quantity = Number(match[1]);
  const unit = match[2];
  const multiplier =
    unit === "minute"
      ? 1000 * 60
      : unit === "hour"
        ? 1000 * 60 * 60
        : unit === "day"
          ? 1000 * 60 * 60 * 24
          : unit === "week"
            ? 1000 * 60 * 60 * 24 * 7
            : unit === "month"
              ? 1000 * 60 * 60 * 24 * 30
              : 1000 * 60 * 60 * 24 * 365;

  return new Date(Date.now() - quantity * multiplier).toISOString();
}

function parseDuration(input: string): number {
  const match = input.match(/^(\d{1,2}:)?\d{1,2}:\d{2}$/);
  if (!match) {
    return 0;
  }

  const parts = input.split(":").map((part) => Number(part));
  return parts.reduce((total, part) => total * 60 + part, 0);
}

function dedupeById(videos: Array<ChannelVideo | null>): Array<ChannelVideo | null> {
  const seen = new Set<string>();
  return videos.filter((video) => {
    if (!video || seen.has(video.id)) {
      return false;
    }
    seen.add(video.id);
    return true;
  });
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function median(values: number[]): number {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const midpoint = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return Math.round((sorted[midpoint - 1] + sorted[midpoint]) / 2);
  }

  return sorted[midpoint];
}
