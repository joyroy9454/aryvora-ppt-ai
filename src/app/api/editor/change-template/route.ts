/**
 * Change Template
 * Re-renders all slides with a new template while preserving content.
 */
import { NextRequest, NextResponse } from "next/server";
import type { Slide, TemplateId } from "@/types";
import { rewriteSlidesStyle } from "@/lib/ai-engine";
import { TEMPLATE_STYLE_MAP } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slides, newTemplateId, analysis } = body as {
      slides: Slide[];
      newTemplateId: TemplateId;
      analysis?: {
        category?: string;
        audience?: string;
        tone?: string;
        purpose?: string;
      };
    };

    if (!slides || !Array.isArray(slides) || slides.length === 0) {
      return NextResponse.json(
        { error: "No slides provided." },
        { status: 400 }
      );
    }

    if (!newTemplateId) {
      return NextResponse.json(
        { error: "New template ID is required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenRouter API key not configured." },
        { status: 500 }
      );
    }

    // Use the style rewrite function to adapt slides to new template
    const style = TEMPLATE_STYLE_MAP[newTemplateId] || "business";

    let updatedSlides: Slide[];
    try {
      updatedSlides = await rewriteSlidesStyle(slides, style);
    } catch {
      // If rewrite fails, return original slides with template info
      return NextResponse.json({
        slides,
        templateId: newTemplateId,
        message: "Template change failed — original slides preserved.",
      });
    }

    return NextResponse.json({
      slides: updatedSlides,
      templateId: newTemplateId,
      message: `Template changed to ${newTemplateId}.`,
    });
  } catch (err) {
    console.error("Change template error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? `Template change failed: ${err.message}`
            : "Failed to change template. Please try again.",
      },
      { status: 500 }
    );
  }
}
