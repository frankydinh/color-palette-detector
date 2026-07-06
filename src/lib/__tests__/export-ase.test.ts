import { describe, it, expect } from 'vitest'
import { generateAse } from '../export-ase'
import { fromRgb255 } from '../convert'
import type { PaletteColor } from '@/types'

// "#FF5733" has 7 chars → nameUnits = 8 → blockBodyLen = 2 + 16 + 4 + 12 + 2 = 36
// per-block overhead: 2 (type) + 4 (length) = 6 → total per block = 42
// header: 4 (ASEF) + 2 (major) + 2 (minor) + 4 (count) = 12
const HEADER_BYTES = 12
const BLOCK_BYTES = 42 // for a 7-char hex name

function makePaletteColor(r: number, g: number, b: number, ratio: number): PaletteColor {
  return { ...fromRgb255(r, g, b), ratio }
}

describe('generateAse', () => {
  const colors: PaletteColor[] = [
    makePaletteColor(255, 87, 51, 60),
    makePaletteColor(0, 0, 0, 40),
  ]

  it('first 4 bytes spell "ASEF"', () => {
    const buf = generateAse(colors)
    const view = new DataView(buf)
    const sig = String.fromCharCode(
      view.getUint8(0),
      view.getUint8(1),
      view.getUint8(2),
      view.getUint8(3),
    )
    expect(sig).toBe('ASEF')
  })

  it('version major uint16 === 1', () => {
    const buf = generateAse(colors)
    const view = new DataView(buf)
    expect(view.getUint16(4)).toBe(1)
  })

  it('block count equals number of colors', () => {
    const buf = generateAse(colors)
    const view = new DataView(buf)
    expect(view.getUint32(8)).toBe(colors.length)
  })

  it('first block type === 0x0001 (color entry)', () => {
    const buf = generateAse(colors)
    const view = new DataView(buf)
    expect(view.getUint16(12)).toBe(0x0001)
  })

  it('first color R float32 ≈ expected (255/255 = 1.0)', () => {
    const buf = generateAse(colors)
    const view = new DataView(buf)
    // Offset 40: after header(12) + block_type(2) + block_len(4) + name_len(2) + name_utf16(16) + model(4)
    expect(view.getFloat32(40)).toBeCloseTo(1.0, 4)
  })

  it('total byte length matches per-block formula', () => {
    const buf = generateAse(colors)
    expect(buf.byteLength).toBe(HEADER_BYTES + colors.length * BLOCK_BYTES)
  })
})
