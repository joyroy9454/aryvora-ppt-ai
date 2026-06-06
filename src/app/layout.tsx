import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aryvora PPT AI — AI Presentation Generator | Free PPT Maker",
  description:
    "Create stunning presentations in seconds with AI. Transform topics, notes, URLs, and transcripts into professional slides. 10 templates, no sign-up required.",
  keywords: [
    "AI presentation generator",
    "PPT maker",
    "presentation AI",
    "free PPT generator",
    "slides maker",
    "AI slides",
    "presentation maker",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
