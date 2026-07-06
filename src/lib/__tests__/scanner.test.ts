// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { collectPageColors } from '@/content/scanner'

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('collectPageColors', () => {
  it('returns an object with a colors array and a pageLabel string', () => {
    const result = collectPageColors()
    expect(Array.isArray(result.colors)).toBe(true)
    expect(typeof result.pageLabel).toBe('string')
  })

  it('captures a set background color', () => {
    const div = document.createElement('div')
    div.style.backgroundColor = 'rgb(255, 0, 0)'
    document.body.appendChild(div)

    const result = collectPageColors()
    const cssList = result.colors.map((c) => c.css)
    expect(cssList.some((css) => css.includes('255'))).toBe(true)
  })

  it('skips transparent background', () => {
    const div = document.createElement('div')
    div.style.backgroundColor = 'transparent'
    document.body.appendChild(div)

    const result = collectPageColors()
    const cssList = result.colors.map((c) => c.css)
    expect(cssList).not.toContain('transparent')
    expect(cssList.every((css) => css !== 'rgba(0, 0, 0, 0)')).toBe(true)
  })

  it('captures text color on an element with direct text content', () => {
    const span = document.createElement('span')
    span.style.color = 'rgb(0, 128, 255)'
    span.textContent = 'Hello'
    document.body.appendChild(span)

    const result = collectPageColors()
    const entry = result.colors.find((c) => c.css === 'rgb(0, 128, 255)')
    expect(entry).toBeDefined()
    expect((entry?.text ?? 0) > 0).toBe(true)
  })

  it('gives background weight to a bg-colored element', () => {
    const div = document.createElement('div')
    div.style.backgroundColor = 'rgb(10, 20, 30)'
    document.body.appendChild(div)

    const result = collectPageColors()
    const entry = result.colors.find((c) => c.css === 'rgb(10, 20, 30)')
    expect(entry).toBeDefined()
    expect((entry?.bg ?? 0) > 0).toBe(true)
  })
})
