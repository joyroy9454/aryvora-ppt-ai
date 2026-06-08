// ============================================================
// Planner Agent — Presentation Strategy Analyzer
// ============================================================
// Analyzes user input to determine the optimal presentation
// strategy: category, audience, purpose, tone, template,
// slide count, outline, and research needs.
// ============================================================

import { callAI, parseJSON } from "../ai-engine";
import { TEMPLATE_DESCRIPTIONS } from "../constants";
import type { TopicCategory, AudienceType, ToneType } from "@/types";

// ---------- Extended types (extend base types from @/types) ----------

/** Extends TopicCategory — same as TopicCategory in @/types */
type PresentationCategory = TopicCategory;

/** Purpose type — not in base types */
export type PurposeType =
  | "inform"
  | "persuade"
  | "educate"
  | "pitch"
  | "report"
  | "inspire"
  | "motivate";

export type ComplexityLevel = "basic" | "intermediate" | "advanced";

export interface PlannerResult {
  category: PresentationCategory;
  audience: AudienceType;
  purpose: PurposeType;
  tone: ToneType;
  complexity: ComplexityLevel;
  suggestedSlideCount: number;
  suggestedTitle: string;
  suggestedSubtitle: string;
  suggestedTemplate: string;
  outline: string[];
  keywords: string[];
  needsResearch: boolean;
}

export interface PlannerAgent {
  analyze(inputText: string, inputMode: string): Promise<PlannerResult>;
}

// ---------- System Prompt ----------

const SYSTEM_PROMPT = `You are a world-class presentation strategist with 20+ years of experience crafting decks for Fortune 500 companies, startups, universities, and conferences.

Your job is to deeply analyze the input and determine the OPTIMAL presentation strategy.

## Available Presentation Categories
academic, student, business, corporate, startup, research, seminar, marketing, technical, creative, general, training, workshop, sales, proposal, report, product-demo, event, motivational

## Available Purposes
inform, persuade, educate, pitch, report, inspire, motivate

## Available Audiences
students, professionals, executives, general, technical, investors, customers, teachers, researchers

## Available Tones
formal, casual, academic, persuasive, inspirational, technical, conversational

## Available Templates
corporate, academic, startup, minimal, dark, seminar, marketing, research, education, portfolio

## Available Complexity Levels
basic, intermediate, advanced

## Template Descriptions
${Object.entries(TEMPLATE_DESCRIPTIONS)
  .map(([id, desc]) => `- ${id}: ${desc}`)
  .join("\n")}

## ANALYSIS RULES

### Detect Presentation Category:
- "academic" → university lectures, thesis defenses, academic conferences, scholarly talks
- "student" → student presentations, class projects, study groups, assignments
- "business" → business reviews, strategy presentations, market analysis, quarterly reviews
- "corporate" → board meetings, executive briefings, company-wide updates, all-hands
- "startup" → pitch decks, investor presentations, demo days, accelerator applications
- "research" → research findings, lab reports, scientific presentations, data analysis
- "seminar" → educational seminars, public lectures, knowledge sharing sessions
- "marketing" → marketing campaigns, brand presentations, product launches, campaign decks
- "technical" → technical deep-dives, architecture reviews, engineering talks, system design
- "creative" → portfolio showcases, design presentations, creative pitches, art/design reviews
- "training" → employee training, onboarding, skill development, workshops with exercises
- "workshop" → interactive workshops, hands-on sessions, group learning, collaborative sessions
- "sales" → sales pitches, client proposals, account reviews, revenue presentations
- "proposal" → project proposals, partnership proposals, grant applications, RFP responses
- "report" → status reports, quarterly/annual reports, performance reviews, KPI dashboards
- "product-demo" → product demonstrations, feature walkthroughs, software demos, tool showcases
- "event" → event presentations, conferences, ceremonies, award shows, town halls
- "motivational" → motivational talks, keynote speeches, team building, vision casting, pep talks
- "general" → default when no specific category fits well

### Detect Purpose:
- "pitch" → if asking for funding, selling a product/idea, startup-related, investment ask
- "persuade" → if trying to change minds, advocate for something, build support
- "educate" → if teaching, explaining concepts, academic, how-to, tutorial
- "report" → if presenting data, results, quarterly/annual review, status updates
- "inspire" → if motivational, vision-setting, keynote-style, thought leadership
- "motivate" → if focused on driving action, energizing a team, rallying support
- "inform" → default for general knowledge sharing, awareness, updates

### Detect Audience:
- "executives" → C-suite, VPs, directors, board members, senior leadership
- "investors" → VCs, angel investors, fund managers, financial backers
- "technical" → engineers, developers, architects, IT professionals, data scientists
- "students" → learners, pupils, undergrads, grad students, trainees
- "researchers" → scientists, PhD candidates, lab personnel, academic researchers
- "teachers" → educators, professors, trainers, facilitators
- "customers" → clients, buyers, end users, consumers
- "professionals" → working professionals, managers, consultants, specialists
- "general" → broad audience, mixed backgrounds, public

### Detect Complexity:
- "basic" → simple topic, introductory level, short presentation (< 10 slides), non-technical
- "intermediate" → moderate detail, some technical depth, standard business/academic content
- "advanced" → highly technical, research-level, data-heavy, complex subject matter

### Detect needsResearch (boolean):
Set to true when ANY of these apply:
- Topic involves scientific data, statistics, or research findings
- Topic mentions specific technologies, APIs, or technical specifications
- Topic refers to current events, recent trends, or market data
- Topic is data-heavy (metrics, KPIs, benchmarks, comparisons)
- Topic involves health, medical, or regulatory information
- Topic references specific studies, papers, or institutions
- Topic requires factual accuracy that may not be common knowledge

Set to false for:
- Opinion-based or experience-based content
- Simple explanatory topics from common knowledge
- Creative or storytelling presentations
- Internal team updates on known information
- Motivational or inspirational content

### Slide Count Guidelines:
- 5-8 slides: Quick overview, lightning talk, elevator pitch
- 9-12 slides: Standard presentation, meeting update, class presentation
- 13-18 slides: Detailed presentation, comprehensive topic, training session
- 19-25 slides: Deep dive, thesis defense, extensive training, conference talk

### Template Selection:
Choose based on the detected category, audience, and purpose. Match the visual tone to the content context.

IMPORTANT: Return ONLY a valid JSON object. Do not include markdown code fences.

The JSON must have this exact structure:
{
  "category": "<one of the 19 categories>",
  "audience": "<one of the 9 audiences>",
  "purpose": "<one of the 7 purposes>",
  "tone": "<one of the 7 tones>",
  "complexity": "<basic|intermediate|advanced>",
  "suggestedSlideCount": <number between 5 and 25>,
  "suggestedTitle": "A compelling, specific presentation title",
  "suggestedSubtitle": "A short descriptive subtitle",
  "suggestedTemplate": "<one of the 10 templates>",
  "outline": ["Section 1 heading", "Section 2 heading", "..."],
  "keywords": ["keyword1", "keyword2", "keyword3", ...],
  "needsResearch": <boolean>
}`;

// ---------- Factory ----------

export function createPlannerAgent(): PlannerAgent {
  return {
    async analyze(inputText: string, inputMode: string): Promise<PlannerResult> {
      const userPrompt = buildUserPrompt(inputText, inputMode);

      try {
        const raw = await callAI(SYSTEM_PROMPT, userPrompt);
        const parsed = parseJSON(raw);
        return normalizeResult(parsed);
      } catch {
        // Fallback defaults when AI call fails
        return buildFallbackResult(inputText);
      }
    },
  };
}

// ---------- Helpers ----------

function buildUserPrompt(inputText: string, inputMode: string): string {
  const modeDescriptions: Record<string, string> = {
    topic: "The user provided a presentation topic.",
    notes: "The user provided rough notes or detailed content to transform into a structured presentation.",
    bullets: "The user provided a list of bullet points to convert into slides.",
    url: "The user provided a URL. The extracted web content follows.",
    transcript: "The user provided a transcript from a video, podcast, or speech.",
    pdf: "The user provided a PDF document. The extracted text follows.",
  };

  const modeContext = modeDescriptions[inputMode] ?? "The user provided input for a presentation.";

  return `${modeContext}

Input mode: ${inputMode}

Input content:
"""
${inputText}
"""

Analyze this input and determine the optimal presentation strategy. Return ONLY a valid JSON object with the required fields.`;
}

function normalizeResult(raw: Record<string, unknown>): PlannerResult {
  const validCategories: PresentationCategory[] = [
    "academic", "student", "business", "corporate", "startup", "research",
    "seminar", "marketing", "technical", "creative", "general", "training",
    "workshop", "sales", "proposal", "report", "product-demo", "event", "motivational",
  ];
  const validPurposes: PurposeType[] = [
    "inform", "persuade", "educate", "pitch", "report", "inspire", "motivate",
  ];
  const validAudiences: AudienceType[] = [
    "students", "professionals", "executives", "general", "technical",
    "investors", "customers", "teachers", "researchers",
  ];
  const validTones: ToneType[] = [
    "formal", "casual", "academic", "persuasive", "inspirational", "technical", "conversational",
  ];
  const validTemplates = [
    "corporate", "academic", "startup", "minimal", "dark",
    "seminar", "marketing", "research", "education", "portfolio",
  ];

  const rawCategory = typeof raw.category === "string" ? raw.category : "";
  const rawPurpose = typeof raw.purpose === "string" ? raw.purpose : "";
  const rawAudience = typeof raw.audience === "string" ? raw.audience : "";
  const rawTone = typeof raw.tone === "string" ? raw.tone : "";
  const rawTemplate = typeof raw.suggestedTemplate === "string" ? raw.suggestedTemplate : "";

  return {
    category: validCategories.includes(rawCategory as PresentationCategory)
      ? (rawCategory as PresentationCategory)
      : "general",
    audience: validAudiences.includes(rawAudience as AudienceType)
      ? (rawAudience as AudienceType)
      : "general",
    purpose: validPurposes.includes(rawPurpose as PurposeType)
      ? (rawPurpose as PurposeType)
      : "inform",
    tone: validTones.includes(rawTone as ToneType)
      ? (rawTone as ToneType)
      : "conversational",
    complexity: validateComplexity(raw.complexity),
    suggestedSlideCount: clampSlideCount(raw.suggestedSlideCount),
    suggestedTitle: typeof raw.suggestedTitle === "string" && raw.suggestedTitle.trim()
      ? raw.suggestedTitle.trim()
      : "Presentation",
    suggestedSubtitle: typeof raw.suggestedSubtitle === "string"
      ? raw.suggestedSubtitle.trim()
      : "",
    suggestedTemplate: validTemplates.includes(rawTemplate)
      ? rawTemplate
      : "minimal",
    outline: Array.isArray(raw.outline)
      ? raw.outline.filter((o): o is string => typeof o === "string" && o.trim().length > 0)
      : [],
    keywords: Array.isArray(raw.keywords)
      ? raw.keywords.filter((k): k is string => typeof k === "string" && k.trim().length > 0)
      : [],
    needsResearch: typeof raw.needsResearch === "boolean" ? raw.needsResearch : fallbackNeedsResearch(raw),
  };
}

function validateComplexity(raw: unknown): ComplexityLevel {
  if (raw === "basic" || raw === "intermediate" || raw === "advanced") return raw;
  return "intermediate";
}

function clampSlideCount(raw: unknown): number {
  if (typeof raw !== "number" || Number.isNaN(raw)) return 10;
  return Math.min(25, Math.max(5, Math.round(raw)));
}

function fallbackNeedsResearch(raw: Record<string, unknown>): boolean {
  const category = typeof raw.category === "string" ? raw.category : "";
  const researchCategories: string[] = [
    "research", "technical", "academic", "report", "product-demo",
  ];
  if (researchCategories.includes(category)) return true;

  const text = JSON.stringify(raw).toLowerCase();
  const researchKeywords = [
    "data", "statistics", "study", "research", "evidence", "clinical",
    "market analysis", "benchmark", "experiment", "findings", "survey",
    "peer-reviewed", "scientific", "technical specification", "api",
    "performance metrics", "kpi", "current trends", "regulation",
  ];
  return researchKeywords.some((kw) => text.includes(kw));
}

function buildFallbackResult(inputText: string): PlannerResult {
  const text = inputText.toLowerCase().slice(0, 2000);

  // Simple heuristic-based fallback
  let category: PresentationCategory = "general";
  let audience: AudienceType = "general";
  let purpose: PurposeType = "inform";
  let tone: ToneType = "conversational";
  let suggestedTemplate = "minimal";
  let needsResearch = false;

  // Category detection heuristics
  if (/pitch|investor|funding|seed|series|venture/i.test(text)) {
    category = "startup";
    audience = "investors";
    purpose = "pitch";
    tone = "persuasive";
    suggestedTemplate = "startup";
  } else if (/thesis|dissertation|defense|peer.?review|journal|citation/i.test(text)) {
    category = "academic";
    audience = "researchers";
    purpose = "educate";
    tone = "academic";
    suggestedTemplate = "academic";
    needsResearch = true;
  } else if (/quarterly|annual report|kpi|revenue|profit|financial|board/i.test(text)) {
    category = "report";
    audience = "executives";
    purpose = "report";
    tone = "formal";
    suggestedTemplate = "corporate";
    needsResearch = true;
  } else if (/code|architecture|system design|api|database|infrastructure|deploy|kubernetes|docker|microservice/i.test(text)) {
    category = "technical";
    audience = "technical";
    purpose = "inform";
    tone = "technical";
    suggestedTemplate = "dark";
    needsResearch = true;
  } else if (/onboarding|training|tutorial|how.?to|workshop|hands.?on|exercise/i.test(text)) {
    category = "training";
    audience = "students";
    purpose = "educate";
    tone = "conversational";
    suggestedTemplate = "education";
  } else if (/campaign|brand|launch|social media|advertising|cac|ltv|conversion/i.test(text)) {
    category = "marketing";
    audience = "customers";
    purpose = "persuade";
    tone = "persuasive";
    suggestedTemplate = "marketing";
  } else if (/motivat|inspir|keynote|vision|team.?building|pep talk/i.test(text)) {
    category = "motivational";
    audience = "professionals";
    purpose = "motivate";
    tone = "inspirational";
    suggestedTemplate = "startup";
  } else if (/class|assignment|project|student|course|lecture|homework|university|college/i.test(text)) {
    category = "student";
    audience = "students";
    purpose = "educate";
    tone = "conversational";
    suggestedTemplate = "seminar";
  }

  // Needs research check
  if (!needsResearch) {
    needsResearch = fallbackNeedsResearch({ category });
  }

  // Generate a simple title from the first meaningful line
  const firstLine = inputText
    .split(/\n/)
    .map((l) => l.trim())
    .find((l) => l.length > 10);

  const suggestedTitle = firstLine
    ? firstLine.length <= 60
      ? firstLine
      : firstLine.slice(0, 57) + "..."
    : "Presentation";

  return {
    category,
    audience,
    purpose,
    tone,
    complexity: "intermediate",
    suggestedSlideCount: 10,
    suggestedTitle,
    suggestedSubtitle: `${category} presentation for ${audience}`,
    suggestedTemplate,
    outline: [],
    keywords: [],
    needsResearch,
  };
}
