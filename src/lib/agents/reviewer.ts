// ============================================================
// Quality Reviewer Agent — Deck Polish & Quality Assurance
// ============================================================
// Reviews and polishes the full deck after generation.
// Two-pass approach:
//   1. async review()        — AI-powered comprehensive polish
//   2. sync finalQualityCheck() — deterministic structural fixes
// ============================================================

import type { Slide, SlideType } from "@/types";
import {
  callAI,
  parseJSON,
  getCategoryDesignProfile,
} from "../ai-engine";
import type { CategoryDesignProfile } from "../ai-engine";

// ---------- Types ----------

export interface QualityReviewerAgent {
  /**
   * AI-powered full-deck review and polish.
   * Removes repetition, shortens overloaded slides, improves titles,
   * transitions, flow, and category fit.
   * On failure, returns the original slides unchanged.
   */
  review(slides: Slide[], analysis: unknown): Promise<Slide[]>;

  /**
   * Synchronous structural quality check — no AI calls.
   * Ensures title/closing slides, enforces bullet limits per category
   * profile, de-duplicates headings, adds missing speaker notes,
   * and ensures an agenda slide exists.
   */
  finalQualityCheck(slides: Slide[], analysis: unknown): Slide[];
}

// ---------- JSON-safe slide representation for AI prompt ----------

interface AISlide {
  index: number;
  type: SlideType;
  heading: string;
  sub?: string;
  bullets?: string[];
  leftCol?: string[];
  rightCol?: string[];
  quote?: string;
  stats?: Array<{ label: string; value: string }>;
  notes?: string;
}

// ---------- Constants ----------

const AGENDA_KEYWORDS = [
  "agenda",
  "overview",
  "roadmap",
  "outline",
  "today's topics",
  "what we'll cover",
  "contents",
  "table of contents",
];

const CLOSING_KEYWORDS = [
  "thank you",
  "thanks",
  "questions",
  "q&a",
  "next steps",
  "closing",
  "summary",
  "takeaways",
  "conclusion",
  "recap",
  "key takeaway",
];

// ---------- Factory ----------

export function createQualityReviewerAgent(): QualityReviewerAgent {
  return {
    review,
    finalQualityCheck,
  };
}

// ============================================================
// ASYNC REVIEW — AI-Powered Comprehensive Polish
// ============================================================

async function review(slides: Slide[], analysis: unknown): Promise<Slide[]> {
  const category = extractCategory(analysis);
  const profile = getCategoryDesignProfile(category);

  const analysisSummary = buildAnalysisSummary(analysis);
  const aiSlides = slides.map(toAISlide);

  const systemPrompt = buildReviewSystemPrompt(profile);
  const userPrompt = buildReviewUserPrompt(aiSlides, analysisSummary, profile);

  try {
    const raw = await callAI(systemPrompt, userPrompt);
    const parsed = parseJSON(raw);

    const rawSlides: Slide[] = Array.isArray(parsed)
      ? parsed
      : (parsed as { slides?: Slide[] }).slides ?? [];

    if (rawSlides.length === 0) {
      console.warn("[QualityReviewerAgent] AI returned empty slides, returning originals");
      return slides;
    }

    // Merge AI improvements back onto the originals so visual fields
    // (imageUrl, imagePrompt, chart, etc.) that the AI may omit are preserved.
    return slides.map((original, i) => {
      if (i >= rawSlides.length) return original;
      const improved = rawSlides[i];
      return mergeSlide(original, improved);
    });
  } catch (err) {
    console.error("[QualityReviewerAgent] AI review failed, returning originals:", err);
    return slides;
  }
}

// ============================================================
// SYNC FINAL QUALITY CHECK — Deterministic Structural Fixes
// ============================================================

function finalQualityCheck(slides: Slide[], analysis: unknown): Slide[] {
  const profile = getCategoryDesignProfile(extractCategory(analysis));
  const maxBullets = profile.maxBulletsPerSlide;

  // Deep-mutate in place (fast path) then return the same array.
  let deck = slides;

  // 1. Ensure first slide is a title slide
  deck = ensureTitleSlide(deck);

  // 2. Ensure last slide is a closing/summary slide
  deck = ensureClosingSlide(deck);

  // 3. Enforce bullet limits per category profile
  deck = enforceBulletLimits(deck, maxBullets);

  // 4. Remove duplicate headings (keep first occurrence)
  deck = deduplicateHeadings(deck);

  // 5. Ensure every slide has speaker notes
  deck = ensureSpeakerNotes(deck);

  // 6. Ensure an agenda slide exists (slide index 1)
  deck = ensureAgendaSlide(deck);

  // 7. Re-index
  deck.forEach((s, i) => {
    s.index = i;
  });

  return deck;
}

// ============================================================
// Fix: Title Slide
// ============================================================

function ensureTitleSlide(slides: Slide[]): Slide[] {
  if (slides.length === 0) return slides;

  if (slides[0].type === "title") return slides;

  // If any existing slide is a title, swap it to position 0
  const titleIdx = slides.findIndex((s) => s.type === "title");
  if (titleIdx > 0) {
    const tmp = slides[0];
    slides[0] = slides[titleIdx];
    slides[titleIdx] = tmp;
    return slides;
  }

  // Otherwise convert slide 0 into a title slide
  slides[0] = {
    ...slides[0],
    type: "title",
    sub: slides[0].sub || slides[0].bullets?.join(" · ") || "",
    bullets: [],
    leftCol: [],
    rightCol: [],
    stats: [],
    timeline: [],
    process: [],
  };

  return slides;
}

// ============================================================
// Fix: Closing Slide
// ============================================================

function ensureClosingSlide(slides: Slide[]): Slide[] {
  if (slides.length <= 1) return slides;

  const last = slides[slides.length - 1];

  if (last.type === "closing" || last.type === "summary") return slides;

  // Check if any existing slide looks like a closing slide
  const closingIdx = findLikelyClosingSlide(slides);
  if (closingIdx !== -1 && closingIdx !== slides.length - 1) {
    // Swap closing candidate to end
    const tmp = slides[slides.length - 1];
    slides[slides.length - 1] = slides[closingIdx];
    slides[closingIdx] = tmp;
    return slides;
  }

  // Convert the last slide to a closing slide
  slides[slides.length - 1] = {
    ...last,
    type: "closing",
    bullets: last.bullets?.length
      ? last.bullets
      : ["Thank you for your attention", "Questions & Discussion"],
    notes: last.notes || "Thank the audience and open the floor for questions.",
  };

  return slides;
}

function findLikelyClosingSlide(slides: Slide[]): number {
  // Skip first and last
  for (let i = 1; i < slides.length - 1; i++) {
    const heading = (slides[i].heading ?? "").toLowerCase();
    if (CLOSING_KEYWORDS.some((kw) => heading.includes(kw))) {
      return i;
    }
  }
  return -1;
}

// ============================================================
// Fix: Bullet Limits
// ============================================================

function enforceBulletLimits(slides: Slide[], maxBullets: number): Slide[] {
  for (const slide of slides) {
    if (slide.bullets && slide.bullets.length > maxBullets) {
      slide.bullets = slide.bullets.slice(0, maxBullets);
    }
    if (slide.leftCol && slide.leftCol.length > maxBullets) {
      slide.leftCol = slide.leftCol.slice(0, maxBullets);
    }
    if (slide.rightCol && slide.rightCol.length > maxBullets) {
      slide.rightCol = slide.rightCol.slice(0, maxBullets);
    }
    if (slide.stats && slide.stats.length > 4) {
      slide.stats = slide.stats.slice(0, 4);
    }
    if (slide.timeline && slide.timeline.length > 6) {
      slide.timeline = slide.timeline.slice(0, 6);
    }
    if (slide.process && slide.process.length > 6) {
      slide.process = slide.process.slice(0, 6);
    }
    if (slide.chart && slide.chart.length > 8) {
      slide.chart = slide.chart.slice(0, 8);
    }
  }
  return slides;
}

// ============================================================
// Fix: Duplicate Headings
// ============================================================

function deduplicateHeadings(slides: Slide[]): Slide[] {
  const seen = new Set<string>();

  for (const slide of slides) {
    const normalized = (slide.heading ?? "").trim().toLowerCase();
    if (!normalized) continue;

    if (seen.has(normalized)) {
      slide.heading = `${slide.heading} (cont.)`;
    } else {
      seen.add(normalized);
    }
  }

  return slides;
}

// ============================================================
// Fix: Speaker Notes
// ============================================================

function ensureSpeakerNotes(slides: Slide[]): Slide[] {
  const defaultNotes: Record<SlideType, string> = {
    title: "Welcome the audience. Introduce yourself and the presentation topic.",
    content: "Walk through the key points on this slide.",
    "two-column": "Compare and contrast the two columns. Highlight key differences.",
    closing: "Thank the audience. Open the floor for questions.",
    "image-left": "Discuss the visual and explain how it relates to the key points.",
    "image-right": "Discuss the visual and explain how it relates to the key points.",
    quote: "Read the quote aloud. Connect it to your presentation's core message.",
    comparison: "Highlight the key differences and why they matter.",
    timeline: "Walk through the chronological progression.",
    statistic: "Emphasize the key metrics and what they mean for the audience.",
    divider: "Transition to the next section.",
    process: "Explain each step in the process.",
    chart: "Interpret the data and highlight key trends.",
    summary: "Recap the key takeaways from the presentation.",
    qa: "Invite questions from the audience.",
    "case-study": "Walk through the case study and its relevance.",
    diagram: "Explain the diagram and its components.",
    blank: "Use this slide as needed for additional content.",
  };

  for (const slide of slides) {
    if (!slide.notes || !slide.notes.trim()) {
      slide.notes = defaultNotes[slide.type] ?? "Present this slide.";
    }
  }

  return slides;
}

// ============================================================
// Fix: Agenda Slide
// ============================================================

function ensureAgendaSlide(slides: Slide[]): Slide[] {
  if (slides.length <= 1) return slides;

  const second = slides[1];
  const heading = (second.heading ?? "").toLowerCase();

  const alreadyAgenda = AGENDA_KEYWORDS.some((kw) => heading.includes(kw));

  if (alreadyAgenda) {
    // Ensure it's not type "title"
    if (second.type === "title") {
      slides[1] = { ...second, type: "content" };
    }
    return slides;
  }

  // Check if any other slide looks like an agenda (skip 0 and 1)
  for (let i = 2; i < slides.length; i++) {
    const h = (slides[i].heading ?? "").toLowerCase();
    if (AGENDA_KEYWORDS.some((kw) => h.includes(kw))) {
      // Swap to position 1
      const tmp = slides[1];
      slides[1] = slides[i];
      slides[i] = tmp;
      return slides;
    }
  }

  // Insert a new agenda slide at position 1
  const sectionHeadings = slides
    .filter((s, i) => i > 0 && s.type !== "closing" && s.type !== "summary")
    .slice(0, 5)
    .map((s) => s.heading);

  const agendaSlide: Slide = {
    id: crypto.randomUUID ? crypto.randomUUID() : `agenda-${Date.now()}`,
    type: "content",
    heading: "Agenda",
    bullets: sectionHeadings.length > 0
      ? sectionHeadings
      : ["Introduction", "Main Content", "Key Takeaways", "Next Steps", "Q&A"],
    notes: "Walk the audience through what you will cover today.",
    index: 1,
  };

  slides.splice(1, 0, agendaSlide);

  return slides;
}

// ============================================================
// AI Prompt Builders
// ============================================================

function buildReviewSystemPrompt(profile: CategoryDesignProfile): string {
  return `You are a world-class presentation editor and quality reviewer.
Your job is to polish an entire presentation deck to editorial excellence.

═══════════════════════════════════════
CATEGORY DESIGN PROFILE
═══════════════════════════════════════
- Category: ${profile.category}
- Visual Strategy: ${profile.visualStrategy}
- Max Words Per Bullet: ${profile.maxWordsPerBullet}
- Max Bullets Per Slide: ${profile.maxBulletsPerSlide}
- Heading Style: ${profile.headingStyle}
- Content Guidelines: ${profile.contentGuidelines}
- Slide Structure Rules: ${profile.slideStructureRules}

═══════════════════════════════════════
QUALITY REVIEW RULES
═══════════════════════════════════════

## 1. REMOVE REPETITION
- If two slides cover the same point, merge the stronger content onto one
  and make the other slide cover a new angle or expand a subpoint.
- Eliminate bullets that restate the heading.
- Remove redundant phrases across bullets on the same slide.

## 2. SHORTEN OVERLOADED SLIDES
- No more than ${profile.maxBulletsPerSlide} bullets per slide.
- No bullet should exceed ${profile.maxWordsPerBullet} words.
- If a slide is overloaded, redistribute points to logically adjacent slides.
- Prioritize impact — cut filler words, weaken qualifiers ("very", "really", "basically").

## 3. IMPROVE TITLES / HEADINGS
- Every heading must be ${profile.headingStyle} and specific.
- Headings should be concise (under 8 words when possible).
- No generic headings like "Introduction", "Overview", "Conclusion" — make them
  topic-specific instead.
- No duplicate headings anywhere in the deck.

## 4. IMPROVE TRANSITIONS & FLOW
- Ensure logical flow from slide to slide.
- Slide order should tell a coherent story.
- Each slide should have a clear purpose that builds on the previous one.
- Ensure section breaks are natural.

## 5. IMPROVE CATEGORY FIT
- The tone, language, and structure MUST match the ${profile.category} category.
- ${profile.contentGuidelines}
- ${profile.slideStructureRules}

## 6. OUTPUT FORMAT
Return ONLY a JSON array of slide objects with this structure:
[
  {
    "type": "title|content|two-column|closing|...",
    "heading": "Slide heading",
    "sub": "Optional subtitle",
    "bullets": ["Bullet 1", "Bullet 2"],
    "leftCol": ["Left column item"],
    "rightCol": ["Right column item"],
    "quote": "Optional quote text",
    "stats": [{"label": "Metric", "value": "Value"}],
    "notes": "Speaker notes for this slide"
  }
]

CRITICAL RULES:
- Preserve the original slide count: do not add or remove slides.
- Preserve the first slide as "title" and the last as "closing".
- Every slide MUST have "notes" (speaker notes).
- Every bullet must be concise (max ${profile.maxWordsPerBullet} words).
- No duplicate headings.
- Return ONLY a raw JSON array — no markdown fences.`;
}

function buildReviewUserPrompt(
  slides: AISlide[],
  analysisSummary: string,
  _profile: CategoryDesignProfile
): string {
  return `Review and polish the following presentation deck.

${analysisSummary}

Current slides (${slides.length}):
${JSON.stringify(slides, null, 2)}

Apply all quality review rules. Return ONLY the polished JSON array of slide objects.`;
}

// ============================================================
// Helpers
// ============================================================

function extractCategory(analysis: unknown): import("@/types").TopicCategory {
  if (!analysis || typeof analysis !== "object") return "general";
  const a = analysis as Record<string, unknown>;
  if (typeof a.presentationCategory === "string") return a.presentationCategory as import("@/types").TopicCategory;
  if (typeof a.category === "string") return a.category as import("@/types").TopicCategory;
  return "general";
}

function buildAnalysisSummary(analysis: unknown): string {
  if (!analysis || typeof analysis !== "object") return "";
  const a = analysis as Record<string, unknown>;
  const parts: string[] = [];
  if (a.suggestedTitle) parts.push(`Title: ${a.suggestedTitle}`);
  if (a.suggestedSubtitle) parts.push(`Subtitle: ${a.suggestedSubtitle}`);
  if (a.presentationCategory) parts.push(`Category: ${a.presentationCategory}`);
  if (a.category) parts.push(`Analysis category: ${a.category}`);
  if (a.audience) parts.push(`Audience: ${a.audience}`);
  if (a.tone) parts.push(`Tone: ${a.tone}`);
  if (a.purpose) parts.push(`Purpose: ${a.purpose}`);
  return parts.join("\n");
}

function toAISlide(slide: Slide, index: number): AISlide {
  const ai: AISlide = {
    index,
    type: slide.type,
    heading: slide.heading ?? "",
  };
  if (slide.sub) ai.sub = slide.sub;
  if (slide.bullets?.length) ai.bullets = slide.bullets;
  if (slide.leftCol?.length) ai.leftCol = slide.leftCol;
  if (slide.rightCol?.length) ai.rightCol = slide.rightCol;
  if (slide.quote) ai.quote = slide.quote;
  if (slide.notes) ai.notes = slide.notes;
  if (slide.stats?.length) ai.stats = slide.stats;
  return ai;
}

/**
 * Merge AI-improved content back onto the original slide,
 * preserving visual fields the AI didn't return.
 */
function mergeSlide(original: Slide, improved: Slide): Slide {
  return {
    ...original,
    type: improved.type ?? original.type,
    heading: improved.heading ?? original.heading,
    sub: improved.sub ?? original.sub,
    bullets: improved.bullets ?? original.bullets,
    leftCol: improved.leftCol ?? original.leftCol,
    rightCol: improved.rightCol ?? original.rightCol,
    quote: improved.quote ?? original.quote,
    author: improved.author ?? original.author,
    notes: improved.notes ?? original.notes,
    // Preserve visual metadata that AI may omit:
    imageUrl: original.imageUrl,
    imagePrompt: original.imagePrompt,
    stats: improved.stats ?? original.stats,
    timeline: original.timeline,
    process: original.process,
    chart: original.chart,
    chartType: original.chartType,
    icon: original.icon,
    layout: original.layout,
  };
}
