import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2015', // Transpile ke ES6 (batas terendah esbuild tanpa polyfill)
    modulePreload: { polyfill: false }, // Jangan polyfill
    emptyOutDir: false,
    minify: 'esbuild', // Minify OK
    rollupOptions: {
      input: 'index.html',
      output: {
        format: 'iife',
        entryFileNames: 'main.js',
        dir: 'dist',
        inlineDynamicImports: true
      }
    }
  },
  esbuild: {
    minifyIdentifiers: false,
    minifySyntax: true,
    minifyWhitespace: true,
    target: 'es5'
  },
  plugins: [
    {
      name: 'remove-module-type',
      enforce: 'post',
      transformIndexHtml(html) {
        return html.replace(/type="module" crossorigin/g, 'defer');
      }
    }
  ]
});