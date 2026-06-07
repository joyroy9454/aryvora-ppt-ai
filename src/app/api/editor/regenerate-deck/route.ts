/**
 * Regenerate Entire Deck
 * Takes existing slides and regenerates them all with AI.
 */
import { NextRequest, NextResponse } from "next/server";
import type { Slide, TemplateId, InputMode } from "@/types";
import {
  generateSlidesOneByOne,
  generateSpeakerNotes,
  enhanceContent,
  finalQualityCheck,
  type ExtendedAnalysis,
} from "@/lib/ai-engine";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      slides,
      title,
      templateId,
      analysis,
      inputText,
      inputMode,
    } = body as {
      slides: Slide[];
      title: string;
      templateId: TemplateId;
      analysis: ExtendedAnalysis;
      inputText?: string;
      inputMode?: InputMode;
    };

    if (!slides || !Array.isArray(slides) || slides.length === 0) {
      return NextResponse.json(
        { error: "No slides provided." },
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

    // Build a summary of existing slides for context
    const existingSummary = slides
      .map((s, i) => `Slide ${i + 1} (${s.type}): ${s.heading}`)
      .join("\n");

    const contextText = inputText || `Regenerate this presentation:\n${existingSummary}`;

    // Regenerate all slides
    let newSlides: Slide[];
    try {
      newSlides = await generateSlidesOneByOne(
        contextText,
        analysis,
        templateId,
        inputMode || "topic",
        undefined,
        undefined
      );
    } catch {
      // If regeneration fails, return original slides
      return NextResponse.json({
        slides,
        message: "Regeneration failed — original slides preserved.",
      });
    }

    // Enhance and add notes
    try {
      newSlides = await enhanceContent(newSlides, analysis);
    } catch {
      // Continue without enhancement
    }

    try {
      newSlides = await generateSpeakerNotes(newSlides);
    } catch {
      // Notes are optional
    }

    newSlides = finalQualityCheck(newSlides, analysis);

    return NextResponse.json({
      slides: newSlides,
      message: `Successfully regenerated ${newSlides.length} slides.`,
    });
  } catch (err) {
    console.error("Regenerate deck error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? `Regeneration failed: ${err.message}`
            : "Failed to regenerate deck. Please try again.",
      },
      { status: 500 }
    );
  }
}
