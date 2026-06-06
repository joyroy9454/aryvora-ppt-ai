import { NextRequest, NextResponse } from "next/server";
import type { Slide, TemplateId } from "@/types";
import { callAI, parseJSON } from "@/lib/ai-engine";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      slide,
      allSlides,
      templateId,
      analysis,
    } = body as {
      slide: Slide;
      allSlides: Slide[];
      templateId?: TemplateId;
      analysis?: {
        category?: string;
        audience?: string;
        tone?: string;
        purpose?: string;
        keywords?: string[];
      };
    };

    if (!slide || !slide.id) {
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

    // Find the slide's position and get neighboring slides for context
    const slideIndex = allSlides.findIndex((s) => s.id === slide.id);
    const prevSlide = slideIndex > 0 ? allSlides[slideIndex - 1] : null;
    const nextSlide =
      slideIndex < allSlides.length - 1 ? allSlides[slideIndex + 1] : null;

    // Build context from the full presentation
    const presentationContext = allSlides.map((s, i) => ({
      position: i + 1,
      type: s.type,
      heading: s.heading,
      sub: s.sub,
      bullets: s.bullets?.slice(0, 2), // First 2 bullets for context
    }));

    const templateDescriptions: Record<string, string> = {
      corporate: "professional blue tones, clean and structured",
      academic: "formal, citation-friendly, authoritative",
      startup: "bold gradients, high contrast, energetic",
      minimal: "lots of whitespace, restrained typography",
      dark: "dark backgrounds, neon accents, modern tech",
      seminar: "friendly, green tones, approachable",
      marketing: "vibrant warm colors, bold typography",
      research: "data-focused, blue tones, precise",
      education: "purple tones, playful but clear",
      portfolio: "creative pink/coral, elegant serif headings",
    };

    const toneMap: Record<string, string> = {
      formal: "professional and precise, no contractions",
      casual: "conversational and friendly, contractions OK",
      academic: "scholarly and objective, precise terminology",
      persuasive: "compelling and action-oriented",
      inspirational: "uplifting and motivational",
      technical: "precise technical terminology, specific details",
      conversational: "engaging, use 'you' and 'we'",
    };

    const systemPrompt = `You are an expert presentation designer. Regenerate a single slide to improve its quality while maintaining coherence with the surrounding presentation.

═══════════════════════════════════════
SLIDE TO REGENERATE
═══════════════════════════════════════
- Type: ${slide.type}
- Current heading: "${slide.heading}"
${slide.sub ? `- Current subtitle: "${slide.sub}"` : ""}
${slide.bullets ? `- Current bullets: ${JSON.stringify(slide.bullets)}` : ""}
${slide.quote ? `- Current quote: "${slide.quote}"` : ""}

═══════════════════════════════════════
CONTEXT (for coherence)
═══════════════════════════════════════
${prevSlide ? `PREVIOUS SLIDE: "${prevSlide.heading}" (${prevSlide.type})` : "This is the first slide."}
${nextSlide ? `NEXT SLIDE: "${nextSlide.heading}" (${nextSlide.type})` : "This is the last slide."}

PRESENTATION FLOW:
${presentationContext.map((s) => `${s.position}. [${s.type}] ${s.heading}`).join("\n")}

═══════════════════════════════════════
QUALITY RULES
═══════════════════════════════════════
1. Keep the SAME slide type (${slide.type}) — do not change it
2. Keep the same ID: "${slide.id}"
3. Improve the heading to be more specific and engaging
4. Make bullets concise — max 10 words each, 3-5 bullets
5. Ensure content does NOT duplicate information from neighboring slides
6. Content should flow naturally from the previous slide and into the next
7. Tone: ${toneMap[analysis?.tone || "conversational"] || toneMap.conversational}
8. Design style: ${templateDescriptions[templateId || "corporate"] || templateDescriptions.corporate}
9. Audience: ${analysis?.audience || "general"} — adjust complexity accordingly
10. Add or improve speaker notes (1-2 conversational sentences)
11. Add an appropriate emoji icon if not present
12. For closing slides: include 2-3 action items or next steps
13. For summary slides: synthesize key insights, don't just list
14. For statistic slides: include realistic, specific numbers
15. For quote slides: use a real, attributable quote

Return ONLY a single JSON object representing the regenerated slide with the same structure.
IMPORTANT: Return ONLY raw JSON, no markdown.`;

    const userPrompt = `Regenerate this slide to improve quality:

CURRENT SLIDE: ${JSON.stringify(slide, null, 2)}

Make it more impactful, concise, and professional. Ensure it fits naturally within the presentation flow.`;

    try {
      const raw = await callAI(systemPrompt, userPrompt);
      const regenerated = parseJSON(raw);

      // Merge regenerated content with original to preserve ID and type
      const result: Slide = {
        ...slide,
        heading: regenerated.heading || slide.heading,
        sub: regenerated.sub || slide.sub,
        bullets: regenerated.bullets || slide.bullets,
        leftCol: regenerated.leftCol || slide.leftCol,
        rightCol: regenerated.rightCol || slide.rightCol,
        quote: regenerated.quote || slide.quote,
        author: regenerated.author || slide.author,
        stats: regenerated.stats || slide.stats,
        timeline: regenerated.timeline || slide.timeline,
        process: regenerated.process || slide.process,
        chart: regenerated.chart || slide.chart,
        chartType: regenerated.chartType || slide.chartType,
        icon: regenerated.icon || slide.icon,
        notes: regenerated.notes || slide.notes,
        // Never change ID or type
        id: slide.id,
        type: slide.type,
      };

      return NextResponse.json({ slide: result });
    } catch {
      // If regeneration fails, return the original slide
      return NextResponse.json({
        slide,
        warning: "Regeneration failed — returning original slide.",
      });
    }
  } catch (err) {
    console.error("Regenerate slide API error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to regenerate slide. Please try again.",
      },
      { status: 500 }
    );
  }
}
