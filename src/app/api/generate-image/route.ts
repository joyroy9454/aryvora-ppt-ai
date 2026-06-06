import { NextRequest, NextResponse } from "next/server";

/**
 * Single-image generation endpoint — Phase 2: Visual Intelligence.
 *
 * Uses Picsum Photos (free, no API key) to generate a deterministic
 * image URL from a keyword.
 *
 * No subscription or payment required.
 */

export const revalidate = 3600; // Cache for 1 hour

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      keyword?: string;
      width?: number;
      height?: number;
    };

    const keyword = (body.keyword ?? "").trim();
    if (!keyword || keyword.length < 1) {
      return NextResponse.json(
        { error: "Please provide a keyword." },
        { status: 400 }
      );
    }

    const width = Math.min(Math.max(body.width ?? 800, 100), 1920);
    const height = Math.min(Math.max(body.height ?? 600, 100), 1080);
    const seed = encodeURIComponent(keyword);

    const url = `https://picsum.photos/seed/${seed}/${width}/${height}`;

    return NextResponse.json(
      { url, keyword },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
        },
      }
    );
  } catch (err) {
    console.error("Image generation error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to generate image. Please try again.",
      },
      { status: 500 }
    );
  }
}

// CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
