import { NextRequest, NextResponse } from "next/server";
import type { Slide } from "@/types";
import PptxGenJS from "pptxgenjs";

const THEMES: Record<string, { bg: string; titleColor: string; bodyColor: string; accent: string }> = {
  corporate: { bg: "FFFFFF", titleColor: "1B3A5C", bodyColor: "2D3748", accent: "2B6CB0" },
  creative: { bg: "FAFAFA", titleColor: "6B21A8", bodyColor: "1F2937", accent: "9333EA" },
  minimal: { bg: "FFFFFF", titleColor: "111827", bodyColor: "4B5563", accent: "6B7280" },
  bold: { bg: "0F172A", titleColor: "FFFFFF", bodyColor: "CBD5E1", accent: "F59E0B" },
};

export async function POST(request: NextRequest) {
  try {
    const { slides, title, theme } = await request.json() as {
      slides: Slide[];
      title: string;
      theme: string;
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

      // Background
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
            const bulletText = slideData.bullets.map((b) => ({ text: b, options: { bullet: true as const, color: t.bodyColor, fontSize: 18, spacing: { line: 280 } } }));
            s.addText(bulletText, {
              x: 0.5,
              y: 1.3,
              w: 12.33,
              valign: "top",
            });
          }
          break;

        case "two-column":
          s.addText(slideData.heading, {
            x: 0.5,
            y: 0.3,
            w: 12.33,
            fontSize: 32,
            bold: true,
            color: t.titleColor,
          });
          if (slideData.leftCol && slideData.leftCol.length > 0) {
            const leftText = slideData.leftCol.map((b) => ({ text: b, options: { bullet: true as const, color: t.bodyColor, fontSize: 16 } }));
            s.addText(leftText, {
              x: 0.5,
              y: 1.3,
              w: 5.9,
              valign: "top",
            });
          }
          if (slideData.rightCol && slideData.rightCol.length > 0) {
            const rightText = slideData.rightCol.map((b) => ({ text: b, options: { bullet: true as const, color: t.bodyColor, fontSize: 16 } }));
            s.addText(rightText, {
              x: 6.4,
              y: 1.3,
              w: 5.9,
              valign: "top",
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
            const items = slideData.bullets.map((b) => ({ text: b, options: { color: t.bodyColor, fontSize: 18 } }));
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
    }

    const buffer = await pptx.write({ outputType: "nodebuffer" });
    const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer as ArrayBuffer);

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${(title || "presentation").replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "-")}.pptx"`,
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
