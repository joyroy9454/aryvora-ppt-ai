/**
 * Server-side PDF generation endpoint.
 * Converts slides into a simple HTML-rendered PDF-like package.
 * For Vercel deployment, we generate HTML that the browser can print to PDF.
 */
import { NextRequest, NextResponse } from "next/server";
import type { Slide } from "@/types";

const THEME_CSS: Record<string, string> = {
  corporate: "bg-white text-slate-800",
  creative: "bg-white text-purple-900",
  minimal: "bg-white text-gray-900",
  bold: "bg-slate-900 text-white",
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

    const slideHtml = slides.map((s, i) => renderSlideHtml(s, i, slides.length)).join("\n");

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
    }
    .slide:last-child { page-break-after: auto; }
    .slide-number {
      position: absolute; bottom: 30px; right: 50px;
      font-size: 14px; opacity: 0.4;
    }
    h1 { font-size: 48px; font-weight: 700; margin-bottom: 16px; }
    h2 { font-size: 28px; font-weight: 400; margin-bottom: 32px; opacity: 0.8; }
    h3 { font-size: 36px; font-weight: 700; margin-bottom: 40px; }
    ul { list-style: none; padding: 0; }
    li {
      font-size: 22px; padding: 8px 0;
      padding-left: 32px; position: relative;
      line-height: 1.6;
    }
    li::before { content: '\\2022'; position: absolute; left: 8px; font-weight: bold; }
    .columns { display: flex; gap: 60px; flex: 1; }
    .column { flex: 1; }
    .column h4 { font-size: 24px; margin-bottom: 16px; opacity: 0.9; }
    .closing-title { text-align: center; margin-top: 20vh; }
    .badge {
      display: inline-block;
      padding: 8px 24px;
      border-radius: 50px;
      font-size: 18px;
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

function renderSlideHtml(s: Slide, index: number, total: number): string {
  let content = "";

  switch (s.type) {
    case "title":
      content = renderTitleSlide(s);
      break;
    case "content":
      content = renderContentSlide(s);
      break;
    case "two-column":
      content = renderTwoColumnSlide(s);
      break;
    case "closing":
      content = renderClosingSlide(s);
      break;
    default:
      content = renderContentSlide(s);
      break;
  }

  return `  <div class="slide">
    ${content}
    <div class="slide-number">${index + 1} / ${total}</div>
  </div>`;
}

function renderTitleSlide(s: Slide): string {
  let html = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center;">';
  html += "<h1>" + escapeHtml(s.heading) + "</h1>";
  if (s.sub) {
    html += '<h2 style="font-size:28px;opacity:0.7;">' + escapeHtml(s.sub) + "</h2>";
  }
  html += "</div>";
  return html;
}

function renderContentSlide(s: Slide): string {
  let html = "";
  html += "<h3>" + escapeHtml(s.heading) + "</h3>";
  if (s.bullets && s.bullets.length > 0) {
    html += "<ul style='flex:1;'>";
    for (const b of s.bullets) {
      html += "<li>" + escapeHtml(b) + "</li>";
    }
    html += "</ul>";
  }
  return html;
}

function renderTwoColumnSlide(s: Slide): string {
  let html = "";
  html += "<h3>" + escapeHtml(s.heading) + "</h3>";
  html += '<div class="columns">';
  html += '<div class="column"><h4>Overview</h4><ul>';
  if (s.leftCol) {
    for (const item of s.leftCol) {
      html += "<li>" + escapeHtml(item) + "</li>";
    }
  }
  html += "</ul></div>";
  html += '<div class="column"><h4>Details</h4><ul>';
  if (s.rightCol) {
    for (const item of s.rightCol) {
      html += "<li>" + escapeHtml(item) + "</li>";
    }
  }
  html += "</ul></div></div>";
  return html;
}

function renderClosingSlide(s: Slide): string {
  let html = '<div class="closing-title">';
  html += "<h1>" + escapeHtml(s.heading) + "</h1>";
  if (s.sub) {
    html += "<h2>" + escapeHtml(s.sub) + "</h2>";
  }
  if (s.bullets && s.bullets.length > 0) {
    html += '<div style="margin-top:40px;text-align:center;">';
    for (const b of s.bullets) {
      html += '<div class="badge" style="margin:8px;display:inline-block;opacity:0.8;">' + escapeHtml(b) + "</div>";
    }
    html += "</div>";
  }
  html += "</div>";
  return html;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
