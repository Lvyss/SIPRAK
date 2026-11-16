# PLAN — SIPRAK

Kerjakan satu tahap per sesi, berurutan. Tahap dianggap selesai hanya jika semua "Definisi selesai" terpenuhi DAN manusia menyatakan lulus uji. Centang kotak setelah itu.

Prasyarat (manusia, sebelum Tahap 0): project Vite React-TS sudah dibuat dan `npm install` selesai; paket `@supabase/supabase-js`, `react-router-dom`, `tailwindcss`, `@tailwindcss/vite`, `lucide-react` terpasang; `supabase` terpasang sebagai dev dependency dan `npx supabase init` sudah dijalankan; file `.github/workflows/ci.yml` dan `migrate.yml` sudah ada di repo.

## [ ] Tahap 0 — Fondasi project
**Manusia (sekali di awal):**
- [ ] Repo di GitHub (private), workflow `ci.yml` dan `migrate.yml` ada
- [ ] 3 secret GitHub terisi: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SUPABASE_PROJECT_ID`
- [ ] Import repo ke Vercel, isi env, deploy pertama
- [ ] Supabase: "Confirm email" dimatikan (development) dan Redirect URLs diisi (localhost + domain Vercel)
- [ ] (Opsional) `.vscode/mcp.json` read-only + project_ref

**Tugas**
- `vercel.json` (SPA rewrite ke `/index.html`). Wajib sejak awal karena tautan reset password dan konfirmasi email mendarat di rute dalam.
- Bersihkan template Vite (hapus `App.css`, aset demo).
- Pasang dan verifikasi Tailwind v4 (plugin di `vite.config.ts`, `@import "tailwindcss"` di `index.css`). Definisikan warna primer `#2563EB` di `@theme` dan font Inter dengan fallback.
- Buat struktur folder sesuai SPEC §9.
- `src/lib/supabase.ts` (error jelas bila env kosong), `.env.example`, pastikan `.gitignore` mengabaikan `.env.local`.
- Komponen UI dasar: Button, Input, Textarea, FormField, Card, Badge, Modal, ConfirmDialog, Spinner, EmptyState, ErrorState, Toast.
- Helper: `format.ts` (tanggal WIB, ukuran file), `errors.ts` (peta error), `status.ts` (fungsi status submission), `constants.ts`.
- Router skeleton + `AppLayout` + halaman placeholder untuk semua rute SPEC §7 + halaman 404.
- `README.md`: cara menjalankan, daftar env.

**Definisi selesai:** `lint` dan `build` lulus; semua rute menampilkan placeholder; tidak ada secret di repo; Tailwind dan font tampil benar.

## [ ] Tahap 1 — Autentikasi, profil, peran
**Migrasi:** `foundation` (acuan: SPEC Lampiran A). Dibuat lewat `npx supabase migration new foundation`. Nama `0001`–`0004` di PLAN ini hanya urutan logis.

**Frontend**
- `AuthContext` (session, user, profile, roles, isAsprak, loading).
- `/auth` (masuk dan daftar), `/lupa-password`, `/reset-password`.
- `ProtectedRoute`, `RoleRoute`, `Navbar` dengan menu sesuai peran dan tombol keluar.
- `/profil`: edit nama, NIM, unggah foto (bucket `avatars`).
- `/dashboard` placeholder sesuai peran.

**Manusia:** setelah PR di-merge ke `main`, migrasi dijalankan otomatis oleh GitHub Actions (cek tab Actions hijau). JANGAN menjalankan SQL yang sama di SQL Editor. Lalu jalankan SQL asprak pertama (SPEC §11 butir 6).
**Definisi selesai**
- Daftar → profil dan peran praktikan otomatis terbentuk.
- Masuk, keluar, lupa/reset sandi berjalan.
- Matriks uji #1, #2, #3, #20 lulus.
- NIM duplikat menampilkan pesan yang benar.

## [ ] Tahap 2 — Kelas
**Migrasi:** `0002_classes.sql`.
**Frontend**
- `/kelas` (asprak: daftar + buat kelas; praktikan: daftar + gabung via kode).
- `/kelas/:classId` (header, kode + salin untuk asprak, tab Anggota, keluarkan anggota, edit/hapus kelas, keluar kelas untuk praktikan).
- Profil anggota tampil (nama, NIM) sesuai aturan lihat profil.
**Definisi selesai:** matriks uji #4–#7 dan #19 lulus; praktikan non-anggota tidak melihat kelas lain; hapus kelas meminta konfirmasi.

## [ ] Tahap 3 — Tugas dan pengumpulan
**Migrasi:** `0003_assignments_submissions.sql`.
**Frontend**
- Buat/edit/hapus tugas (asprak), daftar tugas di halaman kelas dengan status.
- `/tugas/:assignmentId` sisi praktikan: detail, sisa waktu, unggah/ganti file dengan validasi tipe dan ukuran, nama file disanitasi, alur ganti file di SPEC §8, unduh lewat signed URL.
- `src/lib/status.ts` dipakai konsisten di semua tampilan.
**Definisi selesai:** matriks uji #8–#13 lulus; keterlambatan dihitung server; file hanya bisa diakses pemiliknya.

## [ ] Tahap 4 — Penilaian, dashboard, kelola asprak
**Migrasi:** `0004_asprak_management.sql`.
**Frontend**
- `/tugas/:assignmentId` sisi asprak: tabel semua anggota, filter status, pencarian, hitungan per status.
- `/pengumpulan/:submissionId`: unduh file, nilai, feedback, simpan, batalkan nilai.
- `/dashboard` lengkap untuk kedua peran (SPEC §7).
- `/kelola-asprak`: daftar asprak + angkat by NIM.
**Definisi selesai:** matriks uji #14–#18 lulus; angka rekap cocok dengan data; praktikan melihat nilai dan feedback miliknya saja.

## [ ] Tahap 5 — Review keamanan, rapikan, siap deploy
**Tugas**
- Audit RLS dan grant setiap tabel, bucket, dan fungsi terhadap SPEC §4. Laporkan temuan berurutan dari yang paling berbahaya SEBELUM memperbaiki; tunggu persetujuan.
- Cari secret di kode dan riwayat file; pastikan hanya anon/publishable key yang dipakai.
- Rapikan tampilan mobile (360px), loading/empty/error, aksesibilitas dasar.
**Definisi selesai:** seluruh matriks uji SPEC §12 lulus; `lint` dan `build` lulus; temuan keamanan sudah diperbaiki atau dicatat.
**Manusia:** pastikan domain produksi ada di Redirect URLs Supabase, lalu ulangi uji #21 dan #22.