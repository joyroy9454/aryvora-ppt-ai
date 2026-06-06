import { NextRequest, NextResponse } from "next/server";
import type { Slide } from "@/types";

/**
 * Export presentation as Markdown
 */
export async function POST(request: NextRequest) {
  try {
    const { slides, title } = await request.json() as {
      slides: Slide[];
      title: string;
    };

    if (!slides || !Array.isArray(slides) || slides.length === 0) {
      return NextResponse.json({ error: "No slides provided." }, { status: 400 });
    }

    let md = `# ${title || "Presentation"}\n\n`;

    for (let i = 0; i < slides.length; i++) {
      const s = slides[i];
      md += `---\n\n`;
      md += `## ${s.heading}\n\n`;

      if (s.sub) {
        md += `*${s.sub}*\n\n`;
      }

      if (s.bullets && s.bullets.length > 0) {
        for (const b of s.bullets) {
          md += `- ${b}\n`;
        }
        md += "\n";
      }

      if (s.leftCol && s.rightCol) {
        md += `| ${s.leftCol.join(" | ")} |\n`;
        md += `| ${s.rightCol.map(() => "---").join(" | ")} |\n`;
        md += `| ${s.rightCol.join(" | ")} |\n\n`;
      }

      if (s.quote) {
        md += `> ${s.quote}\n`;
        if (s.author) {
          md += `> — ${s.author}\n`;
        }
        md += "\n";
      }

      if (s.stats && s.stats.length > 0) {
        for (const stat of s.stats) {
          md += `- **${stat.value}** — ${stat.label}\n`;
        }
        md += "\n";
      }

      if (s.timeline && s.timeline.length > 0) {
        for (const item of s.timeline) {
          md += `- **${item.label}**: ${item.description}\n`;
        }
        md += "\n";
      }

      if (s.process && s.process.length > 0) {
        for (const item of s.process) {
          md += `${item.step}. **${item.title}**: ${item.description}\n`;
        }
        md += "\n";
      }

      if (s.notes) {
        md += `*Speaker Notes: ${s.notes}*\n\n`;
      }
    }

    return new NextResponse(md, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown",
        "Content-Disposition": `attachment; filename="${(title || "presentation").replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "-")}.md"`,
      },
    });
  } catch (err) {
    console.error("Markdown export error:", err);
    return NextResponse.json(
      { error: "Failed to export markdown." },
      { status: 500 }
    );
  }
}
