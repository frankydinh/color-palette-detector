// Generates simple, dependency-free PNG icons (a rounded-ish palette motif of
// diagonal color bands) for the extension. Run: node scripts/gen-icons.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'public', 'icons');
mkdirSync(OUT, { recursive: true });

// Brand-ish color bands.
const BANDS = [
  [99, 102, 241], // indigo
  [236, 72, 153], // pink
  [45, 212, 191], // teal
  [250, 204, 21], // yellow
];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (~c) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function makePng(size) {
  const px = Buffer.alloc(size * size * 4);
  const r = size * 0.18; // corner radius
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      // Rounded-corner alpha mask.
      const inCorner = (cx, cy) => {
        const dx = x - cx;
        const dy = y - cy;
        return Math.sqrt(dx * dx + dy * dy) > r;
      };
      let alpha = 255;
      if (x < r && y < r && inCorner(r, r)) alpha = 0;
      else if (x > size - r && y < r && inCorner(size - r, r)) alpha = 0;
      else if (x < r && y > size - r && inCorner(r, size - r)) alpha = 0;
      else if (x > size - r && y > size - r && inCorner(size - r, size - r))
        alpha = 0;

      // Diagonal band selection.
      const t = (x + y) / (2 * size);
      const band = Math.min(BANDS.length - 1, Math.floor(t * BANDS.length));
      const [rr, gg, bb] = BANDS[band];
      px[i] = rr;
      px[i + 1] = gg;
      px[i + 2] = bb;
      px[i + 3] = alpha;
    }
  }

  // Add filter byte (0) at the start of each scanline.
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const size of [16, 32, 48, 128]) {
  writeFileSync(join(OUT, `icon${size}.png`), makePng(size));
  console.log(`wrote icon${size}.png`);
}
