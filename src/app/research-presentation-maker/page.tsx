import SEOPage from "../SEOPageTemplate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Research Presentation Maker — Academic Conferences & Thesis Defenses",
  description: "Create academic research presentations for conferences, thesis defenses, and scholarly meetings. AI-powered slides with proper academic structure and citation-ready formats. Free to use.",
  openGraph: {
    title: "Research Presentation Maker — Academic Conferences & Thesis Defenses",
    description: "Create academic research presentations for conferences, thesis defenses, and scholarly meetings. AI-powered slides with proper academic structure.",
    type: "website",
  },
  alternates: {
    canonical: "https://aryvora.com/app/research-presentation-maker",
  },
};

const schemaMarkup = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Aryvora Research Presentation Maker",
  "description": "Create academic research presentations for conferences, thesis defenses, and scholarly meetings. AI-powered slides with proper academic structure and citation-ready formats.",
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
    icon: "🔬",
    title: "Academic Structure",
    desc: "Follows standard research presentation format: Introduction, Literature Review, Methodology, Results, Discussion, Conclusion, and Future Work.",
  },
  {
    icon: "📊",
    title: "Data & Results Slides",
    desc: "Specialized slide layouts for presenting research data, statistical analysis, charts, graphs, and experimental results clearly.",
  },
  {
    icon: "📖",
    title: "Citation-Ready Format",
    desc: "Slides structured to include references, citations, and bibliography sections in academic format.",
  },
  {
    icon: "🎓",
    title: "Thesis Defense Optimized",
    desc: "Templates specifically designed for thesis and dissertation defense presentations with committee-friendly structure.",
  },
  {
    icon: "🧮",
    title: "Methodology Visualization",
    desc: "Clear, visual representations of research methodology, experimental design, and analytical frameworks.",
  },
  {
    icon: "⏱️",
    title: "Time-Conscious Design",
    desc: "Generate presentations that fit standard conference time slots (15-20 min) or longer thesis defense formats.",
  },
];

const steps = [
  {
    num: "1",
    title: "Enter Your Research Details",
    desc: "Provide your research title, abstract, key findings, methodology, and any specific sections you need. Paste from your paper or notes.",
  },
  {
    num: "2",
    title: "AI Structures Your Presentation",
    desc: "Our AI organizes your research into a logical presentation flow following academic conventions — from background to conclusions.",
  },
  {
    num: "3",
    title: "Refine & Add Visuals",
    desc: "Customize each slide with your specific data, charts, and figures. Add citations and adjust the level of technical detail.",
  },
  {
    num: "4",
    title: "Defend & Present",
    desc: "Download as PPTX or PDF. Present at your conference or thesis defense with a polished, academically-structured deck.",
  },
];

const useCases = [
  {
    icon: "🎓",
    title: "Thesis & Dissertation Defenses",
    desc: "Create comprehensive defense presentations that cover your entire research journey — from motivation to contributions.",
  },
  {
    icon: "🏛️",
    title: "Academic Conferences",
    desc: "Generate conference presentation slides that fit time constraints while covering all essential research elements.",
  },
  {
    icon: "📝",
    title: "Research Paper Presentations",
    desc: "Turn published or working papers into presentation format for seminars, workshops, and journal clubs.",
  },
  {
    icon: "👥",
    title: "Lab Group Meetings",
    desc: "Create progress update presentations for regular lab meetings, research group syncs, and advisor check-ins.",
  },
  {
    icon: "🏆",
    title: "Poster-to-Slide Conversion",
    desc: "Transform conference poster content into a full slide presentation for oral presentation sessions.",
  },
  {
    icon: "📚",
    title: "Literature Review Presentations",
    desc: "Present systematic literature reviews with structured summaries, comparison tables, and gap analysis slides.",
  },
];

const faqItems = [
  {
    question: "Can I create a thesis defense presentation with this tool?",
    answer: "Yes! Our Research Presentation Maker is specifically designed for thesis and dissertation defenses. It follows the standard academic structure: Introduction, Literature Review, Methodology, Results, Discussion, Conclusion, and Future Work.",
  },
  {
    question: "How do I handle data-heavy research slides?",
    answer: "The AI creates slides optimized for data presentation — with clear chart layouts, results summaries, and visual representations. You can then insert your specific figures, tables, and statistical outputs into the generated structure.",
  },
  {
    question: "Can I include citations and references on my slides?",
    answer: "Yes. The template includes dedicated reference and citation slides. You can add in-text citations on content slides and a full bibliography at the end, formatted to your required citation style.",
  },
  {
    question: "Is this suitable for different academic fields?",
    answer: "Absolutely. Whether you're in STEM, social sciences, humanities, or any other field, the AI adapts the presentation structure to follow the conventions of your discipline. Just provide your research content and the AI handles the formatting.",
  },
];

export default function Page() {
  return (
    <SEOPage
      heroTitle="Research Presentation Maker"
      heroSubtitle="Academic slides for research excellence"
      heroDescription="Create structured academic research presentations for conferences, thesis defenses, and scholarly meetings. AI-powered formatting with proper academic conventions — from methodology to conclusions."
      ctaText="Create Research Slides"
      features={features}
      steps={steps}
      useCases={useCases}
      faqItems={faqItems}
      schemaMarkup={{schemaMarkup}}
    />
  );
}
