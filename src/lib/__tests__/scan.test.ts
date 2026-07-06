import { describe, it, expect } from 'vitest'
import { processScan } from '../scan'
import type { ScanRaw } from '@/types'

const fixture: ScanRaw = {
  pageLabel: 'test.example',
  colors: [
    // Highest bg weight → should receive 'background' role
    { css: 'rgb(255, 255, 255)', weight: 60, bg: 58, text: 1, border: 1, other: 0 },
    // Highest text weight → should receive 'text' role
    { css: 'rgb(10, 10, 10)', weight: 30, bg: 2, text: 27, border: 1, other: 0 },
    // Saturated, mid-lightness → should receive 'primary' or 'accent'
    { css: 'rgb(80, 120, 200)', weight: 10, bg: 1, text: 1, border: 2, other: 6 },
  ],
}

describe('processScan', () => {
  it('returns normalized PaletteColor[] with ratios summing to ~100', () => {
    const result = processScan(fixture)
    const sum = result.reduce((acc, c) => acc + c.ratio, 0)
    expect(sum).toBeGreaterThan(99)
    expect(sum).toBeLessThan(101)
  })

  it('assigns the background role to the highest-bg-weight color', () => {
    const result = processScan(fixture)
    const bg = result.find((c) => c.role === 'background')
    expect(bg).toBeDefined()
    expect(bg!.hex).toBe('#FFFFFF')
  })

  it('assigns the text role to the text-dominant color', () => {
    const result = processScan(fixture)
    const text = result.find((c) => c.role === 'text')
    expect(text).toBeDefined()
  })

  it('produces a valid PaletteColor array (each color has a hex and ratio)', () => {
    const result = processScan(fixture)
    for (const c of result) {
      expect(c.hex).toMatch(/^#[0-9A-F]{6}$/)
      expect(c.ratio).toBeGreaterThan(0)
    }
  })
})
