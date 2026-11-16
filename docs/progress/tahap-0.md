# Tahap 0 — Fondasi project

**Status:** Selesai setelah uji manual dinyatakan lulus oleh pengguna

**Tanggal:** 2026-11-16

## Ringkasan

Fondasi SIPRAK telah disiapkan dari template Vite: konfigurasi Tailwind CSS v4
dengan warna primer dan font Inter, klien Supabase, helper dasar, komponen UI,
serta kerangka layout dan seluruh rute pada SPEC. Rewrite SPA Vercel juga
tersedia untuk mendukung tautan langsung ke halaman dalam.

## Perubahan utama

- Template dan aset demo Vite dibersihkan.
- Supabase CLI diinisialisasi; `.env.example` disediakan dan `.env.local`
  diabaikan Git.
- Tipe dasar, format tanggal WIB/ukuran file, pemetaan error, status submission,
  dan konstanta ditambahkan.
- Komponen UI dasar, navigasi, placeholder halaman, dan halaman 404 ditambahkan.
- Workflow migrasi diperbarui agar `supabase db push --remote` menargetkan project
  Supabase yang tertaut, bukan local stack.

## Migrasi

Tidak ada migrasi SQL pada Tahap 0.

## Verifikasi

- `npm run lint` — lulus.
- `npm run build` — lulus dengan TypeScript strict.
- Rute `/` mengarah ke dashboard; rute dalam dapat dibuka langsung; rute tidak
  dikenal menampilkan halaman 404.
- Tailwind, warna primer, dan font Inter tampil pada halaman.
- Secret tidak disimpan di repo; `.env.local` tetap lokal.
