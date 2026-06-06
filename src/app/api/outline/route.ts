import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const topic = body.topic;
    const slideCount = body.slideCount;

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
    const sectionsNeeded = count - 2;

    const systemPrompt =
      "You are a presentation strategy expert. Given a presentation topic, generate a compelling outline.\n\n" +
      "Return ONLY a JSON object with this structure:\n" +
      '{"title": "Compelling presentation title", "subtitle": "Short subtitle or tagline", "outline": ["Section 1 heading", "Section 2 heading", ...]}\n\n' +
      "Rules:\n" +
      "- The outline should have " + sectionsNeeded + " sections (excluding title and closing)\n" +
      "- Each outline item should be a short heading (3-6 words)\n" +
      "- The title should be engaging and specific\n" +
      "- Return ONLY raw JSON, no markdown.";

    const userContent = 'Create an outline for a presentation about: "' + topic + '"';

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
        "HTTP-Referer": "https://aryvora.com",
        "X-Title": "Aryvora PPT AI",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "openrouter/owl-alpha",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      let message = "OpenRouter API error (" + response.status + ")";
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error && parsed.error.message) message = parsed.error.message;
      } catch (_e) {
        // ignore
      }
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const data = await response.json();
    const raw = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "";

    let result: { title: string; subtitle: string; outline: string[] };
    try {
      result = JSON.parse(raw);
    } catch (_e) {
      const match = raw.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
      if (match) {
        result = JSON.parse(match[1]);
      } else {
        throw new Error("Could not parse outline");
      }
    }

    return NextResponse.json({
      title: result.title,
      subtitle: result.subtitle,
      outline: result.outline,
    });
  } catch (err) {
    console.error("Outline API error:", err);
    return NextResponse.json(
      { error: "Failed to generate outline. Please try again." },
      { status: 500 }
    );
  }
}
