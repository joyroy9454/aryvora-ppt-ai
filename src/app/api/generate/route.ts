import { NextRequest, NextResponse } from "next/server";
import type { Slide, TemplateId, InputMode, GenerationProgress } from "@/types";
import {
  analyzeInput,
  generateSlides,
  generateSpeakerNotes,
} from "@/lib/ai-engine";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      inputText,
      inputMode,
      templateId,
      slideCount: requestedCount,
      style,
    } = body as {
      inputText: string;
      inputMode: InputMode;
      templateId: TemplateId;
      slideCount?: number;
      style?: "academic" | "business" | "casual";
    };

    if (
      !inputText ||
      typeof inputText !== "string" ||
      inputText.trim().length < 2
    ) {
      return NextResponse.json(
        { error: "Please provide content to generate a presentation." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "OpenRouter API key not configured. Set OPENROUTER_API_KEY in environment.",
        },
        { status: 500 }
      );
    }

    // Step 1: Analyze input
    let analysis;
    try {
      analysis = await analyzeInput(inputText, inputMode);
    } catch (err) {
      // Fallback analysis
      analysis = {
        category: "general" as const,
        audience: "general" as const,
        tone: "conversational" as const,
        suggestedSlideCount: requestedCount || 8,
        suggestedTitle: inputText.split(" ").slice(0, 5).join(" "),
        suggestedSubtitle: "",
        outline: [],
        keywords: [],
      };
    }

    // Override slide count if user specified
    if (requestedCount) {
      analysis.suggestedSlideCount = Math.min(
        Math.max(requestedCount, 3),
        25
      );
    }

    // Step 2: Generate slides
    let slides: Slide[];
    try {
      slides = await generateSlides(
        inputText,
        analysis,
        templateId || "corporate",
        inputMode
      );
    } catch (err) {
      // Fallback slides
      slides = generateFallbackSlides(analysis);
    }

    // Step 3: Generate speaker notes
    try {
      slides = await generateSpeakerNotes(slides);
    } catch {
      // Notes are optional, continue without them
    }

    // Step 4: Apply style rewrite if requested
    if (style && style !== "business") {
      try {
        slides = await rewriteSlidesStyle(slides, style);
      } catch {
        // Style rewrite is optional
      }
    }

    return NextResponse.json({
      slides,
      analysis,
    });
  } catch (err) {
    console.error("Generation API error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to generate presentation. Please try again.",
      },
      { status: 500 }
    );
  }
}

function generateFallbackSlides(
  analysis: {
    suggestedTitle: string;
    suggestedSubtitle: string;
    suggestedSlideCount: number;
    outline: string[];
  },
  count?: number
): Slide[] {
  const total = count || analysis.suggestedSlideCount;
  const slides: Slide[] = [
    {
      id: `slide-${Date.now()}-0`,
      type: "title",
      heading: analysis.suggestedTitle,
      sub: analysis.suggestedSubtitle,
    },
  ];

  for (let i = 1; i < total - 1; i++) {
    const sectionTitle =
      analysis.outline[i - 1] || `Key Point ${i}`;
    slides.push({
      id: `slide-${Date.now()}-${i}`,
      type: "content",
      heading: sectionTitle,
      bullets: [
        `Important aspect of ${sectionTitle.toLowerCase()}`,
        `Supporting detail and evidence`,
        `Key insight or takeaway`,
      ],
    });
  }

  slides.push({
    id: `slide-${Date.now()}-${total - 1}`,
    type: "closing",
    heading: "Thank You",
    sub: analysis.suggestedTitle,
    bullets: ["Questions?", "Let's connect"],
  });

  return slides;
}

async function rewriteSlidesStyle(
  slides: Slide[],
  style: "academic" | "business" | "casual"
): Promise<Slide[]> {
  // Import dynamically to avoid circular deps
  const { rewriteSlidesStyle: rewrite } = await import("@/lib/ai-engine");
  return rewrite(slides, style);
}
