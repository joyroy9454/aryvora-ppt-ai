import { NextRequest, NextResponse } from "next/server";

/**
 * Free stock photo search endpoint — Phase 2: Visual Intelligence.
 *
 * Uses Picsum Photos (free, no API key) as the primary source and
 * Unsplash Source (free, no API key) as the secondary source.
 *
 * No subscription or payment required.
 */

export const revalidate = 3600; // Cache results for 1 hour

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      keyword?: string;
      count?: number;
    };

    const keyword = (body.keyword ?? "").trim();
    if (!keyword || keyword.length < 1) {
      return NextResponse.json(
        { error: "Please provide a search keyword." },
        { status: 400 }
      );
    }

    const count = Math.min(Math.max(body.count ?? 6, 1), 10);
    const encoded = encodeURIComponent(keyword);
    const images: {
      url: string;
      thumb: string;
      alt: string;
      source: "unsplash" | "picsum";
      width: number;
      height: number;
    }[] = [];

    // Generate a mix of Picsum and Unsplash images
    for (let i = 0; i < count; i++) {
      const seed = `${keyword}-${i}-${Date.now()}`;
      const seedEncoded = encodeURIComponent(seed);

      if (i % 2 === 0) {
        // Picsum Photos — deterministic per seed, free, no API key
        images.push({
          url: `https://picsum.photos/seed/${seedEncoded}/800/600`,
          thumb: `https://picsum.photos/seed/${seedEncoded}/400/300`,
          alt: keyword,
          source: "picsum",
          width: 800,
          height: 600,
        });
      } else {
        // Unsplash Source — free, no API key
        images.push({
          url: `https://source.unsplash.com/800x600/?${encoded}&sig=${i}`,
          thumb: `https://source.unsplash.com/400x300/?${encoded}&sig=${i}`,
          alt: keyword,
          source: "unsplash",
          width: 800,
          height: 600,
        });
      }
    }

    return NextResponse.json(
      { images },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
        },
      }
    );
  } catch (err) {
    console.error("Image search error:", err);
    return NextResponse.json(
      {
        images: [],
        error:
          err instanceof Error
            ? err.message
            : "Failed to search images. Please try again.",
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
