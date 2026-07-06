import {
  DEFAULT_SETTINGS,
  type PaletteEntry,
  type Settings,
} from '@/types';

const HISTORY_KEY = 'palette_history';
const SETTINGS_KEY = 'settings';
const MAX_HISTORY = 50;

// ---- History ----------------------------------------------------------------

export async function getHistory(): Promise<PaletteEntry[]> {
  const res = await chrome.storage.local.get(HISTORY_KEY);
  const list = res[HISTORY_KEY];
  return Array.isArray(list) ? (list as PaletteEntry[]) : [];
}

export async function addHistoryEntry(
  entry: PaletteEntry,
): Promise<PaletteEntry[]> {
  const history = await getHistory();
  // Newest first, capped at MAX_HISTORY (FIFO drop of the oldest).
  const next = [entry, ...history].slice(0, MAX_HISTORY);
  await chrome.storage.local.set({ [HISTORY_KEY]: next });
  return next;
}

export async function deleteHistoryEntry(id: string): Promise<PaletteEntry[]> {
  const history = await getHistory();
  const next = history.filter((e) => e.id !== id);
  await chrome.storage.local.set({ [HISTORY_KEY]: next });
  return next;
}

export async function clearHistory(): Promise<void> {
  await chrome.storage.local.set({ [HISTORY_KEY]: [] });
}

// ---- Settings ---------------------------------------------------------------

export async function getSettings(): Promise<Settings> {
  const res = await chrome.storage.local.get(SETTINGS_KEY);
  const stored = res[SETTINGS_KEY] as Partial<Settings> | undefined;
  return { ...DEFAULT_SETTINGS, ...(stored ?? {}) };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
}
