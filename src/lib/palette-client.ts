import type { PaletteColor, WorkerRequest, WorkerResponse } from '@/types';

let worker: Worker | null = null;
let seq = 0;
const pending = new Map<
  number,
  {
    resolve: (v: { colors: PaletteColor[]; thumbnail: string }) => void;
    reject: (e: Error) => void;
  }
>();

function getWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL('../workers/palette.worker.ts', import.meta.url), {
    type: 'module',
  });
  worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
    const res = e.data;
    const entry = pending.get(res.id);
    if (!entry) return;
    pending.delete(res.id);
    if (res.type === 'QUANTIZE_RESULT') {
      entry.resolve({ colors: res.colors, thumbnail: res.thumbnail });
    } else {
      entry.reject(new Error(res.error));
    }
  };
  worker.onerror = () => {
    for (const [, entry] of pending) entry.reject(new Error('Worker crashed'));
    pending.clear();
  };
  return worker;
}

/** Quantize an image buffer off the main thread. */
export function quantizeImage(
  buffer: ArrayBuffer,
  colorCount: number,
): Promise<{ colors: PaletteColor[]; thumbnail: string }> {
  const w = getWorker();
  const id = ++seq;
  const req: WorkerRequest = { id, type: 'QUANTIZE', buffer, colorCount };
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    // NOTE: intentionally NOT transferring the buffer — the store keeps the
    // original so it can re-quantize when the swatch-count stepper changes.
    w.postMessage(req);
  });
}
