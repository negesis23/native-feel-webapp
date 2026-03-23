import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // Gunakan esbuild hanya untuk minification, tapi kita atur agar tidak melakukan transpile
    minify: 'terser', 
    target: 'esnext', // Jangan biarkan Vite mem-polyfill atau transpile kode ES5 kita
    modulePreload: { polyfill: false },
    terserOptions: {
      compress: {
        arrows: false,
        properties: false,
      },
      format: {
        ecma: 5,
      }
    },
    rollupOptions: {
      input: 'index.html',
      output: {
        format: 'iife',
        dir: 'dist',
        entryFileNames: 'main.js',
        inlineDynamicImports: true, // Allow IIFE to bundle everything
      }
    }
  }
});
