import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    minify: 'terser',
    target: 'esnext',
    emptyOutDir: false,
    terserOptions: { compress: { arrows: false, properties: false }, format: { ecma: 5 } },
    rollupOptions: {
      input: 'example/main.ts',
      output: {
        format: 'iife',
        entryFileNames: 'main.js',
        dir: 'dist',
        inlineDynamicImports: true
      }
    }
  }
});