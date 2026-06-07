import SEOPage from "../SEOPageTemplate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Product Demo Presenter — Create Feature Walkthroughs & UX Showcases with AI",
  description: "AI-powered product demo presenter for feature walkthroughs, UX showcases, product launches, and sales demos. Generate stunning product presentation decks that highlight your product's best features.",
  openGraph: {
    title: "Product Demo Presenter — Create Feature Walkthroughs & UX Showcases with AI",
    description: "AI-powered product demo presenter for feature walkthroughs, UX showcases, product launches, and sales demos. Generate stunning product presentation decks that highlight your product's best features.",
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
  "description": "AI-powered product demo presenter for feature walkthroughs, UX showcases, product launches, and sales demos. Generate stunning product presentation decks that highlight your product's best features.",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
  },
};

const faqItems = [
      { question: "What makes a great product demo presentation?", answer: "A great product demo tells a story: start with the problem your audience faces, show how your product solves it, walk through key features with clear benefits, showcase the UX, and end with a strong call to action. Aryvora structures your demo to follow this proven framework." },
      { question: "Can I create different demos for different audiences?", answer: "Yes! You can create tailored demos for executives (high-level ROI focus), technical buyers (feature deep-dives and integrations), end-users (UX walkthroughs), and investors (market positioning and growth metrics). Each version from the same base content." },
      { question: "How do I showcase UX in a presentation?", answer: "Aryvora helps you structure UX-focused slides with sections for user flow, interface highlights, design philosophy, user benefits, and before/after comparisons. Describe your UX flow and the AI creates slides that showcase each step clearly." },
      { question: "Is this useful for product launches?", answer: "Absolutely. Product launch presentations need to generate excitement while clearly communicating value. Aryvora creates launch decks with product story, key features, competitive advantages, launch timeline, and availability info — all in a polished format." }
];

export default function Page() {
  return (
    <SEOPage
      heroTitle="Product Demo Presenter"
      heroSubtitle="Feature walkthroughs & UX showcases, made easy"
      heroDescription="Create stunning product demo presentations that convert. Whether it's a feature walkthrough, UX showcase, or product launch — AI transforms your product specs into a compelling visual story."
      ctaText="Build Product Demo"
      faqItems={faqItems}
      schemaMarkup={{schemaMarkup}}
    />
  );
}
