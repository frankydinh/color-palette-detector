# User guide

How to use Color Palette Detector day-to-day.

## Install (dev mode)

1. `npm install && npm run build`
2. Open `chrome://extensions`, enable **Developer mode** (top-right).
3. Click **Load unpacked** and select the `dist/` folder.
4. Click the extension's toolbar icon — the **side panel** opens on the right
   and stays open while you browse.

## Extracting a palette

The input area has three tabs:

### Upload
Drag an image onto the dropzone, or click to browse. Supports **PNG, JPEG,
WebP** up to 15 MB. The dominant colors appear as swatches with their %
coverage.

### URL
Paste a direct link to an image (e.g. `https://…/photo.jpg`) and click **Scan**.
The image is fetched in the background so cross-origin images work without CORS
errors.

### Scan Page ⭐
Click **Scan this page** to extract the colors actually used on the current tab
— backgrounds, text, borders, shadows, gradients, and SVG fills. It even catches
colors set by JavaScript at runtime. Each swatch gets a suggested **role** badge
(BG / Text / Primary / Secondary / Accent).

> Role labels are best-effort suggestions, not guarantees. System pages
> (`chrome://…`, the Web Store) can't be scanned.

### Screen pick (optional)
If your browser supports the EyeDropper API, a "Pick a color from screen" button
appears — click it to sample any pixel on screen.

## Working with colors

- **Number of colors:** use the − / + stepper (4–10). Image palettes re-quantize
  instantly.
- **Copy a color:** click a swatch to copy it in your default format. Hover a
  swatch to reveal per-format buttons: **HEX / RGB / HSL / CMYK**. (CMYK is an
  approximation — not for print production.)
- **Set a base color:** double-click a swatch to make it the base for the
  Harmony generator.
- **Default copy format:** change it under the ⚙ Settings menu (persists).

## Tools

Below the palette, three tools:

- **Harmony** — from the base color, generate Monochromatic, Analogous,
  Complementary, or Triadic sets. Click any generated swatch to copy it.
- **Contrast** — pick a Foreground and Background (defaults to the scanned
  text/background) and see the WCAG ratio with Pass/Fail badges for AA, AA
  Large, AAA, AAA Large, plus a live preview.
- **Export** — see below.

## Exporting

**Code**
- **Copy CSS** / **.css** — CSS custom properties (`--color-1`, or semantic
  names like `--color-bg` when roles exist). Set the variable prefix inline.
- **.jpg** — a shareable image of the palette with hex labels.
- **.ase** — Adobe Swatch Exchange, importable into Photoshop/Illustrator and
  other design tools.

**Report**
- **MD** (copy) / **.md** — a Markdown analysis with a color table (all formats
  + coverage + role), harmony suggestions, an accessibility line, and a raw JSON
  block. Great to **paste into an AI** ("analyze this palette / suggest a UI
  theme…") — the JSON block gives it structured data to reason over.
- **.html** — a polished, self-contained HTML report (opens offline, printable)
  for sharing with people who just want to *see* the palette and its details.

## History

Every palette auto-saves locally. Open the 🕘 **History** drawer to reload,
delete individual entries, or **Clear all** (with confirmation). The last 50 are
kept; nothing is ever uploaded.

## Live theming
The panel's accent color re-tints itself to match the dominant color of whatever
you just scanned — while always keeping text legible on the dark background.

## Privacy
The only network activity is: (a) fetching an image URL you paste, and (b)
injecting the scanner into a tab you explicitly choose to scan. No analytics, no
tracking, no data ever leaves your machine.
