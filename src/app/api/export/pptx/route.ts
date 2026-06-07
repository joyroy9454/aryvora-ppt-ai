import { NextRequest, NextResponse } from "next/server";
import type { Slide, TemplateId } from "@/types";
import PptxGenJS from "pptxgenjs";

// ── Theme definitions ──
const THEMES: Record<
  TemplateId,
  {
    bg: string;
    titleColor: string;
    bodyColor: string;
    accent: string;
    surface: string;
  }
> = {
  corporate: {
    bg: "FFFFFF",
    titleColor: "1B3A5C",
    bodyColor: "2D3748",
    accent: "2B6CB0",
    surface: "F7FAFC",
  },
  academic: {
    bg: "FAFAFA",
    titleColor: "2D3748",
    bodyColor: "1A202C",
    accent: "805AD5",
    surface: "FFFFFF",
  },
  startup: {
    bg: "0F0F23",
    titleColor: "FFFFFF",
    bodyColor: "A0AEC0",
    accent: "F59E0B",
    surface: "1A1A3E",
  },
  minimal: {
    bg: "FFFFFF",
    titleColor: "111827",
    bodyColor: "4B5563",
    accent: "6B7280",
    surface: "F9FAFB",
  },
  dark: {
    bg: "0F172A",
    titleColor: "F1F5F9",
    bodyColor: "94A3B8",
    accent: "63B3ED",
    surface: "1E293B",
  },
  seminar: {
    bg: "FFFFFF",
    titleColor: "064E3B",
    bodyColor: "065F46",
    accent: "059669",
    surface: "ECFDF5",
  },
  marketing: {
    bg: "FFFBEB",
    titleColor: "1C1917",
    bodyColor: "78716C",
    accent: "DC2626",
    surface: "FFFFFF",
  },
  research: {
    bg: "F0F9FF",
    titleColor: "0C4A6E",
    bodyColor: "075985",
    accent: "0369A1",
    surface: "FFFFFF",
  },
  education: {
    bg: "FFFFFF",
    titleColor: "1E1B4B",
    bodyColor: "4338CA",
    accent: "7C3AED",
    surface: "FAF5FF",
  },
  portfolio: {
    bg: "FFF1F2",
    titleColor: "1F2937",
    bodyColor: "BE185D",
    accent: "EC4899",
    surface: "FFFFFF",
  },
};

// ── Helper: truncate text ──
function truncate(str: string, max: number): string {
  if (!str) return "";
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

// ── Helper: add heading ──
function addHeading(
  s: PptxGenJS.Slide,
  text: string,
  t: (typeof THEMES)[TemplateId],
  opts?: { x?: number; fontSize?: number; y?: number; w?: number; align?: "left" | "center" }
) {
  s.addText(truncate(text, 80), {
    x: opts?.x ?? 0.5,
    y: opts?.y ?? 0.3,
    w: opts?.w ?? 12.33,
    fontSize: opts?.fontSize ?? 32,
    bold: true,
    color: t.titleColor,
    align: opts?.align ?? "left",
    fontFace: "Arial",
  });
}

// ── Helper: add bullets ──
function addBullets(
  s: PptxGenJS.Slide,
  bullets: string[],
  t: (typeof THEMES)[TemplateId],
  opts?: { x?: number; y?: number; w?: number; fontSize?: number }
) {
  if (!bullets || bullets.length === 0) return;
  const bulletText = bullets.map((b: string) => ({
    text: truncate(b, 120),
    options: {
      bullet: true as const,
      color: t.bodyColor,
      fontSize: opts?.fontSize ?? 18,
      spacing: { line: 280 },
      fontFace: "Arial",
    },
  }));
  s.addText(bulletText, {
    x: opts?.x ?? 0.5,
    y: opts?.y ?? 1.3,
    w: opts?.w ?? 12.33,
    valign: "top",
  });
}

// ── Main export ──
export async function POST(request: NextRequest) {
  try {
    const { slides, title, theme } = (await request.json()) as {
      slides: Slide[];
      title: string;
      theme: TemplateId;
    };

    if (!slides || !Array.isArray(slides) || slides.length === 0) {
      return NextResponse.json(
        { error: "No slides provided." },
        { status: 400 }
      );
    }

    const t = THEMES[theme] || THEMES.corporate;
    const pptx = new PptxGenJS();
    pptx.title = title || "Presentation";
    pptx.layout = "LAYOUT_WIDE";
    pptx.author = "Aryvora AI";

    for (const slideData of slides) {
      const s = pptx.addSlide();
      s.background = { color: t.bg };

      switch (slideData.type) {
        // ── Title ──
        case "title": {
          // Accent bar at top
          s.addShape(pptx.ShapeType.rect, {
            x: 0,
            y: 0,
            w: 13.33,
            h: 0.08,
            fill: { color: t.accent },
          });
          s.addText(truncate(slideData.heading, 60), {
            x: 0.5,
            y: 2.2,
            w: 12.33,
            fontSize: 44,
            bold: true,
            color: t.titleColor,
            align: "center",
            fontFace: "Arial",
          });
          if (slideData.sub) {
            s.addText(truncate(slideData.sub, 80), {
              x: 0.5,
              y: 3.6,
              w: 12.33,
              fontSize: 22,
              color: t.accent,
              align: "center",
              fontFace: "Arial",
            });
          }
          // Slide number
          s.addText(`${slides.indexOf(slideData) + 1}`, {
            x: 12.5,
            y: 6.8,
            w: 0.5,
            fontSize: 10,
            color: "CCCCCC",
            align: "right",
          });
          break;
        }

        // ── Content ──
        case "content": {
          addHeading(s, slideData.heading, t);
          addBullets(s, slideData.bullets || [], t);
          break;
        }

        // ── Two Column ──
        case "two-column": {
          addHeading(s, slideData.heading, t);
          const leftItems = slideData.leftCol || [];
          const rightItems = slideData.rightCol || [];
          if (leftItems.length > 0) {
            s.addText("Column A", {
              x: 0.5,
              y: 1.3,
              w: 5.9,
              fontSize: 14,
              bold: true,
              color: t.accent,
              fontFace: "Arial",
            });
            addBullets(s, leftItems, t, {
              x: 0.5,
              y: 1.7,
              w: 5.9,
              fontSize: 15,
            });
          }
          if (rightItems.length > 0) {
            s.addText("Column B", {
              x: 6.9,
              y: 1.3,
              w: 5.9,
              fontSize: 14,
              bold: true,
              color: t.accent,
              fontFace: "Arial",
            });
            addBullets(s, rightItems, t, {
              x: 6.9,
              y: 1.7,
              w: 5.9,
              fontSize: 15,
            });
          }
          // Divider line
          s.addShape(pptx.ShapeType.line, {
            x: 6.45,
            y: 1.3,
            w: 0,
            h: 5.5,
            line: { color: t.surface, width: 1 },
          });
          break;
        }

        // ── Comparison ──
        case "comparison": {
          addHeading(s, slideData.heading, t);
          const leftItems = slideData.leftCol || [];
          const rightItems = slideData.rightCol || [];
          // Left column header
          s.addShape(pptx.ShapeType.rect, {
            x: 0.5,
            y: 1.3,
            w: 5.7,
            h: 0.5,
            fill: { color: t.accent },
          });
          s.addText(truncate(leftItems[0] || "Option A", 30), {
            x: 0.7,
            y: 1.32,
            w: 5.3,
            fontSize: 16,
            bold: true,
            color: "FFFFFF",
            fontFace: "Arial",
          });
          if (leftItems.length > 1) {
            addBullets(s, leftItems.slice(1), t, {
              x: 0.5,
              y: 1.9,
              w: 5.7,
              fontSize: 14,
            });
          }
          // Right column header
          s.addShape(pptx.ShapeType.rect, {
            x: 7.1,
            y: 1.3,
            w: 5.7,
            h: 0.5,
            fill: { color: t.titleColor },
          });
          s.addText(truncate(rightItems[0] || "Option B", 30), {
            x: 7.3,
            y: 1.32,
            w: 5.3,
            fontSize: 16,
            bold: true,
            color: "FFFFFF",
            fontFace: "Arial",
          });
          if (rightItems.length > 1) {
            addBullets(s, rightItems.slice(1), t, {
              x: 7.1,
              y: 1.9,
              w: 5.7,
              fontSize: 14,
            });
          }
          break;
        }

        // ── Quote ──
        case "quote": {
          // Large quote mark
          s.addText("“", {
            x: 1.0,
            y: 1.5,
            w: 2,
            fontSize: 80,
            color: t.accent,
            fontFace: "Georgia",
          });
          s.addText(truncate(slideData.quote || "", 200), {
            x: 2.0,
            y: 1.8,
            w: 9.33,
            fontSize: 26,
            italic: true,
            color: t.bodyColor,
            align: "center",
            fontFace: "Georgia",
          });
          if (slideData.author) {
            s.addText(`— ${truncate(slideData.author, 50)}`, {
              x: 2.0,
              y: 3.8,
              w: 9.33,
              fontSize: 16,
              color: t.accent,
              align: "center",
              fontFace: "Arial",
            });
          }
          break;
        }

        // ── Statistic ──
        case "statistic": {
          addHeading(s, slideData.heading, t);
          const stats = (slideData.stats || []).slice(0, 4);
          if (stats.length > 0) {
            const statWidth = 11 / stats.length;
            stats.forEach((stat, i) => {
              const x = 0.5 + i * statWidth;
              // Stat card background
              s.addShape(pptx.ShapeType.roundRect, {
                x: x,
                y: 1.8,
                w: statWidth - 0.4,
                h: 3.5,
                fill: { color: t.surface },
                rectRadius: 0.1,
              });
              s.addText(truncate(stat.value || "—", 15), {
                x: x,
                y: 2.2,
                w: statWidth - 0.4,
                fontSize: 36,
                bold: true,
                color: t.accent,
                align: "center",
                fontFace: "Arial",
              });
              s.addText(truncate(stat.label || "", 30), {
                x: x,
                y: 3.2,
                w: statWidth - 0.4,
                fontSize: 14,
                color: t.bodyColor,
                align: "center",
                fontFace: "Arial",
              });
            });
          }
          break;
        }

        // ── Timeline ──
        case "timeline": {
          addHeading(s, slideData.heading, t);
          const items = (slideData.timeline || []).slice(0, 5);
          if (items.length > 0) {
            const itemWidth = 11 / items.length;
            // Timeline line
            s.addShape(pptx.ShapeType.line, {
              x: 0.5,
              y: 2.8,
              w: 12.33,
              h: 0,
              line: { color: t.accent, width: 2 },
            });
            items.forEach((item, i) => {
              const x = 0.5 + i * itemWidth + itemWidth / 2;
              // Dot
              s.addShape(pptx.ShapeType.ellipse, {
                x: x - 0.2,
                y: 2.6,
                w: 0.4,
                h: 0.4,
                fill: { color: t.accent },
              });
              s.addText(truncate(item.label, 20), {
                x: x - itemWidth / 2 + 0.1,
                y: 1.8,
                w: itemWidth - 0.2,
                fontSize: 14,
                bold: true,
                color: t.titleColor,
                align: "center",
                fontFace: "Arial",
              });
              s.addText(truncate(item.description, 40), {
                x: x - itemWidth / 2 + 0.1,
                y: 3.2,
                w: itemWidth - 0.2,
                fontSize: 11,
                color: t.bodyColor,
                align: "center",
                fontFace: "Arial",
              });
            });
          }
          break;
        }

        // ── Process ──
        case "process": {
          addHeading(s, slideData.heading, t);
          const steps = (slideData.process || []).slice(0, 5);
          steps.forEach((item, i) => {
            const y = 1.5 + i * 1.0;
            // Step number circle
            s.addShape(pptx.ShapeType.ellipse, {
              x: 0.5,
              y: y,
              w: 0.5,
              h: 0.5,
              fill: { color: t.accent },
            });
            s.addText(`${item.step}`, {
              x: 0.5,
              y: y,
              w: 0.5,
              fontSize: 14,
              bold: true,
              color: "FFFFFF",
              align: "center",
              fontFace: "Arial",
            });
            s.addText(truncate(item.title, 50), {
              x: 1.2,
              y: y - 0.05,
              w: 11.5,
              fontSize: 18,
              bold: true,
              color: t.titleColor,
              fontFace: "Arial",
            });
            s.addText(truncate(item.description, 80), {
              x: 1.2,
              y: y + 0.4,
              w: 11.5,
              fontSize: 13,
              color: t.bodyColor,
              fontFace: "Arial",
            });
          });
          break;
        }

        // ── Chart ──
        case "chart": {
          addHeading(s, slideData.heading, t);
          const chartItems = slideData.chart || slideData.stats || [];
          if (chartItems.length > 0) {
            const barWidth = 10 / chartItems.length;
            const maxVal = Math.max(
              ...chartItems.map((d) => Number(d.value) || 0),
              1
            );
            chartItems.slice(0, 6).forEach((d, i) => {
              const val = Number(d.value) || 0;
              const barH = (val / maxVal) * 3.5;
              const x = 1.0 + i * barWidth;
              // Bar
              s.addShape(pptx.ShapeType.roundRect, {
                x: x,
                y: 5.5 - barH,
                w: barWidth - 0.3,
                h: barH,
                fill: { color: t.accent },
                rectRadius: 0.05,
              });
              // Value label
              s.addText(truncate(String(d.value), 10), {
                x: x,
                y: 5.5 - barH - 0.4,
                w: barWidth - 0.3,
                fontSize: 14,
                bold: true,
                color: t.titleColor,
                align: "center",
                fontFace: "Arial",
              });
              // Label
              s.addText(truncate(d.label, 15), {
                x: x,
                y: 5.6,
                w: barWidth - 0.3,
                fontSize: 11,
                color: t.bodyColor,
                align: "center",
                fontFace: "Arial",
              });
            });
          } else {
            s.addText("No chart data available", {
              x: 0.5,
              y: 3,
              w: 12.33,
              fontSize: 16,
              color: t.bodyColor,
              align: "center",
              fontFace: "Arial",
            });
          }
          break;
        }

        // ── Diagram ──
        case "diagram": {
          addHeading(s, slideData.heading, t);
          const diagramItems = slideData.bullets || [];
          if (diagramItems.length > 0) {
            const cols = Math.min(diagramItems.length, 3);
            const rows = Math.ceil(diagramItems.length / cols);
            const boxW = 3.5;
            const boxH = 1.2;
            const gapX = 0.4;
            const gapY = 0.4;
            const startX = (13.33 - cols * (boxW + gapX) + gapX) / 2;
            const startY = 1.5;

            diagramItems.slice(0, 9).forEach((item, i) => {
              const col = i % cols;
              const row = Math.floor(i / cols);
              const x = startX + col * (boxW + gapX);
              const y = startY + row * (boxH + gapY);

              // Box
              s.addShape(pptx.ShapeType.roundRect, {
                x,
                y,
                w: boxW,
                h: boxH,
                fill: { color: t.surface },
                line: { color: t.accent, width: 1.5 },
                rectRadius: 0.1,
              });
              s.addText(truncate(item, 40), {
                x: x + 0.2,
                y: y + 0.15,
                w: boxW - 0.4,
                h: boxH - 0.3,
                fontSize: 13,
                color: t.bodyColor,
                align: "center",
                valign: "middle",
                fontFace: "Arial",
              });

              // Arrow to next (if not last in row)
              if (col < cols - 1 && i < diagramItems.length - 1) {
                s.addShape(pptx.ShapeType.line, {
                  x: x + boxW,
                  y: y + boxH / 2,
                  w: gapX,
                  h: 0,
                  line: { color: t.accent, width: 1.5 },
                });
              }
            });
          }
          break;
        }

        // ── Case Study ──
        case "case-study": {
          addHeading(s, slideData.heading, t);
          // Challenge / Solution / Results layout
          const sections = [
            { label: "Challenge", items: slideData.leftCol || [] },
            { label: "Solution", items: slideData.rightCol || [] },
            { label: "Results", items: slideData.bullets || [] },
          ];
          const secWidth = 3.8;
          sections.forEach((sec, i) => {
            const x = 0.5 + i * (secWidth + 0.3);
            // Section header
            s.addShape(pptx.ShapeType.rect, {
              x,
              y: 1.3,
              w: secWidth,
              h: 0.45,
              fill: { color: i === 2 ? t.accent : t.titleColor },
            });
            s.addText(sec.label, {
              x: x + 0.15,
              y: 1.32,
              w: secWidth - 0.3,
              fontSize: 14,
              bold: true,
              color: "FFFFFF",
              fontFace: "Arial",
            });
            if (sec.items.length > 0) {
              addBullets(s, sec.items, t, {
                x,
                y: 1.85,
                w: secWidth,
                fontSize: 13,
              });
            }
          });
          break;
        }

        // ── Divider ──
        case "divider": {
          s.addShape(pptx.ShapeType.rect, {
            x: 0,
            y: 0,
            w: 13.33,
            h: 7.5,
            fill: { color: t.surface },
          });
          s.addText(truncate(slideData.heading, 60), {
            x: 0.5,
            y: 2.5,
            w: 12.33,
            fontSize: 40,
            bold: true,
            color: t.titleColor,
            align: "center",
            fontFace: "Arial",
          });
          // Accent line
          s.addShape(pptx.ShapeType.rect, {
            x: 5.5,
            y: 3.5,
            w: 2.33,
            h: 0.08,
            fill: { color: t.accent },
          });
          if (slideData.sub) {
            s.addText(truncate(slideData.sub, 60), {
              x: 0.5,
              y: 3.8,
              w: 12.33,
              fontSize: 18,
              color: t.accent,
              align: "center",
              fontFace: "Arial",
            });
          }
          break;
        }

        // ── Summary ──
        case "summary": {
          addHeading(s, slideData.heading, t, { fontSize: 34 });
          // Accent bar
          s.addShape(pptx.ShapeType.rect, {
            x: 0.5,
            y: 1.15,
            w: 1.5,
            h: 0.06,
            fill: { color: t.accent },
          });
          addBullets(s, slideData.bullets || [], t, {
            fontSize: 20,
            y: 1.4,
          });
          break;
        }

        // ── Q&A ──
        case "qa": {
          s.addShape(pptx.ShapeType.rect, {
            x: 0,
            y: 0,
            w: 13.33,
            h: 7.5,
            fill: { color: t.surface },
          });
          s.addText(truncate(slideData.heading, 40), {
            x: 0.5,
            y: 1.8,
            w: 12.33,
            fontSize: 44,
            bold: true,
            color: t.titleColor,
            align: "center",
            fontFace: "Arial",
          });
          s.addText("?", {
            x: 5.5,
            y: 3.0,
            w: 2.33,
            fontSize: 60,
            bold: true,
            color: t.accent,
            align: "center",
            fontFace: "Arial",
          });
          if (slideData.bullets && slideData.bullets.length > 0) {
            s.addText(
              slideData.bullets.map((b: string) => truncate(b, 60)).join("  •  "),
              {
                x: 1.5,
                y: 4.5,
                w: 10.33,
                fontSize: 16,
                color: t.bodyColor,
                align: "center",
                fontFace: "Arial",
              }
            );
          }
          break;
        }

        // ── Image Left ──
        case "image-left": {
          addHeading(s, slideData.heading, t, { w: 6.5 });
          addBullets(s, slideData.bullets || [], t, {
            x: 0.5,
            y: 1.3,
            w: 6.5,
          });
          // Image placeholder on right
          if (slideData.imageUrl) {
            try {
              s.addImage({
                path: slideData.imageUrl,
                x: 7.2,
                y: 1.3,
                w: 5.5,
                h: 5.0,
              });
            } catch {
              s.addShape(pptx.ShapeType.rect, {
                x: 7.2,
                y: 1.3,
                w: 5.5,
                h: 5.0,
                fill: { color: t.surface },
                line: { color: t.accent, width: 1, dashType: "dash" },
              });
              s.addText("[Image]", {
                x: 7.2,
                y: 3.5,
                w: 5.5,
                fontSize: 14,
                color: t.bodyColor,
                align: "center",
                fontFace: "Arial",
              });
            }
          }
          break;
        }

        // ── Image Right ──
        case "image-right": {
          addHeading(s, slideData.heading, t, { x: 7.2, w: 5.5 });
          addBullets(s, slideData.bullets || [], t, {
            x: 7.2,
            y: 1.3,
            w: 5.5,
          });
          // Image placeholder on left
          if (slideData.imageUrl) {
            try {
              s.addImage({
                path: slideData.imageUrl,
                x: 0.5,
                y: 1.3,
                w: 5.5,
                h: 5.0,
              });
            } catch {
              s.addShape(pptx.ShapeType.rect, {
                x: 0.5,
                y: 1.3,
                w: 5.5,
                h: 5.0,
                fill: { color: t.surface },
                line: { color: t.accent, width: 1, dashType: "dash" },
              });
              s.addText("[Image]", {
                x: 0.5,
                y: 3.5,
                w: 5.5,
                fontSize: 14,
                color: t.bodyColor,
                align: "center",
                fontFace: "Arial",
              });
            }
          }
          break;
        }

        // ── Closing ──
        case "closing": {
          s.addShape(pptx.ShapeType.rect, {
            x: 0,
            y: 0,
            w: 13.33,
            h: 0.08,
            fill: { color: t.accent },
          });
          s.addText(truncate(slideData.heading, 40), {
            x: 0.5,
            y: 2.0,
            w: 12.33,
            fontSize: 44,
            bold: true,
            color: t.titleColor,
            align: "center",
            fontFace: "Arial",
          });
          if (slideData.sub) {
            s.addText(truncate(slideData.sub, 60), {
              x: 0.5,
              y: 3.2,
              w: 12.33,
              fontSize: 20,
              color: t.accent,
              align: "center",
              fontFace: "Arial",
            });
          }
          if (slideData.bullets && slideData.bullets.length > 0) {
            s.addText(
              slideData.bullets.map((b: string) => truncate(b, 40)).join("  •  "),
              {
                x: 1.5,
                y: 4.0,
                w: 10.33,
                fontSize: 16,
                color: t.bodyColor,
                align: "center",
                fontFace: "Arial",
              }
            );
          }
          break;
        }

        // ── Blank ──
        case "blank": {
          s.addText(truncate(slideData.heading, 60), {
            x: 0.5,
            y: 3.0,
            w: 12.33,
            fontSize: 24,
            color: t.bodyColor,
            align: "center",
            fontFace: "Arial",
          });
          break;
        }

        // ── Default fallback ──
        default: {
          addHeading(s, slideData.heading || "", t, { fontSize: 28 });
          if (slideData.bullets && slideData.bullets.length > 0) {
            addBullets(s, slideData.bullets, t);
          }
          break;
        }
      }

      // ── Speaker notes ──
      if (slideData.notes) {
        s.addNotes(slideData.notes);
      }
    }

    const buffer = await pptx.write({ outputType: "nodebuffer" });
    const buf = Buffer.isBuffer(buffer)
      ? buffer
      : Buffer.from(buffer as ArrayBuffer);

    const safeTitle = (title || "presentation")
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 50);

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${safeTitle}.pptx"`,
      },
    });
  } catch (err) {
    console.error("PPTX export error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? `Export failed: ${err.message}`
            : "Failed to export PPTX. Please try again.",
      },
      { status: 500 }
    );
  }
}
