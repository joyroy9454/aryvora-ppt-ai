import SEOPage from "../SEOPageTemplate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Business Pitch Deck Generator — AI Startup Investor Presentations",
  description: "Create investor-ready business pitch decks with AI. Generate professional startup presentations with the right structure, compelling slides, and data-driven storytelling. Free to use.",
  openGraph: {
    title: "Business Pitch Deck Generator — AI Startup Investor Presentations",
    description: "Create investor-ready business pitch decks with AI. Generate professional startup presentations with the right structure and compelling slides.",
    type: "website",
  },
  alternates: {
    canonical: "https://aryvora.com/app/business-pitch-deck-generator",
  },
};

const schemaMarkup = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Aryvora Business Pitch Deck Generator",
  "description": "Create investor-ready business pitch decks with AI. Generate professional startup presentations with the right structure, compelling slides, and data-driven storytelling.",
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
    icon: "📊",
    title: "Investor-Ready Structure",
    desc: "AI generates the standard pitch deck flow: Problem, Solution, Market, Product, Traction, Business Model, Team, Competition, Financials, and Ask.",
  },
  {
    icon: "💡",
    title: "Compelling Storytelling",
    desc: "Each slide is crafted to tell a persuasive narrative that keeps investors engaged from the opening hook to the closing ask.",
  },
  {
    icon: "📈",
    title: "Data-Driven Slides",
    desc: "Automatically creates slides optimized for market data, financial projections, growth metrics, and competitive analysis.",
  },
  {
    icon: "🎯",
    title: "Tailored to Your Startup",
    desc: "Input your company details, industry, and stage — the AI customizes every slide to match your specific business context.",
  },
  {
    icon: "🖼️",
    title: "Professional Design",
    desc: "Clean, modern slide designs that look polished and credible. No design skills needed — just professional results.",
  },
  {
    icon: "⚡",
    title: "Generate in Minutes",
    desc: "Go from idea to a complete pitch deck in under 5 minutes. Iterate quickly and refine your story before the big meeting.",
  },
];

const steps = [
  {
    num: "1",
    title: "Describe Your Startup",
    desc: "Enter your company name, industry, target market, and what problem you solve. The more detail you provide, the better the deck.",
  },
  {
    num: "2",
    title: "AI Builds Your Deck",
    desc: "Our AI creates a complete pitch deck with all the essential slides, structured to follow proven investor presentation frameworks.",
  },
  {
    num: "3",
    title: "Customize & Refine",
    desc: "Edit any slide to add your specific metrics, branding, team photos, and financial details. Make it uniquely yours.",
  },
  {
    num: "4",
    title: "Export & Pitch",
    desc: "Download as PPTX or PDF. Practice your delivery and walk into your investor meeting with confidence.",
  },
];

const useCases = [
  {
    icon: "🚀",
    title: "Seed & Series A Fundraising",
    desc: "Create compelling decks for early-stage fundraising rounds. Structure your narrative to maximize investor interest.",
  },
  {
    icon: "🏆",
    title: "Startup Competitions",
    desc: "Generate pitch decks for demo days, accelerator applications, and startup competitions with tight deadlines.",
  },
  {
    icon: "🤝",
    title: "Angel Investor Meetings",
    desc: "Prepare concise, impactful presentations for one-on-one angel investor meetings and networking events.",
  },
  {
    icon: "📋",
    title: "Accelerator Applications",
    desc: "Create supporting pitch decks for Y Combinator, Techstars, and other accelerator program applications.",
  },
  {
    icon: "💼",
    title: "Board & Stakeholder Updates",
    desc: "Adapt your pitch deck format for board meetings, stakeholder updates, and strategic planning sessions.",
  },
  {
    icon: "🌐",
    title: "Virtual Pitch Events",
    desc: "Design visually engaging decks optimized for virtual pitch events, webinars, and online demo days.",
  },
];

const faqItems = [
  {
    question: "What slides are included in an AI-generated pitch deck?",
    answer: "Our AI generates a complete 10-12 slide pitch deck including: Title/Hook, Problem, Solution, Market Opportunity, Product Demo, Business Model, Traction, Competitive Landscape, Team, Financials, The Ask, and Contact slide.",
  },
  {
    question: "Can I customize the pitch deck for my specific industry?",
    answer: "Absolutely. Enter your industry, target market, and business details when generating. The AI tailors the content, terminology, and slide structure to your specific sector — whether it's SaaS, fintech, healthtech, e-commerce, or any other industry.",
  },
  {
    question: "Is this suitable for serious investor meetings?",
    answer: "Yes. Our AI follows proven pitch deck frameworks used by successful startups. However, we recommend reviewing and customizing the content with your specific data, metrics, and branding before any investor meeting.",
  },
  {
    question: "How is this different from a regular presentation generator?",
    answer: "The Business Pitch Deck Generator is specifically optimized for startup fundraising. It uses investor-focused slide structures, persuasive storytelling frameworks, and includes slides specifically designed for financials, market sizing, and the investment ask — elements that generic presentation tools often miss.",
  },
];

export default function Page() {
  return (
    <SEOPage
      heroTitle="Business Pitch Deck Generator"
      heroSubtitle="Investor-ready decks in minutes"
      heroDescription="Tell us about your startup and our AI creates a complete, investor-ready pitch deck. Professional structure, compelling storytelling, and polished design — all generated in seconds."
      ctaText="Generate Pitch Deck"
      features={features}
      steps={steps}
      useCases={useCases}
      faqItems={faqItems}
      schemaMarkup={{schemaMarkup}}
    />
  );
}
