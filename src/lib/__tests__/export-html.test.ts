import { describe, it, expect } from 'vitest';
import { generateHtmlReport } from '../export-html';
import type { ReportMeta } from '../export-md';
import { fromRgb255 } from '../convert';
import type { PaletteColor } from '@/types';

const colors: PaletteColor[] = [
  { ...fromRgb255(255, 255, 255), ratio: 60, role: 'background' },
  { ...fromRgb255(0, 0, 0), ratio: 40, role: 'text' },
];

const meta: ReportMeta = {
  source: 'website',
  sourceLabel: 'example.com',
  mood: ['Tech'],
};

describe('generateHtmlReport', () => {
  const html = generateHtmlReport(colors, meta);

  it('is a complete HTML document', () => {
    expect(html.toLowerCase().startsWith('<!doctype html')).toBe(true);
    expect(html).toContain('<style');
    expect(html).toContain('</html>');
  });

  it('renders every color hex and the source label', () => {
    for (const c of colors) expect(html).toContain(c.hex);
    expect(html).toContain('example.com');
  });

  it('is fully self-contained (no external resources)', () => {
    expect(html).not.toContain('http://');
    expect(html).not.toContain('https://');
    expect(html).not.toContain('cdn');
  });

  it('includes an accessibility badge for text/background', () => {
    expect(html).toContain('Accessibility');
    expect(html).toContain('21:1');
  });

  it('escapes HTML in the source label', () => {
    const evil = generateHtmlReport(colors, {
      source: 'upload',
      sourceLabel: '<b>x</b>',
      mood: [],
    });
    expect(evil).toContain('&lt;b&gt;x&lt;/b&gt;');
    expect(evil).not.toContain('<b>x</b>');
  });
});
