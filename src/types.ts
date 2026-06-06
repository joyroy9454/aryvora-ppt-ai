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
  | "blank";

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
  stats?: { label: string; value: string }[];
  timeline?: { label: string; description: string }[];
  imageUrl?: string;
  imagePrompt?: string;
  notes?: string;
}

export interface Presentation {
  title: string;
  sub?: string;
  theme: "corporate" | "creative" | "minimal" | "bold";
  slides: Slide[];
}

export const SLIDE_TEMPLATES: {
  type: SlideType;
  label: string;
  desc: string;
  icon: string;
}[] = [
  { type: "content", label: "Content", desc: "Heading + bullet points", icon: "📝" },
  { type: "image-left", label: "Image Left", desc: "Image left, text right", icon: "🖼️" },
  { type: "image-right", label: "Image Right", desc: "Text left, image right", icon: "🖼️" },
  { type: "two-column", label: "Two Columns", desc: "Side-by-side comparison", icon: "📊" },
  { type: "quote", label: "Quote", desc: "Highlighted quote + author", icon: "💬" },
  { type: "comparison", label: "Comparison", desc: "Compare two options", icon: "⚖️" },
  { type: "timeline", label: "Timeline", desc: "Sequential steps", icon: "📅" },
  { type: "statistic", label: "Statistic", desc: "Key numbers + labels", icon: "📈" },
];
