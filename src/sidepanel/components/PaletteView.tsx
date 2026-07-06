import { Minus, Plus } from 'lucide-react';
import { usePaletteStore } from '../store/usePaletteStore';
import Swatch from './Swatch';
import MoodBadge from './MoodBadge';

export default function PaletteView() {
  const colors = usePaletteStore((s) => s.colors);
  const status = usePaletteStore((s) => s.status);
  const source = usePaletteStore((s) => s.source);
  const sourceLabel = usePaletteStore((s) => s.sourceLabel);
  const count = usePaletteStore((s) => s.settings.swatchCount);
  const baseHex = usePaletteStore((s) => s.baseHex);
  const mood = usePaletteStore((s) => s.mood);
  const setSwatchCount = usePaletteStore((s) => s.setSwatchCount);
  const selectBase = usePaletteStore((s) => s.selectBase);

  if (status === 'empty') return null;

  const loading = status === 'loading';

  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">Palette</h2>
          {sourceLabel && (
            <p className="truncate text-xs text-content-muted">
              {source === 'website' ? '🌐 ' : ''}
              {sourceLabel}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-surface-border bg-surface-raised p-0.5">
          <button
            type="button"
            aria-label="Fewer colors"
            disabled={count <= 4 || loading}
            onClick={() => setSwatchCount(count - 1)}
            className="rounded p-1 text-content-muted hover:bg-surface-overlay hover:text-content disabled:opacity-40"
          >
            <Minus size={14} />
          </button>
          <span className="w-6 text-center font-mono text-xs">{count}</span>
          <button
            type="button"
            aria-label="More colors"
            disabled={count >= 10 || loading}
            onClick={() => setSwatchCount(count + 1)}
            className="rounded p-1 text-content-muted hover:bg-surface-overlay hover:text-content disabled:opacity-40"
          >
            <Plus size={14} />
          </button>
        </div>
      </header>

      {source === 'website' && (
        <p className="rounded-md bg-surface-raised px-2.5 py-1.5 text-[11px] text-content-muted">
          Role labels (BG / Text / Primary…) are best-effort suggestions, not
          guarantees.
        </p>
      )}

      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-surface/70 backdrop-blur-sm">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-surface-border border-t-accent" />
          </div>
        )}
        <div className="grid grid-cols-3 gap-2">
          {colors.map((color, i) => (
            <Swatch
              key={`${color.hex}-${i}`}
              color={color}
              index={i}
              isBase={color.hex === baseHex}
              onSelect={selectBase}
            />
          ))}
        </div>
      </div>

      <MoodBadge mood={mood} />
    </section>
  );
}
