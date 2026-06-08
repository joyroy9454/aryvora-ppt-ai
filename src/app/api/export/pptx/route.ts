import { NextRequest, NextResponse } from "next/server";
import type { Slide, TemplateId } from "@/types";
import PptxGenJS from "pptxgenjs";
import { THEMES } from "@/lib/constants";

// ShapeType from pptxgenjs instance
const SHAPE = (() => { const p = new PptxGenJS(); return { rect: p.ShapeType.rect, ellipse: p.ShapeType.ellipse, line: p.ShapeType.line, roundRect: p.ShapeType.roundRect }; })();

function hex(c: string): string { return c.replace("#", ""); }
function trunc(s: string, n: number): string { return (!s || s.length <= n) ? (s || "") : s.slice(0, n - 1) + "…"; }

const F = "Arial";
const FG = "Georgia";

export async function POST(request: NextRequest) {
  try {
    const { slides, title, theme } = (await request.json()) as { slides: Slide[]; title: string; theme: TemplateId };
    if (!slides?.length) return NextResponse.json({ error: "No slides provided." }, { status: 400 });

    const t = THEMES[theme] || THEMES.corporate;
    const pptx = new PptxGenJS();
    pptx.title = title || "Presentation";
    pptx.layout = "LAYOUT_WIDE";
    pptx.author = "Aryvora AI";

    for (let idx = 0; idx < slides.length; idx++) {
      const sl = slides[idx];
      const s = pptx.addSlide();
      s.background = { color: hex(t.bg) };
      const n = idx + 1, N = slides.length;

      switch (sl.type) {
        case "title":
          addTitleSlide(s, sl, t);
          break;

        case "statistic":
          addStatisticSlide(s, sl, t);
          break;

        case "quote":
          addQuoteSlide(s, sl, t);
          break;

        case "timeline":
          addTimelineSlide(s, sl, t);
          break;

        case "process":
          addProcessSlide(s, sl, t);
          break;

        case "chart":
          addChartSlide(s, sl, t);
          break;

        case "diagram":
          addDiagramSlide(s, sl, t);
          break;

        case "case-study":
          addCaseStudySlide(s, sl, t);
          break;

        case "divider":
          addDividerSlide(s, sl, t);
          break;

        case "summary":
          addSummarySlide(s, sl, t);
          break;

        case "qa":
          addQASlide(s, sl, t);
          break;

        case "image-left":
          addImageSlide(s, sl, t, true);
          break;

        case "image-right":
          addImageSlide(s, sl, t, false);
          break;

        case "closing":
          addClosingSlide(s, sl, t);
          break;

        case "two-column":
          addTwoColumnSlide(s, sl, t, false);
          break;

        case "comparison":
          addTwoColumnSlide(s, sl, t, true);
          break;

        default:
          addContentSlide(s, sl, t);
          break;
      }

      // Slide number
      addSlideNumber(s, n, N, t);

      // Speaker notes
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
    return NextResponse.json(
      { error: err instanceof Error ? `Export failed: ${err.message}` : "Failed to export PPTX." },
      { status: 500 }
    );
  }
}

// ── Slide Type Renderers ──

function addTitleSlide(s: PptxGenJS.Slide, sl: Slide, t: any) {
  s.addShape(SHAPE.rect, { x: 0, y: 0, w: 13.33, h: 7.5, fill: { color: hex(t.surface) } });
  s.addShape(SHAPE.rect, { x: 0, y: 0, w: 0.12, h: 7.5, fill: { color: hex(t.accent) } });
  addText(s, trunc(sl.heading, 50), 1.5, 2.0, 10.33, 42, true, hex(t.titleColor), "center", F);
  if (sl.sub) addText(s, trunc(sl.sub, 70), 2, 3.4, 9.33, 20, false, hex(t.accent), "center", F);
  addLine(s, 5.5, 3.05, 2.33, 0.05, t.accent);
}

function addContentSlide(s: PptxGenJS.Slide, sl: Slide, t: any) {
  s.addShape(SHAPE.rect, { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: hex(t.accent) } });
  addHeader(s, sl, t, 0.6);

  const bullets = sl.bullets || [];
  if (bullets.length > 0) {
    // Add bullets with accent-colored bullet markers
    const bulletItems = bullets.slice(0, 6).map(b => ({
      text: trunc(b, 100),
      options: {
        bullet: true as const,
        color: hex(t.bodyColor),
        fontSize: 16,
        spacing: { line: 280 },
        fontFace: F,
      },
    }));
    s.addText(bulletItems, { x: 0.8, y: 1.2, w: 11.8, h: 5.5, valign: "top" });
  }

  // Add a subtle accent bar at bottom
  addLine(s, 0.6, 7.0, 12.13, 0.03, t.accent);
}

function addStatisticSlide(s: PptxGenJS.Slide, sl: Slide, t: any) {
  s.addShape(SHAPE.rect, { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: hex(t.accent) } });
  addHeader(s, sl, t, 0.6);

  const stats = (sl.stats || []).slice(0, 4);
  if (stats.length > 0) {
    const cw = 11.5 / stats.length;
    stats.forEach((st, i) => {
      const x = 0.9 + i * cw;
      // Card background
      s.addShape(SHAPE.roundRect, { x, y: 1.3, w: cw - 0.3, h: 5.0, fill: { color: hex(t.surface) }, rectRadius: 0.1 });
      // Accent top bar
      s.addShape(SHAPE.rect, { x, y: 1.3, w: cw - 0.3, h: 0.08, fill: { color: hex(t.accent) } });
      // Value
      addText(s, trunc(String(st.value || "—"), 12), x, 2.0, cw - 0.3, 38, true, hex(t.accent), "center", F);
      // Label
      addText(s, trunc(st.label || "", 25), x, 3.8, cw - 0.3, 13, false, hex(t.bodyColor), "center", F);
    });
  }
}

function addQuoteSlide(s: PptxGenJS.Slide, sl: Slide, t: any) {
  s.addShape(SHAPE.rect, { x: 0, y: 0, w: 13.33, h: 7.5, fill: { color: hex(t.surface) } });
  s.addShape(SHAPE.rect, { x: 0, y: 0, w: 0.15, h: 7.5, fill: { color: hex(t.accent) } });

  // Large quote mark
  addText(s, "\u201C", 1.0, 0.8, 2.0, 80, false, hex(t.accent), "left", FG);

  // Quote text
  addText(s, trunc(sl.quote || "", 180), 2.2, 1.2, 9.0, 24, false, hex(t.bodyColor), "center", FG);

  // Author
  if (sl.author) {
    addLine(s, 5.5, 4.0, 2.33, 0.04, t.accent);
    addText(s, "\u2014 " + trunc(sl.author, 50), 2.2, 4.3, 9.0, 16, false, hex(t.accent), "center", F);
  }
}

function addTimelineSlide(s: PptxGenJS.Slide, sl: Slide, t: any) {
  s.addShape(SHAPE.rect, { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: hex(t.accent) } });
  addHeader(s, sl, t, 0.6);

  const items = (sl.timeline || []).slice(0, 5);
  if (items.length > 0) {
    const iw = 11.5 / items.length;
    // Horizontal line
    addLine(s, 1, 3.5, 11.33, 0, t.accent, 2);

    items.forEach((it, i) => {
      const x = 1 + i * iw + iw / 2;
      // Dot on timeline
      s.addShape(SHAPE.ellipse, { x: x - 0.2, y: 3.3, w: 0.4, h: 0.4, fill: { color: hex(t.accent) } });
      // Label (above)
      addText(s, trunc(it.label, 18), x - iw / 2 + 0.1, 1.5, iw - 0.2, 13, true, hex(t.titleColor), "center", F);
      // Description (below)
      addText(s, trunc(it.description, 35), x - iw / 2 + 0.1, 4.0, iw - 0.2, 10, false, hex(t.bodyColor), "center", F);
    });
  }
}

function addProcessSlide(s: PptxGenJS.Slide, sl: Slide, t: any) {
  s.addShape(SHAPE.rect, { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: hex(t.accent) } });
  addHeader(s, sl, t, 0.6);

  const steps = (sl.process || []).slice(0, 5);
  steps.forEach((step, i) => {
    const y = 1.1 + i * 1.2;
    // Step circle
    s.addShape(SHAPE.ellipse, { x: 0.6, y, w: 0.6, h: 0.6, fill: { color: hex(t.accent) } });
    addText(s, String(step.step || i + 1), 0.6, y + 0.08, 0.6, 14, true, "FFFFFF", "center", F);
    // Step title
    addText(s, trunc(step.title, 45), 1.4, y - 0.02, 11.5, 17, true, hex(t.titleColor), "left", F);
    // Step description
    addText(s, trunc(step.description, 70), 1.4, y + 0.4, 11.5, 12, false, hex(t.bodyColor), "left", F);
    // Connector line
    if (i < steps.length - 1) {
      addLine(s, 0.9, y + 0.6, 0, 0.6, t.accent, 1, "dash");
    }
  });
}

function addChartSlide(s: PptxGenJS.Slide, sl: Slide, t: any) {
  s.addShape(SHAPE.rect, { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: hex(t.accent) } });
  addHeader(s, sl, t, 0.6);

  const ci = (sl.chart || []).slice(0, 6);
  if (ci.length > 0) {
    const bw = 10.5 / ci.length;
    const mx = Math.max(...ci.map(d => Number(d.value) || 0), 1);
    ci.forEach((d, i) => {
      const val = Number(d.value) || 0;
      const bh = (val / mx) * 4.0;
      const x = 1.4 + i * bw;
      // Bar
      s.addShape(SHAPE.roundRect, { x, y: 6.0 - bh, w: bw - 0.35, h: bh, fill: { color: hex(t.accent) }, rectRadius: 0.05 });
      // Value label above bar
      addText(s, trunc(String(d.value), 10), x, 6.0 - bh - 0.4, bw - 0.35, 14, true, hex(t.titleColor), "center", F);
      // Label below
      addText(s, trunc(d.label, 14), x, 6.1, bw - 0.35, 10, false, hex(t.bodyColor), "center", F);
    });
  }
}

function addDiagramSlide(s: PptxGenJS.Slide, sl: Slide, t: any) {
  s.addShape(SHAPE.rect, { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: hex(t.accent) } });
  addHeader(s, sl, t, 0.6);

  const items = (sl.bullets || []).slice(0, 9);
  if (items.length > 0) {
    const cols = Math.min(items.length, 3);
    const rows = Math.ceil(items.length / cols);
    const bw = 3.8, bh = 1.3, gx = 0.4, gy = 0.4;
    const sx = (13.33 - cols * (bw + gx) + gx) / 2;
    const sy = 1.3;

    items.forEach((item, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = sx + col * (bw + gx);
      const y = sy + row * (bh + gy);
      // Box
      s.addShape(SHAPE.roundRect, { x, y, w: bw, h: bh, fill: { color: hex(t.surface) }, line: { color: hex(t.accent), width: 1.5 }, rectRadius: 0.1 });
      // Text
      addText(s, trunc(item, 35), x + 0.2, y + 0.25, bw - 0.4, bh - 0.5, false, hex(t.bodyColor), "center", F);
      // Arrow to next
      if (col < cols - 1 && i < items.length - 1) {
        addLine(s, x + bw, y + bh / 2, gx, 0, t.accent, 1.5);
      }
    });
  }
}

function addCaseStudySlide(s: PptxGenJS.Slide, sl: Slide, t: any) {
  s.addShape(SHAPE.rect, { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: hex(t.accent) } });
  addHeader(s, sl, t, 0.6);

  const sections = [
    { label: "Challenge", items: sl.leftCol || [], color: t.accent },
    { label: "Solution", items: sl.rightCol || [], color: t.titleColor },
    { label: "Results", items: sl.bullets || [], color: t.accent },
  ];
  const sw = 3.8, sg = 0.35;
  sections.forEach((sec, i) => {
    const x = 0.5 + i * (sw + sg);
    // Section header
    s.addShape(SHAPE.rect, { x, y: 1.0, w: sw, h: 0.45, fill: { color: hex(sec.color) } });
    addText(s, sec.label, x + 0.15, 1.05, sw - 0.3, 14, true, "FFFFFF", "left", F);
    // Items
    addBullets(s, sec.items, t, x + 0.1, 1.6, sw - 0.2, 12);
  });
}

function addDividerSlide(s: PptxGenJS.Slide, sl: Slide, t: any) {
  s.addShape(SHAPE.rect, { x: 0, y: 0, w: 13.33, h: 7.5, fill: { color: hex(t.surface) } });
  addText(s, trunc(sl.heading, 50), 1, 2.5, 11.33, 40, true, hex(t.titleColor), "center", F);
  addLine(s, 5.5, 3.6, 2.33, 0.06, t.accent);
  if (sl.sub) addText(s, trunc(sl.sub, 60), 2, 4.0, 9.33, 18, false, hex(t.accent), "center", F);
}

function addSummarySlide(s: PptxGenJS.Slide, sl: Slide, t: any) {
  s.addShape(SHAPE.rect, { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: hex(t.accent) } });
  addHeader(s, sl, t, 0.6);
  addBullets(s, sl.bullets || [], t, 0.8, 1.2, 11.8, 18);
}

function addQASlide(s: PptxGenJS.Slide, sl: Slide, t: any) {
  s.addShape(SHAPE.rect, { x: 0, y: 0, w: 13.33, h: 7.5, fill: { color: hex(t.surface) } });
  s.addShape(SHAPE.rect, { x: 0, y: 0, w: 0.15, h: 7.5, fill: { color: hex(t.accent) } });
  addText(s, trunc(sl.heading, 40), 1, 1.8, 11.33, 42, true, hex(t.titleColor), "center", F);
  addText(s, "?", 5.5, 3.0, 2.33, 72, true, hex(t.accent), "center", F);
  if (sl.bullets?.length) {
    addText(s, sl.bullets.map(b => trunc(b, 50)).join("  \u2022  "), 1.5, 4.8, 10.33, 15, false, hex(t.bodyColor), "center", F);
  }
}

function addImageSlide(s: PptxGenJS.Slide, sl: Slide, t: any, imageOnLeft: boolean) {
  s.addShape(SHAPE.rect, { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: hex(t.accent) } });
  const tx = imageOnLeft ? 6.5 : 0.5;
  const ix = imageOnLeft ? 0.5 : 7.0;

  addHeader(s, sl, t, tx);
  addBullets(s, sl.bullets || [], t, tx, 1.2, 5.8, 15);

  // Image
  if (sl.imageUrl) {
    try {
      s.addImage({ path: sl.imageUrl, x: ix, y: 1.0, w: 5.8, h: 5.8 });
    } catch {
      // Fallback: placeholder box
      s.addShape(SHAPE.roundRect, { x: ix, y: 1.0, w: 5.8, h: 5.8, fill: { color: hex(t.surface) }, line: { color: hex(t.accent), width: 1 }, rectRadius: 0.1 });
      addText(s, "[ Image ]", ix, 3.7, 5.8, 14, false, hex(t.bodyColor), "center", F);
    }
  }
}

function addClosingSlide(s: PptxGenJS.Slide, sl: Slide, t: any) {
  s.addShape(SHAPE.rect, { x: 0, y: 0, w: 13.33, h: 7.5, fill: { color: hex(t.surface) } });
  s.addShape(SHAPE.rect, { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: hex(t.accent) } });
  addText(s, trunc(sl.heading, 40), 1, 2.0, 11.33, 44, true, hex(t.titleColor), "center", F);
  if (sl.sub) addText(s, trunc(sl.sub, 60), 2, 3.3, 9.33, 20, false, hex(t.accent), "center", F);
  if (sl.bullets?.length) {
    addText(s, sl.bullets.map(b => trunc(b, 40)).join("  \u2022  "), 1.5, 4.2, 10.33, 16, false, hex(t.bodyColor), "center", F);
  }
  addLine(s, 0, 7.0, 13.33, 0.05, t.surface);
}

function addTwoColumnSlide(s: PptxGenJS.Slide, sl: Slide, t: any, isComparison: boolean) {
  s.addShape(SHAPE.rect, { x: 0, y: 0, w: 0.08, h: 7.5, fill: { color: hex(t.accent) } });
  addHeader(s, sl, t, 0.6);

  if (isComparison) {
    // Left box
    s.addShape(SHAPE.roundRect, { x: 0.5, y: 1.0, w: 5.7, h: 5.8, fill: { color: hex(t.surface) }, line: { color: hex(t.accent), width: 1.5 }, rectRadius: 0.1 });
    // Right box
    s.addShape(SHAPE.roundRect, { x: 7.1, y: 1.0, w: 5.7, h: 5.8, fill: { color: hex(t.surface) }, line: { color: hex(t.titleColor), width: 1.5 }, rectRadius: 0.1 });
    addColumn(s, sl.leftCol || [], t, 0.5, 1.0, 5.7, true);
    addColumn(s, sl.rightCol || [], t, 7.1, 1.0, 5.7, false);
    // VS badge
    s.addShape(SHAPE.ellipse, { x: 6.0, y: 3.3, w: 1.3, h: 1.3, fill: { color: hex(t.accent) } });
    addText(s, "VS", 6.0, 3.45, 1.3, 16, true, "FFFFFF", "center", F);
  } else {
    addColumn(s, sl.leftCol || [], t, 0.5, 1.0, 5.8, true);
    addColumn(s, sl.rightCol || [], t, 6.9, 1.0, 5.8, false);
    // Divider line
    addLine(s, 6.4, 1.0, 0, 5.8, t.surface, 1);
  }
}

// ── Helper Functions ──

function addHeader(s: PptxGenJS.Slide, sl: Slide, t: any, x = 0.6) {
  addText(s, trunc(sl.heading, 70), x, 0.35, 12.13, 30, true, t.titleColor, "left", F);
  addLine(s, x, 0.78, 1.5, 0.06, t.accent);
}

function addText(s: PptxGenJS.Slide, text: string, x: number, y: number, w: number, sz: number, bold: boolean, color: string, align: "left" | "center" | "right", font: string) {
  if (!text) return;
  s.addText(text, { x, y, w, fontSize: sz, bold, color: hex(color), align, fontFace: font });
}

function addLine(s: PptxGenJS.Slide, x: number, y: number, w: number, h: number, color: string, width = 1, dash?: "dash" | "solid") {
  s.addShape(SHAPE.line, { x, y, w, h, line: { color: hex(color), width, ...(dash ? { dashType: dash as "dash" } : {}) } });
}

function addSlideNumber(s: PptxGenJS.Slide, n: number, N: number, t: any) {
  addText(s, `${n} / ${N}`, 12, 6.9, 1.2, 9, false, "999999", "right", F);
}

function addBullets(s: PptxGenJS.Slide, bullets: string[], t: any, x: number, y: number, w: number, sz: number) {
  if (!bullets?.length) return;
  s.addText(
    bullets.slice(0, 6).map(b => ({
      text: trunc(b, 100),
      options: { bullet: true as const, color: hex(t.bodyColor), fontSize: sz, spacing: { line: 260 }, fontFace: F },
    })),
    { x, y, w, valign: "top" }
  );
}

function addColumn(s: PptxGenJS.Slide, items: string[], t: any, x: number, y: number, w: number, colored: boolean) {
  if (!items?.length) return;
  // Column header bar
  s.addShape(SHAPE.rect, { x, y, w, h: 0.4, fill: { color: hex(colored ? t.accent : t.titleColor) } });
  addText(s, trunc(items[0], 35), x + 0.1, y + 0.02, w - 0.2, 14, true, "FFFFFF", "left", F);
  // Remaining items as bullets
  if (items.length > 1) {
    addBullets(s, items.slice(1), t, x, y + 0.5, w, 14);
  }
}
