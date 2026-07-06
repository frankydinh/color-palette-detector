import { useEffect, useMemo, useState } from 'react';
import { checkContrast } from '@/lib/contrast';
import { parseColor } from '@/lib/convert';
import { usePaletteStore } from '../store/usePaletteStore';

function Badge({ label, pass }: { label: string; pass: boolean }) {
  return (
    <div
      className={`flex items-center justify-between rounded-md px-2 py-1 text-[11px] font-medium ${
        pass
          ? 'bg-emerald-500/15 text-emerald-400'
          : 'bg-red-500/15 text-red-400'
      }`}
    >
      <span>{label}</span>
      <span>{pass ? 'Pass' : 'Fail'}</span>
    </div>
  );
}

export default function ContrastChecker() {
  const colors = usePaletteStore((s) => s.colors);

  // Defaults: text/background roles if available, else first two colors.
  const defaults = useMemo(() => {
    const text = colors.find((c) => c.role === 'text');
    const bg = colors.find((c) => c.role === 'background');
    return {
      fg: text?.hex ?? colors[0]?.hex ?? '#111111',
      bg: bg?.hex ?? colors[1]?.hex ?? colors[0]?.hex ?? '#ffffff',
    };
  }, [colors]);

  const [fg, setFg] = useState(defaults.fg);
  const [bg, setBg] = useState(defaults.bg);

  // Re-seed when a new palette loads.
  useEffect(() => {
    setFg(defaults.fg);
    setBg(defaults.bg);
  }, [defaults]);

  const result = useMemo(() => {
    const fgColor = parseColor(fg);
    const bgColor = parseColor(bg);
    if (!fgColor || !bgColor) return null;
    return checkContrast(fgColor, bgColor);
  }, [fg, bg]);

  return (
    <div className="space-y-3">
      <div
        className="flex h-20 items-center justify-center rounded-lg border border-surface-border"
        style={{ backgroundColor: bg, color: fg }}
      >
        <span className="text-lg font-semibold">Aa The quick brown fox</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {(
          [
            ['Foreground', fg, setFg],
            ['Background', bg, setBg],
          ] as const
        ).map(([label, value, setter]) => (
          <label
            key={label}
            className="flex items-center gap-2 rounded-lg border border-surface-border bg-surface-raised px-2 py-1.5"
          >
            <input
              type="color"
              value={value}
              onChange={(e) => setter(e.target.value.toUpperCase())}
              className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent p-0"
            />
            <div className="min-w-0">
              <div className="text-[10px] text-content-faint">{label}</div>
              <div className="truncate font-mono text-xs">{value}</div>
            </div>
          </label>
        ))}
      </div>

      {colors.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {colors.map((c, i) => (
            <button
              key={`${c.hex}-${i}`}
              type="button"
              onClick={() => (i % 2 === 0 ? setFg(c.hex) : setBg(c.hex))}
              title={`Assign ${c.hex}`}
              style={{ backgroundColor: c.hex }}
              className="h-5 w-5 rounded border border-surface-border"
            />
          ))}
        </div>
      )}

      {result && (
        <>
          <div className="text-center">
            <span className="font-mono text-2xl font-bold">
              {result.ratio.toFixed(2)}
            </span>
            <span className="text-sm text-content-muted">:1</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <Badge label="AA" pass={result.aa} />
            <Badge label="AA Large" pass={result.aaLarge} />
            <Badge label="AAA" pass={result.aaa} />
            <Badge label="AAA Large" pass={result.aaaLarge} />
          </div>
        </>
      )}
    </div>
  );
}
