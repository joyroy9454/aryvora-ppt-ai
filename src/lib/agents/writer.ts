// ============================================================
// Slide Writer Agent — Per-Slide Content Generation
// ============================================================
// Generates individual slides with full context from previous
// slides and the presentation plan. Each slide gets its own AI
// call with category-specific design rules, tone instructions,
// visual context, and quality guidelines.
// ============================================================

import { callAI, parseJSON } from "../ai-engine";
import {
  getCategoryDesignProfile,
  getCategoryToneInstructions,
  createSlideFromPlan,
  suggestVisualsForPlan,
} from "../ai-engine";
import { TEMPLATE_DESCRIPTIONS } from "../constants";
import type {
  Slide,
  SlidePlan,
  SlideType,
  TemplateId,
  ExtendedAnalysis,
  GenerationProgress,
} from "@/types";

// Re-export useful types for consumers of this module
export type { Slide, SlidePlan, SlideType, TemplateId, ExtendedAnalysis, GenerationProgress };

// ---------- Interface ----------

export interface SlideWriterAgent {
  /**
   * Generate a single slide with full context from previous slides,
   * the presentation plan, and visual metadata.
   */
  writeSlide(
    plan: SlidePlan,
    analysis: ExtendedAnalysis,
    templateId: TemplateId,
    inputText: string,
    previousSlides: Slide[],
    nextPlan: SlidePlan | null
  ): Promise<Slide>;

  /**
   * Generate all slides one by one, with per-slide AI calls and
   * optional progress reporting.
   */
  writeAllSlides(
    plans: SlidePlan[],
    analysis: ExtendedAnalysis,
    templateId: TemplateId,
    inputText: string,
    onProgress?: (progress: GenerationProgress) => void
  ): Promise<Slide[]>;
}

// ---------- Slide Type Instructions ----------

/**
 * Returns detailed output requirements for each slide type.
 * Injected into the AI system prompt so the model knows exactly
 * which JSON fields to produce for the given slide type.
 */
function getSlideTypeInstructions(type: SlideType): string {
  switch (type) {
    case "title":
      return `Title slide requirements:
- "heading": The presentation title (compelling, specific)
- "sub": A short subtitle
- "icon": A relevant emoji
- "notes": Opening remarks to welcome the audience`;

    case "content":
      return `Content slide requirements:
- "heading": Specific, engaging title
- "bullets": 3-5 concise bullets (max 10 words each)
- "icon": A relevant emoji
- "notes": 1-2 conversational sentences for the presenter`;

    case "two-column":
      return `Two-column slide requirements:
- "heading": Specific title
- "leftCol": 3-4 items for left column
- "rightCol": 3-4 items for right column
- "icon": A relevant emoji
- "notes": Explain the comparison or relationship`;

    case "statistic":
      return `Statistic slide requirements:
- "heading": Title highlighting the key metric
- "stats": 2-4 items with "label" and "value" (e.g., {"label": "Growth", "value": "+42%"})
- "icon": A relevant emoji
- "notes": Explain what these numbers mean`;

    case "quote":
      return `Quote slide requirements:
- "heading": Context for the quote
- "quote": An impactful, relevant quote (real or plausible)
- "author": Who said it
- "icon": 💬
- "notes": Explain why this quote matters`;

    case "comparison":
      return `Comparison slide requirements:
- "heading": What's being compared
- "leftCol": 3-4 points for option A
- "rightCol": 3-4 points for option B
- "icon": ⚖️
- "notes": Summarize the key difference`;

    case "timeline":
      return `Timeline slide requirements:
- "heading": What the timeline shows
- "timeline": 3-5 items with "label" (date/phase) and "description"
- "icon": 📅
- "notes": Walk through the timeline`;

    case "process":
      return `Process slide requirements:
- "heading": The process name
- "process": 3-5 items with "step" (number), "title", "description"
- "icon": 🔄
- "notes": Explain the process flow`;

    case "chart":
      return `Chart slide requirements:
- "heading": What the chart shows
- "chart": 3-6 items with "label" and "value" (number)
- "chartType": "bar" or "pie" or "line"
- "icon": 📊
- "notes": Explain the key insight from the data`;

    case "divider":
      return `Section divider requirements:
- "heading": The section title (large, prominent)
- "sub": Optional brief description
- "icon": A relevant emoji
- "notes": Transition statement to the new section`;

    case "summary":
      return `Summary slide requirements:
- "heading": "Key Takeaways" or similar
- "bullets": 4-5 synthesized takeaways (not just a list — each should be an insight)
- "icon": ✅
- "notes": "Summarize the key messages the audience should remember"`;

    case "closing":
      return `Closing slide requirements:
- "heading": "Thank You" or similar
- "sub": Optional — presentation title or tagline
- "bullets": 2-3 action items or next steps
- "icon": 🙏
- "notes": "Thank the audience and open for questions"`;

    case "qa":
      return `Q&A slide requirements:
- "heading": "Questions & Answers" or similar
- "bullets": 2-3 anticipated questions to seed discussion
- "icon": ❓
- "notes": "Invite questions from the audience"`;

    case "case-study":
      return `Case study slide requirements:
- "heading": The case study title (specific, real-world)
- "bullets": 3 items: "The Challenge", "The Solution", "The Results"
- "icon": 📋
- "notes": Walk through this real-world example and its outcomes
- Include specific metrics and results where possible`;

    case "diagram":
      return `Diagram slide requirements:
- "heading": What the diagram shows
- "bullets": 3-4 components or steps in the diagram
- "icon": 🔀
- "notes": Explain the diagram and how components interact
- Describe connections, flows, or relationships between elements`;

    case "image-left":
    case "image-right":
      return `Image slide requirements:
- "heading": Specific, engaging title
- "bullets": 3-5 concise bullets summarizing the key points
- "imagePrompt": A detailed description of the image that should appear
- "imagePosition": "${type === "image-left" ? "left" : "right"}"
- "icon": A relevant emoji
- "notes": Reference the image in the speaker notes`;

    case "blank":
      return `Blank slide requirements:
- "heading": Optional heading
- "notes": Describe what this slide is for`;

    default:
      return `Standard slide requirements:
- "heading": Specific, engaging title
- "bullets": 3-5 concise bullets
- "icon": A relevant emoji
- "notes": 1-2 conversational sentences`;
  }
}

// ---------- Visual Context Builder -----------

/**
 * Builds a visual context string for the AI prompt when the slide
 * requires an image, chart, or diagram.
 */
function buildVisualContext(plan: SlidePlan): string {
  if (plan.needsImage && plan.imageKeyword) {
    return `
═══════════════════════════════════════
VISUAL ELEMENT — INCLUDE THIS
═══════════════════════════════════════
This slide has a ${plan.visualType} visual:
- Image search keyword: "${plan.imageKeyword}"
- Position: ${plan.imagePosition}
${plan.visualCaption ? `- Caption: "${plan.visualCaption}"` : ""}

IMPORTANT: Reference this visual in your content and speaker notes.
The slide layout should accommodate the visual on the ${plan.imagePosition}.
In the speaker notes, mention the visual (e.g., "As you can see in this image...").
`;
  }

  if (plan.visualType === "chart") {
    return `
═══════════════════════════════════════
VISUAL ELEMENT — CHART
═══════════════════════════════════════
This slide includes a chart visualization.
${plan.visualCaption ? `Caption: "${plan.visualCaption}"` : ""}
Ensure the data is presented clearly and the chart type is appropriate.
`;
  }

  if (plan.visualType === "diagram") {
    return `
═══════════════════════════════════════
VISUAL ELEMENT — DIAGRAM
═══════════════════════════════════════
This slide includes a flow diagram or process visualization.
${plan.visualCaption ? `Caption: "${plan.visualCaption}"` : ""}
Ensure the diagram clearly shows the flow/relationship.
`;
  }

  return "";
}

// ---------- Icon Helper -----------

/**
 * Returns a relevant emoji icon for a slide type.
 */
function getIconForType(type: SlideType): string {
  const icons: Record<SlideType, string> = {
    title: "📊",
    content: "📝",
    "two-column": "📊",
    closing: "🙏",
    "image-left": "🖼️",
    "image-right": "🖼️",
    quote: "💬",
    comparison: "⚖️",
    timeline: "📅",
    statistic: "📈",
    divider: "➖",
    process: "🔄",
    chart: "📊",
    summary: "✅",
    qa: "❓",
    "case-study": "📋",
    diagram: "🔀",
    blank: "📄",
  };
  return icons[type] || "📌";
}

// ---------- Single Slide Generator -----------

/**
 * Generate a single slide with full AI-powered content.
 * Uses previous 3 slides for context, next plan for forward awareness,
 * category-specific rules, and visual metadata.
 *
 * Falls back to `createSlideFromPlan` if the AI call fails.
 */
async function generateSingleSlide(
  plan: SlidePlan,
  analysis: ExtendedAnalysis,
  templateId: TemplateId,
  inputText: string,
  previousSlides: Slide[],
  nextPlan: SlidePlan | null
): Promise<Slide> {
  const effectiveTemplate = analysis.suggestedTemplate || templateId;

  // Category-specific design profile and tone
  const designProfile = getCategoryDesignProfile(analysis.presentationCategory);
  const categoryTone = getCategoryToneInstructions(analysis.presentationCategory);

  // Build context from previous 3 slides
  const prevContext = previousSlides
    .slice(-3)
    .map(
      (s, i) =>
        `Slide ${s.index ?? previousSlides.length - 3 + i}: [${s.type}] "${s.heading}" — ${s.bullets?.slice(0, 2).join("; ") || s.quote || ""}`
    )
    .join("\n");

  const nextContext = nextPlan
    ? `Next slide will be: [${nextPlan.type}] "${nextPlan.heading}"`
    : "This is the closing slide.";

  // Build visual context for the prompt
  const visualContext = buildVisualContext(plan);

  // ---- System Prompt ----
  const systemPrompt = `You are an elite presentation designer. You are generating ONE slide at a time for a high-stakes presentation.

Your slide must be FOCUSED on ONE main idea. No clutter. No repetition.

═══════════════════════════════════════
SLIDE TYPE: ${plan.type}
═══════════════════════════════════════

${getSlideTypeInstructions(plan.type)}
${visualContext}

═══════════════════════════════════════
CATEGORY: ${analysis.presentationCategory.toUpperCase()}
═══════════════════════════════════════

CONTENT GUIDELINES:
${designProfile.contentGuidelines}

TONE INSTRUCTIONS:
${categoryTone}

VISUAL STRATEGY: ${designProfile.visualStrategy}
HEADING STYLE: ${designProfile.headingStyle}

═══════════════════════════════════════
CATEGORY-SPECIFIC CONTENT RULES
═══════════════════════════════════════

Word limit: Max ${designProfile.maxWordsPerBullet} words per bullet point
Bullet limit: Max ${designProfile.maxBulletsPerSlide} bullets per slide
Heading style: ${designProfile.headingStyle} — ${
    designProfile.headingStyle === "formal"
      ? "professional, authoritative titles"
      : designProfile.headingStyle === "engaging"
      ? "catchy, compelling titles that spark curiosity"
      : designProfile.headingStyle === "technical"
      ? "precise, terminology-rich titles"
      : "clear, straightforward titles"
  }

═══════════════════════════════════════
QUALITY RULES — FOLLOW EXACTLY
═══════════════════════════════════════

1. Heading must be SPECIFIC and ENGAGING in ${designProfile.headingStyle} style — never generic like "Overview" or "Introduction"
2. Content must be CONCISE — max ${designProfile.maxWordsPerBullet} words per bullet, max ${designProfile.maxBulletsPerSlide} bullets
3. Use human-like language — vary sentence length, use active voice
4. NO repetition with previous slides — check the context below
5. Every word must earn its place — cut anything that doesn't add value
6. Speaker notes must be CONVERSATIONAL — 1-2 sentences, natural speaking tone
7. Include a transition phrase in notes when appropriate ("Now let's look at...", "Building on that...")
8. Each bullet should be self-contained and understandable without the others
9. Avoid starting multiple bullets with the same word — vary the openings
10. Write as if a human expert is presenting — authentic, confident, clear

AUDIENCE: ${analysis.audience} — adjust complexity and jargon accordingly
PURPOSE: ${analysis.purpose} — this slide must serve this goal
DESIGN STYLE: ${TEMPLATE_DESCRIPTIONS[effectiveTemplate] || TEMPLATE_DESCRIPTIONS.corporate}

Return ONLY a JSON object (not an array) with the slide content.
IMPORTANT: Return ONLY raw JSON, no markdown.`;

  // ---- User Prompt ----
  const userPrompt = `Generate slide ${plan.index + 1} of ${analysis.suggestedSlideCount}.

SLIDE PLAN:
- Type: ${plan.type}
- Heading: ${plan.heading}
- Section: ${plan.sectionTitle}
- Key points to cover: ${plan.keyPoints.join("; ")}
${plan.needsImage ? `- Visual: ${plan.visualType} (${plan.imagePosition}) — "${plan.imageKeyword}"` : ""}
${plan.visualCaption ? `- Visual caption: "${plan.visualCaption}"` : ""}

PRESENTATION CONTEXT:
Title: "${analysis.suggestedTitle}"
Analysis category: ${analysis.category}
Presentation category: ${analysis.presentationCategory}
Keywords: ${analysis.keywords.join(", ")}

PREVIOUS SLIDES (for context — DO NOT repeat their content):
${prevContext || "(This is the first slide)"}

NEXT SLIDE:
${nextContext}

ORIGINAL INPUT (for reference): "${inputText.substring(0, 1500)}"

Generate this ONE slide. Make it focused, impactful, and presentation-ready. Follow the ${analysis.presentationCategory} design profile — this should feel like a ${analysis.presentationCategory} presentation.`;

  try {
    const raw = await callAI(systemPrompt, userPrompt);
    const content = parseJSON(raw);

    return {
      id: `slide-${Date.now()}-${plan.index}`,
      type: plan.type,
      heading: content.heading || plan.heading,
      sub: content.sub || "",
      bullets: content.bullets || plan.keyPoints,
      leftCol: content.leftCol,
      rightCol: content.rightCol,
      quote: content.quote,
      author: content.author,
      stats: content.stats,
      timeline: content.timeline,
      process: content.process,
      chart: content.chart,
      chartType: content.chartType,
      icon: content.icon || getIconForType(plan.type),
      notes: content.notes || plan.notes,
      imageUrl: content.imageUrl,
      imagePrompt: content.imagePrompt,
      index: plan.index,
    };
  } catch {
    // Fallback: create slide from plan without AI
    return createSlideFromPlan(plan, analysis);
  }
}

// ---------- Factory -----------

/**
 * Creates a SlideWriterAgent that generates presentation slides
 * one at a time with full AI-powered content, category-aware design
 * rules, per-slide visual context, and quality guidelines.
 */
export function createSlideWriterAgent(): SlideWriterAgent {
  return {
    async writeSlide(
      plan: SlidePlan,
      analysis: ExtendedAnalysis,
      templateId: TemplateId,
      inputText: string,
      previousSlides: Slide[],
      nextPlan: SlidePlan | null
    ): Promise<Slide> {
      return generateSingleSlide(
        plan,
        analysis,
        templateId,
        inputText,
        previousSlides,
        nextPlan
      );
    },

    async writeAllSlides(
      plans: SlidePlan[],
      analysis: ExtendedAnalysis,
      templateId: TemplateId,
      inputText: string,
      onProgress?: (progress: GenerationProgress) => void
    ): Promise<Slide[]> {
      const slides: Slide[] = [];

      for (let i = 0; i < plans.length; i++) {
        const plan = plans[i];
        const nextPlan = i < plans.length - 1 ? plans[i + 1] : null;

        // Report progress
        onProgress?.({
          step: "generating",
          message: `Writing slide ${i + 1} of ${plans.length}: ${plan.heading}`,
          progress: Math.round((i / plans.length) * 100),
          currentSlide: i + 1,
          totalSlides: plans.length,
        });

        // Generate the slide with full context
        const slide = await generateSingleSlide(
          plan,
          analysis,
          templateId,
          inputText,
          slides, // previously generated slides for context
          nextPlan
        );

        slides.push(slide);
      }

      // Final progress report
      onProgress?.({
        step: "generating",
        message: `All ${plans.length} slides written successfully`,
        progress: 100,
        currentSlide: plans.length,
        totalSlides: plans.length,
      });

      return slides;
    },
  };
}
