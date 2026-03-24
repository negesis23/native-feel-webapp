import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    minify: 'terser',
    target: 'es2015',
    terserOptions: { compress: { arrows: false, properties: false }, format: { ecma: 5 } },
    rollupOptions: {
      input: 'index.html',
      output: {
        format: 'iife',
        entryFileNames: 'main.js',
        inlineDynamicImports: true
      }
    }
  }
});