# SIPRAK

SIPRAK adalah aplikasi pengumpulan dan penilaian tugas praktikum untuk asprak
dan praktikan.

## Menjalankan aplikasi

1. Pastikan Node.js dan npm tersedia.
2. Pasang dependency dengan `npm install`.
3. Salin `.env.example` menjadi `.env.local`, lalu isi konfigurasi Supabase.
4. Jalankan `npm run dev` dan buka alamat yang ditampilkan Vite.

Perintah pemeriksaan:

- `npm run lint` — pemeriksaan kode.
- `npm run build` — pemeriksaan TypeScript dan build produksi.

## Environment variables

| Nama | Keterangan |
|---|---|
| `VITE_SUPABASE_URL` | Project URL Supabase |
| `VITE_SUPABASE_ANON_KEY` | Anon/publishable key Supabase; jangan gunakan `service_role` |

File `.env.local` tidak boleh dimasukkan ke Git. Nilai untuk deployment diatur
melalui environment variables di Vercel.
