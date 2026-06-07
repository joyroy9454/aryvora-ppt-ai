import SEOPage from "../SEOPageTemplate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Presentation Maker from Text — Turn Raw Text & Documents into Slides",
  description: "Transform raw text, notes, essays, or full documents into professional presentations with AI. Paste any text content and get a structured, slide-ready deck instantly. Free and no sign-up required.",
  openGraph: {
    title: "AI Presentation Maker from Text — Turn Raw Text & Documents into Slides",
    description: "Transform raw text, notes, essays, or full documents into professional presentations with AI. Paste any text content and get a structured, slide-ready deck instantly. Free and no sign-up required.",
    type: "website",
  },
  alternates: {
    canonical: "https://aryvora.com/app",
  },
};

const schemaMarkup = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Aryvora PPT AI",
  "description": "Transform raw text, notes, essays, or full documents into professional presentations with AI. Paste any text content and get a structured, slide-ready deck instantly. Free and no sign-up required.",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
  },
};

const faqItems = [
      { question: "What kind of text can I turn into a presentation?", answer: "Any text works — meeting notes, lecture transcripts, blog posts, research papers, project documentation, email threads, essay drafts, SOPs, FAQ documents, and even rough bullet points. Aryvora's AI extracts key points and structures them into slides." },
      { question: "How does AI turn raw text into organized slides?", answer: "Aryvora's AI reads your text, identifies key themes and sections, creates a logical outline, distributes content across slides, writes concise slide copy, and applies professional formatting. What would take hours manually happens in seconds." },
      { question: "Can I paste a large document?", answer: "Yes! Aryvora handles large documents — research papers, lengthy reports, multi-page SOPs, and more. The AI intelligently summarizes and prioritizes the most important content so your presentation stays focused and impactful." },
      { question: "What if my text isn't well-organized? Will it still work?", answer: "That's the best part — it works especially well with messy or unorganized text! Paste rough notes, stream-of-consciousness writing, or scattered ideas, and Aryvora will find the structure, group related points, and create a coherent narrative across your slides." }
];

export default function Page() {
  return (
    <SEOPage
      heroTitle="AI Presentation Maker from Text"
      heroSubtitle="Paste any text — get a professional deck"
      heroDescription="Stop wrestling with slide creation. Paste your raw text, notes, essays, or documents and watch AI transform them into a structured, polished presentation. From messy notes to meeting-ready slides in seconds."
      ctaText="Turn Text into Slides"
      faqItems={faqItems}
      schemaMarkup={{schemaMarkup}}
    />
  );
}
