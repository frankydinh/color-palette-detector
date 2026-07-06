import type { Color } from '@/types';
import { fromHsl } from './convert';
import { contrastRatio, relativeLuminance } from './contrast';

export interface Theme {
  accent: string; // main accent hex
  accentFg: string; // readable text on the accent
  accentSoft: string; // translucent accent for glows/backgrounds
}

const NEUTRAL: Theme = {
  accent: '#6366f1',
  accentFg: '#ffffff',
  accentSoft: 'rgba(99,102,241,0.15)',
};

const WHITE: Color = fromHsl(0, 0, 100);
const BLACK: Color = fromHsl(0, 0, 0);

/**
 * Derive a live UI accent from the dominant color while guaranteeing it stays
 * legible on the dark surface (#0e0f13). Very dark or very desaturated
 * dominants fall back toward a usable accent.
 */
export function deriveTheme(dominant: Color | undefined): Theme {
  if (!dominant) return NEUTRAL;

  const { h } = dominant.hsl;
  let { s, l } = dominant.hsl;

  // Guarantee some chroma so the accent reads as a color, not gray.
  if (s < 25) s = 35;
  // Keep lightness in a band that shows up on a near-black surface.
  l = Math.min(72, Math.max(48, l));

  let accentColor = fromHsl(h, s, l);

  // Ensure the accent has enough contrast against the dark surface; if not,
  // brighten it stepwise, else fall back to neutral.
  const surface = fromHsl(0, 0, 6); // ~#0e0f13
  let guard = 0;
  while (contrastRatio(accentColor, surface) < 2.4 && guard < 6) {
    l = Math.min(88, l + 8);
    accentColor = fromHsl(h, s, l);
    guard++;
  }
  if (contrastRatio(accentColor, surface) < 2.4) return NEUTRAL;

  const accentFg =
    contrastRatio(WHITE, accentColor) >= contrastRatio(BLACK, accentColor)
      ? '#ffffff'
      : '#0e0f13';

  const soft = `rgba(${accentColor.rgb.r}, ${accentColor.rgb.g}, ${accentColor.rgb.b}, 0.16)`;

  return { accent: accentColor.hex, accentFg, accentSoft: soft };
}

/** Apply theme vars to a root element (document.documentElement). */
export function applyTheme(theme: Theme, root: HTMLElement): void {
  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--accent-fg', theme.accentFg);
  root.style.setProperty('--accent-soft', theme.accentSoft);
}

export { relativeLuminance };
