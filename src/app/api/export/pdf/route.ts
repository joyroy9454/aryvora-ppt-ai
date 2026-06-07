/**
 * Server-side PDF-ready HTML generation.
 * Returns responsive HTML that the browser can print to PDF.
 * Supports all 18 slide types with proper print formatting.
 */
import { NextRequest, NextResponse } from "next/server";
import type { Slide, TemplateId } from "@/types";
import { CSS_THEMES } from "@/lib/constants";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

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

    const t = CSS_THEMES[theme] || CSS_THEMES.corporate;
    const titleSafe = esc(title || "Presentation");

    const slideHtml = slides
      .map((s, i) => renderSlideHtml(s, i, slides.length, t))
      .join("\n");

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${titleSafe}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Slide container ── */
    .slide {
      width: 100vw;
      height: 100vh;
      min-height: 100vh;
      page-break-after: always;
      page-break-inside: avoid;
      padding: 50px 70px;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
      background: ${t.bg};
      color: ${t.body};
      line-height: 1.5;
    }
    .slide:last-child { page-break-after: auto; }

    /* ── Common elements ── */
    .slide-number {
      position: absolute;
      bottom: 25px;
      right: 40px;
      font-size: 13px;
      opacity: 0.35;
    }
    .accent-bar {
      width: 60px;
      height: 4px;
      background: ${t.accent};
      border-radius: 2px;
      margin: 12px 0 24px 0;
    }

    /* ── Typography ── */
    h1 { font-size: 44px; font-weight: 700; margin-bottom: 12px; color: ${t.title}; line-height: 1.2; }
    h2 { font-size: 24px; font-weight: 400; margin-bottom: 28px; color: ${t.accent}; opacity: 0.85; }
    h3 { font-size: 32px; font-weight: 700; margin-bottom: 32px; color: ${t.title}; }
    h4 { font-size: 20px; font-weight: 600; margin-bottom: 12px; color: ${t.title}; }

    ul { list-style: none; padding: 0; }
    li {
      font-size: 20px; padding: 6px 0;
      padding-left: 28px; position: relative;
      line-height: 1.6;
    }
    li::before {
      content: '\\2022';
      position: absolute; left: 8px;
      font-weight: bold; color: ${t.accent};
    }

    /* ── Layouts ── */
    .center-content {
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      height: 100%; text-align: center;
    }
    .columns { display: flex; gap: 50px; flex: 1; }
    .column { flex: 1; }
    .column-divider {
      width: 2px; background: ${t.surface};
      margin: 0 10px; align-self: stretch;
    }

    /* ── Quote ── */
    .quote-mark { font-size: 56px; color: ${t.accent}; line-height: 1; margin-bottom: -10px; }

    /* ── Stats ── */
    .stat-grid { display: flex; gap: 32px; justify-content: center; align-items: center; flex: 1; flex-wrap: wrap; }
    .stat-item { text-align: center; min-width: 140px; }
    .stat-card {
      background: ${t.surface};
      border-radius: 12px;
      padding: 24px 20px;
    }
    .stat-value { font-size: 42px; font-weight: 700; color: ${t.accent}; }
    .stat-label { font-size: 14px; margin-top: 8px; opacity: 0.7; }

    /* ── Timeline ── */
    .timeline-track {
      display: flex; gap: 0; align-items: flex-start;
      position: relative; padding-top: 20px;
    }
    .timeline-track::before {
      content: '';
      position: absolute; top: 32px; left: 20px; right: 20px;
      height: 3px; background: ${t.accent};
    }
    .timeline-item { flex: 1; text-align: center; padding: 0 8px; }
    .timeline-dot {
      width: 20px; height: 20px; border-radius: 50%;
      background: ${t.accent}; margin: 0 auto 12px auto;
      position: relative; z-index: 1;
    }
    .timeline-label { font-weight: 600; font-size: 16px; color: ${t.title}; margin-bottom: 4px; }
    .timeline-desc { font-size: 12px; opacity: 0.7; }

    /* ── Process ── */
    .process-item { display: flex; gap: 16px; margin-bottom: 14px; align-items: flex-start; }
    .process-num {
      width: 32px; height: 32px; border-radius: 50%;
      background: ${t.accent}; color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 14px; flex-shrink: 0;
    }
    .process-content { flex: 1; }
    .process-title { font-weight: 600; font-size: 18px; color: ${t.title}; }
    .process-desc { font-size: 14px; opacity: 0.7; margin-top: 2px; }

    /* ── Chart ── */
    .chart-grid { display: flex; gap: 20px; align-items: flex-end; justify-content: center; flex: 1; padding-bottom: 20px; }
    .chart-bar-container { text-align: center; flex: 1; max-width: 150px; }
    .chart-bar {
      width: 100%;
      border-radius: 6px 6px 0 0;
      background: ${t.accent};
      margin-bottom: 8px;
    }
    .chart-value { font-weight: 700; font-size: 18px; color: ${t.title}; }
    .chart-label { font-size: 12px; opacity: 0.7; }

    /* ── Diagram ── */
    .diagram-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; flex: 1; align-items: center; }
    .diagram-box {
      background: ${t.surface};
      border: 2px solid ${t.accent};
      border-radius: 10px;
      padding: 14px 12px;
      text-align: center;
      font-size: 14px;
      color: ${t.body};
    }

    /* ── Case Study ── */
    .case-grid { display: flex; gap: 24px; flex: 1; }
    .case-section { flex: 1; }
    .case-header {
      font-size: 14px; font-weight: 700;
      padding: 8px 14px; border-radius: 8px;
      color: #fff; margin-bottom: 12px;
    }
    .case-header.green { background: ${t.title}; }
    .case-header.blue { background: ${t.accent}; }

    /* ── Comparison ── */
    .comparison-grid { display: flex; gap: 30px; flex: 1; }
    .comparison-col { flex: 1; }
    .comparison-header {
      font-size: 16px; font-weight: 700;
      padding: 10px 16px; border-radius: 8px;
      color: #fff; margin-bottom: 14px;
    }

    /* ── Image layouts ── */
    .image-placeholder {
      background: ${t.surface};
      border: 2px dashed ${t.accent};
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; color: ${t.body}; opacity: 0.6;
    }

    /* ── Divider ── */
    .divider-bg { background: ${t.surface}; justify-content: center; }

    /* ── Q&A ── */
    .qa-bg { background: ${t.surface}; justify-content: center; }

    /* ── Print-specific ── */
    @page {
      size: landscape;
      margin: 0;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .slide { page-break-after: always; page-break-inside: avoid; }
      .no-print { display: none !important; }
    }

    /* ── Screen preview ── */
    @media screen {
      .slide {
        max-width: 1000px;
        margin: 20px auto;
        border-radius: 12px;
        box-shadow: 0 4px 24px rgba(0,0,0,0.1);
        page-break-after: auto;
      }
    }
  </style>
</head>
<body>
${slideHtml}
<script>
  // Auto-trigger print dialog after load
  window.addEventListener('load', function() {
    setTimeout(function() { window.print(); }, 500);
  });
</script>
</body>
</html>`;

    const safeTitle = (title || "presentation")
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 50);

    return new NextResponse(fullHtml, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="${safeTitle}.html"`,
      },
    });
  } catch (err) {
    console.error("PDF export error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? `Export failed: ${err.message}`
            : "Failed to export PDF. Please try again.",
      },
      { status: 500 }
    );
  }
}

// ── Render individual slide HTML ──
function renderSlideHtml(
  s: Slide,
  index: number,
  total: number,
  t: { bg: string; title: string; body: string; accent: string; surface: string }
): string {
  let content = "";
  const notesAttr = s.notes ? ` data-notes="${esc(s.notes)}"` : "";

  switch (s.type) {
    case "title":
      content = `<div class="center-content">
        <h1>${esc(s.heading)}</h1>
        <div class="accent-bar" style="margin: 16px auto;"></div>
        ${s.sub ? `<h2>${esc(s.sub)}</h2>` : ""}
      </div>`;
      break;

    case "content":
      content = `<h3>${esc(s.heading)}</h3>
        <div class="accent-bar"></div>
        ${s.bullets && s.bullets.length > 0 ? `<ul style="flex:1;">${s.bullets.map((b: string) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}`;
      break;

    case "two-column":
      content = `<h3>${esc(s.heading)}</h3>
        <div class="columns">
          <div class="column">
            <h4>${esc((s.leftCol || [])[0] || "Column A")}</h4>
            <ul>${(s.leftCol || []).slice(1).map((item: string) => `<li>${esc(item)}</li>`).join("")}</ul>
          </div>
          <div class="column-divider"></div>
          <div class="column">
            <h4>${esc((s.rightCol || [])[0] || "Column B")}</h4>
            <ul>${(s.rightCol || []).slice(1).map((item: string) => `<li>${esc(item)}</li>`).join("")}</ul>
          </div>
        </div>`;
      break;

    case "comparison":
      content = `<h3>${esc(s.heading)}</h3>
        <div class="columns">
          <div class="column">
            <div class="comparison-header" style="background:${t.accent}">${esc((s.leftCol || [])[0] || "Option A")}</div>
            <ul>${(s.leftCol || []).slice(1).map((item: string) => `<li>${esc(item)}</li>`).join("")}</ul>
          </div>
          <div class="column-divider"></div>
          <div class="column">
            <div class="comparison-header" style="background:${t.title}">${esc((s.rightCol || [])[0] || "Option B")}</div>
            <ul>${(s.rightCol || []).slice(1).map((item: string) => `<li>${esc(item)}</li>`).join("")}</ul>
          </div>
        </div>`;
      break;

    case "quote":
      content = `<div class="center-content" style="padding:0 60px;">
        <div class="quote-mark">&ldquo;</div>
        <p style="font-size:26px;font-style:italic;margin:16px 0;color:${t.body};">${esc(s.quote || "")}</p>
        ${s.author ? `<p style="font-size:16px;color:${t.accent};font-weight:600;margin-top:20px;">&mdash; ${esc(s.author)}</p>` : ""}
      </div>`;
      break;

    case "statistic": {
      const stats = (s.stats || []).slice(0, 4);
      content = `<h3>${esc(s.heading)}</h3>
        <div class="stat-grid">
          ${stats.map((stat: { value: string; label: string }) => `<div class="stat-item"><div class="stat-card"><div class="stat-value">${esc(stat.value || "—")}</div><div class="stat-label">${esc(stat.label || "")}</div></div></div>`).join("")}
        </div>`;
      break;
    }

    case "timeline": {
      const items = (s.timeline || []).slice(0, 5);
      content = `<h3>${esc(s.heading)}</h3>
        <div class="timeline-track" style="flex:1;">
          ${items.map((item: { label: string; description: string }, i: number) => `<div class="timeline-item"><div class="timeline-dot"></div><div><div class="timeline-label">${esc(item.label)}</div><div class="timeline-desc">${esc(item.description)}</div></div></div>`).join("")}
        </div>`;
      break;
    }

    case "process": {
      const steps = (s.process || []).slice(0, 5);
      content = `<h3>${esc(s.heading)}</h3>
        <div style="flex:1;">
          ${steps.map((item: { step: number; title: string; description: string }) => `<div class="process-item"><div class="process-num">${item.step}</div><div class="process-content"><div class="process-title">${esc(item.title)}</div><div class="process-desc">${esc(item.description)}</div></div></div>`).join("")}
        </div>`;
      break;
    }

    case "chart": {
      const chartItems = s.chart || s.stats || [];
      const maxVal = Math.max(...chartItems.map((d) => Number(d.value) || 0), 1);
      content = `<h3>${esc(s.heading)}</h3>
        <div class="chart-grid">
          ${chartItems.slice(0, 6).map((d) => {
            const val = Number(d.value) || 0;
            const pct = Math.max((val / maxVal) * 200, 20);
            return `<div class="chart-bar-container"><div class="chart-bar" style="height:${pct}px;"></div><div class="chart-value">${esc(String(d.value))}</div><div class="chart-label">${esc(d.label)}</div></div>`;
          }).join("")}
        </div>`;
      if (chartItems.length === 0) {
        content = `<h3>${esc(s.heading)}</h3><div style="display:flex;align-items:center;justify-content:center;flex:1;"><p style="font-size:18px;opacity:0.6;">No chart data available</p></div>`;
      }
      break;
    }

    case "diagram":
      content = `<h3>${esc(s.heading)}</h3>
        <div class="diagram-grid" style="flex:1;">
          ${(s.bullets || []).slice(0, 9).map((item: string) => `<div class="diagram-box">${esc(item)}</div>`).join("")}
        </div>`;
      break;

    case "case-study":
      content = `<h3>${esc(s.heading)}</h3>
        <div class="case-grid" style="flex:1;">
          <div class="case-section">
            <div class="case-header green">${esc("Challenge")}</div>
            <ul>${(s.leftCol || []).map((item: string) => `<li>${esc(item)}</li>`).join("")}</ul>
          </div>
          <div class="case-section">
            <div class="case-header blue">${esc("Solution")}</div>
            <ul>${(s.rightCol || []).map((item: string) => `<li>${esc(item)}</li>`).join("")}</ul>
          </div>
          <div class="case-section">
            <div class="case-header green">${esc("Results")}</div>
            <ul>${(s.bullets || []).map((item: string) => `<li>${esc(item)}</li>`).join("")}</ul>
          </div>
        </div>`;
      break;

    case "divider":
      content = `<div class="center-content divider-bg" style="border-radius:0;">
        <h1>${esc(s.heading)}</h1>
        <div class="divider-line" style="width:80px;height:4px;background:${t.accent};border-radius:2px;margin:20px auto;"></div>
        ${s.sub ? `<h2>${esc(s.sub)}</h2>` : ""}
      </div>`;
      break;

    case "summary":
      content = `<h3>${esc(s.heading)}</h3>
        <div class="accent-bar"></div>
        <ul style="flex:1;">
          ${(s.bullets || []).map((b: string) => `<li>${esc(b)}</li>`).join("")}
        </ul>`;
      break;

    case "qa":
      content = `<div class="center-content qa-bg" style="border-radius:0;">
        <h1 style="font-size:52px;margin-bottom:16px;">${esc(s.heading)}</h1>
        <div style="font-size:72px;font-weight:700;color:${t.accent};">?</div>
        ${s.bullets && s.bullets.length > 0 ? `<div style="margin-top:24px;">${s.bullets.map((b: string) => `<p style="font-size:18px;margin:6px 0;">${esc(b)}</p>`).join("")}</div>` : ""}
      </div>`;
      break;

    case "image-left":
      content = `<h3>${esc(s.heading)}</h3>
        <div class="columns">
          <div class="column" style="display:flex;align-items:center;justify-content:center;">
            ${s.imageUrl ? `<img src="${esc(s.imageUrl)}" style="max-width:100%;max-height:320px;border-radius:12px;object-fit:cover;" alt="" />` : `<div class="image-placeholder" style="width:100%;height:300px;">[Image]</div>`}
          </div>
          <div class="column-divider"></div>
          <div class="column">
            <ul style="flex:1;">${(s.bullets || []).map((b: string) => `<li>${esc(b)}</li>`).join("")}</ul>
          </div>
        </div>`;
      break;

    case "image-right":
      content = `<h3>${esc(s.heading)}</h3>
        <div class="columns">
          <div class="column">
            <ul style="flex:1;">${(s.bullets || []).map((b: string) => `<li>${esc(b)}</li>`).join("")}</ul>
          </div>
          <div class="column-divider"></div>
          <div class="column" style="display:flex;align-items:center;justify-content:center;">
            ${s.imageUrl ? `<img src="${esc(s.imageUrl)}" style="max-width:100%;max-height:320px;border-radius:12px;object-fit:cover;" alt="" />` : `<div class="image-placeholder" style="width:100%;height:300px;">[Image]</div>`}
          </div>
        </div>`;
      break;

    case "closing":
      content = `<div class="center-content">
        <h1>${esc(s.heading)}</h1>
        <div class="accent-bar" style="margin:16px auto;"></div>
        ${s.sub ? `<h2>${esc(s.sub)}</h2>` : ""}
        ${s.bullets && s.bullets.length > 0 ? `<div style="margin-top:32px;display:flex;gap:12px;flex-wrap:wrap;justify-content:center;">${s.bullets.map((b: string) => `<span style="padding:8px 20px;border:1px solid ${t.body};border-radius:50px;font-size:16px;">${esc(b)}</span>`).join("")}</div>` : ""}
      </div>`;
      break;

    case "blank":
      content = `<div class="center-content">
        <p style="font-size:22px;opacity:0.6;">${esc(s.heading)}</p>
      </div>`;
      break;

    default:
      content = `<div class="center-content">
        <h1>${esc(s.heading)}</h1>
        ${s.bullets && s.bullets.length > 0 ? `<ul style="text-align:left;margin-top:20px;">${s.bullets.map((b: string) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
      </div>`;
      break;
  }

  return `  <div class="slide"${notesAttr}>
    ${content}
    <div class="slide-number">${index + 1} / ${total}</div>
  </div>`;
}
