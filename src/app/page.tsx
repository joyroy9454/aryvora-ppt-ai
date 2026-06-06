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

export default function Home() {
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

  // Undo/Redo
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

  // Fetch URL content
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch URL");
    } finally {
      setUrlLoading(false);
    }
  }, [inputText]);

  // Generate presentation
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
          inputMode,
          templateId,
          slideCount,
          style,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      const newSlides = data.slides || [];
      setSlides(newSlides);
      setAnalysis(data.analysis || null);
      historyRef.current = [newSlides];
      historyIndexRef.current = 0;
      setStep("editor");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate presentation. Please try again.");
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }, [inputText, inputMode, templateId, slideCount, style]);

  // Slide operations
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
      const idx = afterId
        ? slides.findIndex((s) => s.id === afterId)
        : slides.length - 1;
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
          body: JSON.stringify({ slide }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");

        const newSlides = slides.map((s) =>
          s.id === slideId ? data.slide : s
        );
        setSlides(newSlides);
        pushHistory(newSlides);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to regenerate");
      }
    },
    [slides, pushHistory]
  );

  const handleExportPPTX = useCallback(async () => {
    try {
      const res = await fetch("/api/export/pptx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slides,
          title: analysis?.suggestedTitle || "Presentation",
          theme: templateId,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Export failed");
      }
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
        body: JSON.stringify({
          slides,
          title: analysis?.suggestedTitle || "Presentation",
          theme: templateId,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Export failed");
      }
      const html = await res.text();
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };
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
        body: JSON.stringify({
          slides,
          title: analysis?.suggestedTitle || "Presentation",
        }),
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
    historyRef.current = [[]];
    historyIndexRef.current = 0;
  }, []);

  // ==================== RENDER ====================

  return (
    <main className="min-h-screen">
      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-50 border border-red-200 text-red-700 px-5 py-3 rounded-xl shadow-lg max-w-md text-sm">
          <div className="flex items-center justify-between gap-4">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 font-bold"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Landing */}
      {step === "landing" && (
        <LandingScreen
          inputMode={inputMode}
          setInputMode={setInputMode}
          inputText={inputText}
          setInputText={setInputText}
          templateId={templateId}
          setTemplateId={setTemplateId}
          slideCount={slideCount}
          setSlideCount={setSlideCount}
          style={style}
          setStyle={setStyle}
          loading={loading}
          progress={progress}
          urlLoading={urlLoading}
          error={error}
          setError={setError}
          onGenerate={handleGenerate}
          onFetchUrl={handleFetchUrl}
        />
      )}

      {/* Editor */}
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

/* ============================================================
   Landing Screen
   ============================================================ */

function LandingScreen({
  inputMode,
  setInputMode,
  inputText,
  setInputText,
  templateId,
  setTemplateId,
  slideCount,
  setSlideCount,
  style,
  setStyle,
  loading,
  progress,
  urlLoading,
  error,
  setError,
  onGenerate,
  onFetchUrl,
}: {
  inputMode: InputMode;
  setInputMode: (m: InputMode) => void;
  inputText: string;
  setInputText: (t: string) => void;
  templateId: TemplateId;
  setTemplateId: (t: TemplateId) => void;
  slideCount: number;
  setSlideCount: (n: number) => void;
  style: "academic" | "business" | "casual";
  setStyle: (s: "academic" | "business" | "casual") => void;
  loading: boolean;
  progress: GenerationProgress | null;
  urlLoading: boolean;
  error: string | null;
  setError: (e: string | null) => void;
  onGenerate: () => void;
  onFetchUrl: () => void;
}) {
  const [showTemplates, setShowTemplates] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentMode = INPUT_MODES.find((m) => m.mode === inputMode)!;
  const selectedTemplate = TEMPLATES.find((t) => t.id === templateId)!;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setInputText(ev.target?.result as string);
        setInputMode("notes");
      };
      reader.readAsText(file);
    } else if (file.type === "application/pdf") {
      setError("For PDF files, please copy and paste the text content directly.");
    } else {
      setError("Please upload a .txt or .md file, or paste your content directly.");
    }
  };

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-200">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <div>
            <span className="font-bold text-xl text-slate-900">Aryvora</span>
            <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium ml-2">
              AI PPT
            </span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-slate-500">
          <a href="#features" className="hover:text-slate-800 transition-colors">Features</a>
          <a href="#templates" className="hover:text-slate-800 transition-colors">Templates</a>
          <a href="#examples" className="hover:text-slate-800 transition-colors">Examples</a>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 pt-12 pb-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
            Powered by OpenRouter AI
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-4 leading-tight">
            Create stunning presentations
            <br />
            <span className="bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
              in seconds with AI
            </span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Transform any content — topics, notes, URLs, transcripts — into
            professional presentations. Choose from 10 design templates and
            customize everything.
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50">
          {/* Input Mode Tabs */}
          <div className="flex border-b border-slate-100 overflow-x-auto rounded-t-2xl">
            {INPUT_MODES.map((mode) => (
              <button
                key={mode.mode}
                onClick={() => setInputMode(mode.mode)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  inputMode === mode.mode
                    ? "border-brand-500 text-brand-700 bg-brand-50/50"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>{mode.icon}</span>
                {mode.label}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-4">
            {inputMode === "url" ? (
              <div className="flex gap-2">
                <input
                  type="url"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="https://example.com/article"
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  disabled={loading || urlLoading}
                />
                <button
                  onClick={onFetchUrl}
                  disabled={urlLoading || !inputText.trim()}
                  className="px-5 py-3 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
                >
                  {urlLoading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spinner" />
                  ) : (
                    "Fetch"
                  )}
                </button>
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={currentMode.placeholder}
                rows={inputMode === "topic" ? 2 : 6}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none disabled:bg-slate-50"
                disabled={loading}
              />
            )}

            {/* File upload for PDF mode */}
            {inputMode === "pdf" && (
              <div className="mt-2">
                <label className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-brand-400 hover:text-brand-600 cursor-pointer transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload .txt or .md file
                  <input type="file" accept=".txt,.md,text/plain" onChange={handleFileUpload} className="hidden" />
                </label>
                <span className="text-xs text-slate-400 ml-2">or paste text directly above</span>
              </div>
            )}
          </div>

          {/* Options Row */}
          <div className="px-4 pb-4 flex flex-wrap items-center gap-4">
            {/* Template Selector */}
            <div className="relative">
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 transition-colors"
              >
                <span>{selectedTemplate.icon}</span>
                <span className="text-slate-700">{selectedTemplate.name}</span>
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showTemplates && (
                <div className="absolute left-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-3 w-72 max-h-80 overflow-y-auto">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">Templates</div>
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTemplateId(t.id);
                        setShowTemplates(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors ${
                        templateId === t.id ? "bg-brand-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                        style={{ backgroundColor: t.colors.surface }}
                      >
                        {t.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-800">{t.name}</div>
                        <div className="text-xs text-slate-400 truncate">{t.description}</div>
                      </div>
                      <div className="flex gap-0.5">
                        {[t.colors.primary, t.colors.secondary, t.colors.accent].map((c, i) => (
                          <div key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Slide Count */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500">Slides:</label>
              <input
                type="range"
                min={3}
                max={20}
                value={slideCount}
                onChange={(e) => setSlideCount(Number(e.target.value))}
                className="w-20 accent-brand-600"
                disabled={loading}
              />
              <span className="text-sm font-semibold text-slate-700 w-5">{slideCount}</span>
            </div>

            {/* Style */}
            <div className="flex items-center gap-1">
              {(["business", "academic", "casual"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-colors capitalize ${
                    style === s
                      ? "border-brand-300 bg-brand-50 text-brand-700"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                  disabled={loading}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <div className="px-4 pb-4">
            <button
              onClick={onGenerate}
              disabled={loading || !inputText.trim() || inputText.trim().length < 2}
              className="w-full py-4 px-6 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 disabled:from-brand-300 disabled:to-brand-300 text-white font-semibold rounded-xl transition-all text-lg shadow-lg shadow-brand-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full spinner" />
                  {progress?.message || "Generating..."}
                </>
              ) : (
                <>
                  Generate Presentation
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>

            {/* Progress Bar */}
            {loading && progress && (
              <div className="mt-3">
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-slate-400">{progress.message}</span>
                  <span className="text-xs text-slate-400">{progress.progress}%</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div id="features" className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: "🧠",
              title: "Smart AI Analysis",
              desc: "Auto-detects topic category, audience, and tone for optimized content",
            },
            {
              icon: "📝",
              title: "6 Input Modes",
              desc: "Topic, notes, bullets, URL, transcript, or PDF — we handle it all",
            },
            {
              icon: "🎨",
              title: "10 Design Templates",
              desc: "Corporate, academic, startup pitch, minimal, dark modern, and more",
            },
            {
              icon: "✏️",
              title: "Advanced Editor",
              desc: "Drag-drop reorder, duplicate, change layouts, undo/redo, presenter notes",
            },
            {
              icon: "📊",
              title: "Rich Slide Types",
              desc: "Quotes, timelines, comparisons, charts, statistics, process flows",
            },
            {
              icon: "📤",
              title: "Multiple Exports",
              desc: "PPTX, PDF, Markdown, and speaker notes — download anything",
            },
          ].map((f, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="text-2xl mb-2">{f.icon}</div>
              <h3 className="font-semibold text-slate-800 mb-1">{f.title}</h3>
              <p className="text-sm text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Template Gallery */}
        <div id="templates" className="mt-16">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">
            Choose Your Style
          </h2>
          <p className="text-slate-500 text-center mb-8">
            10 professionally designed templates for every use case
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTemplateId(t.id);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`rounded-xl border-2 p-4 text-left transition-all hover:shadow-lg ${
                  templateId === t.id
                    ? "border-brand-500 shadow-md"
                    : "border-slate-200 hover:border-slate-300"
                }`}
                style={{ backgroundColor: t.colors.surface }}
              >
                <div className="text-2xl mb-2">{t.icon}</div>
                <div className="font-semibold text-sm" style={{ color: t.colors.text }}>
                  {t.name}
                </div>
                <div className="flex gap-1 mt-2">
                  {[t.colors.primary, t.colors.secondary, t.colors.accent].map((c, i) => (
                    <div key={i} className="w-4 h-4 rounded-full" style={{ backgroundColor: c }} />
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Example Presentations */}
        <div id="examples" className="mt-16 mb-16">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">
            What You Can Create
          </h2>
          <p className="text-slate-500 text-center mb-8">
            From student seminars to investor pitch decks
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: "🎓", title: "Student Seminar", template: "seminar", desc: "Clear, friendly presentations for class" },
              { icon: "💼", title: "Business Review", template: "corporate", desc: "Professional decks for stakeholders" },
              { icon: "🚀", title: "Startup Pitch", template: "startup", desc: "Bold, energetic investor presentations" },
              { icon: "🔬", title: "Research Talk", template: "research", desc: "Data-focused academic presentations" },
              { icon: "📣", title: "Marketing Deck", template: "marketing", desc: "Vibrant, eye-catching campaigns" },
              { icon: "🎨", title: "Portfolio Showcase", template: "portfolio", desc: "Creative, visual project displays" },
            ].map((ex, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  const t = TEMPLATES.find((t) => t.id === ex.template);
                  if (t) {
                    setTemplateId(t.id);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
              >
                <div className="text-3xl mb-3">{ex.icon}</div>
                <h3 className="font-semibold text-slate-800 mb-1">{ex.title}</h3>
                <p className="text-sm text-slate-500">{ex.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-100 px-6 py-8 text-center text-sm text-slate-400">
        <p>Aryvora PPT AI — No sign-up required. Free to use.</p>
        <p className="mt-1">Built with OpenRouter AI</p>
      </footer>
    </div>
  );
}

/* ============================================================ */
/* Helpers */
/* ============================================================ */

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
    case "title":
      return { ...base, heading: "Title Slide", sub: "Subtitle" };
    case "content":
      return { ...base, heading: "Content", bullets: ["Point 1", "Point 2", "Point 3"] };
    case "two-column":
      return { ...base, heading: "Two Columns", leftCol: ["Left 1", "Left 2"], rightCol: ["Right 1", "Right 2"] };
    case "image-left":
      return { ...base, heading: "Image Left", bullets: ["Point 1", "Point 2"] };
    case "image-right":
      return { ...base, heading: "Image Right", bullets: ["Point 1", "Point 2"] };
    case "quote":
      return { ...base, heading: "Quote", quote: "Enter your quote...", author: "Author" };
    case "comparison":
      return { ...base, heading: "Comparison", leftCol: ["Option A"], rightCol: ["Option B"] };
    case "timeline":
      return { ...base, heading: "Timeline", timeline: [{ label: "Step 1", description: "Description" }] };
    case "process":
      return { ...base, heading: "Process", process: [{ step: 1, title: "Step", description: "Description" }] };
    case "statistic":
      return { ...base, heading: "Key Metrics", stats: [{ value: "—", label: "Metric" }] };
    case "chart":
      return { ...base, heading: "Chart", chart: [{ label: "A", value: 50 }], chartType: "bar" };
    case "divider":
      return { ...base, heading: "Section Title" };
    case "summary":
      return { ...base, heading: "Key Takeaways", bullets: ["Takeaway 1", "Takeaway 2", "Takeaway 3"] };
    case "qa":
      return { ...base, heading: "Questions & Answers", bullets: ["Any questions?"] };
    case "closing":
      return { ...base, heading: "Thank You", sub: "Questions?", bullets: ["Contact us"] };
    default:
      return base;
  }
}
