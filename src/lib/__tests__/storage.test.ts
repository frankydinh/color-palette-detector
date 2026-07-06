import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { PaletteEntry } from '@/types'
import {
  addHistoryEntry,
  clearHistory,
  deleteHistoryEntry,
  getHistory,
  getSettings,
  saveSettings,
} from '../storage'
import { DEFAULT_SETTINGS } from '@/types'

// In-memory backing store for the chrome.storage.local mock.
const storeMap = new Map<string, unknown>()

vi.stubGlobal('chrome', {
  storage: {
    local: {
      get: (key: string): Promise<Record<string, unknown>> =>
        Promise.resolve({ [key]: storeMap.get(key) }),
      set: (obj: Record<string, unknown>): Promise<void> => {
        for (const [k, v] of Object.entries(obj)) {
          storeMap.set(k, v)
        }
        return Promise.resolve()
      },
    },
  },
})

function makeEntry(id: string): PaletteEntry {
  return { id, createdAt: 0, source: 'upload', colors: [] }
}

describe('storage – history', () => {
  beforeEach(() => storeMap.clear())

  it('getHistory returns [] when nothing stored', async () => {
    const h = await getHistory()
    expect(h).toEqual([])
  })

  it('addHistoryEntry stores newest-first', async () => {
    await addHistoryEntry(makeEntry('a'))
    const h = await addHistoryEntry(makeEntry('b'))
    expect(h[0]?.id).toBe('b')
    expect(h[1]?.id).toBe('a')
  })

  it('addHistoryEntry caps at 50 entries', async () => {
    for (let i = 0; i < 55; i++) {
      await addHistoryEntry(makeEntry(String(i)))
    }
    const h = await getHistory()
    expect(h).toHaveLength(50)
  })

  it('addHistoryEntry drops oldest, keeps most recent when capped', async () => {
    for (let i = 0; i < 55; i++) {
      await addHistoryEntry(makeEntry(String(i)))
    }
    const h = await getHistory()
    // Newest is id '54', oldest kept is id '5'.
    expect(h[0]?.id).toBe('54')
    expect(h[49]?.id).toBe('5')
  })

  it('deleteHistoryEntry removes entry by id', async () => {
    await addHistoryEntry(makeEntry('x'))
    await addHistoryEntry(makeEntry('y'))
    const h = await deleteHistoryEntry('x')
    expect(h.some((e) => e.id === 'x')).toBe(false)
    expect(h.some((e) => e.id === 'y')).toBe(true)
  })

  it('clearHistory empties the list', async () => {
    await addHistoryEntry(makeEntry('z'))
    await clearHistory()
    const h = await getHistory()
    expect(h).toHaveLength(0)
  })
})

describe('storage – settings', () => {
  beforeEach(() => storeMap.clear())

  it('getSettings returns DEFAULT_SETTINGS when nothing stored', async () => {
    const s = await getSettings()
    expect(s).toEqual(DEFAULT_SETTINGS)
  })

  it('getSettings merges stored partial over defaults', async () => {
    await saveSettings({ ...DEFAULT_SETTINGS, cssPrefix: '--my-' })
    const s = await getSettings()
    expect(s.cssPrefix).toBe('--my-')
    expect(s.defaultCopyFormat).toBe(DEFAULT_SETTINGS.defaultCopyFormat)
  })

  it('saveSettings persists and getSettings reads it back', async () => {
    const custom = { ...DEFAULT_SETTINGS, swatchCount: 8 }
    await saveSettings(custom)
    const s = await getSettings()
    expect(s.swatchCount).toBe(8)
  })
})
