import SEOPage from "../SEOPageTemplate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Turn Notes into Presentations — AI Notes to PPT",
  description: "Transform your rough notes, lecture notes, or meeting notes into polished AI presentations. Paste your notes and get a structured deck.",
  openGraph: {
    title: "Turn Notes into Presentations — AI Notes to PPT",
    description: "Transform your rough notes, lecture notes, or meeting notes into polished AI presentations. Paste your notes and get a structured deck.",
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
  "description": "Transform your rough notes, lecture notes, or meeting notes into polished AI presentations. Paste your notes and get a structured deck.",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
  },
};

const faqItems = [
      { question: "What format should my notes be in?", answer: "Any format works! Paste plain text, bullet points, or even rough paragraphs. The AI will structure everything." },
      { question: "Can I upload a file?", answer: "You can paste text directly or upload .txt and .md files. For PDFs, copy and paste the text content." },
      { question: "Will the AI preserve my key points?", answer: "Yes. The AI extracts and organizes your key points into well-structured slides while improving clarity and flow." }
];

export default function Page() {
  return (
    <SEOPage
      heroTitle="Notes to Presentation"
      heroSubtitle="Your notes. Our AI. Perfect slides."
      heroDescription="Paste your rough notes, lecture notes, or meeting notes. Our AI structures them into a clear, professional presentation with proper headings and flow."
      ctaText="Convert Notes"
      faqItems={faqItems}
      schemaMarkup={{schemaMarkup}}
    />
  );
}
