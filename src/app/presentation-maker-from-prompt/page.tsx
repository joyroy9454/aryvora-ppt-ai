import SEOPage from "../SEOPageTemplate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Presentation Maker from Prompt — AI Creates Your Slides",
  description: "Turn a simple prompt or topic into a complete AI-generated presentation. Just describe what you need and get a professional deck.",
  openGraph: {
    title: "Presentation Maker from Prompt — AI Creates Your Slides",
    description: "Turn a simple prompt or topic into a complete AI-generated presentation. Just describe what you need and get a professional deck.",
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
  "description": "Turn a simple prompt or topic into a complete AI-generated presentation. Just describe what you need and get a professional deck.",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
  },
};

const faqItems = [
      { question: "What kind of prompts work best?", answer: "Be specific about your topic, audience, and purpose. For example: 'Create a 10-slide presentation about renewable energy for high school students' works great." },
      { question: "Can I specify the number of slides?", answer: "Yes! You can set the slide count or let the AI decide the optimal length based on your content." },
      { question: "How long does generation take?", answer: "Most presentations are generated in 30-60 seconds, depending on length and complexity." }
];

export default function Page() {
  return (
    <SEOPage
      heroTitle="Presentation Maker from Prompt"
      heroSubtitle="One prompt. One perfect presentation."
      heroDescription="Describe your presentation topic in a few words or sentences. Our AI understands your intent and creates a tailored, professional deck."
      ctaText="Create from Prompt"
      faqItems={faqItems}
      schemaMarkup={{schemaMarkup}}
    />
  );
}
