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

let ctx = await esbuild.context({
  entryPoints: ['src/main.ts'],
  bundle: true,
  outfile: 'dist/main.js',
  format: 'iife',
  target: 'es5',
  minifyIdentifiers: false,
  write: true
});

await ctx.watch();

let { host, port } = await ctx.serve({
  servedir: 'dist',
  port: 3000
});

console.log(`Development Server running at http://127.0.0.1:${port}`);
console.log(`Code will auto-recompile. Refresh the browser to see changes.`);