// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { PaletteColor } from '@/types'
import { fromRgb255 } from '@/lib/convert'
import { usePaletteStore } from '../../store/usePaletteStore'
import { DEFAULT_SETTINGS } from '@/types'
import PaletteView from '../PaletteView'

const colors: PaletteColor[] = [
  { ...fromRgb255(255, 0, 0), ratio: 25 },
  { ...fromRgb255(0, 255, 0), ratio: 25 },
  { ...fromRgb255(0, 0, 255), ratio: 25 },
  { ...fromRgb255(255, 255, 0), ratio: 25 },
]

beforeEach(() => {
  usePaletteStore.setState({
    status: 'ready',
    source: 'upload',
    sourceLabel: 'test.png',
    colors,
    mood: [],
    settings: DEFAULT_SETTINGS,
    baseHex: null,
  })
})

describe('PaletteView', () => {
  it('renders all 4 hex strings', () => {
    render(<PaletteView />)
    for (const c of colors) {
      expect(screen.getByText(c.hex)).toBeDefined()
    }
  })

  it('renders the ratio percentage for each swatch', () => {
    render(<PaletteView />)
    const percentages = screen.getAllByText('25%')
    expect(percentages).toHaveLength(4)
  })

  it('renders the source label', () => {
    render(<PaletteView />)
    expect(screen.getByText('test.png')).toBeDefined()
  })

  it('renders nothing when status is empty', () => {
    usePaletteStore.setState({ status: 'empty' })
    const { container } = render(<PaletteView />)
    expect(container.firstChild).toBeNull()
  })
})
