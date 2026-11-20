# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.4] - 2026-11-20

### Added
- **Multi-Account Sidebar**: Menjalankan beberapa akun WhatsApp Web secara bersamaan dengan navigasi instan pada bilah sisi kiri (sidebar).
- **Partisi Sesi Terisolasi**: Sesi cookies, IndexedDB, dan cache terpisah untuk tiap akun (`persist:wa_account_*`) agar tidak saling logout atau bentrok.
- **Badge Notifikasi Real-time**: Menampilkan jumlah pesan belum dibaca di atas avatar masing-masing akun.
- **Manajemen Akun Fleksibel**: Tambah akun baru, ubah nama (rename), muat ulang (reload), reset/keluar, dan hapus akun lewat menu klik kanan (*context menu*).
- **Windows Portable Mode**: Aplikasi dapat dijalankan langsung tanpa instalasi dengan seluruh data sesi tersimpan di folder lokal `./data/`.
- **Skrip Otomasi**:
  - `start.bat`: Launcher 1-klik untuk menjalankan mode portable maupun mode development.
  - `build-portable.bat`: Skrip otomatis mem-package aplikasi ke format Windows x64 Portable.
- **Fitur Privasi**:
  - Pengaburan (*blur*) otomatis untuk gambar dan stiker dalam chat sebelum disorot mouse (*hover*).
  - Opsi menyembunyikan cuplikan pesan terakhir dan avatar kontak pada daftar chat.
- **Tampilan & Pengaturan**:
  - Tampilan Tema Gelap (*Dark Theme*).
  - Pilihan ukuran font obrolan (*Small, Normal, Large, X-Large*).
  - Dukungan System Tray (*minimize to tray* dan *auto-start* saat Windows menyala).
