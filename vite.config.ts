import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    return {
      base: './',
      server: {
        // PORT env lets the Claude Code preview assign a free port per session
        // (two sessions on one machine would otherwise fight over one number).
        // Plain `npm run dev` has no PORT set and keeps 3000.
        port: Number(process.env.PORT) || 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
