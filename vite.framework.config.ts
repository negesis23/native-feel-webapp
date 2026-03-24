import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    minify: 'terser',
    target: 'esnext',
    emptyOutDir: false,
    terserOptions: { compress: { arrows: false, properties: false }, format: { ecma: 5 } },
    lib: {
      entry: 'framework/index.ts',
      name: 'NativeCanvas',
      formats: ['iife'],
      fileName: () => 'native-canvas.js'
    }
  }
});