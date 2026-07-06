import type { Color, HarmonyType } from '@/types';
import { fromHsl } from './convert';

const wrapHue = (h: number) => ((h % 360) + 360) % 360;
const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

/**
 * Generate a harmony set from a base color using HSL rotation.
 * Rotation math is hand-written here; conversion accuracy comes from culori
 * (via fromHsl). The base color is always included where the rule implies it.
 */
export function generateHarmony(base: Color, type: HarmonyType): Color[] {
  const { h, s, l } = base.hsl;

  switch (type) {
    case 'monochromatic': {
      // Keep hue, vary lightness (+ a touch of saturation) → 5 shades.
      const steps = [-30, -15, 0, 15, 30];
      return steps.map((dl) =>
        fromHsl(h, clamp(s, 0, 100), clamp(l + dl, 5, 95)),
      );
    }
    case 'analogous': {
      // H ±30°, ±60° → 5 colors around the base.
      const offsets = [-60, -30, 0, 30, 60];
      return offsets.map((dh) => fromHsl(wrapHue(h + dh), s, l));
    }
    case 'complementary': {
      // Base + opposite, with one lighter/darker shade on each side.
      const comp = wrapHue(h + 180);
      return [
        fromHsl(h, s, clamp(l + 12, 5, 95)),
        fromHsl(h, s, l),
        fromHsl(comp, s, l),
        fromHsl(comp, s, clamp(l - 12, 5, 95)),
      ];
    }
    case 'triadic': {
      // Three hues evenly spaced 120° apart.
      return [h, wrapHue(h + 120), wrapHue(h + 240)].map((hue) =>
        fromHsl(hue, s, l),
      );
    }
  }
}

export const HARMONY_LABELS: Record<HarmonyType, string> = {
  monochromatic: 'Monochromatic',
  analogous: 'Analogous',
  complementary: 'Complementary',
  triadic: 'Triadic',
};
