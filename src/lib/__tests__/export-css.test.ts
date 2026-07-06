import { describe, it, expect } from 'vitest'
import { generateCss } from '../export-css'
import { fromRgb255 } from '../convert'
import type { PaletteColor } from '@/types'

function pc(r: number, g: number, b: number, ratio: number, role?: PaletteColor['role']): PaletteColor {
  return { ...fromRgb255(r, g, b), ratio, role }
}

describe('generateCss', () => {
  it('uses semantic names when roles are present', () => {
    const colors: PaletteColor[] = [
      pc(255, 255, 255, 50, 'background'),
      pc(0, 0, 0, 30, 'text'),
      pc(80, 80, 200, 20, 'primary'),
    ]
    const css = generateCss(colors)
    expect(css).toContain('--color-bg:')
    expect(css).toContain('--color-text:')
    expect(css).toContain('--color-primary:')
  })

  it('uses numeric names when no roles are present', () => {
    const colors: PaletteColor[] = [
      pc(255, 0, 0, 50),
      pc(0, 0, 255, 50),
    ]
    const css = generateCss(colors)
    expect(css).toContain('--color-1:')
    expect(css).toContain('--color-2:')
  })

  it('respects a custom prefix', () => {
    const colors: PaletteColor[] = [
      pc(255, 0, 0, 50),
      pc(0, 255, 0, 50),
    ]
    const css = generateCss(colors, '--palette-')
    expect(css).toContain('--palette-1:')
    expect(css).toContain('--palette-2:')
  })

  it('de-duplicates repeated role names with a numeric suffix', () => {
    const colors: PaletteColor[] = [
      pc(200, 50, 50, 50, 'primary'),
      pc(180, 30, 30, 50, 'primary'),
    ]
    const css = generateCss(colors)
    expect(css).toContain('--color-primary:')
    expect(css).toContain('--color-primary-2:')
  })
})
