import type { HarmonyType, PaletteColor, PaletteSource } from '@/types';
import { formatColor } from './convert';
import { generateHarmony, HARMONY_LABELS } from './harmony';
import { checkContrast } from './contrast';

/** Metadata that accompanies a palette in an exported report. */
export interface ReportMeta {
  source: PaletteSource | null;
  sourceLabel: string;
  mood: string[];
}

const HARMONY_ORDER: HarmonyType[] = [
  'monochromatic',
  'analogous',
  'complementary',
  'triadic',
];

/** Human-readable source description, e.g. "Website (example.com)". */
export function describeSource(meta: ReportMeta): string {
  const label = meta.sourceLabel.trim();
  switch (meta.source) {
    case 'website':
      return `Website (${label || 'current tab'})`;
    case 'upload':
      return `Upload (${label || 'image'})`;
    case 'image-url':
      return `Image URL (${label || 'remote'})`;
    case 'eyedropper':
      return 'Screen pick';
    default:
      return label || 'Unknown';
  }
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Build a Markdown report of the palette analysis — designed both as an input
 * for an AI to reason over (structured tables + a raw JSON block) and as a
 * human-readable summary.
 */
export function generateMarkdown(
  colors: PaletteColor[],
  meta: ReportMeta,
): string {
  const title = meta.sourceLabel.trim() || 'Untitled';
  const out: string[] = [];

  out.push(`# Color Palette — ${title}`, '');
  out.push(`- **Source:** ${describeSource(meta)}`);
  out.push(`- **Generated:** ${today()}`);
  out.push(`- **Colors:** ${colors.length}`);
  out.push(`- **Mood:** ${meta.mood.length ? meta.mood.join(', ') : '—'}`, '');

  out.push('## Colors', '');
  out.push('| # | HEX | RGB | HSL | CMYK | Coverage | Role |');
  out.push('|---|-----|-----|-----|------|----------|------|');
  colors.forEach((c, i) => {
    out.push(
      `| ${i + 1} | ${c.hex} | ${formatColor(c, 'rgb')} | ${formatColor(
        c,
        'hsl',
      )} | ${formatColor(c, 'cmyk')} | ${c.ratio}% | ${c.role ?? '—'} |`,
    );
  });
  out.push('');

  if (colors.length > 0) {
    const base = colors[0]!;
    out.push(`## Harmony (base ${base.hex})`, '');
    for (const type of HARMONY_ORDER) {
      const hexes = generateHarmony(base, type)
        .map((c) => c.hex)
        .join(', ');
      out.push(`- **${HARMONY_LABELS[type]}:** ${hexes}`);
    }
    out.push('');
  }

  out.push('## Accessibility', '');
  const text = colors.find((c) => c.role === 'text');
  const bg = colors.find((c) => c.role === 'background');
  if (text && bg) {
    const r = checkContrast(text, bg);
    out.push(
      `- **Text on background:** ${r.ratio}:1 — AA ${
        r.aa ? '✅' : '❌'
      }, AAA ${r.aaa ? '✅' : '❌'}`,
    );
  } else {
    out.push(
      '- Not enough role info (scan a website for text/background contrast).',
    );
  }
  out.push('');

  out.push('## Raw data', '');
  const raw = colors.map(({ hex, rgb, hsl, cmyk, ratio, role }) => ({
    hex,
    rgb,
    hsl,
    cmyk,
    ratio,
    role,
  }));
  out.push('```json', JSON.stringify(raw, null, 2), '```', '');

  return out.join('\n');
}
