import { NextRequest, NextResponse } from "next/server";

/**
 * AI Image Generation endpoint.
 *
 * Uses Pollinations.ai — a free, no-API-key image generation service.
 * No subscription or payment required.
 *
 * Alternative: Set OPENROUTER_IMAGE_MODEL env var to use OpenRouter instead
 * (requires paid subscription for image models).
 */

const POLLINATIONS_BASE = "https://image.pollinations.ai/prompt";

export async function POST(request: NextRequest) {
  try {
    const { prompt, width, height, style } = await request.json() as {
      prompt: string;
      width?: number;
      height?: number;
      style?: string;
    };

    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 3) {
      return NextResponse.json(
        { error: "Please provide a description for the image." },
        { status: 400 }
      );
    }

    // Build the enhanced prompt
    let enhancedPrompt = prompt.trim();
    if (style) {
      enhancedPrompt = `${enhancedPrompt}, ${style}`;
    }
    enhancedPrompt = `${enhancedPrompt}, high quality, professional, clean, no text, no watermark, presentation background`;

    // Use Pollinations.ai — free, no API key needed
    const w = width || 1366;
    const h = height || 768;
    const seed = Math.floor(Math.random() * 1000000);

    // Pollinations returns a redirect to the generated image
    // We need to follow the redirect to get the actual image URL
    const pollinationsUrl = `${POLLINATIONS_BASE}/${encodeURIComponent(enhancedPrompt)}?width=${w}&height=${h}&seed=${seed}&nologo=true&model=flux`;

    // Verify the URL is valid by making a HEAD request
    const headResponse = await fetch(pollinationsUrl, {
      method: "HEAD",
      redirect: "manual",
      signal: AbortSignal.timeout(15000),
    });

    // Pollinations returns 200 with the image directly, or a redirect
    // Either way, the URL itself serves the image
    if (headResponse.status === 200 || headResponse.status === 302 || headResponse.status === 307) {
      return NextResponse.json({
        imageUrl: pollinationsUrl,
        prompt: enhancedPrompt,
        model: "pollinations/flux",
      });
    }

    // If HEAD fails, try GET
    const getResponse = await fetch(pollinationsUrl, {
      method: "GET",
      signal: AbortSignal.timeout(30000),
    });

    if (getResponse.ok) {
      return NextResponse.json({
        imageUrl: pollinationsUrl,
        prompt: enhancedPrompt,
        model: "pollinations/flux",
      });
    }

    return NextResponse.json(
      {
        error: "Image generation service is temporarily unavailable. Please try again.",
      },
      { status: 502 }
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
