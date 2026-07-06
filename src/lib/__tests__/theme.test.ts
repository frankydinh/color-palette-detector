import { describe, it, expect } from 'vitest'
import { deriveTheme } from '../theme'
import { contrastRatio } from '../contrast'
import { fromHsl, parseColor } from '../convert'

const darkSurface = fromHsl(0, 0, 6)

describe('deriveTheme', () => {
  it('returns the neutral fallback for undefined input', () => {
    const theme = deriveTheme(undefined)
    expect(theme.accent).toBe('#6366f1')
    expect(theme.accentFg).toBe('#ffffff')
  })

  it('returns a hex accent for a normal mid colour', () => {
    const mid = fromHsl(200, 60, 55)
    const theme = deriveTheme(mid)
    expect(theme.accent).toMatch(/^#[0-9A-F]{6}$/)
  })

  it('accentFg is either #ffffff or #0e0f13', () => {
    const mid = fromHsl(200, 60, 55)
    const theme = deriveTheme(mid)
    const validFg = theme.accentFg === '#ffffff' || theme.accentFg === '#0e0f13'
    expect(validFg).toBe(true)
  })

  it('derived accent has reasonable contrast on the dark surface', () => {
    const mid = fromHsl(200, 60, 55)
    const theme = deriveTheme(mid)
    const accentColor = parseColor(theme.accent)!
    expect(contrastRatio(accentColor, darkSurface)).toBeGreaterThan(2.4)
  })

  it('neutral fallback accent also has contrast on the dark surface', () => {
    const theme = deriveTheme(undefined)
    const accentColor = parseColor(theme.accent)!
    expect(contrastRatio(accentColor, darkSurface)).toBeGreaterThan(2.4)
  })
})
