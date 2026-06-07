// ============================================================
// SEO Landing Page Template
// Reusable component for all SEO landing pages.
// ============================================================

import type { Metadata } from "next";

interface SEOPageProps {
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  ctaText: string;
  features?: { icon: string; title: string; desc: string }[];
  steps?: { num: string; title: string; desc: string }[];
  useCases?: { icon: string; title: string; desc: string }[];
  faqItems?: { question: string; answer: string }[];
  schemaMarkup?: { schemaMarkup: object };
}

export default function SEOPage({
  heroTitle,
  heroSubtitle,
  heroDescription,
  ctaText,
  features,
  steps,
  useCases,
  faqItems,
}: SEOPageProps) {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
          Free AI Presentation Tool
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-4 leading-tight">
          {heroTitle}
          <br />
          <span className="bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
            {heroSubtitle}
          </span>
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-8">
          {heroDescription}
        </p>
        <a
          href="/#generate"
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-brand-600 to-brand-700 text-white font-semibold rounded-xl text-lg shadow-lg shadow-brand-200 hover:from-brand-700 hover:to-brand-800 transition-all"
        >
          {ctaText}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </a>
      </section>

      {/* Features */}
      {features && features.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 py-12">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-slate-800 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Steps */}
      {steps && steps.length > 0 && (
        <section className="bg-slate-50 py-12">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {steps.map((s, i) => (
                <div key={i} className="text-center">
                  <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-lg mx-auto mb-4">
                    {s.num}
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-500">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Use Cases */}
      {useCases && useCases.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 py-12">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Perfect For</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {useCases.map((uc, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                <div className="text-2xl mb-2">{uc.icon}</div>
                <h3 className="font-semibold text-slate-800 mb-1">{uc.title}</h3>
                <p className="text-sm text-slate-500">{uc.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      {faqItems && faqItems.length > 0 && (
        <section className="bg-slate-50 py-12">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqItems.map((faq, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
                  <h3 className="font-semibold text-slate-800 mb-2">{faq.question}</h3>
                  <p className="text-sm text-slate-500">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Ready to Create Your Presentation?</h2>
        <p className="text-slate-500 mb-6">No sign-up required. Free to use. Generate your first deck in seconds.</p>
        <a
          href="/#generate"
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-brand-600 to-brand-700 text-white font-semibold rounded-xl text-lg shadow-lg shadow-brand-200 hover:from-brand-700 hover:to-brand-800 transition-all"
        >
          {ctaText}
        </a>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 px-6 py-8 text-center text-sm text-slate-400">
        <p>Aryvora PPT AI — No sign-up required. Free to use.</p>
      </footer>
    </main>
  );
}
