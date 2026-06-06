// ============================================================
// AI Intelligence Layer
// Analyzes input and generates optimized presentations
// ============================================================

import type {
  AIAnalysis,
  TopicCategory,
  AudienceType,
  ToneType,
  Slide,
  SlideType,
  TemplateId,
  GenerationProgress,
} from "@/types";

const MODEL = process.env.OPENROUTER_MODEL || "openrouter/owl-alpha";

async function callAI(
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
      return (
        data.choices?.[0]?.message?.content ?? ""
      );
    } catch (err) {
      if (attempt >= retries) throw err;
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw new Error("AI request failed after retries");
}

function parseJSON(raw: string): any {
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
    if (match) return JSON.parse(match[1]);
    throw new Error("Could not parse AI response");
  }
}

// ---------- Step 1: Analyze Input ----------
export async function analyzeInput(
  inputText: string,
  inputMode: string
): Promise<AIAnalysis> {
  const systemPrompt = `You are a presentation strategy expert. Analyze the given input and determine the optimal presentation parameters.

Return ONLY a JSON object:
{
  "category": "technology|business|education|science|health|marketing|finance|creative|general",
  "audience": "students|professionals|executives|general|technical|investors|customers",
  "tone": "formal|casual|academic|persuasive|inspirational|technical|conversational",
  "suggestedSlideCount": number (between 5 and 25),
  "suggestedTitle": "Compelling presentation title",
  "suggestedSubtitle": "Short subtitle",
  "outline": ["Section 1", "Section 2", ...],
  "keywords": ["keyword1", "keyword2", ...]
}

Rules:
- suggestedSlideCount: 5-8 for short topics, 8-12 for medium, 12-20 for complex
- outline should have (suggestedSlideCount - 2) items (excluding title and closing)
- keywords: 3-7 relevant keywords for icon/image suggestions
- Return ONLY raw JSON, no markdown.`;

  const userPrompt = `Input mode: ${inputMode}
Input content: "${inputText.substring(0, 3000)}"

Analyze this input and suggest optimal presentation parameters.`;

  const raw = await callAI(systemPrompt, userPrompt);
  const result = parseJSON(raw);

  return {
    category: result.category || "general",
    audience: result.audience || "general",
    tone: result.tone || "conversational",
    suggestedSlideCount: Math.min(
      Math.max(result.suggestedSlideCount || 8, 5),
      25
    ),
    suggestedTitle: result.suggestedTitle || "Presentation",
    suggestedSubtitle: result.suggestedSubtitle || "",
    outline: result.outline || [],
    keywords: result.keywords || [],
  };
}

// ---------- Step 2: Generate Slides ----------
export async function generateSlides(
  inputText: string,
  analysis: AIAnalysis,
  templateId: TemplateId,
  inputMode: string,
  onProgress?: (progress: GenerationProgress) => void
): Promise<Slide[]> {
  const slideCount = analysis.suggestedSlideCount;

  onProgress?.({
    step: "generating",
    message: `Generating ${slideCount} slides...`,
    progress: 30,
    totalSlides: slideCount,
  });

  const templateDescriptions: Record<TemplateId, string> = {
    corporate: "professional blue tones, clean sans-serif, structured layout",
    academic: "formal serif fonts, muted colors, citation-friendly",
    startup: "bold gradients, high contrast, energetic feel",
    minimal: "lots of whitespace, restrained typography, understated",
    dark: "dark backgrounds, neon accents, modern tech feel",
    seminar: "friendly rounded design, green tones, approachable",
    marketing: "vibrant warm colors, bold typography, eye-catching",
    research: "data-focused, blue tones, structured and precise",
    education: "purple tones, playful but clear, student-friendly",
    portfolio: "creative pink/coral palette, elegant serif headings",
  };

  const toneInstructions: Record<ToneType, string> = {
    formal: "Use professional, precise language. Avoid contractions and slang.",
    casual: "Use conversational, friendly language. Contractions are fine.",
    academic: "Use scholarly language. Include references where appropriate.",
    persuasive: "Use compelling, action-oriented language. Include calls to action.",
    inspirational: "Use uplifting, motivational language. Tell stories.",
    technical: "Use precise technical terminology. Be specific and detailed.",
    conversational: "Write as if speaking to the audience. Use 'you' and 'we'.",
  };

  const systemPrompt = `You are an expert presentation designer. Create a complete, high-quality presentation.

Return ONLY a JSON array of slide objects. Each slide must have:
- "type": one of "title", "content", "two-column", "closing", "quote", "comparison", "timeline", "process", "statistic", "chart", "divider", "summary", "qa"
- "heading": string (slide title)
- "sub": string (subtitle, optional)
- "bullets": string[] (3-6 concise bullets, max 12 words each)
- "leftCol": string[] (for two-column/comparison slides)
- "rightCol": string[] (for two-column/comparison slides)
- "quote": string (for quote slides)
- "author": string (for quote slides)
- "stats": [{"label": string, "value": string}] (for statistic slides, 2-4 items)
- "timeline": [{"label": string, "description": string}] (for timeline slides, 3-5 items)
- "process": [{"step": number, "title": string, "description": string}] (for process slides, 3-5 items)
- "chart": [{"label": string, "value": number}] (for chart slides, 3-6 items)
- "chartType": "bar"|"pie"|"line" (for chart slides)
- "icon": string (emoji icon for the slide, optional)
- "notes": string (speaker notes, 1-2 sentences)

QUALITY RULES:
- First slide MUST be type "title"
- Last slide MUST be type "closing"
- Include at least one "quote", one "statistic" or "chart", and one "timeline" or "process" slide
- Include a "summary" or "qa" slide before the closing
- Use "divider" slides between major sections (every 4-5 slides)
- Keep bullets concise — max 12 words each, 3-6 per slide
- Avoid repeating content across slides
- Ensure logical flow: intro → problem → solution → evidence → conclusion
- Use the tone: ${toneInstructions[analysis.tone]}
- Design style: ${templateDescriptions[templateId] || templateDescriptions.corporate}
- For "closing" slides: include 2-3 action items or next steps
- For "summary" slides: list 3-5 key takeaways
- For "qa" slides: suggest 2-3 likely questions

IMPORTANT: Return ONLY the raw JSON array, no markdown, no explanation.`;

  const userPrompt = `Create a ${slideCount}-slide presentation.

Topic: "${analysis.suggestedTitle}"
Subtitle: "${analysis.suggestedSubtitle}"
Category: ${analysis.category}
Audience: ${analysis.audience}
Tone: ${analysis.tone}
Keywords: ${analysis.keywords.join(", ")}

Outline to follow:
${analysis.outline.map((item, i) => `${i + 1}. ${item}`).join("\n")}

Input mode: ${inputMode}
Original input (for reference): "${inputText.substring(0, 2000)}"

Generate diverse, high-quality slides. Make it feel like a real presentation a human would create.`;

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
    // Fallback: generate basic slides
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

// ---------- Quality Assurance ----------
function ensureQuality(slides: Slide[], analysis: AIAnalysis): Slide[] {
  // Ensure first slide is title
  if (slides.length > 0 && slides[0].type !== "title") {
    slides[0].type = "title";
  }

  // Ensure last slide is closing
  if (slides.length > 1) {
    slides[slides.length - 1].type = "closing";
    if (!slides[slides.length - 1].heading) {
      slides[slides.length - 1].heading = "Thank You";
    }
  }

  // Limit bullets per slide
  for (const slide of slides) {
    if (slide.bullets && slide.bullets.length > 6) {
      slide.bullets = slide.bullets.slice(0, 6);
    }
    // Truncate long bullets
    if (slide.bullets) {
      slide.bullets = slide.bullets.map((b) =>
        b.length > 80 ? b.substring(0, 77) + "..." : b
      );
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

  return slides;
}

// ---------- Fallback ----------
function generateFallbackSlides(
  analysis: AIAnalysis,
  count: number
): Slide[] {
  const slides: Slide[] = [
    {
      id: `slide-${Date.now()}-0`,
      type: "title",
      heading: analysis.suggestedTitle,
      sub: analysis.suggestedSubtitle,
    },
  ];

  for (let i = 1; i < count - 1; i++) {
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
    id: `slide-${Date.now()}-${count - 1}`,
    type: "closing",
    heading: "Thank You",
    sub: analysis.suggestedTitle,
    bullets: ["Questions?", "Let's connect"],
  });

  return slides;
}

// ---------- Auto-rewrite slides for style ----------
export async function rewriteSlidesStyle(
  slides: Slide[],
  style: "academic" | "business" | "casual"
): Promise<Slide[]> {
  const styleInstructions = {
    academic:
      "Rewrite using formal academic language. Use precise terminology, avoid contractions, maintain objective tone.",
    business:
      "Rewrite using professional business language. Be concise, action-oriented, and results-focused.",
    casual:
      "Rewrite using friendly, conversational language. Use contractions, simple words, and engaging tone.",
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
      ...slides[i], // preserve original structure
      ...s, // override with rewritten text
      id: slides[i].id, // keep original ID
      type: slides[i].type, // keep original type
    }));
  } catch {
    return slides; // Return original on failure
  }
}

// ---------- Generate speaker notes ----------
export async function generateSpeakerNotes(
  slides: Slide[]
): Promise<Slide[]> {
  const systemPrompt = `You are a presentation coach. Generate concise speaker notes for each slide.

Return a JSON array of objects with "id" and "notes" fields.
Each note should be 1-2 sentences — a brief reminder of what to say, not a script.

Example: [{"id": "slide-123", "notes": "Introduce the topic and set the context for the audience."}]

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
