import SEOPage from "../SEOPageTemplate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI PPT Generator — Create Presentations with AI in Seconds",
  description: "Free AI PowerPoint generator. Transform any topic, notes, or URL into a professional presentation instantly. No sign-up required.",
  openGraph: {
    title: "AI PPT Generator — Create Presentations with AI in Seconds",
    description: "Free AI PowerPoint generator. Transform any topic, notes, or URL into a professional presentation instantly. No sign-up required.",
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
  "description": "Free AI PowerPoint generator. Transform any topic, notes, or URL into a professional presentation instantly. No sign-up required.",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
  },
};

const faqItems = [
      { question: "How does the AI PPT generator work?", answer: "Simply enter your topic, notes, or any content. Our AI analyzes the input, creates an outline, generates slides with professional design, and lets you export as PPTX or PDF." },
      { question: "Is the AI PPT generator free?", answer: "Yes! Aryvora is completely free to use. No sign-up, no credit card, no hidden fees." },
      { question: "What types of presentations can I create?", answer: "You can create any type of presentation — business reports, academic lectures, pitch decks, marketing presentations, educational content, and more." },
      { question: "Can I edit the AI-generated slides?", answer: "Absolutely. After generation, you can edit any slide text, change layouts, reorder slides, add images, and customize everything before exporting." }
];

export default function Page() {
  return (
    <SEOPage
      heroTitle="AI PPT Generator"
      heroSubtitle="Create stunning presentations with AI"
      heroDescription="Enter any topic, notes, PDF content, or URL — our AI generates a complete, professional PowerPoint presentation in seconds. No design skills needed."
      ctaText="Generate with AI"
      faqItems={faqItems}
      schemaMarkup={{schemaMarkup}}
    />
  );
}
