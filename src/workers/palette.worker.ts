/// <reference lib="webworker" />
import type { WorkerRequest, WorkerResponse } from '@/types';
import { extractPixels, medianCut } from '@/lib/quantize';

const MAX_THUMB = 200;

/** Draw the bitmap scaled to <=200px and return a JPEG data URL for history. */
async function makeThumbnail(bitmap: ImageBitmap): Promise<string> {
  const scale = Math.min(1, MAX_THUMB / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.drawImage(bitmap, 0, 0, w, h);
  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.7 });
  return await blobToDataUrl(blob);
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('read failed'));
    reader.readAsDataURL(blob);
  });
}

async function quantize(req: WorkerRequest): Promise<WorkerResponse> {
  try {
    const blob = new Blob([req.buffer]);
    const bitmap = await createImageBitmap(blob);

    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('OffscreenCanvas 2D context unavailable');
    ctx.drawImage(bitmap, 0, 0);
    const { data } = ctx.getImageData(0, 0, bitmap.width, bitmap.height);

    const pixels = extractPixels(data, bitmap.width, bitmap.height);
    if (pixels.length === 0) throw new Error('Image has no opaque pixels');
    const colors = medianCut(pixels, req.colorCount);
    const thumbnail = await makeThumbnail(bitmap);
    bitmap.close();

    return { id: req.id, type: 'QUANTIZE_RESULT', colors, thumbnail };
  } catch (err) {
    return {
      id: req.id,
      type: 'QUANTIZE_ERROR',
      error: err instanceof Error ? err.message : 'Failed to process image',
    };
  }
}

self.addEventListener('message', (e: MessageEvent<WorkerRequest>) => {
  const req = e.data;
  if (req.type === 'QUANTIZE') {
    quantize(req).then((res) => {
      (self as DedicatedWorkerGlobalScope).postMessage(res);
    });
  }
});
