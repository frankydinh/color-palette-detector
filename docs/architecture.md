# Architecture

Color Palette Detector is a Manifest V3 Chrome extension. Everything runs
**client-side** — no backend, no accounts, no telemetry. This document explains
how the pieces fit together and why.

## Execution contexts

An MV3 extension runs code in several isolated contexts. This project uses four,
each with a distinct job:

```
┌─────────────────┐     message      ┌──────────────────┐
│  Content Script │◄────────────────►│  Service Worker   │
│  (DOM scanner)  │                  │  (bg, image fetch)│
└─────────────────┘                  └────────┬─────────┘
                                              │ message
                                     ┌────────▼─────────┐
                                     │   Side Panel      │
                                     │   (React UI)      │
                                     │   spawns ▼        │
                                     │  ┌─────────────┐  │
                                     │  │ Web Worker  │  │
                                     │  │ (quantize,  │  │
                                     │  │ OffscreenCanvas)│
                                     │  └─────────────┘  │
                                     └──────────────────┘
```

| Context | File | Responsibility | Constraints |
|---|---|---|---|
| **Service worker** | [`src/background/service-worker.ts`](../src/background/service-worker.ts) | Opens the side panel on icon click; fetches cross-origin image URLs → `ArrayBuffer` | **No DOM/Canvas** — never do pixel work here |
| **Content script** | [`src/content/scanner.ts`](../src/content/scanner.ts) | Walks the page DOM, aggregates colors by area/role | Injected **on-demand**, must be self-contained |
| **Side panel** | [`src/sidepanel/**`](../src/sidepanel) | The React UI + Zustand store | Has DOM; delegates heavy work to the worker |
| **Web worker** | [`src/workers/palette.worker.ts`](../src/workers/palette.worker.ts) | Decode image → downsample → median cut | Off the main thread; uses `OffscreenCanvas` |

### Why a side panel (not a popup)
A popup closes the moment you click away — hostile to a tool where you want to
browse a site and manipulate its colors side-by-side. The side panel
(`chrome.sidePanel`) stays open while you browse, enabling the
"scan website → colors appear alongside" flow.

## Data flow by input source

**Upload / drag-drop** → `File` → `ArrayBuffer` → Web Worker (`QUANTIZE`) →
`PaletteColor[]` + thumbnail → store → UI.

**Image URL** → side panel sends `FETCH_IMAGE` to the service worker → SW
`fetch()` → `ArrayBuffer` (bypasses tainted-canvas, since the image never loads
through a cross-origin `<img>`) → same worker path as upload.

**Website scan** → side panel calls `chrome.scripting.executeScript({ func })`
to inject the scanner → scanner returns a raw color aggregate (`ScanRaw`) → side
panel normalizes with culori, merges near-duplicates, assigns roles
([`src/lib/scan.ts`](../src/lib/scan.ts)) → store → UI.

Every color is normalized to the `Color` type (hex/rgb/hsl/cmyk) at the point of
entry; the UI never manipulates raw color strings.

## The scanner is injected, not declared
The content script is **not** listed in the manifest, so it never runs on pages
automatically. It is injected only when the user clicks "Scan this page", via
`chrome.scripting.executeScript({ func: collectPageColors })`. Because the
function is serialized (`Function.prototype.toString`) and re-parsed inside the
page, `collectPageColors` must be **fully self-contained** — every helper is
nested inside it and it references no module-scope imports at runtime
(`import type` is erased at compile time, so it's safe). This is asserted against
the built bundle during development.

The scanner reads `getComputedStyle` for every element and weights each color by
rendered area and role hint (background / text / border / gradient / SVG). Role
labels (background/text/primary/…) are **best-effort heuristics**, surfaced in
the UI as suggestions, never guarantees.

## Key algorithms (`src/lib/`)

- **Median cut** ([`quantize.ts`](../src/lib/quantize.ts)) — pixels are
  downsampled to ≤ ~100k, placed in one RGB box, then the largest box is
  repeatedly split at the median of its widest color axis until K boxes remain.
  Each box yields a representative average color and a `ratio` (% of pixels).
- **Near-duplicate merge** ([`quantize.ts`](../src/lib/quantize.ts)) — website
  scans collapse colors within ΔE2000 < 10 (via culori), summing their weights.
- **WCAG contrast** ([`contrast.ts`](../src/lib/contrast.ts)) — relative
  luminance + `(L1+0.05)/(L2+0.05)`; matches WebAIM to 2 decimals.
- **Harmony** ([`harmony.ts`](../src/lib/harmony.ts)) — HSL rotation for
  mono/analogous/complementary/triadic; conversions via culori for accuracy.
- **ASE export** ([`export-ase.ts`](../src/lib/export-ase.ts)) — hand-written
  big-endian binary writer (`ASEF` signature, UTF-16BE names, float32 RGB).
- **Report export** ([`export-md.ts`](../src/lib/export-md.ts) /
  [`export-html.ts`](../src/lib/export-html.ts)) — a Markdown analysis (tables +
  harmony + accessibility + a raw JSON block for AI input) and a self-contained,
  inline-styled HTML report. Both reuse the harmony/contrast/convert libs.
- **Mood** ([`mood.ts`](../src/lib/mood.ts)) — rule-based labels from circular
  mean hue, saturation, lightness spread; fully offline.
- **Live theming** ([`theme.ts`](../src/lib/theme.ts)) — derives the panel's
  accent from the dominant color while guaranteeing legibility on the dark
  surface (brightens or falls back to neutral if contrast is too low).

## Messaging & worker contracts
All cross-context messages go through discriminated unions in
[`src/types/index.ts`](../src/types/index.ts) (`Msg` for runtime messaging,
`WorkerRequest`/`WorkerResponse` for the worker) so every `sendMessage` /
`postMessage` is type-safe. Changing these is a cross-cutting concern.

## State & persistence
[`usePaletteStore`](../src/sidepanel/store/usePaletteStore.ts) (Zustand) holds
the palette, status, settings, history, and toasts. Palettes auto-save to
`chrome.storage.local` (capped at 50, FIFO) via
[`storage.ts`](../src/lib/storage.ts). Nothing leaves the machine.

## Testing
Unit tests (Vitest) cover the `lib` logic and — via jsdom — the scanner,
storage, and key components. E2E (Playwright) loads the built extension in
Chromium and drives the real UI. See [testing notes in the README](../README.md#testing).
