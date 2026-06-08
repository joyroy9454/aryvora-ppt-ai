// ============================================================
// AI Intelligence Layer — Phase 3: Category-Aware Design System
// Per-slide generation, content enhancement, quality assurance
// Visual metadata: image suggestions, visual types per topic
// Category-specific design profiles, tone, and style rules
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
import { TEMPLATE_DESCRIPTIONS, TONE_INSTRUCTIONS } from "./constants";

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

// ---------- JSON parser with code-fallback ----------

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
  purpose: "inform" | "persuade" | "educate" | "pitch" | "report" | "inspire" | "motivate";
  suggestedTemplate: TemplateId;
  /** The specific presentation category detected (e.g. "startup", "academic", "sales") */
  presentationCategory: TopicCategory;
}

// ============================================================
// Category Design Profiles — Phase 3
// ============================================================

/**
 * Complete design profile for a presentation category.
 * Defines tone, template, visual strategy, content rules, and structure rules.
 */
export interface CategoryDesignProfile {
  category: TopicCategory;
  tone: ToneType;
  template: TemplateId;
  visualStrategy: "minimal" | "clean" | "bold" | "visual" | "structured" | "diagram-friendly";
  maxWordsPerBullet: number;
  maxBulletsPerSlide: number;
  headingStyle: "formal" | "engaging" | "technical" | "simple";
  imageFrequency: "none" | "selective" | "frequent";
  chartFrequency: "none" | "selective" | "frequent";
  diagramFrequency: "none" | "selective" | "frequent";
  contentGuidelines: string;
  slideStructureRules: string;
}

/**
 * Returns the complete design profile for a given presentation category.
 * This is the single source of truth for category-specific design rules.
 */
export function getCategoryDesignProfile(category: TopicCategory): CategoryDesignProfile {
  const profiles: Record<TopicCategory, CategoryDesignProfile> = {
    academic: {
      category: "academic",
      tone: "academic",
      template: "academic",
      visualStrategy: "minimal",
      maxWordsPerBullet: 12,
      maxBulletsPerSlide: 5,
      headingStyle: "formal",
      imageFrequency: "none",
      chartFrequency: "none",
      diagramFrequency: "selective",
      contentGuidelines:
        "Use formal academic language. Cite sources where appropriate. Avoid contractions. Be precise and objective. Prioritize evidence over opinion. Use precise terminology. Each bullet should convey a complete thought — up to 12 words is acceptable for academic depth.",
      slideStructureRules:
        "Follow a logical academic structure: Introduction → Literature Context → Methodology → Findings → Discussion → Conclusion. Use section dividers between major parts. Include a references slide if citing sources. Keep slides text-dense but well-organized. Avoid decorative elements.",
    },
    student: {
      category: "student",
      tone: "conversational",
      template: "education",
      visualStrategy: "clean",
      maxWordsPerBullet: 10,
      maxBulletsPerSlide: 5,
      headingStyle: "engaging",
      imageFrequency: "selective",
      chartFrequency: "selective",
      diagramFrequency: "selective",
      contentGuidelines:
        "Use clear, accessible language. Explain concepts thoroughly but simply. Use relatable examples. Keep bullets to 10 words max. Use active voice. Include diagrams to illustrate complex ideas. Make it engaging but educational.",
      slideStructureRules:
        "Start with learning objectives. Use a clear agenda. Break content into digestible sections with dividers. Include a summary/recap slide. End with discussion questions or next steps. Use visuals to break up text-heavy sections.",
    },
    business: {
      category: "business",
      tone: "formal",
      template: "corporate",
      visualStrategy: "structured",
      maxWordsPerBullet: 8,
      maxBulletsPerSlide: 4,
      headingStyle: "formal",
      imageFrequency: "selective",
      chartFrequency: "frequent",
      diagramFrequency: "selective",
      contentGuidelines:
        "Be concise and results-focused. Lead with key metrics. Use industry-standard terminology. Keep bullets to 8 words max. Focus on business impact and ROI. Use data to support every claim. Avoid jargon unless the audience expects it.",
      slideStructureRules:
        "Open with executive summary. Use data-driven slides with charts. Include a market/competitive analysis section. End with clear recommendations and next steps. Use section dividers for major topic shifts. Keep the flow: Problem → Analysis → Solution → Impact.",
    },
    corporate: {
      category: "corporate",
      tone: "formal",
      template: "corporate",
      visualStrategy: "structured",
      maxWordsPerBullet: 8,
      maxBulletsPerSlide: 4,
      headingStyle: "formal",
      imageFrequency: "selective",
      chartFrequency: "selective",
      diagramFrequency: "selective",
      contentGuidelines:
        "Use professional, polished language. Maintain brand-appropriate tone. Be concise — 8 words per bullet max. Focus on strategic priorities and outcomes. Use formal headings. Avoid colloquialisms. Every slide should serve a clear business purpose.",
      slideStructureRules:
        "Follow corporate deck conventions: Title → Agenda → Executive Summary → Key Sections → Financials/Metrics → Recommendations → Next Steps → Closing. Use minimal but strategic visuals. Maintain consistent, clean layout throughout.",
    },
    startup: {
      category: "startup",
      tone: "persuasive",
      template: "startup",
      visualStrategy: "bold",
      maxWordsPerBullet: 6,
      maxBulletsPerSlide: 4,
      headingStyle: "engaging",
      imageFrequency: "selective",
      chartFrequency: "selective",
      diagramFrequency: "selective",
      contentGuidelines:
        "Be bold and concise. Focus on impact and vision. Use strong action verbs. Keep sentences short — 6 words per bullet max. Tell a compelling story. Highlight traction, market opportunity, and competitive advantage. Create excitement and urgency.",
      slideStructureRules:
        "Follow the startup pitch structure: Problem → Solution → Market Opportunity → Product → Traction → Business Model → Team → Ask. Use bold visuals and high-impact slides. Keep text minimal — let the story drive. End with a clear call to action.",
    },
    research: {
      category: "research",
      tone: "academic",
      template: "research",
      visualStrategy: "structured",
      maxWordsPerBullet: 12,
      maxBulletsPerSlide: 5,
      headingStyle: "technical",
      imageFrequency: "selective",
      chartFrequency: "frequent",
      diagramFrequency: "selective",
      contentGuidelines:
        "Be precise and evidence-based. Use technical terminology appropriately. Include data, statistics, and citations. Up to 12 words per bullet for methodological detail. Present findings objectively. Use charts and data visualizations extensively.",
      slideStructureRules:
        "Follow research presentation structure: Background → Research Question → Methodology → Data/Results → Analysis → Discussion → Limitations → Future Work → Conclusion. Use data-heavy slides with charts. Include methodology diagrams.",
    },
    seminar: {
      category: "seminar",
      tone: "conversational",
      template: "seminar",
      visualStrategy: "clean",
      maxWordsPerBullet: 10,
      maxBulletsPerSlide: 5,
      headingStyle: "engaging",
      imageFrequency: "selective",
      chartFrequency: "selective",
      diagramFrequency: "selective",
      contentGuidelines:
        "Be conversational and engaging. Use storytelling techniques. Keep bullets to 10 words max. Include real-world examples and case studies. Encourage interaction. Use a warm, approachable tone. Make complex topics accessible.",
      slideStructureRules:
        "Open with a hook or question. Use a clear agenda. Break content into thematic sections with dividers. Include interactive elements or discussion prompts. Use visuals to illustrate key points. End with key takeaways and Q&A.",
    },
    marketing: {
      category: "marketing",
      tone: "persuasive",
      template: "marketing",
      visualStrategy: "visual",
      maxWordsPerBullet: 8,
      maxBulletsPerSlide: 4,
      headingStyle: "engaging",
      imageFrequency: "frequent",
      chartFrequency: "selective",
      diagramFrequency: "none",
      contentGuidelines:
        "Be persuasive and energetic. Use storytelling to connect emotionally. Create urgency and excitement. Focus on benefits, not features. Keep bullets to 8 words max. Use power words and action-oriented language. Include social proof and testimonials.",
      slideStructureRules:
        "Open with a compelling hook. Use high-impact visuals on most slides. Follow the AIDA model: Attention → Interest → Desire → Action. Include customer stories or case studies. Use before/after comparisons. End with a strong call to action.",
    },
    technical: {
      category: "technical",
      tone: "technical",
      template: "dark",
      visualStrategy: "diagram-friendly",
      maxWordsPerBullet: 10,
      maxBulletsPerSlide: 5,
      headingStyle: "technical",
      imageFrequency: "selective",
      chartFrequency: "selective",
      diagramFrequency: "frequent",
      contentGuidelines:
        "Be precise and clear. Use technical terms appropriately — don't oversimplify for a technical audience. Include data, specifications, and architecture details. Up to 10 words per bullet. Use diagrams and flowcharts to explain complex systems. Be specific about technologies and implementations.",
      slideStructureRules:
        "Start with system overview or architecture diagram. Use process and diagram slides extensively. Include code snippets or technical specs where relevant. Follow logical technical flow: Overview → Architecture → Implementation → Results → Next Steps. Use dark theme for code-heavy slides.",
    },
    creative: {
      category: "creative",
      tone: "inspirational",
      template: "portfolio",
      visualStrategy: "visual",
      maxWordsPerBullet: 8,
      maxBulletsPerSlide: 4,
      headingStyle: "engaging",
      imageFrequency: "frequent",
      chartFrequency: "selective",
      diagramFrequency: "none",
      contentGuidelines:
        "Be inspirational and expressive. Let visuals tell the story. Keep text minimal — 8 words per bullet max. Use evocative, descriptive language. Focus on the creative process and outcomes. Show, don't just tell. Use high-quality imagery throughout.",
      slideStructureRules:
        "Lead with strong visual impact. Use full-bleed images and creative layouts. Follow a narrative arc: Inspiration → Process → Work → Impact. Minimize text-heavy slides. Use dividers as visual breaks. Let the portfolio pieces be the focus.",
    },
    general: {
      category: "general",
      tone: "conversational",
      template: "minimal",
      visualStrategy: "clean",
      maxWordsPerBullet: 10,
      maxBulletsPerSlide: 5,
      headingStyle: "simple",
      imageFrequency: "selective",
      chartFrequency: "selective",
      diagramFrequency: "selective",
      contentGuidelines:
        "Be clear and accessible to a broad audience. Avoid jargon. Keep bullets to 10 words max. Use simple, direct language. Balance text and visuals. Make every slide self-contained and understandable. Use a clean, uncluttered approach.",
      slideStructureRules:
        "Use a standard presentation structure: Title → Agenda → Content Sections → Summary → Closing. Vary slide types for visual interest. Use section dividers every 4-5 slides. Keep the layout clean and consistent. End with clear takeaways.",
    },
    training: {
      category: "training",
      tone: "conversational",
      template: "education",
      visualStrategy: "clean",
      maxWordsPerBullet: 10,
      maxBulletsPerSlide: 5,
      headingStyle: "simple",
      imageFrequency: "selective",
      chartFrequency: "none",
      diagramFrequency: "selective",
      contentGuidelines:
        "Be instructional and clear. Use step-by-step explanations. Keep bullets to 10 words max. Include practical examples and exercises. Use diagrams to illustrate processes. Be encouraging and supportive. Focus on skill-building and actionable knowledge.",
      slideStructureRules:
        "Start with learning objectives. Use a clear agenda. Break content into modules or lessons. Include process/diagram slides for workflows. Add practice exercises or checkpoints. End each module with a recap. Conclude with overall summary and resources.",
    },
    workshop: {
      category: "workshop",
      tone: "conversational",
      template: "seminar",
      visualStrategy: "clean",
      maxWordsPerBullet: 10,
      maxBulletsPerSlide: 5,
      headingStyle: "engaging",
      imageFrequency: "selective",
      chartFrequency: "selective",
      diagramFrequency: "selective",
      contentGuidelines:
        "Be interactive and participatory. Use questions to engage the audience. Keep bullets to 10 words max. Include activities, exercises, and group discussions. Use a warm, facilitative tone. Focus on collaboration and hands-on learning.",
      slideStructureRules:
        "Open with introductions and objectives. Alternate between content slides and activity prompts. Use dividers to mark session breaks. Include discussion questions on dedicated slides. Use visuals to support activities. End with action items and follow-up.",
    },
    sales: {
      category: "sales",
      tone: "persuasive",
      template: "marketing",
      visualStrategy: "bold",
      maxWordsPerBullet: 6,
      maxBulletsPerSlide: 4,
      headingStyle: "engaging",
      imageFrequency: "selective",
      chartFrequency: "selective",
      diagramFrequency: "none",
      contentGuidelines:
        "Be persuasive and benefit-focused. Lead with value proposition. Keep bullets to 6 words max — be punchy. Use social proof, testimonials, and case studies. Create urgency. Focus on solving the customer's problem. End with a clear next step.",
      slideStructureRules:
        "Open with the customer's pain point. Present your solution clearly. Include ROI data and testimonials. Use comparison slides to show competitive advantage. Address objections proactively. Close with pricing/offer and a strong call to action.",
    },
    proposal: {
      category: "proposal",
      tone: "formal",
      template: "corporate",
      visualStrategy: "structured",
      maxWordsPerBullet: 10,
      maxBulletsPerSlide: 4,
      headingStyle: "formal",
      imageFrequency: "selective",
      chartFrequency: "selective",
      diagramFrequency: "selective",
      contentGuidelines:
        "Be formal and thorough. Present a clear, logical argument. Keep bullets to 10 words max. Use data and evidence to support proposals. Be specific about deliverables, timelines, and costs. Maintain a professional, credible tone throughout.",
      slideStructureRules:
        "Follow proposal structure: Executive Summary → Problem Statement → Proposed Solution → Approach/Methodology → Timeline → Budget → Team Qualifications → Expected Outcomes → Next Steps. Use structured, data-driven slides. Include a clear ask on the closing slide.",
    },
    report: {
      category: "report",
      tone: "formal",
      template: "research",
      visualStrategy: "structured",
      maxWordsPerBullet: 10,
      maxBulletsPerSlide: 5,
      headingStyle: "formal",
      imageFrequency: "selective",
      chartFrequency: "frequent",
      diagramFrequency: "selective",
      contentGuidelines:
        "Be formal, precise, and data-driven. Present findings objectively. Keep bullets to 10 words max. Use charts and data visualizations extensively. Include specific numbers and metrics. Maintain a neutral, professional tone. Highlight key insights and trends.",
      slideStructureRules:
        "Follow report structure: Executive Summary → Background → Methodology → Key Findings → Detailed Analysis → Conclusions → Recommendations → Appendix. Use data-heavy slides with charts. Include trend analysis. End with actionable recommendations.",
    },
    "product-demo": {
      category: "product-demo",
      tone: "conversational",
      template: "dark",
      visualStrategy: "visual",
      maxWordsPerBullet: 8,
      maxBulletsPerSlide: 4,
      headingStyle: "engaging",
      imageFrequency: "frequent",
      chartFrequency: "none",
      diagramFrequency: "selective",
      contentGuidelines:
        "Be conversational and demo-focused. Show, don't just tell. Keep bullets to 8 words max. Use screenshots, product images, and live demos. Focus on user benefits and use cases. Be enthusiastic but credible. Include technical details only when relevant.",
      slideStructureRules:
        "Open with the problem you solve. Show the product in action with visuals. Walk through key features with screenshots. Include a use case or customer story. Show integration/architecture with diagrams. End with pricing, next steps, and call to action.",
    },
    event: {
      category: "event",
      tone: "conversational",
      template: "marketing",
      visualStrategy: "visual",
      maxWordsPerBullet: 8,
      maxBulletsPerSlide: 4,
      headingStyle: "engaging",
      imageFrequency: "frequent",
      chartFrequency: "none",
      diagramFrequency: "none",
      contentGuidelines:
        "Be energetic and engaging. Focus on what makes this event special. Keep bullets short and scannable. Highlight key speakers, agenda items, and takeaways. Use an inviting, enthusiastic tone. Make people want to attend.",
      slideStructureRules:
        "Open with event name and hook. Include date, venue, and key highlights. Show speaker lineup or agenda. Highlight what attendees will gain. End with registration call to action and contact info.",
    },
    motivational: {
      category: "motivational",
      tone: "inspirational",
      template: "dark",
      visualStrategy: "visual",
      maxWordsPerBullet: 6,
      maxBulletsPerSlide: 3,
      headingStyle: "engaging",
      imageFrequency: "frequent",
      chartFrequency: "none",
      diagramFrequency: "none",
      contentGuidelines:
        "Be inspirational and emotionally resonant. Use powerful, evocative language. Keep text minimal — let the message breathe. Use short, punchy statements. Tell stories. Paint a vision. Create emotional connection. Every word must carry weight.",
      slideStructureRules:
        "Open with a powerful hook or question. Build tension through the middle slides. Use quotes and stories for impact. Keep slides visually striking with minimal text. Build to a powerful climax. End with a clear call to action or memorable closing statement.",
    },
  };

  return profiles[category] || profiles.general;
}

/**
 * Returns specific tone instructions for a given presentation category.
 * These are injected into the AI prompt to guide content generation.
 */
export function getCategoryToneInstructions(category: TopicCategory): string {
  const instructions: Record<TopicCategory, string> = {
    academic:
      "Use formal academic language. Cite sources where appropriate. Avoid contractions. Be precise and objective. Use scholarly terminology. Maintain an authoritative but neutral tone. Reference studies, data, and established theories.",
    student:
      "Use clear, accessible language suitable for learners. Explain concepts thoroughly. Use relatable examples and analogies. Be encouraging and supportive. Avoid overly complex jargon. Make the content engaging and easy to follow.",
    business:
      "Use professional business language. Be concise and results-focused. Lead with key metrics and business impact. Use industry-standard terminology. Maintain a confident, authoritative tone. Focus on ROI, growth, and strategic value.",
    corporate:
      "Use polished, professional corporate language. Be formal and strategic. Focus on organizational goals and outcomes. Use executive-level terminology. Maintain brand-appropriate tone. Be concise and purposeful — every slide must justify its existence.",
    startup:
      "Be bold, energetic, and persuasive. Focus on vision, traction, and market opportunity. Use strong action verbs. Keep sentences short and punchy. Create excitement and urgency. Tell a compelling story. Be confident but not arrogant.",
    research:
      "Use precise, evidence-based language. Be objective and methodical. Include specific data points and statistics. Use technical terminology appropriately. Present findings without bias. Acknowledge limitations. Be thorough but clear.",
    seminar:
      "Be conversational and engaging. Use storytelling techniques. Ask rhetorical questions. Include real-world examples. Be warm and approachable. Encourage participation. Make complex topics accessible without dumbing them down.",
    marketing:
      "Be persuasive, energetic, and benefit-focused. Use storytelling to create emotional connection. Create urgency with power words. Focus on customer outcomes, not product features. Use social proof. Be bold and memorable. Include clear calls to action.",
    technical:
      "Be precise, clear, and technically accurate. Use appropriate technical terminology — don't oversimplify for a technical audience. Include specific data, specs, and implementation details. Use diagrams and flowcharts to explain complex systems. Be thorough but well-organized.",
    creative:
      "Be inspirational, expressive, and evocative. Use descriptive, vivid language. Let the visuals carry the narrative. Be passionate about the creative work. Focus on the creative process and artistic vision. Use an artistic, sophisticated tone.",
    general:
      "Be clear, accessible, and engaging for a broad audience. Avoid jargon and technical terms. Use simple, direct language. Balance information with engagement. Make every slide self-contained. Use a friendly, approachable tone.",
    training:
      "Be instructional, clear, and encouraging. Use step-by-step language. Include practical examples. Be supportive and patient. Focus on skill-building. Use action-oriented language. Include checkpoints and summaries. Make learners feel confident.",
    workshop:
      "Be interactive, participatory, and collaborative. Use questions and prompts. Be warm and facilitative. Encourage discussion and hands-on activities. Use inclusive language ('we', 'let's'). Be flexible and responsive. Focus on shared learning.",
    sales:
      "Be persuasive, confident, and benefit-focused. Lead with the customer's pain point. Use social proof and urgency. Be concise and punchy. Focus on value and ROI. Address objections proactively. End with a clear, compelling call to action.",
    proposal:
      "Be formal, thorough, and credible. Present a logical, well-structured argument. Use data and evidence. Be specific about deliverables and outcomes. Maintain a professional, trustworthy tone. Show expertise and capability. Be clear about the ask.",
    report:
      "Be formal, precise, and data-driven. Present findings objectively. Use specific numbers and metrics. Be neutral and professional. Highlight key insights and trends. Use clear, structured language. End with actionable recommendations.",
    "product-demo":
      "Be conversational, enthusiastic, and demo-focused. Show the product in action. Focus on user benefits and real use cases. Be credible — don't overpromise. Use screenshots and visuals to demonstrate. Be clear about next steps and how to get started.",
    event:
      "Be energetic, engaging, and inviting. Focus on what makes this event special and worth attending. Highlight key speakers, agenda, and takeaways. Use an enthusiastic, welcoming tone. Make people want to attend. Keep it practical with clear logistics.",
    motivational:
      "Be inspirational, emotionally resonant, and powerful. Use evocative, vivid language. Tell stories that connect. Keep text minimal and impactful. Paint a vision of what's possible. Create emotional movement. End with a clear, inspiring call to action.",
  };

  return instructions[category] || instructions.general;
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
  "presentationCategory": "academic|student|business|corporate|startup|research|seminar|marketing|technical|creative|general|training|workshop|sales|proposal|report|product-demo",
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

- Detect the PRESENTATION CATEGORY (presentationCategory field):
  * "academic" → university lectures, thesis defenses, academic conferences
  * "student" → student presentations, class projects, study groups
  * "business" → business reviews, strategy presentations, market analysis
  * "corporate" → board meetings, executive briefings, company-wide updates
  * "startup" → pitch decks, investor presentations, demo days
  * "research" → research findings, lab reports, scientific presentations
  * "seminar" → educational seminars, public lectures, knowledge sharing
  * "marketing" → marketing campaigns, brand presentations, product launches
  * "technical" → technical deep-dives, architecture reviews, engineering talks
  * "creative" → portfolio showcases, design presentations, creative pitches
  * "training" → employee training, onboarding, skill development
  * "workshop" → interactive workshops, hands-on sessions, group learning
  * "sales" → sales pitches, product demonstrations, client proposals
  * "proposal" → project proposals, grant applications, formal proposals
  * "report" → quarterly reports, annual reviews, status reports
  * "product-demo" → product demonstrations, feature walkthroughs, UX showcases
  * "general" → catch-all for anything that doesn't fit the above

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

  // Determine presentation category — use AI-detected value or fall back to mapping
  const presentationCategory: TopicCategory = result.presentationCategory || result.category || "general";

  return {
    category: result.category || "general",
    audience: result.audience || "general",
    tone: result.tone || "conversational",
    purpose: result.purpose || "inform",
    presentationCategory,
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
  // Phase 3: Use presentation category for more precise template selection
  const categoryTemplateMap: Record<string, TemplateId> = {
    academic: "academic",
    student: "education",
    business: "corporate",
    corporate: "corporate",
    startup: "startup",
    research: "research",
    seminar: "seminar",
    marketing: "marketing",
    technical: "dark",
    creative: "portfolio",
    general: "minimal",
    training: "education",
    workshop: "seminar",
    sales: "marketing",
    proposal: "corporate",
    report: "research",
    "product-demo": "dark",
    event: "marketing",
    motivational: "dark",
  };

  // If we have a specific presentation category, use it directly
  if (categoryTemplateMap[category]) {
    return categoryTemplateMap[category];
  }

  // Fallback to purpose-based selection
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
// Generate Outline (with visual intelligence + category design)
// ============================================================

export async function generateOutline(
  inputText: string,
  analysis: ExtendedAnalysis
): Promise<SlidePlan[]> {
  // Phase 3: Get category-specific design profile for structure rules
  const designProfile = getCategoryDesignProfile(analysis.presentationCategory);
  const toneInstructions = getCategoryToneInstructions(analysis.presentationCategory);

  const systemPrompt = `You are a presentation architect. Create a detailed slide-by-slide plan for a ${analysis.suggestedSlideCount}-slide presentation.

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
- Total slides must equal ${analysis.suggestedSlideCount}
- Slide 0: type "title" — the presentation title slide
- Slide 1: type "content" — Agenda/Overview (4-5 bullet points listing main sections)
- Slides 2 to ${analysis.suggestedSlideCount - 2}: content slides with varied types
- Slide ${analysis.suggestedSlideCount - 2}: type "summary" — Key Takeaways
- Slide ${analysis.suggestedSlideCount - 1}: type "closing" — Thank You / Next Steps

VARY THE SLIDE TYPES across content slides based on the category's visual strategy:
- Use "content" for standard text slides (most common)
- Use "two-column" for comparisons or pros/cons
- Use "statistic" for data-heavy slides (2-4 key metrics) — ${designProfile.chartFrequency === "frequent" ? "USE FREQUENTLY" : designProfile.chartFrequency === "selective" ? "use selectively" : "avoid unless necessary"}
- Use "quote" for impactful quotes (1 per presentation)
- Use "timeline" for chronological content
- Use "process" for step-by-step flows — ${designProfile.diagramFrequency === "frequent" ? "USE FREQUENTLY" : designProfile.diagramFrequency === "selective" ? "use selectively" : "avoid unless necessary"}
- Use "comparison" for side-by-side analysis
- Use "divider" between major sections (every 4-5 slides)
- Use "chart" for data visualization — ${designProfile.chartFrequency === "frequent" ? "USE FREQUENTLY" : designProfile.chartFrequency === "selective" ? "use selectively" : "avoid unless necessary"}

Each slide must have:
- "heading": a SPECIFIC, ENGAGING title in ${designProfile.headingStyle} style (not generic)
- "keyPoints": 2-${designProfile.maxBulletsPerSlide} key points for this slide (max ${designProfile.maxWordsPerBullet} words each)
- "notes": 1 sentence describing what the presenter should say

CRITICAL: Follow the category's content guidelines and slide structure rules above. The presentation should feel like a ${analysis.presentationCategory} presentation, not a generic one.

Return ONLY raw JSON array.`;

  const userPrompt = `Presentation: "${analysis.suggestedTitle}"
Subtitle: "${analysis.suggestedSubtitle}"
Category: ${analysis.category}
Presentation Category: ${analysis.presentationCategory}
Audience: ${analysis.audience}
Tone: ${analysis.tone}
Purpose: ${analysis.purpose}
Keywords: ${analysis.keywords.join(", ")}

Outline to expand:
${analysis.outline.map((item, i) => `${i + 1}. ${item}`).join("\n")}

Original input (for reference): "${inputText.substring(0, 2000)}"

Create a detailed slide-by-slide plan. Each slide should have a clear purpose and focus on ONE main idea. Follow the ${analysis.presentationCategory} design profile strictly.`;

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
  // Phase 4: Use the intelligent layout engine for diverse, balanced layouts
  return createBalancedSlidePlan(analysis, analysis.outline);
}

// ============================================================
// PHASE 4 — Advanced Layout Engine
// ============================================================

/**
 * Layout selection rules per category.
 * Each category has preferred layouts and frequency rules.
 */
const categoryLayoutPreferences: Record<string, {
  preferred: SlideType[];
  avoid: SlideType[];
  maxConsecutiveSameType: number;
  dataHeavy: boolean;
}> = {
  academic: { preferred: ["content", "two-column", "diagram", "quote"], avoid: ["statistic", "chart"], maxConsecutiveSameType: 2, dataHeavy: false },
  student: { preferred: ["content", "image-left", "image-right", "diagram", "qa"], avoid: ["statistic", "chart"], maxConsecutiveSameType: 2, dataHeavy: false },
  business: { preferred: ["content", "statistic", "chart", "comparison", "case-study"], avoid: ["diagram"], maxConsecutiveSameType: 2, dataHeavy: true },
  corporate: { preferred: ["content", "statistic", "chart", "comparison", "summary"], avoid: ["diagram", "qa"], maxConsecutiveSameType: 2, dataHeavy: true },
  startup: { preferred: ["content", "statistic", "comparison", "case-study", "quote"], avoid: ["diagram"], maxConsecutiveSameType: 2, dataHeavy: true },
  research: { preferred: ["content", "statistic", "chart", "diagram", "two-column"], avoid: ["quote"], maxConsecutiveSameType: 2, dataHeavy: true },
  seminar: { preferred: ["content", "image-left", "image-right", "qa", "diagram"], avoid: ["statistic", "chart"], maxConsecutiveSameType: 2, dataHeavy: false },
  marketing: { preferred: ["content", "image-left", "image-right", "case-study", "statistic", "quote"], avoid: ["diagram"], maxConsecutiveSameType: 2, dataHeavy: false },
  technical: { preferred: ["content", "diagram", "process", "two-column", "case-study"], avoid: ["quote"], maxConsecutiveSameType: 2, dataHeavy: true },
  creative: { preferred: ["content", "image-left", "image-right", "case-study", "quote"], avoid: ["statistic", "chart"], maxConsecutiveSameType: 2, dataHeavy: false },
  general: { preferred: ["content", "two-column", "image-left", "image-right", "quote"], avoid: [], maxConsecutiveSameType: 2, dataHeavy: false },
  training: { preferred: ["content", "diagram", "process", "case-study", "qa"], avoid: ["statistic"], maxConsecutiveSameType: 2, dataHeavy: false },
  workshop: { preferred: ["content", "diagram", "case-study", "qa", "image-left"], avoid: ["statistic", "chart"], maxConsecutiveSameType: 2, dataHeavy: false },
  sales: { preferred: ["content", "case-study", "statistic", "comparison", "quote"], avoid: ["diagram"], maxConsecutiveSameType: 2, dataHeavy: true },
  proposal: { preferred: ["content", "statistic", "chart", "comparison", "diagram"], avoid: ["quote"], maxConsecutiveSameType: 2, dataHeavy: true },
  report: { preferred: ["content", "statistic", "chart", "summary", "two-column"], avoid: ["quote", "qa"], maxConsecutiveSameType: 2, dataHeavy: true },
  "product-demo": { preferred: ["content", "image-left", "image-right", "case-study", "diagram"], avoid: ["statistic"], maxConsecutiveSameType: 2, dataHeavy: false },
  event: { preferred: ["content", "image-left", "image-right", "timeline", "quote"], avoid: ["statistic", "chart", "diagram"], maxConsecutiveSameType: 2, dataHeavy: false },
  motivational: { preferred: ["content", "quote", "image-left", "image-right"], avoid: ["statistic", "chart", "diagram", "process"], maxConsecutiveSameType: 2, dataHeavy: false },
};

/**
 * Intelligently selects the best layout for a slide based on:
 * - Content (heading, key points, section)
 * - Category preferences
 * - Position in the deck
 * - Previous slide types (avoid repetition)
 * - Visual balance across the deck
 */
export function selectOptimalLayout(
  index: number,
  total: number,
  heading: string,
  keyPoints: string[],
  category: TopicCategory,
  previousTypes: SlideType[],
  usedTypes: Map<SlideType, number>
): SlideType {
  const prefs = categoryLayoutPreferences[category] || categoryLayoutPreferences.general;
  const position = index / total; // 0 = start, 1 = end

  // Analyze content to determine best layout
  const contentSignals = analyzeContentSignals(heading, keyPoints);

  // Build candidate list based on content signals and category preferences
  const candidates: { type: SlideType; score: number }[] = [];

  for (const type of prefs.preferred) {
    let score = 50; // Base score

    // Content signal matching
    if (contentSignals.hasComparison && (type === "comparison" || type === "two-column")) score += 30;
    if (contentSignals.hasData && (type === "statistic" || type === "chart")) score += 30;
    if (contentSignals.hasProcess && (type === "process" || type === "timeline")) score += 30;
    if (contentSignals.hasQuote && type === "quote") score += 40;
    if (contentSignals.hasCaseStudy && type === "case-study") score += 35;
    if (contentSignals.hasVisual && (type === "image-left" || type === "image-right")) score += 20;
    if (contentSignals.hasDiagram && type === "diagram") score += 30;

    // Position-based scoring
    if (position < 0.2 && type === "content") score += 10; // Early slides: content
    if (position > 0.7 && type === "summary") score += 20; // Late slides: summary
    if (position > 0.85 && type === "qa") score += 15; // Near end: Q&A

    // Avoid overused types
    const usedCount = usedTypes.get(type) || 0;
    if (usedCount > 0) {
      score -= usedCount * 15; // Penalize overused types
    }

    // Avoid consecutive same types
    if (previousTypes.length > 0 && previousTypes[previousTypes.length - 1] === type) {
      score -= 40; // Strong penalty for consecutive same type
    }

    // Avoid types in the "avoid" list
    if (prefs.avoid.includes(type)) {
      score -= 25;
    }

    // Category-specific bonuses
    if (prefs.dataHeavy && (type === "statistic" || type === "chart")) {
      score += 10;
    }

    candidates.push({ type, score });
  }

  // Sort by score and pick the best
  candidates.sort((a, b) => b.score - a.score);

  // Add some randomness to avoid predictable patterns (top 3)
  const topCandidates = candidates.slice(0, Math.min(3, candidates.length));
  const selected = topCandidates[Math.floor(Math.random() * topCandidates.length)];

  return selected?.type || "content";
}

/**
 * Analyze content to detect signals for layout selection.
 */
function analyzeContentSignals(heading: string, keyPoints: string[]): {
  hasComparison: boolean;
  hasData: boolean;
  hasProcess: boolean;
  hasQuote: boolean;
  hasCaseStudy: boolean;
  hasVisual: boolean;
  hasDiagram: boolean;
} {
  const text = `${heading} ${keyPoints.join(" ")}`.toLowerCase();

  return {
    hasComparison: /vs\.?|versus|compare|comparison|pros?|cons?|advantages?|disadvantages?|difference|better|worse|or|alternative/i.test(text),
    hasData: /%|percent|growth|increase|decrease|revenue|profit|loss|metric|kpi|data|statistics?|numbers?|rate|ratio/i.test(text),
    hasProcess: /step|phase|stage|process|workflow|pipeline|sequence|order|first|then|next|finally|how to|guide/i.test(text),
    hasQuote: /"[^"]*"|said|according to|quote|testimonial|feedback|review/i.test(text),
    hasCaseStudy: /case study|example|success|story|client|customer|result|outcome|impact|real.world|implementation/i.test(text),
    hasVisual: /image|photo|picture|visual|show|display|illustrate|diagram|figure|screenshot/i.test(text),
    hasDiagram: /architecture|system|component|structure|flow|network|layer|module|integration|api|database|server/i.test(text),
  };
}

/**
 * Creates a visually balanced slide plan with diverse layouts.
 * This replaces the old fixed-pattern approach with intelligent layout selection.
 */
export function createBalancedSlidePlan(
  analysis: ExtendedAnalysis,
  outline: string[]
): SlidePlan[] {
  const total = analysis.suggestedSlideCount;
  const plans: SlidePlan[] = [];
  const usedTypes = new Map<SlideType, number>();
  const previousTypes: SlideType[] = [];

  // Title slide (always first)
  plans.push(makePlan(0, "title", analysis.suggestedTitle, "Title", [], `Welcome the audience and introduce "${analysis.suggestedTitle}".`, analysis.presentationCategory));
  usedTypes.set("title", 1);
  previousTypes.push("title");

  // Agenda slide (always second)
  const agendaPoints = outline.slice(0, 5).length > 0
    ? outline.slice(0, 5)
    : ["Introduction", "Key Topics", "Analysis", "Recommendations", "Next Steps"];
  plans.push(makePlan(1, "content", "Agenda", "Overview", agendaPoints, "Walk the audience through what we'll cover today.", analysis.presentationCategory));
  usedTypes.set("content", 1);
  previousTypes.push("content");

  // Content slides with intelligent layout selection
  const contentCount = total - 3; // minus title, agenda, closing
  for (let i = 0; i < contentCount; i++) {
    const sectionTitle = outline[i % outline.length] || `Key Point ${i + 1}`;
    const isLast = i === contentCount - 1;

    let type: SlideType;

    if (isLast) {
      // Second-to-last slide: summary
      type = "summary";
    } else {
      // Use layout engine to select optimal type
      const keyPoints = generateKeyPointsForSection(sectionTitle, analysis);
      type = selectOptimalLayout(
        i + 2, // index (offset by title + agenda)
        total,
        sectionTitle,
        keyPoints,
        analysis.presentationCategory,
        previousTypes,
        usedTypes
      );
    }

    const keyPoints = generateKeyPointsForSection(sectionTitle, analysis, type);
    const notes = generateNotesForType(type, sectionTitle, analysis);

    plans.push(makePlan(i + 2, type, sectionTitle, sectionTitle, keyPoints, notes, analysis.presentationCategory));

    usedTypes.set(type, (usedTypes.get(type) || 0) + 1);
    previousTypes.push(type);
  }

  // Closing slide (always last)
  plans.push(makePlan(total - 1, "closing", "Thank You", "Closing", ["Questions?", "Let's discuss next steps"], "Thank the audience and open the floor for questions.", analysis.presentationCategory));

  return plans;
}

function makePlan(
  index: number,
  type: SlideType,
  heading: string,
  sectionTitle: string,
  keyPoints: string[],
  notes: string,
  category: TopicCategory
): SlidePlan {
  const plan: SlidePlan = {
    index,
    type,
    heading,
    sectionTitle,
    keyPoints,
    notes,
    needsImage: false,
    imageKeyword: "",
    imagePosition: "none",
    visualType: "none",
    visualCaption: "",
  };

  // Set visual properties based on type
  switch (type) {
    case "title":
      plan.needsImage = false;
      plan.visualType = "none";
      break;
    case "statistic":
      plan.keyPoints = ["85% improvement", "+42% growth", "1.2M users"];
      plan.notes = "Present the key metrics and what they mean.";
      plan.visualType = "chart";
      plan.visualCaption = `Data visualization for: ${heading}`;
      break;
    case "chart":
      plan.keyPoints = ["Category A: 45%", "Category B: 30%", "Category C: 25%"];
      plan.notes = "Explain the key insight from this data.";
      plan.visualType = "chart";
      plan.visualCaption = `Chart: ${heading}`;
      break;
    case "quote":
      plan.keyPoints = [];
      plan.notes = "Share this impactful quote and explain its relevance.";
      plan.visualType = "icon";
      break;
    case "comparison":
      plan.keyPoints = ["Option A benefits", "Option A drawbacks"];
      plan.notes = "Walk through the comparison and recommend the best option.";
      plan.visualType = "icon";
      break;
    case "two-column":
      plan.keyPoints = ["Left column point 1", "Left column point 2"];
      plan.notes = "Explain both sides of the comparison.";
      plan.visualType = "icon";
      break;
    case "timeline":
      plan.keyPoints = ["Phase 1: Planning", "Phase 2: Development", "Phase 3: Launch"];
      plan.notes = "Walk through the timeline and key milestones.";
      plan.visualType = "diagram";
      break;
    case "process":
      plan.keyPoints = ["Step 1: Define", "Step 2: Design", "Step 3: Implement"];
      plan.notes = "Explain each step of the process.";
      plan.visualType = "diagram";
      break;
    case "divider":
      plan.keyPoints = [];
      plan.notes = `Transition to the next section: ${heading}.`;
      plan.needsImage = true;
      plan.imagePosition = "background";
      plan.visualType = "image";
      break;
    case "summary":
      plan.heading = "Key Takeaways";
      plan.keyPoints = ["Key insight 1", "Key insight 2", "Key insight 3", "Key insight 4"];
      plan.notes = "Summarize the key takeaways from the presentation.";
      plan.visualType = "icon";
      break;
    case "qa":
      plan.keyPoints = ["What questions do you have?", "Let's discuss the next steps"];
      plan.notes = "Invite questions from the audience.";
      plan.visualType = "icon";
      break;
    case "case-study":
      plan.keyPoints = ["The challenge", "The solution", "The results"];
      plan.notes = "Walk through this real-world example and its outcomes.";
      plan.visualType = "image";
      plan.needsImage = true;
      plan.imagePosition = "right";
      break;
    case "diagram":
      plan.keyPoints = ["Component A connects to B", "Data flows through C", "Output goes to D"];
      plan.notes = "Explain the diagram and how the components interact.";
      plan.visualType = "diagram";
      break;
    case "closing":
      plan.keyPoints = ["Questions?", "Let's discuss next steps"];
      plan.notes = "Thank the audience and open the floor for questions.";
      plan.visualType = "none";
      break;
    default: // content
      plan.keyPoints = [`Key insight about ${heading.toLowerCase()}`, `Supporting evidence or example`, `Actionable takeaway`];
      plan.notes = `Explain the key points about ${heading.toLowerCase()}.`;
      plan.visualType = "icon";
      break;
  }

  return plan;
}

function generateKeyPointsForSection(sectionTitle: string, analysis: ExtendedAnalysis, type?: SlideType): string[] {
  if (type === "statistic") return ["85% improvement", "+42% growth", "1.2M users"];
  if (type === "quote") return [];
  if (type === "divider") return [];
  if (type === "summary") return ["Key insight 1", "Key insight 2", "Key insight 3"];
  if (type === "case-study") return ["The challenge", "The solution", "The results"];
  if (type === "diagram") return ["Component A", "Component B", "Component C"];
  if (type === "comparison") return ["Option A benefits", "Option A drawbacks"];
  if (type === "timeline") return ["Phase 1", "Phase 2", "Phase 3"];
  if (type === "process") return ["Step 1", "Step 2", "Step 3"];
  if (type === "qa") return ["What questions do you have?"];
  return [`Key insight about ${sectionTitle.toLowerCase()}`, `Supporting evidence`, `Actionable takeaway`];
}

function generateNotesForType(type: SlideType, heading: string, analysis: ExtendedAnalysis): string {
  switch (type) {
    case "title": return `Welcome the audience and introduce "${heading}".`;
    case "statistic": return "Present the key metrics and what they mean.";
    case "chart": return "Explain the key insight from this data.";
    case "quote": return "Share this impactful quote and explain its relevance.";
    case "comparison": return "Walk through the comparison and recommend the best option.";
    case "timeline": return "Walk through the timeline and key milestones.";
    case "process": return "Explain each step of the process.";
    case "divider": return `Transition to the next section: ${heading}.`;
    case "summary": return "Summarize the key takeaways from the presentation.";
    case "qa": return "Invite questions from the audience.";
    case "case-study": return "Walk through this real-world example and its outcomes.";
    case "diagram": return "Explain the diagram and how the components interact.";
    case "closing": return "Thank the audience and open the floor for questions.";
    default: return `Explain the key points about ${heading.toLowerCase()}.`;
  }
}

// ============================================================
// STEP 3 — Generate slides ONE BY ONE
// ============================================================

/**
 * Generate a single slide with full context.
 * This is the core of per-slide generation — each slide gets its own AI call
 * with full awareness of the presentation flow.
 * Phase 2: Includes visual context when the slide needs an image.
 * Phase 3: Includes category-specific design rules and tone instructions.
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

  // Phase 3: Get category-specific design profile and tone instructions
  const designProfile = getCategoryDesignProfile(analysis.presentationCategory);
  const categoryTone = getCategoryToneInstructions(analysis.presentationCategory);

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
CATEGORY: ${analysis.presentationCategory.toUpperCase()}
═══════════════════════════════════════

CONTENT GUIDELINES:
${designProfile.contentGuidelines}

TONE INSTRUCTIONS:
${categoryTone}

VISUAL STRATEGY: ${designProfile.visualStrategy}
HEADING STYLE: ${designProfile.headingStyle}

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

TONE: ${TONE_INSTRUCTIONS[analysis.tone] || TONE_INSTRUCTIONS.conversational}
AUDIENCE: ${analysis.audience} — adjust complexity and jargon accordingly
PURPOSE: ${analysis.purpose} — this slide must serve this goal
DESIGN STYLE: ${TEMPLATE_DESCRIPTIONS[effectiveTemplate] || TEMPLATE_DESCRIPTIONS.corporate}

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
Presentation Category: ${analysis.presentationCategory}
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
    default:
      return `Standard slide requirements:
- "heading": Specific, engaging title
- "bullets": 3-5 concise bullets
- "icon": A relevant emoji
- "notes": 1-2 conversational sentences`;
  }
}

export function createSlideFromPlan(plan: SlidePlan, analysis: ExtendedAnalysis): Slide {
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
    case "case-study":
      slide.bullets = plan.keyPoints;
      slide.imageUrl = getPicsumUrl(analysis.keywords[0] || analysis.category);
      break;
    case "diagram":
      slide.bullets = plan.keyPoints;
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
    "case-study": "📋",
    diagram: "🔀",
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

  // Phase 3: Get category-specific limits
  const designProfile = getCategoryDesignProfile(analysis.presentationCategory);
  const maxBullets = designProfile.maxBulletsPerSlide;
  const maxWords = designProfile.maxWordsPerBullet;

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

  // 3. Limit and clean bullets using category-specific limits
  for (const slide of slides) {
    if (slide.bullets) {
      // Max bullets per category profile
      if (slide.bullets.length > maxBullets) {
        slide.bullets = slide.bullets.slice(0, maxBullets);
      }
      // Max words per bullet per category profile, clean up
      slide.bullets = slide.bullets.map((b) => {
        let cleaned = b.trim();
        // Remove trailing periods from bullets
        if (cleaned.endsWith(".") && cleaned.length > 10) {
          cleaned = cleaned.slice(0, -1);
        }
        // Enforce word limit
        const words = cleaned.split(/\s+/);
        if (words.length > maxWords) {
          cleaned = words.slice(0, maxWords).join(" ") + "…";
        }
        return cleaned;
      });
      // Remove empty bullets
      slide.bullets = slide.bullets.filter((b) => b.length > 0);
    }

    // Limit column content
    if (slide.leftCol && slide.leftCol.length > maxBullets) {
      slide.leftCol = slide.leftCol.slice(0, maxBullets);
    }
    if (slide.rightCol && slide.rightCol.length > maxBullets) {
      slide.rightCol = slide.rightCol.slice(0, maxBullets);
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

// ============================================================
// Image URL helpers (used by createSlideFromPlan and attachImagesToSlides)
// ============================================================

function getPicsumUrl(keyword: string, width = 800, height = 600): string {
  const seed = encodeURIComponent(keyword.toLowerCase().replace(/\s+/g, "-"));
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}

function getUnsplashUrl(keyword: string, width = 800, height = 600): string {
  const query = encodeURIComponent(keyword.toLowerCase().trim());
  return `https://source.unsplash.com/${width}x${height}/?${query}`;
}

// ============================================================
// Fallback slide generation (used when AI pipeline fails)
// ============================================================

export function generateFallbackSlides(analysis: ExtendedAnalysis): Slide[] {
  const total = analysis.suggestedSlideCount;
  const slides: Slide[] = [];

  slides.push({
    id: `slide-${Date.now()}-0`,
    type: "title",
    heading: analysis.suggestedTitle,
    sub: analysis.suggestedSubtitle,
    icon: "📊",
    notes: `Welcome the audience and introduce "${analysis.suggestedTitle}".`,
  });

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
