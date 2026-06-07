import SEOPage from "../SEOPageTemplate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Technical Presentation Maker — Create Architecture & Engineering Slides with AI",
  description: "AI-powered technical presentation maker for architecture reviews, engineering docs, system design, and technical deep-dives. Generate structured, professional slides from your technical content in seconds.",
  openGraph: {
    title: "Technical Presentation Maker — Create Architecture & Engineering Slides with AI",
    description: "AI-powered technical presentation maker for architecture reviews, engineering docs, system design, and technical deep-dives. Generate structured, professional slides from your technical content in seconds.",
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
  "description": "AI-powered technical presentation maker for architecture reviews, engineering docs, system design, and technical deep-dives. Generate structured, professional slides from your technical content in seconds.",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
  },
};

const faqItems = [
      { question: "What types of technical presentations can I create?", answer: "You can create architecture review boards, engineering design docs, system design presentations, technical deep-dive sessions, API documentation summaries, infrastructure overviews, sprint technical reviews, and more. Aryvora structures your technical content into clear, professional slides." },
      { question: "Can I include code snippets and diagrams in my slides?", answer: "Yes! Aryvora's AI can incorporate code snippets, data flow descriptions, and diagram references into your technical slides. Simply paste your technical content and the AI will format it appropriately for presentation." },
      { question: "Is the technical presentation maker suitable for engineering teams?", answer: "Absolutely. Engineering teams use Aryvora to quickly prepare architecture reviews, on-call handoff presentations, technical decision records, incident postmortems, and sprint demos. It saves hours of slide preparation time." },
      { question: "Do I need design skills to create technical presentations?", answer: "No design skills needed. Aryvora automatically applies clean, professional layouts optimized for technical content. Your engineering docs and notes are transformed into presentation-ready slides with proper hierarchy, spacing, and readability." }
];

export default function Page() {
  return (
    <SEOPage
      heroTitle="Technical Presentation Maker"
      heroSubtitle="Architecture reviews & engineering docs, simplified"
      heroDescription="Transform your technical content — architecture docs, system designs, engineering specs — into clear, structured presentations. No more wrestling with slide formatting during sprint reviews."
      ctaText="Create Technical Deck"
      faqItems={faqItems}
      schemaMarkup={{schemaMarkup}}
    />
  );
}
