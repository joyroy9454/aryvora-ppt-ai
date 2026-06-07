import SEOPage from "../SEOPageTemplate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Training Presentation Maker — Create Onboarding & Skill Development Slides with AI",
  description: "AI-powered training presentation maker for employee onboarding, skill development workshops, compliance training, and learning programs. Generate engaging training slides from your content instantly.",
  openGraph: {
    title: "Training Presentation Maker — Create Onboarding & Skill Development Slides with AI",
    description: "AI-powered training presentation maker for employee onboarding, skill development workshops, compliance training, and learning programs. Generate engaging training slides from your content instantly.",
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
  "description": "AI-powered training presentation maker for employee onboarding, skill development workshops, compliance training, and learning programs. Generate engaging training slides from your content instantly.",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
  },
};

const faqItems = [
      { question: "What types of training presentations can I create?", answer: "You can create employee onboarding decks, compliance training sessions, skill development workshops, product knowledge training, safety procedures, soft skills workshops, leadership development programs, and department-specific training materials." },
      { question: "How does AI help create better training materials?", answer: "Aryvora's AI analyzes your training content and structures it with clear learning objectives, logical flow, engaging layouts, and summary slides. This helps learners retain information and keeps training sessions organized and professional." },
      { question: "Can I use this for new employee onboarding?", answer: "Yes! Onboarding is one of the most popular use cases. Simply provide your company overview, policies, role-specific info, and team introductions — Aryvora creates a comprehensive onboarding deck ready for Day 1." },
      { question: "Can I edit the generated training slides for my specific needs?", answer: "Absolutely. After AI generation, you can customize any slide — add your company branding, adjust content for your audience, include specific examples, add quiz slides, and reorder sections to match your training flow." }
];

export default function Page() {
  return (
    <SEOPage
      heroTitle="Training Presentation Maker"
      heroSubtitle="Onboarding decks & skill development, powered by AI"
      heroDescription="Turn your training materials, onboarding docs, and workshop outlines into polished, engaging presentations. Better training starts with better slides — let AI handle the design."
      ctaText="Build Training Deck"
      faqItems={faqItems}
      schemaMarkup={{schemaMarkup}}
    />
  );
}
