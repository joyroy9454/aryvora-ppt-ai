import { NextRequest, NextResponse } from "next/server";
import type { Slide, TemplateId } from "@/types";
import PptxGenJS from "pptxgenjs";
import { THEMES } from "@/lib/constants";
import { generateImage } from "@/lib/image-generator";

const SHAPE = (() => { const p = new PptxGenJS(); return { rect: p.ShapeType.rect, ellipse: p.ShapeType.ellipse, line: p.ShapeType.line, roundRect: p.ShapeType.roundRect, triangle: p.ShapeType.triangle }; })();
function hex(c: string): string { return c.replace("#", ""); }
function trunc(s: string, n: number): string { return (!s || s.length <= n) ? (s || "") : s.slice(0, n - 1) + "…"; }
const F = "Arial";
const FG = "Georgia";

// pptxgenjs supports `transparency` at runtime but its TypeScript types omit it.
// These helpers cast safely so we can use transparency without `any` everywhere.
function shapeProps(p: Record<string, unknown>): PptxGenJS.ShapeProps { return p as unknown as PptxGenJS.ShapeProps; }
function textProps(p: Record<string, unknown>): PptxGenJS.TextPropsOptions { return p as unknown as PptxGenJS.TextPropsOptions; }

export async function POST(request: NextRequest) {
  try {
    const { slides, title, theme } = (await request.json()) as { slides: Slide[]; title: string; theme: TemplateId };
    if (!slides?.length) return NextResponse.json({ error: "No slides provided." }, { status: 400 });

    const t = THEMES[theme] || THEMES.corporate;
    const pptx = new PptxGenJS();
    pptx.title = title || "Presentation";
    pptx.layout = "LAYOUT_WIDE";
    pptx.author = "Aryvora AI";

    // Generate local images (no external HTTP needed — works on Render free tier)
    const imageCache = new Map<string, string>();
    const imageKeywords = [...new Set(slides.map(s => s.imageKeyword || s.imagePrompt).filter(Boolean))] as string[];
    const imgTheme = { primary: t.titleColor, accent: t.accent, surface: t.surface, bg: t.bg };
    for (const kw of imageKeywords) {
      imageCache.set(kw, generateImage(kw, imgTheme, 800, 600));
    }

    for (let idx = 0; idx < slides.length; idx++) {
      const sl = slides[idx];
      const s = pptx.addSlide();
      s.background = { color: hex(t.bg) };
      const n = idx + 1, N = slides.length;

      switch (sl.type) {
        case "title": addTitleSlide(s, sl, t); break;
        case "statistic": addStatisticSlide(s, sl, t); break;
        case "quote": addQuoteSlide(s, sl, t); break;
        case "timeline": addTimelineSlide(s, sl, t); break;
        case "process": addProcessSlide(s, sl, t); break;
        case "chart": addChartSlide(s, sl, t); break;
        case "diagram": addDiagramSlide(s, sl, t); break;
        case "case-study": addCaseStudySlide(s, sl, t); break;
        case "divider": addDividerSlide(s, sl, t); break;
        case "summary": addSummarySlide(s, sl, t); break;
        case "qa": addQASlide(s, sl, t); break;
        case "image-left": addImageSlide(s, sl, t, true, imageCache); break;
        case "image-right": addImageSlide(s, sl, t, false, imageCache); break;
        case "closing": addClosingSlide(s, sl, t); break;
        case "two-column": addTwoColumnSlide(s, sl, t, false); break;
        case "comparison": addTwoColumnSlide(s, sl, t, true); break;
        default: addContentSlide(s, sl, t); break;
      }
      addSlideNumber(s, n, N, t);
      if (sl.notes) s.addNotes(sl.notes);
    }

    const buffer = await pptx.write({ outputType: "nodebuffer" });
    const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer as ArrayBuffer);
    const safeTitle = (title || "presentation").replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 50);
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${safeTitle}.pptx"`,
      },
    });
  } catch (err) {
    console.error("PPTX export error:", err);
    return NextResponse.json({ error: err instanceof Error ? `Export failed: ${err.message}` : "Failed to export PPTX." }, { status: 500 });
  }
}

// ═══════════════════════════════════════════
// ENHANCED RENDERERS — Richer visuals on every slide
// ═══════════════════════════════════════════

function addTitleSlide(s: PptxGenJS.Slide, sl: Slide, t: any) {
  // Full background with accent color
  s.addShape(SHAPE.rect, { x: 0, y: 0, w: 13.33, h: 7.5, fill: { color: hex(t.surface) } });
  // Left accent bar
  s.addShape(SHAPE.rect, { x: 0, y: 0, w: 0.12, h: 7.5, fill: { color: hex(t.accent) } });
  // Decorative right-side accent block
  s.addShape(SHAPE.rect, shapeProps({ x: 11.5, y: 0, w: 1.83, h: 7.5, fill: { color: hex(t.accent) }, transparency: 85 }));
  // Decorative circles
  s.addShape(SHAPE.ellipse, shapeProps({ x: 10.5, y: -1, w: 4, h: 4, fill: { color: hex(t.accent) }, transparency: 90 }));
  s.addShape(SHAPE.ellipse, shapeProps({ x: 11, y: 5, w: 3, h: 3, fill: { color: hex(t.titleColor) }, transparency: 92 }));
  // Title
  s.addText(trunc(sl.heading, 90), { x: 1.0, y: 1.5, w: 10.0, h: 2.0, fontSize: 44, bold: true, color: hex(t.titleColor), align: "center", fontFace: F, valign: "middle" });
  if (sl.sub) s.addText(trunc(sl.sub, 120), { x: 1.5, y: 3.5, w: 9.0, h: 1.0, fontSize: 20, color: hex(t.accent), align: "center", fontFace: F, valign: "middle" });
  // Decorative line
  addLine(s, 5.5, 4.8, 2.33, 0.06, t.accent);
  // Small accent dots
  s.addShape(SHAPE.ellipse, { x: 4.0, y: 5.5, w: 0.15, h: 0.15, fill: { color: hex(t.accent) } });
  s.addShape(SHAPE.ellipse, { x: 5.5, y: 5.5, w: 0.15, h: 0.15, fill: { color: hex(t.accent) } });
  s.addShape(SHAPE.ellipse, { x: 7.0, y: 5.5, w: 0.15, h: 0.15, fill: { color: hex(t.accent) } });
}

function addContentSlide(s: PptxGenJS.Slide, sl: Slide, t: any) {
  // Left accent bar
  s.addShape(SHAPE.rect, { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: hex(t.accent) } });
  // Subtle top accent line
  s.addShape(SHAPE.rect, shapeProps({ x: 0, y: 0, w: 13.33, h: 0.04, fill: { color: hex(t.accent) }, transparency: 60 }));
  addHeader(s, sl, t);
  const bullets = sl.bullets || [];
  if (bullets.length > 0) {
    s.addText(
      bullets.slice(0, 6).map(b => ({ text: trunc(b, 120), options: { bullet: true as const, color: hex(t.bodyColor), fontSize: 16, spacing: { line: 280 }, fontFace: F } })),
      { x: 0.8, y: 1.2, w: 11.8, h: 5.5, valign: "top" }
    );
  }
  // Bottom accent line
  addLine(s, 0.6, 7.0, 12.13, 0.03, t.accent);
}

function addStatisticSlide(s: PptxGenJS.Slide, sl: Slide, t: any) {
  // Left accent bar
  s.addShape(SHAPE.rect, { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: hex(t.accent) } });
  // Subtle background shape
  s.addShape(SHAPE.roundRect, shapeProps({ x: 0.3, y: 1.0, w: 12.73, h: 6.0, fill: { color: hex(t.surface) }, transparency: 50, rectRadius: 0.15 }));
  addHeader(s, sl, t);
  const stats = (sl.stats || []).slice(0, 4);
  if (stats.length > 0) {
    const cw = 11.5 / stats.length;
    stats.forEach((st, i) => {
      const x = 0.9 + i * cw;
      // Card background
      s.addShape(SHAPE.roundRect, { x, y: 1.3, w: cw - 0.3, h: 5.0, fill: { color: hex(t.surface) }, rectRadius: 0.1 });
      // Top accent bar on card
      s.addShape(SHAPE.rect, { x, y: 1.3, w: cw - 0.3, h: 0.08, fill: { color: hex(t.accent) } });
      // Value
      s.addText(trunc(String(st.value || "—"), 12), { x, y: 2.0, w: cw - 0.3, h: 1.0, fontSize: 38, bold: true, color: hex(t.accent), align: "center", fontFace: F });
      // Divider
      addLine(s, x + (cw - 0.3) * 0.2, 3.2, (cw - 0.3) * 0.6, 0.03, t.accent);
      // Label
      s.addText(trunc(st.label || "", 25), { x, y: 3.5, w: cw - 0.3, h: 0.8, fontSize: 13, color: hex(t.bodyColor), align: "center", fontFace: F });
    });
  }
}

function addQuoteSlide(s: PptxGenJS.Slide, sl: Slide, t: any) {
  // Full surface background
  s.addShape(SHAPE.rect, { x: 0, y: 0, w: 13.33, h: 7.5, fill: { color: hex(t.surface) } });
  // Left accent bar (thicker)
  s.addShape(SHAPE.rect, { x: 0, y: 0, w: 0.15, h: 7.5, fill: { color: hex(t.accent) } });
  // Decorative quote mark
  s.addText("\u201C", textProps({ x: 0.8, y: 0.3, w: 2.0, h: 2.0, fontSize: 100, color: hex(t.accent), fontFace: FG, transparency: 70 }));
  // Quote text
  s.addText(trunc(sl.quote || "", 200), { x: 2.2, y: 1.2, w: 9.0, h: 2.5, fontSize: 24, color: hex(t.bodyColor), align: "center", fontFace: FG, valign: "middle" });
  if (sl.author) {
    addLine(s, 5.5, 4.0, 2.33, 0.04, t.accent);
    s.addText("\u2014 " + trunc(sl.author, 60), { x: 2.2, y: 4.3, w: 9.0, h: 0.8, fontSize: 16, color: hex(t.accent), align: "center", fontFace: F });
  }
  // Decorative bottom accent
  s.addShape(SHAPE.rect, shapeProps({ x: 0, y: 7.3, w: 13.33, h: 0.2, fill: { color: hex(t.accent) }, transparency: 50 }));
}

function addTimelineSlide(s: PptxGenJS.Slide, sl: Slide, t: any) {
  s.addShape(SHAPE.rect, { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: hex(t.accent) } });
  addHeader(s, sl, t);
  const items = (sl.timeline || []).slice(0, 5);
  if (items.length > 0) {
    const iw = 11.5 / items.length;
    // Main timeline line
    addLine(s, 1, 3.5, 11.33, 0, t.accent, 2);
    items.forEach((it, i) => {
      const x = 1 + i * iw + iw / 2;
      // Node circle
      s.addShape(SHAPE.ellipse, { x: x - 0.2, y: 3.3, w: 0.4, h: 0.4, fill: { color: hex(t.accent) } });
      // Inner circle
      s.addShape(SHAPE.ellipse, { x: x - 0.1, y: 3.4, w: 0.2, h: 0.2, fill: { color: hex(t.surface) } });
      // Label (above)
      s.addText(trunc(it.label, 20), { x: x - iw / 2 + 0.1, y: 1.5, w: iw - 0.2, h: 0.6, fontSize: 13, bold: true, color: hex(t.titleColor), align: "center", fontFace: F });
      // Description (below)
      s.addText(trunc(it.description, 40), { x: x - iw / 2 + 0.1, y: 4.0, w: iw - 0.2, h: 1.5, fontSize: 10, color: hex(t.bodyColor), align: "center", fontFace: F });
      // Connecting vertical line
      addLine(s, x, 3.7, 0, 0.3, t.accent, 1);
    });
  }
}

function addProcessSlide(s: PptxGenJS.Slide, sl: Slide, t: any) {
  s.addShape(SHAPE.rect, { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: hex(t.accent) } });
  addHeader(s, sl, t);
  const steps = (sl.process || []).slice(0, 5);
  steps.forEach((step, i) => {
    const y = 1.1 + i * 1.2;
    // Step number circle
    s.addShape(SHAPE.ellipse, { x: 0.6, y, w: 0.6, h: 0.6, fill: { color: hex(t.accent) } });
    s.addText(String(step.step || i + 1), { x: 0.6, y: y + 0.05, w: 0.6, h: 0.5, fontSize: 14, bold: true, color: "FFFFFF", align: "center", fontFace: F });
    // Step title
    s.addText(trunc(step.title, 50), { x: 1.4, y: y - 0.02, w: 11.5, h: 0.5, fontSize: 17, bold: true, color: hex(t.titleColor), fontFace: F });
    // Step description
    s.addText(trunc(step.description, 80), { x: 1.4, y: y + 0.4, w: 11.5, h: 0.6, fontSize: 12, color: hex(t.bodyColor), fontFace: F });
    // Connector line
    if (i < steps.length - 1) addLine(s, 0.9, y + 0.6, 0, 0.6, t.accent, 1, "dash");
  });
}

function addChartSlide(s: PptxGenJS.Slide, sl: Slide, t: any) {
  s.addShape(SHAPE.rect, { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: hex(t.accent) } });
  addHeader(s, sl, t);
  const ci = (sl.chart || []).slice(0, 6);
  if (ci.length > 0) {
    const bw = 10.5 / ci.length;
    const mx = Math.max(...ci.map(d => Number(d.value) || 0), 1);
    ci.forEach((d, i) => {
      const val = Number(d.value) || 0;
      const bh = (val / mx) * 4.0;
      const x = 1.4 + i * bw;
      // Bar with rounded top
      s.addShape(SHAPE.roundRect, { x, y: 6.0 - bh, w: bw - 0.35, h: bh, fill: { color: hex(t.accent) }, rectRadius: 0.05 });
      // Value label above bar
      s.addText(trunc(String(d.value), 10), { x, y: 6.0 - bh - 0.4, w: bw - 0.35, h: 0.4, fontSize: 14, bold: true, color: hex(t.titleColor), align: "center", fontFace: F });
      // Label below
      s.addText(trunc(d.label, 14), { x, y: 6.1, w: bw - 0.35, h: 0.6, fontSize: 10, color: hex(t.bodyColor), align: "center", fontFace: F });
    });
    // Y-axis line
    addLine(s, 1.2, 1.5, 0, 4.8, t.accent, 1);
    // X-axis line
    addLine(s, 1.2, 6.0, 11.0, 0, t.accent, 1);
  } else {
    const items = (sl.bullets || []).slice(0, 6);
    if (items.length > 0) s.addText(items.map(b => "\u2022 " + trunc(b, 80)).join("\n\n"), { x: 1.0, y: 1.2, w: 11.5, h: 5.5, fontSize: 16, color: hex(t.bodyColor), fontFace: F });
  }
}

function addDiagramSlide(s: PptxGenJS.Slide, sl: Slide, t: any) {
  s.addShape(SHAPE.rect, { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: hex(t.accent) } });
  addHeader(s, sl, t);
  let items: string[] = [];
  if ((sl.bullets || []).length > 0) items = sl.bullets!;
  else if ((sl.stats || []).length > 0) items = sl.stats!.map(s => `${s.label}: ${s.value}`);
  else if ((sl.chart || []).length > 0) items = sl.chart!.map(c => `${c.label}: ${c.value}`);
  if (items.length > 0) {
    const cols = Math.min(items.length, 3);
    const rows = Math.ceil(items.length / cols);
    const bw = 3.8, bh = 1.3, gx = 0.4, gy = 0.4;
    const sx = (13.33 - cols * (bw + gx) + gx) / 2;
    const sy = 1.3;
    items.slice(0, 9).forEach((item, i) => {
      const col = i % cols; const row = Math.floor(i / cols);
      const x = sx + col * (bw + gx); const y = sy + row * (bh + gy);
      // Box with border
      s.addShape(SHAPE.roundRect, { x, y, w: bw, h: bh, fill: { color: hex(t.surface) }, line: { color: hex(t.accent), width: 1.5 }, rectRadius: 0.1 });
      // Text
      s.addText(trunc(item, 40), { x: x + 0.2, y: y + 0.15, w: bw - 0.4, h: bh - 0.3, fontSize: 12, color: hex(t.bodyColor), align: "center", fontFace: F, valign: "middle" });
      // Connector arrows
      if (col < cols - 1 && i < items.length - 1) addLine(s, x + bw, y + bh / 2, gx, 0, t.accent, 1.5);
    });
  }
}

function addCaseStudySlide(s: PptxGenJS.Slide, sl: Slide, t: any) {
  s.addShape(SHAPE.rect, { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: hex(t.accent) } });
  addHeader(s, sl, t);
  const sections = [
    { label: "Challenge", items: sl.leftCol || [], color: t.accent },
    { label: "Solution", items: sl.rightCol || [], color: t.titleColor },
    { label: "Results", items: sl.bullets || [], color: t.accent },
  ];
  const sw = 3.8, sg = 0.35;
  sections.forEach((sec, i) => {
    const x = 0.5 + i * (sw + sg);
    // Section header bar
    s.addShape(SHAPE.rect, { x, y: 1.0, w: sw, h: 0.45, fill: { color: hex(sec.color) } });
    s.addText(sec.label, { x: x + 0.15, y: 1.05, w: sw - 0.3, h: 0.35, fontSize: 14, bold: true, color: "FFFFFF", fontFace: F });
    // Content area
    s.addShape(SHAPE.roundRect, { x, y: 1.55, w: sw, h: 5.5, fill: { color: hex(t.surface) }, rectRadius: 0.08 });
    addBullets(s, sec.items, t, x + 0.1, 1.65, sw - 0.2, 12);
  });
}

function addDividerSlide(s: PptxGenJS.Slide, sl: Slide, t: any) {
  // Full accent-tinted background
  s.addShape(SHAPE.rect, { x: 0, y: 0, w: 13.33, h: 7.5, fill: { color: hex(t.surface) } });
  // Large decorative accent block
  s.addShape(SHAPE.rect, { x: 0, y: 0, w: 0.15, h: 7.5, fill: { color: hex(t.accent) } });
  s.addShape(SHAPE.rect, shapeProps({ x: 13.08, y: 0, w: 0.25, h: 7.5, fill: { color: hex(t.accent) }, transparency: 70 }));
  // Heading
  s.addText(trunc(sl.heading, 60), { x: 1, y: 2.5, w: 11.33, h: 1.5, fontSize: 40, bold: true, color: hex(t.titleColor), align: "center", fontFace: F, valign: "middle" });
  // Decorative line
  addLine(s, 5.5, 4.2, 2.33, 0.06, t.accent);
  if (sl.sub) s.addText(trunc(sl.sub, 80), { x: 2, y: 4.6, w: 9.33, h: 1.0, fontSize: 18, color: hex(t.accent), align: "center", fontFace: F });
}

function addSummarySlide(s: PptxGenJS.Slide, sl: Slide, t: any) {
  s.addShape(SHAPE.rect, { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: hex(t.accent) } });
  // Subtle background accent
  s.addShape(SHAPE.rect, shapeProps({ x: 0, y: 0, w: 13.33, h: 0.04, fill: { color: hex(t.accent) }, transparency: 50 }));
  addHeader(s, sl, t);
  addBullets(s, sl.bullets || [], t, 0.8, 1.2, 11.8, 18);
}

function addQASlide(s: PptxGenJS.Slide, sl: Slide, t: any) {
  s.addShape(SHAPE.rect, { x: 0, y: 0, w: 13.33, h: 7.5, fill: { color: hex(t.surface) } });
  s.addShape(SHAPE.rect, { x: 0, y: 0, w: 0.15, h: 7.5, fill: { color: hex(t.accent) } });
  // Large question mark
  s.addText("?", textProps({ x: 5.5, y: 2.8, w: 2.33, h: 2.0, fontSize: 80, color: hex(t.accent), align: "center", fontFace: F, transparency: 40 }));
  s.addText(trunc(sl.heading, 50), { x: 1, y: 1.5, w: 11.33, h: 1.5, fontSize: 42, bold: true, color: hex(t.titleColor), align: "center", fontFace: F, valign: "middle" });
  if (sl.bullets?.length) s.addText(sl.bullets.map(b => trunc(b, 60)).join("  \u2022  "), { x: 1.5, y: 5.0, w: 10.33, h: 1.0, fontSize: 15, color: hex(t.bodyColor), align: "center", fontFace: F });
}

function addImageSlide(s: PptxGenJS.Slide, sl: Slide, t: any, imageOnLeft: boolean, imageCache: Map<string, string>) {
  s.addShape(SHAPE.rect, { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: hex(t.accent) } });
  const tx = imageOnLeft ? 6.5 : 0.5;
  const ix = imageOnLeft ? 0.5 : 7.0;
  addHeader(s, sl, t, tx);
  addBullets(s, sl.bullets || [], t, tx, 1.2, 5.8, 15);

  // Use locally generated image
  const kw = sl.imageKeyword || sl.imagePrompt || "professional";
  const base64 = imageCache.get(kw);
  if (base64) {
    try {
      s.addImage({ data: base64, x: ix, y: 0.8, w: 5.8, h: 6.0 });
    } catch {
      // Fallback: decorative placeholder
      addImagePlaceholder(s, ix, t, kw);
    }
  } else {
    addImagePlaceholder(s, ix, t, kw);
  }
}

function addImagePlaceholder(s: PptxGenJS.Slide, ix: number, t: any, kw: string) {
  s.addShape(SHAPE.roundRect, { x: ix, y: 0.8, w: 5.8, h: 6.0, fill: { color: hex(t.surface) }, line: { color: hex(t.accent), width: 1 }, rectRadius: 0.1 });
  s.addText("\uD83D\uDDBC " + trunc(kw, 20), { x: ix, y: 3.5, w: 5.8, h: 1.0, fontSize: 14, color: hex(t.bodyColor), align: "center", fontFace: F });
}

function addClosingSlide(s: PptxGenJS.Slide, sl: Slide, t: any) {
  s.addShape(SHAPE.rect, { x: 0, y: 0, w: 13.33, h: 7.5, fill: { color: hex(t.surface) } });
  s.addShape(SHAPE.rect, { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: hex(t.accent) } });
  // Decorative top accent
  s.addShape(SHAPE.rect, shapeProps({ x: 0, y: 0, w: 13.33, h: 0.06, fill: { color: hex(t.accent) }, transparency: 60 }));
  s.addText(trunc(sl.heading, 60), { x: 1, y: 1.8, w: 11.33, h: 2.0, fontSize: 44, bold: true, color: hex(t.titleColor), align: "center", fontFace: F, valign: "middle" });
  if (sl.sub) s.addText(trunc(sl.sub, 80), { x: 2, y: 3.8, w: 9.33, h: 1.0, fontSize: 20, color: hex(t.accent), align: "center", fontFace: F });
  if (sl.bullets?.length) s.addText(sl.bullets.map(b => trunc(b, 50)).join("  \u2022  "), { x: 1.5, y: 4.8, w: 10.33, h: 1.5, fontSize: 16, color: hex(t.bodyColor), align: "center", fontFace: F });
  // Bottom accent line
  addLine(s, 0, 7.0, 13.33, 0.05, t.surface);
}

function addTwoColumnSlide(s: PptxGenJS.Slide, sl: Slide, t: any, isComparison: boolean) {
  s.addShape(SHAPE.rect, { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: hex(t.accent) } });
  addHeader(s, sl, t);
  if (isComparison) {
    // Left card
    s.addShape(SHAPE.roundRect, { x: 0.5, y: 1.0, w: 5.7, h: 5.8, fill: { color: hex(t.surface) }, line: { color: hex(t.accent), width: 1.5 }, rectRadius: 0.1 });
    // Right card
    s.addShape(SHAPE.roundRect, { x: 7.1, y: 1.0, w: 5.7, h: 5.8, fill: { color: hex(t.surface) }, line: { color: hex(t.titleColor), width: 1.5 }, rectRadius: 0.1 });
    addColumn(s, sl.leftCol || [], t, 0.5, 1.0, 5.7, true);
    addColumn(s, sl.rightCol || [], t, 7.1, 1.0, 5.7, false);
    // VS circle
    s.addShape(SHAPE.ellipse, { x: 6.0, y: 3.3, w: 1.3, h: 1.3, fill: { color: hex(t.accent) } });
    s.addText("VS", { x: 6.0, y: 3.35, w: 1.3, h: 1.0, fontSize: 16, bold: true, color: "FFFFFF", align: "center", fontFace: F });
  } else {
    addColumn(s, sl.leftCol || [], t, 0.5, 1.0, 5.8, true);
    addColumn(s, sl.rightCol || [], t, 6.9, 1.0, 5.8, false);
    // Divider line
    addLine(s, 6.4, 1.0, 0, 5.8, t.surface, 1);
  }
}

// ── Helpers ──

function addHeader(s: PptxGenJS.Slide, sl: Slide, t: any, x = 0.6) {
  s.addText(trunc(sl.heading, 120), { x, y: 0.35, w: 12.13, h: 0.8, fontSize: 30, bold: true, color: t.titleColor, fontFace: F });
  addLine(s, x, 0.82, 1.5, 0.06, t.accent);
}

function addLine(s: PptxGenJS.Slide, x: number, y: number, w: number, h: number, color: string, width = 1, dash?: "dash" | "solid") {
  s.addShape(SHAPE.line, { x, y, w, h, line: { color: hex(color), width, ...(dash ? { dashType: dash as "dash" } : {}) } });
}

function addSlideNumber(s: PptxGenJS.Slide, n: number, N: number, t: any) {
  s.addText(`${n} / ${N}`, { x: 11.5, y: 7.0, w: 1.6, h: 0.4, fontSize: 11, color: "AAAAAA", align: "right", fontFace: F });
}

function addBullets(s: PptxGenJS.Slide, bullets: string[], t: any, x: number, y: number, w: number, sz: number) {
  if (!bullets?.length) return;
  s.addText(
    bullets.slice(0, 6).map(b => ({ text: trunc(b, 120), options: { bullet: true as const, color: hex(t.bodyColor), fontSize: sz, spacing: { line: 260 }, fontFace: F } })),
    { x, y, w, valign: "top" }
  );
}

function addColumn(s: PptxGenJS.Slide, items: string[], t: any, x: number, y: number, w: number, colored: boolean) {
  if (!items?.length) return;
  // Column header bar
  s.addShape(SHAPE.rect, { x, y, w, h: 0.4, fill: { color: hex(colored ? t.accent : t.titleColor) } });
  s.addText(trunc(items[0], 40), { x: x + 0.1, y: y + 0.02, w: w - 0.2, h: 0.38, fontSize: 14, bold: true, color: "FFFFFF", fontFace: F });
  if (items.length > 1) addBullets(s, items.slice(1), t, x, y + 0.5, w, 14);
}
