import { NextRequest, NextResponse } from "next/server";

/**
 * AI Image Generation endpoint.
 *
 * Uses Pollinations.ai — a free, no-API-key image generation service.
 * No subscription or payment required.
 *
 * Pollinations generates images on-the-fly from the URL itself.
 * The URL IS the image — no separate API call needed.
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

    // Pollinations.ai — the URL itself serves the generated image
    // No API key needed, no verification needed
    const w = width || 1366;
    const h = height || 768;
    const seed = Math.floor(Math.random() * 1000000);

    const imageUrl = `${POLLINATIONS_BASE}/${encodeURIComponent(enhancedPrompt)}?width=${w}&height=${h}&seed=${seed}&nologo=true`;

    return NextResponse.json({
      imageUrl,
      prompt: enhancedPrompt,
      model: "pollinations/flux",
    });
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
