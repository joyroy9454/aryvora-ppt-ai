// ============================================================
// AI Intelligence Layer — Phase 2: Visual Intelligence
// Per-slide generation, content enhancement, quality assurance
// Visual metadata: image suggestions, visual types per topic
// ============================================================

import type {
  AIAnalysis,
  Slide,
  SlideType,
  TemplateId,
  GenerationProgress,
  TopicCategory,
  AudienceType,
} from "@/types";

const MODEL = process.env.OPENROUTER_MODEL || "openrouter/owl-alpha";

// ---------- Low-level AI call with retries ----------

export async function callAI(
  systemPrompt: string,
  userPrompt: string,
  retries = 2
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OpenRouter API key not configured");

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": "https://aryvora.com",
            "X-Title": "Aryvora PPT AI",
          },
          body: JSON.stringify({
            model: MODEL,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.7,
            response_format: { type: "json_object" },
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        let message = `OpenRouter error (${response.status})`;
        try {
          const parsed = JSON.parse(errText);
          if (parsed.error?.message) message = parsed.error.message;
        } catch {
          /* ignore */
        }
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        throw new Error(message);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content ?? "";
    } catch (err) {
      if (attempt >= retries) throw err;
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw new Error("AI request failed after retries");
}

// ---------- JSON parser with code-fence fallback ----------

export function parseJSON(raw: string): any {
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
    if (match) return JSON.parse(match[1]);
    throw new Error("Could not parse AI response");
  }
}

// ============================================================
// STEP 1 — Analyze Input
// ============================================================

export interface ExtendedAnalysis extends AIAnalysis {
  purpose: "inform" | "persuade" | "educate" | "pitch" | "report" | "inspire";
  suggestedTemplate: TemplateId;
}

export async function analyzeInput(
  inputText: string,
  inputMode: string
): Promise<ExtendedAnalysis> {
  const systemPrompt = `You are a senior presentation strategist with 20 years of experience crafting decks for Fortune 500 companies, startups, universities, and conferences.

Your job is to deeply analyze the input and determine the OPTIMAL presentation strategy.

Return ONLY a JSON object with these fields:
{
  "category": "technology|business|education|science|health|marketing|finance|creative|general",
  "audience": "students|professionals|executives|general|technical|investors|customers",
  "tone": "formal|casual|academic|persuasive|inspirational|technical|conversational",
  "purpose": "inform|persuade|educate|pitch|report|inspire",
  "suggestedSlideCount": number (5-25),
  "suggestedTitle": "A compelling, specific presentation title (not generic)",
  "suggestedSubtitle": "A short descriptive subtitle",
  "suggestedTemplate": "corporate|academic|startup|minimal|dark|seminar|marketing|research|education|portfolio",
  "outline": ["Section 1 heading", "Section 2 heading", ...],
  "keywords": ["keyword1", "keyword2", ...]
}

ANALYSIS RULES:
- Detect the PURPOSE:
  * "pitch" → if asking for funding, selling a product/idea, startup-related
  * "persuade" → if trying to change minds, advocate for something
  * "educate" → if teaching, explaining concepts, academic
  * "report" → if presenting data, results, quarterly/annual review
  * "inspire" → if motivational, vision-setting, keynote-style
  * "inform" → default for general knowledge sharing

- Auto-select the best TEMPLATE:
  * pitch → "startup"
  * persuade + marketing/creative → "marketing"
  * educate + students → "education" or "seminar"
  * educate + academic/research → "academic" or "research"
  * report + business/finance → "corporate" or "research"
  * inform + technology → "dark" or "minimal"
  * inspire → "dark" or "portfolio"
  * general + executives → "corporate"
  * general + creative → "portfolio"

- suggestedSlideCount:
  * 5-7 for simple topics, pitches, short briefings
  * 8-12 for standard presentations
  * 13-18 for complex topics, detailed reports
  * 19-25 for comprehensive courses, deep-dives

- outline: should have (suggestedSlideCount - 3) items (excluding title, agenda, and closing)
- keywords: 3-7 relevant keywords for icon/image suggestions
- Title should be SPECIFIC and COMPELLING — never generic like "Presentation" or "Overview"

Return ONLY raw JSON, no markdown.`;

  const userPrompt = `Input mode: ${inputMode}
Input content: "${inputText.substring(0, 4000)}"

Analyze this input deeply and suggest the optimal presentation strategy. Think about what would make the most impact on the target audience.`;

  const raw = await callAI(systemPrompt, userPrompt);
  const result = parseJSON(raw);

  return {
    category: result.category || "general",
    audience: result.audience || "general",
    tone: result.tone || "conversational",
    purpose: result.purpose || "inform",
    suggestedSlideCount: Math.min(
      Math.max(result.suggestedSlideCount || 8, 5),
      25
    ),
    suggestedTitle: result.suggestedTitle || "Presentation",
    suggestedSubtitle: result.suggestedSubtitle || "",
    suggestedTemplate: result.suggestedTemplate || "corporate",
    outline: result.outline || [],
    keywords: result.keywords || [],
  };
}

// ============================================================
// STEP 1.5 — Auto-select template (standalone utility)
// ============================================================

export function autoSelectTemplate(
  category: TopicCategory,
  audience: AudienceType,
  purpose?: string
): TemplateId {
  if (purpose === "pitch") return "startup";
  if (purpose === "inspire") return "dark";

  const key = `${category}:${audience}`;
  const map: Record<string, TemplateId> = {
    "technology:technical": "dark",
    "technology:professionals": "corporate",
    "technology:executives": "corporate",
    "technology:investors": "startup",
    "technology:students": "education",
    "business:executives": "corporate",
    "business:professionals": "corporate",
    "business:investors": "startup",
    "business:general": "minimal",
    "education:students": "education",
    "education:professionals": "seminar",
    "education:general": "seminar",
    "science:technical": "research",
    "science:students": "research",
    "health:general": "seminar",
    "health:professionals": "research",
    "marketing:customers": "marketing",
    "marketing:professionals": "marketing",
    "marketing:executives": "corporate",
    "finance:executives": "corporate",
    "finance:professionals": "research",
    "finance:investors": "corporate",
    "creative:general": "portfolio",
    "creative:professionals": "portfolio",
  };

  if (map[key]) return map[key];

  const catMap: Record<string, TemplateId> = {
    technology: "dark",
    business: "corporate",
    education: "education",
    science: "research",
    health: "seminar",
    marketing: "marketing",
    finance: "corporate",
    creative: "portfolio",
  };

  return catMap[category] || "corporate";
}

// ============================================================
// STEP 1.6 — Summarize long input
// ============================================================

export async function summarizeInput(
  inputText: string,
  maxChars = 3000
): Promise<string> {
  if (inputText.length <= maxChars) return inputText;

  const systemPrompt = `You are a content analyst. Summarize the following input into a concise, structured summary that preserves ALL key points, arguments, data, and conclusions.

Format the summary as:
1. Main topic/theme
2. Key points (one per line)
3. Supporting data/evidence
4. Conclusions/recommendations

Keep it under ${maxChars} characters. Preserve specific numbers, names, and technical terms.`;

  try {
    const raw = await callAI(systemPrompt, inputText.substring(0, 8000));
    return raw.length > maxChars ? raw.substring(0, maxChars) : raw;
  } catch {
    const truncated = inputText.substring(0, maxChars);
    const lastPeriod = truncated.lastIndexOf(".");
    return lastPeriod > maxChars * 0.7
      ? truncated.substring(0, lastPeriod + 1)
      : truncated + "...";
  }
}

// ============================================================
// STEP 2 — Generate detailed outline
// ============================================================

export interface OutlineSection {
  title: string;
  slideCount: number;
  keyPoints: string[];
  suggestedSlideTypes: SlideType[];
}

// Image position type for visual layout
export type ImagePosition = "left" | "right" | "background" | "none";

// Visual type for the kind of visual element to use
export type VisualType = "image" | "chart" | "diagram" | "icon" | "none";

export interface SlidePlan {
  index: number;
  type: SlideType;
  heading: string;
  sectionTitle: string;
  keyPoints: string[];
  notes: string;
  // Visual intelligence fields (Phase 2):
  needsImage: boolean;
  imageKeyword: string;      // Search keyword for image (e.g. "mountain landscape sunset")
  imagePosition: ImagePosition;
  visualType: VisualType;
  visualCaption: string;     // Optional caption for the visual
}

// ============================================================
// Visual Strategy Helper
// ============================================================

export interface VisualStrategy {
  preferredVisualType: VisualType;
  imageStyle: string;        // Description of the image style
  useBackgroundImage: boolean;
  useIcons: boolean;
  useCharts: boolean;
  useDiagrams: boolean;
  captionStyle: string;      // How captions should be written
}

/**
 * Returns visual strategy guidelines per topic category.
 * This drives how suggestVisualsForPlan() decides what visuals to recommend.
 */
export function getVisualStrategyForCategory(category: TopicCategory | string): VisualStrategy {
  switch (category) {
    case "science":
    case "health":
      return {
        preferredVisualType: "image",
        imageStyle: "real-world photography — nature, laboratories, medical, landscapes, scientific phenomena",
        useBackgroundImage: false,
        useIcons: true,
        useCharts: true,
        useDiagrams: true,
        captionStyle: "factual, descriptive captions explaining what the image shows and its relevance",
      };

    case "nature":
    case "geography":
    case "environment":
      return {
        preferredVisualType: "image",
        imageStyle: "stunning real-world photography — landscapes, wildlife, natural phenomena, aerial views",
        useBackgroundImage: true,
        useIcons: false,
        useCharts: false,
        useDiagrams: false,
        captionStyle: "evocative captions that connect the natural imagery to the slide's message",
      };

    case "business":
    case "finance":
      return {
        preferredVisualType: "chart",
        imageStyle: "professional imagery — clean office settings, business meetings, data visualizations, corporate environments",
        useBackgroundImage: false,
        useIcons: true,
        useCharts: true,
        useDiagrams: true,
        captionStyle: "data-driven captions highlighting key metrics or business insights",
      };

    case "technology":
      return {
        preferredVisualType: "diagram",
        imageStyle: "modern tech imagery — circuit boards, data centers, code screens, futuristic interfaces, architecture diagrams",
        useBackgroundImage: false,
        useIcons: true,
        useCharts: true,
        useDiagrams: true,
        captionStyle: "technical captions explaining system architecture, flow, or technology concepts",
      };

    case "education":
      return {
        preferredVisualType: "diagram",
        imageStyle: "clean, simple visuals — classroom settings, educational diagrams, student-friendly illustrations, chalkboard/whiteboard",
        useBackgroundImage: false,
        useIcons: true,
        useCharts: false,
        useDiagrams: true,
        captionStyle: "educational captions that explain concepts clearly and simply",
      };

    case "marketing":
    case "creative":
      return {
        preferredVisualType: "image",
        imageStyle: "vibrant, eye-catching imagery — bold colors, creative compositions, lifestyle photography, product shots",
        useBackgroundImage: true,
        useIcons: true,
        useCharts: false,
        useDiagrams: false,
        captionStyle: "engaging, punchy captions that reinforce the marketing message",
      };

    case "general":
    default:
      return {
        preferredVisualType: "image",
        imageStyle: "balanced, professional imagery — versatile stock photos, abstract backgrounds, conceptual visuals",
        useBackgroundImage: false,
        useIcons: true,
        useCharts: true,
        useDiagrams: false,
        captionStyle: "neutral, informative captions that support the slide content",
      };
  }
}

// ============================================================
// Suggest Visuals for Plan
// ============================================================

/**
 * Takes the slide plans and analysis, returns enhanced plans with visual metadata.
 * Decides which slides need images, generates descriptive keywords, chooses visual types.
 */
export function suggestVisualsForPlan(
  plans: SlidePlan[],
  analysis: ExtendedAnalysis
): SlidePlan[] {
  const strategy = getVisualStrategyForCategory(analysis.category);
  const totalSlides = plans.length;
  const keywords = analysis.keywords || [];

  // Slides that should NEVER have images
  const noImageTypes: Set<SlideType> = new Set(["title", "closing", "qa", "blank"]);

  // Slides that are CANDIDATES for images (not every slide should have one)
  const imageCandidateTypes: Set<SlideType> = new Set([
    "content", "two-column", "comparison", "divider", "image-left", "image-right"
  ]);

  // Slides that should use charts/diagrams instead of photos
  const chartTypes: Set<SlideType> = new Set(["statistic", "chart"]);
  const diagramTypes: Set<SlideType> = new Set(["process", "timeline"]);

  // Track used positions to ensure variety
  const positions: ImagePosition[] = ["left", "right", "background"];
  let positionIndex = 0;

  // Track which slides get images (we want ~40-60% of eligible slides)
  const eligibleIndices: number[] = [];
  plans.forEach((plan, idx) => {
    if (
      !noImageTypes.has(plan.type) &&
      plan.heading &&
      plan.heading.trim().length > 0 &&
      idx > 0 && // Skip title
      idx < totalSlides - 1 // Skip closing
    ) {
      eligibleIndices.push(idx);
    }
  });

  // Select ~50% of eligible slides for images, prioritizing content slides
  const imageCount = Math.max(1, Math.round(eligibleIndices.length * 0.5));
  const selectedIndices = new Set<number>();

  // Always include the first content slide if eligible
  if (eligibleIndices.length > 0) {
    selectedIndices.add(eligibleIndices[0]);
  }

  // Spread remaining selections evenly
  if (eligibleIndices.length > 1 && imageCount > 1) {
    const step = eligibleIndices.length / (imageCount - 1);
    for (let i = 1; i < imageCount && i * step < eligibleIndices.length; i++) {
      const idx = eligibleIndices[Math.min(Math.round(i * step), eligibleIndices.length - 1)];
      selectedIndices.add(idx);
    }
  }

  return plans.map((plan, idx) => {
    const enhanced: SlidePlan = { ...plan };

    // Title, closing, QA, blank slides: no images
    if (noImageTypes.has(plan.type)) {
      enhanced.needsImage = false;
      enhanced.imageKeyword = "";
      enhanced.imagePosition = "none";
      enhanced.visualType = "none";
      enhanced.visualCaption = "";
      return enhanced;
    }

    // Statistic/chart slides: use chart visual type
    if (chartTypes.has(plan.type)) {
      enhanced.needsImage = false;
      enhanced.imageKeyword = "";
      enhanced.imagePosition = "none";
      enhanced.visualType = "chart";
      enhanced.visualCaption = `Data visualization for: ${plan.heading}`;
      return enhanced;
    }

    // Process/timeline slides: use diagram visual type
    if (diagramTypes.has(plan.type)) {
      enhanced.needsImage = false;
      enhanced.imageKeyword = "";
      enhanced.imagePosition = "none";
      enhanced.visualType = "diagram";
      enhanced.visualCaption = `Flow diagram for: ${plan.heading}`;
      return enhanced;
    }

    // Quote slides: optional background image for impact
    if (plan.type === "quote") {
      if (strategy.useBackgroundImage && idx % 4 === 0) {
        enhanced.needsImage = true;
        enhanced.imageKeyword = generateImageKeyword(plan, keywords, strategy, true);
        enhanced.imagePosition = "background";
        enhanced.visualType = "image";
        enhanced.visualCaption = "";
      } else {
        enhanced.needsImage = false;
        enhanced.imageKeyword = "";
        enhanced.imagePosition = "none";
        enhanced.visualType = "icon";
        enhanced.visualCaption = "";
      }
      return enhanced;
    }

    // Divider slides: background image for visual impact
    if (plan.type === "divider") {
      if (strategy.useBackgroundImage) {
        enhanced.needsImage = true;
        enhanced.imageKeyword = generateImageKeyword(plan, keywords, strategy, true);
        enhanced.imagePosition = "background";
        enhanced.visualType = "image";
        enhanced.visualCaption = "";
      } else {
        enhanced.needsImage = false;
        enhanced.imageKeyword = "";
        enhanced.imagePosition = "none";
        enhanced.visualType = "icon";
        enhanced.visualCaption = "";
      }
      return enhanced;
    }

    // Summary slide: no image, keep it clean
    if (plan.type === "summary") {
      enhanced.needsImage = false;
      enhanced.imageKeyword = "";
      enhanced.imagePosition = "none";
      enhanced.visualType = "icon";
      enhanced.visualCaption = "";
      return enhanced;
    }

    // Content slides and others: use selected indices
    if (selectedIndices.has(idx) && imageCandidateTypes.has(plan.type)) {
      const position = positions[positionIndex % positions.length];
      positionIndex++;

      enhanced.needsImage = true;
      enhanced.imageKeyword = generateImageKeyword(plan, keywords, strategy, false);
      enhanced.imagePosition = position;
      enhanced.visualType = strategy.preferredVisualType === "none" ? "image" : strategy.preferredVisualType;
      enhanced.visualCaption = generateCaption(plan, strategy);
    } else {
      // No image needed, but may use icons
      enhanced.needsImage = false;
      enhanced.imageKeyword = "";
      enhanced.imagePosition = "none";
      enhanced.visualType = strategy.useIcons ? "icon" : "none";
      enhanced.visualCaption = "";
    }

    return enhanced;
  });
}

/**
 * Generates a specific, descriptive image search keyword for a slide.
 */
function generateImageKeyword(
  plan: SlidePlan,
  globalKeywords: string[],
  strategy: VisualStrategy,
  isBackground: boolean
): string {
  const heading = plan.heading || "";
  const section = plan.sectionTitle || "";
  const keyPoints = plan.keyPoints || [];

  // Build a descriptive keyword from the slide content
  const mainTopic = heading.length > 3 ? heading : section;

  // Extract the most meaningful words from the heading
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "being", "have", "has", "had", "do", "does", "did", "will", "would",
    "could", "should", "may", "might", "shall", "can", "need", "dare",
    "ought", "used", "this", "that", "these", "those", "it", "its",
    "our", "your", "their", "my", "his", "her", "we", "they", "you", "i",
    "about", "into", "through", "during", "before", "after", "above",
    "below", "between", "under", "over", "again", "further", "then", "once",
    "here", "there", "when", "where", "why", "how", "all", "each", "every",
    "both", "few", "more", "most", "other", "some", "such", "no", "not",
    "only", "own", "same", "so", "than", "too", "very", "just", "because",
    "as", "until", "while", "although", "however", "also", "still",
  ]);

  const meaningfulWords = mainTopic
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w))
    .slice(0, 3);

  // If we have meaningful words from the heading, use them
  if (meaningfulWords.length > 0) {
    const baseKeyword = meaningfulWords.join(" ");

    if (isBackground) {
      // Background images: broader, more atmospheric
      const bgModifiers = ["wide", "panoramic", "abstract", "atmospheric"];
      const modifier = bgModifiers[Math.abs(hashString(mainTopic)) % bgModifiers.length];
      return `${modifier} ${baseKeyword} ${strategy.imageStyle.split("—")[0].trim()}`;
    }

    // Regular images: specific and descriptive
    return `${baseKeyword} ${strategy.imageStyle.split("—")[0].trim()}`;
  }

  // Fallback: use global keywords
  if (globalKeywords.length > 0) {
    const kwIdx = Math.abs(hashString(mainTopic)) % globalKeywords.length;
    return `${globalKeywords[kwIdx]} ${strategy.imageStyle.split("—")[0].trim()}`;
  }

  // Last resort
  return strategy.imageStyle.split("—")[0].trim();
}

/**
 * Generates a caption for a visual based on the slide content and strategy.
 */
function generateCaption(plan: SlidePlan, strategy: VisualStrategy): string {
  const heading = plan.heading || "";
  const keyPoints = plan.keyPoints || [];

  if (keyPoints.length > 0) {
    // Use the first key point as inspiration for the caption
    const firstPoint = keyPoints[0];
    if (firstPoint.length < 60) {
      return `${firstPoint} — illustrating ${heading.toLowerCase()}`;
    }
  }

  return `${strategy.captionStyle}. Visual representation of ${heading.toLowerCase()}`;
}

/**
 * Simple string hash for deterministic but varied selection.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

// ============================================================
// Generate Outline (with visual intelligence)
// ============================================================

export async function generateOutline(
  inputText: string,
  analysis: ExtendedAnalysis
): Promise<SlidePlan[]> {
  const systemPrompt = `You are a presentation architect. Create a detailed slide-by-slide plan for a ${analysis.suggestedSlideCount}-slide presentation.

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
- Total slides must equal ${analysis.suggestedSlideCount}
- Slide 0: type "title" — the presentation title slide
- Slide 1: type "content" — Agenda/Overview (4-5 bullet points listing main sections)
- Slides 2 to ${analysis.suggestedSlideCount - 2}: content slides with varied types
- Slide ${analysis.suggestedSlideCount - 2}: type "summary" — Key Takeaways
- Slide ${analysis.suggestedSlideCount - 1}: type "closing" — Thank You / Next Steps

VARY THE SLIDE TYPES across content slides:
- Use "content" for standard text slides (most common)
- Use "two-column" for comparisons or pros/cons
- Use "statistic" for data-heavy slides (2-4 key metrics)
- Use "quote" for impactful quotes (1 per presentation)
- Use "timeline" for chronological content
- Use "process" for step-by-step flows
- Use "comparison" for side-by-side analysis
- Use "divider" between major sections (every 4-5 slides)
- Use "chart" for data visualization

Each slide must have:
- "heading": a SPECIFIC, ENGAGING title (not generic)
- "keyPoints": 2-4 key points for this slide
- "notes": 1 sentence describing what the presenter should say

Return ONLY raw JSON array.`;

  const userPrompt = `Presentation: "${analysis.suggestedTitle}"
Subtitle: "${analysis.suggestedSubtitle}"
Category: ${analysis.category}
Audience: ${analysis.audience}
Tone: ${analysis.tone}
Purpose: ${analysis.purpose}
Keywords: ${analysis.keywords.join(", ")}

Outline to expand:
${analysis.outline.map((item, i) => `${i + 1}. ${item}`).join("\n")}

Original input (for reference): "${inputText.substring(0, 2000)}"

Create a detailed slide-by-slide plan. Each slide should have a clear purpose and focus on ONE main idea.`;

  try {
    const raw = await callAI(systemPrompt, userPrompt);
    const result = parseJSON(raw);
    const plans: SlidePlan[] = Array.isArray(result) ? result : result.slides || [];

    // Add default visual fields to AI-generated plans
    const plansWithVisuals = plans.map((plan) => ensureVisualFields(plan));

    // Validate and fix slide count
    if (plansWithVisuals.length !== analysis.suggestedSlideCount) {
      return suggestVisualsForPlan(createDefaultSlidePlan(analysis), analysis);
    }

    // Apply visual intelligence
    return suggestVisualsForPlan(plansWithVisuals, analysis);
  } catch {
    return suggestVisualsForPlan(createDefaultSlidePlan(analysis), analysis);
  }
}

/**
 * Ensures a SlidePlan has all visual fields populated with defaults.
 * Used when parsing AI output that doesn't include the new fields.
 */
function ensureVisualFields(plan: Partial<SlidePlan> & { index: number; type: SlideType; heading: string }): SlidePlan {
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

function createDefaultSlidePlan(analysis: ExtendedAnalysis): SlidePlan[] {
  const total = analysis.suggestedSlideCount;
  const plans: SlidePlan[] = [];

  // Title slide
  plans.push({
    index: 0,
    type: "title",
    heading: analysis.suggestedTitle,
    sectionTitle: "Title",
    keyPoints: [],
    notes: `Welcome the audience and introduce "${analysis.suggestedTitle}".`,
    needsImage: false,
    imageKeyword: "",
    imagePosition: "none",
    visualType: "none",
    visualCaption: "",
  });

  // Agenda slide
  plans.push({
    index: 1,
    type: "content",
    heading: "Agenda",
    sectionTitle: "Overview",
    keyPoints: analysis.outline.slice(0, 5).length > 0
      ? analysis.outline.slice(0, 5)
      : ["Introduction", "Key Topics", "Analysis", "Recommendations", "Next Steps"],
    notes: "Walk the audience through what we'll cover today.",
    needsImage: false,
    imageKeyword: "",
    imagePosition: "none",
    visualType: "icon",
    visualCaption: "",
  });

  // Content slides
  const contentCount = total - 3; // minus title, agenda, closing
  for (let i = 0; i < contentCount; i++) {
    const sectionTitle = analysis.outline[i % analysis.outline.length] || `Key Point ${i + 1}`;
    const isLast = i === contentCount - 1;

    let type: SlideType = "content";
    if (isLast) {
      type = "summary";
    } else if (i === 2) {
      type = "statistic";
    } else if (i === 4) {
      type = "quote";
    } else if (i === 6) {
      type = "two-column";
    } else if (i > 0 && i % 5 === 0) {
      type = "divider";
    }

    const plan: SlidePlan = {
      index: i + 2,
      type,
      heading: sectionTitle,
      sectionTitle,
      keyPoints: [
        `Key insight about ${sectionTitle.toLowerCase()}`,
        `Supporting evidence or example`,
        `Actionable takeaway`,
      ],
      notes: `Explain the key points about ${sectionTitle.toLowerCase()}.`,
      needsImage: false,
      imageKeyword: "",
      imagePosition: "none",
      visualType: "none",
      visualCaption: "",
    };

    if (type === "statistic") {
      plan.keyPoints = ["85% improvement", "+42% growth", "1.2M users"];
      plan.notes = "Present the key metrics and what they mean.";
      plan.visualType = "chart";
      plan.visualCaption = `Data visualization for: ${sectionTitle}`;
    } else if (type === "quote") {
      plan.keyPoints = [];
      plan.notes = "Share this impactful quote and explain its relevance.";
      plan.visualType = "icon";
    } else if (type === "summary") {
      plan.heading = "Key Takeaways";
      plan.keyPoints = analysis.outline.slice(0, 4).map((item) => `Remember: ${item}`);
      plan.notes = "Summarize the key takeaways from the presentation.";
      plan.visualType = "icon";
    } else if (type === "divider") {
      plan.heading = sectionTitle;
      plan.keyPoints = [];
      plan.notes = `Transition to the next section: ${sectionTitle}.`;
      plan.needsImage = true;
      plan.imagePosition = "background";
      plan.visualType = "image";
    } else if (type === "content") {
      plan.visualType = "icon";
    }

    plans.push(plan);
  }

  // Closing slide
  plans.push({
    index: total - 1,
    type: "closing",
    heading: "Thank You",
    sectionTitle: "Closing",
    keyPoints: ["Questions?", "Let's discuss next steps"],
    notes: "Thank the audience and open the floor for questions.",
    needsImage: false,
    imageKeyword: "",
    imagePosition: "none",
    visualType: "none",
    visualCaption: "",
  });

  return plans;
}

// ============================================================
// STEP 3 — Generate slides ONE BY ONE
// ============================================================

const templateDescriptions: Record<TemplateId, string> = {
  corporate: "professional blue tones, clean sans-serif, structured layout, trustworthy feel",
  academic: "formal serif fonts, muted colors, citation-friendly, authoritative",
  startup: "bold gradients, high contrast, energetic feel, modern and disruptive",
  minimal: "lots of whitespace, restrained typography, understated elegance",
  dark: "dark backgrounds, neon accents, modern tech feel, sleek and premium",
  seminar: "friendly rounded design, green tones, approachable and warm",
  marketing: "vibrant warm colors, bold typography, eye-catching and dynamic",
  research: "data-focused, blue tones, structured and precise, evidence-based",
  education: "purple tones, playful but clear, student-friendly, engaging",
  portfolio: "creative pink/coral palette, elegant serif headings, artistic",
};

const toneInstructions: Record<string, string> = {
  formal: "Use professional, precise language. Avoid contractions and slang. Maintain authoritative tone.",
  casual: "Use conversational, friendly language. Contractions are fine. Be relatable.",
  academic: "Use scholarly language with precise terminology. Include references where appropriate. Objective tone.",
  persuasive: "Use compelling, action-oriented language. Include calls to action. Build urgency.",
  inspirational: "Use uplifting, motivational language. Tell stories. Paint a vision of the future.",
  technical: "Use precise technical terminology. Be specific and detailed. Include data points.",
  conversational: "Write as if speaking directly to the audience. Use 'you' and 'we'. Be engaging.",
};

/**
 * Generate a single slide with full context.
 * This is the core of per-slide generation — each slide gets its own AI call
 * with full awareness of the presentation flow.
 * Phase 2: Includes visual context when the slide needs an image.
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

  // Build context from previous slides
  const prevContext = previousSlides
    .slice(-3) // Last 3 slides for context
    .map((s, i) => `Slide ${s.index ?? previousSlides.length - 3 + i}: [${s.type}] "${s.heading}" — ${s.bullets?.slice(0, 2).join("; ") || s.quote || ""}`)
    .join("\n");

  const nextContext = nextPlan
    ? `Next slide will be: [${nextPlan.type}] "${nextPlan.heading}"`
    : "This is the closing slide.";

  // Build visual context for the prompt (Phase 2)
  let visualContext = "";
  if (plan.needsImage && plan.imageKeyword) {
    visualContext = `
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
  } else if (plan.visualType === "chart") {
    visualContext = `
═══════════════════════════════════════
VISUAL ELEMENT — CHART
═══════════════════════════════════════
This slide includes a chart visualization.
${plan.visualCaption ? `Caption: "${plan.visualCaption}"` : ""}
Ensure the data is presented clearly and the chart type is appropriate.
`;
  } else if (plan.visualType === "diagram") {
    visualContext = `
═══════════════════════════════════════
VISUAL ELEMENT — DIAGRAM
═══════════════════════════════════════
This slide includes a flow diagram or process visualization.
${plan.visualCaption ? `Caption: "${plan.visualCaption}"` : ""}
Ensure the diagram clearly shows the flow/relationship.
`;
  }

  const systemPrompt = `You are an elite presentation designer. You are generating ONE slide at a time for a high-stakes presentation.

Your slide must be FOCUSED on ONE main idea. No clutter. No repetition.

═══════════════════════════════════════
SLIDE TYPE: ${plan.type}
═══════════════════════════════════════

${getSlideTypeInstructions(plan.type)}
${visualContext}

═══════════════════════════════════════
QUALITY RULES — FOLLOW EXACTLY
═══════════════════════════════════════

1. Heading must be SPECIFIC and ENGAGING — never generic like "Overview" or "Introduction"
2. Content must be CONCISE — max 10 words per bullet, max 5 bullets
3. Use human-like language — vary sentence length, use active voice
4. NO repetition with previous slides — check the context below
5. Every word must earn its place — cut anything that doesn't add value
6. Speaker notes must be CONVERSATIONAL — 1-2 sentences, natural speaking tone
7. Include a transition phrase in notes when appropriate ("Now let's look at...", "Building on that...")

TONE: ${toneInstructions[analysis.tone] || toneInstructions.conversational}
AUDIENCE: ${analysis.audience} — adjust complexity and jargon accordingly
PURPOSE: ${analysis.purpose} — this slide must serve this goal
DESIGN STYLE: ${templateDescriptions[effectiveTemplate] || templateDescriptions.corporate}

Return ONLY a JSON object (not an array) with the slide content.
IMPORTANT: Return ONLY raw JSON, no markdown.`;

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
Category: ${analysis.category}
Keywords: ${analysis.keywords.join(", ")}

PREVIOUS SLIDES (for context — DO NOT repeat their content):
${prevContext || "(This is the first slide)"}

NEXT SLIDE:
${nextContext}

ORIGINAL INPUT (for reference): "${inputText.substring(0, 1500)}"

Generate this ONE slide. Make it focused, impactful, and presentation-ready.`;

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
      icon: content.icon || getIconForType(plan.type, analysis.category),
      notes: content.notes || plan.notes,
      index: plan.index,
    };
  } catch {
    // Fallback: create slide from plan
    return createSlideFromPlan(plan, analysis);
  }
}

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
    default:
      return `Standard slide requirements:
- "heading": Specific, engaging title
- "bullets": 3-5 concise bullets
- "icon": A relevant emoji
- "notes": 1-2 conversational sentences`;
  }
}

function createSlideFromPlan(plan: SlidePlan, analysis: ExtendedAnalysis): Slide {
  const slide: Slide = {
    id: `slide-${Date.now()}-${plan.index}`,
    type: plan.type,
    heading: plan.heading,
    icon: getIconForType(plan.type, analysis.category),
    notes: plan.notes,
    index: plan.index,
  };

  switch (plan.type) {
    case "title":
      slide.sub = analysis.suggestedSubtitle;
      break;
    case "content":
    case "summary":
    case "qa":
      slide.bullets = plan.keyPoints;
      break;
    case "statistic":
      slide.stats = [
        { label: "Key Metric", value: "85%" },
        { label: "Growth", value: "+42%" },
        { label: "Adoption", value: "1.2M" },
      ];
      break;
    case "quote":
      slide.quote = "The best way to predict the future is to create it.";
      slide.author = "Peter Drucker";
      break;
    case "two-column":
    case "comparison":
      slide.leftCol = plan.keyPoints.slice(0, 3);
      slide.rightCol = ["Alternative approach", "Different perspective", "Contrasting view"];
      break;
    case "timeline":
      slide.timeline = plan.keyPoints.map((p, i) => ({
        label: `Phase ${i + 1}`,
        description: p,
      }));
      break;
    case "process":
      slide.process = plan.keyPoints.map((p, i) => ({
        step: i + 1,
        title: `Step ${i + 1}`,
        description: p,
      }));
      break;
    case "chart":
      slide.chart = [
        { label: "A", value: 65 },
        { label: "B", value: 45 },
        { label: "C", value: 80 },
      ];
      slide.chartType = "bar";
      break;
    case "divider":
      slide.sub = "Section Overview";
      break;
    case "closing":
      slide.bullets = ["Questions?", "Let's discuss next steps"];
      break;
  }

  return slide;
}

function getIconForType(type: SlideType, category: string): string {
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
    blank: "📄",
  };
  return icons[type] || "📌";
}

/**
 * Generate all slides one by one.
 * This is the key Phase 1 improvement — each slide gets its own AI call
 * with full context of previous slides and the overall plan.
 */
export async function generateSlidesOneByOne(
  inputText: string,
  analysis: ExtendedAnalysis,
  templateId: TemplateId,
  inputMode: string,
  onProgress?: (progress: GenerationProgress) => void,
  slidePlans?: SlidePlan[]
): Promise<Slide[]> {
  const plans = slidePlans || suggestVisualsForPlan(createDefaultSlidePlan(analysis), analysis);
  const slides: Slide[] = [];

  for (let i = 0; i < plans.length; i++) {
    const plan = plans[i];
    const nextPlan = i < plans.length - 1 ? plans[i + 1] : null;

    onProgress?.({
      step: "generating",
      message: `Writing slide ${i + 1} of ${plans.length}: ${plan.heading}`,
      progress: 30 + Math.round((i / plans.length) * 40),
      currentSlide: i + 1,
      totalSlides: plans.length,
    });

    const slide = await generateSingleSlide(
      plan,
      analysis,
      templateId,
      inputText,
      slides,
      nextPlan
    );

    slides.push(slide);
  }

  return slides;
}

// ============================================================
// STEP 4 — Enhance content quality
// ============================================================

export async function enhanceContent(
  slides: Slide[],
  analysis: ExtendedAnalysis,
  onProgress?: (progress: GenerationProgress) => void
): Promise<Slide[]> {
  onProgress?.({
    step: "enhancing",
    message: "Polishing slide content...",
    progress: 75,
    totalSlides: slides.length,
  });

  const systemPrompt = `You are a world-class presentation editor. Review and enhance these slides to make them presentation-ready.

ENHANCEMENT RULES:
1. Remove ANY repetition across slides — each slide must have unique content
2. Improve headings to be more specific and engaging (avoid generic titles)
3. Make bullets more concise — max 10 words each, use strong action verbs
4. Ensure logical flow between slides — each slide should naturally lead to the next
5. Add variety to language — avoid starting multiple bullets with the same word
6. Make text presentation-friendly — short, punchy, memorable
7. Ensure the agenda slide accurately reflects the actual content
8. Ensure the summary slide synthesizes key insights (not just lists)
9. Improve speaker notes to be more conversational and natural
10. Preserve all slide types, IDs, and structure — only improve text content

Return ONLY a JSON array of the enhanced slide objects with the same structure and IDs.

IMPORTANT: Return ONLY the raw JSON array, no markdown.`;

  const userPrompt = `Enhance these ${slides.length} slides for a "${analysis.suggestedTitle}" presentation (${analysis.audience} audience, ${analysis.tone} tone, ${analysis.purpose} purpose):

${JSON.stringify(slides, null, 2)}

Improve quality while keeping the same structure. Make every word count. Ensure no repetition.`;

  try {
    const raw = await callAI(systemPrompt, userPrompt);
    const parsed = parseJSON(raw);
    const slideArray = Array.isArray(parsed) ? parsed : parsed.slides || [];

    return slides.map((original, i) => {
      const enhanced = slideArray[i];
      if (!enhanced) return original;
      return {
        ...original,
        heading: enhanced.heading || original.heading,
        sub: enhanced.sub !== undefined ? enhanced.sub : original.sub,
        bullets: enhanced.bullets || original.bullets,
        leftCol: enhanced.leftCol || original.leftCol,
        rightCol: enhanced.rightCol || original.rightCol,
        quote: enhanced.quote || original.quote,
        author: enhanced.author || original.author,
        stats: enhanced.stats || original.stats,
        timeline: enhanced.timeline || original.timeline,
        process: enhanced.process || original.process,
        chart: enhanced.chart || original.chart,
        chartType: enhanced.chartType || original.chartType,
        icon: enhanced.icon || original.icon,
        notes: enhanced.notes || original.notes,
      };
    });
  } catch {
    return slides;
  }
}

// ============================================================
// STEP 5 — Final quality check
// ============================================================

export function finalQualityCheck(slides: Slide[], analysis: ExtendedAnalysis): Slide[] {
  if (slides.length === 0) return slides;

  // 1. Ensure first slide is title
  if (slides[0].type !== "title") {
    slides[0].type = "title";
  }
  if (!slides[0].heading) {
    slides[0].heading = analysis.suggestedTitle;
  }

  // 2. Ensure last slide is closing
  if (slides.length > 1) {
    slides[slides.length - 1].type = "closing";
    if (!slides[slides.length - 1].heading) {
      slides[slides.length - 1].heading = "Thank You";
    }
  }

  // 3. Limit and clean bullets
  for (const slide of slides) {
    if (slide.bullets) {
      // Max 5 bullets
      if (slide.bullets.length > 5) {
        slide.bullets = slide.bullets.slice(0, 5);
      }
      // Max 10 words per bullet, clean up
      slide.bullets = slide.bullets.map((b) => {
        let cleaned = b.trim();
        // Remove trailing periods from bullets
        if (cleaned.endsWith(".") && cleaned.length > 10) {
          cleaned = cleaned.slice(0, -1);
        }
        // Enforce word limit
        const words = cleaned.split(/\s+/);
        if (words.length > 10) {
          cleaned = words.slice(0, 10).join(" ") + "…";
        }
        return cleaned;
      });
      // Remove empty bullets
      slide.bullets = slide.bullets.filter((b) => b.length > 0);
    }

    // Limit column content
    if (slide.leftCol && slide.leftCol.length > 5) {
      slide.leftCol = slide.leftCol.slice(0, 5);
    }
    if (slide.rightCol && slide.rightCol.length > 5) {
      slide.rightCol = slide.rightCol.slice(0, 5);
    }
  }

  // 4. Remove duplicate headings
  const headings = new Set<string>();
  for (const slide of slides) {
    if (headings.has(slide.heading)) {
      slide.heading = slide.heading + " (cont.)";
    }
    headings.add(slide.heading);
  }

  // 5. Remove near-duplicate bullets across slides
  const allBullets = new Set<string>();
  for (const slide of slides) {
    if (slide.bullets) {
      slide.bullets = slide.bullets.filter((b) => {
        const normalized = b.toLowerCase().trim();
        if (allBullets.has(normalized)) return false;
        allBullets.add(normalized);
        return true;
      });
    }
  }

  // 6. Ensure no two consecutive special-type slides
  const specialTypes = new Set(["quote", "statistic", "chart", "timeline", "process", "divider"]);
  for (let i = 1; i < slides.length; i++) {
    if (
      slides[i].type === slides[i - 1].type &&
      specialTypes.has(slides[i].type)
    ) {
      slides[i].type = "content";
    }
  }

  // 7. Ensure every slide has speaker notes
  for (const slide of slides) {
    if (!slide.notes || slide.notes.trim().length < 5) {
      slide.notes = generateDefaultNote(slide, analysis);
    }
  }

  // 8. Ensure agenda slide (slide 1) has content
  if (slides.length > 1 && slides[1].type === "content") {
    if (!slides[1].bullets || slides[1].bullets.length === 0) {
      slides[1].bullets = analysis.outline.slice(0, 5).length > 0
        ? analysis.outline.slice(0, 5)
        : ["Introduction", "Key Topics", "Analysis", "Recommendations", "Next Steps"];
    }
    if (!slides[1].heading || slides[1].heading === "New Slide") {
      slides[1].heading = "Agenda";
    }
  }

  // 9. Ensure summary slide exists (second to last)
  if (slides.length > 4) {
    const summaryIndex = slides.length - 2;
    if (slides[summaryIndex].type !== "summary") {
      // Check if any slide is a summary
      const hasSummary = slides.some((s) => s.type === "summary");
      if (!hasSummary) {
        slides[summaryIndex].type = "summary";
        slides[summaryIndex].heading = "Key Takeaways";
        slides[summaryIndex].bullets = analysis.outline.slice(0, 4).map(
          (item) => `Key insight: ${item}`
        );
      }
    }
  }

  // 10. Clean up closing slide
  const lastSlide = slides[slides.length - 1];
  if (lastSlide.type === "closing") {
    if (!lastSlide.bullets || lastSlide.bullets.length === 0) {
      lastSlide.bullets = ["Questions?", "Let's discuss next steps"];
    }
  }

  return slides;
}

function generateDefaultNote(slide: Slide, analysis: ExtendedAnalysis): string {
  switch (slide.type) {
    case "title":
      return `Welcome the audience and introduce "${slide.heading}". Set the tone for the presentation.`;
    case "closing":
      return "Thank the audience for their attention. Open the floor for questions and discussion.";
    case "quote":
      return `Share this quote and explain its relevance to ${analysis.suggestedTitle}.`;
    case "statistic":
      return "Present these key metrics and explain what they mean for the audience.";
    case "divider":
      return `Transition to the next section: ${slide.heading}.`;
    case "summary":
      return "Summarize the key takeaways. Emphasize what the audience should remember.";
    default:
      return `Explain the key points about ${slide.heading.toLowerCase()}. Connect to the overall message.`;
  }
}

// ============================================================
// Generate speaker notes (standalone)
// ============================================================

export async function generateSpeakerNotes(
  slides: Slide[]
): Promise<Slide[]> {
  const systemPrompt = `You are a presentation coach. Generate concise, natural speaker notes for each slide.

Return a JSON array of objects with "id" and "notes" fields.
Each note should be 1-2 conversational sentences — a brief reminder of what to say, not a script.
Include transitions between slides where appropriate.

Example: [{"id": "slide-123", "notes": "Introduce the topic and set the context. Transition: 'Now let's look at the data...'"}]

Return ONLY raw JSON array.`;

  const slideSummary = slides.map((s) => ({
    id: s.id,
    type: s.type,
    heading: s.heading,
    bullets: s.bullets?.slice(0, 3),
  }));

  const userPrompt = `Generate speaker notes for these slides:

${JSON.stringify(slideSummary, null, 2)}`;

  try {
    const raw = await callAI(systemPrompt, userPrompt);
    const notesMap = parseJSON(raw);
    const notesById = new Map<string, string>();
    for (const item of notesMap) {
      notesById.set(item.id, item.notes);
    }
    return slides.map((s) => ({
      ...s,
      notes: notesById.get(s.id) || s.notes,
    }));
  } catch {
    return slides;
  }
}

// ============================================================
// Auto-rewrite slides for style
// ============================================================

export async function rewriteSlidesStyle(
  slides: Slide[],
  style: "academic" | "business" | "casual"
): Promise<Slide[]> {
  const styleInstructions = {
    academic:
      "Rewrite using formal academic language. Use precise terminology, avoid contractions, maintain objective tone. Include citations where appropriate.",
    business:
      "Rewrite using professional business language. Be concise, action-oriented, and results-focused. Use industry-standard terminology.",
    casual:
      "Rewrite using friendly, conversational language. Use contractions, simple words, and engaging tone. Make it feel like a chat.",
  };

  const systemPrompt = `You are a presentation editor. Rewrite the following slides to match the ${style} style.

${styleInstructions[style]}

Return ONLY a JSON array of the updated slide objects with the same structure. Keep the same slide types and IDs. Only modify text content (heading, sub, bullets, quote, author, notes, etc.).

IMPORTANT: Return ONLY the raw JSON array, no markdown.`;

  const userPrompt = `Rewrite these ${slides.length} slides in ${style} style:

${JSON.stringify(slides, null, 2)}`;

  try {
    const raw = await callAI(systemPrompt, userPrompt);
    const parsed = parseJSON(raw);
    const slideArray = Array.isArray(parsed) ? parsed : parsed.slides || [];
    return slideArray.map((s: Slide, i: number) => ({
      ...slides[i],
      ...s,
      id: slides[i].id,
      type: slides[i].type,
    }));
  } catch {
    return slides;
  }
}

// ============================================================
// Legacy: generateSlides (batch mode, kept for backward compat)
// ============================================================

export async function generateSlides(
  inputText: string,
  analysis: ExtendedAnalysis,
  templateId: TemplateId,
  inputMode: string,
  onProgress?: (progress: GenerationProgress) => void,
  outline?: OutlineSection[]
): Promise<Slide[]> {
  // Delegate to per-slide generation with default plans (with visual intelligence)
  const plans = suggestVisualsForPlan(createDefaultSlidePlan(analysis), analysis);
  return generateSlidesOneByOne(inputText, analysis, templateId, inputMode, onProgress, plans);
}
