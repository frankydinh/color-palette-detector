import type { PaletteColor } from '@/types';
import { relativeLuminance } from './contrast';

/**
 * Render the palette to a JPEG blob: horizontal color bands with the HEX code
 * (and % if available) printed under each. Runs in the side panel (has DOM).
 */
export async function exportPaletteImage(
  colors: PaletteColor[],
  width = 1200,
): Promise<Blob> {
  const n = Math.max(1, colors.length);
  const swatchW = width / n;
  const swatchH = Math.round(width * 0.45);
  const labelH = 96;
  const height = swatchH + labelH;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  // Background for the label strip.
  ctx.fillStyle = '#0e0f13';
  ctx.fillRect(0, 0, width, height);

  colors.forEach((color, i) => {
    const x = i * swatchW;
    ctx.fillStyle = color.hex;
    ctx.fillRect(x, 0, Math.ceil(swatchW), swatchH);

    // HEX label centered under the swatch, in a readable color.
    ctx.fillStyle = '#e7e9ee';
    ctx.font = '600 26px ui-monospace, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(color.hex, x + swatchW / 2, swatchH + labelH / 2 - 12);

    if (typeof color.ratio === 'number') {
      ctx.fillStyle = '#9aa0ad';
      ctx.font = '400 20px ui-sans-serif, system-ui, sans-serif';
      ctx.fillText(
        `${color.ratio}%`,
        x + swatchW / 2,
        swatchH + labelH / 2 + 18,
      );
    }

    // Thin top accent line inside dark swatches for definition.
    if (relativeLuminance(color) < 0.06) {
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.strokeRect(x + 0.5, 0.5, Math.ceil(swatchW) - 1, swatchH - 1);
    }
  });

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
      'image/jpeg',
      0.92,
    );
  });
}

/** Trigger a browser download of a blob or data URL. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
