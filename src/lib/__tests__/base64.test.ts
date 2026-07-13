import { describe, it, expect } from 'vitest';
import { arrayBufferToBase64, base64ToArrayBuffer } from '../base64';

function bytesOf(buffer: ArrayBuffer): number[] {
  return Array.from(new Uint8Array(buffer));
}

describe('base64 <-> ArrayBuffer', () => {
  it('round-trips arbitrary bytes', () => {
    const original = new Uint8Array([0, 1, 2, 254, 255, 128, 42, 7]);
    const b64 = arrayBufferToBase64(original.buffer);
    expect(typeof b64).toBe('string');
    expect(bytesOf(base64ToArrayBuffer(b64))).toEqual(Array.from(original));
  });

  it('round-trips a PNG signature', () => {
    // \x89PNG\r\n\x1a\n
    const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    expect(bytesOf(base64ToArrayBuffer(arrayBufferToBase64(sig.buffer)))).toEqual(
      Array.from(sig),
    );
  });

  it('handles a large buffer spanning multiple chunks', () => {
    const big = new Uint8Array(70_000);
    for (let i = 0; i < big.length; i++) big[i] = i % 256;
    const restored = new Uint8Array(
      base64ToArrayBuffer(arrayBufferToBase64(big.buffer)),
    );
    expect(restored.length).toBe(big.length);
    expect(restored[0]).toBe(0);
    expect(restored[65_537]).toBe(65_537 % 256);
    expect(restored[big.length - 1]).toBe((big.length - 1) % 256);
  });

  it('encodes empty buffer to empty string', () => {
    expect(arrayBufferToBase64(new ArrayBuffer(0))).toBe('');
    expect(base64ToArrayBuffer('').byteLength).toBe(0);
  });
});
