# Dompet Rumah — Anggaran Keluarga

[![make.fun · best-household-budget-site-20261126-1457](https://make.fun/badge/best-household-budget-site-20261126-1457.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)
[![Rank](https://make.fun/badge/best-household-budget-site-20261126-1457/ichwann12/best-household-budget-site-20261126-1457/rank.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)
[![Reward](https://make.fun/badge/best-household-budget-site-20261126-1457/ichwann12/best-household-budget-site-20261126-1457/reward.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)

**Dompet Rumah** adalah situs anggaran rumah tangga yang berjalan sepenuhnya
dari file statis — tanpa permintaan jaringan, tanpa pelacak, tanpa akun.
Buka `app/index.html` di peramban desktop atau ponsel dan situs langsung
bekerja, dengan contoh angka nyata keluarga Indonesia.

## Keluarga contoh: Keluarga Pratama, November 2026

- **Pemasukan Rp 8.500.000/bulan** — gaji Rp 7.000.000 + usaha katering Rp 1.500.000
- **Pengeluaran Rp 7.241.000** — 25 catatan belanja terperinci (sewa, pasar, listrik, bensin, SPP, dan lain-lain)
- **Sisa Rp 1.259.000** — tingkat menabung 14,8%, target keluarga 15%
- **Anggaran Rp 7.600.000** terbagi ke 9 kategori; Makan di Luar sudah lewat anggaran (Rp 512.000 dari Rp 450.000)
- **3 tujuan tabungan** — Dana Darurat Rp 6,4 jt dari Rp 10 jt, Liburan Bali Rp 2,15 jt dari Rp 5 jt, Motor Baru Rp 4,8 jt dari Rp 15 jt
- **Tren 6 bulan** (Jun–Nov 2026) pemasukan vs pengeluaran

## Halaman (semua lewat tautan navigasi)

| Rute | Halaman | Yang bisa dilakukan |
| --- | --- | --- |
| `#/` | Dasbor | Ringkasan bulan, diagram lingkaran belanja per kategori, 5 belanja terakhir, tambah belanja cepat |
| `#/expenses` | Catat Belanja | Tambah pengeluaran, saring per kategori, cari catatan, hapus baris, kembalikan contoh awal |
| `#/budget` | Anggaran | Anggaran vs realisasi per kategori dengan bilah kemajuan dan status; ubah angka anggaran |
| `#/goals` | Tabungan | Bilah kemajuan tiap tujuan, tambah tabungan, buat tujuan baru |
| `#/trends` | Tren | Grafik batang pemasukan vs pengeluaran 6 bulan, rincian per bulan, saran hemat |

Semua perubahan tersimpan di perangkat (localStorage) dan langsung mengubah
total, diagram, dan bilah di semua halaman. Diagram digambar sendiri di
`<canvas>` dengan JavaScript murni — tanpa pustaka, tanpa CDN.

## Menjalankan

```sh
# layani app/ di http://localhost:8080
node serve.ts
# atau buka langsung
open app/index.html
```

## Struktur

- `app/index.html` — cangkang situs
- `app/style.css` — seluruh tampilan (font sistem, tanpa unduhan)
- `app/data.js` — data keluarga + angka turunan + penyimpanan
- `app/charts.js` — diagram lingkaran & grafik batang di canvas
- `app/views.js` — lima halaman
- `app/main.js` — router hash + semua pengendali
- `main.ts` — program penyerahan (menyalin app/ + screenshots/ dan menulis dossier.json)
- `screenshots/` — 4 tangkapan layar situs yang sedang berjalan

Lisensi: MIT.
