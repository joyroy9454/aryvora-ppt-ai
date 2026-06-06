import { NextRequest, NextResponse } from "next/server";
import type { Slide } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { slide } = await request.json();

    if (!slide || !slide.id || !slide.type) {
      return NextResponse.json(
        { error: "A valid slide object is required." },
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

    const systemPrompt = `You are a presentation design expert. Given an existing slide, return an improved version of it.

Return ONLY the updated slide as a raw JSON object with the same structure:
{
  "type": "${slide.type}",
  "heading": "string",
  "sub": "string (optional)",
  "bullets": ["string", ...],
  "leftCol": ["string", ...],
  "rightCol": ["string", ...]
}

Rules:
- Keep the same slide type
- Improve clarity, impact, and conciseness
- Keep bullet points to 3-6 per list
- Each bullet max 15 words
- Return ONLY raw JSON, no markdown.`;

    const userPrompt = `Improve this slide:
Type: ${slide.type}
Heading: ${slide.heading}
${slide.sub ? `Subtitle: ${slide.sub}` : ""}
${slide.bullets ? `Bullets: ${JSON.stringify(slide.bullets)}` : ""}
${slide.leftCol ? `Left column: ${JSON.stringify(slide.leftCol)}` : ""}
${slide.rightCol ? `Right column: ${JSON.stringify(slide.rightCol)}` : ""}`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://aryvora.com",
        "X-Title": "Aryvora PPT AI",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "openrouter/owl-alpha",
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
      } catch { /* ignore */ }
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content ?? "";

    let improvedSlide: Omit<Slide, "id">;
    try {
      improvedSlide = JSON.parse(raw);
    } catch {
      const match = raw.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
      if (match) {
        improvedSlide = JSON.parse(match[1]);
      } else {
        return NextResponse.json(
          { error: "Could not parse improved slide." },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({ slide: { ...improvedSlide, id: slide.id } });
  } catch (err) {
    console.error("Regenerate slide API error:", err);
    return NextResponse.json(
      { error: "Failed to regenerate slide. Please try again." },
      { status: 500 }
    );
  }
}
