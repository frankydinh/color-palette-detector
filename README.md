# Color Palette Detector

A Chrome extension (Manifest V3) that extracts, analyzes, and exports color
palettes from **images** or from **any website you're viewing** — 100%
client-side, zero backend, zero telemetry.

Built as a portfolio/showoff piece: dark-mode-first side panel UI, live accent
theming that tints itself with the palette you just extracted, and smooth
micro-interactions throughout.

## Features

| Area | What it does |
|---|---|
| **Input** | Drag-drop / upload (PNG · JPEG · WebP), paste an image URL, or scan the current tab |
| **Website scanner** | Reads every element's computed styles (bg, text, border, shadow, gradient, SVG fill/stroke) — including colors set by JS at runtime — and suggests roles (background / text / primary…) |
| **Dominant colors** | Median-cut quantization in a Web Worker, with % coverage (60-30-10) and a 4–10 swatch stepper |
| **Harmony** | Monochromatic · Analogous · Complementary · Triadic generators |
| **Contrast** | WCAG 2.x contrast ratio + AA / AA-Large / AAA / AAA-Large badges with live preview |
| **Copy** | One-click HEX / RGB / HSL / CMYK (CMYK labeled *approximate*) |
| **Export** | JPEG (with hex labels), CSS variables (copy or download), and Adobe `.ase` |
| **History** | Last 50 palettes saved to `chrome.storage.local` (no account, no sync) |
| **Mood** | Rule-based, offline mood labels (Minimal, Tech, Playful, Vintage…) |

## Architecture

- **Service worker** — fetches cross-origin image URLs to an `ArrayBuffer`
  (bypassing tainted canvas), opens the side panel.
- **Content script** — injected on-demand via `chrome.scripting.executeScript`
  (never runs on every page); walks the DOM and aggregates area-weighted colors.
- **Side panel** (React) — the main UI; spawns a Web Worker for pixel work.
- **Web Worker** — `createImageBitmap` → `OffscreenCanvas` → downsample →
  median cut, all off the main thread.

## Tech stack

Vite + `@crxjs/vite-plugin` · React 18 + TypeScript (strict) · Tailwind CSS ·
Zustand · culori (color math) · lucide-react. Median-cut quantization and the
ASE binary writer are hand-implemented.

## Develop

```bash
npm install
npm run dev        # HMR dev build (writes to dist/ via CRXJS)
```

Then in Chrome: `chrome://extensions` → enable **Developer mode** → **Load
unpacked** → select the `dist/` folder. Click the toolbar icon to open the side
panel.

## Build

```bash
npm run build      # tsc --noEmit && vite build → dist/
```

Load the `dist/` folder as an unpacked extension.

## Testing

```bash
npm test          # unit tests (Vitest) — src/lib logic + component/DOM tests
npm run test:e2e  # end-to-end (Playwright) — loads the built extension, drives the side panel
```

- **Unit** (Vitest): pure color logic (`src/lib`), plus jsdom tests for the
  scanner, storage, and key components. Fast, run anywhere.
- **E2E** (Playwright): loads the unpacked extension in a real browser and
  exercises upload → palette → harmony → contrast. Requirements:
  - build first (`npm run build`) so `dist/` exists;
  - `npx playwright install chromium` — the test uses Playwright's **bundled
    Chromium**, not system Chrome (stable Chrome 137+ gates `--load-extension`);
  - on a headless machine, wrap it: `xvfb-run -a npm run test:e2e` (MV3
    extensions require a headed context).

## Regenerate icons

```bash
node scripts/gen-icons.mjs
```

## Notes

- **Permissions:** `<all_urls>` is used for dev-mode convenience (SW image fetch
  + on-demand scanner injection). Before publishing, migrate to
  `optional_host_permissions` requested on-demand — see the comment in
  [`manifest.config.ts`](manifest.config.ts).
- **Privacy:** the only network requests are (a) SW fetching an image URL you
  paste, and (b) injecting the scanner into a tab you explicitly choose to scan.
  Nothing is logged or sent anywhere.
- **CMYK** is an ICC-less approximation — not for print production.
- **Role labels** from website scans are best-effort heuristics, not guarantees.
