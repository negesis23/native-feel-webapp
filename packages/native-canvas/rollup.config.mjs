import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/native-canvas.js',
    format: 'iife',
    name: 'NativeCanvas'
  },
  plugins: [
    typescript({
      tsconfig: './tsconfig.json'
    }),
    terser({
      compress: {
        arrows: false,
        properties: false
      },
      format: {
        ecma: 5
      }
    })
  ]
};