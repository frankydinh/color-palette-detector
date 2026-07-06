import { useMemo, useState } from 'react';
import type { HarmonyType } from '@/types';
import { generateHarmony, HARMONY_LABELS } from '@/lib/harmony';
import { parseColor } from '@/lib/convert';
import { relativeLuminance } from '@/lib/contrast';
import { usePaletteStore } from '../store/usePaletteStore';

const TYPES: HarmonyType[] = [
  'monochromatic',
  'analogous',
  'complementary',
  'triadic',
];

export default function HarmonyPanel() {
  const [type, setType] = useState<HarmonyType>('analogous');
  const baseHex = usePaletteStore((s) => s.baseHex);
  const pushToast = usePaletteStore((s) => s.pushToast);

  const base = useMemo(
    () => (baseHex ? parseColor(baseHex) : null),
    [baseHex],
  );
  const harmony = useMemo(
    () => (base ? generateHarmony(base, type) : []),
    [base, type],
  );

  if (!base) {
    return (
      <p className="text-xs text-content-muted">
        Double-click a swatch to pick a base color.
      </p>
    );
  }

  async function copy(hex: string) {
    try {
      await navigator.clipboard.writeText(hex);
      pushToast(`Copied ${hex}`);
    } catch {
      pushToast('Copy failed', 'error');
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        {TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
              type === t
                ? 'bg-accent text-accent-fg'
                : 'bg-surface-overlay text-content-muted hover:text-content'
            }`}
          >
            {HARMONY_LABELS[t]}
          </button>
        ))}
      </div>

      <div key={type} className="flex gap-1.5 animate-fade-in">
        {harmony.map((c, i) => {
          const fg = relativeLuminance(c) < 0.25 ? '#ffffff' : '#0e0f13';
          return (
            <button
              key={`${c.hex}-${i}`}
              type="button"
              onClick={() => copy(c.hex)}
              title={`Copy ${c.hex}`}
              style={{ backgroundColor: c.hex, color: fg }}
              className="flex h-16 flex-1 items-end justify-center rounded-lg pb-1.5 text-[9px] font-mono font-semibold transition-transform hover:-translate-y-0.5"
            >
              {c.hex}
            </button>
          );
        })}
      </div>
    </div>
  );
}
