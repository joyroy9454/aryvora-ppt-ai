import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aryvora PPT AI",
  description: "Generate stunning presentations in seconds. No sign-up, no hassle.",
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
