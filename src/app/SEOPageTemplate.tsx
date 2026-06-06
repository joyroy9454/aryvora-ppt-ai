"use client";

import { useState, useCallback, useRef } from "react";
import type {
  Slide,
  SlideType,
  TemplateId,
  InputMode,
  AIAnalysis,
  GenerationProgress,
} from "@/types";
import { INPUT_MODES, TEMPLATES } from "@/types";
import SlideEditor from "@/components/SlideEditor";

type AppStep = "landing" | "editor";

const MAX_HISTORY = 30;

const SAMPLE_TOPICS = [
  "Climate Change",
  "AI in Healthcare",
  "Startup Pitch Deck",
  "World War II",
];

const GENERATION_STEPS = [
  { key: "analyzing", label: "Analyzing input" },
  { key: "outlining", label: "Building outline" },
  { key: "generating", label: "Writing slides" },
  { key: "enhancing", label: "Enhancing content" },
  { key: "finalizing", label: "Applying design" },
  { key: "done", label: "Rendering deck" },
];

function detectInputMode(text: string): InputMode {
  const trimmed = text.trim();
  if (trimmed.startsWith("http")) return "url";
  if (trimmed.length > 500) return "notes";
  if (/^[\s]*[-•*▪▸►]\s/m.test(trimmed)) return "bullets";
  return "topic";
}

interface SEOPageProps {
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  ctaText: string;
  faqItems: { question: string; answer: string }[];
  schemaMarkup: object;
}

export default function SEOPage({
  heroTitle,
  heroSubtitle,
  heroDescription,
  ctaText,
  faqItems,
  schemaMarkup,
}: SEOPageProps) {
  const [step, setStep] = useState<AppStep>("landing");
  const [inputMode, setInputMode] = useState<InputMode>("topic");
  const [inputText, setInputText] = useState("");
  const [templateId, setTemplateId] = useState<TemplateId>("corporate");
  const [slideCount, setSlideCount] = useState(8);
  const [style, setStyle] = useState<"academic" | "business" | "casual">("business");
  const [slides, setSlides] = useState<Slide[]>([]);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [urlLoading, setUrlLoading] = useState(false);
  const [detectedMode, setDetectedMode] = useState<InputMode | null>(null);

  const historyRef = useRef<Slide[][]>([[]]);
  const historyIndexRef = useRef(0);

  const pushHistory = useCallback((newSlides: Slide[]) => {
    const h = historyRef.current;
    const idx = historyIndexRef.current;
    h.splice(idx + 1);
    h.push(newSlides);
    if (h.length > MAX_HISTORY) h.shift();
    historyIndexRef.current = h.length - 1;
  }, []);

  const handleInputChange = useCallback((text: string) => {
    setInputText(text);
    if (text.trim().length > 0) {
      setDetectedMode(detectInputMode(text));
    } else {
      setDetectedMode(null);
    }
  }, []);

  const handleFetchUrl = useCallback(async () => {
    if (!inputText.trim() || !inputText.startsWith("http")) {
      setError("Please enter a valid URL starting with https://");
      return;
    }
    setUrlLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/fetch-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: inputText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch URL");
      setInputText(data.text);
      setInputMode("notes");
      setDetectedMode("notes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch URL");
    } finally {
      setUrlLoading(false);
    }
  }, [inputText]);

  const handleGenerate = useCallback(async () => {
    if (!inputText.trim() || inputText.trim().length < 2) {
      setError("Please enter some content to generate a presentation.");
      return;
    }
    setLoading(true);
    setError(null);
    setProgress({ step: "analyzing", message: "Analyzing your input...", progress: 10 });

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputText: inputText.trim(),
          inputMode: detectedMode || inputMode,
          templateId,
          slideCount,
          style,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setSlides(data.slides || []);
      setAnalysis(data.analysis || null);
      historyRef.current = [data.slides || []];
      historyIndexRef.current = 0;
      setStep("editor");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate presentation.");
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }, [inputText, inputMode, detectedMode, templateId, slideCount, style]);

  const handleUpdateSlide = useCallback(
    (slideId: string, updated: Partial<Slide>) => {
      const newSlides = slides.map((s) =>
        s.id === slideId ? { ...s, ...updated } : s
      );
      setSlides(newSlides);
      pushHistory(newSlides);
    },
    [slides, pushHistory]
  );

  const handleReorderSlides = useCallback(
    (newSlides: Slide[]) => {
      setSlides(newSlides);
      pushHistory(newSlides);
    },
    [pushHistory]
  );

  const handleAddSlide = useCallback(
    (type: SlideType, afterId?: string) => {
      const newSlide = createEmptySlide(type);
      const idx = afterId ? slides.findIndex((s) => s.id === afterId) : slides.length - 1;
      const newSlides = [...slides];
      newSlides.splice(idx + 1, 0, newSlide);
      setSlides(newSlides);
      pushHistory(newSlides);
    },
    [slides, pushHistory]
  );

  const handleDeleteSlide = useCallback(
    (slideId: string) => {
      if (slides.length <= 1) return;
      const newSlides = slides.filter((s) => s.id !== slideId);
      setSlides(newSlides);
      pushHistory(newSlides);
    },
    [slides, pushHistory]
  );

  const handleDuplicateSlide = useCallback(
    (slideId: string) => {
      const idx = slides.findIndex((s) => s.id === slideId);
      if (idx === -1) return;
      const original = slides[idx];
      const duplicate: Slide = {
        ...JSON.parse(JSON.stringify(original)),
        id: `slide-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      };
      const newSlides = [...slides];
      newSlides.splice(idx + 1, 0, duplicate);
      setSlides(newSlides);
      pushHistory(newSlides);
    },
    [slides, pushHistory]
  );

  const handleRegenerateSlide = useCallback(
    async (slideId: string) => {
      const slide = slides.find((s) => s.id === slideId);
      if (!slide) return;
      try {
        const res = await fetch("/api/regenerate-slide", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slide, slides, analysis }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        const newSlides = slides.map((s) => (s.id === slideId ? data.slide : s));
        setSlides(newSlides);
        pushHistory(newSlides);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to regenerate");
      }
    },
    [slides, analysis, pushHistory]
  );

  const handleExportPPTX = useCallback(async () => {
    try {
      const res = await fetch("/api/export/pptx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slides, title: analysis?.suggestedTitle || "Presentation", theme: templateId }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      downloadBlob(blob, "pptx");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    }
  }, [slides, analysis, templateId]);

  const handleExportPDF = useCallback(async () => {
    try {
      const res = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slides, title: analysis?.suggestedTitle || "Presentation", theme: templateId }),
      });
      if (!res.ok) throw new Error("Export failed");
      const html = await res.text();
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.onload = () => { printWindow.focus(); printWindow.print(); };
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    }
  }, [slides, analysis, templateId]);

  const handleExportMarkdown = useCallback(async () => {
    try {
      const res = await fetch("/api/export/markdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slides, title: analysis?.suggestedTitle || "Presentation" }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      downloadBlob(blob, "md");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    }
  }, [slides, analysis]);

  const handleExportNotes = useCallback(() => {
    if (!slides.length) return;
    let text = `# Speaker Notes: ${analysis?.suggestedTitle || "Presentation"}\n\n`;
    slides.forEach((s, i) => {
      text += `## Slide ${i + 1}: ${s.heading}\n`;
      text += `${s.notes || "(No notes)"}\n\n`;
    });
    const blob = new Blob([text], { type: "text/plain" });
    downloadBlob(blob, "txt");
  }, [slides, analysis]);

  const handleStartOver = useCallback(() => {
    setStep("landing");
    setInputText("");
    setSlides([]);
    setAnalysis(null);
    setError(null);
    setDetectedMode(null);
    historyRef.current = [[]];
    historyIndexRef.current = 0;
  }, []);

  const currentMode = INPUT_MODES.find((m) => m.mode === (detectedMode || inputMode))!;
  const selectedTemplate = TEMPLATES.find((t) => t.id === templateId)!;

  return (
    <main className="min-h-screen">
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-50 border border-red-200 text-red-700 px-5 py-3 rounded-xl shadow-lg max-w-md text-sm">
          <div className="flex items-center justify-between gap-4">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 font-bold">&times;</button>
          </div>
        </div>
      )}

      {step === "landing" && (
        <div className="min-h-screen">
          <nav className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-200">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="font-bold text-xl text-slate-900">Aryvora</span>
              <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">AI PPT</span>
            </div>
          </nav>

          <div className="max-w-3xl mx-auto px-6 pt-16 pb-8">
            <div className="text-center mb-10">
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 leading-tight">
                {heroTitle}
                <br />
                <span className="bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
                  {heroSubtitle}
                </span>
              </h1>
              <p className="text-lg text-slate-500 max-w-2xl mx-auto">{heroDescription}</p>
            </div>

            {/* Schema markup */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }} />

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50">
              {/* Sample Topics */}
              <div className="px-5 pt-4 pb-2">
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_TOPICS.map((topic) => (
                    <button
                      key={topic}
                      onClick={() => { setInputText(topic); setInputMode("topic"); setDetectedMode("topic"); }}
                      className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-full text-slate-600 hover:bg-brand-50 hover:border-brand-300 hover:text-brand-700 transition-colors"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Area */}
              <div className="p-5">
                <div className="relative">
                  <textarea
                    value={inputText}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="Enter your topic, paste notes, bullet points, or a URL..."
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none disabled:bg-slate-50"
                    disabled={loading || urlLoading}
                  />
                  {detectedMode && (
                    <div className="absolute top-2 right-2">
                      <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">
                        {INPUT_MODES.find((m) => m.mode === detectedMode)?.icon} {INPUT_MODES.find((m) => m.mode === detectedMode)?.label}
                      </span>
                    </div>
                  )}
                </div>

                {/* File upload */}
                <div className="mt-2 flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 px-3 py-1.5 border border-dashed border-slate-300 rounded-lg text-xs text-slate-500 hover:border-brand-400 hover:text-brand-600 cursor-pointer transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload .txt / .md
                    <input
                      type="file"
                      accept=".txt,.md,text/plain"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const text = ev.target?.result as string;
                          setInputText(text);
                          setInputMode("notes");
                          setDetectedMode("notes");
                        };
                        reader.readAsText(file);
                      }}
                    />
                  </label>
                  <span className="text-xs text-slate-400">or paste content directly</span>
                </div>
              </div>

              {/* Options Row */}
              <div className="px-5 pb-4 flex flex-wrap items-center gap-4">
                <div className="relative">
                  <select
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value as TemplateId)}
                    className="appearance-none px-3 py-2 pr-8 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {TEMPLATES.map((t) => (
                      <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500">Slides:</label>
                  <input type="range" min={3} max={20} value={slideCount} onChange={(e) => setSlideCount(Number(e.target.value))} className="w-20 accent-brand-600" disabled={loading} />
                  <span className="text-sm font-semibold text-slate-700 w-5">{slideCount}</span>
                </div>

                <div className="flex items-center gap-1">
                  {(["business", "academic", "casual"] as const).map((s) => (
                    <button key={s} onClick={() => setStyle(s)} className={`px-2.5 py-1 text-xs rounded-lg border transition-colors capitalize ${style === s ? "border-brand-300 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-500 hover:border-slate-300"}`} disabled={loading}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <div className="px-5 pb-5">
                {inputMode === "url" && inputText.trim().startsWith("http") ? (
                  <button onClick={handleFetchUrl} disabled={urlLoading || !inputText.trim()} className="w-full py-4 px-6 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 disabled:from-brand-300 disabled:to-brand-300 text-white font-semibold rounded-xl transition-all text-lg shadow-lg shadow-brand-200 flex items-center justify-center gap-2">
                    {urlLoading ? <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full spinner" />Fetching content...</> : <>{ctaText}<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></>}
                  </button>
                ) : (
                  <button onClick={handleGenerate} disabled={loading || !inputText.trim() || inputText.trim().length < 2} className="w-full py-4 px-6 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 disabled:from-brand-300 disabled:to-brand-300 text-white font-semibold rounded-xl transition-all text-lg shadow-lg shadow-brand-200 flex items-center justify-center gap-2">
                    {loading ? <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full spinner" />Generating...</> : <>{ctaText}<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></>}
                  </button>
                )}
              </div>

              {/* Progress Steps */}
              {loading && progress && (
                <div className="px-5 pb-5 border-t border-slate-100 pt-4">
                  <div className="space-y-2">
                    {GENERATION_STEPS.map((step, i) => {
                      const stepOrder = GENERATION_STEPS.findIndex((s) => s.key === progress.step);
                      const isComplete = i < stepOrder;
                      const isCurrent = i === stepOrder;
                      return (
                        <div key={step.key} className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isComplete ? "bg-green-500 text-white" : isCurrent ? "bg-brand-500 text-white animate-pulse" : "bg-slate-100 text-slate-400"}`}>
                            {isComplete ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> : isCurrent ? <span className="w-2 h-2 bg-white rounded-full animate-ping" /> : <span className="w-2 h-2 rounded-full bg-slate-300" />}
                          </div>
                          <span className={`text-sm ${isComplete ? "text-green-600 font-medium" : isCurrent ? "text-brand-700 font-semibold" : "text-slate-400"}`}>{step.label}</span>
                          {isCurrent && <span className="ml-auto text-xs text-slate-400">{progress.progress}%</span>}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full transition-all duration-500" style={{ width: `${progress.progress}%` }} />
                  </div>
                </div>
              )}
            </div>

            {/* How it works */}
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">How It Works</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: "1", title: "Enter Content", desc: "Type a topic, paste notes, upload a file, or paste a URL" },
                  { icon: "2", title: "AI Creates", desc: "Our AI analyzes, outlines, and generates professional slides" },
                  { icon: "3", title: "Edit & Export", desc: "Customize everything and download as PPTX or PDF" },
                ].map((step, i) => (
                  <div key={i} className="text-center">
                    <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xl font-bold mx-auto mb-3">{step.icon}</div>
                    <h3 className="font-semibold text-slate-800 mb-1">{step.title}</h3>
                    <p className="text-sm text-slate-500">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ Section */}
            <div className="mt-16 mb-16">
              <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Frequently Asked Questions</h2>
              <div className="max-w-3xl mx-auto space-y-4">
                {faqItems.map((faq, i) => (
                  <FAQItem key={i} question={faq.question} answer={faq.answer} />
                ))}
              </div>
            </div>
          </div>

          <footer className="border-t border-slate-100 px-6 py-8 text-center text-sm text-slate-400">
            <p>© {new Date().getFullYear()} Aryvora PPT AI — <a href="/" className="text-brand-600 hover:underline">aryvora.com</a></p>
          </footer>
        </div>
      )}

      {step === "editor" && (
        <SlideEditor
          slides={slides}
          title={analysis?.suggestedTitle || "Presentation"}
          theme={templateId}
          onUpdateSlide={handleUpdateSlide}
          onRegenerateSlide={handleRegenerateSlide}
          onExportPPTX={handleExportPPTX}
          onExportPDF={handleExportPDF}
          onExportMarkdown={handleExportMarkdown}
          onExportNotes={handleExportNotes}
          onStartOver={handleStartOver}
          onReorderSlides={handleReorderSlides}
          onAddSlide={handleAddSlide}
          onDeleteSlide={handleDeleteSlide}
          onDuplicateSlide={handleDuplicateSlide}
        />
      )}
    </main>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors">
        <span className="font-medium text-slate-800 text-sm pr-4">{question}</span>
        <svg className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-5 pb-4"><p className="text-sm text-slate-500 leading-relaxed">{answer}</p></div>}
    </div>
  );
}

function downloadBlob(blob: Blob, ext: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `presentation.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function createEmptySlide(type: SlideType): Slide {
  const id = `slide-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const base = { id, type, heading: "New Slide" };
  switch (type) {
    case "title": return { ...base, heading: "Title Slide", sub: "Subtitle" };
    case "content": return { ...base, heading: "Content", bullets: ["Point 1", "Point 2", "Point 3"] };
    case "two-column": return { ...base, heading: "Two Columns", leftCol: ["Left 1", "Left 2"], rightCol: ["Right 1", "Right 2"] };
    case "image-left": return { ...base, heading: "Image Left", bullets: ["Point 1", "Point 2"], imagePrompt: "Professional illustration" };
    case "image-right": return { ...base, heading: "Image Right", bullets: ["Point 1", "Point 2"], imagePrompt: "Professional illustration" };
    case "quote": return { ...base, heading: "Quote", quote: "Enter your quote...", author: "Author" };
    case "comparison": return { ...base, heading: "Comparison", leftCol: ["Option A"], rightCol: ["Option B"] };
    case "timeline": return { ...base, heading: "Timeline", timeline: [{ label: "Step 1", description: "Description" }] };
    case "process": return { ...base, heading: "Process", process: [{ step: 1, title: "Step", description: "Description" }] };
    case "statistic": return { ...base, heading: "Key Metrics", stats: [{ value: "—", label: "Metric" }] };
    case "chart": return { ...base, heading: "Chart", chart: [{ label: "A", value: 50 }], chartType: "bar" };
    case "divider": return { ...base, heading: "Section Title" };
    case "summary": return { ...base, heading: "Key Takeaways", bullets: ["Takeaway 1", "Takeaway 2", "Takeaway 3"] };
    case "qa": return { ...base, heading: "Questions & Answers", bullets: ["Any questions?"] };
    case "closing": return { ...base, heading: "Thank You", sub: "Questions?", bullets: ["Contact us"] };
    default: return base;
  }
}
