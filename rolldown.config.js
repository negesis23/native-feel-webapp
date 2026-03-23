import { defineConfig } from 'rolldown';

export default defineConfig([
  // 1. Framework Library
  {
    input: 'framework/index.ts',
    output: {
      file: 'native-canvas.js',
      dir: 'dist',
      format: 'iife',
      name: 'NativeCanvas',
      minify: true,
    },
  },
  // 2. Example App
  {
    input: 'example/main.ts',
    output: {
      file: 'main.js',
      dir: 'dist',
      format: 'iife',
      minify: true,
    },
  }
]);
