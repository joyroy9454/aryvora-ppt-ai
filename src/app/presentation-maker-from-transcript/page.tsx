import SEOPage from "../SEOPageTemplate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Presentation Maker from Transcript — YouTube, Podcast & Speech to Slides",
  description: "Turn any transcript into a professional presentation. Paste YouTube, podcast, or speech transcripts and our AI generates structured, engaging slides instantly. Free, no sign-up required.",
  openGraph: {
    title: "Presentation Maker from Transcript — YouTube, Podcast & Speech to Slides",
    description: "Turn any transcript into a professional presentation. Paste YouTube, podcast, or speech transcripts and our AI generates structured, engaging slides instantly.",
    type: "website",
  },
  alternates: {
    canonical: "https://aryvora.com/app/presentation-maker-from-transcript",
  },
};

const schemaMarkup = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Aryvora Transcript to Presentation",
  "description": "Turn any transcript into a professional presentation. Paste YouTube, podcast, or speech transcripts and our AI generates structured, engaging slides instantly.",
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
    icon: "🎙️",
    title: "Multi-Source Transcripts",
    desc: "Works with YouTube auto-generated captions, podcast transcripts, interview notes, and speech transcripts from any source.",
  },
  {
    icon: "📝",
    title: "Smart Content Extraction",
    desc: "AI identifies key topics, quotes, and insights from long transcripts and organizes them into clear, focused slides.",
  },
  {
    icon: "🎨",
    title: "Professional Slide Design",
    desc: "Automatically applies clean, modern layouts with speaker quotes, timestamps, and visual hierarchy for maximum impact.",
  },
  {
    icon: "✂️",
    title: "Auto-Summarization",
    desc: "Long transcripts are condensed into concise slide content — no more walls of text, just the essential points.",
  },
  {
    icon: "🔄",
    title: "Easy Editing",
    desc: "Regenerate, reorder, or edit any slide after generation. Add your own branding, images, and speaker notes.",
  },
  {
    icon: "📤",
    title: "Export Anywhere",
    desc: "Download as PPTX or PDF. Present directly or share with your team, students, or audience.",
  },
];

const steps = [
  {
    num: "1",
    title: "Paste Your Transcript",
    desc: "Copy the transcript from YouTube, a podcast app, or any speech. Paste it into the input field — raw text works perfectly.",
  },
  {
    num: "2",
    title: "AI Analyzes & Structures",
    desc: "Our AI reads the full transcript, identifies key themes, extracts important quotes, and creates a logical slide outline.",
  },
  {
    num: "3",
    title: "Review & Customize",
    desc: "Review the generated slides. Edit text, adjust layouts, add images, and tailor the presentation to your needs.",
  },
  {
    num: "4",
    title: "Export & Present",
    desc: "Download your finished presentation as PPTX or PDF. Ready to present, share, or upload to any platform.",
  },
];

const useCases = [
  {
    icon: "📺",
    title: "YouTube Video Summaries",
    desc: "Turn educational YouTube videos into study guides or teaching materials for classrooms and workshops.",
  },
  {
    icon: "🎧",
    title: "Podcast Episode Recaps",
    desc: "Create visual summaries of podcast episodes for social media, blog posts, or team knowledge sharing.",
  },
  {
    icon: "🎤",
    title: "Conference Talk Slides",
    desc: "Convert recorded conference talks and keynotes into shareable slide decks for attendees and followers.",
  },
  {
    icon: "📰",
    title: "Interview Highlights",
    desc: "Transform long-form interviews into focused presentations highlighting the most impactful quotes and insights.",
  },
  {
    icon: "🏫",
    title: "Lecture & Course Content",
    desc: "Turn recorded lectures into structured slide decks for students, online courses, and training programs.",
  },
  {
    icon: "💼",
    title: "Meeting & Call Notes",
    desc: "Convert meeting transcripts and call recordings into actionable presentations for stakeholders.",
  },
];

const faqItems = [
  {
    question: "What types of transcripts work with this tool?",
    answer: "Any text-based transcript works — YouTube auto-captions, podcast transcripts from Otter.ai or Rev, interview notes, speech transcripts, meeting recordings with transcription, and more. Just paste the raw text.",
  },
  {
    question: "How long can the transcript be?",
    answer: "For best results, transcripts up to 15,000 characters work well. For very long transcripts, we recommend pasting the most important sections or breaking the content into multiple presentations.",
  },
  {
    question: "Does the AI preserve the speaker's key quotes?",
    answer: "Yes! Our AI is designed to identify and highlight the most impactful quotes and key statements from the transcript, placing them prominently on slides for maximum effect.",
  },
  {
    question: "Can I use this for YouTube video content I don't own?",
    answer: "You can create presentations for personal study, education, or internal use. For public distribution, ensure you have the appropriate rights or use content under fair use / Creative Commons licenses.",
  },
];

export default function Page() {
  return (
    <SEOPage
      heroTitle="Presentation Maker from Transcript"
      heroSubtitle="Turn any transcript into stunning slides"
      heroDescription="Paste a YouTube, podcast, or speech transcript — our AI extracts key insights and creates a professional presentation in seconds. Perfect for educators, content creators, and teams."
      ctaText="Create from Transcript"
      features={features}
      steps={steps}
      useCases={useCases}
      faqItems={faqItems}
      schemaMarkup={{schemaMarkup}}
    />
  );
}
