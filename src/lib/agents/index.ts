// ============================================================
// Multi-Agent System — Index & Exports
//
// Pipeline: Planner → Research → Outline → Writer → Reviewer
//
// Each agent is a standalone module:
//   - planner.ts:     Analyzes input, detects category/audience/purpose
//   - research.ts:    Researches topic for factual support
//   - outline.ts:     Creates detailed slide-by-slide plan
//   - writer.ts:      Generates each slide with AI
//   - reviewer.ts:    Reviews and polishes the full deck
//
// Usage:
//   import { createPlannerAgent } from '@/lib/agents';
//   const planner = createPlannerAgent();
//   const plan = await planner.analyze(inputText, inputMode);
// ============================================================

export { createPlannerAgent } from "./planner";
export type { PlannerAgent, PlannerResult } from "./planner";

export { createResearchAgent } from "./research";
export type { ResearchAgent, ResearchResult } from "./research";

export { createOutlineAgent } from "./outline";
export type { OutlineAgent } from "./outline";

export { createSlideWriterAgent } from "./writer";
export type { SlideWriterAgent } from "./writer";

export { createQualityReviewerAgent } from "./reviewer";
export type { QualityReviewerAgent } from "./reviewer";

// Re-export shared types for convenience
export type { SlidePlan } from "../ai-engine";

// Visual Curator
export { createVisualCuratorAgent } from "./visual-curator";
export type { VisualCuratorAgent, VisualDecision } from "./visual-curator";
