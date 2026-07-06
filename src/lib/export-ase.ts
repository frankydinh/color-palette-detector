import type { PaletteColor } from '@/types';

/**
 * Adobe Swatch Exchange (.ase) binary writer.
 *
 * Layout (all multi-byte values BIG-ENDIAN):
 *   "ASEF"                          signature (4 bytes ASCII)
 *   version major/minor             2 × uint16  → 1, 0
 *   block count                     uint32
 *   per color block:
 *     block type                    uint16  (0x0001 = color entry)
 *     block length                  uint32  (bytes of block body below)
 *     name length                   uint16  (UTF-16 units incl. null term.)
 *     name                          UTF-16BE, null-terminated
 *     color model                   4 bytes ASCII ("RGB ")
 *     R,G,B                         3 × float32 (0–1)
 *     color type                    uint16  (0 = global)
 */
export function generateAse(colors: PaletteColor[]): ArrayBuffer {
  const names = colors.map((c) => c.hex); // swatch name = hex string

  // Pre-compute total byte length.
  let total = 4 + 4 + 4; // signature + version + block count
  const blockBodyLengths = names.map((name) => {
    const nameUnits = name.length + 1; // +1 for null terminator
    return 2 /* name len */ + nameUnits * 2 /* utf16 */ + 4 /* model */ +
      12 /* rgb float32 */ + 2 /* color type */;
  });
  for (const len of blockBodyLengths) {
    total += 2 /* block type */ + 4 /* block length */ + len;
  }

  const buf = new ArrayBuffer(total);
  const view = new DataView(buf);
  let o = 0;

  const writeAscii = (s: string) => {
    for (let i = 0; i < s.length; i++) {
      view.setUint8(o, s.charCodeAt(i));
      o += 1;
    }
  };

  // Header.
  writeAscii('ASEF');
  view.setUint16(o, 1); // major
  o += 2;
  view.setUint16(o, 0); // minor
  o += 2;
  view.setUint32(o, colors.length);
  o += 4;

  colors.forEach((color, idx) => {
    const name = names[idx]!;
    view.setUint16(o, 0x0001); // block type: color entry
    o += 2;
    view.setUint32(o, blockBodyLengths[idx]!); // block length
    o += 4;

    // Name (UTF-16BE, null-terminated).
    const nameUnits = name.length + 1;
    view.setUint16(o, nameUnits);
    o += 2;
    for (let i = 0; i < name.length; i++) {
      view.setUint16(o, name.charCodeAt(i)); // big-endian UTF-16 unit
      o += 2;
    }
    view.setUint16(o, 0); // null terminator
    o += 2;

    // Color model "RGB ".
    writeAscii('RGB ');

    // Float32 R,G,B in 0–1.
    view.setFloat32(o, color.rgb.r / 255);
    o += 4;
    view.setFloat32(o, color.rgb.g / 255);
    o += 4;
    view.setFloat32(o, color.rgb.b / 255);
    o += 4;

    // Color type: 0 = global.
    view.setUint16(o, 0);
    o += 2;
  });

  return buf;
}
