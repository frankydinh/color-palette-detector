import { useEffect, useState } from 'react';
import { History, Palette, Settings2 } from 'lucide-react';
import type { CopyFormat } from '@/types';
import { parseColor } from '@/lib/convert';
import { applyTheme, deriveTheme } from '@/lib/theme';
import { usePaletteStore } from './store/usePaletteStore';
import InputZone from './components/InputZone';
import PaletteView from './components/PaletteView';
import HarmonyPanel from './components/HarmonyPanel';
import ContrastChecker from './components/ContrastChecker';
import ExportMenu from './components/ExportMenu';
import HistoryDrawer from './components/HistoryDrawer';

type Tool = 'harmony' | 'contrast' | 'export';
const TOOLS: { id: Tool; label: string }[] = [
  { id: 'harmony', label: 'Harmony' },
  { id: 'contrast', label: 'Contrast' },
  { id: 'export', label: 'Export' },
];

const COPY_FORMATS: CopyFormat[] = ['hex', 'rgb', 'hsl', 'cmyk'];

function Toasts() {
  const toasts = usePaletteStore((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-50 flex flex-col items-center gap-1.5 px-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-toast-in rounded-lg px-3 py-1.5 text-xs font-medium shadow-lg ${
            t.tone === 'error'
              ? 'bg-red-500 text-white'
              : 'bg-surface-overlay text-content ring-1 ring-surface-border'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const init = usePaletteStore((s) => s.init);
  const status = usePaletteStore((s) => s.status);
  const colors = usePaletteStore((s) => s.colors);
  const settings = usePaletteStore((s) => s.settings);
  const updateSettings = usePaletteStore((s) => s.updateSettings);

  const [tool, setTool] = useState<Tool>('harmony');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    void init();
  }, [init]);

  // Live theming — tint the panel accent with the dominant color.
  const dominantHex = colors[0]?.hex;
  useEffect(() => {
    const dominant = dominantHex ? parseColor(dominantHex) : undefined;
    applyTheme(deriveTheme(dominant ?? undefined), document.documentElement);
  }, [dominantHex]);

  return (
    <div className="min-h-screen w-full">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-surface-border bg-surface/90 px-3 py-2.5 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-fg">
            <Palette size={16} />
          </div>
          <h1 className="text-sm font-semibold">Color Palette Detector</h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Settings"
            onClick={() => setSettingsOpen((v) => !v)}
            className="rounded-md p-1.5 text-content-muted hover:bg-surface-overlay hover:text-content"
          >
            <Settings2 size={16} />
          </button>
          <button
            type="button"
            aria-label="History"
            onClick={() => setHistoryOpen(true)}
            className="rounded-md p-1.5 text-content-muted hover:bg-surface-overlay hover:text-content"
          >
            <History size={16} />
          </button>
        </div>
      </header>

      {settingsOpen && (
        <div className="border-b border-surface-border bg-surface-raised px-3 py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-content-muted">
              Default copy format
            </span>
            <div className="flex gap-1">
              {COPY_FORMATS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => void updateSettings({ defaultCopyFormat: f })}
                  className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase transition-colors ${
                    settings.defaultCopyFormat === f
                      ? 'bg-accent text-accent-fg'
                      : 'bg-surface-overlay text-content-muted hover:text-content'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="space-y-4 p-3">
        <InputZone />

        {status === 'empty' ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-surface-border py-10 text-center">
            <Palette size={26} className="text-content-faint" />
            <p className="text-sm text-content-muted">No palette yet</p>
            <p className="max-w-[220px] text-xs text-content-faint">
              Upload an image, paste an image URL, or scan the current page to
              extract colors.
            </p>
          </div>
        ) : (
          <>
            <PaletteView />

            {colors.length > 0 && (
              <section className="space-y-3 rounded-xl border border-surface-border bg-surface-raised/50 p-3">
                <div className="flex gap-1 rounded-lg bg-surface-raised p-1">
                  {TOOLS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTool(t.id)}
                      className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                        tool === t.id
                          ? 'bg-accent text-accent-fg'
                          : 'text-content-muted hover:bg-surface-overlay hover:text-content'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                {tool === 'harmony' && <HarmonyPanel />}
                {tool === 'contrast' && <ContrastChecker />}
                {tool === 'export' && <ExportMenu />}
              </section>
            )}
          </>
        )}
      </main>

      {historyOpen && <HistoryDrawer onClose={() => setHistoryOpen(false)} />}
      <Toasts />
    </div>
  );
}
