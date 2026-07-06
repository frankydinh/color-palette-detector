import { differenceCiede2000 } from 'culori';
import type { PaletteColor } from '@/types';
import { fromRgb255 } from './convert';

type Pixel = [number, number, number]; // r,g,b 0–255

interface Box {
  pixels: Pixel[];
}

const TARGET_MAX_PIXELS = 100_000;
const DOWNSAMPLE_THRESHOLD = 200_000;

/**
 * Extract opaque pixels from RGBA data, downsampling so the working set stays
 * <= ~100k pixels for speed (accuracy loss is negligible for dominant colors).
 */
export function extractPixels(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): Pixel[] {
  const total = width * height;
  let step = 1;
  if (total > DOWNSAMPLE_THRESHOLD) {
    step = Math.ceil(Math.sqrt(total / TARGET_MAX_PIXELS));
  }
  const pixels: Pixel[] = [];
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4;
      const a = data[i + 3] ?? 0;
      if (a < 125) continue; // skip (semi-)transparent pixels
      pixels.push([data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0]);
    }
  }
  return pixels;
}

function channelRange(pixels: Pixel[], ch: 0 | 1 | 2): number {
  let min = 255;
  let max = 0;
  for (const p of pixels) {
    const v = p[ch];
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return max - min;
}

function widestChannel(pixels: Pixel[]): 0 | 1 | 2 {
  const r = channelRange(pixels, 0);
  const g = channelRange(pixels, 1);
  const b = channelRange(pixels, 2);
  if (r >= g && r >= b) return 0;
  if (g >= r && g >= b) return 1;
  return 2;
}

/** Split the box with the largest pixel span along its widest color axis. */
function splitBox(box: Box): [Box, Box] {
  const ch = widestChannel(box.pixels);
  const sorted = [...box.pixels].sort((a, b) => a[ch] - b[ch]);
  const mid = sorted.length >> 1;
  return [{ pixels: sorted.slice(0, mid) }, { pixels: sorted.slice(mid) }];
}

function averageColor(pixels: Pixel[]): Pixel {
  let r = 0;
  let g = 0;
  let b = 0;
  for (const p of pixels) {
    r += p[0];
    g += p[1];
    b += p[2];
  }
  const n = pixels.length || 1;
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
}

/**
 * Median Cut quantization. Returns up to `count` representative colors with a
 * `ratio` (% of sampled pixels in each box), sorted by ratio descending.
 */
export function medianCut(pixels: Pixel[], count: number): PaletteColor[] {
  if (pixels.length === 0) return [];
  const target = Math.max(1, Math.min(count, pixels.length));
  const boxes: Box[] = [{ pixels }];

  while (boxes.length < target) {
    // Pick the box with the most pixels that can still be split.
    let idx = -1;
    let best = 1;
    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i];
      if (box && box.pixels.length > best) {
        best = box.pixels.length;
        idx = i;
      }
    }
    if (idx === -1) break; // nothing splittable left
    const box = boxes[idx]!;
    const [a, b] = splitBox(box);
    boxes.splice(idx, 1, a, b);
  }

  const totalPixels = pixels.length;
  return boxes
    .filter((box) => box.pixels.length > 0)
    .map((box) => {
      const [r, g, b] = averageColor(box.pixels);
      const ratio = (box.pixels.length / totalPixels) * 100;
      return {
        ...fromRgb255(r, g, b),
        ratio: Math.round(ratio * 10) / 10,
      };
    })
    .sort((x, y) => y.ratio - x.ratio);
}

const diff = differenceCiede2000();

/**
 * Merge colors that are perceptually close (ΔE2000 < threshold), summing their
 * ratios. Used for website scans to collapse hundreds of near-duplicate
 * shades. Input colors are assumed sorted by ratio descending; the highest
 * ratio color in each cluster wins as the representative.
 */
export function mergeSimilar(
  colors: PaletteColor[],
  threshold = 10,
): PaletteColor[] {
  const result: PaletteColor[] = [];
  for (const color of colors) {
    let merged = false;
    for (const bucket of result) {
      if (diff(bucket.hex, color.hex) < threshold) {
        bucket.ratio = Math.round((bucket.ratio + color.ratio) * 10) / 10;
        // Preserve a role if the incoming color carries one and bucket doesn't.
        if (!bucket.role && color.role) bucket.role = color.role;
        merged = true;
        break;
      }
    }
    if (!merged) result.push({ ...color });
  }
  return result.sort((a, b) => b.ratio - a.ratio);
}
