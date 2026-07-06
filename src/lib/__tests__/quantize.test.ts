import { describe, it, expect } from 'vitest'
import { medianCut, mergeSimilar, extractPixels } from '../quantize'
import { fromRgb255 } from '../convert'
import type { PaletteColor } from '@/types'

function makePixels(n: number, r: number, g: number, b: number): [number, number, number][] {
  return Array.from({ length: n }, (): [number, number, number] => [r, g, b])
}

describe('medianCut', () => {
  it('returns the requested number of colors', () => {
    const pixels = [
      ...makePixels(25, 255, 0, 0),
      ...makePixels(25, 0, 255, 0),
      ...makePixels(25, 0, 0, 255),
      ...makePixels(25, 255, 255, 0),
    ]
    const result = medianCut(pixels, 4)
    expect(result).toHaveLength(4)
  })

  it('ratios sum to ~100 (±1)', () => {
    const pixels = [
      ...makePixels(50, 255, 0, 0),
      ...makePixels(50, 0, 0, 255),
    ]
    const result = medianCut(pixels, 2)
    const sum = result.reduce((acc, c) => acc + c.ratio, 0)
    expect(sum).toBeGreaterThan(99)
    expect(sum).toBeLessThan(101)
  })

  it('50/50 two-color input yields ~50/50 ratios', () => {
    const pixels = [
      ...makePixels(50, 255, 0, 0),
      ...makePixels(50, 0, 0, 255),
    ]
    const result = medianCut(pixels, 2)
    expect(result).toHaveLength(2)
    expect(result[0]!.ratio).toBeCloseTo(50, 0)
    expect(result[1]!.ratio).toBeCloseTo(50, 0)
  })
})

describe('mergeSimilar', () => {
  it('collapses near-duplicate colors into one', () => {
    const colors: PaletteColor[] = [
      { ...fromRgb255(255, 0, 0), ratio: 50 },
      { ...fromRgb255(254, 1, 1), ratio: 30 },
      { ...fromRgb255(0, 0, 255), ratio: 20 },
    ]
    const merged = mergeSimilar(colors, 10)
    expect(merged).toHaveLength(2)
  })

  it('merged near-duplicate ratio ≈ sum of originals', () => {
    const colors: PaletteColor[] = [
      { ...fromRgb255(255, 0, 0), ratio: 50 },
      { ...fromRgb255(254, 1, 1), ratio: 30 },
      { ...fromRgb255(0, 0, 255), ratio: 20 },
    ]
    const merged = mergeSimilar(colors, 10)
    const redBucket = merged.find((c) => c.hex !== '#0000FF')!
    expect(redBucket.ratio).toBeCloseTo(80, 0)
  })

  it('keeps distinct colors separate', () => {
    const colors: PaletteColor[] = [
      { ...fromRgb255(255, 0, 0), ratio: 50 },
      { ...fromRgb255(0, 0, 255), ratio: 50 },
    ]
    const merged = mergeSimilar(colors, 10)
    expect(merged).toHaveLength(2)
  })
})

describe('extractPixels', () => {
  it('skips fully transparent pixels', () => {
    const width = 4
    const height = 4
    const data = new Uint8ClampedArray(width * height * 4)
    for (let i = 0; i < width * height; i++) {
      data[i * 4] = 200
      data[i * 4 + 1] = 100
      data[i * 4 + 2] = 50
      data[i * 4 + 3] = i === 0 ? 0 : 255
    }
    const pixels = extractPixels(data, width, height)
    expect(pixels.length).toBe(15)
  })

  it('downsamples large inputs to fewer than total pixels', () => {
    const width = 600
    const height = 400
    const data = new Uint8ClampedArray(width * height * 4)
    data.fill(255)
    const pixels = extractPixels(data, width, height)
    expect(pixels.length).toBeLessThan(width * height)
    expect(pixels.length).toBeGreaterThan(0)
  })
})
