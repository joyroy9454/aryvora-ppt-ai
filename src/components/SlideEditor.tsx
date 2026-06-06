"use client";

import { useState, useCallback, useRef } from "react";
import type { Slide, SlideType } from "@/types";
import { SLIDE_TEMPLATES } from "@/types";

interface SlideEditorProps {
  slides: Slide[];
  title: string;
  theme: string;
  onUpdateSlide: (id: string, updated: Partial<Slide>) => void;
  onRegenerateSlide: (id: string) => void;
  onExportPPTX: () => void;
  onExportPDF: () => void;
  onStartOver: () => void;
  onReorderSlides?: (slides: Slide[]) => void;
  onAddSlide?: (type: SlideType, afterId?: string) => void;
  onDeleteSlide?: (id: string) => void;
}

const THEME_COLORS: Record<
  string,
  { bg: string; title: string; body: string; accent: string; cardBg: string }
> = {
  corporate: {
    bg: "bg-white",
    title: "text-slate-800",
    body: "text-slate-600",
    accent: "text-brand-600",
    cardBg: "bg-slate-50",
  },
  creative: {
    bg: "bg-white",
    title: "text-purple-900",
    body: "text-purple-700",
    accent: "text-purple-500",
    cardBg: "bg-purple-50",
  },
  minimal: {
    bg: "bg-white",
    title: "text-gray-900",
    body: "text-gray-600",
    accent: "text-gray-400",
    cardBg: "bg-gray-50",
  },
  bold: {
    bg: "bg-slate-900",
    title: "text-white",
    body: "text-slate-300",
    accent: "text-amber-400",
    cardBg: "bg-slate-800",
  },
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
  onReorderSlides,
  onAddSlide,
  onDeleteSlide,
}: SlideEditorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    slides[0]?.id || null
  );
  const [exporting, setExporting] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
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

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const newSlides = [...slides];
    const [removed] = newSlides.splice(dragIndex, 1);
    newSlides.splice(index, 0, removed);
    onReorderSlides?.(newSlides);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  // Fullscreen preview
  if (showPreview) {
    return (
      <PreviewMode
        slides={slides}
        theme={theme}
        startIndex={previewIndex}
        onClose={() => setShowPreview(false)}
      />
    );
  }

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
            <h1 className="font-semibold text-slate-800 truncate max-w-xs">
              {title}
            </h1>
            <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">
              {slides.length} slides
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setPreviewIndex(
                  selectedId
                    ? slides.findIndex((s) => s.id === selectedId)
                    : 0
                );
                setShowPreview(true);
              }}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
              title="Present"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Present
            </button>
            <button
              onClick={() => setShowNotes(!showNotes)}
              className={`px-3 py-2 text-sm border rounded-lg transition-colors flex items-center gap-1.5 ${
                showNotes
                  ? "border-brand-300 bg-brand-50 text-brand-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Notes
            </button>
            <button
              onClick={() => handleExport("pdf")}
              disabled={exporting !== null}
              className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {exporting === "pdf" ? (
                <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full spinner" />
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
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
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              )}
              PPTX
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Slide Thumbnails Sidebar */}
        <div className="w-52 shrink-0 border-r border-slate-200 bg-slate-50 overflow-y-auto p-3 hidden md:block">
          <div className="space-y-2">
            {slides.map((s, i) => (
              <div
                key={s.id}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDrop={() => handleDrop(i)}
                onDragEnd={handleDragEnd}
                onClick={() => setSelectedId(s.id)}
                className={`rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                  selectedId === s.id
                    ? "border-brand-500 shadow-md"
                    : dragOverIndex === i
                    ? "border-brand-300 border-dashed"
                    : "border-transparent hover:border-slate-300"
                } ${dragIndex === i ? "opacity-50" : ""}`}
              >
                <div className={`slide-card ${tc.bg} p-2 relative`}>
                  <div className="text-[6px] font-bold truncate">
                    {s.heading}
                  </div>
                  {s.bullets && s.bullets.length > 0 && (
                    <div className="mt-0.5 space-y-0.5">
                      {s.bullets.slice(0, 3).map((b, j) => (
                        <div key={j} className="text-[4px] opacity-60 truncate">
                          &bull; {b}
                        </div>
                      ))}
                    </div>
                  )}
                  {s.type === "quote" && s.quote && (
                    <div className="text-[4px] italic opacity-60 truncate mt-0.5">
                      &ldquo;{s.quote}&rdquo;
                    </div>
                  )}
                  {s.type === "statistic" && s.stats && (
                    <div className="flex gap-1 mt-0.5">
                      {s.stats.slice(0, 2).map((st, j) => (
                        <div
                          key={j}
                          className="text-[5px] font-bold opacity-70"
                        >
                          {st.value}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="bg-white px-2 py-1 text-[10px] text-slate-500 border-t border-slate-100 flex items-center justify-between">
                  <span>
                    {i + 1}. {s.type}
                  </span>
                  {onDeleteSlide && slides.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSlide(s.id);
                        if (selectedId === s.id) {
                          const newSlides = slides.filter(
                            (sl) => sl.id !== s.id
                          );
                          setSelectedId(newSlides[0]?.id || null);
                        }
                      }}
                      className="text-slate-400 hover:text-red-500 text-xs"
                    >
                      &times;
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Add Slide Button */}
            {onAddSlide && (
              <div className="relative">
                <button
                  onClick={() => setShowAddMenu(!showAddMenu)}
                  className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-400 hover:border-brand-400 hover:text-brand-600 transition-colors text-sm flex items-center justify-center gap-1"
                >
                  + Add Slide
                </button>
                {showAddMenu && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 max-h-64 overflow-y-auto">
                    {SLIDE_TEMPLATES.map((t) => (
                      <button
                        key={t.type}
                        onClick={() => {
                          onAddSlide(t.type, selectedId || undefined);
                          setShowAddMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-sm"
                      >
                        <span>{t.icon}</span>
                        <div>
                          <div className="font-medium text-slate-700">
                            {t.label}
                          </div>
                          <div className="text-xs text-slate-400">
                            {t.desc}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedSlide ? (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto">
                {/* Slide Preview */}
                <div
                  className={`slide-card ${tc.bg} rounded-2xl border border-slate-200 shadow-lg p-8 mb-6`}
                >
                  <SlidePreview slide={selectedSlide} tc={tc} />
                </div>

                {/* Presenter Notes */}
                {showNotes && (
                  <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        className="w-4 h-4 text-amber-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span className="text-sm font-semibold text-amber-800">
                        Presenter Notes
                      </span>
                    </div>
                    <textarea
                      value={selectedSlide.notes || ""}
                      onChange={(e) =>
                        onUpdateSlide(selectedSlide.id, {
                          notes: e.target.value,
                        })
                      }
                      placeholder="Add speaker notes for this slide..."
                      className="w-full bg-white/50 border border-amber-200 rounded-lg p-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                      rows={3}
                    />
                  </div>
                )}

                {/* Edit Controls */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-800">
                      Edit Slide
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onRegenerateSlide(selectedSlide.id)}
                        className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors flex items-center gap-1"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        AI Regenerate
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Slide Type Selector */}
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">
                        Slide Type
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {SLIDE_TEMPLATES.map((t) => (
                          <button
                            key={t.type}
                            onClick={() =>
                              onUpdateSlide(selectedSlide.id, {
                                type: t.type,
                              })
                            }
                            className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                              selectedSlide.type === t.type
                                ? "border-brand-500 bg-brand-50 text-brand-700"
                                : "border-slate-200 text-slate-500 hover:border-slate-300"
                            }`}
                          >
                            {t.icon} {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Heading */}
                    <div>
                      <label className="text-xs font-medium text-slate-500 mb-1 block">
                        Heading
                      </label>
                      <input
                        type="text"
                        value={selectedSlide.heading}
                        onChange={(e) =>
                          onUpdateSlide(selectedSlide.id, {
                            heading: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      />
                    </div>

                    {/* Subtitle */}
                    {selectedSlide.sub !== undefined && (
                      <div>
                        <label className="text-xs font-medium text-slate-500 mb-1 block">
                          Subtitle
                        </label>
                        <input
                          type="text"
                          value={selectedSlide.sub || ""}
                          onChange={(e) =>
                            onUpdateSlide(selectedSlide.id, {
                              sub: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        />
                      </div>
                    )}

                    {/* Bullets */}
                    {selectedSlide.bullets && (
                      <BulletEditor
                        bullets={selectedSlide.bullets}
                        onChange={(bullets) =>
                          onUpdateSlide(selectedSlide.id, { bullets })
                        }
                      />
                    )}

                    {/* Two-column */}
                    {(selectedSlide.leftCol || selectedSlide.rightCol) && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-slate-500 mb-1 block">
                            Left Column
                          </label>
                          <ColumnEditor
                            items={selectedSlide.leftCol || []}
                            onChange={(leftCol) =>
                              onUpdateSlide(selectedSlide.id, { leftCol })
                            }
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-500 mb-1 block">
                            Right Column
                          </label>
                          <ColumnEditor
                            items={selectedSlide.rightCol || []}
                            onChange={(rightCol) =>
                              onUpdateSlide(selectedSlide.id, { rightCol })
                            }
                          />
                        </div>
                      </div>
                    )}

                    {/* Quote */}
                    {selectedSlide.type === "quote" && (
                      <>
                        <div>
                          <label className="text-xs font-medium text-slate-500 mb-1 block">
                            Quote
                          </label>
                          <textarea
                            value={selectedSlide.quote || ""}
                            onChange={(e) =>
                              onUpdateSlide(selectedSlide.id, {
                                quote: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-500 mb-1 block">
                            Author
                          </label>
                          <input
                            type="text"
                            value={selectedSlide.author || ""}
                            onChange={(e) =>
                              onUpdateSlide(selectedSlide.id, {
                                author: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                          />
                        </div>
                      </>
                    )}

                    {/* Statistics */}
                    {selectedSlide.type === "statistic" && (
                      <div>
                        <label className="text-xs font-medium text-slate-500 mb-1 block">
                          Statistics
                        </label>
                        <div className="space-y-2">
                          {(selectedSlide.stats || []).map((stat, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2"
                            >
                              <input
                                type="text"
                                value={stat.value}
                                onChange={(e) => {
                                  const newStats = [
                                    ...(selectedSlide.stats || []),
                                  ];
                                  newStats[i] = {
                                    ...newStats[i],
                                    value: e.target.value,
                                  };
                                  onUpdateSlide(selectedSlide.id, {
                                    stats: newStats,
                                  });
                                }}
                                placeholder="Value (e.g. 95%)"
                                className="w-24 px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                              />
                              <input
                                type="text"
                                value={stat.label}
                                onChange={(e) => {
                                  const newStats = [
                                    ...(selectedSlide.stats || []),
                                  ];
                                  newStats[i] = {
                                    ...newStats[i],
                                    label: e.target.value,
                                  };
                                  onUpdateSlide(selectedSlide.id, {
                                    stats: newStats,
                                  });
                                }}
                                placeholder="Label"
                                className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                              />
                              <button
                                onClick={() => {
                                  const newStats =
                                    selectedSlide.stats?.filter(
                                      (_, j) => j !== i
                                    ) || [];
                                  onUpdateSlide(selectedSlide.id, {
                                    stats: newStats,
                                  });
                                }}
                                className="text-slate-400 hover:text-red-500 text-sm"
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              const newStats = [
                                ...(selectedSlide.stats || []),
                                { value: "", label: "" },
                              ];
                              onUpdateSlide(selectedSlide.id, {
                                stats: newStats,
                              });
                            }}
                            className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                          >
                            + Add stat
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Timeline */}
                    {selectedSlide.type === "timeline" && (
                      <div>
                        <label className="text-xs font-medium text-slate-500 mb-1 block">
                          Timeline Items
                        </label>
                        <div className="space-y-2">
                          {(selectedSlide.timeline || []).map((item, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <span className="text-xs text-slate-400 w-4 mt-2">
                                {i + 1}.
                              </span>
                              <div className="flex-1 space-y-1">
                                <input
                                  type="text"
                                  value={item.label}
                                  onChange={(e) => {
                                    const newTimeline = [
                                      ...(selectedSlide.timeline || []),
                                    ];
                                    newTimeline[i] = {
                                      ...newTimeline[i],
                                      label: e.target.value,
                                    };
                                    onUpdateSlide(selectedSlide.id, {
                                      timeline: newTimeline,
                                    });
                                  }}
                                  placeholder="Label (e.g. Q1 2025)"
                                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                />
                                <input
                                  type="text"
                                  value={item.description}
                                  onChange={(e) => {
                                    const newTimeline = [
                                      ...(selectedSlide.timeline || []),
                                    ];
                                    newTimeline[i] = {
                                      ...newTimeline[i],
                                      description: e.target.value,
                                    };
                                    onUpdateSlide(selectedSlide.id, {
                                      timeline: newTimeline,
                                    });
                                  }}
                                  placeholder="Description"
                                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                                />
                              </div>
                              <button
                                onClick={() => {
                                  const newTimeline =
                                    selectedSlide.timeline?.filter(
                                      (_, j) => j !== i
                                    ) || [];
                                  onUpdateSlide(selectedSlide.id, {
                                    timeline: newTimeline,
                                  });
                                }}
                                className="text-slate-400 hover:text-red-500 text-sm mt-2"
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              const newTimeline = [
                                ...(selectedSlide.timeline || []),
                                { label: "", description: "" },
                              ];
                              onUpdateSlide(selectedSlide.id, {
                                timeline: newTimeline,
                              });
                            }}
                            className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                          >
                            + Add timeline item
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Image */}
                    {(selectedSlide.type === "image-left" ||
                      selectedSlide.type === "image-right") && (
                      <div>
                        <label className="text-xs font-medium text-slate-500 mb-1 block">
                          Image URL
                        </label>
                        <input
                          type="text"
                          value={selectedSlide.imageUrl || ""}
                          onChange={(e) =>
                            onUpdateSlide(selectedSlide.id, {
                              imageUrl: e.target.value,
                            })
                          }
                          placeholder="https://example.com/image.jpg"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        />
                        <label className="text-xs font-medium text-slate-500 mb-1 mt-2 block">
                          Or AI Image Prompt
                        </label>
                        <input
                          type="text"
                          value={selectedSlide.imagePrompt || ""}
                          onChange={(e) =>
                            onUpdateSlide(selectedSlide.id, {
                              imagePrompt: e.target.value,
                            })
                          }
                          placeholder="Describe an image to generate..."
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        />
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

/* ---------- Sub-components ---------- */

function BulletEditor({
  bullets,
  onChange,
}: {
  bullets: string[];
  onChange: (bullets: string[]) => void;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-500 mb-1 block">
        Bullet Points
      </label>
      <div className="space-y-2">
        {bullets.map((b, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-slate-400 w-4">
              {i + 1}.
            </span>
            <input
              type="text"
              value={b}
              onChange={(e) => {
                const newBullets = [...bullets];
                newBullets[i] = e.target.value;
                onChange(newBullets);
              }}
              className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
            <button
              onClick={() => {
                onChange(bullets.filter((_, j) => j !== i));
              }}
              className="text-slate-400 hover:text-red-500 text-sm"
            >
              &times;
            </button>
          </div>
        ))}
        <button
          onClick={() => {
            onChange([...bullets, "New point"]);
          }}
          className="text-xs text-brand-600 hover:text-brand-700 font-medium"
        >
          + Add bullet
        </button>
      </div>
    </div>
  );
}

function ColumnEditor({
  items,
  onChange,
}: {
  items: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <input
          key={i}
          type="text"
          value={item}
          onChange={(e) => {
            const newCol = [...items];
            newCol[i] = e.target.value;
            onChange(newCol);
          }}
          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
      ))}
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
          <h1 className={`text-2xl md:text-3xl font-bold ${tc.title} mb-2`}>
            {slide.heading}
          </h1>
          {slide.sub && (
            <p className={`text-sm md:text-base ${tc.accent}`}>{slide.sub}</p>
          )}
        </div>
      );

    case "content":
      return (
        <div className="h-full flex flex-col">
          <h2 className={`text-lg md:text-xl font-bold ${tc.title} mb-4`}>
            {slide.heading}
          </h2>
          {slide.bullets && slide.bullets.length > 0 && (
            <ul className="space-y-2 flex-1">
              {slide.bullets.map((b, i) => (
                <li
                  key={i}
                  className={`text-xs md:text-sm ${tc.body} flex items-start gap-2`}
                >
                  <span
                    className={`mt-1.5 w-1.5 h-1.5 rounded-full ${tc.accent.replace("text-", "bg-")} shrink-0`}
                  />
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
          <h2 className={`text-lg md:text-xl font-bold ${tc.title} mb-4`}>
            {slide.heading}
          </h2>
          <div className="grid grid-cols-2 gap-4 flex-1">
            <div>
              {slide.leftCol?.map((item, i) => (
                <div key={i} className={`text-xs ${tc.body} py-1`}>
                  &bull; {item}
                </div>
              ))}
            </div>
            <div>
              {slide.rightCol?.map((item, i) => (
                <div key={i} className={`text-xs ${tc.body} py-1`}>
                  &bull; {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case "image-left":
      return (
        <div className="h-full flex flex-col">
          <h2 className={`text-lg md:text-xl font-bold ${tc.title} mb-4`}>
            {slide.heading}
          </h2>
          <div className="flex gap-4 flex-1">
            <div className="w-1/2 bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-400">
              {slide.imageUrl ? (
                <img
                  src={slide.imageUrl}
                  alt=""
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                "Image"
              )}
            </div>
            <div className="w-1/2">
              {slide.bullets?.map((b, i) => (
                <div key={i} className={`text-xs ${tc.body} py-1`}>
                  &bull; {b}
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case "image-right":
      return (
        <div className="h-full flex flex-col">
          <h2 className={`text-lg md:text-xl font-bold ${tc.title} mb-4`}>
            {slide.heading}
          </h2>
          <div className="flex gap-4 flex-1">
            <div className="w-1/2">
              {slide.bullets?.map((b, i) => (
                <div key={i} className={`text-xs ${tc.body} py-1`}>
                  &bull; {b}
                </div>
              ))}
            </div>
            <div className="w-1/2 bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-400">
              {slide.imageUrl ? (
                <img
                  src={slide.imageUrl}
                  alt=""
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                "Image"
              )}
            </div>
          </div>
        </div>
      );

    case "quote":
      return (
        <div className="flex flex-col items-center justify-center h-full text-center px-8">
          <div className={`text-4xl ${tc.accent} mb-4`}>&ldquo;</div>
          <p className={`text-lg md:text-xl italic ${tc.body} mb-4`}>
            {slide.quote || "Enter a quote..."}
          </p>
          {slide.author && (
            <p className={`text-sm ${tc.accent} font-medium`}>
              — {slide.author}
            </p>
          )}
        </div>
      );

    case "comparison":
      return (
        <div className="h-full flex flex-col">
          <h2 className={`text-lg md:text-xl font-bold ${tc.title} mb-4`}>
            {slide.heading}
          </h2>
          <div className="grid grid-cols-2 gap-4 flex-1">
            <div className={`${tc.cardBg} rounded-lg p-3`}>
              <h4 className={`text-sm font-bold ${tc.title} mb-2`}>
                Option A
              </h4>
              {slide.leftCol?.map((item, i) => (
                <div key={i} className={`text-xs ${tc.body} py-0.5`}>
                  {item}
                </div>
              ))}
            </div>
            <div className={`${tc.cardBg} rounded-lg p-3`}>
              <h4 className={`text-sm font-bold ${tc.title} mb-2`}>
                Option B
              </h4>
              {slide.rightCol?.map((item, i) => (
                <div key={i} className={`text-xs ${tc.body} py-0.5`}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case "timeline":
      return (
        <div className="h-full flex flex-col">
          <h2 className={`text-lg md:text-xl font-bold ${tc.title} mb-4`}>
            {slide.heading}
          </h2>
          <div className="flex-1 flex items-center">
            <div className="w-full">
              {slide.timeline?.map((item, i) => (
                <div key={i} className="flex items-start gap-3 mb-3">
                  <div
                    className={`w-6 h-6 rounded-full ${tc.accent.replace("text-", "bg-")} text-white flex items-center justify-center text-xs font-bold shrink-0`}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <div className={`text-sm font-semibold ${tc.title}`}>
                      {item.label}
                    </div>
                    <div className={`text-xs ${tc.body}`}>
                      {item.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case "statistic":
      return (
        <div className="h-full flex flex-col">
          <h2 className={`text-lg md:text-xl font-bold ${tc.title} mb-4`}>
            {slide.heading}
          </h2>
          <div className="flex-1 flex items-center justify-center">
            <div className="grid grid-cols-2 gap-6">
              {slide.stats?.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className={`text-2xl md:text-3xl font-bold ${tc.accent}`}>
                    {stat.value || "—"}
                  </div>
                  <div className={`text-xs ${tc.body} mt-1`}>
                    {stat.label || "Label"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case "closing":
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <h1 className={`text-2xl md:text-3xl font-bold ${tc.title} mb-2`}>
            {slide.heading}
          </h1>
          {slide.sub && (
            <p className={`text-sm ${tc.accent} mb-4`}>{slide.sub}</p>
          )}
          {slide.bullets && slide.bullets.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {slide.bullets.map((b, i) => (
                <span
                  key={i}
                  className={`text-xs px-3 py-1 rounded-full border ${tc.body} border-current opacity-70`}
                >
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

/* ---------- Fullscreen Preview / Presenter Mode ---------- */

function PreviewMode({
  slides,
  theme,
  startIndex,
  onClose,
}: {
  slides: Slide[];
  theme: string;
  startIndex: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(startIndex);
  const tc = THEME_COLORS[theme] || THEME_COLORS.corporate;
  const slide = slides[current];

  const goNext = () => setCurrent((c) => Math.min(c + 1, slides.length - 1));
  const goPrev = () => setCurrent((c) => Math.max(c - 1, 0));

  // Keyboard navigation
  if (typeof window !== "undefined") {
    window.onkeydown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape") onClose();
    };
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Slide */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div
          className={`w-full max-w-5xl aspect-video ${tc.bg} rounded-xl shadow-2xl p-12`}
        >
          {slide && <SlidePreview slide={slide} tc={tc} />}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-black/80 backdrop-blur px-6 py-3 flex items-center justify-between">
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white text-sm flex items-center gap-1"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          Exit (Esc)
        </button>

        <div className="flex items-center gap-4">
          <button
            onClick={goPrev}
            disabled={current === 0}
            className="text-white/60 hover:text-white disabled:opacity-30 px-3 py-1"
          >
            &larr; Prev
          </button>
          <span className="text-white/80 text-sm">
            {current + 1} / {slides.length}
          </span>
          <button
            onClick={goNext}
            disabled={current === slides.length - 1}
            className="text-white/60 hover:text-white disabled:opacity-30 px-3 py-1"
          >
            Next &rarr;
          </button>
        </div>

        {slide?.notes && (
          <div className="text-white/40 text-xs max-w-xs truncate">
            📝 {slide.notes}
          </div>
        )}
      </div>
    </div>
  );
}
