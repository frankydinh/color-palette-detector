import type { ColorRole, PaletteColor } from '@/types';

const ROLE_NAME: Record<ColorRole, string> = {
  background: 'bg',
  text: 'text',
  primary: 'primary',
  secondary: 'secondary',
  accent: 'accent',
};

/**
 * Build CSS custom properties from a palette. When roles are present (website
 * scan) semantic names are preferred; duplicate roles get a numeric suffix.
 */
export function generateCss(
  colors: PaletteColor[],
  prefix = '--color-',
): string {
  const usedNames = new Map<string, number>();
  const lines = colors.map((color, i) => {
    let base: string;
    if (color.role) {
      base = ROLE_NAME[color.role];
    } else {
      base = String(i + 1);
    }
    const seen = usedNames.get(base) ?? 0;
    usedNames.set(base, seen + 1);
    const name = seen === 0 ? base : `${base}-${seen + 1}`;
    return `  ${prefix}${name}: ${color.hex};`;
  });
  return `:root {\n${lines.join('\n')}\n}\n`;
}
