// ============================================================
// Visual Curator Agent — Intelligent Visual Placement
//
// Decides where images, diagrams, charts, and visual blocks
// will genuinely help the presentation.
//
// Rules:
// - Do NOT force a visual onto every slide
// - Add visuals only when they improve understanding or appearance
// - Match visual style to category
// - Ensure visual diversity across the deck
// ============================================================

import { callAI, parseJSON } from "../ai-engine";
import type { SlidePlan, VisualType, ImagePosition } from "../ai-engine";
import type { TopicCategory } from "@/types";

// ---------- Types ----------

export interface VisualDecision {
  slideIndex: number;
  needsVisual: boolean;
  visualType: VisualType;
  imagePosition: ImagePosition;
  imageKeyword: string;
  visualCaption: string;
  reason: string; // Why this visual was chosen
}

export interface VisualCuratorAgent {
  curateVisuals(
    plans: SlidePlan[],
    category: TopicCategory,
    keywords: string[]
  ): Promise<VisualDecision[]>;
}

// ---------- Category-specific visual strategies ----------

interface VisualStrategy {
  preferredVisuals: VisualType[];
  imageFrequency: "none" | "selective" | "frequent";
  useBackgrounds: boolean;
  useDiagrams: boolean;
  useCharts: boolean;
  useIcons: boolean;
  style: string;
}

function getVisualStrategy(category: TopicCategory): VisualStrategy {
  switch (category) {
    case "academic":
      return {
        preferredVisuals: ["diagram", "chart", "icon"],
        imageFrequency: "none",
        useBackgrounds: false,
        useDiagrams: true,
        useCharts: true,
        useIcons: true,
        style: "clean, formal, minimal — diagrams and data visualizations only",
      };
    case "student":
      return {
        preferredVisuals: ["image", "diagram", "icon"],
        imageFrequency: "selective",
        useBackgrounds: false,
        useDiagrams: true,
        useCharts: false,
        useIcons: true,
        style: "clean, simple, educational — friendly diagrams and occasional photos",
      };
    case "business":
      return {
        preferredVisuals: ["chart", "diagram", "icon"],
        imageFrequency: "selective",
        useBackgrounds: false,
        useDiagrams: true,
        useCharts: true,
        useIcons: true,
        style: "professional, data-driven — charts, clean diagrams, minimal photos",
      };
    case "corporate":
      return {
        preferredVisuals: ["chart", "diagram", "icon"],
        imageFrequency: "selective",
        useBackgrounds: false,
        useDiagrams: true,
        useCharts: true,
        useIcons: true,
        style: "polished, structured — professional charts and diagrams",
      };
    case "startup":
      return {
        preferredVisuals: ["image", "chart", "icon"],
        imageFrequency: "selective",
        useBackgrounds: true,
        useDiagrams: false,
        useCharts: true,
        useIcons: true,
        style: "bold, high-impact — product images, key metrics, minimal text",
      };
    case "research":
      return {
        preferredVisuals: ["chart", "diagram", "icon"],
        imageFrequency: "selective",
        useBackgrounds: false,
        useDiagrams: true,
        useCharts: true,
        useIcons: true,
        style: "factual, evidence-focused — data charts, methodology diagrams",
      };
    case "seminar":
      return {
        preferredVisuals: ["image", "diagram", "icon"],
        imageFrequency: "selective",
        useBackgrounds: false,
        useDiagrams: true,
        useCharts: false,
        useIcons: true,
        style: "friendly, approachable — illustrative photos and simple diagrams",
      };
    case "marketing":
      return {
        preferredVisuals: ["image", "chart", "icon"],
        imageFrequency: "frequent",
        useBackgrounds: true,
        useDiagrams: false,
        useCharts: true,
        useIcons: true,
        style: "vibrant, persuasive — high-quality photos, bold highlights, comparisons",
      };
    case "technical":
      return {
        preferredVisuals: ["diagram", "chart", "icon"],
        imageFrequency: "selective",
        useBackgrounds: false,
        useDiagrams: true,
        useCharts: true,
        useIcons: true,
        style: "precise, logical — architecture diagrams, flow charts, system maps",
      };
    case "creative":
      return {
        preferredVisuals: ["image", "icon"],
        imageFrequency: "frequent",
        useBackgrounds: true,
        useDiagrams: false,
        useCharts: false,
        useIcons: true,
        style: "artistic, expressive — full-bleed photos, creative compositions",
      };
    case "training":
      return {
        preferredVisuals: ["diagram", "image", "icon"],
        imageFrequency: "selective",
        useBackgrounds: false,
        useDiagrams: true,
        useCharts: false,
        useIcons: true,
        style: "instructional, clear — step diagrams, process flows, example photos",
      };
    case "workshop":
      return {
        preferredVisuals: ["image", "diagram", "icon"],
        imageFrequency: "selective",
        useBackgrounds: false,
        useDiagrams: true,
        useCharts: false,
        useIcons: true,
        style: "interactive, engaging — activity photos, discussion prompts",
      };
    case "sales":
      return {
        preferredVisuals: ["image", "chart", "icon"],
        imageFrequency: "selective",
        useBackgrounds: true,
        useDiagrams: false,
        useCharts: true,
        useIcons: true,
        style: "persuasive, benefit-focused — product shots, ROI data, testimonials",
      };
    case "proposal":
      return {
        preferredVisuals: ["chart", "diagram", "icon"],
        imageFrequency: "selective",
        useBackgrounds: false,
        useDiagrams: true,
        useCharts: true,
        useIcons: true,
        style: "structured, credible — timeline charts, approach diagrams, data",
      };
    case "report":
      return {
        preferredVisuals: ["chart", "diagram", "icon"],
        imageFrequency: "selective",
        useBackgrounds: false,
        useDiagrams: true,
        useCharts: true,
        useIcons: true,
        style: "data-driven, precise — trend charts, comparison tables, KPIs",
      };
    case "product-demo":
      return {
        preferredVisuals: ["image", "diagram", "icon"],
        imageFrequency: "frequent",
        useBackgrounds: false,
        useDiagrams: true,
        useCharts: false,
        useIcons: true,
        style: "demo-focused, visual — screenshots, feature highlights, architecture",
      };
    case "event":
      return {
        preferredVisuals: ["image", "icon"],
        imageFrequency: "frequent",
        useBackgrounds: true,
        useDiagrams: false,
        useCharts: false,
        useIcons: true,
        style: "energetic, engaging — event photos, schedules, highlights",
      };
    case "motivational":
      return {
        preferredVisuals: ["image", "quote", "icon"],
        imageFrequency: "frequent",
        useBackgrounds: true,
        useDiagrams: false,
        useCharts: false,
        useIcons: true,
        style: "inspirational, emotional — powerful imagery, quotes, stories",
      };
    case "general":
    default:
      return {
        preferredVisuals: ["image", "diagram", "icon"],
        imageFrequency: "selective",
        useBackgrounds: false,
        useDiagrams: true,
        useCharts: true,
        useIcons: true,
        style: "balanced, readable — versatile visuals that support the message",
      };
  }
}

// ---------- Factory ----------

export function createVisualCuratorAgent(): VisualCuratorAgent {
  return {
    async curateVisuals(
      plans: SlidePlan[],
      category: TopicCategory,
      keywords: string[]
    ): Promise<VisualDecision[]> {
      const strategy = getVisualStrategy(category);

      // For small decks or categories that don't need AI curation, use rule-based
      if (plans.length <= 5 || strategy.imageFrequency === "none") {
        return ruleBasedCuration(plans, strategy, keywords);
      }

      // For larger decks, use AI to make smarter visual decisions
      try {
        const systemPrompt = `You are a visual presentation curator. Your job is to decide which slides in a presentation would genuinely benefit from visuals (images, diagrams, charts, icons).

CATEGORY: ${category}
VISUAL STRATEGY: ${strategy.style}
ALLOWED VISUAL TYPES: ${strategy.preferredVisuals.join(", ")}
IMAGE FREQUENCY: ${strategy.imageFrequency}
USE BACKGROUNDS: ${strategy.useBackgrounds}
USE DIAGRAMS: ${strategy.useDiagrams}
USE CHARTS: ${strategy.useCharts}

RULES:
1. Do NOT add visuals to every slide — only where they genuinely help
2. Title and closing slides: usually no image (unless background for impact)
3. Content slides: add visuals only when they improve understanding
4. Statistic/chart slides: always use chart visual type
5. Process/timeline slides: use diagram visual type
6. Quote slides: optional background image for impact
7. Divider slides: background image for visual break
8. Vary visual types — don't use the same type on consecutive slides
9. Max 40-50% of slides should have images
10. Keywords for image search: ${keywords.join(", ")}

Return a JSON array of visual decisions:
[{"slideIndex": 0, "needsVisual": false, "visualType": "none", "imagePosition": "none", "imageKeyword": "", "visualCaption": "", "reason": "Title slide — no visual needed"}]

Return ONLY raw JSON array.`;

        const plansSummary = plans.map((p, i) => ({
          index: i,
          type: p.type,
          heading: p.heading,
          keyPoints: p.keyPoints.slice(0, 2),
        }));

        const userPrompt = `Decide visuals for these ${plans.length} slides:

${JSON.stringify(plansSummary, null, 2)}

Category: ${category}
Strategy: ${strategy.style}

Make smart decisions. Not every slide needs a visual. Quality over quantity.`;

        const raw = await callAI(systemPrompt, userPrompt);
        const decisions = parseJSON(raw);

        if (Array.isArray(decisions)) {
          return decisions.map((d: any, i: number) => ({
            slideIndex: d.slideIndex ?? i,
            needsVisual: d.needsVisual ?? false,
            visualType: d.visualType ?? "none",
            imagePosition: d.imagePosition ?? "none",
            imageKeyword: d.imageKeyword ?? "",
            visualCaption: d.visualCaption ?? "",
            reason: d.reason ?? "",
          }));
        }
      } catch {
        // Fall back to rule-based
      }

      return ruleBasedCuration(plans, strategy, keywords);
    },
  };
}

// ---------- Rule-based fallback ----------

function ruleBasedCuration(
  plans: SlidePlan[],
  strategy: VisualStrategy,
  keywords: string[]
): VisualDecision[] {
  const decisions: VisualDecision[] = [];
  let imageCount = 0;
  const maxImages = Math.max(1, Math.round(plans.length * 0.4));
  const keyword = keywords[0] || "professional";

  for (let i = 0; i < plans.length; i++) {
    const plan = plans[i];
    const decision: VisualDecision = {
      slideIndex: i,
      needsVisual: false,
      visualType: "none",
      imagePosition: "none",
      imageKeyword: "",
      visualCaption: "",
      reason: "",
    };

    // Title slide
    if (plan.type === "title") {
      if (strategy.useBackgrounds && i === 0) {
        decision.needsVisual = true;
        decision.visualType = "image";
        decision.imagePosition = "background";
        decision.imageKeyword = keyword;
        decision.reason = "Background image for title impact";
      } else {
        decision.reason = "Title slide — clean, no visual needed";
      }
      decisions.push(decision);
      continue;
    }

    // Closing slide
    if (plan.type === "closing") {
      decision.reason = "Closing slide — clean, no visual needed";
      decisions.push(decision);
      continue;
    }

    // Statistic slides → chart
    if (plan.type === "statistic" || plan.type === "chart") {
      decision.needsVisual = true;
      decision.visualType = "chart";
      decision.reason = "Data visualization for statistics";
      decisions.push(decision);
      continue;
    }

    // Process/timeline → diagram
    if (plan.type === "process" || plan.type === "timeline") {
      decision.needsVisual = true;
      decision.visualType = "diagram";
      decision.reason = "Flow diagram for process/timeline";
      decisions.push(decision);
      continue;
    }

    // Quote → optional background
    if (plan.type === "quote") {
      if (strategy.useBackgrounds && imageCount < maxImages) {
        decision.needsVisual = true;
        decision.visualType = "image";
        decision.imagePosition = "background";
        decision.imageKeyword = keyword;
        decision.reason = "Background image for quote impact";
        imageCount++;
      } else {
        decision.reason = "Quote slide — text-focused";
      }
      decisions.push(decision);
      continue;
    }

    // Divider → background image
    if (plan.type === "divider") {
      if (strategy.useBackgrounds) {
        decision.needsVisual = true;
        decision.visualType = "image";
        decision.imagePosition = "background";
        decision.imageKeyword = keyword;
        decision.reason = "Background image for section break";
      } else {
        decision.reason = "Divider — clean section break";
      }
      decisions.push(decision);
      continue;
    }

    // Content slides → selective images
    if (plan.type === "content" || plan.type === "two-column" || plan.type === "comparison") {
      if (
        imageCount < maxImages &&
        strategy.imageFrequency !== "none" &&
        i % 3 === 0 // Every 3rd content slide
      ) {
        const position: ImagePosition = i % 2 === 0 ? "left" : "right";
        decision.needsVisual = true;
        decision.visualType = "image";
        decision.imagePosition = position;
        decision.imageKeyword = keyword;
        decision.reason = `Image to support: ${plan.heading}`;
        imageCount++;
      } else {
        decision.reason = "Text-focused content slide";
      }
      decisions.push(decision);
      continue;
    }

    // Default: no visual
    decision.reason = `${plan.type} slide — no visual needed`;
    decisions.push(decision);
  }

  return decisions;
}
