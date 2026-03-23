# Native Canvas UI Framework

Sebuah framework User Interface (UI) revolusioner yang dibangun murni menggunakan **HTML5 Canvas** (2D Context). Framework ini dirancang khusus untuk memberikan performa maksimal, kontrol pixel-perfect, dan kompatibilitas ekstrem untuk dijalankan pada **WebView Android Jadul** maupun browser lawas.

Framework ini sepenuhnya **bebas dari DOM**, **bebas dari React**, **bebas dari Virtual DOM**, dan **tidak membutuhkan Polyfill/Babel**.

## 🚀 Fitur Utama

1.  **Pure Canvas Rendering (Zero DOM Overhead)**
    Seluruh antarmuka—mulai dari tombol, teks, hingga layout—dirender langsung ke dalam satu elemen `<canvas>`. Ini menghilangkan masalah perlambatan yang sering terjadi pada browser lama saat memproses ribuan elemen DOM HTML/CSS.
2.  **Ultra-Lightweight & ES5 Native**
    *Source code* telah di-refactor hingga ke level arsitektur untuk menggunakan standar **ES5 Murni** (tanpa `class`, tanpa Arrow Function `()=>{}`, tanpa `let/const`, tanpa `Map`/`Set`). Hal ini menjamin aplikasi Anda tidak akan *crash* di mesin JavaScript lawas.
3.  **No Polyfill & No Transpiler Needed**
    Proses *build* murni hanya melakukan *minification* menggunakan **Vite** dan **Terser** tanpa Babel atau polyfill raksasa yang membengkakkan ukuran bundle.
4.  **Fine-grained Reactivity (Signals)**
    Menggunakan sistem state management *Signals* (mirip Solid.js/Preact). Perubahan state hanya akan memicu *repaint* (penggambaran ulang) pada bagian Canvas yang membutuhkan, tanpa perlu melakukan kalkulasi *Virtual DOM diffing*. Dukungan penuh untuk *Local State* pada komponen.
5.  **XML-like Tagged Templates**
    Mendukung penulisan antarmuka secara deklaratif menggunakan tagged template literal `xml(...)`.
6.  **Material Design 3 (MD3) Theming built-in**
    Telah dilengkapi dengan sistem tema warna dinamik (termasuk Dark Mode dan Light Mode) serta animasi interaksi *Ripple Effect* standar Material Design 3. Mendukung perubahan warna (*seed color*) secara *real-time*.
7.  **Auto DPI & Resize Scaling**
    Secara otomatis menghitung `window.devicePixelRatio` dan ukuran container secara *real-time* untuk memastikan grafik tetap tajam (tidak buram/gepeng) dan area sentuh (*hit-test*) tidak meleset sekalipun toolbar browser mobile muncul/hilang.

---

## 📂 Struktur Proyek (Clean Architecture)

Proyek ini menggunakan standar struktur **Vite** yang sangat bersih:

```text
.
├── framework/                # CORE FRAMEWORK (Standalone Library)
│   ├── core/
│   │   ├── app.ts            # Entry point & Error handler (Red Screen of Death)
│   │   ├── compiler.ts       # XML Template parser & DOM mapper
│   │   ├── component.ts      # Base UI Component class (ES5 Prototype)
│   │   ├── engine.ts         # Canvas Render Loop, Event Listener & DPI Scaling
│   │   ├── reactivity.ts     # Sistem Signals (createSignal)
│   │   ├── router.ts         # Memory-based Router
│   │   └── theme.ts          # Generator warna Material Design 3
│   └── components/           # Komponen Primitif Bawaan
│       ├── Button.ts, TextField.ts, Layouts.ts, dll.
│
├── example/                  # APLIKASI CONTOH (User Space)
│   ├── screens/              # Tampilan UI Aplikasi (HomeScreen, AboutScreen)
│   ├── main.ts               # Inisialisasi aplikasi (Bootstrap)
│   ├── router.ts             # Definisi rute aplikasi
│   └── state.ts              # Global State (Signals)
│
├── public/                   # Asset statis (manifest.json, icon)
├── dist/                     # HASIL BUILD (Production Ready IIFE)
├── index.html                # Entry web (Memuat canvas dan script dari example/main.ts)
├── vite.config.ts            # Konfigurasi bundler Vite (diatur agar output ES5 aman)
└── package.json
```

---

## 🛠 Panduan Pengembangan

Framework ini menggunakan ekosistem **Vite** yang super cepat.

### Persiapan
Pastikan Anda sudah menjalankan instalasi *dependency*:
```bash
npm install
```

### Mode Pengembangan (Development)
Untuk menjalankan *live-server* dengan fitur *hot-reload* instan:
```bash
npm run dev
```
Buka browser di link lokal yang diberikan oleh Vite (biasanya `http://localhost:5173`).

### Mode Produksi (Build)
Untuk mem-build proyek ke dalam folder `dist/` dengan ukuran terkecil (agresif *minify* menggunakan Terser, tanpa mengubah/merusak syntax asli ES5):
```bash
npm run build
```
Hasil akhir adalah satu file HTML dan satu file `main.js` berformat **IIFE** yang siap ditempelkan langsung ke WebView Android/iOS.

---

## 💡 Cara Penggunaan Framework

### 1. Membuat Komponen (Reusable / Local State)
Anda dapat mendaftarkan komponen baru ke dalam `Compiler` dan memberikan State lokal menggunakan `createSignal`.

```typescript
import { xml, Compiler, createSignal } from '../framework/index';

Compiler.registerComponent('my-counter', function(props) {
  var count = createSignal(0);
  
  function increment() { count.value++; }

  return xml(
    ["<column padding=\"16\"><text text=\"", "\" /><button text=\"+\" on-click=\"", "\" /></column>"],
    count, increment
  );
});
```
*(Catatan: Penulisan string di atas adalah struktur ES5 mentah hasil kompilasi dari Tagged Template Literal ES6).*

### 2. Mendaftarkan Rute
Buat halaman (*screens*) lalu hubungkan ke Router.

```typescript
import { MemoryRouter } from '../framework/index';
import { HomeScreen } from './screens/HomeScreen';

export var appRouter = new MemoryRouter('/');
appRouter.addRoute('/', function() { return HomeScreen(); });
```

### 3. Inisialisasi Aplikasi
Framework menyediakan kelas `FrameworkApp` yang otomatis mengurus *Render Loop*, Tema, dan penangkapan Error (menampilkan layar merah *stacktrace* jika terjadi *crash*).

```typescript
import { FrameworkApp } from '../framework/index';
import { appRouter } from './router';

var canvas = document.getElementById('app');

var app = new FrameworkApp({
  canvas: canvas,
  router: appRouter,
  seedColor: '#4285F4',
  isDarkMode: true,
});

app.start();
```

---

## ⚠️ Filosofi Desain & Batasan

1. **JANGAN gunakan sintaks modern ES6+ di file sumber (Source Code).**
   Untuk menjaga kompatibilitas murni dengan WebView usang tanpa bantuan polyfill, tulislah kode menggunakan sintaks JavaScript klasik (ES5). Hindari `let`, `const`, `() => {}`, `class`, `` `string` ``, `Map`, `Set`, `Math.hypot`, atau fungsi Array modern.
2. **Event Handler:** Event klik (pointer) menggunakan `on-click`. Event ini berjalan murni dari deteksi tabrakan koordinat X/Y (Hit-Testing) di dalam buffer Canvas, bukan event DOM asli.
3. **Aksesibilitas (A11y) Terbatas:** Karena ini adalah aplikasi murni Canvas, *Screen Reader* tidak dapat secara otomatis membaca isi UI. Gunakan framework ini hanya untuk skenario UI grafis tertutup atau WebView internal.
