import { describe, it, expect } from 'vitest'
import { fromRgb255, parseColor, formatColor } from '../convert'

describe('fromRgb255', () => {
  it('produces the correct hex for (255, 87, 51)', () => {
    const c = fromRgb255(255, 87, 51)
    expect(c.hex).toBe('#FF5733')
  })

  it('hsl hue is within ±1 of expected (~11°)', () => {
    const c = fromRgb255(255, 87, 51)
    expect(c.hsl.h).toBeGreaterThanOrEqual(10)
    expect(c.hsl.h).toBeLessThanOrEqual(12)
  })

  it('cmyk.k === 100 for black', () => {
    const c = fromRgb255(0, 0, 0)
    expect(c.cmyk.k).toBe(100)
  })

  it('cmyk.k === 0 for pure red', () => {
    const c = fromRgb255(255, 0, 0)
    expect(c.cmyk.k).toBe(0)
  })
})

describe('parseColor', () => {
  it('returns null for "transparent"', () => {
    expect(parseColor('transparent')).toBeNull()
  })

  it('returns null for "rgba(0,0,0,0)"', () => {
    expect(parseColor('rgba(0,0,0,0)')).toBeNull()
  })

  it('parses the named color "red"', () => {
    const c = parseColor('red')
    expect(c).not.toBeNull()
    expect(c!.hex).toBe('#FF0000')
  })

  it('parses a hex string', () => {
    const c = parseColor('#FF5733')
    expect(c).not.toBeNull()
    expect(c!.hex).toBe('#FF5733')
  })

  it('parses an rgb() string', () => {
    const c = parseColor('rgb(255, 87, 51)')
    expect(c).not.toBeNull()
    expect(c!.hex).toBe('#FF5733')
  })
})

describe('formatColor', () => {
  it('formats hex correctly', () => {
    const c = fromRgb255(255, 87, 51)
    expect(formatColor(c, 'hex')).toBe('#FF5733')
  })

  it('formats rgb correctly', () => {
    const c = fromRgb255(255, 87, 51)
    expect(formatColor(c, 'rgb')).toBe('rgb(255, 87, 51)')
  })

  it('formats hsl correctly', () => {
    const c = fromRgb255(255, 87, 51)
    const result = formatColor(c, 'hsl')
    expect(result).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/)
  })

  it('formats cmyk correctly', () => {
    const c = fromRgb255(255, 87, 51)
    const result = formatColor(c, 'cmyk')
    expect(result).toMatch(/^cmyk\(\d+%, \d+%, \d+%, \d+%\)$/)
  })
})
