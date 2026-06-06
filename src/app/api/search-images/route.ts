import { NextRequest, NextResponse } from "next/server";

/**
 * Free stock photo search endpoint.
 *
 * Uses Unsplash Source (free, no API key required) to get relevant images.
 * Falls back to Picsum Photos for generic placeholders.
 *
 * No subscription or payment required.
 */

export async function POST(request: NextRequest) {
  try {
    const { query, count } = await request.json() as {
      query: string;
      count?: number;
    };

    if (!query || typeof query !== "string" || query.trim().length < 1) {
      return NextResponse.json(
        { error: "Please provide a search query." },
        { status: 400 }
      );
    }

    const num = Math.min(count || 3, 6);
    const keywords = query.trim().split(/\s+/).slice(0, 3).join(",");

    // Build Unsplash Source URLs — free, no API key, no rate limit
    // Each call returns a random image matching the keywords
    const images: { url: string; thumb: string; alt: string }[] = [];

    for (let i = 0; i < num; i++) {
      const seed = Math.floor(Math.random() * 1000000);
      images.push({
        // Full-size image for slides
        url: `https://source.unsplash.com/1366x768/?${encodeURIComponent(keywords)}&sig=${seed}`,
        // Thumbnail for the editor
        thumb: `https://source.unsplash.com/400x225/?${encodeURIComponent(keywords)}&sig=${seed}`,
        alt: query.trim(),
      });
    }

    return NextResponse.json({
      images,
      query: keywords,
      source: "unsplash",
    });
  } catch (err) {
    console.error("Image search error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to search images. Please try again.",
      },
      { status: 500 }
    );
  }
}
