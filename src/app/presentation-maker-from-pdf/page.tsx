import SEOPage from "../SEOPageTemplate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Convert PDF to Presentation — AI PDF to PPT",
  description: "Turn any PDF document into a professional PowerPoint presentation. Extract key content and generate structured slides automatically.",
  openGraph: {
    title: "Convert PDF to Presentation — AI PDF to PPT",
    description: "Turn any PDF document into a professional PowerPoint presentation. Extract key content and generate structured slides automatically.",
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
  "description": "Turn any PDF document into a professional PowerPoint presentation. Extract key content and generate structured slides automatically.",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
  },
};

const faqItems = [
      { question: "How do I convert a PDF?", answer: "Open your PDF, copy the text content, and paste it into the input area. The AI will create a presentation from the extracted content." },
      { question: "What types of PDFs work best?", answer: "Research papers, reports, articles, and any text-heavy PDFs work great. The AI extracts key points and structures them into slides." },
      { question: "Is there a file size limit?", answer: "For best results, paste up to 10,000 characters of text. For longer documents, paste the most important sections." }
];

export default function Page() {
  return (
    <SEOPage
      heroTitle="PDF to Presentation"
      heroSubtitle="Transform documents into presentations"
      heroDescription="Copy text from any PDF and paste it here. Our AI extracts the key content and creates a structured, professional presentation."
      ctaText="Convert PDF"
      faqItems={faqItems}
      schemaMarkup={{schemaMarkup}}
    />
  );
}
