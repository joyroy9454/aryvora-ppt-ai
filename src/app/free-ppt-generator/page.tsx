import SEOPage from "../SEOPageTemplate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free PPT Generator — No Sign-up Required",
  description: "Create professional PowerPoint presentations for free. No registration, no login, no payments. Generate, edit, and download instantly.",
  openGraph: {
    title: "Free PPT Generator — No Sign-up Required",
    description: "Create professional PowerPoint presentations for free. No registration, no login, no payments. Generate, edit, and download instantly.",
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
  "description": "Create professional PowerPoint presentations for free. No registration, no login, no payments. Generate, edit, and download instantly.",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
  },
};

const faqItems = [
      { question: "Do I need to create an account?", answer: "No! Aryvora works without any sign-up or registration. Just enter your content and generate." },
      { question: "Are there any hidden costs?", answer: "No. Aryvora is 100% free. No premium plans, no credit card required." },
      { question: "What export formats are supported?", answer: "You can export as PPTX (PowerPoint), PDF, Markdown, and speaker notes." },
      { question: "Is there a limit on presentations?", answer: "No limits. Generate as many presentations as you need." }
];

export default function Page() {
  return (
    <SEOPage
      heroTitle="Free PPT Generator"
      heroSubtitle="No sign-up. No payments. Just results."
      heroDescription="The only presentation tool you need — completely free, no registration required. Create professional slides in seconds."
      ctaText="Create Free PPT"
      faqItems={faqItems}
      schemaMarkup={{schemaMarkup}}
    />
  );
}
