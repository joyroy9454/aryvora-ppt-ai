// ============================================================
// Shared Constants — Single source of truth for themes, templates, tones
// ============================================================

import type { TemplateId, ToneType } from "@/types";

// ── Theme color definitions (used by PPTX, PDF, and UI) ──

export interface ThemeColors {
  bg: string;
  titleColor: string;
  bodyColor: string;
  accent: string;
  surface: string;
}

export const THEMES: Record<TemplateId, ThemeColors> = {
  corporate: {
    bg: "FFFFFF",
    titleColor: "1B3A5C",
    bodyColor: "2D3748",
    accent: "2B6CB0",
    surface: "F7FAFC",
  },
  academic: {
    bg: "FAFAFA",
    titleColor: "2D3748",
    bodyColor: "1A202C",
    accent: "805AD5",
    surface: "FFFFFF",
  },
  startup: {
    bg: "0F0F23",
    titleColor: "FFFFFF",
    bodyColor: "A0AEC0",
    accent: "F59E0B",
    surface: "1A1A3E",
  },
  minimal: {
    bg: "FFFFFF",
    titleColor: "111827",
    bodyColor: "4B5563",
    accent: "6B7280",
    surface: "F9FAFB",
  },
  dark: {
    bg: "0F172A",
    titleColor: "F1F5F9",
    bodyColor: "94A3B8",
    accent: "63B3ED",
    surface: "1E293B",
  },
  seminar: {
    bg: "FFFFFF",
    titleColor: "064E3B",
    bodyColor: "065F46",
    accent: "059669",
    surface: "ECFDF5",
  },
  marketing: {
    bg: "FFFBEB",
    titleColor: "1C1917",
    bodyColor: "78716C",
    accent: "DC2626",
    surface: "FFFFFF",
  },
  research: {
    bg: "F0F9FF",
    titleColor: "0C4A6E",
    bodyColor: "075985",
    accent: "0369A1",
    surface: "FFFFFF",
  },
  education: {
    bg: "FFFFFF",
    titleColor: "1E1B4B",
    bodyColor: "4338CA",
    accent: "7C3AED",
    surface: "FAF5FF",
  },
  portfolio: {
    bg: "FFF1F2",
    titleColor: "1F2937",
    bodyColor: "BE185D",
    accent: "EC4899",
    surface: "FFFFFF",
  },
};

// ── CSS theme styles (for PDF export) ──

export interface CssThemeColors {
  bg: string;
  title: string;
  body: string;
  accent: string;
  surface: string;
}

export const CSS_THEMES: Record<TemplateId, CssThemeColors> = {
  corporate: { bg: "#FFFFFF", title: "#1B3A5C", body: "#2D3748", accent: "#2B6CB0", surface: "#F7FAFC" },
  academic: { bg: "#FAFAFA", title: "#2D3748", body: "#1A202C", accent: "#805AD5", surface: "#FFFFFF" },
  startup: { bg: "#0F0F23", title: "#FFFFFF", body: "#A0AEC0", accent: "#F59E0B", surface: "#1A1A3E" },
  minimal: { bg: "#FFFFFF", title: "#111827", body: "#4B5563", accent: "#6B7280", surface: "#F9FAFB" },
  dark: { bg: "#0F172A", title: "#F1F5F9", body: "#94A3B8", accent: "#63B3ED", surface: "#1E293B" },
  seminar: { bg: "#FFFFFF", title: "#064E3B", body: "#065F46", accent: "#059669", surface: "#ECFDF5" },
  marketing: { bg: "#FFFBEB", title: "#1C1917", body: "#78716C", accent: "#DC2626", surface: "#FFFFFF" },
  research: { bg: "#F0F9FF", title: "#0C4A6E", body: "#075985", accent: "#0369A1", surface: "#FFFFFF" },
  education: { bg: "#FFFFFF", title: "#1E1B4B", body: "#4338CA", accent: "#7C3AED", surface: "#FAF5FF" },
  portfolio: { bg: "#FFF1F2", title: "#1F2937", body: "#BE185D", accent: "#EC4899", surface: "#FFFFFF" },
};

// ── Template descriptions (used in AI prompts) ──

export const TEMPLATE_DESCRIPTIONS: Record<TemplateId, string> = {
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

// ── Tone instructions (used in AI prompts) ──

export const TONE_INSTRUCTIONS: Record<ToneType | string, string> = {
  formal: "Use professional, precise language. Avoid contractions and slang. Maintain authoritative tone.",
  casual: "Use conversational, friendly language. Contractions are fine. Be relatable.",
  academic: "Use scholarly language with precise terminology. Include references where appropriate. Objective tone.",
  persuasive: "Use compelling, action-oriented language. Include calls to action. Build urgency.",
  inspirational: "Use uplifting, motivational language. Tell stories. Paint a vision of the future.",
  technical: "Use precise technical terminology. Be specific and detailed. Include data points.",
  conversational: "Write as if speaking directly to the audience. Use 'you' and 'we'. Be engaging.",
};

// ── Template to style mapping (for change-template endpoint) ──

export const TEMPLATE_STYLE_MAP: Record<string, "academic" | "business" | "casual"> = {
  academic: "academic",
  corporate: "business",
  startup: "casual",
  minimal: "business",
  dark: "casual",
  seminar: "academic",
  marketing: "casual",
  research: "academic",
  education: "academic",
  portfolio: "casual",
};
