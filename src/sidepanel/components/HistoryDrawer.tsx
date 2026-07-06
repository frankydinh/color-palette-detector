import { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import type { PaletteEntry } from '@/types';
import { usePaletteStore } from '../store/usePaletteStore';

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const SOURCE_ICON: Record<string, string> = {
  upload: '📤',
  'image-url': '🔗',
  website: '🌐',
  eyedropper: '🎯',
};

function Row({ entry, onClose }: { entry: PaletteEntry; onClose: () => void }) {
  const loadEntry = usePaletteStore((s) => s.loadEntry);
  const removeEntry = usePaletteStore((s) => s.removeEntry);
  return (
    <div className="group flex items-center gap-2 rounded-lg border border-surface-border bg-surface-raised p-2">
      <button
        type="button"
        onClick={() => {
          loadEntry(entry);
          onClose();
        }}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <div className="flex h-8 overflow-hidden rounded">
          {entry.colors.slice(0, 6).map((c, i) => (
            <div key={i} className="w-3" style={{ backgroundColor: c.hex }} />
          ))}
        </div>
        <div className="min-w-0">
          <div className="truncate text-xs font-medium">
            {SOURCE_ICON[entry.source] ?? '🎨'}{' '}
            {entry.sourceLabel || entry.source}
          </div>
          <div className="text-[10px] text-content-faint">
            {timeAgo(entry.createdAt)}
          </div>
        </div>
      </button>
      <button
        type="button"
        aria-label="Delete entry"
        onClick={() => void removeEntry(entry.id)}
        className="rounded p-1 text-content-faint opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export default function HistoryDrawer({ onClose }: { onClose: () => void }) {
  const history = usePaletteStore((s) => s.history);
  const clearAllHistory = usePaletteStore((s) => s.clearAllHistory);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="fixed inset-0 z-40 flex animate-fade-in">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <div className="flex w-[300px] max-w-[85%] flex-col border-l border-surface-border bg-surface shadow-2xl">
        <header className="flex items-center justify-between border-b border-surface-border p-3">
          <h2 className="text-sm font-semibold">History</h2>
          <button
            type="button"
            aria-label="Close history"
            onClick={onClose}
            className="rounded p-1 text-content-muted hover:bg-surface-overlay hover:text-content"
          >
            <X size={16} />
          </button>
        </header>

        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {history.length === 0 ? (
            <p className="pt-8 text-center text-xs text-content-faint">
              No palettes saved yet.
            </p>
          ) : (
            history.map((entry) => (
              <Row key={entry.id} entry={entry} onClose={onClose} />
            ))
          )}
        </div>

        {history.length > 0 && (
          <footer className="border-t border-surface-border p-3">
            {confirming ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void clearAllHistory();
                    setConfirming(false);
                  }}
                  className="flex-1 rounded-lg bg-red-500/90 py-2 text-xs font-medium text-white hover:bg-red-500"
                >
                  Confirm clear
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="flex-1 rounded-lg border border-surface-border py-2 text-xs font-medium hover:bg-surface-overlay"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-surface-border py-2 text-xs font-medium text-content-muted hover:bg-surface-overlay hover:text-content"
              >
                <Trash2 size={14} /> Clear all
              </button>
            )}
          </footer>
        )}
      </div>
    </div>
  );
}
