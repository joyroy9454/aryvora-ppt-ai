import SEOPage from "../SEOPageTemplate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pitch Deck Generator — AI Startup Pitch Presentations",
  description: "Create professional startup pitch decks with AI. Generate investor-ready presentations with the right structure and design.",
  openGraph: {
    title: "Pitch Deck Generator — AI Startup Pitch Presentations",
    description: "Create professional startup pitch decks with AI. Generate investor-ready presentations with the right structure and design.",
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
  "description": "Create professional startup pitch decks with AI. Generate investor-ready presentations with the right structure and design.",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
  },
};

const faqItems = [
      { question: "What slides are included in a pitch deck?", answer: "Our AI creates a complete pitch deck including: Problem, Solution, Market Opportunity, Product, Business Model, Traction, Team, Competition, Financials, and Ask." },
      { question: "Which template is best for pitch decks?", answer: "The Startup Pitch template is designed specifically for investor presentations with bold, energetic design." },
      { question: "Can I customize the pitch deck?", answer: "Yes! After AI generation, you can edit every slide, change the design, add your branding, and export as PPTX or PDF." }
];

export default function Page() {
  return (
    <SEOPage
      heroTitle="Pitch Deck Generator"
      heroSubtitle="Investor-ready pitch decks with AI"
      heroDescription="Create compelling startup pitch decks in minutes. Our AI structures your pitch with the right slides — problem, solution, market, team, and ask."
      ctaText="Create Pitch Deck"
      faqItems={faqItems}
      schemaMarkup={{schemaMarkup}}
    />
  );
}
