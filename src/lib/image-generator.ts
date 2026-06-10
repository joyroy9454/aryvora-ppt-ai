// ============================================================
// Local Image Generator
// Generates beautiful SVG images as base64 data URIs.
// Zero external HTTP requests — works on Render free tier.
// ============================================================

export interface ImageTheme {
  primary: string;   // hex color
  accent: string;    // hex color
  surface: string;   // hex color
  bg: string;        // hex color
}

// Seeded pseudo-random for deterministic images per keyword
function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  return () => {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    return h / 0x7fffffff;
  };
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return [r, g, b].map(c => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0')).join('');
}

function lighten(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
}

function darken(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}

// ── Pattern generators ──

function generateGeometricPattern(theme: ImageTheme, keyword: string, width: number, height: number): string {
  const rand = seededRandom(keyword + '_geo');
  const { primary, accent, surface, bg } = theme;
  const bgLight = lighten(bg, 0.3);
  const primaryDark = darken(primary, 0.15);

  let shapes = '';

  // Background gradient
  shapes += `<defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bg}"/>
      <stop offset="100%" style="stop-color:${bgLight}"/>
    </linearGradient>
    <linearGradient id="shapeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${primary};stop-opacity:0.8"/>
      <stop offset="100%" style="stop-color:${primaryDark};stop-opacity:0.6"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${accent};stop-opacity:0.9"/>
      <stop offset="100%" style="stop-color:${lighten(accent, 0.2)};stop-opacity:0.7"/>
    </linearGradient>
  </defs>`;
  shapes += `<rect width="${width}" height="${height}" fill="url(#bg)"/>`;

  // Large background circles
  for (let i = 0; i < 5; i++) {
    const cx = rand() * width;
    const cy = rand() * height;
    const r = 80 + rand() * 200;
    const opacity = 0.05 + rand() * 0.1;
    shapes += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${primary}" opacity="${opacity}"/>`;
  }

  // Medium geometric shapes
  const shapeCount = 6 + Math.floor(rand() * 6);
  for (let i = 0; i < shapeCount; i++) {
    const x = rand() * width;
    const y = rand() * height;
    const size = 20 + rand() * 60;
    const opacity = 0.1 + rand() * 0.25;
    const useAccent = rand() > 0.6;
    const fill = useAccent ? `url(#accentGrad)` : `url(#shapeGrad)`;
    const shapeType = Math.floor(rand() * 4);

    switch (shapeType) {
      case 0: // circle
        shapes += `<circle cx="${x}" cy="${y}" r="${size / 2}" fill="${fill}" opacity="${opacity}"/>`;
        break;
      case 1: // rounded rect
        shapes += `<rect x="${x - size / 2}" y="${y - size / 2}" width="${size}" height="${size * 0.7}" rx="${size * 0.15}" fill="${fill}" opacity="${opacity}" transform="rotate(${rand() * 30 - 15}, ${x}, ${y})"/>`;
        break;
      case 2: // triangle
        const h2 = size * 0.866;
        shapes += `<polygon points="${x},${y - h2 / 2} ${x - size / 2},${y + h2 / 2} ${x + size / 2},${y + h2 / 2}" fill="${fill}" opacity="${opacity}"/>`;
        break;
      case 3: // diamond
        shapes += `<polygon points="${x},${y - size / 2} ${x + size / 2},${y} ${x},${y + size / 2} ${x - size / 2},${y}" fill="${fill}" opacity="${opacity}" transform="rotate(${rand() * 45}, ${x}, ${y})"/>`;
        break;
    }
  }

  // Connecting lines
  for (let i = 0; i < 4; i++) {
    const x1 = rand() * width;
    const y1 = rand() * height;
    const x2 = x1 + (rand() - 0.5) * 300;
    const y2 = y1 + (rand() - 0.5) * 200;
    shapes += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${accent}" stroke-width="1" opacity="0.15"/>`;
  }

  // Small dots scattered
  for (let i = 0; i < 20; i++) {
    const x = rand() * width;
    const y = rand() * height;
    const r = 1.5 + rand() * 3;
    shapes += `<circle cx="${x}" cy="${y}" r="${r}" fill="${accent}" opacity="${0.1 + rand() * 0.2}"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${shapes}</svg>`;
}

function generateWavePattern(theme: ImageTheme, keyword: string, width: number, height: number): string {
  const rand = seededRandom(keyword + '_wave');
  const { primary, accent, bg } = theme;
  const bgLight = lighten(bg, 0.4);

  let shapes = `<defs>
    <linearGradient id="waveBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${bg}"/>
      <stop offset="100%" style="stop-color:${bgLight}"/>
    </linearGradient>
    <linearGradient id="wave1" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${primary};stop-opacity:0.3"/>
      <stop offset="50%" style="stop-color:${accent};stop-opacity:0.2"/>
      <stop offset="100%" style="stop-color:${primary};stop-opacity:0.3"/>
    </linearGradient>
    <linearGradient id="wave2" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${accent};stop-opacity:0.2"/>
      <stop offset="50%" style="stop-color:${primary};stop-opacity:0.15"/>
      <stop offset="100%" style="stop-color:${accent};stop-opacity:0.2"/>
    </linearGradient>
  </defs>`;
  shapes += `<rect width="${width}" height="${height}" fill="url(#waveBg)"/>`;

  // Wave layers
  for (let w = 0; w < 4; w++) {
    const yBase = height * (0.3 + w * 0.18);
    const amplitude = 30 + rand() * 40;
    const frequency = 0.005 + rand() * 0.01;
    const phase = rand() * Math.PI * 2;
    const opacity = 0.15 + w * 0.05;

    let path = `M 0 ${yBase}`;
    for (let x = 0; x <= width; x += 5) {
      const y = yBase + Math.sin(x * frequency + phase) * amplitude + Math.sin(x * frequency * 2.3 + phase * 1.5) * (amplitude * 0.4);
      path += ` L ${x} ${y}`;
    }
    path += ` L ${width} ${height} L 0 ${height} Z`;

    const gradId = w % 2 === 0 ? 'wave1' : 'wave2';
    shapes += `<path d="${path}" fill="url(${gradId})" opacity="${opacity}"/>`;
  }

  // Floating circles
  for (let i = 0; i < 8; i++) {
    const cx = rand() * width;
    const cy = rand() * height;
    const r = 15 + rand() * 50;
    shapes += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${i % 2 === 0 ? primary : accent}" opacity="${0.05 + rand() * 0.1}"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${shapes}</svg>`;
}

function generateGridPattern(theme: ImageTheme, keyword: string, width: number, height: number): string {
  const rand = seededRandom(keyword + '_grid');
  const { primary, accent, bg } = theme;
  const primaryLight = lighten(primary, 0.7);

  let shapes = `<rect width="${width}" height="${height}" fill="${bg}"/>`;

  // Grid dots
  const spacing = 30;
  for (let x = spacing; x < width; x += spacing) {
    for (let y = spacing; y < height; y += spacing) {
      const r = 1 + rand() * 2;
      const opacity = 0.15 + rand() * 0.2;
      shapes += `<circle cx="${x}" cy="${y}" r="${r}" fill="${primary}" opacity="${opacity}"/>`;
    }
  }

  // Highlighted cells
  const cellCount = 4 + Math.floor(rand() * 5);
  for (let i = 0; i < cellCount; i++) {
    const col = Math.floor(rand() * (width / spacing));
    const row = Math.floor(rand() * (height / spacing));
    const x = col * spacing;
    const y = row * spacing;
    const cellW = spacing * (1 + Math.floor(rand() * 3));
    const cellH = spacing * (1 + Math.floor(rand() * 2));
    const useAccent = rand() > 0.5;
    shapes += `<rect x="${x}" y="${y}" width="${Math.min(cellW, width - x)}" height="${Math.min(cellH, height - y)}" rx="4" fill="${useAccent ? accent : primary}" opacity="${0.08 + rand() * 0.12}"/>`;
  }

  // Accent line
  const lineY = height * (0.2 + rand() * 0.6);
  shapes += `<line x1="${width * 0.1}" y1="${lineY}" x2="${width * 0.9}" y2="${lineY}" stroke="${accent}" stroke-width="2" opacity="0.2"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${shapes}</svg>`;
}

function generateAbstractPattern(theme: ImageTheme, keyword: string, width: number, height: number): string {
  const rand = seededRandom(keyword + '_abs');
  const { primary, accent, bg } = theme;

  let shapes = `<defs>
    <radialGradient id="absBg" cx="50%" cy="50%" r="70%">
      <stop offset="0%" style="stop-color:${lighten(bg, 0.2)}"/>
      <stop offset="100%" style="stop-color:${bg}"/>
    </radialGradient>
  </defs>`;
  shapes += `<rect width="${width}" height="${height}" fill="url(#absBg)"/>`;

  // Large blurred circles (simulated with opacity)
  for (let i = 0; i < 6; i++) {
    const cx = width * (0.2 + rand() * 0.6);
    const cy = height * (0.2 + rand() * 0.6);
    const r = 60 + rand() * 150;
    const useAccent = rand() > 0.5;
    const color = useAccent ? accent : primary;

    // Multiple concentric circles for "blur" effect
    for (let j = 3; j >= 0; j--) {
      shapes += `<circle cx="${cx}" cy="${cy}" r="${r + j * 15}" fill="${color}" opacity="${0.02 + rand() * 0.04}"/>`;
    }
  }

  // Flowing curves (simplified as thick paths)
  for (let i = 0; i < 3; i++) {
    const startY = rand() * height;
    let path = `M 0 ${startY}`;
    for (let x = 0; x <= width; x += 40) {
      const y = startY + Math.sin(x * 0.008 + i * 2) * 80 + (rand() - 0.5) * 30;
      path += ` Q ${x + 20} ${y - 20} ${x + 40} ${y}`;
    }
    shapes += `<path d="${path}" fill="none" stroke="${i % 2 === 0 ? primary : accent}" stroke-width="${2 + rand() * 3}" opacity="${0.1 + rand() * 0.1}" stroke-linecap="round"/>`;
  }

  // Small accent dots
  for (let i = 0; i < 15; i++) {
    const x = rand() * width;
    const y = rand() * height;
    shapes += `<circle cx="${x}" cy="${y}" r="${2 + rand() * 4}" fill="${accent}" opacity="${0.15 + rand() * 0.2}"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${shapes}</svg>`;
}

// ── Main export: generate image as base64 data URI ──

export function generateImage(
  keyword: string,
  theme: ImageTheme,
  width = 800,
  height = 600
): string {
  // Pick a pattern based on keyword hash
  const patterns = [
    generateGeometricPattern,
    generateWavePattern,
    generateGridPattern,
    generateAbstractPattern,
  ];

  const patternIndex = Math.abs(keyword.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % patterns.length;
  const svg = patterns[patternIndex](theme, keyword, width, height);

  // Convert SVG to base64 data URI
  const base64 = Buffer.from(svg, 'utf-8').toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

// Generate multiple unique images for a set of keywords
export function generateImageSet(
  keywords: string[],
  theme: ImageTheme,
  width = 800,
  height = 600
): Map<string, string> {
  const map = new Map<string, string>();
  for (const kw of keywords) {
    map.set(kw, generateImage(kw, theme, width, height));
  }
  return map;
}
