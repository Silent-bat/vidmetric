import type { Metadata } from "next";
import { AnalyzerApp } from "@/components/AnalyzerApp";

export const metadata: Metadata = {
  title: "VidMetrics – YouTube Competitor Channel Analyzer",
  description:
    "Paste any YouTube channel URL and instantly surface which videos are crushing it. Views, trend scores, and performance tiers at a glance.",
};

export default function Home() {
  return <AnalyzerApp />;
}
