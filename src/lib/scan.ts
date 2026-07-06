import type { ColorRole, PaletteColor, RawScanColor, ScanRaw } from '@/types';
import { parseColor } from './convert';
import { mergeSimilar } from './quantize';

type DominantKind = 'bg' | 'text' | 'border' | 'other';

function dominantKind(rc: RawScanColor): DominantKind {
  const entries: [DominantKind, number][] = [
    ['bg', rc.bg],
    ['text', rc.text],
    ['border', rc.border],
    ['other', rc.other],
  ];
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0]![0];
}

/**
 * Turn a raw page scan into a roled, normalized palette.
 * Role labeling is best-effort heuristic (§6.3) — the UI must present it as a
 * suggestion, not a guarantee.
 */
export function processScan(raw: ScanRaw, count = 8): PaletteColor[] {
  // Find the strongest background candidate up front.
  let bgCss: string | null = null;
  let bgWeight = -1;
  for (const rc of raw.colors) {
    if (rc.bg > bgWeight) {
      bgWeight = rc.bg;
      bgCss = rc.css;
    }
  }

  const parsed: PaletteColor[] = [];
  for (const rc of raw.colors) {
    const color = parseColor(rc.css);
    if (!color) continue;
    const kind = dominantKind(rc);
    let role: ColorRole;
    if (rc.css === bgCss) {
      role = 'background';
    } else if (kind === 'text') {
      role = 'text';
    } else if (color.hsl.s >= 40 && color.hsl.l > 15 && color.hsl.l < 92) {
      // Saturated, non-extreme → likely a brand/CTA color.
      role = 'primary';
    } else {
      role = 'secondary';
    }
    parsed.push({ ...color, ratio: rc.weight, role });
  }

  // Merge perceptually-near colors (sums weights), then keep the top N.
  const merged = mergeSimilar(parsed, 10).slice(0, count);

  // Demote extra 'primary' colors to 'accent' so only the strongest stays primary.
  let primarySeen = false;
  for (const c of merged) {
    if (c.role === 'primary') {
      if (primarySeen) c.role = 'accent';
      else primarySeen = true;
    }
  }

  // Normalize ratios of the kept colors to sum ~100%.
  const total = merged.reduce((s, c) => s + c.ratio, 0) || 1;
  for (const c of merged) {
    c.ratio = Math.round((c.ratio / total) * 1000) / 10;
  }

  return merged.sort((a, b) => b.ratio - a.ratio);
}
