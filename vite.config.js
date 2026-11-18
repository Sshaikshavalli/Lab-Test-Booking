import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // GitHub Pages serves the site from /<repo-name>/; the deploy workflow sets VITE_BASE. Locally and on Vercel it stays '/'.
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  test: { environment: 'node', include: ['tests/**/*.test.js'] },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber'],
          vendor: ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
        },
      },
    },
  },
});
