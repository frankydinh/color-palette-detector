// Shared types across all extension contexts (side panel, worker, content
// script, service worker). Keep this file dependency-free so it can be
// imported everywhere without pulling in DOM/React.

/** Normalized internal color — every color in the app is stored as this. */
export interface Color {
  /** "#RRGGBB", uppercase, no alpha at MVP. */
  hex: string;
  rgb: { r: number; g: number; b: number }; // 0–255
  hsl: { h: number; s: number; l: number }; // h:0–360, s/l:0–100
  cmyk: { c: number; m: number; y: number; k: number }; // 0–100, approximate
}

export type ColorRole =
  | 'background'
  | 'text'
  | 'primary'
  | 'secondary'
  | 'accent';

export interface PaletteColor extends Color {
  /** % coverage, 0–100, rounded to 1 decimal. */
  ratio: number;
  /** Only present when scanned from a website (best-effort heuristic). */
  role?: ColorRole;
}

export type HarmonyType =
  | 'monochromatic'
  | 'analogous'
  | 'complementary'
  | 'triadic';

export interface ContrastResult {
  ratio: number; // e.g. 4.53
  aa: boolean; // >= 4.5 (normal text)
  aaLarge: boolean; // >= 3.0 (large text)
  aaa: boolean; // >= 7.0
  aaaLarge: boolean; // >= 4.5
}

export type PaletteSource = 'upload' | 'image-url' | 'website' | 'eyedropper';

export interface PaletteEntry {
  id: string; // crypto.randomUUID()
  createdAt: number; // Date.now()
  source: PaletteSource;
  sourceLabel?: string; // filename or domain
  colors: PaletteColor[];
  /** Small data URL preview (max ~200px) for the history drawer. */
  thumbnail?: string;
  mood?: string[]; // P2, e.g. ["Elegant", "Tech"]
}

export type CopyFormat = 'hex' | 'rgb' | 'hsl' | 'cmyk';

/** Raw color aggregate returned by the in-page scanner (before normalization). */
export interface RawScanColor {
  css: string; // computed color string, e.g. "rgb(12, 34, 56)"
  weight: number; // total area-weighted contribution
  bg: number; // weight contributed as background
  text: number; // weight contributed as text color
  border: number; // weight contributed as border/outline/shadow
  other: number; // weight contributed as fill/stroke/gradient
}

export interface ScanRaw {
  pageLabel: string; // domain of the scanned page
  colors: RawScanColor[];
}

export interface Settings {
  defaultCopyFormat: CopyFormat;
  cssPrefix: string;
  swatchCount: number; // default number of dominant colors (4–10)
}

export const DEFAULT_SETTINGS: Settings = {
  defaultCopyFormat: 'hex',
  cssPrefix: '--color-',
  swatchCount: 6,
};

// ---------------------------------------------------------------------------
// Messaging contract (§8.6) — every chrome.runtime.sendMessage goes through
// this discriminated union so cross-context messages stay type-safe.
// ---------------------------------------------------------------------------

export type Msg =
  | { type: 'FETCH_IMAGE'; url: string }
  | {
      type: 'FETCH_IMAGE_RESULT';
      ok: boolean;
      // Image bytes as base64 — an ArrayBuffer can't survive JSON message
      // serialization through chrome.runtime.sendMessage.
      dataBase64?: string;
      mime?: string;
      error?: string;
    }
  | { type: 'SCAN_PAGE' }
  | {
      type: 'SCAN_RESULT';
      ok: boolean;
      colors?: PaletteColor[];
      pageLabel?: string;
      error?: string;
    };

// ---------------------------------------------------------------------------
// Worker protocol — messages between side panel and palette.worker.ts.
// ---------------------------------------------------------------------------

export type WorkerRequest = {
  id: number;
  type: 'QUANTIZE';
  buffer: ArrayBuffer;
  colorCount: number;
};

export type WorkerResponse =
  | {
      id: number;
      type: 'QUANTIZE_RESULT';
      colors: PaletteColor[];
      thumbnail: string;
    }
  | { id: number; type: 'QUANTIZE_ERROR'; error: string };
