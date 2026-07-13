import { describe, it, expect } from 'vitest';
import {
  generateAiPrompt,
  generateMarkdown,
  describeSource,
  type ReportMeta,
} from '../export-md';
import { fromRgb255 } from '../convert';
import type { PaletteColor } from '@/types';

const colors: PaletteColor[] = [
  { ...fromRgb255(255, 255, 255), ratio: 55.5, role: 'background' },
  { ...fromRgb255(0, 0, 0), ratio: 30.2, role: 'text' },
  { ...fromRgb255(255, 87, 51), ratio: 14.3, role: 'primary' },
];

const meta: ReportMeta = {
  source: 'website',
  sourceLabel: 'example.com',
  mood: ['Minimal', 'Elegant'],
};

describe('describeSource', () => {
  it('formats website source', () => {
    expect(describeSource(meta)).toBe('Website (example.com)');
  });
  it('formats eyedropper as Screen pick', () => {
    expect(
      describeSource({ source: 'eyedropper', sourceLabel: '', mood: [] }),
    ).toBe('Screen pick');
  });
});

describe('generateMarkdown', () => {
  const md = generateMarkdown(colors, meta);

  it('has the title with the source label', () => {
    expect(md).toContain('# Color Palette — example.com');
  });

  it('includes the colors table header', () => {
    expect(md).toContain('| # | HEX | RGB | HSL | CMYK | Coverage | Role |');
  });

  it('lists every color hex', () => {
    for (const c of colors) expect(md).toContain(c.hex);
  });

  it('shows the mood', () => {
    expect(md).toContain('Minimal, Elegant');
  });

  it('has a Harmony section based on the dominant color', () => {
    expect(md).toContain(`## Harmony (base ${colors[0]!.hex})`);
    expect(md).toContain('**Triadic:**');
  });

  it('reports text-on-background contrast (21:1 for black/white)', () => {
    expect(md).toContain('## Accessibility');
    expect(md).toContain('21:1');
  });

  it('embeds a parseable JSON raw-data block', () => {
    expect(md).toContain('## Raw data');
    const match = md.match(/```json\n([\s\S]*?)\n```/);
    expect(match).not.toBeNull();
    const parsed = JSON.parse(match![1]!) as unknown[];
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(colors.length);
  });

  it('generateAiPrompt prepends an instruction block then the full report', () => {
    const prompt = generateAiPrompt(colors, meta);
    expect(prompt).toContain('color and brand design expert');
    expect(prompt).toContain('60-30-10');
    // The full markdown report is still embedded after the instructions.
    expect(prompt).toContain('# Color Palette — example.com');
    expect(prompt.indexOf('design expert')).toBeLessThan(
      prompt.indexOf('# Color Palette'),
    );
  });

  it('notes missing role info when no text/background roles', () => {
    const md2 = generateMarkdown(
      [{ ...fromRgb255(10, 20, 30), ratio: 100 }],
      { source: 'upload', sourceLabel: 'a.png', mood: [] },
    );
    expect(md2).toContain('Not enough role info');
  });
});
