import {
  Clipboard,
  FileCode,
  FileImage,
  FileText,
  Globe,
  Package,
} from 'lucide-react';
import { generateCss } from '@/lib/export-css';
import { generateAse } from '@/lib/export-ase';
import { downloadBlob, exportPaletteImage } from '@/lib/export-image';
import { generateMarkdown, type ReportMeta } from '@/lib/export-md';
import { generateHtmlReport } from '@/lib/export-html';
import { usePaletteStore } from '../store/usePaletteStore';

function slug(label: string): string {
  return (label || 'palette')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'palette';
}

export default function ExportMenu() {
  const colors = usePaletteStore((s) => s.colors);
  const prefix = usePaletteStore((s) => s.settings.cssPrefix);
  const label = usePaletteStore((s) => s.sourceLabel);
  const source = usePaletteStore((s) => s.source);
  const mood = usePaletteStore((s) => s.mood);
  const updateSettings = usePaletteStore((s) => s.updateSettings);
  const pushToast = usePaletteStore((s) => s.pushToast);

  const name = slug(label);
  const meta: ReportMeta = { source, sourceLabel: label, mood };

  async function copyMarkdown() {
    try {
      await navigator.clipboard.writeText(generateMarkdown(colors, meta));
      pushToast('Markdown copied');
    } catch {
      pushToast('Copy failed', 'error');
    }
  }

  function downloadMarkdown() {
    const blob = new Blob([generateMarkdown(colors, meta)], {
      type: 'text/markdown',
    });
    downloadBlob(blob, `${name}.md`);
    pushToast('Markdown downloaded');
  }

  function downloadHtml() {
    const blob = new Blob([generateHtmlReport(colors, meta)], {
      type: 'text/html',
    });
    downloadBlob(blob, `${name}.html`);
    pushToast('HTML report downloaded');
  }

  async function copyCss() {
    try {
      await navigator.clipboard.writeText(generateCss(colors, prefix));
      pushToast('CSS variables copied');
    } catch {
      pushToast('Copy failed', 'error');
    }
  }

  function downloadCss() {
    const blob = new Blob([generateCss(colors, prefix)], { type: 'text/css' });
    downloadBlob(blob, `${name}.css`);
    pushToast('CSS downloaded');
  }

  async function downloadImage() {
    try {
      const blob = await exportPaletteImage(colors);
      downloadBlob(blob, `${name}.jpg`);
      pushToast('Image downloaded');
    } catch {
      pushToast('Image export failed', 'error');
    }
  }

  function downloadAse() {
    const buffer = generateAse(colors);
    downloadBlob(new Blob([buffer], { type: 'application/octet-stream' }), `${name}.ase`);
    pushToast('ASE downloaded');
  }

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-xs text-content-muted">
        <span className="whitespace-nowrap">CSS prefix</span>
        <input
          value={prefix}
          onChange={(e) => void updateSettings({ cssPrefix: e.target.value })}
          className="flex-1 rounded-md border border-surface-border bg-surface-raised px-2 py-1 font-mono text-xs outline-none focus:border-accent"
        />
      </label>

      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-content-faint">
          Code
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => void copyCss()}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-surface-border bg-surface-raised py-2 text-xs font-medium transition-colors hover:bg-surface-overlay"
          >
            <Clipboard size={14} /> Copy CSS
          </button>
          <button
            type="button"
            onClick={downloadCss}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-surface-border bg-surface-raised py-2 text-xs font-medium transition-colors hover:bg-surface-overlay"
          >
            <FileCode size={14} /> .css
          </button>
          <button
            type="button"
            onClick={() => void downloadImage()}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-surface-border bg-surface-raised py-2 text-xs font-medium transition-colors hover:bg-surface-overlay"
          >
            <FileImage size={14} /> .jpg
          </button>
          <button
            type="button"
            onClick={downloadAse}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-surface-border bg-surface-raised py-2 text-xs font-medium transition-colors hover:bg-surface-overlay"
          >
            <Package size={14} /> .ase
          </button>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-content-faint">
          Report
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => void copyMarkdown()}
            title="Copy a Markdown analysis (great as AI input)"
            className="flex items-center justify-center gap-1.5 rounded-lg border border-surface-border bg-surface-raised py-2 text-xs font-medium transition-colors hover:bg-surface-overlay"
          >
            <Clipboard size={14} /> MD
          </button>
          <button
            type="button"
            onClick={downloadMarkdown}
            title="Download Markdown report"
            className="flex items-center justify-center gap-1.5 rounded-lg border border-surface-border bg-surface-raised py-2 text-xs font-medium transition-colors hover:bg-surface-overlay"
          >
            <FileText size={14} /> .md
          </button>
          <button
            type="button"
            onClick={downloadHtml}
            title="Download a self-contained HTML report"
            className="flex items-center justify-center gap-1.5 rounded-lg border border-surface-border bg-surface-raised py-2 text-xs font-medium transition-colors hover:bg-surface-overlay"
          >
            <Globe size={14} /> .html
          </button>
        </div>
      </div>
    </div>
  );
}
