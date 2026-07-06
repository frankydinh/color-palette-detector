import { describe, it, expect } from 'vitest'
import { labelMood } from '../mood'
import { fromHsl } from '../convert'
import type { PaletteColor } from '@/types'

function pc(h: number, s: number, l: number, ratio: number): PaletteColor {
  return { ...fromHsl(h, s, l), ratio }
}

describe('labelMood', () => {
  it('returns [] for empty input', () => {
    expect(labelMood([])).toEqual([])
  })

  it('returns 1–3 labels for a non-empty palette', () => {
    const palette: PaletteColor[] = [pc(200, 50, 55, 100)]
    const labels = labelMood(palette)
    expect(labels.length).toBeGreaterThanOrEqual(1)
    expect(labels.length).toBeLessThanOrEqual(3)
  })

  it('low-saturation / high-lightness palette yields Minimal and Elegant', () => {
    // avgSat < 20, avgLight > 65 → Minimal + Elegant
    const palette: PaletteColor[] = [
      pc(0, 5, 88, 50),
      pc(30, 8, 85, 50),
    ]
    const labels = labelMood(palette)
    expect(labels).toContain('Minimal')
    expect(labels).toContain('Elegant')
  })

  it('vivid palette yields Playful and Youthful', () => {
    // avgSat > 60, avgLight > 45 → Playful + Youthful
    const palette: PaletteColor[] = [
      pc(0, 80, 60, 50),
      pc(60, 75, 55, 50),
    ]
    const labels = labelMood(palette)
    expect(labels).toContain('Playful')
    expect(labels).toContain('Youthful')
  })
})
