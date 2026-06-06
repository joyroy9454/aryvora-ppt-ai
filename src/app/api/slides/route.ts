import { NextRequest, NextResponse } from "next/server";
import type { Slide } from "@/types";

function buildSlideId(index: number): string {
  return `slide-${Date.now()}-${index}`;
}

export async function POST(request: NextRequest) {
  try {
    const { topic, slideCount, outline, theme } = await request.json();

    if (!topic || typeof topic !== "string" || topic.trim().length < 2) {
      return NextResponse.json(
        { error: "A valid topic is required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenRouter API key not configured. Set OPENROUTER_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    const count = Math.min(Math.max(Number(slideCount) || 8, 3), 20);
    const selectedTheme = (theme as string) || "corporate";
    const outlineStr = Array.isArray(outline) ? outline.join("\n") : "";

    const themeDescriptions: Record<string, string> = {
      corporate: "professional blue tones, clean sans-serif, structured layout",
      creative: "vibrant accent colors, dynamic layouts with visual interest",
      minimal: "lots of whitespace, restrained typography, understated elegance",
      bold: "high contrast, large type, confident and impactful",
    };

    const systemPrompt = `You are a presentation design expert. Generate slide content for a PowerPoint presentation.

Return ONLY a JSON array of slide objects. Each slide object must have:
- "type": one of "title", "content", "two-column", "closing"
- "heading": string (the slide title)
- "sub": string (subtitle, optional)
- "bullets": array of strings (for content slides, 3-6 bullets)
- "leftCol": array of strings (for two-column slides, 3-4 items each)
- "rightCol": array of strings (for two-column slides, 3-4 items each)

Rules:
- First slide MUST be type "title"
- Last slide MUST be type "closing"
- Middle slides should alternate between "content" and "two-column" where appropriate
- Keep bullet points concise (max 15 words each)
- Use the theme style: ${themeDescriptions[selectedTheme] || themeDescriptions.corporate}
- For "closing" type slides, bullets can include Q&A, contact info, next steps

IMPORTANT: Return ONLY the raw JSON array, no markdown, no explanation.`;

    const userPrompt = `Create a ${count}-slide presentation about: "${topic}"

${outlineStr ? `Suggested outline to follow:\n${outlineStr}` : ""}

Generate engaging, informative content. The closing slide should have 2-3 action items or next steps.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://aryvora.com",
        "X-Title": "Aryvora PPT AI",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      let message = `OpenRouter API error (${response.status})`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error?.message) message = parsed.error.message;
      } catch { /* ignore parse error */ }
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content ?? "";

    // Parse the JSON - handle both { slides: [...] } and raw [...] formats
    let slides: Slide[] = [];
    try {
      const parsed = JSON.parse(raw);
      const slideArray = Array.isArray(parsed) ? parsed : parsed.slides || parsed.presentation || [];
      slides = slideArray.map((s: Slide, i: number) => ({
        ...s,
        id: buildSlideId(i),
      }));
    } catch {
      // Try to extract JSON from markdown blocks
      const match = raw.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
      if (match) {
        try {
          const parsed = JSON.parse(match[1]);
          const slideArray = Array.isArray(parsed) ? parsed : parsed.slides || [];
          slides = slideArray.map((s: Slide, i: number) => ({
            ...s,
            id: buildSlideId(i),
          }));
        } catch {
          // Fall through to error
        }
      }
    }

    if (!slides || slides.length === 0) {
      // Fallback: generate basic slides
      slides = generateFallbackSlides(topic, count);
    }

    return NextResponse.json({ slides });
  } catch (err) {
    console.error("Slides API error:", err);
    return NextResponse.json(
      { error: "Failed to generate slides. Please try again." },
      { status: 500 }
    );
  }
}

function generateFallbackSlides(topic: string, count: number): Slide[] {
  const slides: Slide[] = [
    {
      id: buildSlideId(0),
      type: "title",
      heading: topic,
      sub: "An Overview",
    },
  ];

  for (let i = 1; i < count - 1; i++) {
    slides.push({
      id: buildSlideId(i),
      type: "content",
      heading: `Key Point ${i}`,
      bullets: [
        `Important aspect ${i} of ${topic.toLowerCase()}`,
        `Supporting detail for section ${i}`,
        `Relevant insight about this topic`,
      ],
    });
  }

  slides.push({
    id: buildSlideId(count - 1),
    type: "closing",
    heading: "Thank You",
    sub: topic,
    bullets: ["Questions?", "Contact us for more information"],
  });

  return slides;
}
