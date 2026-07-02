import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Separate config from vite.config.ts so the VitePWA plugin (which expects a
// real build/service-worker context) never runs under the test runner —
// it isn't needed for component tests and has caused issues in other
// projects when invoked outside of `vite build`.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
    globals: true,
    css: true,
  },
});
