import type { ScanRaw } from '@/types';

/**
 * Runs IN the target page via chrome.scripting.executeScript({ func }).
 *
 * IMPORTANT: this function is serialized (Function.prototype.toString) and
 * re-parsed inside the page. It must be entirely self-contained — every helper
 * is nested here, and it references NO module-scope imports at runtime.
 * (`import type` above is erased at compile time, so it's safe.)
 *
 * It walks the DOM, reads getComputedStyle for every element, and aggregates
 * colors weighted by rendered area and role hint. Normalization/merging happens
 * back in the side panel (where culori is available).
 */
export function collectPageColors(): ScanRaw {
  const COLOR_RE = /rgba?\([^)]*\)|#[0-9a-fA-F]{3,8}\b|\bhsla?\([^)]*\)/g;

  interface Agg {
    weight: number;
    bg: number;
    text: number;
    border: number;
    other: number;
  }
  const map = new Map<string, Agg>();

  const isTransparent = (c: string): boolean => {
    const s = c.trim().toLowerCase();
    if (s === 'transparent' || s === 'rgba(0, 0, 0, 0)' || s === 'none') {
      return true;
    }
    // rgba(...,0) fully transparent.
    const m = s.match(/rgba?\(([^)]+)\)/);
    if (m && m[1]) {
      const parts = m[1].split(',').map((p) => p.trim());
      if (parts.length === 4 && parseFloat(parts[3]!) === 0) return true;
    }
    return false;
  };

  const add = (
    css: string,
    weight: number,
    kind: 'bg' | 'text' | 'border' | 'other',
  ) => {
    if (!css || isTransparent(css)) return;
    if (weight <= 0) return;
    let agg = map.get(css);
    if (!agg) {
      agg = { weight: 0, bg: 0, text: 0, border: 0, other: 0 };
      map.set(css, agg);
    }
    agg.weight += weight;
    agg[kind] += weight;
  };

  const hasDirectText = (el: Element): boolean => {
    for (const node of Array.from(el.childNodes)) {
      if (
        node.nodeType === Node.TEXT_NODE &&
        (node.textContent ?? '').trim().length > 0
      ) {
        return true;
      }
    }
    return false;
  };

  const all = document.querySelectorAll('*');
  for (const el of Array.from(all)) {
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') continue;

    const rect = (el as HTMLElement).getBoundingClientRect();
    let area = rect.width * rect.height;
    if (area <= 0) {
      const he = el as HTMLElement;
      area = (he.offsetWidth || 0) * (he.offsetHeight || 0);
    }
    if (area <= 0) area = 1; // tiny fallback so inline/SVG colors still count

    // Background.
    add(style.backgroundColor, area, 'bg');

    // Text color — weighted only when the element directly renders text.
    if (hasDirectText(el)) {
      add(style.color, area * 0.6, 'text');
    }

    // Borders & outline (small weight — thin surfaces).
    const borderWeight = Math.min(area, 4000);
    add(style.borderTopColor, borderWeight * 0.25, 'border');
    add(style.borderRightColor, borderWeight * 0.25, 'border');
    add(style.borderBottomColor, borderWeight * 0.25, 'border');
    add(style.borderLeftColor, borderWeight * 0.25, 'border');
    add(style.outlineColor, borderWeight * 0.2, 'border');

    // box-shadow color stops.
    if (style.boxShadow && style.boxShadow !== 'none') {
      const matches = style.boxShadow.match(COLOR_RE);
      if (matches) {
        for (const c of matches) add(c, borderWeight * 0.15, 'border');
      }
    }

    // SVG fill / stroke.
    if (style.fill && style.fill !== 'none') add(style.fill, area, 'other');
    if (style.stroke && style.stroke !== 'none') {
      add(style.stroke, area * 0.4, 'other');
    }

    // Gradient color stops in background-image.
    const bgImg = style.backgroundImage;
    if (bgImg && bgImg.includes('gradient')) {
      const matches = bgImg.match(COLOR_RE);
      if (matches) {
        const per = area / matches.length;
        for (const c of matches) add(c, per, 'other');
      }
    }
  }

  const colors = Array.from(map.entries())
    .map(([css, a]) => ({
      css,
      weight: a.weight,
      bg: a.bg,
      text: a.text,
      border: a.border,
      other: a.other,
    }))
    .sort((x, y) => y.weight - x.weight)
    .slice(0, 60); // cap before sending to the panel

  return { pageLabel: location.hostname || location.href, colors };
}
