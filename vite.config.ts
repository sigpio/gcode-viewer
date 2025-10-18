import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  },
  resolve: {
    alias: {
      '@': '/src',
      events: fileURLToPath(new URL('./src/stubs/events.ts', import.meta.url)),
      stream: fileURLToPath(new URL('./src/stubs/stream.ts', import.meta.url)),
      fs: fileURLToPath(new URL('./src/stubs/fs.ts', import.meta.url)),
      timers: fileURLToPath(new URL('./src/stubs/timers.ts', import.meta.url))
    }
  }
});
