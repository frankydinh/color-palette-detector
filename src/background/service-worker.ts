import type { Msg } from '@/types';

// Open the side panel when the toolbar icon is clicked.
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((err) => console.error('setPanelBehavior failed', err));
});

async function fetchImage(url: string): Promise<Msg> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      return {
        type: 'FETCH_IMAGE_RESULT',
        ok: false,
        error: `Request failed (${res.status})`,
      };
    }
    const mime = res.headers.get('content-type') ?? '';
    if (!mime.startsWith('image/')) {
      return {
        type: 'FETCH_IMAGE_RESULT',
        ok: false,
        error: 'URL did not return an image',
      };
    }
    const buffer = await res.arrayBuffer();
    return { type: 'FETCH_IMAGE_RESULT', ok: true, buffer, mime };
  } catch {
    // No URL logging — privacy-first.
    return {
      type: 'FETCH_IMAGE_RESULT',
      ok: false,
      error: 'Could not load image from this URL',
    };
  }
}

chrome.runtime.onMessage.addListener(
  (msg: Msg, _sender, sendResponse: (r: Msg) => void) => {
    if (msg.type === 'FETCH_IMAGE') {
      fetchImage(msg.url).then(sendResponse);
      return true; // async response
    }
    return undefined;
  },
);
