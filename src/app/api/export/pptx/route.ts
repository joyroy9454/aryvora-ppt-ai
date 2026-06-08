import { NextRequest, NextResponse } from "next/server";
import type { Slide, TemplateId } from "@/types";
import PptxGenJS from "pptxgenjs";
import { THEMES } from "@/lib/constants";

// ── Helpers ──
function truncate(str: string, max: number): string {
  if (!str) return "";
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

function hex(hexColor: string): string {
  return hexColor.replace("#", "");
}

// ── Professional PPTX Export ──
export async function POST(request: NextRequest) {
  try {
    const { slides, title, theme } = (await request.json()) as {
      slides: Slide[];
      title: string;
      theme: TemplateId;
    };

    if (!slides || !Array.isArray(slides) || slides.length === 0) {
      return NextResponse.json({ error: "No slides provided." }, { status: 400 });
    }

    const t = THEMES[theme] || THEMES.corporate;
    const pptx = new PptxGenJS();
    pptx.title = title || "Presentation";
    pptx.layout = "LAYOUT_WIDE";
    pptx.author = "Aryvora AI";

    for (const slideData of slides) {
      const s = pptx.addSlide();
      s.background = { color: hex(t.bg) };

      switch (slideData.type) {
        case "title":
          renderTitleSlide(s, slideData, t, slides.indexOf(slideData) + 1, slides.length);
          break;
        case "content":
          renderContentSlide(s, slideData, t, slides.indexOf(slideData) + 1, slides.length);
          break;
        case "two-column":
          renderTwoColumnSlide(s, slideData, t, slides.indexOf(slideData) + 1, slides.length);
          break;
        case "comparison":
          renderComparisonSlide(s, slideData, t, slides.indexOf(slideData) + 1, slides.length);
          break;
        case "statistic":
          renderStatisticSlide(s, slideData, t, slides.indexOf(slideData) + 1, slides.length);
          break;
        case "quote":
          renderQuoteSlide(s, slideData, t, slides.indexOf(slideData) + 1, slides.length);
          break;
        case "timeline":
          renderTimelineSlide(s, slideData, t, slides.indexOf(slideData) + 1, slides.length);
          break;
        case "process":
          renderProcessSlide(s, slideData, t, slides.indexOf(slideData) + 1, slides.length);
          break;
        case "chart":
          renderChartSlide(s, slideData, t, slides.indexOf(slideData) + 1, slides.length);
          break;
        case "diagram":
          renderDiagramSlide(s, slideData, t, slides.indexOf(slideData) + 1, slides.length);
          break;
        case "case-study":
          renderCaseStudySlide(s, slideData, t, slides.indexOf(slideData) + 1, slides.length);
          break;
        case "divider":
          renderDividerSlide(s, slideData, t);
          break;
        case "summary":
          renderSummarySlide(s, slideData, t, slides.indexOf(slideData) + 1, slides.length);
          break;
        case "qa":
          renderQASlide(s, slideData, t, slides.indexOf(slideData) + 1, slides.length);
          break;
        case "image-left":
          renderImageSlide(s, slideData, t, "left", slides.indexOf(slideData) + 1, slides.length);
          break;
        case "image-right":
          renderImageSlide(s, slideData, t, "right", slides.indexOf(slideData) + 1, slides.length);
          break;
        case "closing":
          renderClosingSlide(s, slideData, t, slides.indexOf(slideData) + 1, slides.length);
          break;
        case "blank":
          renderBlankSlide(s, slideData, t, slides.indexOf(slideData) + 1, slides.length);
          break;
        default:
          renderContentSlide(s, slideData, t, slides.indexOf(slideData) + 1, slides.length);
          break;
      }

      // Speaker notes
      if (slideData.notes) {
        s.addNotes(slideData.notes);
      }
    }

    const buffer = await pptx.write({ outputType: "nodebuffer" });
    const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer as ArrayBuffer);

    const safeTitle = (title || "presentation")
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 50);

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${safeTitle}.pptx"`,
      },
    });
  } catch (err) {
    console.error("PPTX export error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? `Export failed: ${err.message}` : "Failed to export PPTX." },
      { status: 500 }
    );
  }
}

// ── Slide Renderers ──

function addSlideNumber(s: PptxGenJS.Slide, slideNum: number, total: number, t: any) {
  s.addText(`${slideNum} / ${total}`, {
    x: 12.0, y: 6.9, w: 1.2, fontSize: 9, color: "999999", align: "right", fontFace: "Arial",
  });
}

function addAccentBar(s: PptxGenJS.Slide, x: number, y: number, w: number, color: string) {
  s.addShape(PptxGenJS.ShapeType.rect, { x, y, w, h: 0.06, fill: { color: hex(color) } });
}

function addHeading(s: PptxGenJS.Slide, text: string, t: any, opts?: { x?: number; y?: number; w?: number; fontSize?: number; align?: "left" | "center" }) {
  s.addText(truncate(text, 70), {
    x: opts?.x ?? 0.6, y: opts?.y ?? 0.35, w: opts?.w ?? 12.1,
    fontSize: opts?.fontSize ?? 30, bold: true, color: hex(t.titleColor),
    align: opts?.align ?? "left", fontFace: "Arial",
  });
}

function addSubheading(s: PptxGenJS.Slide, text: string, t: any, opts?: { x?: number; y?: number; w?: number }) {
  if (!text) return;
  s.addText(truncate(text, 80), {
    x: opts?.x ?? 0.6, y: opts?.y ?? 0.85, w: opts?.w ?? 12.1,
    fontSize: 16, color: hex(t.accent), fontFace: "Arial",
  });
}

function addBullets(s: PptxGenJS.Slide, bullets: string[], t: any, opts?: { x?: number; y?: number; w?: number; fontSize?: number }) {
  if (!bullets || bullets.length === 0) return;
  const items = bullets.slice(0, 6).map((b) => ({
    text: truncate(b, 100),
    options: { bullet: true as const, color: hex(t.bodyColor), fontSize: opts?.fontSize ?? 16, spacing: { line: 260 }, fontFace: "Arial" },
  }));
  s.addText(items, { x: opts?.x ?? 0.6, y: opts?.y ?? 1.2, w: opts?.w ?? 12.1, valign: "top" });
}

// ── Title Slide ──
function renderTitleSlide(s: PptxGenJS.Slide, data: Slide, t: any, num: number, total: number) {
  // Full-width accent bar at top
  s.addShape(PptxGenJS.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.12, fill: { color: hex(t.accent) } });

  // Large centered title
  s.addText(truncate(data.heading, 50), {
    x: 1.5, y: 2.0, w: 10.33, fontSize: 42, bold: true, color: hex(t.titleColor),
    align: "center", fontFace: "Arial",
  });

  // Subtitle
  if (data.sub) {
    s.addText(truncate(data.sub, 70), {
      x: 2.0, y: 3.4, w: 9.33, fontSize: 20, color: hex(t.accent), align: "center", fontFace: "Arial",
    });
  }

  // Decorative accent line
  s.addShape(PptxGenJS.ShapeType.rect, { x: 5.5, y: 3.1, w: 2.33, h: 0.05, fill: { color: hex(t.accent) } });

  // Bottom bar
  s.addShape(PptxGenJS.ShapeType.rect, { x: 0, y: 7.0, w: 13.33, h: 0.05, fill: { color: hex(t.surface) } });

  addSlideNumber(s, num, total, t);
  if (data.notes) s.addNotes(data.notes);
}

// ── Content Slide ──
function renderContentSlide(s: PptxGenJS.Slide, data: Slide, t: any, num: number, total: number) {
  // Left accent bar
  s.addShape(PptxGenJS.ShapeType.rect, { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: hex(t.accent) } });

  addHeading(s, data.heading, t, { x: 0.5, y: 0.3, w: 12.33 });
  addAccentBar(s, 0.5, 0.75, 1.5, t.accent);

  addBullets(s, data.bullets || [], t, { x: 0.5, y: 1.0, w: 12.33, fontSize: 17 });

  addSlideNumber(s, num, total, t);
}

// ── Two Column Slide ──
function renderTwoColumnSlide(s: PptxGenJS.Slide, data: Slide, t: any, num: number, total: number) {
  s.addShape(PptxGenJS.ShapeType.rect, { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: hex(t.accent) } });

  addHeading(s, data.heading, t, { x: 0.5, y: 0.3, w: 12.33 });
  addAccentBar(s, 0.5, 0.75, 1.5, t.accent);

  // Left column
  const leftItems = data.leftCol || [];
  if (leftItems.length > 0) {
    s.addShape(PptxGenJS.ShapeType.rect, { x: 0.5, y: 1.0, w: 5.8, h: 0.4, fill: { color: hex(t.accent) } });
    s.addText(truncate(leftItems[0], 35), { x: 0.6, y: 1.02, w: 5.6, fontSize: 14, bold: true, color: "FFFFFF", fontFace: "Arial" });
    if (leftItems.length > 1) {
      addBullets(s, leftItems.slice(1), t, { x: 0.5, y: 1.5, w: 5.8, fontSize: 14 });
    }
  }

  // Right column
  const rightItems = data.rightCol || [];
  if (rightItems.length > 0) {
    s.addShape(PptxGenJS.ShapeType.rect, { x: 6.9, y: 1.0, w: 5.8, h: 0.4, fill: { color: hex(t.titleColor) } });
    s.addText(truncate(rightItems[0], 35), { x: 7.0, y: 1.02, w: 5.6, fontSize: 14, bold: true, color: "FFFFFF", fontFace: "Arial" });
    if (rightItems.length > 1) {
      addBullets(s, rightItems.slice(1), t, { x: 6.9, y: 1.5, w: 5.8, fontSize: 14 });
    }
  }

  // Divider
  s.addShape(PptxGenJS.ShapeType.line, { x: 6.4, y: 1.0, w: 0, h: 5.8, line: { color: hex(t.surface), width: 1 } });

  addSlideNumber(s, num, total, t);
}

// ── Comparison Slide ──
function renderComparisonSlide(s: PptxGenJS.Slide, data: Slide, t: any, num: number, total: number) {
  s.addShape(PptxGenJS.ShapeType.rect, { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: hex(t.accent) } });

  addHeading(s, data.heading, t, { x: 0.5, y: 0.3, w: 12.33 });
  addAccentBar(s, 0.5, 0.75, 1.5, t.accent);

  const leftItems = data.leftCol || [];
  const rightItems = data.rightCol || [];

  // Left card
  s.addShape(PptxGenJS.ShapeType.roundRect, { x: 0.5, y: 1.0, w: 5.7, h: 5.5, fill: { color: hex(t.surface) }, rectRadius: 0.1 });
  if (leftItems.length > 0) {
    s.addShape(PptxGenJS.ShapeType.rect, { x: 0.5, y: 1.0, w: 5.7, h: 0.45, fill: { color: hex(t.accent) } });
    s.addText(truncate(leftItems[0], 30), { x: 0.65, y: 1.05, w: 5.4, fontSize: 15, bold: true, color: "FFFFFF", fontFace: "Arial" });
    if (leftItems.length > 1) addBullets(s, leftItems.slice(1), t, { x: 0.6, y: 1.6, w: 5.5, fontSize: 14 });
  }

  // Right card
  s.addShape(PptxGenJS.ShapeType.roundRect, { x: 7.1, y: 1.0, w: 5.7, h: 5.5, fill: { color: hex(t.surface) }, rectRadius: 0.1 });
  if (rightItems.length > 0) {
    s.addShape(PptxGenJS.ShapeType.rect, { x: 7.1, y: 1.0, w: 5.7, h: 0.45, fill: { color: hex(t.titleColor) } });
    s.addText(truncate(rightItems[0], 30), { x: 7.25, y: 1.05, w: 5.4, fontSize: 15, bold: true, color: "FFFFFF", fontFace: "Arial" });
    if (rightItems.length > 1) addBullets(s, rightItems.slice(1), t, { x: 7.2, y: 1.6, w: 5.5, fontSize: 14 });
  }

  // VS badge
  s.addShape(PptxGenJS.ShapeType.ellipse, { x: 6.2, y: 3.0, w: 0.9, h: 0.9, fill: { color: hex(t.accent) } });
  s.addText("VS", { x: 6.2, y: 3.15, w: 0.9, fontSize: 16, bold: true, color: "FFFFFF", align: "center", fontFace: "Arial" });

  addSlideNumber(s, num, total, t);
}

// ── Statistic Slide ──
function renderStatisticSlide(s: PptxGenJS.Slide, data: Slide, t: any, num: number, total: number) {
  s.addShape(PptxGenJS.ShapeType.rect, { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: hex(t.accent) } });

  addHeading(s, data.heading, t, { x: 0.5, y: 0.3, w: 12.33 });
  addAccentBar(s, 0.5, 0.75, 1.5, t.accent);

  const stats = (data.stats || []).slice(0, 4);
  if (stats.length > 0) {
    const cardW = 11.5 / stats.length;
    stats.forEach((stat, i) => {
      const x = 0.9 + i * cardW;
      // Card background
      s.addShape(PptxGenJS.ShapeType.roundRect, { x, y: 1.5, w: cardW - 0.3, h: 4.5, fill: { color: hex(t.surface) }, rectRadius: 0.15 });
      // Value
      s.addText(truncate(String(stat.value || "—"), 12), { x, y: 2.2, w: cardW - 0.3, fontSize: 38, bold: true, color: hex(t.accent), align: "center", fontFace: "Arial" });
      // Label
      s.addText(truncate(stat.label || "", 25), { x, y: 3.5, w: cardW - 0.3, fontSize: 13, color: hex(t.bodyColor), align: "center", fontFace: "Arial" });
    });
  }

  addSlideNumber(s, num, total, t);
}

// ── Quote Slide ──
function renderQuoteSlide(s: PptxGenJS.Slide, data: Slide, t: any, num: number, total: number) {
  // Background accent
  s.addShape(PptxGenJS.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 7.5, fill: { color: hex(t.surface) } });
  s.addShape(PptxGenJS.ShapeType.rect, { x: 0, y: 0, w: 0.15, h: 7.5, fill: { color: hex(t.accent) } });

  // Large quote mark
  s.addText("\u201C", { x: 1.0, y: 1.2, w: 2, fontSize: 80, color: hex(t.accent), fontFace: "Georgia" });

  // Quote text
  s.addText(truncate(data.quote || "", 180), {
    x: 2.0, y: 1.5, w: 9.5, fontSize: 24, italic: true, color: hex(t.bodyColor), align: "center", fontFace: "Georgia",
  });

  // Author
  if (data.author) {
    s.addText("— " + truncate(data.author, 50), {
      x: 2.0, y: 4.2, w: 9.5, fontSize: 16, color: hex(t.accent), align: "center", fontFace: "Arial",
    });
  }

  // Decorative line
  s.addShape(PptxGenJS.ShapeType.rect, { x: 5.5, y: 3.8, w: 2.33, h: 0.04, fill: { color: hex(t.accent) } });

  addSlideNumber(s, num, total, t);
}

// ── Timeline Slide ──
function renderTimelineSlide(s: PptxGenJS.Slide, data: Slide, t: any, num: number, total: number) {
  s.addShape(PptxGenJS.ShapeType.rect, { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: hex(t.accent) } });

  addHeading(s, data.heading, t, { x: 0.5, y: 0.3, w: 12.33 });
  addAccentBar(s, 0.5, 0.75, 1.5, t.accent);

  const items = (data.timeline || []).slice(0, 5);
  if (items.length > 0) {
    const itemW = 11.5 / items.length;
    // Timeline line
    s.addShape(PptxGenJS.ShapeType.line, { x: 1.0, y: 3.2, w: 11.33, h: 0, line: { color: hex(t.accent), width: 2 } });

    items.forEach((item, i) => {
      const x = 1.0 + i * itemW + itemW / 2;
      // Dot
      s.addShape(PptxGenJS.ShapeType.ellipse, { x: x - 0.2, y: 3.0, w: 0.4, h: 0.4, fill: { color: hex(t.accent) } });
      // Label (above)
      s.addText(truncate(item.label, 18), { x: x - itemW / 2 + 0.1, y: 1.5, w: itemW - 0.2, fontSize: 13, bold: true, color: hex(t.titleColor), align: "center", fontFace: "Arial" });
      // Description (below)
      s.addText(truncate(item.description, 35), { x: x - itemW / 2 + 0.1, y: 3.6, w: itemW - 0.2, fontSize: 10, color: hex(t.bodyColor), align: "center", fontFace: "Arial" });
    });
  }

  addSlideNumber(s, num, total, t);
}

// ── Process Slide ──
function renderProcessSlide(s: PptxGenJS.Slide, data: Slide, t: any, num: number, total: number) {
  s.addShape(PptxGenJS.ShapeType.rect, { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: hex(t.accent) } });

  addHeading(s, data.heading, t, { x: 0.5, y: 0.3, w: 12.33 });
  addAccentBar(s, 0.5, 0.75, 1.5, t.accent);

  const steps = (data.process || []).slice(0, 5);
  steps.forEach((step, i) => {
    const y = 1.1 + i * 1.15;
    // Step circle
    s.addShape(PptxGenJS.ShapeType.ellipse, { x: 0.6, y, w: 0.55, h: 0.55, fill: { color: hex(t.accent) } });
    s.addText(`${step.step || i + 1}`, { x: 0.6, y: y + 0.05, w: 0.55, fontSize: 14, bold: true, color: "FFFFFF", align: "center", fontFace: "Arial" });
    // Title
    s.addText(truncate(step.title, 45), { x: 1.35, y: y - 0.02, w: 11.5, fontSize: 17, bold: true, color: hex(t.titleColor), fontFace: "Arial" });
    // Description
    s.addText(truncate(step.description, 70), { x: 1.35, y: y + 0.38, w: 11.5, fontSize: 12, color: hex(t.bodyColor), fontFace: "Arial" });
    // Connector line
    if (i < steps.length - 1) {
      s.addShape(PptxGenJS.ShapeType.line, { x: 0.87, y: y + 0.55, w: 0, h: 0.6, line: { color: hex(t.accent), width: 1, dashType: "dash" } });
    }
  });

  addSlideNumber(s, num, total, t);
}

// ── Chart Slide ──
function renderChartSlide(s: PptxGenJS.Slide, data: Slide, t: any, num: number, total: number) {
  s.addShape(PptxGenJS.ShapeType.rect, { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: hex(t.accent) } });

  addHeading(s, data.heading, t, { x: 0.5, y: 0.3, w: 12.33 });
  addAccentBar(s, 0.5, 0.75, 1.5, t.accent);

  const chartItems = (data.chart || data.stats || []).slice(0, 6);
  if (chartItems.length > 0) {
    const barW = 10.5 / chartItems.length;
    const maxVal = Math.max(...chartItems.map((d) => Number(d.value) || 0), 1);

    chartItems.forEach((d, i) => {
      const val = Number(d.value) || 0;
      const barH = (val / maxVal) * 3.8;
      const x = 1.4 + i * barW;

      // Bar
      s.addShape(PptxGenJS.ShapeType.roundRect, { x, y: 5.8 - barH, w: barW - 0.35, h: barH, fill: { color: hex(t.accent) }, rectRadius: 0.05 });
      // Value label
      s.addText(truncate(String(d.value), 10), { x, y: 5.8 - barH - 0.4, w: barW - 0.35, fontSize: 14, bold: true, color: hex(t.titleColor), align: "center", fontFace: "Arial" });
      // Label
      s.addText(truncate(d.label, 14), { x, y: 5.9, w: barW - 0.35, fontSize: 10, color: hex(t.bodyColor), align: "center", fontFace: "Arial" });
    });
  } else {
    s.addText("No chart data available", { x: 0.5, y: 3.0, w: 12.33, fontSize: 16, color: hex(t.bodyColor), align: "center", fontFace: "Arial" });
  }

  addSlideNumber(s, num, total, t);
}

// ── Diagram Slide ──
function renderDiagramSlide(s: PptxGenJS.Slide, data: Slide, t: any, num: number, total: number) {
  s.addShape(PptxGenJS.ShapeType.rect, { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: hex(t.accent) } });

  addHeading(s, data.heading, t, { x: 0.5, y: 0.3, w: 12.33 });
  addAccentBar(s, 0.5, 0.75, 1.5, t.accent);

  const items = (data.bullets || []).slice(0, 9);
  if (items.length > 0) {
    const cols = Math.min(items.length, 3);
    const rows = Math.ceil(items.length / cols);
    const boxW = 3.5;
    const boxH = 1.2;
    const gapX = 0.4;
    const gapY = 0.4;
    const startX = (13.33 - cols * (boxW + gapX) + gapX) / 2;
    const startY = 1.3;

    items.forEach((item, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (boxW + gapX);
      const y = startY + row * (boxH + gapY);

      s.addShape(PptxGenJS.ShapeType.roundRect, { x, y, w: boxW, h: boxH, fill: { color: hex(t.surface) }, line: { color: hex(t.accent), width: 1.5 }, rectRadius: 0.1 });
      s.addText(truncate(item, 35), { x: x + 0.2, y: y + 0.2, w: boxW - 0.4, h: boxH - 0.4, fontSize: 12, color: hex(t.bodyColor), align: "center", valign: "middle", fontFace: "Arial" });

      // Arrow to next
      if (col < cols - 1 && i < items.length - 1) {
        s.addShape(PptxGenJS.ShapeType.line, { x: x + boxW, y: y + boxH / 2, w: gapX, h: 0, line: { color: hex(t.accent), width: 1.5 } });
      }
    });
  }

  addSlideNumber(s, num, total, t);
}

// ── Case Study Slide ──
function renderCaseStudySlide(s: PptxGenJS.Slide, data: Slide, t: any, num: number, total: number) {
  s.addShape(PptxGenJS.ShapeType.rect, { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: hex(t.accent) } });

  addHeading(s, data.heading, t, { x: 0.5, y: 0.3, w: 12.33 });
  addAccentBar(s, 0.5, 0.75, 1.5, t.accent);

  const sections = [
    { label: "Challenge", items: data.leftCol || [], color: t.accent },
    { label: "Solution", items: data.rightCol || [], color: t.titleColor },
    { label: "Results", items: data.bullets || [], color: t.accent },
  ];
  const secW = 3.8;

  sections.forEach((sec, i) => {
    const x = 0.5 + i * (secW + 0.35);
    // Section header
    s.addShape(PptxGenJS.ShapeType.rect, { x, y: 1.0, w: secW, h: 0.45, fill: { color: hex(sec.color) } });
    s.addText(sec.label, { x: x + 0.15, y: 1.05, w: secW - 0.3, fontSize: 14, bold: true, color: "FFFFFF", fontFace: "Arial" });
    // Content
    if (sec.items.length > 0) {
      addBullets(s, sec.items, t, { x: x + 0.1, y: 1.6, w: secW - 0.2, fontSize: 12 });
    }
  });

  addSlideNumber(s, num, total, t);
}

// ── Divider Slide ──
function renderDividerSlide(s: PptxGenJS.Slide, data: Slide, t: any) {
  // Full background
  s.addShape(PptxGenJS.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 7.5, fill: { color: hex(t.surface) } });

  // Centered large heading
  s.addText(truncate(data.heading, 50), {
    x: 1.0, y: 2.5, w: 11.33, fontSize: 40, bold: true, color: hex(t.titleColor), align: "center", fontFace: "Arial",
  });

  // Accent line
  s.addShape(PptxGenJS.ShapeType.rect, { x: 5.5, y: 3.6, w: 2.33, h: 0.06, fill: { color: hex(t.accent) } });

  if (data.sub) {
    s.addText(truncate(data.sub, 60), { x: 2.0, y: 4.0, w: 9.33, fontSize: 18, color: hex(t.accent), align: "center", fontFace: "Arial" });
  }
}

// ── Summary Slide ──
function renderSummarySlide(s: PptxGenJS.Slide, data: Slide, t: any, num: number, total: number) {
  s.addShape(PptxGenJS.ShapeType.rect, { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: hex(t.accent) } });

  addHeading(s, data.heading, t, { x: 0.5, y: 0.3, w: 12.33 });
  addAccentBar(s, 0.5, 0.75, 1.5, t.accent);

  // Larger font for takeaways
  addBullets(s, data.bullets || [], t, { x: 0.5, y: 1.1, w: 12.33, fontSize: 19 });

  addSlideNumber(s, num, total, t);
}

// ── Q&A Slide ──
function renderQASlide(s: PptxGenJS.Slide, data: Slide, t: any, num: number, total: number) {
  s.addShape(PptxGenJS.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 7.5, fill: { color: hex(t.surface) } });
  s.addShape(PptxGenJS.ShapeType.rect, { x: 0, y: 0, w: 0.15, h: 7.5, fill: { color: hex(t.accent) } });

  s.addText(truncate(data.heading, 40), {
    x: 1.0, y: 1.8, w: 11.33, fontSize: 42, bold: true, color: hex(t.titleColor), align: "center", fontFace: "Arial",
  });

  // Large question mark
  s.addText("?", { x: 5.5, y: 3.0, w: 2.33, fontSize: 72, bold: true, color: hex(t.accent), align: "center", fontFace: "Arial" });

  if (data.bullets && data.bullets.length > 0) {
    s.addText(data.bullets.map((b) => truncate(b, 50)).join("  •  "), {
      x: 1.5, y: 4.8, w: 10.33, fontSize: 15, color: hex(t.bodyColor), align: "center", fontFace: "Arial",
    });
  }

  addSlideNumber(s, num, total, t);
}

// ── Image Slide ──
function renderImageSlide(s: PptxGenJS.Slide, data: Slide, t: any, side: "left" | "right", num: number, total: number) {
  s.addShape(PptxGenJS.ShapeType.rect, { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: hex(t.accent) } });

  const textX = side === "left" ? 6.5 : 0.5;
  const imgX = side === "left" ? 0.5 : 7.0;

  addHeading(s, data.heading, t, { x: textX, y: 0.3, w: 6.0 });
  addAccentBar(s, textX, 0.75, 1.5, t.accent);
  addBullets(s, data.bullets || [], t, { x: textX, y: 1.0, w: 6.0, fontSize: 15 });

  // Image
  if (data.imageUrl) {
    try {
      s.addImage({ path: data.imageUrl, x: imgX, y: 1.0, w: 5.8, h: 5.5 });
    } catch {
      s.addShape(PptxGenJS.ShapeType.rect, { x: imgX, y: 1.0, w: 5.8, h: 5.5, fill: { color: hex(t.surface) }, line: { color: hex(t.accent), width: 1, dashType: "dash" } });
      s.addText("[Image]", { x: imgX, y: 3.5, w: 5.8, fontSize: 14, color: hex(t.bodyColor), align: "center", fontFace: "Arial" });
    }
  } else {
    s.addShape(PptxGenJS.ShapeType.rect, { x: imgX, y: 1.0, w: 5.8, h: 5.5, fill: { color: hex(t.surface) }, line: { color: hex(t.accent), width: 1, dashType: "dash" } });
    s.addText("[Image Placeholder]", { x: imgX, y: 3.5, w: 5.8, fontSize: 14, color: hex(t.bodyColor), align: "center", fontFace: "Arial" });
  }

  addSlideNumber(s, num, total, t);
}

// ── Closing Slide ──
function renderClosingSlide(s: PptxGenJS.Slide, data: Slide, t: any, num: number, total: number) {
  s.addShape(PptxGenJS.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.12, fill: { color: hex(t.accent) } });

  s.addText(truncate(data.heading, 40), {
    x: 1.0, y: 2.0, w: 11.33, fontSize: 44, bold: true, color: hex(t.titleColor), align: "center", fontFace: "Arial",
  });

  if (data.sub) {
    s.addText(truncate(data.sub, 60), { x: 2.0, y: 3.3, w: 9.33, fontSize: 20, color: hex(t.accent), align: "center", fontFace: "Arial" });
  }

  if (data.bullets && data.bullets.length > 0) {
    s.addText(data.bullets.map((b) => truncate(b, 40)).join("  •  "), {
      x: 1.5, y: 4.2, w: 10.33, fontSize: 16, color: hex(t.bodyColor), align: "center", fontFace: "Arial",
    });
  }

  s.addShape(PptxGenJS.ShapeType.rect, { x: 0, y: 7.0, w: 13.33, h: 0.05, fill: { color: hex(t.surface) } });

  addSlideNumber(s, num, total, t);
}

// ── Blank Slide ──
function renderBlankSlide(s: PptxGenJS.Slide, data: Slide, t: any, num: number, total: number) {
  s.addText(truncate(data.heading, 60), {
    x: 0.5, y: 3.0, w: 12.33, fontSize: 22, color: hex(t.bodyColor), align: "center", fontFace: "Arial",
  });
  addSlideNumber(s, num, total, t);
}
