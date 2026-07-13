import type { Color, HarmonyType, PaletteColor } from '@/types';
import { formatColor } from './convert';
import { relativeLuminance, checkContrast } from './contrast';
import { generateHarmony, HARMONY_LABELS } from './harmony';
import { describeSource, type ReportMeta } from './export-md';

const HARMONY_ORDER: HarmonyType[] = [
  'monochromatic',
  'analogous',
  'complementary',
  'triadic',
];

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (ch) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[ch] as string,
  );
}

/** Readable text color for a given swatch background. */
function readableOn(color: Color): string {
  return relativeLuminance(color) < 0.35 ? '#ffffff' : '#111111';
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Build a complete, self-contained HTML report (inline CSS, no external
 * resources) so it can be opened offline and shared or printed.
 */
export function generateHtmlReport(
  colors: PaletteColor[],
  meta: ReportMeta,
): string {
  const title = escapeHtml(meta.sourceLabel.trim() || 'Untitled');
  const source = escapeHtml(describeSource(meta));
  const date = today();

  const moodPills = meta.mood
    .map((m) => `<span class="pill">${escapeHtml(m)}</span>`)
    .join('');

  const swatches = colors
    .map((c) => {
      const fg = readableOn(c);
      const role = c.role
        ? `<span class="role" style="color:${fg}">${c.role}</span>`
        : '';
      return `<div class="swatch" style="background:${c.hex};color:${fg}">
        ${role}
        <div class="swatch-meta">
          <span class="hex">${c.hex}</span>
          <span class="pct">${c.ratio}%</span>
        </div>
      </div>`;
    })
    .join('');

  const rows = colors
    .map(
      (c) => `<tr>
      <td><span class="chip" style="background:${c.hex}"></span><code>${c.hex}</code></td>
      <td><code>${formatColor(c, 'rgb')}</code></td>
      <td><code>${formatColor(c, 'hsl')}</code></td>
      <td><code>${formatColor(c, 'cmyk')}</code></td>
      <td>${c.ratio}%</td>
      <td>${c.role ?? '—'}</td>
    </tr>`,
    )
    .join('');

  let harmonyHtml = '';
  if (colors.length > 0) {
    const base = colors[0]!;
    const blocks = HARMONY_ORDER.map((type) => {
      const chips = generateHarmony(base, type)
        .map((c) => {
          const fg = readableOn(c);
          return `<span class="mini" style="background:${c.hex};color:${fg}">${c.hex}</span>`;
        })
        .join('');
      return `<div class="harmony-row">
        <span class="harmony-label">${HARMONY_LABELS[type]}</span>
        <div class="chips">${chips}</div>
      </div>`;
    }).join('');
    harmonyHtml = `<section>
      <h2>Harmony <small>base ${base.hex}</small></h2>
      ${blocks}
    </section>`;
  }

  let a11yHtml = '';
  const text = colors.find((c) => c.role === 'text');
  const bg = colors.find((c) => c.role === 'background');
  if (text && bg) {
    const r = checkContrast(text, bg);
    a11yHtml = `<section>
      <h2>Accessibility</h2>
      <p class="a11y">
        Text <code>${text.hex}</code> on background <code>${bg.hex}</code>:
        <strong>${r.ratio}:1</strong>
        <span class="badge ${r.aa ? 'pass' : 'fail'}">AA ${r.aa ? 'Pass' : 'Fail'}</span>
        <span class="badge ${r.aaa ? 'pass' : 'fail'}">AAA ${r.aaa ? 'Pass' : 'Fail'}</span>
      </p>
    </section>`;
  }

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Color palette — ${title}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 32px 20px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: #f6f7f9; color: #1a1d24; line-height: 1.5;
  }
  .wrap { max-width: 880px; margin: 0 auto; }
  header { margin-bottom: 28px; }
  h1 { font-size: 26px; margin: 0 0 10px; }
  .meta { color: #5b6472; font-size: 14px; }
  .meta b { color: #1a1d24; font-weight: 600; }
  .pills { margin-top: 10px; display: flex; flex-wrap: wrap; gap: 6px; }
  .pill { background: #e9ecf1; border-radius: 999px; padding: 3px 10px; font-size: 12px; font-weight: 600; }
  section { background: #fff; border: 1px solid #e4e7ec; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
  h2 { font-size: 15px; text-transform: uppercase; letter-spacing: .04em; color: #5b6472; margin: 0 0 14px; }
  h2 small { text-transform: none; letter-spacing: 0; font-weight: 400; color: #98a0ad; margin-left: 6px; font-family: ui-monospace, Menlo, monospace; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px; }
  .swatch { position: relative; aspect-ratio: 4/3; border-radius: 10px; padding: 10px; display: flex; align-items: flex-end; border: 1px solid rgba(0,0,0,.08); }
  .swatch-meta { display: flex; justify-content: space-between; width: 100%; font-family: ui-monospace, Menlo, monospace; font-size: 12px; font-weight: 600; }
  .role { position: absolute; top: 8px; left: 8px; font-size: 10px; text-transform: uppercase; letter-spacing: .05em; opacity: .85; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #eef1f4; }
  th { color: #98a0ad; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; }
  code { font-family: ui-monospace, Menlo, monospace; font-size: 12px; }
  .chip { display: inline-block; width: 12px; height: 12px; border-radius: 3px; margin-right: 7px; vertical-align: -1px; border: 1px solid rgba(0,0,0,.12); }
  .harmony-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
  .harmony-label { width: 130px; flex: none; font-size: 13px; color: #5b6472; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .mini { font-family: ui-monospace, Menlo, monospace; font-size: 11px; font-weight: 600; padding: 5px 8px; border-radius: 6px; border: 1px solid rgba(0,0,0,.08); }
  .a11y { font-size: 14px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; margin-left: 6px; }
  .badge.pass { background: #e3f6ea; color: #1a7f4b; }
  .badge.fail { background: #fde8e8; color: #c0392b; }
  footer { text-align: center; color: #98a0ad; font-size: 12px; margin-top: 8px; }
  @media print { body { background: #fff; } section { break-inside: avoid; } }
</style>
</head>
<body>
  <div class="wrap">
    <header>
      <h1>Color palette — ${title}</h1>
      <div class="meta">
        <b>Source:</b> ${source} &nbsp;·&nbsp; <b>Generated:</b> ${date} &nbsp;·&nbsp; <b>Colors:</b> ${colors.length}
      </div>
      ${moodPills ? `<div class="pills">${moodPills}</div>` : ''}
    </header>

    <section>
      <h2>Palette</h2>
      <div class="grid">${swatches}</div>
    </section>

    <section>
      <h2>Details</h2>
      <table>
        <thead><tr><th>HEX</th><th>RGB</th><th>HSL</th><th>CMYK</th><th>Coverage</th><th>Role</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </section>

    ${harmonyHtml}
    ${a11yHtml}

    <footer>Generated by Color Palette Detector · ${date}</footer>
  </div>
</body>
</html>`;
}
