"use client";

import { useState } from "react";
import type { Slide } from "@/types";

interface SlideEditorProps {
  slides: Slide[];
  title: string;
  theme: string;
  onUpdateSlide: (id: string, updated: Partial<Slide>) => void;
  onRegenerateSlide: (id: string) => void;
  onExportPPTX: () => void;
  onExportPDF: () => void;
  onStartOver: () => void;
}

const THEME_COLORS: Record<string, { bg: string; title: string; body: string; accent: string; cardBg: string }> = {
  corporate: { bg: "bg-white", title: "text-slate-800", body: "text-slate-600", accent: "text-brand-600", cardBg: "bg-slate-50" },
  creative: { bg: "bg-white", title: "text-purple-900", body: "text-purple-700", accent: "text-purple-500", cardBg: "bg-purple-50" },
  minimal: { bg: "bg-white", title: "text-gray-900", body: "text-gray-600", accent: "text-gray-400", cardBg: "bg-gray-50" },
  bold: { bg: "bg-slate-900", title: "text-white", body: "text-slate-300", accent: "text-amber-400", cardBg: "bg-slate-800" },
};

export default function SlideEditor({
  slides,
  title,
  theme,
  onUpdateSlide,
  onRegenerateSlide,
  onExportPPTX,
  onExportPDF,
  onStartOver,
}: SlideEditorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(slides[0]?.id || null);
  const [exporting, setExporting] = useState<string | null>(null);
  const tc = THEME_COLORS[theme] || THEME_COLORS.corporate;

  const selectedSlide = slides.find((s) => s.id === selectedId);

  const handleExport = async (type: "pptx" | "pdf") => {
    setExporting(type);
    try {
      if (type === "pptx") await onExportPPTX();
      else await onExportPDF();
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="fade-in min-h-screen flex flex-col">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onStartOver}
              className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              &larr; New
            </button>
            <div className="h-4 w-px bg-slate-200" />
            <h1 className="font-semibold text-slate-800 truncate max-w-xs">{title}</h1>
            <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">
              {slides.length} slides
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport("pdf")}
              disabled={exporting !== null}
              className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {exporting === "pdf" ? (
                <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full spinner" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              PDF
            </button>
            <button
              onClick={() => handleExport("pptx")}
              disabled={exporting !== null}
              className="px-4 py-2 text-sm bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5 font-medium"
            >
              {exporting === "pptx" ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full spinner" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
              PPTX
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Slide Thumbnails Sidebar */}
        <div className="w-48 shrink-0 border-r border-slate-200 bg-slate-50 overflow-y-auto p-3 hidden md:block">
          <div className="space-y-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={`w-full text-left rounded-lg overflow-hidden border-2 transition-all ${
                  selectedId === s.id
                    ? "border-brand-500 shadow-md"
                    : "border-transparent hover:border-slate-300"
                }`}
              >
                <div className={`slide-card ${tc.bg} p-2 relative`}>
                  <div className="text-[6px] font-bold truncate">{s.heading}</div>
                  {s.bullets && s.bullets.length > 0 && (
                    <div className="mt-0.5 space-y-0.5">
                      {s.bullets.slice(0, 3).map((b, j) => (
                        <div key={j} className="text-[4px] opacity-60 truncate">&bull; {b}</div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="bg-white px-2 py-1 text-[10px] text-slate-500 border-t border-slate-100">
                  {i + 1}. {s.type}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedSlide ? (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto">
                {/* Slide Preview */}
                <div className={`slide-card ${tc.bg} rounded-2xl border border-slate-200 shadow-lg p-8 mb-6`}>
                  <SlidePreview slide={selectedSlide} tc={tc} />
                </div>

                {/* Edit Controls */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-800">Edit Slide</h3>
                    <button
                      onClick={() => onRegenerateSlide(selectedSlide.id)}
                      className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      AI Regenerate
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Heading */}
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">Heading</label>
                      <input
                        type="text"
                        value={selectedSlide.heading}
                        onChange={(e) => onUpdateSlide(selectedSlide.id, { heading: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      />
                    </div>

                    {/* Subtitle */}
                    {selectedSlide.sub !== undefined && (
                      <div>
                        <label className="text-xs font-medium text-slate-500 mb-1 block">Subtitle</label>
                        <input
                          type="text"
                          value={selectedSlide.sub || ""}
                          onChange={(e) => onUpdateSlide(selectedSlide.id, { sub: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        />
                      </div>
                    )}

                    {/* Bullets */}
                    {selectedSlide.bullets && (
                      <div>
                        <label className="text-xs font-medium text-slate-500 mb-1 block">Bullet Points</label>
                        <div className="space-y-2">
                          {selectedSlide.bullets.map((b, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="text-xs text-slate-400 w-4">{i + 1}.</span>
                              <input
                                type="text"
                                value={b}
                                onChange={(e) => {
                                  const newBullets = [...(selectedSlide.bullets || [])];
                                  newBullets[i] = e.target.value;
                                  onUpdateSlide(selectedSlide.id, { bullets: newBullets });
                                }}
                                className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                              />
                              <button
                                onClick={() => {
                                  const newBullets = selectedSlide.bullets?.filter((_, j) => j !== i);
                                  onUpdateSlide(selectedSlide.id, { bullets: newBullets });
                                }}
                                className="text-slate-400 hover:text-red-500 text-sm"
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              const newBullets = [...(selectedSlide.bullets || []), "New point"];
                              onUpdateSlide(selectedSlide.id, { bullets: newBullets });
                            }}
                            className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                          >
                            + Add bullet
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Two-column */}
                    {(selectedSlide.leftCol || selectedSlide.rightCol) && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-slate-500 mb-1 block">Left Column</label>
                          <div className="space-y-2">
                            {(selectedSlide.leftCol || []).map((item, i) => (
                              <input
                                key={i}
                                type="text"
                                value={item}
                                onChange={(e) => {
                                  const newCol = [...(selectedSlide.leftCol || [])];
                                  newCol[i] = e.target.value;
                                  onUpdateSlide(selectedSlide.id, { leftCol: newCol });
                                }}
                                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                              />
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-500 mb-1 block">Right Column</label>
                          <div className="space-y-2">
                            {(selectedSlide.rightCol || []).map((item, i) => (
                              <input
                                key={i}
                                type="text"
                                value={item}
                                onChange={(e) => {
                                  const newCol = [...(selectedSlide.rightCol || [])];
                                  newCol[i] = e.target.value;
                                  onUpdateSlide(selectedSlide.id, { rightCol: newCol });
                                }}
                                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              Select a slide to edit
            </div>
          )}
        </div>
      </div>

      {/* Mobile Slide Selector */}
      <div className="md:hidden border-t border-slate-200 bg-white px-3 py-2 overflow-x-auto">
        <div className="flex gap-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setSelectedId(s.id)}
              className={`shrink-0 w-16 h-10 rounded border-2 flex items-center justify-center text-xs font-medium ${
                selectedId === s.id
                  ? "border-brand-500 text-brand-700"
                  : "border-slate-200 text-slate-500"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Slide Preview ---------- */

function SlidePreview({
  slide,
  tc,
}: {
  slide: Slide;
  tc: { title: string; body: string; accent: string };
}) {
  switch (slide.type) {
    case "title":
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <h1 className={`text-2xl md:text-3xl font-bold ${tc.title} mb-2`}>{slide.heading}</h1>
          {slide.sub && <p className={`text-sm md:text-base ${tc.accent}`}>{slide.sub}</p>}
        </div>
      );

    case "content":
      return (
        <div className="h-full flex flex-col">
          <h2 className={`text-lg md:text-xl font-bold ${tc.title} mb-4`}>{slide.heading}</h2>
          {slide.bullets && slide.bullets.length > 0 && (
            <ul className="space-y-2 flex-1">
              {slide.bullets.map((b, i) => (
                <li key={i} className={`text-xs md:text-sm ${tc.body} flex items-start gap-2`}>
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${tc.accent.replace("text-", "bg-")} shrink-0`} />
                  {b}
                </li>
              ))}
            </ul>
          )}
        </div>
      );

    case "two-column":
      return (
        <div className="h-full flex flex-col">
          <h2 className={`text-lg md:text-xl font-bold ${tc.title} mb-4`}>{slide.heading}</h2>
          <div className="grid grid-cols-2 gap-4 flex-1">
            <div>
              {slide.leftCol?.map((item, i) => (
                <div key={i} className={`text-xs ${tc.body} py-1`}>&bull; {item}</div>
              ))}
            </div>
            <div>
              {slide.rightCol?.map((item, i) => (
                <div key={i} className={`text-xs ${tc.body} py-1`}>&bull; {item}</div>
              ))}
            </div>
          </div>
        </div>
      );

    case "closing":
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <h1 className={`text-2xl md:text-3xl font-bold ${tc.title} mb-2`}>{slide.heading}</h1>
          {slide.sub && <p className={`text-sm ${tc.accent} mb-4`}>{slide.sub}</p>}
          {slide.bullets && slide.bullets.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {slide.bullets.map((b, i) => (
                <span key={i} className={`text-xs px-3 py-1 rounded-full border ${tc.body} border-current opacity-70`}>
                  {b}
                </span>
              ))}
            </div>
          )}
        </div>
      );

    default:
      return (
        <div className="flex items-center justify-center h-full">
          <p className={tc.body}>{slide.heading}</p>
        </div>
      );
  }
}
