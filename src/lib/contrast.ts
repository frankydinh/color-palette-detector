import type { Color, ContrastResult } from '@/types';

/** Linearize one sRGB channel (input 0–255) per WCAG 2.x. */
function channelLuminance(c255: number): number {
  const c = c255 / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance of a color. */
export function relativeLuminance(color: Color): number {
  const { r, g, b } = color.rgb;
  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  );
}

/** Contrast ratio between two colors (1–21). */
export function contrastRatio(a: Color, b: Color): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

export function checkContrast(fg: Color, bg: Color): ContrastResult {
  const raw = contrastRatio(fg, bg);
  const ratio = Math.round(raw * 100) / 100;
  return {
    ratio,
    aa: ratio >= 4.5,
    aaLarge: ratio >= 3.0,
    aaa: ratio >= 7.0,
    aaaLarge: ratio >= 4.5,
  };
}
