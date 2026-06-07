import SEOPage from "../SEOPageTemplate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Online PPT Maker — Create PowerPoint Presentations for Free with AI",
  description: "The best free online PPT maker. Create professional PowerPoint presentations instantly with AI. No sign-up, no credit card, no watermarks. Generate, customize, and export PPTX files for free.",
  openGraph: {
    title: "Free Online PPT Maker — Create PowerPoint Presentations for Free with AI",
    description: "The best free online PPT maker. Create professional PowerPoint presentations instantly with AI. No sign-up, no credit card, no watermarks. Generate, customize, and export PPTX files for free.",
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
  "description": "The best free online PPT maker. Create professional PowerPoint presentations instantly with AI. No sign-up, no credit card, no watermarks. Generate, customize, and export PPTX files for free.",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "1250",
  },
};

const faqItems = [
      { question: "Is this PPT maker really free?", answer: "Yes, completely free. No sign-up required, no credit card needed, no watermarks on your slides. Create unlimited presentations and export them as PPTX or PDF at zero cost. Aryvora believes everyone deserves access to great presentation tools." },
      { question: "What types of presentations can I make for free?", answer: "Anything! Business presentations, pitch decks, training materials, academic lectures, project proposals, marketing decks, educational content, technical reviews, and personal presentations. Whatever you need, just type your topic and AI does the rest." },
      { question: "How is this different from PowerPoint or Google Slides?", answer: "Unlike traditional tools where you build slides manually, Aryvora's AI generates your entire presentation automatically. You provide the topic or content, and AI creates the outline, writes the slide text, and applies professional design. Then you can export as PPTX to edit further in PowerPoint." },
      { question: "Can I export my free presentations as PPTX or PDF?", answer: "Yes! After AI generates your presentation, you can export it as PPTX (PowerPoint format) or PDF. The exported files are fully editable in PowerPoint, Google Slides, Keynote, or any presentation software you prefer." }
];

export default function Page() {
  return (
    <SEOPage
      heroTitle="Free Online PPT Maker"
      heroSubtitle="Professional presentations. Zero cost. Zero hassle."
      heroDescription="The easiest way to make PowerPoint presentations online — for free. Enter any topic, paste your notes, or drop a URL. AI generates a polished, professional deck in seconds. No sign-up needed."
      ctaText="Create Free Presentation"
      faqItems={faqItems}
      schemaMarkup={{schemaMarkup}}
    />
  );
}
