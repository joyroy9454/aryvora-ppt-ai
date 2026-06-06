import { NextRequest, NextResponse } from "next/server";
import type { Slide, TemplateId, InputMode } from "@/types";
import {
  analyzeInput,
  generateSlides,
  generateSpeakerNotes,
  rewriteSlidesStyle,
  buildImagePrompt,
  shouldGenerateImage,
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
      generateImages,
    } = body as {
      inputText: string;
      inputMode: InputMode;
      templateId: TemplateId;
      slideCount?: number;
      style?: "academic" | "business" | "casual";
      generateImages?: boolean;
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
    } catch {
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
    } catch {
      // Fallback slides
      slides = generateFallbackSlides(analysis);
    }

    // Step 3: Generate speaker notes
    try {
      slides = await generateSpeakerNotes(slides);
    } catch {
      // Notes are optional, continue without them
    }

    // Step 4: Auto-generate images for slides that need them
    if (generateImages) {
      try {
        slides = await autoGenerateImages(slides, analysis, templateId);
      } catch {
        // Image generation is optional, continue without images
      }
    }

    // Step 5: Apply style rewrite if requested
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

// ---------- Auto-generate images for slides (free via Pollinations.ai) ----------
async function autoGenerateImages(
  slides: Slide[],
  analysis: { keywords: string[]; suggestedTitle: string },
  templateId: TemplateId
): Promise<Slide[]> {
  const POLLINATIONS_BASE = "https://image.pollinations.ai/prompt";

  // Find slides that need images
  const imageSlides = slides.filter(
    (s) => shouldGenerateImage(s.type) && !s.imageUrl
  );

  // Limit to 3 images per presentation
  const toGenerate = imageSlides.slice(0, 3);

  for (const slide of toGenerate) {
    try {
      const prompt = buildImagePrompt(
        slide.heading,
        slide.type,
        analysis.keywords,
        templateId
      );

      const seed = Math.floor(Math.random() * 1000000);
      // Pollinations URL IS the image — it generates on-the-fly when accessed
      slide.imageUrl = `${POLLINATIONS_BASE}/${encodeURIComponent(prompt)}?width=1366&height=768&seed=${seed}&nologo=true`;
    } catch {
      // Skip failed image generation for this slide
    }
  }

  return slides;
}

function generateFallbackSlides(analysis: {
  suggestedTitle: string;
  suggestedSubtitle: string;
  suggestedSlideCount: number;
  outline: string[];
}): Slide[] {
  const total = analysis.suggestedSlideCount;
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
