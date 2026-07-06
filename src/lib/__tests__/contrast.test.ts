import { describe, it, expect } from 'vitest'
import { checkContrast } from '../contrast'
import { parseColor } from '../convert'

const black = parseColor('#000000')!
const white = parseColor('#FFFFFF')!
const gray76 = parseColor('#767676')!
const gray77 = parseColor('#777777')!

describe('checkContrast', () => {
  it('black on white has ratio === 21', () => {
    const result = checkContrast(black, white)
    expect(result.ratio).toBe(21)
  })

  it('black on white has aaa === true', () => {
    const result = checkContrast(black, white)
    expect(result.aaa).toBe(true)
  })

  it('#767676 on #FFFFFF ratio ≈ 4.54 (±0.05)', () => {
    const result = checkContrast(gray76, white)
    expect(result.ratio).toBeCloseTo(4.54, 1)
  })

  it('#767676 on #FFFFFF aa === true', () => {
    const result = checkContrast(gray76, white)
    expect(result.aa).toBe(true)
  })

  it('#777777 on #FFFFFF aa === false', () => {
    const result = checkContrast(gray77, white)
    expect(result.aa).toBe(false)
  })

  it('#767676 on #FFFFFF aaLarge === true', () => {
    const result = checkContrast(gray76, white)
    expect(result.aaLarge).toBe(true)
  })

  it('#767676 on #FFFFFF aaa === false', () => {
    const result = checkContrast(gray76, white)
    expect(result.aaa).toBe(false)
  })

  it('#767676 on #FFFFFF aaaLarge === true (ratio ≥ 4.5)', () => {
    const result = checkContrast(gray76, white)
    expect(result.aaaLarge).toBe(true)
  })

  it('#777777 on #FFFFFF aaaLarge === false (ratio < 4.5)', () => {
    const result = checkContrast(gray77, white)
    expect(result.aaaLarge).toBe(false)
  })
})
