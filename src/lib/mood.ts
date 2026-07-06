import type { PaletteColor } from '@/types';

interface PaletteStats {
  avgHue: number; // 0–360 (circular mean)
  avgSat: number; // 0–100
  avgLight: number; // 0–100
  lightSpread: number; // max-min lightness, 0–100
  warmRatio: number; // 0–1 share of warm-hued weight
}

function computeStats(colors: PaletteColor[]): PaletteStats {
  const totalWeight =
    colors.reduce((sum, c) => sum + (c.ratio || 1), 0) || 1;
  let sx = 0;
  let sy = 0;
  let sat = 0;
  let light = 0;
  let warm = 0;
  let minL = 100;
  let maxL = 0;
  for (const c of colors) {
    const w = c.ratio || 1;
    const rad = (c.hsl.h * Math.PI) / 180;
    sx += Math.cos(rad) * w;
    sy += Math.sin(rad) * w;
    sat += c.hsl.s * w;
    light += c.hsl.l * w;
    // Warm hues: red→yellow (0–60) and magenta (300–360).
    if (c.hsl.h <= 60 || c.hsl.h >= 300) warm += w;
    minL = Math.min(minL, c.hsl.l);
    maxL = Math.max(maxL, c.hsl.l);
  }
  let avgHue = (Math.atan2(sy, sx) * 180) / Math.PI;
  if (avgHue < 0) avgHue += 360;
  return {
    avgHue,
    avgSat: sat / totalWeight,
    avgLight: light / totalWeight,
    lightSpread: maxL - minL,
    warmRatio: warm / totalWeight,
  };
}

/**
 * Rule-based mood labels — client-side, no LLM. Best-effort, tuned to be
 * "reasonable to the eye" rather than academically precise. Returns 1–3 labels.
 */
export function labelMood(colors: PaletteColor[]): string[] {
  if (colors.length === 0) return [];
  const s = computeStats(colors);
  const labels: string[] = [];
  const isBlue = s.avgHue >= 180 && s.avgHue <= 270;

  // Minimal / Elegant: low saturation, bright, neutral.
  if (s.avgSat < 20 && s.avgLight > 65) {
    labels.push('Minimal', 'Elegant');
  }
  // Tech / Corporate: dark, desaturated, cool/blue.
  else if (s.avgLight < 45 && s.avgSat < 55 && isBlue) {
    labels.push('Tech', 'Corporate');
  }
  // Playful / Youthful: vivid + bright.
  else if (s.avgSat > 60 && s.avgLight > 45) {
    labels.push('Playful', 'Youthful');
  }
  // Vintage: warm, muted, mid lightness.
  else if (s.warmRatio > 0.55 && s.avgSat < 55 && s.avgSat > 15) {
    labels.push('Vintage', 'Warm');
  }
  // Bold / Dramatic: vivid but dark, or very high contrast.
  else if (s.avgSat > 55 || s.lightSpread > 60) {
    labels.push('Bold', 'Dramatic');
  }
  // Fallbacks by temperature.
  else if (s.warmRatio > 0.5) {
    labels.push('Warm', 'Cozy');
  } else {
    labels.push('Cool', 'Calm');
  }

  return labels.slice(0, 3);
}
