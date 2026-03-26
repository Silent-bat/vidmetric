import { NextRequest, NextResponse } from "next/server";

import { analyzeChannel } from "@/lib/youtube";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { channelUrl?: string };
    const channelUrl = body.channelUrl?.trim();

    if (!channelUrl) {
      return NextResponse.json({ error: "A channel URL is required." }, { status: 400 });
    }

    const analysis = await analyzeChannel(channelUrl);
    return NextResponse.json(analysis);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected analysis error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
