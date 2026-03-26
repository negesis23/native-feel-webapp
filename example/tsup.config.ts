import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/main.ts'],
  format: ['iife'],
  outDir: 'dist',
  target: 'es5', // Target ES5 for old webviews
  minify: true,
  clean: false, // Don't clean because prebuild/predev copies files to dist
  swc: true, // Use SWC for ES5 transpilation
  outExtension() {
    return {
      js: '.js' // Force the output file to be main.js
    }
  },
  esbuildOptions(options) {
    options.minifyIdentifiers = false; // Do not obfuscate
  }
});
