import { defineConfig } from 'vite';

// Relative asset paths let the static build be served from any sub-path (e.g. GitHub Pages).
export default defineConfig({
  base: './',
});
