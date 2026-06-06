import { NextRequest, NextResponse } from "next/server";
import type { Slide, TemplateId, InputMode } from "@/types";
import {
  analyzeInput,
  generateSlidesOneByOne,
  generateSpeakerNotes,
  rewriteSlidesStyle,
  enhanceContent,
  generateOutline,
  summarizeInput,
  autoSelectTemplate,
  finalQualityCheck,
  type ExtendedAnalysis,
  type SlidePlan,
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
      enhance = true,
    } = body as {
      inputText: string;
      inputMode: InputMode;
      templateId?: TemplateId;
      slideCount?: number;
      style?: "academic" | "business" | "casual";
      enhance?: boolean;
    };

    // ── Input validation ──
    if (!inputText || typeof inputText !== "string" || inputText.trim().length < 2) {
      return NextResponse.json(
        { error: "Please provide content to generate a presentation." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenRouter API key not configured. Set OPENROUTER_API_KEY in environment." },
        { status: 500 }
      );
    }

    // ── Step 1: Summarize long input ──
    let processedInput = inputText;
    try {
      processedInput = await summarizeInput(inputText, 3000);
    } catch {
      // Continue with original input
    }

    // ── Step 2: Analyze input ──
    let analysis: ExtendedAnalysis;
    try {
      analysis = await analyzeInput(processedInput, inputMode);
    } catch {
      analysis = {
        category: "general" as const,
        audience: "general" as const,
        tone: "conversational" as const,
        purpose: "inform" as const,
        presentationCategory: "general" as const,
        suggestedSlideCount: requestedCount || 8,
        suggestedTitle: inputText.split(" ").slice(0, 6).join(" "),
        suggestedSubtitle: "",
        suggestedTemplate: templateId || "corporate",
        outline: [],
        keywords: [],
      };
    }

    // Override slide count if user specified
    if (requestedCount) {
      analysis.suggestedSlideCount = Math.min(Math.max(requestedCount, 3), 25);
    }

    // Auto-select template
    const effectiveTemplate: TemplateId =
      templateId ||
      analysis.suggestedTemplate ||
      autoSelectTemplate(analysis.category, analysis.audience, analysis.purpose);

    // ── Step 3: Generate detailed slide plan (outline) ──
    let slidePlans: SlidePlan[] | undefined;
    try {
      slidePlans = await generateOutline(processedInput, analysis);
    } catch {
      slidePlans = undefined;
    }

    // ── Step 4: Generate slides ONE BY ONE ──
    let slides: Slide[];
    try {
      slides = await generateSlidesOneByOne(
        processedInput,
        analysis,
        effectiveTemplate,
        inputMode,
        undefined, // no progress callback on server
        slidePlans
      );
    } catch {
      slides = generateFallbackSlides(analysis);
    }

    // ── Step 5: Enhance content quality ──
    if (enhance && slides.length > 0) {
      try {
        slides = await enhanceContent(slides, analysis);
      } catch {
        // Enhancement failed — continue with unenhanced slides
      }
    }

    // ── Step 6: Generate speaker notes ──
    try {
      slides = await generateSpeakerNotes(slides);
    } catch {
      // Notes are optional
    }

    // ── Step 7: Final quality check ──
    slides = finalQualityCheck(slides, analysis);

    // ── Step 8: Apply style rewrite if requested ──
    if (style && style !== "business") {
      try {
        slides = await rewriteSlidesStyle(slides, style);
      } catch {
        // Style rewrite is optional
      }
    }

    return NextResponse.json({
      slides,
      analysis: {
        category: analysis.category,
        audience: analysis.audience,
        tone: analysis.tone,
        purpose: analysis.purpose,
        suggestedSlideCount: analysis.suggestedSlideCount,
        suggestedTitle: analysis.suggestedTitle,
        suggestedSubtitle: analysis.suggestedSubtitle,
        suggestedTemplate: analysis.suggestedTemplate,
        outline: analysis.outline,
        keywords: analysis.keywords,
      },
      templateUsed: effectiveTemplate,
    });
  } catch (err) {
    console.error("Generation API error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to generate presentation. Please try again.",
      },
      { status: 500 }
    );
  }
}

// ── Fallback slide generation ──

function generateFallbackSlides(analysis: ExtendedAnalysis): Slide[] {
  const total = analysis.suggestedSlideCount;
  const slides: Slide[] = [];

  // Title
  slides.push({
    id: `slide-${Date.now()}-0`,
    type: "title",
    heading: analysis.suggestedTitle,
    sub: analysis.suggestedSubtitle,
    icon: "📊",
    notes: `Welcome the audience and introduce "${analysis.suggestedTitle}".`,
  });

  // Agenda
  if (total > 3) {
    slides.push({
      id: `slide-${Date.now()}-1`,
      type: "content",
      heading: "Agenda",
      bullets: analysis.outline.slice(0, 5).length > 0
        ? analysis.outline.slice(0, 5)
        : ["Introduction", "Key Topics", "Analysis", "Recommendations", "Next Steps"],
      icon: "📋",
      notes: "Walk the audience through what we'll cover today.",
    });
  }

  const middleCount = Math.max(total - slides.length - 2, 1);
  for (let i = 0; i < middleCount; i++) {
    const sectionTitle = analysis.outline[i % analysis.outline.length] || `Key Point ${i + 1}`;
    const slideType: "content" | "statistic" | "quote" =
      i === 1 ? "statistic" : i === 3 ? "quote" : "content";

    const slide: Slide = {
      id: `slide-${Date.now()}-${slides.length}`,
      type: slideType,
      heading: sectionTitle,
      notes: `Explain the key points about ${sectionTitle.toLowerCase()}.`,
    };

    if (slideType === "statistic") {
      slide.stats = [
        { label: "Key Metric", value: "85%" },
        { label: "Growth", value: "+42%" },
        { label: "Adoption", value: "1.2M" },
      ];
    } else if (slideType === "quote") {
      slide.quote = "The best way to predict the future is to create it.";
      slide.author = "Peter Drucker";
    } else {
      slide.bullets = [
        `Critical insight about ${sectionTitle.toLowerCase()}`,
        `Supporting evidence and data`,
        `Actionable takeaway`,
      ];
    }

    slides.push(slide);
  }

  // Summary
  if (total > 5) {
    slides.push({
      id: `slide-${Date.now()}-summary`,
      type: "summary",
      heading: "Key Takeaways",
      bullets: (analysis.outline.length > 0
        ? analysis.outline.slice(0, 4)
        : ["Core insight", "Strategic recommendation", "Action items"]
      ).map((item) => `Remember: ${item}`),
      icon: "✅",
      notes: "Summarize the key takeaways from the presentation.",
    });
  }

  // Closing
  slides.push({
    id: `slide-${Date.now()}-${total - 1}`,
    type: "closing",
    heading: "Thank You",
    sub: analysis.suggestedTitle,
    bullets: ["Questions?", "Let's discuss next steps"],
    icon: "🙏",
    notes: "Thank the audience and open the floor for questions.",
  });

  return slides;
}
