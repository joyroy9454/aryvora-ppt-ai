// ============================================================
// Research Agent — Factual Research for Slide Content
// Researches topics that need factual support before slide writing.
// Uses callAI to gather verifiable information; skips research
// for categories that don't require heavy factual backing.
// ============================================================

import { callAI, parseJSON } from "@/lib/ai-engine";
import type { TopicCategory } from "@/types";

// ---------- Research Result ----------

export interface ResearchResult {
  /** Key factual statements supported by the research */
  facts: string[];
  /** Source references (URLs, papers, publications) */
  sources: string[];
  /** Concise summary of findings for the Outline Agent */
  summary: string;
  /** Key data points, statistics, or metrics */
  keyData: string[];
}

// ---------- Research Agent Interface ----------

export interface ResearchAgent {
  research: (
    topic: string,
    keywords: string[],
    category: TopicCategory
  ) => Promise<ResearchResult>;
}

// ---------- Categories that benefit from research ----------

const RESEARCH_HEAVY_CATEGORIES: Set<TopicCategory> = new Set([
  "academic",
  "research",
  "technical",
  "report",
  "proposal",
  "business",
  "corporate",
  "product-demo",
]);

// ---------- Empty / minimal result helpers ----------

const emptyResearch: ResearchResult = {
  facts: [],
  sources: [],
  summary: "",
  keyData: [],
};

function minimalResearch(topic: string, reason: string): ResearchResult {
  return {
    ...emptyResearch,
    summary: `No research needed for "${topic}": ${reason}`,
  };
}

// ---------- Research prompt builder ----------

function buildResearchPrompt(
  topic: string,
  keywords: string[],
  category: TopicCategory
): string {
  const keywordStr = keywords.length > 0 ? keywords.join(", ") : "(none provided)";

  return `Research the following presentation topic to provide factual support for slide content.

TOPIC: ${topic}
CATEGORY: ${category}
KEYWORDS: ${keywordStr}

INSTRUCTIONS:
- Provide factual, verifiable information that can be used in presentation slides.
- Include specific data points, statistics, dates, and metrics where available.
- If you are uncertain about a fact, explicitly state "This may need verification: [fact]".
- Do NOT invent statistics or data. If you don't know a specific number, say so.
- Focus on information that would strengthen slide content: key trends, important findings, notable examples.
- Cite sources when possible (research papers, official reports, reputable publications).
- Keep the summary concise — it will be used by an Outline Agent to structure slides.

Return ONLY a JSON object with this structure:
{
  "facts": ["Fact 1", "Fact 2", ...],
  "sources": ["Source 1", "Source 2", ...],
  "summary": "A concise 2-3 sentence summary of key findings",
  "keyData": ["Data point 1", "Data point 2", ...]
}`;
}

// ---------- Factory ----------

export function createResearchAgent(): ResearchAgent {
  return {
    async research(
      topic: string,
      keywords: string[],
      category: TopicCategory
    ): Promise<ResearchResult> {
      // Skip research for categories that don't need heavy factual backing
      if (!RESEARCH_HEAVY_CATEGORIES.has(category)) {
        return minimalResearch(
          topic,
          `category "${category}" does not require factual research`
        );
      }

      const systemPrompt = `You are a meticulous research assistant specializing in gathering factual, verifiable information for presentation content.

Your responsibilities:
- Provide accurate, well-sourced facts — never fabricate data or statistics.
- When uncertain, clearly label information as needing verification.
- Prioritize recent, authoritative sources (academic papers, official reports, reputable news).
- Be specific: include numbers, dates, and named entities rather than vague claims.
- If reliable data is unavailable for a point, state that explicitly rather than guessing.`;

      const userPrompt = buildResearchPrompt(topic, keywords, category);

      try {
        const raw = await callAI(systemPrompt, userPrompt);
        const parsed = parseJSON(raw);

        // Validate and sanitize the response
        const result: ResearchResult = {
          facts: Array.isArray(parsed.facts)
            ? parsed.facts.filter((f: unknown) => typeof f === "string")
            : [],
          sources: Array.isArray(parsed.sources)
            ? parsed.sources.filter((s: unknown) => typeof s === "string")
            : [],
          summary:
            typeof parsed.summary === "string"
              ? parsed.summary
              : "Research completed but summary was not provided.",
          keyData: Array.isArray(parsed.keyData)
            ? parsed.keyData.filter((d: unknown) => typeof d === "string")
            : [],
        };

        return result;
      } catch (err) {
        // Fallback: return empty research so the pipeline can continue
        console.warn(
          `[ResearchAgent] AI call failed for topic "${topic}":`,
          err
        );
        return {
          ...emptyResearch,
          summary: `Research unavailable for "${topic}" — proceeding without factual enrichment.`,
        };
      }
    },
  };
}
