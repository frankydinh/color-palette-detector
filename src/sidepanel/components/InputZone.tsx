import { useRef, useState } from 'react';
import { Globe, Link2, Pipette, ScanLine, Upload } from 'lucide-react';
import type { Msg } from '@/types';
import { fromRgb255, parseColor } from '@/lib/convert';
import { usePaletteStore } from '../store/usePaletteStore';

type Tab = 'upload' | 'url' | 'scan';

const MAX_SIZE = 15 * 1024 * 1024; // 15MB
const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp'];

const TABS: { id: Tab; label: string; icon: typeof Upload }[] = [
  { id: 'upload', label: 'Upload', icon: Upload },
  { id: 'url', label: 'URL', icon: Link2 },
  { id: 'scan', label: 'Scan Page', icon: ScanLine },
];

const hasEyeDropper = typeof (window as unknown as { EyeDropper?: unknown })
  .EyeDropper === 'function';

export default function InputZone() {
  const [tab, setTab] = useState<Tab>('upload');
  const [dragging, setDragging] = useState(false);
  const [url, setUrl] = useState('');
  const [urlBusy, setUrlBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const processImage = usePaletteStore((s) => s.processImage);
  const scanPage = usePaletteStore((s) => s.scanPage);
  const pushToast = usePaletteStore((s) => s.pushToast);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      pushToast('Unsupported format (use PNG, JPEG, or WebP)', 'error');
      return;
    }
    if (file.size > MAX_SIZE) {
      pushToast('File too large (max 15MB)', 'error');
      return;
    }
    const buffer = await file.arrayBuffer();
    await processImage(buffer, 'upload', file.name);
  }

  async function handleUrl() {
    const value = url.trim();
    if (!value) return;
    setUrlBusy(true);
    try {
      const res = (await chrome.runtime.sendMessage({
        type: 'FETCH_IMAGE',
        url: value,
      } satisfies Msg)) as Msg;
      if (res.type === 'FETCH_IMAGE_RESULT' && res.ok && res.buffer) {
        let label = value;
        try {
          label = new URL(value).hostname;
        } catch {
          /* keep raw */
        }
        await processImage(res.buffer, 'image-url', label);
      } else {
        const error =
          (res.type === 'FETCH_IMAGE_RESULT' && res.error) ||
          'Could not load image from this URL';
        pushToast(error, 'error');
      }
    } finally {
      setUrlBusy(false);
    }
  }

  async function handleEyeDropper() {
    try {
      const ED = (window as unknown as { EyeDropper: new () => {
        open: () => Promise<{ sRGBHex: string }>;
      } }).EyeDropper;
      const result = await new ED().open();
      const color = parseColor(result.sRGBHex);
      if (!color) return;
      // Build a one-color palette entry via the store's normal path is
      // image-only; instead set it directly through a tiny synthetic flow.
      const rgb = fromRgb255(color.rgb.r, color.rgb.g, color.rgb.b);
      usePaletteStore.setState({
        colors: [{ ...rgb, ratio: 100, role: undefined }],
        source: 'eyedropper',
        sourceLabel: 'Screen pick',
        status: 'ready',
        thumbnail: '',
        lastBuffer: null,
        baseHex: rgb.hex,
        mood: [],
      });
      pushToast(`Picked ${rgb.hex}`);
    } catch {
      /* user cancelled — ignore */
    }
  }

  return (
    <section className="space-y-2">
      <div className="flex gap-1 rounded-lg border border-surface-border bg-surface-raised p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors ${
              tab === id
                ? 'bg-accent text-accent-fg'
                : 'text-content-muted hover:bg-surface-overlay hover:text-content'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'upload' && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void handleFile(e.dataTransfer.files[0]);
          }}
          onClick={() => fileRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 text-center transition-all ${
            dragging
              ? 'animate-pulse-glow border-accent bg-accent-soft'
              : 'border-surface-border hover:border-content-faint'
          }`}
        >
          <Upload size={22} className="text-content-muted" />
          <p className="text-sm text-content">
            Drop an image or <span className="text-accent">browse</span>
          </p>
          <p className="text-[11px] text-content-faint">PNG · JPEG · WebP</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
        </div>
      )}

      {tab === 'url' && (
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void handleUrl()}
            placeholder="https://example.com/image.jpg"
            className="min-w-0 flex-1 rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-sm outline-none placeholder:text-content-faint focus:border-accent"
          />
          <button
            type="button"
            onClick={() => void handleUrl()}
            disabled={urlBusy || !url.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Link2 size={14} />
            Scan
          </button>
        </div>
      )}

      {tab === 'scan' && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => void scanPage()}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-semibold text-accent-fg transition-opacity hover:opacity-90"
          >
            <Globe size={16} />
            Scan this page
          </button>
          <p className="text-center text-[11px] text-content-faint">
            Reads the active tab's rendered colors — including ones set by JS.
          </p>
        </div>
      )}

      {hasEyeDropper && (
        <button
          type="button"
          onClick={() => void handleEyeDropper()}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-surface-border py-1.5 text-xs text-content-muted transition-colors hover:border-content-faint hover:text-content"
        >
          <Pipette size={13} />
          Pick a color from screen
        </button>
      )}
    </section>
  );
}
