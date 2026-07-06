import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: 'Color Palette Detector',
  version: '0.1.0',
  description:
    'Extract, analyze and export color palettes from images or any website. 100% client-side, zero telemetry.',
  permissions: [
    'sidePanel', // primary UI surface
    'storage', // palette history + settings (local only)
    'activeTab', // access the current tab when the user actively scans
    'scripting', // inject the DOM color scanner on-demand
  ],
  // NOTE (dev/showoff only): <all_urls> lets the service worker fetch any
  // image URL and lets us inject the scanner into any tab. Before publishing
  // to the Web Store, migrate to `optional_host_permissions` requested
  // on-demand to minimize the permission footprint.
  host_permissions: ['<all_urls>'],
  action: {
    default_title: 'Color Palette Detector',
  },
  side_panel: {
    default_path: 'src/sidepanel/index.html',
  },
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },
  icons: {
    16: 'public/icons/icon16.png',
    32: 'public/icons/icon32.png',
    48: 'public/icons/icon48.png',
    128: 'public/icons/icon128.png',
  },
});
