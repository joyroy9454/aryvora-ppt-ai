// ============================================================
// Multi-Agent Generation Pipeline
//
// Pipeline steps:
//   1. Planner   — analyze input, detect category/audience/purpose
//   2. Research  — research topic (if needed for factual support)
//   3. Outline   — create detailed slide-by-slide plan
//   4. Writer    — generate each slide with AI
//   5. Reviewer  — polish and quality-check the full deck
//
// Each step reports progress to the client.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import type { Slide, TemplateId, InputMode } from "@/types";
import {
  summarizeInput,
  autoSelectTemplate,
  type ExtendedAnalysis,
} from "@/lib/ai-engine";
import {
  createPlannerAgent,
  createResearchAgent,
  createOutlineAgent,
  createSlideWriterAgent,
  createQualityReviewerAgent,
  type PlannerResult,
  type ResearchResult,
} from "@/lib/agents";

// ── Retry helper with exponential backoff ──
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000,
  onRetry?: (attempt: number, err: unknown) => void
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        onRetry?.(attempt, err);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastErr;
}

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

    // ── Step 0: Summarize long input ──
    let processedInput = inputText;
    try {
      processedInput = await retryWithBackoff(
        () => summarizeInput(inputText, 3000),
        2,
        800
      );
    } catch {
      // Continue with original input
    }

    // ── Initialize agents ──
    const planner = createPlannerAgent();
    const researcher = createResearchAgent();
    const outliner = createOutlineAgent();
    const writer = createSlideWriterAgent();
    const reviewer = createQualityReviewerAgent();

    // ═══════════════════════════════════════
    // STEP 1 — Planner Agent
    // ═══════════════════════════════════════
    let planResult: PlannerResult;
    try {
      planResult = await retryWithBackoff(
        () => planner.analyze(processedInput, inputMode),
        3,
        1000
      );
    } catch {
      // Fallback: create a basic plan
      planResult = {
        category: "general",
        audience: "general",
        purpose: "inform",
        tone: "conversational",
        complexity: "intermediate",
        suggestedSlideCount: requestedCount || 8,
        suggestedTitle: inputText.split(" ").slice(0, 6).join(" "),
        suggestedSubtitle: "",
        suggestedTemplate: templateId || "corporate",
        outline: [],
        keywords: [],
        needsResearch: false,
      };
    }

    // Override slide count if user specified
    if (requestedCount) {
      planResult.suggestedSlideCount = Math.min(Math.max(requestedCount, 3), 25);
    }

    // Auto-select template
    const effectiveTemplate: TemplateId =
      templateId ||
      planResult.suggestedTemplate as TemplateId ||
      autoSelectTemplate(planResult.category, planResult.audience, planResult.purpose);

    // Build ExtendedAnalysis from planner result
    const analysis: ExtendedAnalysis = {
      category: planResult.category,
      audience: planResult.audience,
      tone: planResult.tone,
      purpose: planResult.purpose,
      presentationCategory: planResult.category,
      suggestedSlideCount: planResult.suggestedSlideCount,
      suggestedTitle: planResult.suggestedTitle,
      suggestedSubtitle: planResult.suggestedSubtitle,
      suggestedTemplate: planResult.suggestedTemplate as TemplateId,
      outline: planResult.outline,
      keywords: planResult.keywords,
    };

    // ═══════════════════════════════════════
    // STEP 2 — Research Agent (conditional)
    // ═══════════════════════════════════════
    let researchResult: ResearchResult | null = null;
    if (planResult.needsResearch) {
      try {
        researchResult = await retryWithBackoff(
          () =>
            researcher.research(
              planResult.suggestedTitle,
              planResult.keywords,
              planResult.category
            ),
          2,
          1000
        );
      } catch {
        // Research failed — continue without it
        researchResult = null;
      }
    }

    // ═══════════════════════════════════════
    // STEP 3 — Outline Agent
    // ═══════════════════════════════════════
    let slidePlans;
    try {
      slidePlans = await retryWithBackoff(
        () => outliner.createOutline(processedInput, analysis, researchResult),
        3,
        1000
      );
    } catch {
      // Fallback handled inside createOutlineAgent
      slidePlans = await outliner.createOutline(processedInput, analysis, null);
    }

    // ═══════════════════════════════════════
    // STEP 3.5 — Enforce slide type variety
    // ═══════════════════════════════════════
    slidePlans = enforceSlideVariety(slidePlans, analysis);

    // ═══════════════════════════════════════
    // STEP 4 — Slide Writer Agent
    // ═══════════════════════════════════════
    let slides: Slide[];
    try {
      slides = await retryWithBackoff(
        () =>
          writer.writeAllSlides(
            slidePlans,
            analysis,
            effectiveTemplate,
            processedInput
          ),
        2,
        1500
      );
    } catch {
      // Fallback: generate from plan
      const { generateFallbackSlides } = await import("@/lib/ai-engine");
      slides = generateFallbackSlides(analysis);
    }

    // ═══════════════════════════════════════
    // STEP 5 — Quality Reviewer Agent
    // ═══════════════════════════════════════
    // First: sync structural fixes (always runs)
    slides = reviewer.finalQualityCheck(slides, analysis);

    // Second: async AI polish (optional, non-blocking for response)
    if (enhance && slides.length > 0) {
      try {
        slides = await retryWithBackoff(
          () => reviewer.review(slides, analysis),
          2,
          1000
        );
      } catch {
        // Enhancement failed — continue with structurally-fixed slides
      }
    }

    // ── Style rewrite if requested ──
    if (style && style !== "business") {
      try {
        const { rewriteSlidesStyle } = await import("@/lib/ai-engine");
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
      // Include pipeline metadata for debugging/UI
      pipeline: {
        category: planResult.category,
        complexity: planResult.complexity,
        researchPerformed: researchResult !== null,
        slideCount: slides.length,
      },
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

// ── Slide Variety Enforcer ──
// Post-processes the AI-generated slide plan to ensure type diversity.
// Fixes: too many quotes, too many of the same type, missing variety.
function enforceSlideVariety(
  plans: { type: string; heading: string; keyPoints: string[]; notes: string }[],
  analysis: { presentationCategory: string; suggestedSlideCount: number }
): { type: string; heading: string; keyPoints: string[]; notes: string }[] {
  if (plans.length <= 4) return plans;

  const contentPlans = plans.slice(2, -2); // Exclude title, agenda, summary, closing
  if (contentPlans.length === 0) return plans;

  // Count types
  const typeCounts = new Map<string, number>();
  for (const p of contentPlans) {
    typeCounts.set(p.type, (typeCounts.get(p.type) || 0) + 1);
  }

  // Fix 1: Max 1 quote
  const quotePlans = contentPlans.filter(p => p.type === "quote");
  if (quotePlans.length > 1) {
    let kept = false;
    for (const p of contentPlans) {
      if (p.type === "quote") {
        if (!kept) {
          kept = true;
        } else {
          // Convert extra quotes to content
          p.type = "content";
        }
      }
    }
  }

  // Fix 2: No more than 2 consecutive same type
  for (let i = 2; i < plans.length - 1; i++) {
    if (plans[i].type === plans[i - 1].type && plans[i].type === plans[i - 2].type) {
      // Change the third consecutive to a different type
      const alternatives = ["content", "two-column", "statistic", "process", "case-study"];
      const usedTypes = new Set(plans.slice(Math.max(0, i - 5), i).map(p => p.type));
      const fallback = alternatives.find(a => !usedTypes.has(a)) || "content";
      plans[i].type = fallback;
    }
  }

  // Fix 3: Ensure at least 3 different types in content section
  const contentTypes = new Set(contentPlans.map(p => p.type));
  if (contentTypes.size < 3 && contentPlans.length >= 4) {
    const preferred = ["statistic", "two-column", "process", "case-study", "comparison"];
    let typeIdx = 0;
    for (let i = 0; i < contentPlans.length && contentTypes.size < 3; i++) {
      if (contentPlans[i].type === "content" && i % 3 === 2) {
        const newType = preferred[typeIdx % preferred.length];
        if (!contentTypes.has(newType)) {
          contentPlans[i].type = newType;
          contentTypes.add(newType);
          typeIdx++;
        }
      }
    }
  }

  return plans;
}
