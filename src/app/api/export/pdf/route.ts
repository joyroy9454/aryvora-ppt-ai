/**
 * Server-side PDF-ready HTML generation.
 * Returns HTML that the browser can print to PDF.
 */
import { NextRequest, NextResponse } from "next/server";
import type { Slide, TemplateId } from "@/types";

// All 10 template styles for PDF export
const THEME_STYLES: Record<
  TemplateId,
  { bg: string; title: string; body: string; accent: string; surface: string }
> = {
  corporate: {
    bg: "#FFFFFF",
    title: "#1B3A5C",
    body: "#2D3748",
    accent: "#2B6CB0",
    surface: "#F7FAFC",
  },
  academic: {
    bg: "#FAFAFA",
    title: "#2D3748",
    body: "#1A202C",
    accent: "#805AD5",
    surface: "#FFFFFF",
  },
  startup: {
    bg: "#0F0F23",
    title: "#FFFFFF",
    body: "#A0AEC0",
    accent: "#F59E0B",
    surface: "#1A1A3E",
  },
  minimal: {
    bg: "#FFFFFF",
    title: "#111827",
    body: "#4B5563",
    accent: "#6B7280",
    surface: "#F9FAFB",
  },
  dark: {
    bg: "#0F172A",
    title: "#F1F5F9",
    body: "#94A3B8",
    accent: "#63B3ED",
    surface: "#1E293B",
  },
  seminar: {
    bg: "#FFFFFF",
    title: "#064E3B",
    body: "#065F46",
    accent: "#059669",
    surface: "#ECFDF5",
  },
  marketing: {
    bg: "#FFFBEB",
    title: "#1C1917",
    body: "#78716C",
    accent: "#DC2626",
    surface: "#FFFFFF",
  },
  research: {
    bg: "#F0F9FF",
    title: "#0C4A6E",
    body: "#075985",
    accent: "#0369A1",
    surface: "#FFFFFF",
  },
  education: {
    bg: "#FFFFFF",
    title: "#1E1B4B",
    body: "#4338CA",
    accent: "#7C3AED",
    surface: "#FAF5FF",
  },
  portfolio: {
    bg: "#FFF1F2",
    title: "#1F2937",
    body: "#BE185D",
    accent: "#EC4899",
    surface: "#FFFFFF",
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

    const t = THEME_STYLES[theme] || THEME_STYLES.corporate;
    const slideHtml = slides
      .map((s, i) => renderSlideHtml(s, i, slides.length, t))
      .join("\n");

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title || "Presentation")}</title>
  <style>
    @page { size: landscape; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .slide {
      width: 100vw; height: 100vh;
      page-break-after: always;
      padding: 60px 80px;
      display: flex; flex-direction: column;
      position: relative;
      overflow: hidden;
      background: ${t.bg};
      color: ${t.body};
    }
    .slide:last-child { page-break-after: auto; }
    .slide-number {
      position: absolute; bottom: 30px; right: 50px;
      font-size: 14px; opacity: 0.4;
    }
    h1 { font-size: 48px; font-weight: 700; margin-bottom: 16px; color: ${t.title}; }
    h2 { font-size: 28px; font-weight: 400; margin-bottom: 32px; opacity: 0.8; color: ${t.accent}; }
    h3 { font-size: 36px; font-weight: 700; margin-bottom: 40px; color: ${t.title}; }
    ul { list-style: none; padding: 0; }
    li {
      font-size: 22px; padding: 8px 0;
      padding-left: 32px; position: relative;
      line-height: 1.6;
    }
    li::before { content: '\\2022'; position: absolute; left: 8px; font-weight: bold; color: ${t.accent}; }
    .columns { display: flex; gap: 60px; flex: 1; }
    .column { flex: 1; }
    .column h4 { font-size: 24px; margin-bottom: 16px; opacity: 0.9; color: ${t.title}; }
    .closing-title { text-align: center; margin-top: 20vh; }
    .badge {
      display: inline-block;
      padding: 8px 24px;
      border-radius: 50px;
      font-size: 18px;
      border: 1px solid ${t.body};
      opacity: 0.7;
    }
    .quote-mark { font-size: 60px; color: ${t.accent}; line-height: 1; }
    .stat-grid { display: flex; gap: 40px; justify-content: center; align-items: center; flex: 1; }
    .stat-item { text-align: center; }
    .stat-value { font-size: 48px; font-weight: 700; color: ${t.accent}; }
    .stat-label { font-size: 16px; margin-top: 8px; opacity: 0.7; }
    .timeline-item { display: flex; gap: 16px; margin-bottom: 16px; align-items: flex-start; }
    .timeline-dot {
      width: 24px; height: 24px; border-radius: 50%;
      background: ${t.accent}; color: ${t.bg};
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700; flex-shrink: 0;
    }
    .process-item { margin-bottom: 20px; }
    .process-step { font-weight: 700; color: ${t.accent}; font-size: 14px; }
    .divider-line {
      width: 80px; height: 4px; background: ${t.accent};
      margin: 20px 0; border-radius: 2px;
    }
  </style>
</head>
<body>
${slideHtml}
</body>
</html>`;

    return new NextResponse(fullHtml, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": "inline",
      },
    });
  } catch (err) {
    console.error("PDF export error:", err);
    return NextResponse.json(
      { error: "Failed to export PDF. Please try again." },
      { status: 500 }
    );
  }
}

function renderSlideHtml(
  s: Slide,
  index: number,
  total: number,
  t: { bg: string; title: string; body: string; accent: string; surface: string }
): string {
  let content = "";

  switch (s.type) {
    case "title":
      content = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center;">
        <h1>${escapeHtml(s.heading)}</h1>
        ${s.sub ? `<h2>${escapeHtml(s.sub)}</h2>` : ""}
      </div>`;
      break;

    case "content":
      content = `<h3>${escapeHtml(s.heading)}</h3>
        ${s.bullets && s.bullets.length > 0 ? `<ul style="flex:1;">${s.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>` : ""}`;
      break;

    case "two-column":
    case "comparison":
      content = `<h3>${escapeHtml(s.heading)}</h3>
        <div class="columns">
          <div class="column">
            <h4>Overview</h4>
            <ul>${(s.leftCol || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          </div>
          <div class="column">
            <h4>Details</h4>
            <ul>${(s.rightCol || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          </div>
        </div>`;
      break;

    case "quote":
      content = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center;padding:0 60px;">
        <div class="quote-mark">&ldquo;</div>
        <p style="font-size:28px;font-style:italic;margin:20px 0;color:${t.body};">${escapeHtml(s.quote || "Enter a quote...")}</p>
        ${s.author ? `<p style="font-size:18px;color:${t.accent};font-weight:600;">&mdash; ${escapeHtml(s.author)}</p>` : ""}
      </div>`;
      break;

    case "statistic":
      content = `<h3>${escapeHtml(s.heading)}</h3>
        <div class="stat-grid">
          ${(s.stats || []).map((stat) => `<div class="stat-item">
            <div class="stat-value">${escapeHtml(stat.value || "—")}</div>
            <div class="stat-label">${escapeHtml(stat.label || "")}</div>
          </div>`).join("")}
        </div>`;
      break;

    case "timeline":
      content = `<h3>${escapeHtml(s.heading)}</h3>
        <div style="flex:1;">
          ${(s.timeline || []).map((item, i) => `<div class="timeline-item">
            <div class="timeline-dot">${i + 1}</div>
            <div>
              <div style="font-weight:600;font-size:18px;color:${t.title};">${escapeHtml(item.label)}</div>
              <div style="font-size:14px;opacity:0.7;">${escapeHtml(item.description)}</div>
            </div>
          </div>`).join("")}
        </div>`;
      break;

    case "process":
      content = `<h3>${escapeHtml(s.heading)}</h3>
        <div style="flex:1;">
          ${(s.process || []).map((item) => `<div class="process-item">
            <div class="process-step">Step ${item.step}</div>
            <div style="font-weight:600;font-size:18px;color:${t.title};">${escapeHtml(item.title)}</div>
            <div style="font-size:14px;opacity:0.7;">${escapeHtml(item.description)}</div>
          </div>`).join("")}
        </div>`;
      break;

    case "divider":
      content = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center;">
        <h1>${escapeHtml(s.heading)}</h1>
        <div class="divider-line"></div>
        ${s.sub ? `<h2>${escapeHtml(s.sub)}</h2>` : ""}
      </div>`;
      break;

    case "summary":
      content = `<h3>${escapeHtml(s.heading)}</h3>
        ${s.bullets && s.bullets.length > 0 ? `<ul style="flex:1;">${s.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>` : ""}`;
      break;

    case "qa":
      content = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center;">
        <h1>${escapeHtml(s.heading)}</h1>
        ${s.bullets && s.bullets.length > 0 ? `<div style="margin-top:30px;">${s.bullets.map((b) => `<p style="font-size:20px;margin:8px 0;opacity:0.7;">${escapeHtml(b)}</p>`).join("")}</div>` : ""}
      </div>`;
      break;

    case "closing":
      content = `<div class="closing-title">
        <h1>${escapeHtml(s.heading)}</h1>
        ${s.sub ? `<h2>${escapeHtml(s.sub)}</h2>` : ""}
        ${s.bullets && s.bullets.length > 0 ? `<div style="margin-top:40px;text-align:center;">${s.bullets.map((b) => `<span class="badge" style="margin:8px;">${escapeHtml(b)}</span>`).join("")}</div>` : ""}
      </div>`;
      break;

    default:
      content = `<div style="display:flex;align-items:center;justify-content:center;height:100%;">
        <p style="font-size:24px;">${escapeHtml(s.heading)}</p>
      </div>`;
      break;
  }

  return `  <div class="slide">
    ${content}
    <div class="slide-number">${index + 1} / ${total}</div>
  </div>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
