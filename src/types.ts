// ============================================================
// Aryvora PPT AI — Advanced Type System
// ============================================================

// ---------- Input Modes ----------
export type InputMode =
  | "topic"
  | "notes"
  | "pdf"
  | "url"
  | "transcript"
  | "bullets";

export interface InputConfig {
  mode: InputMode;
  label: string;
  placeholder: string;
  icon: string;
  description: string;
  acceptFile?: string;
}

export const INPUT_MODES: InputConfig[] = [
  {
    mode: "topic",
    label: "Topic",
    placeholder: "Enter your presentation topic...",
    icon: "💡",
    description: "Generate from a topic or title",
  },
  {
    mode: "notes",
    label: "Notes",
    placeholder: "Paste your rough notes, lecture notes, or meeting notes...",
    icon: "📝",
    description: "Transform notes into a structured presentation",
  },
  {
    mode: "bullets",
    label: "Bullet Points",
    placeholder: "Enter key points, one per line...",
    icon: "📋",
    description: "Convert bullet points into slides",
  },
  {
    mode: "url",
    label: "URL / Blog",
    placeholder: "https://example.com/article",
    icon: "🔗",
    description: "Generate from a webpage or blog post",
  },
  {
    mode: "transcript",
    label: "Transcript",
    placeholder: "Paste a video transcript, podcast, or speech...",
    icon: "🎙️",
    description: "Convert spoken content into slides",
  },
  {
    mode: "pdf",
    label: "PDF",
    placeholder: "Upload a PDF document",
    icon: "📄",
    description: "Extract content from a PDF file",
  },
];

// ---------- AI Intelligence ----------
export type TopicCategory =
  | "technology"
  | "business"
  | "education"
  | "science"
  | "health"
  | "marketing"
  | "finance"
  | "creative"
  | "general";

export type AudienceType =
  | "students"
  | "professionals"
  | "executives"
  | "general"
  | "technical"
  | "investors"
  | "customers";

export type ToneType =
  | "formal"
  | "casual"
  | "academic"
  | "persuasive"
  | "inspirational"
  | "technical"
  | "conversational";

export interface AIAnalysis {
  category: TopicCategory;
  audience: AudienceType;
  tone: ToneType;
  suggestedSlideCount: number;
  suggestedTitle: string;
  suggestedSubtitle: string;
  outline: string[];
  keywords: string[];
}

// ---------- Slide System ----------
export type SlideType =
  | "title"
  | "content"
  | "two-column"
  | "closing"
  | "image-left"
  | "image-right"
  | "quote"
  | "comparison"
  | "timeline"
  | "statistic"
  | "divider"
  | "process"
  | "chart"
  | "summary"
  | "qa"
  | "blank";

export interface SlideStat {
  label: string;
  value: string;
}

export interface SlideTimelineItem {
  label: string;
  description: string;
}

export interface SlideProcessItem {
  step: number;
  title: string;
  description: string;
}

export interface SlideChartItem {
  label: string;
  value: number;
  color?: string;
}

export interface Slide {
  id: string;
  type: SlideType;
  heading: string;
  sub?: string;
  bullets?: string[];
  leftCol?: string[];
  rightCol?: string[];
  quote?: string;
  author?: string;
  stats?: SlideStat[];
  timeline?: SlideTimelineItem[];
  process?: SlideProcessItem[];
  chart?: SlideChartItem[];
  chartType?: "bar" | "pie" | "line";
  imageUrl?: string;
  imagePrompt?: string;
  icon?: string;
  notes?: string;
  layout?: SlideLayout;
  index?: number; // Position in the presentation (0-based)
}

export type SlideLayout =
  | "default"
  | "centered"
  | "left-aligned"
  | "right-aligned"
  | "full-bleed";

// ---------- Template / Design System ----------
export type TemplateId =
  | "corporate"
  | "academic"
  | "startup"
  | "minimal"
  | "dark"
  | "seminar"
  | "marketing"
  | "research"
  | "education"
  | "portfolio";

export interface TemplateColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
}

export interface TemplateFonts {
  heading: string;
  body: string;
}

export interface TemplateDesign {
  id: TemplateId;
  name: string;
  description: string;
  icon: string;
  colors: TemplateColors;
  fonts: TemplateFonts;
  bgStyle: "solid" | "gradient" | "pattern";
  borderRadius: "none" | "small" | "medium" | "large";
  shadow: "none" | "subtle" | "medium" | "strong";
  iconStyle: "outline" | "filled" | "emoji" | "none";
  imageStyle: "rounded" | "circle" | "square" | "none";
}

export const TEMPLATES: TemplateDesign[] = [
  {
    id: "corporate",
    name: "Corporate",
    description: "Clean and professional for business presentations",
    icon: "🏢",
    colors: {
      primary: "#1B3A5C",
      secondary: "#2B6CB0",
      accent: "#3182CE",
      background: "#FFFFFF",
      surface: "#F7FAFC",
      text: "#1A202C",
      textMuted: "#718096",
      border: "#E2E8F0",
    },
    fonts: { heading: "Inter", body: "Inter" },
    bgStyle: "solid",
    borderRadius: "medium",
    shadow: "subtle",
    iconStyle: "outline",
    imageStyle: "rounded",
  },
  {
    id: "academic",
    name: "Academic",
    description: "Formal style for research and lectures",
    icon: "🎓",
    colors: {
      primary: "#2D3748",
      secondary: "#4A5568",
      accent: "#805AD5",
      background: "#FAFAFA",
      surface: "#FFFFFF",
      text: "#1A202C",
      textMuted: "#718096",
      border: "#E2E8F0",
    },
    fonts: { heading: "Merriweather", body: "Source Sans Pro" },
    bgStyle: "solid",
    borderRadius: "small",
    shadow: "none",
    iconStyle: "outline",
    imageStyle: "square",
  },
  {
    id: "startup",
    name: "Startup Pitch",
    description: "Bold and energetic for pitch decks",
    icon: "🚀",
    colors: {
      primary: "#6B21A8",
      secondary: "#9333EA",
      accent: "#F59E0B",
      background: "#0F0F23",
      surface: "#1A1A3E",
      text: "#FFFFFF",
      textMuted: "#A0AEC0",
      border: "#2D2D5E",
    },
    fonts: { heading: "Poppins", body: "Inter" },
    bgStyle: "gradient",
    borderRadius: "large",
    shadow: "strong",
    iconStyle: "filled",
    imageStyle: "rounded",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Elegant simplicity with lots of whitespace",
    icon: "✨",
    colors: {
      primary: "#111827",
      secondary: "#374151",
      accent: "#6B7280",
      background: "#FFFFFF",
      surface: "#F9FAFB",
      text: "#111827",
      textMuted: "#9CA3AF",
      border: "#F3F4F6",
    },
    fonts: { heading: "Inter", body: "Inter" },
    bgStyle: "solid",
    borderRadius: "none",
    shadow: "none",
    iconStyle: "none",
    imageStyle: "none",
  },
  {
    id: "dark",
    name: "Dark Modern",
    description: "Sleek dark theme for modern presentations",
    icon: "🌙",
    colors: {
      primary: "#FFFFFF",
      secondary: "#E2E8F0",
      accent: "#63B3ED",
      background: "#0F172A",
      surface: "#1E293B",
      text: "#F1F5F9",
      textMuted: "#94A3B8",
      border: "#334155",
    },
    fonts: { heading: "Inter", body: "Inter" },
    bgStyle: "gradient",
    borderRadius: "medium",
    shadow: "medium",
    iconStyle: "filled",
    imageStyle: "rounded",
  },
  {
    id: "seminar",
    name: "Student Seminar",
    description: "Friendly and approachable for student presentations",
    icon: "📚",
    colors: {
      primary: "#059669",
      secondary: "#10B981",
      accent: "#F59E0B",
      background: "#FFFFFF",
      surface: "#ECFDF5",
      text: "#064E3B",
      textMuted: "#6B7280",
      border: "#D1FAE5",
    },
    fonts: { heading: "Nunito", body: "Open Sans" },
    bgStyle: "solid",
    borderRadius: "large",
    shadow: "subtle",
    iconStyle: "emoji",
    imageStyle: "rounded",
  },
  {
    id: "marketing",
    name: "Marketing",
    description: "Vibrant and eye-catching for marketing decks",
    icon: "📣",
    colors: {
      primary: "#DC2626",
      secondary: "#F97316",
      accent: "#FBBF24",
      background: "#FFFBEB",
      surface: "#FFFFFF",
      text: "#1C1917",
      textMuted: "#78716C",
      border: "#FED7AA",
    },
    fonts: { heading: "Montserrat", body: "Open Sans" },
    bgStyle: "gradient",
    borderRadius: "large",
    shadow: "medium",
    iconStyle: "filled",
    imageStyle: "rounded",
  },
  {
    id: "research",
    name: "Research",
    description: "Data-focused for scientific presentations",
    icon: "🔬",
    colors: {
      primary: "#0369A1",
      secondary: "#0EA5E9",
      accent: "#06B6D4",
      background: "#F0F9FF",
      surface: "#FFFFFF",
      text: "#0C4A6E",
      textMuted: "#64748B",
      border: "#BAE6FD",
    },
    fonts: { heading: "Roboto Slab", body: "Roboto" },
    bgStyle: "solid",
    borderRadius: "small",
    shadow: "subtle",
    iconStyle: "outline",
    imageStyle: "square",
  },
  {
    id: "education",
    name: "Education",
    description: "Clear and structured for teaching",
    icon: "🏫",
    colors: {
      primary: "#7C3AED",
      secondary: "#8B5CF6",
      accent: "#EC4899",
      background: "#FFFFFF",
      surface: "#FAF5FF",
      text: "#1E1B4B",
      textMuted: "#6B7280",
      border: "#E9D5FF",
    },
    fonts: { heading: "Quicksand", body: "Nunito" },
    bgStyle: "solid",
    borderRadius: "large",
    shadow: "subtle",
    iconStyle: "emoji",
    imageStyle: "rounded",
  },
  {
    id: "portfolio",
    name: "Portfolio",
    description: "Creative and visual for showcasing work",
    icon: "🎨",
    colors: {
      primary: "#BE185D",
      secondary: "#EC4899",
      accent: "#F472B6",
      background: "#FFF1F2",
      surface: "#FFFFFF",
      text: "#1F2937",
      textMuted: "#6B7280",
      border: "#FECDD3",
    },
    fonts: { heading: "Playfair Display", body: "Lato" },
    bgStyle: "gradient",
    borderRadius: "large",
    shadow: "strong",
    iconStyle: "filled",
    imageStyle: "rounded",
  },
];

// ---------- Presentation ----------
export interface Presentation {
  id: string;
  title: string;
  sub?: string;
  templateId: TemplateId;
  slides: Slide[];
  analysis?: AIAnalysis;
  createdAt: number;
  inputMode: InputMode;
  inputText: string;
}

// ---------- Generation Progress ----------
export type GenerationStep =
  | "analyzing"
  | "outlining"
  | "generating"
  | "enhancing"
  | "finalizing"
  | "done"
  | "error";

export interface GenerationProgress {
  step: GenerationStep;
  message: string;
  progress: number; // 0-100
  currentSlide?: number;
  totalSlides?: number;
}

// ---------- Slide Templates for Editor ----------
export const SLIDE_TEMPLATES: {
  type: SlideType;
  label: string;
  desc: string;
  icon: string;
  category: "basic" | "visual" | "data" | "special";
}[] = [
  { type: "content", label: "Content", desc: "Heading + bullet points", icon: "📝", category: "basic" },
  { type: "image-left", label: "Image Left", desc: "Image left, text right", icon: "🖼️", category: "visual" },
  { type: "image-right", label: "Image Right", desc: "Text left, image right", icon: "🖼️", category: "visual" },
  { type: "two-column", label: "Two Columns", desc: "Side-by-side comparison", icon: "📊", category: "basic" },
  { type: "quote", label: "Quote", desc: "Highlighted quote + author", icon: "💬", category: "special" },
  { type: "comparison", label: "Comparison", desc: "Compare two options", icon: "⚖️", category: "data" },
  { type: "timeline", label: "Timeline", desc: "Sequential steps", icon: "📅", category: "data" },
  { type: "process", label: "Process", desc: "Step-by-step flow", icon: "🔄", category: "data" },
  { type: "statistic", label: "Statistic", desc: "Key numbers + labels", icon: "📈", category: "data" },
  { type: "chart", label: "Chart", desc: "Bar, pie, or line chart", icon: "📊", category: "data" },
  { type: "divider", label: "Section Divider", desc: "Section break slide", icon: "➖", category: "special" },
  { type: "summary", label: "Summary", desc: "Key takeaways", icon: "✅", category: "special" },
  { type: "qa", label: "Q&A", desc: "Questions & answers", icon: "❓", category: "special" },
];

// ---------- Icons ----------
export const SLIDE_ICONS: Record<string, string[]> = {
  technology: ["💻", "🤖", "⚡", "🔧", "📱", "🌐", "🔒", "☁️"],
  business: ["📊", "💼", "📈", "🎯", "💰", "🤝", "🏆", "📋"],
  education: ["📚", "🎓", "✏️", "🧠", "📖", "🏫", "💡", "🔬"],
  science: ["🔬", "🧪", "🌍", "⚛️", "🧬", "🔭", "💊", "🌡️"],
  health: ["❤️", "🏥", "💊", "🧘", "🏃", "🥗", "🩺", "🧬"],
  marketing: ["📣", "🎯", "📱", "💬", "🌟", "📧", "🎨", "📊"],
  finance: ["💰", "📈", "🏦", "💳", "📊", "💵", "📉", "🪙"],
  creative: ["🎨", "✨", "🎭", "🎬", "🎵", "📸", "💡", "🌈"],
  general: ["💡", "📌", "✅", "🔑", "⭐", "🎯", "📋", "💬"],
};
