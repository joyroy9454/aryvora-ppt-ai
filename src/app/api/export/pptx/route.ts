import { NextRequest, NextResponse } from "next/server";
import type { Slide, TemplateId } from "@/types";
import PptxGenJS from "pptxgenjs";

// All 10 template color schemes for PPTX export
const THEMES: Record<
  TemplateId,
  { bg: string; titleColor: string; bodyColor: string; accent: string }
> = {
  corporate: {
    bg: "FFFFFF",
    titleColor: "1B3A5C",
    bodyColor: "2D3748",
    accent: "2B6CB0",
  },
  academic: {
    bg: "FAFAFA",
    titleColor: "2D3748",
    bodyColor: "1A202C",
    accent: "805AD5",
  },
  startup: {
    bg: "0F0F23",
    titleColor: "FFFFFF",
    bodyColor: "A0AEC0",
    accent: "F59E0B",
  },
  minimal: {
    bg: "FFFFFF",
    titleColor: "111827",
    bodyColor: "4B5563",
    accent: "6B7280",
  },
  dark: {
    bg: "0F172A",
    titleColor: "F1F5F9",
    bodyColor: "94A3B8",
    accent: "63B3ED",
  },
  seminar: {
    bg: "FFFFFF",
    titleColor: "064E3B",
    bodyColor: "065F46",
    accent: "059669",
  },
  marketing: {
    bg: "FFFBEB",
    titleColor: "1C1917",
    bodyColor: "78716C",
    accent: "DC2626",
  },
  research: {
    bg: "F0F9FF",
    titleColor: "0C4A6E",
    bodyColor: "075985",
    accent: "0369A1",
  },
  education: {
    bg: "FFFFFF",
    titleColor: "1E1B4B",
    bodyColor: "4338CA",
    accent: "7C3AED",
  },
  portfolio: {
    bg: "FFF1F2",
    titleColor: "1F2937",
    bodyColor: "BE185D",
    accent: "EC4899",
  },
};

export async function POST(request: NextRequest) {
  try {
    const { slides, title, theme } = await request.json() as {
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

    for (const slideData of slides) {
      const s = pptx.addSlide();
      s.background = { color: t.bg };

      switch (slideData.type) {
        case "title":
          s.addText(slideData.heading, {
            x: 0.5,
            y: 2.5,
            w: 12.33,
            fontSize: 44,
            bold: true,
            color: t.titleColor,
            align: "center",
          });
          if (slideData.sub) {
            s.addText(slideData.sub, {
              x: 0.5,
              y: 3.8,
              w: 12.33,
              fontSize: 24,
              color: t.accent,
              align: "center",
            });
          }
          break;

        case "content":
          s.addText(slideData.heading, {
            x: 0.5,
            y: 0.3,
            w: 12.33,
            fontSize: 32,
            bold: true,
            color: t.titleColor,
          });
          if (slideData.bullets && slideData.bullets.length > 0) {
            const bulletText = slideData.bullets.map((b: string) => ({
              text: b,
              options: {
                bullet: true as const,
                color: t.bodyColor,
                fontSize: 18,
                spacing: { line: 280 },
              },
            }));
            s.addText(bulletText, {
              x: 0.5,
              y: 1.3,
              w: 12.33,
              valign: "top",
            });
          }
          break;

        case "two-column":
        case "comparison":
          s.addText(slideData.heading, {
            x: 0.5,
            y: 0.3,
            w: 12.33,
            fontSize: 32,
            bold: true,
            color: t.titleColor,
          });
          if (slideData.leftCol && slideData.leftCol.length > 0) {
            const leftText = slideData.leftCol.map((b: string) => ({
              text: b,
              options: {
                bullet: true as const,
                color: t.bodyColor,
                fontSize: 16,
              },
            }));
            s.addText(leftText, {
              x: 0.5,
              y: 1.3,
              w: 5.9,
              valign: "top",
            });
          }
          if (slideData.rightCol && slideData.rightCol.length > 0) {
            const rightText = slideData.rightCol.map((b: string) => ({
              text: b,
              options: {
                bullet: true as const,
                color: t.bodyColor,
                fontSize: 16,
              },
            }));
            s.addText(rightText, {
              x: 6.4,
              y: 1.3,
              w: 5.9,
              valign: "top",
            });
          }
          break;

        case "quote":
          s.addText(`"${slideData.quote || ""}"`, {
            x: 1.5,
            y: 2.0,
            w: 10.33,
            fontSize: 28,
            italic: true,
            color: t.bodyColor,
            align: "center",
          });
          if (slideData.author) {
            s.addText(`— ${slideData.author}`, {
              x: 1.5,
              y: 3.5,
              w: 10.33,
              fontSize: 18,
              color: t.accent,
              align: "center",
            });
          }
          break;

        case "statistic":
          s.addText(slideData.heading, {
            x: 0.5,
            y: 0.3,
            w: 12.33,
            fontSize: 32,
            bold: true,
            color: t.titleColor,
          });
          if (slideData.stats && slideData.stats.length > 0) {
            const statWidth = 11 / Math.min(slideData.stats.length, 4);
            slideData.stats.slice(0, 4).forEach((stat, i) => {
              s.addText(stat.value || "—", {
                x: 0.5 + i * statWidth,
                y: 2.0,
                w: statWidth - 0.3,
                fontSize: 36,
                bold: true,
                color: t.accent,
                align: "center",
              });
              s.addText(stat.label || "", {
                x: 0.5 + i * statWidth,
                y: 3.0,
                w: statWidth - 0.3,
                fontSize: 14,
                color: t.bodyColor,
                align: "center",
              });
            });
          }
          break;

        case "timeline":
          s.addText(slideData.heading, {
            x: 0.5,
            y: 0.3,
            w: 12.33,
            fontSize: 32,
            bold: true,
            color: t.titleColor,
          });
          if (slideData.timeline && slideData.timeline.length > 0) {
            const itemWidth = 11 / Math.min(slideData.timeline.length, 5);
            slideData.timeline.slice(0, 5).forEach((item, i) => {
              s.addText(item.label, {
                x: 0.5 + i * itemWidth,
                y: 2.0,
                w: itemWidth - 0.3,
                fontSize: 16,
                bold: true,
                color: t.accent,
                align: "center",
              });
              s.addText(item.description, {
                x: 0.5 + i * itemWidth,
                y: 2.6,
                w: itemWidth - 0.3,
                fontSize: 12,
                color: t.bodyColor,
                align: "center",
              });
            });
          }
          break;

        case "process":
          s.addText(slideData.heading, {
            x: 0.5,
            y: 0.3,
            w: 12.33,
            fontSize: 32,
            bold: true,
            color: t.titleColor,
          });
          if (slideData.process && slideData.process.length > 0) {
            slideData.process.slice(0, 5).forEach((item, i) => {
              s.addText(`${item.step}. ${item.title}`, {
                x: 0.5,
                y: 1.5 + i * 0.9,
                w: 12.33,
                fontSize: 18,
                bold: true,
                color: t.titleColor,
              });
              s.addText(item.description, {
                x: 0.8,
                y: 1.5 + i * 0.9 + 0.4,
                w: 12,
                fontSize: 14,
                color: t.bodyColor,
              });
            });
          }
          break;

        case "divider":
          s.addText(slideData.heading, {
            x: 0.5,
            y: 2.5,
            w: 12.33,
            fontSize: 40,
            bold: true,
            color: t.titleColor,
            align: "center",
          });
          if (slideData.sub) {
            s.addText(slideData.sub, {
              x: 0.5,
              y: 3.5,
              w: 12.33,
              fontSize: 20,
              color: t.accent,
              align: "center",
            });
          }
          break;

        case "summary":
          s.addText(slideData.heading, {
            x: 0.5,
            y: 0.3,
            w: 12.33,
            fontSize: 32,
            bold: true,
            color: t.titleColor,
          });
          if (slideData.bullets && slideData.bullets.length > 0) {
            const bulletText = slideData.bullets.map((b) => ({
              text: b,
              options: {
                bullet: true as const,
                color: t.bodyColor,
                fontSize: 20,
                spacing: { line: 300 },
              },
            }));
            s.addText(bulletText, {
              x: 0.5,
              y: 1.3,
              w: 12.33,
              valign: "top",
            });
          }
          break;

        case "qa":
          s.addText(slideData.heading, {
            x: 0.5,
            y: 2.0,
            w: 12.33,
            fontSize: 40,
            bold: true,
            color: t.titleColor,
            align: "center",
          });
          if (slideData.bullets && slideData.bullets.length > 0) {
            slideData.bullets.forEach((b, i) => {
              s.addText(b, {
                x: 2,
                y: 3.2 + i * 0.6,
                w: 9,
                fontSize: 18,
                color: t.bodyColor,
                align: "center",
              });
            });
          }
          break;

        case "closing":
          s.addText(slideData.heading, {
            x: 0.5,
            y: 2.0,
            w: 12.33,
            fontSize: 44,
            bold: true,
            color: t.titleColor,
            align: "center",
          });
          if (slideData.sub) {
            s.addText(slideData.sub, {
              x: 0.5,
              y: 3.2,
              w: 12.33,
              fontSize: 20,
              color: t.accent,
              align: "center",
            });
          }
          if (slideData.bullets && slideData.bullets.length > 0) {
            const items = slideData.bullets.map((b) => ({
              text: b,
              options: { color: t.bodyColor, fontSize: 18 },
            }));
            s.addText(items, {
              x: 2,
              y: 3.8,
              w: 9,
              align: "center",
            });
          }
          break;

        default:
          s.addText(slideData.heading || "", {
            x: 0.5,
            y: 2.0,
            w: 12.33,
            fontSize: 28,
            color: t.bodyColor,
          });
          break;
      }

      // Add speaker notes if available
      if (slideData.notes) {
        s.addNotes(slideData.notes);
      }
    }

    const buffer = await pptx.write({ outputType: "nodebuffer" });
    const buf = Buffer.isBuffer(buffer)
      ? buffer
      : Buffer.from(buffer as ArrayBuffer);

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${(title || "presentation")
          .replace(/[^a-zA-Z0-9\s-]/g, "")
          .replace(/\s+/g, "-")}.pptx"`,
      },
    });
  } catch (err) {
    console.error("PPTX export error:", err);
    return NextResponse.json(
      { error: "Failed to export PPTX. Please try again." },
      { status: 500 }
    );
  }
}
