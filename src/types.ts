export interface Slide {
  id: string;
  type: "title" | "content" | "two-column" | "closing";
  heading: string;
  sub?: string;
  bullets?: string[];
  leftCol?: string[];
  rightCol?: string[];
}

export interface Presentation {
  title: string;
  sub?: string;
  theme: "corporate" | "creative" | "minimal" | "bold";
  slides: Slide[];
}
