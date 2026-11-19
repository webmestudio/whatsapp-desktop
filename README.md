# whatsapp-desktop

> **Unofficial WhatsApp Desktop Client with Multi-Account Sidebar & Portable Support**  
> *Klien WhatsApp Desktop mandiri dengan dukungan Multi-Akun, Mode Portable, dan Fitur Privasi.*

[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20macOS-blue?style=flat-square)](https://github.com/oOthkOo/whatsapp-desktop)
[![Electron](https://img.shields.io/badge/Electron-17.4.11-47848F?style=flat-square&logo=electron)](https://www.electronjs.org/)
[![Node](https://img.shields.io/badge/Node-%3E%3D16-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-orange?style=flat-square)](LICENSE)

---

## 📌 Tentang / About

**whatsapp-desktop** (juga dikenal sebagai *WhatsApp Desktop Multi-Account*) adalah aplikasi desktop tidak resmi (unofficial) berbasis Electron yang dirancang untuk menjalankan beberapa akun WhatsApp Web secara bersamaan dalam satu jendela aplikasi melalui **Sidebar Multi-Akun**, lengkap dengan mode portable untuk Windows.

> **⚠️ Disclaimer:**  
> Aplikasi ini **BUKAN** produk resmi dari WhatsApp Inc. / Meta. Aplikasi ini tidak melakukan *reverse engineering* terhadap protokol WhatsApp dan tidak memodifikasi transmisi pesan. Seluruh komunikasi ditangani langsung oleh antarmuka resmi WhatsApp Web; aplikasi ini bertindak sebagai browser desktop wrapper native yang terisolasi.

---

## ✨ Fitur Utama (Key Features)

### 👥 1. Multi-Account Sidebar (Banyak Akun Sekaligus)
* **Sidebar Navigasi Cepat:** Beralih antar akun WhatsApp secara instan hanya dengan 1 klik pada ikon akun di bilah sisi kiri (sidebar).
* **Partisi Sesi Terisolasi (`persist:wa_account_*`):** Setiap akun memiliki sesi cookies, IndexedDB, dan cache terpisah sehingga akun-akun tidak akan saling tertukar atau logout saat akun lain dibuka.
* **Badge Notifikasi Real-time:** Jumlah pesan yang belum dibaca (unread count) ditampilkan langsung di atas avatar masing-masing akun.
* **Manajemen Akun Mudah:**
  * Tombol **`+` (Add Account)** untuk menambah akun baru.
  * **Klik Kanan Akun (Context Menu):** Ubah nama akun, muat ulang (reload) tab, keluar / reset sesi, atau hapus akun.

### 💼 2. Windows Portable Build Ready
* **Portable Tanpa Install:** Cukup jalankan file executable tanpa perlu melalui proses instalasi Windows.
* **True Portable Mode:** Jika dijalankan dalam mode portable, seluruh data sesi, pengaturan, dan akun tersimpan di dalam folder lokal `./data/` di samping file `WhatsApp.exe`. Anda dapat memindahkannya ke flashdisk atau komputer lain dengan sesi akun tetap tersimpan.
* **Otomasi Batch File (`.bat`):**
  * `start.bat`: Launcher interaktif untuk menjalankan versi portable atau development mode secara instan.
  * `build-portable.bat`: Skrip 1-klik untuk mem-package aplikasi ke Windows x64 Portable EXE.

### 🛡️ 3. Privasi & Keamanan Tampilan
* **Blur Gambar & Stiker:** Gambar dalam chat dikaburkan dan baru terlihat jelas saat kursor mouse diarahkan ke atasnya (*hover*).
* **Sembunyikan Avatar:** Menyembunyikan foto profil kontak pada daftar chat.
* **Sembunyikan Preview Pesan:** Menyembunyikan cuplikan teks pesan terakhir di bilah obrolan samping.

### ⚙️ 4. Pengaturan Lengkap (Dark Theme)
* Akses via tombol **Gear (Roda Gigi)** di sidebar footer.
* **Tema Gelap (Dark Mode):** Desain antarmuka gelap yang selaras dengan tema modern WhatsApp Web.
* **Ukuran Teks Chat:** Pilihan ukuran font (*Small, Normal, Large, X-Large*).
* **Pengaturan Proxy:** Mendukung HTTP dan HTTPS proxy.
* **System Tray:** Opsi menjalankan di background (system tray), *start minimized*, dan auto-launch saat Windows menyala.
* **Kustomisasi Lanjutan:** Dukungan custom CSS dan kustom gambar background obrolan.

---

## 🚀 Cara Memulai di Windows (Quick Start)

### A. Menjalankan Aplikasi Langsung (1-Klik)
Cukup klik ganda (double-click) file:
```cmd
start.bat
```
* Jika sudah ada build portable, Anda dapat langsung menjalankannya dengan menekan **`Enter`**.
* Jika belum pernah di-build, launcher akan otomatis memeriksa dependensi dan menjalankan mode development (`npm start`).

---

### B. Membuat Build Portable EXE Windows
Jalankan file batch:
```cmd
build-portable.bat
```
Atau via terminal:
```cmd
npm run build:win
```

Hasil build akan otomatis dibuat di folder:
```
build/dist/WhatsApp-win32-x64/
├── WhatsApp.exe           <-- Aplikasi Utama (Klik untuk membuka)
├── Buka-WhatsApp.bat      <-- Launcher Portable
├── portable.flag          <-- Penanda Mode Portable
├── data/                  <-- Tempat Sesi & Akun Tersimpan Lokal
└── ... (file pustaka Electron)
```

> 💡 **Tips:** Anda dapat menyalin atau mengompres folder `WhatsApp-win32-x64` tersebut ke flashdisk dan menjalankannya di komputer Windows manapun.

---

## 🛠️ Panduan Pengembangan (Development)

Pastikan [Node.js](https://nodejs.org/) (versi 16 atau lebih baru) telah terpasang di komputer Anda.

### 1. Kloning Repositori & Pasang Dependensi
```bash
git clone https://github.com/oOthkOo/whatsapp-desktop.git
cd whatsapp-desktop

# Install dependensi root & app
npm install
cd app && npm install && cd ..
```

### 2. Menjalankan Mode Development
```bash
npm start
```
Atau tanpa akselerasi sandbox:
```bash
npm run dev
```

---

## 📦 Skrip Build (NPM Scripts)

| Perintah NPM | Keterangan |
| :--- | :--- |
| `npm start` | Menjalankan aplikasi dalam mode development |
| `npm run build:win` | Mem-package portable Windows x64 (`build/dist/WhatsApp-win32-x64`) |
| `npm run build:portable` | Menjalankan skrip batch builder `build-portable.bat` |
| `npm run build:linux` | Mem-package untuk Linux 64-bit (`.deb`) |
| `npm run build:linux32` | Mem-package untuk Linux 32-bit (`.deb`) |
| `npm run build:osx` | Mem-package untuk macOS x64 (`.zip`) |
| `npm run build:osxm1` | Mem-package untuk macOS ARM64 / Apple Silicon (`.zip`) |
| `npm run build:all` | Membangun semua target platform |

---

## 📖 Panduan Penggunaan Sidebar Multi-Akun

```
 ┌───┐
 │ 🟢│  <-- Logo Aplikasi
 ├───┤
 │ A1│  <-- Akun 1 (Klik untuk beralih, Klik kanan untuk opsi)
 │ A2│  <-- Akun 2
 │ + │  <-- Tambah Akun Baru (Muncul dialog konfirmasi)
 ├───┤
 │ ⚙️│  <-- Pengaturan Aplikasi (Settings)
 └───┘
```

1. **Beralih Akun:** Klik pada bulatan inisial nama akun di sidebar.
2. **Tambah Akun Baru:** Klik tombol `+` di bawah daftar akun, ketik nama akun, lalu tekan **Tambah**.
3. **Opsi Akun (Klik Kanan):**
   * **Ubah Nama:** Mengganti label akun.
   * **Muat Ulang Tab:** Me-refresh halaman WhatsApp Web akun terkait.
   * **Keluar / Reset Sesi:** Menghapus data login akun ini sehingga QR code login baru dapat dipindai ulang.
   * **Hapus Akun:** Menghapus akun dari daftar multi-akun beserta partisi datanya.
4. **Pengaturan (Gear):** Klik ikon roda gigi di bagian bawah untuk mengatur privasi, tampilan, proxy, dan preferensi sistem.

---

## 📜 Lisensi (License)

Proyek ini didistribusikan di bawah lisensi **GNU General Public License v3.0 (GPL-3.0)**.  
Lihat file [`LICENSE`](file:///c:/Users/recello/Desktop/PROJECT/whatsapp-desktop/LICENSE) untuk rincian selengkapnya.

---

*Dikembangkan berdasarkan proyek open-source `whatsapp-desktop` dengan integrasi Multi-Account Architecture & Windows Portable Support.*
