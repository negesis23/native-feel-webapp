import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm', 'iife'],
  globalName: 'NativeCanvas',
  target: 'es5', // Force ES5 for compatibility
  minify: true,
  clean: true,
  dts: true, // Generate type definitions
  swc: true, // Use SWC for transpilation (no polyfills injected automatically)
  esbuildOptions(options) {
    options.minifyIdentifiers = false; // Do not obfuscate variable/function names
    options.minifySyntax = true;
    options.minifyWhitespace = true;
  }
});
