import SEOPage from "../SEOPageTemplate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Corporate Presentation Maker — Board Meetings, All-Hands & Reports",
  description: "Create professional corporate presentations for board meetings, all-hands, quarterly reviews, and executive briefings. AI-powered, polished, and ready to present. Free to use.",
  openGraph: {
    title: "Corporate Presentation Maker — Board Meetings, All-Hands & Reports",
    description: "Create professional corporate presentations for board meetings, all-hands, quarterly reviews, and executive briefings. AI-powered and ready to present.",
    type: "website",
  },
  alternates: {
    canonical: "https://aryvora.com/app/corporate-presentation-maker",
  },
};

const schemaMarkup = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Aryvora Corporate Presentation Maker",
  "description": "Create professional corporate presentations for board meetings, all-hands, quarterly reviews, and executive briefings. AI-powered, polished, and ready to present.",
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
    icon: "🏢",
    title: "Executive-Grade Design",
    desc: "Clean, sophisticated slide designs that meet the standards of board rooms, C-suite presentations, and corporate communications.",
  },
  {
    icon: "📊",
    title: "Data Visualization Ready",
    desc: "Slides optimized for KPIs, financial data, charts, and metrics. Present complex business data in a clear, visual format.",
  },
  {
    icon: "📋",
    title: "Structured Templates",
    desc: "Pre-built structures for quarterly reviews, board meetings, all-hands, strategy decks, and executive briefings.",
  },
  {
    icon: "🔒",
    title: "Professional & Confidential",
    desc: "Your content stays private. No data is stored or shared. Create sensitive board materials with confidence.",
  },
  {
    icon: "👥",
    title: "Team Collaboration",
    desc: "Generate a deck and share it with your team for collaborative editing before the big meeting or presentation.",
  },
  {
    icon: "⏱️",
    title: "Save Hours of Work",
    desc: "What takes hours in PowerPoint takes seconds with AI. Focus on your message, not on formatting and design.",
  },
];

const steps = [
  {
    num: "1",
    title: "Enter Your Topic & Context",
    desc: "Describe your presentation topic — board meeting, quarterly review, all-hands, strategy update — and provide any key points or data.",
  },
  {
    num: "2",
    title: "AI Creates Your Deck",
    desc: "Our AI generates a structured, professional presentation with the right sections, data slides, and executive summary.",
  },
  {
    num: "3",
    title: "Add Your Data & Branding",
    desc: "Insert your specific metrics, financials, and company branding. Adjust the tone and detail level for your audience.",
  },
  {
    num: "4",
    title: "Present with Confidence",
    desc: "Download as PPTX or PDF. Walk into your board meeting or all-hands with a polished, professional deck.",
  },
];

const useCases = [
  {
    icon: "👔",
    title: "Board of Directors Meetings",
    desc: "Create structured board decks with executive summaries, financial reviews, strategic initiatives, and governance updates.",
  },
  {
    icon: "🙌",
    title: "All-Hands & Town Halls",
    desc: "Generate engaging all-hands presentations with company updates, team highlights, goals, and Q&A sections.",
  },
  {
    icon: "📈",
    title: "Quarterly Business Reviews",
    desc: "Build comprehensive QBR decks with KPI dashboards, financial performance, wins, challenges, and next-quarter plans.",
  },
  {
    icon: "🎯",
    title: "Strategy & Planning Decks",
    desc: "Create strategic planning presentations with SWOT analysis, market positioning, OKRs, and roadmap visualizations.",
  },
  {
    icon: "💰",
    title: "Financial Reports",
    desc: "Transform financial data into clear, visual presentations for stakeholders, investors, and internal reviews.",
  },
  {
    icon: "🔄",
    title: "Change Management Communications",
    desc: "Communicate organizational changes, restructures, and new initiatives with clear, structured presentations.",
  },
];

const faqItems = [
  {
    question: "Can I create board-level presentations with this tool?",
    answer: "Yes. Our Corporate Presentation Maker is designed specifically for executive and board-level content. It generates structured, professional decks with the right tone and format for high-stakes corporate meetings.",
  },
  {
    question: "Is my corporate data safe?",
    answer: "Absolutely. We don't store your content on our servers. Your sensitive financial data, strategic plans, and internal information remain completely private.",
  },
  {
    question: "Can I add my company branding to the slides?",
    answer: "Yes. After the AI generates your deck, you can customize colors, fonts, logos, and layouts to match your company's brand guidelines before exporting.",
  },
  {
    question: "What types of corporate presentations can I create?",
    answer: "You can create any corporate presentation — board meetings, quarterly reviews, all-hands, strategy decks, financial reports, project updates, change management communications, sales reviews, and executive briefings.",
  },
];

export default function Page() {
  return (
    <SEOPage
      heroTitle="Corporate Presentation Maker"
      heroSubtitle="Executive-grade decks, effortlessly"
      heroDescription="Create polished corporate presentations for board meetings, all-hands, quarterly reviews, and executive briefings. AI-powered structure with professional design — ready in minutes."
      ctaText="Create Corporate Deck"
      features={features}
      steps={steps}
      useCases={useCases}
      faqItems={faqItems}
      schemaMarkup={{schemaMarkup}}
    />
  );
}
