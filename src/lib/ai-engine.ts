// ============================================================
// AI Intelligence Layer — Advanced Generation Engine
// Analyzes input, generates outlines, creates optimized
// presentations, and enhances content quality.
// ============================================================

import type {
  AIAnalysis,
  Slide,
  SlideType,
  TemplateId,
  GenerationProgress,
  TopicCategory,
  AudienceType,
  ToneType,
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
// STEP 1 — Analyze Input (smarter)
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
  // Purpose-based selection (highest priority)
  if (purpose === "pitch") return "startup";
  if (purpose === "inspire") return "dark";

  // Category + audience matrix
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
    "science:academic": "academic",
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

  // Category fallbacks
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
    // Fallback: truncate with ellipsis at a sentence boundary
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

export async function generateOutline(
  inputText: string,
  analysis: ExtendedAnalysis
): Promise<OutlineSection[]> {
  const systemPrompt = `You are a presentation architect. Create a detailed slide-by-slide outline for a ${analysis.suggestedSlideCount}-slide presentation.

Return ONLY a JSON array of section objects:
[
  {
    "title": "Section name",
    "slideCount": number,
    "keyPoints": ["point 1", "point 2"],
    "suggestedSlideTypes": ["content", "two-column", "statistic", ...]
  }
]

RULES:
- First section should be the "Introduction/Agenda" (1-2 slides)
- Last section should be the "Conclusion/Next Steps" (1-2 slides)
- Middle sections should cover the main content
- Each section should have 2-5 slides
- suggestedSlideTypes should vary — don't use "content" for every slide
- Available types: title, content, two-column, closing, quote, comparison, timeline, process, statistic, chart, divider, summary, qa
- Total slides across all sections must equal ${analysis.suggestedSlideCount}

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

Create a detailed section-by-section outline with slide type recommendations.`;

  try {
    const raw = await callAI(systemPrompt, userPrompt);
    const result = parseJSON(raw);
    return Array.isArray(result) ? result : result.sections || [];
  } catch {
    // Fallback: create a simple outline from the analysis
    return analysis.outline.map((item, i) => ({
      title: item,
      slideCount: 1,
      keyPoints: [`Key point about ${item}`],
      suggestedSlideTypes: i === 0
        ? ["content"]
        : ["content"] as SlideType[],
    }));
  }
}

// ============================================================
// STEP 3 — Generate slides (significantly improved)
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

export async function generateSlides(
  inputText: string,
  analysis: ExtendedAnalysis,
  templateId: TemplateId,
  inputMode: string,
  onProgress?: (progress: GenerationProgress) => void,
  outline?: OutlineSection[]
): Promise<Slide[]> {
  const slideCount = analysis.suggestedSlideCount;
  const effectiveTemplate = analysis.suggestedTemplate || templateId;

  onProgress?.({
    step: "generating",
    message: `Generating ${slideCount} slides...`,
    progress: 30,
    totalSlides: slideCount,
  });

  const outlineText = outline
    ? outline
        .map(
          (sec, i) =>
            `Section ${i + 1}: ${sec.title} (${sec.slideCount} slides)\n` +
            `  Slide types: ${sec.suggestedSlideTypes.join(", ")}\n` +
            `  Key points: ${sec.keyPoints.join("; ")}`
        )
        .join("\n\n")
    : analysis.outline.map((item, i) => `${i + 1}. ${item}`).join("\n");

  const systemPrompt = `You are an elite presentation designer who has created decks for TED talks, Fortune 500 boardrooms, Y Combinator pitches, and academic conferences. Your presentations are known for their clarity, impact, and visual storytelling.

Create a complete, publication-quality ${slideCount}-slide presentation.

═══════════════════════════════════════
SLIDE STRUCTURE
═══════════════════════════════════════

Return a JSON array of slide objects. Each slide MUST have:
- "type": "title" | "content" | "two-column" | "closing" | "quote" | "comparison" | "timeline" | "process" | "statistic" | "chart" | "divider" | "summary" | "qa"
- "heading": string (slide title — make it compelling, not generic)
- "sub": string (subtitle, optional)
- "bullets": string[] (3-5 concise bullets for content slides)
- "leftCol": string[] (for two-column/comparison slides)
- "rightCol": string[] (for two-column/comparison slides)
- "quote": string (for quote slides — must be a real or plausible quote)
- "author": string (for quote slides)
- "stats": [{"label": string, "value": string}] (for statistic slides, 2-4 items)
- "timeline": [{"label": string, "description": string}] (for timeline slides, 3-5 items)
- "process": [{"step": number, "title": string, "description": string}] (for process slides, 3-5 items)
- "chart": [{"label": string, "value": number}] (for chart slides, 3-6 items)
- "chartType": "bar" | "pie" | "line" (for chart slides)
- "icon": string (emoji icon for the slide)
- "notes": string (speaker notes — 1-2 sentences, conversational)

═══════════════════════════════════════
QUALITY RULES — FOLLOW EXACTLY
═══════════════════════════════════════

STRUCTURE:
1. Slide 1 MUST be type "title" with heading, sub, and icon
2. Slide 2 SHOULD be type "content" serving as an Agenda/Overview (4-5 bullet points)
3. Use "divider" slides between major sections (every 4-5 content slides)
4. Include at least ONE of each: "quote", "statistic" or "chart", "timeline" or "process"
5. Include a "summary" slide before the closing with 4-5 key takeaways
6. Last slide MUST be type "closing" with 2-3 action items or next steps

CONTENT QUALITY:
7. NO repetition across slides — each slide must add unique value
8. Bullets must be CONCISE — max 10 words each, 3-5 per slide
9. Headings must be SPECIFIC and ENGAGING — never generic like "Overview" or "Introduction"
10. Use human-like language — vary sentence length, use active voice, be specific
11. Include real-world examples, data points, or concrete details where possible
12. Ensure logical flow: hook → context → problem → solution → evidence → action
13. Agenda slide should list the main sections (not just repeat the outline)
14. Summary slide should synthesize, not just list — use phrases like "The key takeaway is..."
15. Closing slide should have a memorable final statement + clear next steps

TONE & STYLE:
16. Tone: ${toneInstructions[analysis.tone] || toneInstructions.conversational}
17. Design style: ${templateDescriptions[effectiveTemplate] || templateDescriptions.corporate}
18. Audience: ${analysis.audience} — adjust complexity and jargon accordingly
19. Purpose: ${analysis.purpose} — every slide should serve this goal

IMPORTANT: Return ONLY the raw JSON array, no markdown, no explanation.`;

  const userPrompt = `Create a ${slideCount}-slide presentation.

TITLE: "${analysis.suggestedTitle}"
SUBTITLE: "${analysis.suggestedSubtitle}"
CATEGORY: ${analysis.category}
AUDIENCE: ${analysis.audience}
TONE: ${analysis.tone}
PURPOSE: ${analysis.purpose}
KEYWORDS: ${analysis.keywords.join(", ")}

DETAILED OUTLINE:
${outlineText}

INPUT MODE: ${inputMode}
ORIGINAL INPUT (for reference): "${inputText.substring(0, 2500)}"

Generate diverse, high-quality slides. Make it feel like a world-class presentation a skilled human would create. Every slide should earn its place.`;

  const raw = await callAI(systemPrompt, userPrompt);
  let slides: Slide[];

  try {
    const parsed = parseJSON(raw);
    const slideArray = Array.isArray(parsed) ? parsed : parsed.slides || [];
    slides = slideArray.map((s: any, i: number) => ({
      ...s,
      id: `slide-${Date.now()}-${i}`,
      type: s.type || "content",
      heading: s.heading || `Slide ${i + 1}`,
    }));
  } catch {
    slides = generateFallbackSlides(analysis, slideCount);
  }

  // Ensure minimum quality
  slides = ensureQuality(slides, analysis);

  onProgress?.({
    step: "finalizing",
    message: "Finalizing presentation...",
    progress: 90,
    totalSlides: slideCount,
  });

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
    message: "Enhancing content quality...",
    progress: 70,
    totalSlides: slides.length,
  });

  const systemPrompt = `You are a presentation quality editor. Review and enhance the following slides to make them more impactful, concise, and professional.

ENHANCEMENT RULES:
1. Remove ANY repetition across slides — each slide must have unique content
2. Improve headings to be more specific and engaging (avoid generic titles)
3. Make bullets more concise — max 10 words each, use strong action verbs
4. Ensure logical flow between slides — each slide should naturally lead to the next
5. Add variety to language — avoid starting multiple bullets with the same word
6. Make text presentation-friendly — short, punchy, memorable
7. Ensure the agenda slide accurately reflects the actual content
8. Ensure the summary slide synthesizes key insights (not just lists)
9. Add speaker notes if missing (1-2 conversational sentences per slide)
10. Preserve all slide types, IDs, and structure — only improve text content

Return ONLY a JSON array of the enhanced slide objects with the same structure and IDs.

IMPORTANT: Return ONLY the raw JSON array, no markdown.`;

  const userPrompt = `Enhance these ${slides.length} slides for a "${analysis.suggestedTitle}" presentation (${analysis.audience} audience, ${analysis.tone} tone, ${analysis.purpose} purpose):

${JSON.stringify(slides, null, 2)}

Improve quality while keeping the same structure. Make every word count.`;

  try {
    const raw = await callAI(systemPrompt, userPrompt);
    const parsed = parseJSON(raw);
    const slideArray = Array.isArray(parsed) ? parsed : parsed.slides || [];

    // Merge enhanced content with original structure to preserve IDs and types
    return slides.map((original, i) => {
      const enhanced = slideArray[i];
      if (!enhanced) return original;
      return {
        ...original,
        heading: enhanced.heading || original.heading,
        sub: enhanced.sub || original.sub,
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
    // Enhancement failed — return original slides (graceful degradation)
    return slides;
  }
}

// ============================================================
// Quality Assurance
// ============================================================

function ensureQuality(slides: Slide[], analysis: ExtendedAnalysis): Slide[] {
  if (slides.length === 0) return slides;

  // Ensure first slide is title
  if (slides[0].type !== "title") {
    slides[0].type = "title";
  }
  if (!slides[0].heading) {
    slides[0].heading = analysis.suggestedTitle;
  }

  // Ensure last slide is closing
  if (slides.length > 1) {
    slides[slides.length - 1].type = "closing";
    if (!slides[slides.length - 1].heading) {
      slides[slides.length - 1].heading = "Thank You";
    }
  }

  // Limit bullets per slide and truncate long bullets
  for (const slide of slides) {
    if (slide.bullets) {
      // Max 5 bullets per slide
      if (slide.bullets.length > 5) {
        slide.bullets = slide.bullets.slice(0, 5);
      }
      // Max 10 words per bullet
      slide.bullets = slide.bullets.map((b) => {
        const words = b.split(/\s+/);
        if (words.length > 10) {
          return words.slice(0, 10).join(" ") + "…";
        }
        return b;
      });
    }
    // Limit column content
    if (slide.leftCol && slide.leftCol.length > 5) {
      slide.leftCol = slide.leftCol.slice(0, 5);
    }
    if (slide.rightCol && slide.rightCol.length > 5) {
      slide.rightCol = slide.rightCol.slice(0, 5);
    }
  }

  // Remove duplicate headings
  const headings = new Set<string>();
  for (const slide of slides) {
    if (headings.has(slide.heading)) {
      slide.heading = slide.heading + " (cont.)";
    }
    headings.add(slide.heading);
  }

  // Ensure no two consecutive slides have the same type (except content)
  const specialTypes = new Set(["quote", "statistic", "chart", "timeline", "process", "divider"]);
  for (let i = 1; i < slides.length; i++) {
    if (
      slides[i].type === slides[i - 1].type &&
      specialTypes.has(slides[i].type)
    ) {
      // Insert a content slide or change type
      slides[i].type = "content";
    }
  }

  return slides;
}

// ============================================================
// Fallback slide generation
// ============================================================

function generateFallbackSlides(
  analysis: ExtendedAnalysis,
  count: number
): Slide[] {
  const slides: Slide[] = [
    {
      id: `slide-${Date.now()}-0`,
      type: "title",
      heading: analysis.suggestedTitle,
      sub: analysis.suggestedSubtitle,
      icon: "📊",
    },
  ];

  // Agenda slide
  if (count > 3) {
    slides.push({
      id: `slide-${Date.now()}-1`,
      type: "content",
      heading: "Agenda",
      bullets: analysis.outline.slice(0, 5).map((item) => item),
      icon: "📋",
    });
  }

  const contentSlideCount = count - slides.length - 1; // reserve last for closing
  for (let i = 0; i < contentSlideCount; i++) {
    const sectionTitle = analysis.outline[i] || `Key Point ${i + 1}`;
    const slideType: SlideType =
      i === 2 ? "statistic" : i === 4 ? "quote" : "content";

    const slide: Slide = {
      id: `slide-${Date.now()}-${slides.length}`,
      type: slideType,
      heading: sectionTitle,
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
        `Actionable takeaway for the audience`,
      ];
    }

    slides.push(slide);
  }

  // Summary slide
  if (count > 5) {
    slides.push({
      id: `slide-${Date.now()}-summary`,
      type: "summary",
      heading: "Key Takeaways",
      bullets: analysis.outline.slice(0, 4).map((item) => `Remember: ${item}`),
      icon: "✅",
    });
  }

  slides.push({
    id: `slide-${Date.now()}-${count - 1}`,
    type: "closing",
    heading: "Thank You",
    sub: analysis.suggestedTitle,
    bullets: ["Questions?", "Let's discuss next steps"],
    icon: "🙏",
  });

  return slides;
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
// Generate speaker notes
// ============================================================

export async function generateSpeakerNotes(
  slides: Slide[]
): Promise<Slide[]> {
  const systemPrompt = `You are a presentation coach. Generate concise, natural speaker notes for each slide.

Return a JSON array of objects with "id" and "notes" fields.
Each note should be 1-2 conversational sentences — a brief reminder of what to say, not a script. Include transitions between slides where appropriate.

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
