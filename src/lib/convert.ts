import {
  converter,
  formatHex,
  parse as culoriParse,
  type Rgb,
} from 'culori';
import type { Color, CopyFormat } from '@/types';

const toRgb = converter('rgb');
const toHsl = converter('hsl');

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

function round(n: number, decimals = 0): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

/** RGB channels are 0–1 (culori space) here. */
function rgbToCmyk(r: number, g: number, b: number): Color['cmyk'] {
  const k = 1 - Math.max(r, g, b);
  if (k >= 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }
  const c = (1 - r - k) / (1 - k);
  const m = (1 - g - k) / (1 - k);
  const y = (1 - b - k) / (1 - k);
  return {
    c: round(c * 100),
    m: round(m * 100),
    y: round(y * 100),
    k: round(k * 100),
  };
}

/** Build a normalized Color from a culori Rgb object (channels 0–1). */
export function fromRgbObject(rgb: Rgb): Color {
  const r = clamp(rgb.r, 0, 1);
  const g = clamp(rgb.g, 0, 1);
  const b = clamp(rgb.b, 0, 1);
  const hex = formatHex({ mode: 'rgb', r, g, b }).toUpperCase();
  const hsl = toHsl({ mode: 'rgb', r, g, b });
  return {
    hex,
    rgb: {
      r: round(r * 255),
      g: round(g * 255),
      b: round(b * 255),
    },
    hsl: {
      h: round(hsl.h ?? 0),
      s: round((hsl.s ?? 0) * 100),
      l: round((hsl.l ?? 0) * 100),
    },
    cmyk: rgbToCmyk(r, g, b),
  };
}

/** Build a normalized Color from 0–255 integer RGB (e.g. from ImageData). */
export function fromRgb255(r: number, g: number, b: number): Color {
  return fromRgbObject({ mode: 'rgb', r: r / 255, g: g / 255, b: b / 255 });
}

/**
 * Parse an arbitrary CSS color string (hex, rgb(), hsl(), named…) into a
 * normalized Color. Returns null if it can't be parsed or is fully
 * transparent.
 */
export function parseColor(input: string): Color | null {
  const parsed = culoriParse(input.trim());
  if (!parsed) return null;
  const rgb = toRgb(parsed);
  if (!rgb) return null;
  // Drop fully transparent colors (alpha === 0).
  if (rgb.alpha !== undefined && rgb.alpha <= 0) return null;
  return fromRgbObject(rgb);
}

/** Build a Color from an HSL triple (h:0–360, s/l:0–100). */
export function fromHsl(h: number, s: number, l: number): Color {
  const rgb = toRgb({ mode: 'hsl', h, s: s / 100, l: l / 100 });
  return fromRgbObject(rgb ?? { mode: 'rgb', r: 0, g: 0, b: 0 });
}

/** Format a color for clipboard copy in the requested format. */
export function formatColor(color: Color, format: CopyFormat): string {
  switch (format) {
    case 'hex':
      return color.hex;
    case 'rgb':
      return `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`;
    case 'hsl':
      return `hsl(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)`;
    case 'cmyk':
      return `cmyk(${color.cmyk.c}%, ${color.cmyk.m}%, ${color.cmyk.y}%, ${color.cmyk.k}%)`;
  }
}
