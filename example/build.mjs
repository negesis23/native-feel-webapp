import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

function copyAssets() {
  if (!fs.existsSync('dist')) fs.mkdirSync('dist');
  if (fs.existsSync('public')) {
      const files = fs.readdirSync('public');
      for (const file of files) {
         if (fs.statSync(path.join('public', file)).isFile()) {
             fs.copyFileSync(path.join('public', file), path.join('dist', file));
         }
      }
  }
  fs.copyFileSync('index.html', 'dist/index.html');
}

copyAssets();

esbuild.build({
  entryPoints: ['src/main.ts'],
  bundle: true,
  outfile: 'dist/main.js',
  format: 'iife',
  target: 'es5',
  minifyWhitespace: true,
  minifySyntax: true,
  minifyIdentifiers: false
}).then(() => {
  console.log('App Build complete.');
}).catch(() => process.exit(1));