# Color Palette Detector — project context for Claude Code

Chrome extension (**Manifest V3**) that extracts, analyzes, and exports color
palettes from images or any website. **100% client-side, zero backend, zero
telemetry.** Dev-mode / portfolio piece — polish and clean code over feature
breadth.

## Golden rules (do not violate)
- **`npm run build` must pass** (`tsc --noEmit && vite build`) and **`npm run
  lint` must be clean** before any task is "done".
- **TypeScript strict.** No `any` without an inline comment justifying it.
- **No heavy UI component libraries** — build with Tailwind. Allowed deps:
  culori (color math), zustand (state), lucide-react (icons).
- **No backend, no telemetry, no network** except (a) service worker fetching an
  image URL the user pasted, and (b) injecting the scanner into a tab the user
  chose to scan.
- **Keep color logic out of UI** — all math lives in `src/lib/`; components stay
  thin. Colors are normalized to the `Color` type at the point of entry.
- **No pixel work on the main thread** — heavy processing goes to the Web Worker.
- Respect `prefers-reduced-motion`; extension UI targets **WCAG AA**.

## Architecture (contexts)
- `src/background/service-worker.ts` — opens side panel, fetches cross-origin
  image URLs → `ArrayBuffer` (no DOM/canvas here — MV3 SW has neither).
- `src/content/scanner.ts` — `collectPageColors()` injected on-demand via
  `chrome.scripting.executeScript({ func })`. **Must stay fully self-contained**
  (all helpers nested, no runtime imports) so it serializes into the page.
- `src/sidepanel/**` — React UI + Zustand store (`store/usePaletteStore.ts`).
- `src/workers/palette.worker.ts` — `createImageBitmap` → `OffscreenCanvas` →
  median cut, off the main thread.
- `src/lib/**` — pure logic: `quantize` (median cut + ΔE merge), `contrast`
  (WCAG), `harmony`, `convert`, `export-{css,ase,image}`, `mood`, `theme`,
  `scan`, `storage`.
- `src/types/index.ts` — shared types + the cross-context message unions
  (`Msg`, `WorkerRequest/Response`). Changing these is cross-cutting — leader work.

## Build / run
```bash
npm install
npm run build     # → dist/ ; load unpacked in chrome://extensions
npm run lint
```

## Collaboration (Mac leader + Ubuntu worker)
See [docs/collab-ubuntu.md](docs/collab-ubuntu.md). Mac dispatches file-isolated
tasks to the Ubuntu worker via `scripts/ubuntu-dispatch.sh`; the worker edits
files only and returns a branch; the leader reviews `git diff` before merging.
Do **not** have both machines edit the same files at once.
