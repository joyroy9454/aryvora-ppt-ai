import { NextRequest, NextResponse } from "next/server";

/**
 * Fetches content from a URL and extracts readable text.
 * Used for "URL to presentation" and "Blog to presentation" modes.
 */
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "A valid URL is required." },
        { status: 400 }
      );
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format. Please include https://" },
        { status: 400 }
      );
    }

    // Fetch the page
    const response = await fetch(parsedUrl.href, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; AryvoraBot/1.0; +https://aryvora.com)",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL (${response.status}). Make sure the URL is publicly accessible.` },
        { status: 502 }
      );
    }

    const html = await response.text();

    // Extract text content
    const extracted = extractContent(html, parsedUrl.href);

    if (extracted.text.length < 50) {
      return NextResponse.json(
        {
          error:
            "Could not extract meaningful content from this URL. Try a different page or paste the content directly.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      text: extracted.text,
      title: extracted.title,
      url: parsedUrl.href,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      return NextResponse.json(
        { error: "Request timed out. The page took too long to load." },
        { status: 504 }
      );
    }
    console.error("URL fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch URL. Please check the link and try again." },
      { status: 500 }
    );
  }
}

function extractContent(html: string, _url: string): { text: string; title: string } {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch?.[1]?.trim() || "";

  // Remove script, style, nav, footer, header, aside elements
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  // Try to find main content area
  const mainMatch = cleaned.match(
    /<main[\s\S]*?<\/main>/i
  );
  const articleMatch = cleaned.match(
    /<article[\s\S]*?<\/article>/i
  );
  const contentMatch = cleaned.match(
    /<div[^>]*class="[^"]*(?:content|article|post|entry|main)[^"]*"[\s\S]*?<\/div>/i
  );

  let content = mainMatch?.[0] || articleMatch?.[0] || contentMatch?.[0] || cleaned;

  // Extract text from common content elements
  const textParts: string[] = [];

  // Headings
  const headings = content.match(/<h[1-4][^>]*>([^<]+)<\/h[1-4]>/gi) || [];
  for (const h of headings) {
    const text = h.replace(/<[^>]+>/g, "").trim();
    if (text) textParts.push(text);
  }

  // Paragraphs
  const paragraphs = content.match(/<p[^>]*>([^<]+)<\/p>/gi) || [];
  for (const p of paragraphs) {
    const text = p.replace(/<[^>]+>/g, "").trim();
    if (text && text.length > 20) textParts.push(text);
  }

  // List items
  const listItems = content.match(/<li[^>]*>([^<]+)<\/li>/gi) || [];
  for (const li of listItems) {
    const text = li.replace(/<[^>]+>/g, "").trim();
    if (text && text.length > 10) textParts.push("• " + text);
  }

  // If we didn't get enough content, fall back to body text
  if (textParts.length < 3) {
    const bodyMatch = cleaned.match(/<body[\s\S]*?<\/body>/i);
    const bodyText = (bodyMatch?.[0] || cleaned)
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return {
      text: bodyText.substring(0, 8000),
      title,
    };
  }

  return {
    text: textParts.join("\n\n").substring(0, 8000),
    title,
  };
}
