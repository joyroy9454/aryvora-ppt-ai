import { NextRequest, NextResponse } from "next/server";
import type { Slide, TemplateId } from "@/types";
import PptxGenJS from "pptxgenjs";
import { THEMES } from "@/lib/constants";

// ShapeType from pptxgenjs instance (not exported on class)
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

    slides.forEach((sl, idx) => {
      const s = pptx.addSlide();
      s.background = { color: hex(t.bg) };
      const n = idx + 1, N = slides.length;

      switch (sl.type) {
        case "title": sFill(s, t.surface); sBar(s, t.accent); sText(s, trunc(sl.heading, 50), 1.5, 2, 10.33, 42, true, hex(t.titleColor), "center", F); if (sl.sub) sText(s, trunc(sl.sub, 70), 2, 3.4, 9.33, 20, false, hex(t.accent), "center", F); sLine(s, 5.5, 3.05, 2.33, 0.05, t.accent); break;
        case "statistic": { const st = slStat(s, sl, t); if (st.length > 0) { const cw = 11.5 / st.length; st.forEach((st, i) => { const x = 0.9 + i * cw; sBox(s, x, 1.5, cw - 0.3, 4.5, t.surface, 12); sText(s, trunc(String(st.value || "—"), 12), x, 2.2, cw - 0.3, 38, true, hex(t.accent), "center", F); sText(s, trunc(st.label || "", 25), x, 3.5, cw - 0.3, 13, false, hex(t.bodyColor), "center", F); }); } break; }
        case "quote": sFill(s, t.surface); sBar(s, t.accent, 0.15); sText(s, "\u201C", 1, 1.2, 2, 80, false, hex(t.accent), "left", FG); sText(s, trunc(sl.quote || "", 180), 2, 1.5, 9.5, 24, false, hex(t.bodyColor), "center", FG); if (sl.author) sText(s, "— " + trunc(sl.author, 50), 2, 4.2, 9.5, 16, false, hex(t.accent), "center", F); sLine(s, 5.5, 3.8, 2.33, 0.04, t.accent); break;
        case "timeline": { sBar(s, t.accent); slHdr(s, sl, t); const items = (sl.timeline || []).slice(0, 5); if (items.length > 0) { const iw = 11.5 / items.length; sLine(s, 1, 3.2, 11.33, 0, t.accent, 2); items.forEach((it, i) => { const x = 1 + i * iw + iw / 2; sDot(s, x - 0.2, 3, 0.4, t.accent); sText(s, trunc(it.label, 18), x - iw / 2 + 0.1, 1.5, iw - 0.2, 13, true, hex(t.titleColor), "center", F); sText(s, trunc(it.description, 35), x - iw / 2 + 0.1, 3.6, iw - 0.2, 10, false, hex(t.bodyColor), "center", F); }); } break; }
        case "process": { sBar(s, t.accent); slHdr(s, sl, t); const steps = (sl.process || []).slice(0, 5); steps.forEach((step, i) => { const y = 1.1 + i * 1.15; sDot(s, 0.6, y, 0.55, t.accent); sText(s, String(step.step || i + 1), 0.6, y + 0.05, 0.55, 14, true, "FFFFFF", "center", F); sText(s, trunc(step.title, 45), 1.35, y - 0.02, 11.5, 17, true, hex(t.titleColor), "left", F); sText(s, trunc(step.description, 70), 1.35, y + 0.38, 11.5, 12, false, hex(t.bodyColor), "left", F); if (i < steps.length - 1) sLine(s, 0.87, y + 0.55, 0, 0.6, t.accent, 1, "dash"); }); break; }
        case "chart": { sBar(s, t.accent); slHdr(s, sl, t); const ci = (sl.chart || []).slice(0, 6); if (ci.length > 0) { const bw = 10.5 / ci.length; const mx = Math.max(...ci.map(d => Number(d.value) || 0), 1); ci.forEach((d, i) => { const val = Number(d.value) || 0; const bh = (val / mx) * 3.8; const x = 1.4 + i * bw; s.addShape(SHAPE.roundRect, { x, y: 5.8 - bh, w: bw - 0.35, h: bh, fill: { color: hex(t.accent) }, rectRadius: 0.05 }); sText(s, trunc(String(d.value), 10), x, 5.8 - bh - 0.4, bw - 0.35, 14, true, hex(t.titleColor), "center", F); sText(s, trunc(d.label, 14), x, 5.9, bw - 0.35, 10, false, hex(t.bodyColor), "center", F); }); } break; }
        case "diagram": { sBar(s, t.accent); slHdr(s, sl, t); const items = (sl.bullets || []).slice(0, 9); if (items.length > 0) { const cols = Math.min(items.length, 3); const rows = Math.ceil(items.length / cols); const bw = 3.5, bh = 1.2, gx = 0.4, gy = 0.4; const sx = (13.33 - cols * (bw + gx) + gx) / 2; const sy = 1.3; items.forEach((item, i) => { const col = i % cols; const row = Math.floor(i / cols); const x = sx + col * (bw + gx); const y = sy + row * (bh + gy); s.addShape(SHAPE.roundRect, { x, y, w: bw, h: bh, fill: { color: hex(t.surface) }, line: { color: hex(t.accent), width: 1.5 }, rectRadius: 0.1 }); sText(s, trunc(item, 35), x + 0.2, y + 0.2, bw - 0.4, bh - 0.4, false, hex(t.bodyColor), "center", F); if (col < cols - 1 && i < items.length - 1) sLine(s, x + bw, y + bh / 2, gx, 0, t.accent, 1.5); }); } break; }
        case "case-study": { sBar(s, t.accent); slHdr(s, sl, t); const secs = [{ l: "Challenge", i: sl.leftCol || [], c: t.accent }, { l: "Solution", i: sl.rightCol || [], c: t.titleColor }, { l: "Results", i: sl.bullets || [], c: t.accent }]; const sw = 3.8, sg = 0.35; secs.forEach((sec, i) => { const x = 0.5 + i * (sw + sg); sBox(s, x, 1, sw, 0.45, sec.c); sText(s, sec.l, x + 0.15, 1.05, sw - 0.3, 14, true, "FFFFFF", "left", F); slBul(s, sec.i, t, x + 0.1, 1.6, sw - 0.2, 12); }); break; }
        case "divider": sFill(s, t.surface); sText(s, trunc(sl.heading, 50), 1, 2.5, 11.33, 40, true, hex(t.titleColor), "center", F); sLine(s, 5.5, 3.6, 2.33, 0.06, t.accent); if (sl.sub) sText(s, trunc(sl.sub, 60), 2, 4, 9.33, 18, false, hex(t.accent), "center", F); break;
        case "summary": sBar(s, t.accent); slHdr(s, sl, t); slBul(s, sl.bullets || [], t, 0.5, 1.1, 12.33, 19); break;
        case "qa": sFill(s, t.surface); sBar(s, t.accent, 0.15); sText(s, trunc(sl.heading, 40), 1, 1.8, 11.33, 42, true, hex(t.titleColor), "center", F); sText(s, "?", 5.5, 3, 2.33, 72, true, hex(t.accent), "center", F); if (sl.bullets?.length) sText(s, sl.bullets.map(b => trunc(b, 50)).join("  •  "), 1.5, 4.8, 10.33, 15, false, hex(t.bodyColor), "center", F); break;
        case "image-left": case "image-right": {
          sBar(s, t.accent); const left = sl.type === "image-left"; const tx = left ? 6.5 : 0.5; const ix = left ? 0.5 : 7;
          slHdr(s, sl, t, tx); slBul(s, sl.bullets || [], t, tx, 1, 6, 15);
          try { s.addImage({ path: sl.imageUrl!, x: ix, y: 1, w: 5.8, h: 5.5 }); } catch { sBox(s, ix, 1, 5.8, 5.5, t.surface, 0, t.accent); sText(s, "[ Image ]", ix, 3.5, 5.8, 14, false, hex(t.bodyColor), "center", F); }
          break;
        }
        case "closing": sFill(s, t.surface); sBar(s, t.accent); sText(s, trunc(sl.heading, 40), 1, 2, 11.33, 44, true, hex(t.titleColor), "center", F); if (sl.sub) sText(s, trunc(sl.sub, 60), 2, 3.3, 9.33, 20, false, hex(t.accent), "center", F); if (sl.bullets?.length) sText(s, sl.bullets.map(b => trunc(b, 40)).join("  •  "), 1.5, 4.2, 10.33, 16, false, hex(t.bodyColor), "center", F); sLine(s, 0, 7, 13.33, 0.05, t.surface); break;
        case "two-column": { sBar(s, t.accent); slHdr(s, sl, t); slCol(s, sl.leftCol || [], t, 0.5, 1, 5.8, true); slCol(s, sl.rightCol || [], t, 6.9, 1, 5.8, false); sLine(s, 6.4, 1, 0, 5.8, t.surface, 1); break; }
        case "comparison": { sBar(s, t.accent); slHdr(s, sl, t); sBox(s, 0.5, 1, 5.7, 5.5, t.surface, 10, t.accent); sBox(s, 7.1, 1, 5.7, 5.5, t.surface, 10, t.titleColor); slCol(s, sl.leftCol || [], t, 0.5, 1.05, 5.7, true); slCol(s, sl.rightCol || [], t, 7.1, 1.05, 5.7, false); sDot(s, 6.2, 3, 0.9, t.accent); sText(s, "VS", 6.2, 3.15, 0.9, 16, true, "FFFFFF", "center", F); break; }
        // content, blank, default
        default: sBar(s, t.accent); slHdr(s, sl, t); slBul(s, sl.bullets || [], t, 0.5, 1.1, 12.33, 17); break;
      }
      sNum(s, n, N, t);
      if (sl.notes) s.addNotes(sl.notes);
    });

    const buffer = await pptx.write({ outputType: "nodebuffer" });
    const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer as ArrayBuffer);
    const safeTitle = (title || "presentation").replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 50);
    return new NextResponse(new Uint8Array(buf), { status: 200, headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation", "Content-Disposition": `attachment; filename="${safeTitle}.pptx"` } });
  } catch (err) {
    console.error("PPTX export error:", err);
    return NextResponse.json({ error: err instanceof Error ? `Export failed: ${err.message}` : "Failed to export PPTX." }, { status: 500 });
  }
}

// ── Inline helpers ──
function sFill(s: PptxGenJS.Slide, c: string) { s.addShape(SHAPE.rect, { x: 0, y: 0, w: 13.33, h: 7.5, fill: { color: hex(c) } }); }
function sBar(s: PptxGenJS.Slide, c: string, w = 0.08) { s.addShape(SHAPE.rect, { x: 0, y: 0, w, h: 7.5, fill: { color: hex(c) } }); }
function sText(s: PptxGenJS.Slide, t: string, x: number, y: number, w: number, sz: number, bold: boolean, color: string, align: "left" | "center" | "right", font: string) { if (!t) return; s.addText(t, { x, y, w, fontSize: sz, bold, color: hex(color), align, fontFace: font }); }
function sLine(s: PptxGenJS.Slide, x: number, y: number, w: number, h: number, color: string, width = 1, dash?: "dash" | "solid") { s.addShape(SHAPE.line, { x, y, w, h, line: { color: hex(color), width, ...(dash ? { dashType: dash as "dash" } : {}) } }); }
function sBox(s: PptxGenJS.Slide, x: number, y: number, w: number, h: number, fill: string, radius = 0, lineColor?: string) { s.addShape(SHAPE.roundRect, { x, y, w, h, fill: { color: hex(fill) }, ...(radius ? { rectRadius: radius } : {}), ...(lineColor ? { line: { color: hex(lineColor) } } : {}) }); }
function sDot(s: PptxGenJS.Slide, x: number, y: number, size: number, color: string) { s.addShape(SHAPE.ellipse, { x, y, w: size, h: size, fill: { color: hex(color) } }); }
function sNum(s: PptxGenJS.Slide, n: number, N: number, t: any) { sText(s, `${n} / ${N}`, 12, 6.9, 1.2, 9, false, "999999", "right", F); }
function slStat(s: PptxGenJS.Slide, sl: Slide, t: any) { return (sl.stats || []).slice(0, 4); }
function slHdr(s: PptxGenJS.Slide, sl: Slide, t: any, x = 0.6) { sText(s, trunc(sl.heading, 70), x, 0.35, 12.1, 30, true, t.titleColor, "left", F); sLine(s, x, 0.78, 1.5, 0.06, t.accent); }
function slBul(s: PptxGenJS.Slide, bullets: string[], t: any, x: number, y: number, w: number, sz: number) {
  if (!bullets?.length) return;
  s.addText(bullets.slice(0, 6).map(b => ({ text: trunc(b, 100), options: { bullet: true as const, color: hex(t.bodyColor), fontSize: sz, spacing: { line: 260 }, fontFace: F } })), { x, y, w, valign: "top" });
}
function slCol(s: PptxGenJS.Slide, items: string[], t: any, x: number, y: number, w: number, colored: boolean) {
  if (!items?.length) return;
  s.addShape(SHAPE.rect, { x, y, w, h: 0.4, fill: { color: hex(colored ? t.accent : t.titleColor) } });
  sText(s, trunc(items[0], 35), x + 0.1, y + 0.02, w - 0.2, 14, true, "FFFFFF", "left", F);
  if (items.length > 1) slBul(s, items.slice(1), t, x, y + 0.5, w, 14);
}
