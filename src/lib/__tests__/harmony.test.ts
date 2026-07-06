import { describe, it, expect } from 'vitest'
import { generateHarmony } from '../harmony'
import { fromHsl } from '../convert'

function circularHueDiff(a: number, b: number): number {
  const d = ((b - a) % 360 + 360) % 360
  return d > 180 ? 360 - d : d
}

const base = fromHsl(30, 100, 50)
const highHueBase = fromHsl(10, 70, 50)

describe('generateHarmony lengths', () => {
  it('monochromatic returns 5 colors', () => {
    expect(generateHarmony(base, 'monochromatic')).toHaveLength(5)
  })

  it('analogous returns 5 colors', () => {
    expect(generateHarmony(base, 'analogous')).toHaveLength(5)
  })

  it('complementary returns 4 colors', () => {
    expect(generateHarmony(base, 'complementary')).toHaveLength(4)
  })

  it('triadic returns 3 colors', () => {
    expect(generateHarmony(base, 'triadic')).toHaveLength(3)
  })
})

describe('triadic hue spacing', () => {
  it('hues are ~120° apart (first to second)', () => {
    const triadic = generateHarmony(base, 'triadic')
    const h0 = triadic[0]!.hsl.h
    const h1 = triadic[1]!.hsl.h
    expect(circularHueDiff(h0, h1)).toBeCloseTo(120, 0)
  })

  it('hues are ~120° apart (second to third)', () => {
    const triadic = generateHarmony(base, 'triadic')
    const h1 = triadic[1]!.hsl.h
    const h2 = triadic[2]!.hsl.h
    expect(circularHueDiff(h1, h2)).toBeCloseTo(120, 0)
  })
})

describe('hue wrapping', () => {
  it('all analogous hues stay within 0–360 for a near-zero base hue', () => {
    const analogous = generateHarmony(highHueBase, 'analogous')
    for (const color of analogous) {
      expect(color.hsl.h).toBeGreaterThanOrEqual(0)
      expect(color.hsl.h).toBeLessThan(360)
    }
  })

  it('triadic hues with high base hue wrap correctly and stay in 0–360', () => {
    const highBase = fromHsl(300, 70, 50)
    const triadic = generateHarmony(highBase, 'triadic')
    for (const color of triadic) {
      expect(color.hsl.h).toBeGreaterThanOrEqual(0)
      expect(color.hsl.h).toBeLessThan(360)
    }
  })
})
