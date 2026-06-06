"use client";

import { useState, useCallback, useRef } from "react";
import type { Slide, SlideType } from "@/types";
import SlideEditor from "@/components/SlideEditor";
import LandingScreen from "@/components/LandingScreen";

type AppStep = "landing" | "outline" | "slides" | "editor";

const MAX_HISTORY = 30;

export default function Home() {
  const [step, setStep] = useState<AppStep>("landing");
  const [topic, setTopic] = useState("");
  const [slideCount, setSlideCount] = useState(8);
  const [theme, setTheme] = useState<string>("corporate");
  const [outlineData, setOutlineData] = useState<{
    title: string;
    subtitle: string;
    outline: string[];
  } | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Undo/Redo history
  const historyRef = useRef<Slide[][]>([[]]);
  const historyIndexRef = useRef(0);

  const pushHistory = useCallback((newSlides: Slide[]) => {
    const h = historyRef.current;
    const idx = historyIndexRef.current;
    // Trim future states if we're not at the end
    h.splice(idx + 1);
    h.push(newSlides);
    if (h.length > MAX_HISTORY) h.shift();
    historyIndexRef.current = h.length - 1;
  }, []);

  const undo = useCallback(() => {
    const idx = historyIndexRef.current;
    if (idx > 0) {
      historyIndexRef.current = idx - 1;
      setSlides(historyRef.current[idx - 1]);
    }
  }, []);

  const redo = useCallback(() => {
    const h = historyRef.current;
    const idx = historyIndexRef.current;
    if (idx < h.length - 1) {
      historyIndexRef.current = idx + 1;
      setSlides(h[idx + 1]);
    }
  }, []);

  const handleGenerateOutline = useCallback(
    async (t: string, count: number) => {
      setLoading(true);
      setError(null);
      setTopic(t);
      setSlideCount(count);
      try {
        const res = await fetch("/api/outline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: t, slideCount: count }),
        });
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.error || "Failed to generate outline");

        setOutlineData(data);
        setStep("outline");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleGenerateSlides = useCallback(
    async (themeName: string) => {
      setTheme(themeName);
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/slides", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic,
            slideCount,
            outline: outlineData?.outline || [],
            theme: themeName,
          }),
        });
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.error || "Failed to generate slides");

        const newSlides = data.slides || [];
        setSlides(newSlides);
        historyRef.current = [newSlides];
        historyIndexRef.current = 0;
        setStep("editor");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    },
    [topic, slideCount, outlineData]
  );

  const handleRegenerateSlide = useCallback(
    async (slideId: string) => {
      const slide = slides.find((s) => s.id === slideId);
      if (!slide) return;

      setSlides((prev) =>
        prev.map((s) =>
          s.id === slideId ? { ...s, heading: s.heading + " …" } : s
        )
      );

      try {
        const res = await fetch("/api/regenerate-slide", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slide }),
        });
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.error || "Failed to regenerate");

        const newSlides = slides.map((s) =>
          s.id === slideId ? data.slide : s
        );
        setSlides(newSlides);
        pushHistory(newSlides);
      } catch (err) {
        setSlides((slides) => [...slides]); // restore
        setError(
          err instanceof Error ? err.message : "Failed to regenerate slide"
        );
      }
    },
    [slides, pushHistory]
  );

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
      const newSlide: Slide = createEmptySlide(type);
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

  const handleExportPPTX = useCallback(async () => {
    try {
      const res = await fetch("/api/export/pptx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slides,
          title: outlineData?.title || topic,
          theme,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        (outlineData?.title || topic)
          .replace(/[^a-zA-Z0-9\s-]/g, "")
          .replace(/\s+/g, "-") + ".pptx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to export PPTX"
      );
    }
  }, [slides, outlineData, topic, theme]);

  const handleExportPDF = useCallback(async () => {
    try {
      const res = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slides,
          title: outlineData?.title || topic,
          theme,
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
      setError(
        err instanceof Error ? err.message : "Failed to export PDF"
      );
    }
  }, [slides, outlineData, topic, theme]);

  const handleStartOver = useCallback(() => {
    setStep("landing");
    setTopic("");
    setSlides([]);
    setOutlineData(null);
    setError(null);
    historyRef.current = [[]];
    historyIndexRef.current = 0;
  }, []);

  return (
    <main className="min-h-screen">
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

      {step === "landing" && (
        <LandingScreen
          topic={topic}
          slideCount={slideCount}
          loading={loading}
          onTopicChange={setTopic}
          onSlideCountChange={setSlideCount}
          onGenerate={handleGenerateOutline}
        />
      )}

      {step === "outline" && outlineData && (
        <OutlineScreen
          title={outlineData.title}
          subtitle={outlineData.subtitle}
          outline={outlineData.outline}
          slideCount={slideCount}
          loading={loading}
          onBack={handleStartOver}
          onGenerate={handleGenerateSlides}
        />
      )}

      {step === "editor" && (
        <SlideEditor
          slides={slides}
          title={outlineData?.title || topic}
          theme={theme}
          onUpdateSlide={handleUpdateSlide}
          onRegenerateSlide={handleRegenerateSlide}
          onExportPPTX={handleExportPPTX}
          onExportPDF={handleExportPDF}
          onStartOver={handleStartOver}
          onReorderSlides={handleReorderSlides}
          onAddSlide={handleAddSlide}
          onDeleteSlide={handleDeleteSlide}
        />
      )}
    </main>
  );
}

/* ---------- Helper: create empty slide ---------- */

function createEmptySlide(type: SlideType): Slide {
  const id = `slide-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const base = { id, type, heading: "New Slide" };

  switch (type) {
    case "title":
      return { ...base, heading: "Title Slide", sub: "Subtitle" };
    case "content":
      return {
        ...base,
        heading: "Content Slide",
        bullets: ["Point 1", "Point 2", "Point 3"],
      };
    case "two-column":
      return {
        ...base,
        heading: "Two Columns",
        leftCol: ["Left 1", "Left 2"],
        rightCol: ["Right 1", "Right 2"],
      };
    case "image-left":
      return {
        ...base,
        heading: "Image Left",
        bullets: ["Point 1", "Point 2"],
      };
    case "image-right":
      return {
        ...base,
        heading: "Image Right",
        bullets: ["Point 1", "Point 2"],
      };
    case "quote":
      return {
        ...base,
        heading: "Quote",
        quote: "Enter your quote here...",
        author: "Author Name",
      };
    case "comparison":
      return {
        ...base,
        heading: "Comparison",
        leftCol: ["Option A - Pro", "Option A - Con"],
        rightCol: ["Option B - Pro", "Option B - Con"],
      };
    case "timeline":
      return {
        ...base,
        heading: "Timeline",
        timeline: [
          { label: "Step 1", description: "Description" },
          { label: "Step 2", description: "Description" },
        ],
      };
    case "statistic":
      return {
        ...base,
        heading: "Key Metrics",
        stats: [
          { value: "95%", label: "Satisfaction" },
          { value: "2x", label: "Growth" },
        ],
      };
    case "closing":
      return {
        ...base,
        heading: "Thank You",
        sub: "Questions?",
        bullets: ["Contact us", "Learn more"],
      };
    default:
      return base;
  }
}

/* ---------- Sub-screens ---------- */

function OutlineScreen({
  title,
  subtitle,
  outline,
  slideCount,
  loading,
  onBack,
  onGenerate,
}: {
  title: string;
  subtitle: string;
  outline: string[];
  slideCount: number;
  loading: boolean;
  onBack: () => void;
  onGenerate: (theme: string) => void;
}) {
  const [selectedTheme, setSelectedTheme] = useState("corporate");

  const themes = [
    { id: "corporate", label: "Corporate", desc: "Clean & professional", color: "#2B6CB0" },
    { id: "creative", label: "Creative", desc: "Bold & vibrant", color: "#9333EA" },
    { id: "minimal", label: "Minimal", desc: "Elegant & restrained", color: "#6B7280" },
    { id: "bold", label: "Bold", desc: "High contrast", color: "#F59E0B" },
  ];

  return (
    <div className="fade-in max-w-3xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1"
        >
          &larr; Back
        </button>
        <span className="text-xs text-slate-400">Step 2 of 3</span>
      </div>

      {/* Title Preview */}
      <div className="mb-8">
        <div className="text-xs uppercase tracking-wider text-brand-500 font-semibold mb-2">Presentation Outline</div>
        <h1 className="text-3xl font-bold text-slate-900 mb-1">{title}</h1>
        {subtitle && <p className="text-lg text-slate-500">{subtitle}</p>}
      </div>

      {/* Outline Items */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm">
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm text-slate-500 mb-4">
            <span className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-xs">1</span>
            <span>Title Slide</span>
          </div>

          {outline.map((item, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                {i + 2}
              </span>
              <span className="text-slate-700 font-medium">{item}</span>
            </div>
          ))}

          <div className="flex items-center gap-3 text-sm text-slate-500 pt-1">
            <span className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-xs">
              {outline.length + 2}
            </span>
            <span>Closing Slide</span>
          </div>
        </div>
      </div>

      {/* Theme Selection */}
      <div className="mb-8">
        <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">Choose a Theme</div>
        <div className="grid grid-cols-2 gap-3">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTheme(t.id)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                selectedTheme === t.id
                  ? "border-brand-500 bg-brand-50"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full border-2 border-white shadow"
                  style={{ backgroundColor: t.color }}
                />
                <div>
                  <div className="font-semibold text-slate-800 text-sm">{t.label}</div>
                  <div className="text-xs text-slate-500">{t.desc}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={() => onGenerate(selectedTheme)}
        disabled={loading}
        className="w-full py-4 px-6 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 text-white font-semibold rounded-xl transition-colors text-lg shadow-lg shadow-brand-200 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full spinner" />
            Generating {slideCount} slides...
          </>
        ) : (
          "Generate Slides \u2192"
        )}
      </button>
    </div>
  );
}
