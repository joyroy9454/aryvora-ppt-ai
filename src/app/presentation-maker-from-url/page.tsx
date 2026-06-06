import SEOPage from "../SEOPageTemplate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Generate PPT from URL — AI Creates Presentations from Webpages",
  description: "Turn any blog post, article, or webpage into a professional presentation. Just paste the URL and let AI do the rest.",
  openGraph: {
    title: "Generate PPT from URL — AI Creates Presentations from Webpages",
    description: "Turn any blog post, article, or webpage into a professional presentation. Just paste the URL and let AI do the rest.",
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
  "description": "Turn any blog post, article, or webpage into a professional presentation. Just paste the URL and let AI do the rest.",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
  },
};

const faqItems = [
      { question: "What URLs work?", answer: "Blog posts, news articles, wiki pages, documentation, and most text-based webpages work great." },
      { question: "Does it work with any website?", answer: "Most public websites work. Some sites with heavy JavaScript or paywalls may not be accessible." },
      { question: "Can I edit the generated slides?", answer: "Yes! After generation, you have full control to edit, reorder, and customize every slide." }
];

export default function Page() {
  return (
    <SEOPage
      heroTitle="URL to Presentation"
      heroSubtitle="Any webpage. Instant presentation."
      heroDescription="Paste any URL — blog post, article, wiki page — and our AI extracts the content and creates a professional presentation."
      ctaText="Generate from URL"
      faqItems={faqItems}
      schemaMarkup={{schemaMarkup}}
    />
  );
}
