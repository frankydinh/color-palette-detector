// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { PaletteColor } from '@/types'
import { fromRgb255 } from '@/lib/convert'
import { usePaletteStore } from '../../store/usePaletteStore'
import { DEFAULT_SETTINGS } from '@/types'
import Swatch from '../Swatch'

const color: PaletteColor = { ...fromRgb255(255, 0, 0), ratio: 42 }

// Keep a reference to the mock so we can assert on it without going through
// the narrowly-typed navigator.clipboard.writeText property.
let writeText = vi.fn()

beforeEach(() => {
  usePaletteStore.setState({
    settings: DEFAULT_SETTINGS,
    toasts: [],
    colors: [],
  })

  writeText = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
    writable: true,
  })
})

describe('Swatch', () => {
  it('renders the hex string', () => {
    render(
      <Swatch color={color} index={0} isBase={false} onSelect={vi.fn()} />,
    )
    expect(screen.getByText(color.hex)).toBeDefined()
  })

  it('renders the ratio percentage', () => {
    render(
      <Swatch color={color} index={0} isBase={false} onSelect={vi.fn()} />,
    )
    expect(screen.getByText('42%')).toBeDefined()
  })

  it('clicking main button calls clipboard.writeText with the hex', async () => {
    render(
      <Swatch color={color} index={0} isBase={false} onSelect={vi.fn()} />,
    )
    const btn = screen.getByTitle(
      'Click to copy HEX · double-click to set as base',
    )
    fireEvent.click(btn)
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(color.hex)
    })
  })

  it('double-clicking calls onSelect with the hex', () => {
    const onSelect = vi.fn()
    render(
      <Swatch color={color} index={0} isBase={false} onSelect={onSelect} />,
    )
    const btn = screen.getByTitle(
      'Click to copy HEX · double-click to set as base',
    )
    fireEvent.dblClick(btn)
    expect(onSelect).toHaveBeenCalledWith(color.hex)
  })
})
