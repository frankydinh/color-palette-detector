import { create } from 'zustand';
import {
  type PaletteColor,
  type PaletteEntry,
  type PaletteSource,
  type ScanRaw,
  type Settings,
  DEFAULT_SETTINGS,
} from '@/types';
import { quantizeImage } from '@/lib/palette-client';
import { processScan } from '@/lib/scan';
import { labelMood } from '@/lib/mood';
import { collectPageColors } from '@/content/scanner';
import {
  addHistoryEntry,
  clearHistory,
  deleteHistoryEntry,
  getHistory,
  getSettings,
  saveSettings,
} from '@/lib/storage';

export type Status = 'empty' | 'loading' | 'ready' | 'error';

interface Toast {
  id: number;
  message: string;
  tone: 'info' | 'error';
}

interface PaletteState {
  status: Status;
  error: string | null;
  colors: PaletteColor[];
  source: PaletteSource | null;
  sourceLabel: string;
  thumbnail: string;
  mood: string[];
  /** Original image bytes, kept so we can re-quantize on count change. */
  lastBuffer: ArrayBuffer | null;
  baseHex: string | null; // selected base color for the harmony generator
  settings: Settings;
  history: PaletteEntry[];
  toasts: Toast[];

  init: () => Promise<void>;
  processImage: (
    buffer: ArrayBuffer,
    source: PaletteSource,
    label: string,
  ) => Promise<void>;
  scanPage: () => Promise<void>;
  setSwatchCount: (n: number) => Promise<void>;
  selectBase: (hex: string) => void;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  loadEntry: (entry: PaletteEntry) => void;
  removeEntry: (id: string) => Promise<void>;
  clearAllHistory: () => Promise<void>;
  pushToast: (message: string, tone?: 'info' | 'error') => void;
  dismissToast: (id: number) => void;
}

let toastSeq = 0;

export const usePaletteStore = create<PaletteState>((set, get) => ({
  status: 'empty',
  error: null,
  colors: [],
  source: null,
  sourceLabel: '',
  thumbnail: '',
  mood: [],
  lastBuffer: null,
  baseHex: null,
  settings: DEFAULT_SETTINGS,
  history: [],
  toasts: [],

  init: async () => {
    const [settings, history] = await Promise.all([
      getSettings(),
      getHistory(),
    ]);
    set({ settings, history });
  },

  processImage: async (buffer, source, label) => {
    set({ status: 'loading', error: null, source, sourceLabel: label });
    try {
      const count = get().settings.swatchCount;
      // Clone so we retain the original for later re-quantization.
      const kept = buffer.slice(0);
      const { colors, thumbnail } = await quantizeImage(buffer, count);
      await finalize(set, {
        colors,
        thumbnail,
        source,
        label,
        buffer: kept,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to process image';
      set({ status: 'error', error: message });
      get().pushToast(message, 'error');
    }
  },

  scanPage: async () => {
    set({ status: 'loading', error: null });
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab?.id || !tab.url) throw new Error('No active tab to scan');
      if (/^(chrome|edge|about|chrome-extension|https:\/\/chrome\.google\.com\/webstore)/.test(
          tab.url,
        )) {
        throw new Error("This page can't be scanned (browser system page)");
      }
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: collectPageColors,
      });
      const raw = results[0]?.result as ScanRaw | undefined;
      if (!raw || raw.colors.length === 0) {
        throw new Error('No colors found on this page');
      }
      const count = get().settings.swatchCount;
      const colors = processScan(raw, Math.max(count, 8));
      await finalize(set, {
        colors,
        thumbnail: '',
        source: 'website',
        label: raw.pageLabel,
        buffer: null,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Scan failed';
      set({ status: 'error', error: message });
      get().pushToast(message, 'error');
    }
  },

  setSwatchCount: async (n) => {
    const count = Math.min(10, Math.max(4, n));
    const { lastBuffer, source } = get();
    await get().updateSettings({ swatchCount: count });
    // Re-quantize image sources with the new count (no re-save to history).
    if (lastBuffer && source && source !== 'website') {
      set({ status: 'loading' });
      try {
        const { colors, thumbnail } = await quantizeImage(
          lastBuffer.slice(0),
          count,
        );
        set({
          colors,
          thumbnail: thumbnail || get().thumbnail,
          status: 'ready',
          mood: labelMood(colors),
          baseHex: colors[0]?.hex ?? null,
        });
      } catch {
        set({ status: 'ready' });
      }
    }
  },

  selectBase: (hex) => set({ baseHex: hex }),

  updateSettings: async (patch) => {
    const next = { ...get().settings, ...patch };
    set({ settings: next });
    await saveSettings(next);
  },

  loadEntry: (entry) => {
    set({
      colors: entry.colors,
      source: entry.source,
      sourceLabel: entry.sourceLabel ?? '',
      thumbnail: entry.thumbnail ?? '',
      mood: entry.mood ?? [],
      status: 'ready',
      lastBuffer: null,
      baseHex: entry.colors[0]?.hex ?? null,
      error: null,
    });
  },

  removeEntry: async (id) => {
    const history = await deleteHistoryEntry(id);
    set({ history });
  },

  clearAllHistory: async () => {
    await clearHistory();
    set({ history: [] });
  },

  pushToast: (message, tone = 'info') => {
    const id = ++toastSeq;
    set({ toasts: [...get().toasts, { id, message, tone }] });
    setTimeout(() => get().dismissToast(id), 2600);
  },

  dismissToast: (id) =>
    set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

// Shared finalize path: sets palette state, computes mood, auto-saves history.
async function finalize(
  set: (partial: Partial<PaletteState>) => void,
  args: {
    colors: PaletteColor[];
    thumbnail: string;
    source: PaletteSource;
    label: string;
    buffer: ArrayBuffer | null;
  },
): Promise<void> {
  const mood = labelMood(args.colors);
  set({
    colors: args.colors,
    thumbnail: args.thumbnail,
    source: args.source,
    sourceLabel: args.label,
    mood,
    status: 'ready',
    lastBuffer: args.buffer,
    baseHex: args.colors[0]?.hex ?? null,
    error: null,
  });

  const entry: PaletteEntry = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    source: args.source,
    sourceLabel: args.label,
    colors: args.colors,
    thumbnail: args.thumbnail || undefined,
    mood,
  };
  const history = await addHistoryEntry(entry);
  set({ history });
}
