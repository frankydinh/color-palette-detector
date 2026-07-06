// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { PaletteColor } from '@/types'
import { fromRgb255 } from '@/lib/convert'
import { usePaletteStore } from '../../store/usePaletteStore'
import ContrastChecker from '../ContrastChecker'

const blackColor: PaletteColor = { ...fromRgb255(0, 0, 0), ratio: 50, role: 'text' }
const whiteColor: PaletteColor = { ...fromRgb255(255, 255, 255), ratio: 50, role: 'background' }

beforeEach(() => {
  usePaletteStore.setState({ colors: [blackColor, whiteColor] })
})

describe('ContrastChecker', () => {
  it('displays the contrast ratio 21.00 for black on white', () => {
    render(<ContrastChecker />)
    expect(screen.getByText('21.00')).toBeDefined()
  })

  it('shows Pass for AA badge', () => {
    render(<ContrastChecker />)
    // All 4 badges (AA, AA Large, AAA, AAA Large) pass at 21:1.
    const passBadges = screen.getAllByText('Pass')
    expect(passBadges.length).toBeGreaterThanOrEqual(2)
  })

  it('shows Pass for AAA badge', () => {
    render(<ContrastChecker />)
    // AAA requires ratio >= 7; 21 exceeds it.
    const passBadges = screen.getAllByText('Pass')
    expect(passBadges.length).toBe(4)
  })

  it('renders the preview text element', () => {
    render(<ContrastChecker />)
    expect(screen.getByText('Aa The quick brown fox')).toBeDefined()
  })
})
