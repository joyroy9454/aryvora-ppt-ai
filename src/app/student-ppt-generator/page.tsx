import SEOPage from "../SEOPageTemplate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student PPT Generator — Free AI Presentations for Students",
  description: "Free AI presentation generator for students. Create class presentations, seminar slides, and project decks instantly. No sign-up.",
  openGraph: {
    title: "Student PPT Generator — Free AI Presentations for Students",
    description: "Free AI presentation generator for students. Create class presentations, seminar slides, and project decks instantly. No sign-up.",
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
  "description": "Free AI presentation generator for students. Create class presentations, seminar slides, and project decks instantly. No sign-up.",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
  },
};

const faqItems = [
      { question: "Is this really free for students?", answer: "Yes! Aryvora is free for everyone — students, teachers, professionals. No sign-up required." },
      { question: "What templates work for student presentations?", answer: "We recommend the Student Seminar, Education, and Academic templates for class presentations." },
      { question: "Can I use this for group projects?", answer: "Absolutely. Generate the presentation, export as PPTX, and share with your team for collaboration." }
];

export default function Page() {
  return (
    <SEOPage
      heroTitle="Student PPT Generator"
      heroSubtitle="Free AI presentations for students"
      heroDescription="Create class presentations, seminar slides, and project decks in seconds. Designed for students — simple, fast, and free."
      ctaText="Create Student PPT"
      faqItems={faqItems}
      schemaMarkup={{schemaMarkup}}
    />
  );
}
