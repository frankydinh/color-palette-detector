import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import type { CopyFormat, PaletteColor } from '@/types';
import { formatColor } from '@/lib/convert';
import { relativeLuminance } from '@/lib/contrast';
import { usePaletteStore } from '../store/usePaletteStore';

const FORMATS: CopyFormat[] = ['hex', 'rgb', 'hsl', 'cmyk'];

const ROLE_LABEL: Record<string, string> = {
  background: 'BG',
  text: 'Text',
  primary: 'Primary',
  secondary: 'Secondary',
  accent: 'Accent',
};

interface SwatchProps {
  color: PaletteColor;
  index: number;
  isBase: boolean;
  onSelect: (hex: string) => void;
}

export default function Swatch({ color, index, isBase, onSelect }: SwatchProps) {
  const [copied, setCopied] = useState(false);
  const defaultFormat = usePaletteStore((s) => s.settings.defaultCopyFormat);
  const pushToast = usePaletteStore((s) => s.pushToast);

  const lightText = relativeLuminance(color) < 0.25;
  const fg = lightText ? '#ffffff' : '#0e0f13';

  async function copy(format: CopyFormat) {
    const text = formatColor(color, format);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      pushToast(`Copied ${text}`);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      pushToast('Copy failed', 'error');
    }
  }

  return (
    <div
      className="group relative animate-swatch-in"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <button
        type="button"
        onClick={() => copy(defaultFormat)}
        onDoubleClick={() => onSelect(color.hex)}
        title={`Click to copy ${defaultFormat.toUpperCase()} · double-click to set as base`}
        className={`relative flex h-20 w-full items-end justify-between overflow-hidden rounded-lg border p-2 transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none ${
          isBase ? 'ring-2 ring-accent' : 'border-surface-border'
        }`}
        style={{ backgroundColor: color.hex, color: fg }}
      >
        {color.role && (
          <span
            className="absolute left-1.5 top-1.5 rounded bg-black/25 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide backdrop-blur-sm"
            style={{ color: fg }}
          >
            {ROLE_LABEL[color.role]}
          </span>
        )}
        <span className="font-mono text-xs font-semibold drop-shadow-sm">
          {color.hex}
        </span>
        <span className="opacity-70 transition-opacity group-hover:opacity-100">
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </span>
      </button>

      {/* ratio bar */}
      <div className="mt-1.5 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-overlay">
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(100, color.ratio)}%`,
              backgroundColor: color.hex,
            }}
          />
        </div>
        <span className="w-10 text-right font-mono text-[10px] text-content-muted">
          {color.ratio}%
        </span>
      </div>

      {/* format menu (hover) */}
      <div className="mt-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {FORMATS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => copy(f)}
            title={
              f === 'cmyk'
                ? '≈ approximate (no ICC profile)'
                : `Copy ${f.toUpperCase()}`
            }
            className="flex-1 rounded bg-surface-overlay py-0.5 text-[9px] font-medium uppercase text-content-muted transition-colors hover:bg-surface-border hover:text-content"
          >
            {f}
          </button>
        ))}
      </div>
    </div>
  );
}
