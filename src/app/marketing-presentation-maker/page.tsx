import SEOPage from "../SEOPageTemplate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Marketing Presentation Maker — Campaigns, Product Launches & Brand Decks",
  description: "Create stunning marketing presentations for campaigns, product launches, brand decks, and sales pitches. AI-generated slides that drive engagement and conversions. Free to use.",
  openGraph: {
    title: "Marketing Presentation Maker — Campaigns, Product Launches & Brand Decks",
    description: "Create stunning marketing presentations for campaigns, product launches, brand decks, and sales pitches. AI-generated slides that drive engagement.",
    type: "website",
  },
  alternates: {
    canonical: "https://aryvora.com/app/marketing-presentation-maker",
  },
};

const schemaMarkup = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Aryvora Marketing Presentation Maker",
  "description": "Create stunning marketing presentations for campaigns, product launches, brand decks, and sales pitches. AI-generated slides that drive engagement and conversions.",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
  },
};

const features = [
  {
    icon: "🚀",
    title: "Campaign-Ready Decks",
    desc: "Generate complete marketing campaign presentations with strategy, timeline, channels, budget, and KPIs all structured professionally.",
  },
  {
    icon: "🎯",
    title: "Product Launch Slides",
    desc: "Create compelling product launch presentations with feature highlights, positioning, go-to-market strategy, and launch timelines.",
  },
  {
    icon: "🎨",
    title: "Brand-Consistent Design",
    desc: "Bold, visually striking slide designs that reflect modern marketing aesthetics. Stand out in every client and stakeholder meeting.",
  },
  {
    icon: "📊",
    title: "Performance Dashboards",
    desc: "Slides optimized for marketing metrics — campaign ROI, conversion rates, channel performance, and growth analytics.",
  },
  {
    icon: "💡",
    title: "Creative Brief Format",
    desc: "Structure presentations as creative briefs with objectives, target audience, messaging, creative concepts, and deliverables.",
  },
  {
    icon: "📱",
    title: "Multi-Channel Content",
    desc: "Create presentations covering all marketing channels — social media, email, paid ads, content marketing, and offline campaigns.",
  },
];

const steps = [
  {
    num: "1",
    title: "Describe Your Marketing Goal",
    desc: "Enter your campaign objective, product details, target audience, or marketing challenge. Provide any key messaging or data points.",
  },
  {
    num: "2",
    title: "AI Generates Your Deck",
    desc: "Our AI creates a complete marketing presentation with the right structure — strategy, creative direction, timeline, budget, and success metrics.",
  },
  {
    num: "3",
    title: "Add Branding & Creative",
    desc: "Insert your brand assets, campaign visuals, ad creatives, and specific metrics. Customize the design to match your brand identity.",
  },
  {
    num: "4",
    title: "Present & Launch",
    desc: "Download as PPTX or PDF. Present to clients, stakeholders, or your team and get alignment on your marketing strategy.",
  },
];

const useCases = [
  {
    icon: "📣",
    title: "Marketing Campaign Pitches",
    desc: "Pitch new marketing campaigns to clients or internal stakeholders with professional strategy presentations.",
  },
  {
    icon: "🆕",
    title: "Product Launch Decks",
    desc: "Create comprehensive product launch presentations with market positioning, feature rollout, and launch event plans.",
  },
  {
    icon: "🏷️",
    title: "Brand Strategy Decks",
    desc: "Develop brand strategy presentations covering positioning, messaging architecture, visual identity, and brand guidelines.",
  },
  {
    icon: "📈",
    title: "Campaign Performance Reviews",
    desc: "Present campaign results with performance dashboards, ROI analysis, learnings, and optimization recommendations.",
  },
  {
    icon: "🤝",
    title: "Client Proposals",
    desc: "Create winning client proposals with scope of work, strategy overview, timeline, and investment breakdown.",
  },
  {
    icon: "📱",
    title: "Social Media Strategy",
    desc: "Build social media strategy presentations with platform-specific plans, content calendars, and engagement tactics.",
  },
];

const faqItems = [
  {
    question: "Can I create a product launch presentation?",
    answer: "Yes! Enter your product name, key features, target market, and launch timeline. The AI generates a complete product launch deck with positioning, go-to-market strategy, and launch event planning slides.",
  },
  {
    question: "Is this suitable for client-facing presentations?",
    answer: "Absolutely. Our Marketing Presentation Maker creates polished, professional decks that are perfect for client pitches, agency presentations, and stakeholder reviews. The designs are modern and visually impressive.",
  },
  {
    question: "Can I include marketing metrics and KPIs?",
    answer: "Yes. The AI creates slides specifically designed for marketing data — campaign metrics, conversion funnels, channel performance, ROI calculations, and growth charts. Add your specific numbers after generation.",
  },
  {
    question: "How is this different from a regular presentation tool?",
    answer: "Our Marketing Presentation Maker is specifically designed for marketing use cases. It includes campaign structures, product launch frameworks, brand strategy templates, and performance dashboard layouts that generic tools don't offer.",
  },
];

export default function Page() {
  return (
    <SEOPage
      heroTitle="Marketing Presentation Maker"
      heroSubtitle="Campaigns, launches & brand decks"
      heroDescription="Create high-impact marketing presentations for campaigns, product launches, brand strategies, and sales pitches. AI-powered slides that look stunning and drive results."
      ctaText="Create Marketing Deck"
      features={features}
      steps={steps}
      useCases={useCases}
      faqItems={faqItems}
      schemaMarkup={{schemaMarkup}}
    />
  );
}
