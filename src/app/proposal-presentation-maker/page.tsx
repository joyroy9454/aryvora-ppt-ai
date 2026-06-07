import SEOPage from "../SEOPageTemplate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Proposal Presentation Maker — Create Project Proposals & RFP Responses with AI",
  description: "AI-powered proposal presentation maker for project proposals, RFP responses, business cases, and client pitches. Generate compelling, structured proposal decks that win deals.",
  openGraph: {
    title: "Proposal Presentation Maker — Create Project Proposals & RFP Responses with AI",
    description: "AI-powered proposal presentation maker for project proposals, RFP responses, business cases, and client pitches. Generate compelling, structured proposal decks that win deals.",
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
  "description": "AI-powered proposal presentation maker for project proposals, RFP responses, business cases, and client pitches. Generate compelling, structured proposal decks that win deals.",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
  },
};

const faqItems = [
      { question: "What slides should a proposal presentation include?", answer: "Aryvora structures proposal decks with key sections: Executive Summary, Problem Statement, Proposed Solution, Scope of Work, Timeline & Milestones, Team & Qualifications, Pricing Overview, Case Studies, and Call to Action. Each section is designed to build your case." },
      { question: "Can I use this for RFP responses?", answer: "Yes! RFP responses are a perfect use case. Paste the RFP requirements and your solution details — Aryvora creates a structured response deck that addresses each requirement clearly, showing evaluators you've covered every point." },
      { question: "How quickly can I generate a proposal deck?", answer: "Most proposal presentations are generated in under 60 seconds. Enter your project details, scope, and budget info, and Aryvora creates a complete proposal deck that you can then customize with your branding and specific case studies." },
      { question: "Can I customize the proposal with my company branding?", answer: "Absolutely. After generation, you can add your logo, brand colors, swap slides, edit text, and tailor the proposal to each specific client or RFP. Export as PPTX or PDF to send directly to prospects." }
];

export default function Page() {
  return (
    <SEOPage
      heroTitle="Proposal Presentation Maker"
      heroSubtitle="Win more deals with AI-crafted proposals"
      heroDescription="Create compelling project proposals, RFP responses, and business cases in minutes. AI structures your content into a persuasive narrative — scope, timeline, pricing, and impact — all in a professional deck."
      ctaText="Create Proposal Deck"
      faqItems={faqItems}
      schemaMarkup={{schemaMarkup}}
    />
  );
}
