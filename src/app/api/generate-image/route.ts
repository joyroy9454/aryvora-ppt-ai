import { NextRequest, NextResponse } from "next/server";

/**
 * AI Image Generation endpoint.
 * Uses OpenRouter's image generation models.
 *
 * Supported models (via OpenRouter):
 * - stabilityai/stable-diffusion-3
 * - black-forest-labs/flux-schnell
 * - stabilityai/stable-diffusion-xl
 */

const IMAGE_MODEL =
  process.env.OPENROUTER_IMAGE_MODEL || "stabilityai/stable-diffusion-3";

export async function POST(request: NextRequest) {
  try {
    const { prompt, size, style } = await request.json() as {
      prompt: string;
      size?: string;
      style?: string;
    };

    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 3) {
      return NextResponse.json(
        { error: "Please provide a description for the image." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenRouter API key not configured." },
        { status: 500 }
      );
    }

    // Build the image generation prompt
    let enhancedPrompt = prompt.trim();
    if (style) {
      enhancedPrompt = `${enhancedPrompt}, ${style}`;
    }
    // Add quality modifiers
    enhancedPrompt = `${enhancedPrompt}, high quality, professional, clean, no text, no watermark`;

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://aryvora.com",
          "X-Title": "Aryvora PPT AI",
        },
        body: JSON.stringify({
          model: IMAGE_MODEL,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Generate an image: ${enhancedPrompt}`,
                },
              ],
            },
          ],
          modalities: ["image", "text"],
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      let message = `Image generation failed (${response.status})`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error?.message) message = parsed.error.message;
      } catch {
        /* ignore */
      }
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const data = await response.json();

    // Try to extract image URL from response
    // OpenRouter image models return images in different formats
    let imageUrl: string | null = null;

    // Format 1: DALL-E style (images array in response)
    if (data.images?.[0]?.url) {
      imageUrl = data.images[0].url;
    }
    // Format 2: Content blocks with image_url
    else if (data.choices?.[0]?.message?.content_blocks) {
      for (const block of data.choices[0].message.content_blocks) {
        if (block.image_url?.url) {
          imageUrl = block.image_url.url;
          break;
        }
      }
    }
    // Format 3: Direct image_url in content
    else if (typeof data.choices?.[0]?.message?.content === "string") {
      const content = data.choices[0].message.content;
      // Check if content is a URL
      if (content.startsWith("http") && (content.includes(".png") || content.includes(".jpg") || content.includes(".webp"))) {
        imageUrl = content.trim();
      }
      // Check for markdown image syntax
      const mdMatch = content.match(/!\[.*?\]\((https?:\/\/[^)]+\.(?:png|jpg|webp|gif))\)/i);
      if (mdMatch) imageUrl = mdMatch[1];
    }
    // Format 4: Base64 image data
    else if (data.choices?.[0]?.message?.content_blocks) {
      for (const block of data.choices[0].message.content_blocks) {
        if (block.image_url?.url) {
          imageUrl = block.image_url.url;
          break;
        }
        if (block.image?.base64) {
          imageUrl = `data:image/png;base64,${block.image.base64}`;
          break;
        }
      }
    }

    if (!imageUrl) {
      // If we can't extract an image URL, return the raw response for debugging
      return NextResponse.json(
        {
          error: "Could not extract image from response. The image model may not be available on OpenRouter.",
          debug: {
            hasChoices: !!data.choices,
            contentKeys: data.choices?.[0]?.message
              ? Object.keys(data.choices[0].message)
              : [],
          },
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      imageUrl,
      prompt: enhancedPrompt,
      model: IMAGE_MODEL,
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
