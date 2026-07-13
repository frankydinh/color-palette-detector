// Base64 <-> ArrayBuffer helpers. Needed because chrome.runtime.sendMessage
// serializes messages as JSON — an ArrayBuffer does NOT survive the trip (it
// arrives as an empty object), so the service worker sends image bytes as a
// base64 string and the side panel decodes them back. `btoa`/`atob` exist in
// the service worker, the side panel, and Node (for tests).

/** Encode an ArrayBuffer to a base64 string (chunked to avoid stack limits). */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const CHUNK = 0x8000; // 32k — keeps String.fromCharCode arg count safe
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

/** Decode a base64 string back into an ArrayBuffer. */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
