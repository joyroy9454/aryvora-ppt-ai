// ============================================================
// Outline Agent — Creates a clean presentation plan before writing slides
// ============================================================
// This agent is the bridge between planning (analysis + research) and
// writing (slide generation). It produces a detailed slide-by-slide
// plan (SlidePlan[]) that the Slide Writer consumes.
// ============================================================

import {
  SlidePlan,
  getCategoryDesignProfile,
  getCategoryToneInstructions,
  createBalancedSlidePlan,
  suggestVisualsForPlan,
  callAI,
  parseJSON,
  ExtendedAnalysis,
} from "../ai-engine";
import { TEMPLATE_DESCRIPTIONS } from "../constants";

// Re-export SlidePlan for consumers that only import from the outline agent
export type { SlidePlan } from "../ai-engine";

// ---------- Outline Agent Interface ----------

export interface OutlineAgent {
  createOutline(
    inputText: string,
    analysis: ExtendedAnalysis,
    research: any
  ): Promise<SlidePlan[]>;
}

// ---------- Factory ----------

export function createOutlineAgent(): OutlineAgent {
  return {
    createOutline: async (
      inputText: string,
      analysis: ExtendedAnalysis,
      research: any
    ): Promise<SlidePlan[]> => {
      try {
        const plan = await buildOutline(inputText, analysis, research);
        return plan;
      } catch (err) {
        console.error("[Outline Agent] AI outline failed, falling back to balanced plan:", err);
        // Requirement 10: fall back to createBalancedSlidePlan
        const fallback = createBalancedSlidePlan(analysis, analysis.outline);
        return suggestVisualsForPlan(fallback, analysis);
      }
    },
  };
}

// ---------- Internal: build the outline via AI ----------

async function buildOutline(
  inputText: string,
  analysis: ExtendedAnalysis,
  research: any
): Promise<SlidePlan[]> {
  // Requirement 5: category-specific design profile
  const designProfile = getCategoryDesignProfile(analysis.presentationCategory);

  // Requirement 6: category-specific tone instructions
  const toneInstructions = getCategoryToneInstructions(analysis.presentationCategory);

  // Template description for the AI prompt
  const templateDesc =
    TEMPLATE_DESCRIPTIONS[analysis.suggestedTemplate] || "clean, professional design";

  // Requirement 7: incorporate research facts when available
  const researchContext = buildResearchContext(research);

  const systemPrompt = buildSystemPrompt(
    analysis,
    designProfile,
    toneInstructions,
    templateDesc
  );

  const userPrompt = buildUserPrompt(
    inputText,
    analysis,
    researchContext
  );

  const raw = await callAI(systemPrompt, userPrompt);
  const result = parseJSON(raw);

  // Parse the AI response into SlidePlan[]
  const plans: SlidePlan[] = Array.isArray(result)
    ? result
    : result.slides || [];

  if (plans.length === 0) {
    throw new Error("AI returned empty slide plan");
  }

  // Ensure all visual fields are populated
  const plansWithVisuals = plans.map((plan) => ensureVisualFields(plan));

  // Validate slide count — if the AI didn't produce the right number, fall back
  if (plansWithVisuals.length !== analysis.suggestedSlideCount) {
    console.warn(
      `[Outline Agent] Slide count mismatch: got ${plansWithVisuals.length}, expected ${analysis.suggestedSlideCount}. Using fallback.`
    );
    const fallback = createBalancedSlidePlan(analysis, analysis.outline);
    return suggestVisualsForPlan(fallback, analysis);
  }

  // Requirement 11: apply visual intelligence
  return suggestVisualsForPlan(plansWithVisuals, analysis);
}

// ---------- Prompt Builders ----------

function buildSystemPrompt(
  analysis: ExtendedAnalysis,
  designProfile: ReturnType<typeof getCategoryDesignProfile>,
  toneInstructions: string,
  templateDesc: string
): string {
  const totalSlides = analysis.suggestedSlideCount;

  return `You are a senior presentation architect. Create a detailed slide-by-slide plan for a ${totalSlides}-slide presentation.

═══════════════════════════════════════
CATEGORY: ${analysis.presentationCategory.toUpperCase()}
═══════════════════════════════════════

DESIGN PROFILE:
- Visual Strategy: ${designProfile.visualStrategy}
- Max Words Per Bullet: ${designProfile.maxWordsPerBullet}
- Max Bullets Per Slide: ${designProfile.maxBulletsPerSlide}
- Heading Style: ${designProfile.headingStyle}
- Image Frequency: ${designProfile.imageFrequency}
- Chart Frequency: ${designProfile.chartFrequency}
- Diagram Frequency: ${designProfile.diagramFrequency}

CONTENT GUIDELINES:
${designProfile.contentGuidelines}

TONE INSTRUCTIONS:
${toneInstructions}

SLIDE STRUCTURE RULES:
${designProfile.slideStructureRules}

TEMPLATE: ${analysis.suggestedTemplate} — ${templateDesc}

═══════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════

Return ONLY a JSON array of slide plan objects:
[
  {
    "index": 0,
    "type": "title",
    "heading": "Presentation title",
    "sectionTitle": "Title",
    "keyPoints": [],
    "notes": "Opening remarks"
  },
  {
    "index": 1,
    "type": "content",
    "heading": "Agenda",
    "sectionTitle": "Overview",
    "keyPoints": ["Point 1", "Point 2"],
    "notes": "Walk through the agenda"
  },
  ...
]

SLIDE PLAN RULES:
- Total slides must equal ${totalSlides}
- Slide 0: type "title" — the presentation title slide
- Slide 1: type "content" — Agenda/Overview (4-5 bullet points listing main sections)
- Slides 2 to ${totalSlides - 2}: content slides with varied types
- Slide ${totalSlides - 2}: type "summary" — Key Takeaways
- Slide ${totalSlides - 1}: type "closing" — Thank You / Next Steps

VARY THE SLIDE TYPES across content slides based on the category's visual strategy:
- Use "content" for standard text slides (most common)
- Use "two-column" for comparisons or pros/cons
- Use "statistic" for data-heavy slides (2-4 key metrics) — ${
    designProfile.chartFrequency === "frequent"
      ? "USE FREQUENTLY"
      : designProfile.chartFrequency === "selective"
        ? "use selectively"
        : "avoid unless necessary"
  }
- Use "quote" for impactful quotes (1 per presentation)
- Use "timeline" for chronological content
- Use "process" for step-by-step flows — ${
    designProfile.diagramFrequency === "frequent"
      ? "USE FREQUENTLY"
      : designProfile.diagramFrequency === "selective"
        ? "use selectively"
        : "avoid unless necessary"
  }
- Use "comparison" for side-by-side analysis
- Use "divider" between major sections (every 4-5 slides)
- Use "chart" for data visualization — ${
    designProfile.chartFrequency === "frequent"
      ? "USE FREQUENTLY"
      : designProfile.chartFrequency === "selective"
        ? "use selectively"
        : "avoid unless necessary"
  }
- Use "case-study" for real-world examples
- Use "diagram" for system/architecture visuals
- Use "image-left" / "image-right" for visual-heavy slides

Each slide must have:
- "heading": a SPECIFIC, ENGAGING title in ${designProfile.headingStyle} style (not generic)
- "keyPoints": 2-${designProfile.maxBulletsPerSlide} key points for this slide (max ${designProfile.maxWordsPerBullet} words each)
- "notes": 1 sentence describing what the presenter should say

CRITICAL: Follow the category's content guidelines and slide structure rules above. The presentation should feel like a ${analysis.presentationCategory} presentation, not a generic one.

Return ONLY raw JSON array.`;
}

function buildUserPrompt(
  inputText: string,
  analysis: ExtendedAnalysis,
  researchContext: string
): string {
  const parts = [
    `Presentation: "${analysis.suggestedTitle}"`,
    `Subtitle: "${analysis.suggestedSubtitle}"`,
    `Category: ${analysis.category}`,
    `Presentation Category: ${analysis.presentationCategory}`,
    `Audience: ${analysis.audience}`,
    `Tone: ${analysis.tone}`,
    `Purpose: ${analysis.purpose}`,
    `Keywords: ${analysis.keywords.join(", ")}`,
    "",
    "Outline to expand:",
    analysis.outline.map((item, i) => `${i + 1}. ${item}`).join("\n"),
  ];

  if (researchContext) {
    parts.push("", "Research & Facts to incorporate:", researchContext);
  }

  parts.push(
    "",
    `Original input (for reference): "${inputText.substring(0, 2000)}"`,
    "",
    `Create a detailed slide-by-slide plan. Each slide should have a clear purpose and focus on ONE main idea. Follow the ${analysis.presentationCategory} design profile strictly.`
  );

  return parts.join("\n");
}

// ---------- Research Context Builder ----------

function buildResearchContext(research: any): string {
  // Requirement 7: incorporate research facts when available
  if (!research) return "";

  const parts: string[] = [];

  if (typeof research === "string") {
    return research.substring(0, 1500);
  }

  if (research.facts && Array.isArray(research.facts)) {
    parts.push("Key Facts:");
    research.facts.forEach((fact: string, i: number) => {
      parts.push(`  ${i + 1}. ${fact}`);
    });
  }

  if (research.statistics && Array.isArray(research.statistics)) {
    parts.push("Statistics:");
    research.statistics.forEach((stat: string, i: number) => {
      parts.push(`  - ${stat}`);
    });
  }

  if (research.quotes && Array.isArray(research.quotes)) {
    parts.push("Notable Quotes:");
    research.quotes.forEach((q: any, i: number) => {
      const text = typeof q === "string" ? q : q.text || q.quote || "";
      const author = typeof q === "object" ? q.author || q.source || "" : "";
      parts.push(`  "${text}"${author ? ` — ${author}` : ""}`);
    });
  }

  if (research.sources && Array.isArray(research.sources)) {
    parts.push("Sources:");
    research.sources.forEach((src: string, i: number) => {
      parts.push(`  - ${src}`);
    });
  }

  if (research.summary) {
    parts.push(`Summary: ${research.summary}`);
  }

  return parts.join("\n").substring(0, 2000);
}

// ---------- Visual Field Defaults ----------

function ensureVisualFields(
  plan: Partial<SlidePlan> & { index: number; type: any; heading: string }
): SlidePlan {
  return {
    index: plan.index,
    type: plan.type,
    heading: plan.heading || "",
    sectionTitle: plan.sectionTitle || "",
    keyPoints: plan.keyPoints || [],
    notes: plan.notes || "",
    needsImage: plan.needsImage ?? false,
    imageKeyword: plan.imageKeyword ?? "",
    imagePosition: plan.imagePosition ?? "none",
    visualType: plan.visualType ?? "none",
    visualCaption: plan.visualCaption ?? "",
  };
}
