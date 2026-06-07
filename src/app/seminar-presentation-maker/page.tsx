import SEOPage from "../SEOPageTemplate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Seminar Presentation Maker — Educational Seminars & Public Lectures",
  description: "Create engaging seminar presentations for educational seminars, public lectures, workshops, and training sessions. AI-generated slides that keep your audience focused. Free to use.",
  openGraph: {
    title: "Seminar Presentation Maker — Educational Seminars & Public Lectures",
    description: "Create engaging seminar presentations for educational seminars, public lectures, workshops, and training sessions. AI-generated slides that keep your audience focused.",
    type: "website",
  },
  alternates: {
    canonical: "https://aryvora.com/app/seminar-presentation-maker",
  },
};

const schemaMarkup = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Aryvora Seminar Presentation Maker",
  "description": "Create engaging seminar presentations for educational seminars, public lectures, workshops, and training sessions. AI-generated slides that keep your audience focused.",
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
    icon: "🎓",
    title: "Education-Focused Design",
    desc: "Slides designed for learning — clear visuals, structured content, and engaging layouts that support knowledge transfer.",
  },
  {
    icon: "📚",
    title: "Topic-Based Generation",
    desc: "Enter any seminar topic and the AI creates a complete presentation with introduction, key concepts, examples, and summary.",
  },
  {
    icon: "🗣️",
    title: "Speaker Notes Support",
    desc: "Each slide is structured to work with speaker notes, giving you talking points while keeping slides clean and visual.",
  },
  {
    icon: "🧩",
    title: "Modular Slide Structure",
    desc: "Easily add, remove, or reorder sections. Customize the depth and detail level for your specific audience and time slot.",
  },
  {
    icon: "🎨",
    title: "Visual & Engaging",
    desc: "Break away from text-heavy slides. AI creates visually engaging presentations that keep seminar attendees focused.",
  },
  {
    icon: "📋",
    title: "Handout-Ready",
    desc: "Export slides as handouts or supplementary materials for your seminar attendees to take home and reference.",
  },
];

const steps = [
  {
    num: "1",
    title: "Enter Your Seminar Topic",
    desc: "Type your seminar title, key topics, learning objectives, or any notes you have. The more context, the better the output.",
  },
  {
    num: "2",
    title: "AI Builds Your Presentation",
    desc: "Our AI creates a structured seminar presentation with an engaging introduction, well-organized content sections, examples, and a strong conclusion.",
  },
  {
    num: "3",
    title: "Customize for Your Audience",
    desc: "Adjust the content depth, add case studies, insert discussion questions, and tailor the design to your audience's level.",
  },
  {
    num: "4",
    title: "Present & Share",
    desc: "Download as PPTX or PDF. Present with confidence and share materials with attendees after the seminar.",
  },
];

const useCases = [
  {
    icon: "🏫",
    title: "University & College Seminars",
    desc: "Create academic seminar presentations for undergraduate and graduate courses across any discipline.",
  },
  {
    icon: "🎤",
    title: "Public Lectures & Talks",
    desc: "Design engaging public lecture slides for community events, library talks, and guest speaker series.",
  },
  {
    icon: "🛠️",
    title: "Workshop Presentations",
    desc: "Build interactive workshop slides with step-by-step instructions, exercises, and participant activities.",
  },
  {
    icon: "📖",
    title: "Training & Professional Development",
    desc: "Create training seminar materials for corporate learning, professional development, and skill-building sessions.",
  },
  {
    icon: "🔬",
    title: "Research Seminars",
    desc: "Present research findings at departmental seminars, journal clubs, and academic research group meetings.",
  },
  {
    icon: "🌍",
    title: "Community Education",
    desc: "Develop educational presentations for community centers, non-profit workshops, and public awareness campaigns.",
  },
];

const faqItems = [
  {
    question: "Can I create seminar slides for any subject?",
    answer: "Yes! Our AI works across all academic disciplines and topics — from science and technology to humanities, business, arts, and social sciences. Just enter your topic and any key points you want to cover.",
  },
  {
    question: "How do I handle different audience levels?",
    answer: "After generating your presentation, you can easily adjust the content depth. Simplify for general audiences or add technical detail for expert audiences. The modular structure makes this simple.",
  },
  {
    question: "Can I include discussion questions in my slides?",
    answer: "Absolutely. You can add discussion prompts, Q&A slides, and interactive elements after the AI generates your base presentation. We recommend adding these between major sections.",
  },
  {
    question: "Is this suitable for virtual or hybrid seminars?",
    answer: "Yes. Our slides are designed to work well both in-person and on-screen. For virtual seminars, we recommend using the visual-focused layouts that read well on smaller screens and video calls.",
  },
];

export default function Page() {
  return (
    <SEOPage
      heroTitle="Seminar Presentation Maker"
      heroSubtitle="Engaging slides for every seminar"
      heroDescription="Create compelling seminar presentations for educational events, public lectures, workshops, and training sessions. AI-generated content with clear structure and visual appeal."
      ctaText="Create Seminar Slides"
      features={features}
      steps={steps}
      useCases={useCases}
      faqItems={faqItems}
      schemaMarkup={{schemaMarkup}}
    />
  );
}
