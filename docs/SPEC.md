# SPEC — SIPRAK

## 1. Ringkasan
Asprak membuat kelas dan tugas. Praktikan bergabung lewat kode kelas, mengumpulkan file (PDF/ZIP), lalu melihat nilai dan feedback. Asprak menilai dan memantau rekap.

**Di luar cakupan (jangan dibuat):** notifikasi email, komentar/diskusi, login Google/OAuth, pembayaran, kelompok/tim, riwayat versi file, cabut peran asprak dari UI, aplikasi mobile native.

## 2. Peran dan aturan bisnis
- Daftar baru otomatis berperan **praktikan** (trigger database).
- Asprak pertama ditetapkan manual lewat SQL (§11). Asprak berikutnya diangkat oleh asprak dari aplikasi (by NIM).
- Satu user boleh punya dua peran. Jika punya `asprak`, antarmuka memakai mode asprak.
- Kelas dimiliki satu asprak (`owner_id`). Hanya pemilik yang mengelola kelas, tugas, dan nilai kelas itu.
- Praktikan wajib mengisi NIM di profil sebelum bergabung ke kelas.
- Satu praktikan satu pengumpulan per tugas. File boleh diganti kapan saja selama BELUM dinilai.
- Mengumpulkan atau mengganti file setelah deadline tetap diterima, ditandai **terlambat** (dihitung server dari waktu unggah terakhir).
- Nilai 0 sampai `max_score` tugas (default 100). Asprak dapat membatalkan nilai (kosongkan) sehingga pengumpulan terbuka lagi.
- Status dihitung dari data, tidak disimpan:
  - `belum`: tidak ada baris submission (tampilkan tanda "lewat deadline" jika deadline lewat)
  - `terkumpul`: ada, nilai kosong, `is_late = false`
  - `terlambat`: ada, nilai kosong, `is_late = true`
  - `dinilai`: nilai terisi (tampilkan tag "terlambat" bila `is_late`)

## 3. Model data
| Tabel | Kolom penting | Constraint |
|---|---|---|
| `profiles` | id (= auth.users.id), full_name, nim, avatar_url, created_at, updated_at | nim unik, format `^[0-9A-Za-z]{5,20}$` atau null; full_name ≤ 100 |
| `user_roles` | id, user_id, role (enum `app_role`: asprak, praktikan) | unik (user_id, role) |
| `classes` | id, name, description, join_code, owner_id, timestamps | name 3–100; description ≤ 1000; join_code unik, 8 karakter dibuat database |
| `class_members` | id, class_id, user_id, joined_at | unik (class_id, user_id) |
| `assignments` | id, class_id, title, description, deadline (timestamptz), max_score, timestamps | title 3–150; description ≤ 5000; max_score 1–1000 |
| `submissions` | id, assignment_id, student_id, file_path, file_name, file_size, submitted_at, is_late, score, feedback, graded_at, graded_by, timestamps | unik (assignment_id, student_id); file_size ≤ 10485760; score ≥ 0; feedback ≤ 2000 |

Semua FK ke `auth.users` dan antar tabel memakai `on delete cascade`. Buat index pada: `classes(owner_id)`, `class_members(user_id)`, `assignments(class_id)`, `submissions(assignment_id)`, `submissions(student_id)`.
Kolom `join_code` memakai alfabet tanpa karakter ambigu (tanpa 0/O/1/I).

## 4. Keamanan (inti aplikasi ini)

### 4.1 Prinsip
1. RLS aktif di semua tabel; semua kebijakan `to authenticated` (tidak ada akses anon).
2. Cabut semua privilege dari `anon` dan `authenticated`, lalu beri hanya yang perlu, **per kolom** untuk insert/update (§4.2). Kolom sensitif (`join_code`, `is_late`, `graded_*`, `owner_id` setelah dibuat) tidak bisa ditulis klien.
3. Peran disimpan di `user_roles`, dicek lewat fungsi `security definer`. Tidak ada kebijakan insert/update/delete untuk user di `user_roles`.
4. Fungsi `security definer` wajib `set search_path = public`, di-`revoke execute` dari `public, anon`, dan di-`grant execute` ke `authenticated` seperlunya.
5. Pengubahan nilai/waktu/keterlambatan dijaga trigger, bukan dipercayakan ke klien.
6. Bucket Storage privat; file dibuka lewat signed URL berumur pendek (60 detik).
7. Tidak ada VIEW kecuali `security_invoker = true`. Agregasi rekap dilakukan di klien dari query ber-RLS.

### 4.2 Matriks akses
| Tabel | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| profiles | diri sendiri; asprak → anggota kelasnya; anggota → pemilik kelasnya | trigger saja | diri sendiri (kolom full_name, nim, avatar_url) | tidak ada |
| user_roles | peran sendiri | tidak ada | tidak ada | tidak ada |
| classes | pemilik atau anggota | asprak, owner_id = diri (kolom name, description, owner_id) | pemilik (kolom name, description) | pemilik |
| class_members | diri sendiri; pemilik kelas | hanya lewat `join_class(code)` | tidak ada | pemilik kelas (keluarkan) atau diri sendiri (keluar) |
| assignments | pemilik atau anggota kelas | pemilik kelas | pemilik kelas | pemilik kelas |
| submissions | pemilik baris (praktikan) atau pemilik kelas | praktikan anggota kelas untuk dirinya sendiri | praktikan: baris sendiri selama nilai kosong; pemilik kelas: nilai dan feedback | praktikan: baris sendiri selama nilai kosong |

### 4.3 Storage
- Bucket `submissions` (privat, 10 MB, mime `application/pdf`, `application/zip`, `application/x-zip-compressed`).
  Path: `{class_id}/{assignment_id}/{student_id}/{timestamp}-{nama_aman}.{ext}`.
  - Tulis/ubah/hapus: hanya pemilik folder `student_id`, anggota kelas, tugas milik kelas itu, dan belum dinilai.
  - Baca: pemilik folder atau pemilik kelas.
- Bucket `avatars` (privat, 2 MB, png/jpeg/webp). Path: `{user_id}/avatar-{timestamp}.{ext}`. Tulis hanya di folder sendiri; baca oleh semua user login.
- Nama file disanitasi di klien (huruf, angka, titik, strip, underscore); nama asli disimpan di `file_name`.

## 5. Fungsi database
| Fungsi | Tujuan |
|---|---|
| `has_role(user, role)` | cek peran (security definer) |
| `is_class_owner(user, class)`, `is_class_member(user, class)` | dipakai kebijakan RLS |
| `get_assignment_class(assignment)` | cari kelas dari tugas |
| `can_view_profile(viewer, target)` | aturan lihat profil |
| `join_class(code)` | gabung kelas: wajib login, peran praktikan, NIM terisi, kode valid; idempoten; mengembalikan class_id |
| `promote_to_asprak(nim)` | hanya asprak; cari profil by NIM; tambah peran asprak |
| `list_asprak()` | hanya asprak; daftar nama dan NIM semua asprak |
| `generate_join_code()` | kode acak 8 karakter unik |
| `submissions_guard()` (trigger) | menjaga kolom submission (lihat Lampiran A) |
| `can_write_submission_object(name, uid)` / `can_read_submission_object(name, uid)` | kebijakan Storage |

## 6. Alur pengguna
**Praktikan:** daftar → lengkapi nama dan NIM di /profil → masukkan kode di /kelas → lihat tugas → unggah PDF/ZIP → lihat status → setelah dinilai lihat nilai dan feedback.
**Asprak:** (ditetapkan via SQL) → buat kelas, dapat kode → bagikan kode → buat tugas + deadline → pantau siapa terkumpul/terlambat/belum → buka file, beri nilai dan feedback → pantau rekap → angkat asprak lain bila perlu.

## 7. Halaman dan rute
| Rute | Akses | Isi |
|---|---|---|
| `/auth` | publik | Tab Masuk / Daftar. Daftar: nama lengkap, email, kata sandi (min 8), konfirmasi. Kirim `full_name` lewat `options.data`. Jika belum ada sesi setelah daftar, tampilkan "Cek email untuk konfirmasi". |
| `/lupa-password` | publik | Input email → `resetPasswordForEmail` dengan `redirectTo = origin + /reset-password`. Selalu tampilkan pesan netral. |
| `/reset-password` | dari tautan email | Tangani event `PASSWORD_RECOVERY`, form kata sandi baru → `updateUser`. |
| `/` | login | Redirect ke `/dashboard`. |
| `/profil` | login | Edit nama, NIM, foto (png/jpg/webp ≤ 2 MB). Email read-only. Tampilkan peran. Tombol keluar. |
| `/dashboard` | login | **Asprak:** ringkasan per kelas (jumlah praktikan, tugas, terkumpul, terlambat, belum dinilai) + daftar "Perlu dinilai" (10 terbaru, tautan ke penilaian). **Praktikan:** "Tugas mendatang" (belum dikumpulkan, deadline terdekat), "Lewat deadline belum dikumpulkan", "Nilai terbaru" (5). |
| `/kelas` | login | **Asprak:** daftar kelas miliknya + tombol "Buat kelas" (modal). **Praktikan:** daftar kelas diikuti + input kode gabung (auto huruf besar). |
| `/kelas/:classId` | pemilik/anggota | Header (nama, deskripsi, nama pemilik). **Asprak:** kode gabung + tombol salin, edit/hapus kelas, tab Tugas dan Anggota (keluarkan anggota), tombol "Tambah tugas". **Praktikan:** daftar tugas dengan status, tombol "Keluar kelas". |
| `/kelas/:classId/tugas/baru` | asprak pemilik | Form: judul, deskripsi, deadline (`datetime-local`, dikonversi ke ISO), nilai maksimum. |
| `/tugas/:assignmentId/edit` | asprak pemilik | Form yang sama, terisi. Tombol hapus tugas (konfirmasi). |
| `/tugas/:assignmentId` | pemilik/anggota | **Asprak:** tabel semua anggota kelas (nama, NIM, status, waktu kumpul, nilai, aksi Nilai/Lihat), filter status, pencarian nama/NIM, jumlah per status. **Praktikan:** detail tugas, sisa waktu atau "terlewat", kartu status, area unggah, file saat ini (nama, ukuran, waktu, unduh), tombol ganti (nonaktif + penjelasan jika sudah dinilai), nilai dan feedback. |
| `/pengumpulan/:submissionId` | asprak pemilik | Info praktikan (nama, NIM), waktu kumpul, tag terlambat, tombol unduh (signed URL 60 detik), input nilai (0–max), feedback (≤ 2000), simpan, batalkan nilai. |
| `/kelola-asprak` | asprak | Daftar asprak (`list_asprak`) + form angkat asprak by NIM. |
| `*` | semua | Halaman 404. |

Penjaga rute di klien (`ProtectedRoute`, `RoleRoute`) hanya untuk UX. Keamanan sebenarnya di RLS.
Setiap halaman data: loading (skeleton/spinner), kosong (`EmptyState` dengan ajakan aksi), error (`ErrorState` + tombol coba lagi).

## 8. Validasi dan pesan error
- Email valid; kata sandi ≥ 8; nama 1–100; NIM `^[0-9A-Za-z]{5,20}$`; kode kelas 8 karakter; judul tugas 3–150; deadline wajib; nilai 0..max; feedback ≤ 2000; file PDF/ZIP ≤ 10 MB (cek ekstensi dan MIME).
- Peta error (`src/lib/errors.ts`): "Invalid login credentials" → "Email atau kata sandi salah"; kode `23505` → pesan sesuai konteks (mis. "NIM sudah dipakai"); `42501`/RLS → "Anda tidak memiliki akses"; pesan `raise exception` dari fungsi database sudah berbahasa Indonesia dan boleh ditampilkan apa adanya; selain itu → "Terjadi kesalahan. Coba lagi."
- Alur ganti file: unggah file baru → update baris submission → hapus file lama (best-effort). Jika update gagal, hapus file baru yang tadi diunggah.

## 9. Arsitektur frontend
```
src/
  main.tsx, App.tsx, index.css
  lib/        supabase.ts, format.ts, errors.ts, status.ts, constants.ts
  types/      index.ts   (tipe: Profile, Role, ClassRoom, Assignment, Submission, ...)
  contexts/   AuthContext.tsx   (session, user, profile, roles, isAsprak, loading, refreshProfile)
  hooks/      useAsync.ts, useCopyToClipboard.ts
  services/   authService, profileService, classService, memberService,
              assignmentService, submissionService, storageService, dashboardService, adminService
  components/
    ui/       Button, Input, Textarea, FormField, Card, Badge, Modal, ConfirmDialog,
              Spinner, EmptyState, ErrorState, Toast
    layout/   AppLayout, Navbar, ProtectedRoute, RoleRoute
    (komponen fitur: ClassCard, AssignmentRow, StatusBadge, FileUploader, ...)
  pages/      satu file per rute di §7
```
- `supabase.ts` membuat klien dari `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` (boleh berisi anon key lama atau publishable key). Lempar error jelas jika kosong.
- `AuthContext` berlangganan `onAuthStateChange`, memuat profil dan peran setelah sesi ada. Jangan lakukan query Supabase di dalam callback `onAuthStateChange` secara sinkron; jadwalkan setelahnya (mis. `setTimeout(..., 0)` atau efek terpisah) agar tidak deadlock.
- Klien hanya mengirim kolom yang diizinkan grant (§4.1 butir 2).
- Agregasi rekap dashboard dihitung di klien dari hasil query.
- Routing: `BrowserRouter`. Deploy Vercel butuh `vercel.json` rewrite (§Lampiran B).

## 10. Desain UI
- Gaya bersih dan minimalis, mobile-first. Warna utama biru `#2563EB` (definisikan di `@theme` Tailwind sebagai `--color-primary-*`), latar putih/abu muda, teks abu gelap. Font Inter dengan fallback `system-ui, sans-serif`.
- Tombol dan kartu sudut membulat (`rounded-lg`/`rounded-xl`), bayangan tipis.
- Badge status: belum = abu, terkumpul = biru, terlambat = kuning/oranye, dinilai = hijau. Jangan mengandalkan warna saja; sertakan teks.
- Navbar: logo, tautan Dashboard/Kelas (+ Kelola Asprak untuk asprak), menu profil. Collapse di mobile.
- Aksesibilitas: label form, `aria-*` pada modal, fokus terlihat, kontras cukup.
- Tanggal: format `dd MMM yyyy, HH.mm WIB` lewat `Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta' })`.

## 11. Setup manual (dilakukan manusia, bukan agen)
1. Buat project Supabase di akun sendiri. Catat Project URL dan anon/publishable key.
2. Buat `.env.local` (jangan di-commit) berisi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`. Buat juga `.env.example` tanpa nilai.
3. Authentication → Providers → Email aktif. Untuk development boleh menonaktifkan "Confirm email" (email bawaan Supabase punya batas kirim ketat). Aktifkan lagi atau pakai SMTP sendiri sebelum dipakai nyata.
4. Authentication → URL Configuration: Site URL `http://localhost:5173`; Redirect URLs tambah `http://localhost:5173/**` dan, setelah deploy, `https://NAMA-ANDA.vercel.app/**`.
5. Jalankan file migrasi di SQL Editor **berurutan** (0001, 0002, ...). Baca isinya dulu. Catat di `docs/progress/` migrasi mana yang sudah dijalankan.
6. Asprak pertama: daftar akun lewat aplikasi, lalu jalankan di SQL Editor:
```sql
   insert into public.user_roles (user_id, role)
   select id, 'asprak' from auth.users where email = 'EMAIL_ANDA'
   on conflict do nothing;
```

## 12. Matriks uji (akun: A = asprak pemilik kelas, B = asprak lain, P1 & P2 = praktikan anggota, P3 = praktikan bukan anggota)
| # | Skenario | Hasil yang diharapkan |
|---|---|---|
| 1 | Pendaftar baru | Otomatis praktikan; profil terbentuk |
| 2 | P1 mengubah perannya jadi asprak (lewat API/konsol) | Ditolak |
| 3 | P1 insert ke `user_roles` | Ditolak |
| 4 | P1 buat kelas | Ditolak |
| 5 | P3 melihat kelas, tugas, atau submission kelas A | Tidak melihat apa pun |
| 6 | P1 gabung kelas dengan kode valid tanpa NIM | Ditolak dengan pesan jelas |
| 7 | P1 gabung dengan kode valid + NIM | Berhasil; gabung dua kali tidak membuat duplikat |
| 8 | P1 membaca submission atau file milik P2 | Ditolak |
| 9 | P1 unggah file .exe atau > 10 MB | Ditolak (klien dan server) |
| 10 | P1 unggah ke path folder P2 | Ditolak |
| 11 | P1 mengumpulkan sebelum deadline | Status terkumpul, `is_late = false` |
| 12 | P1 mengumpulkan/mengganti setelah deadline | `is_late = true` (dihitung server, abaikan nilai kiriman klien) |
| 13 | P1 mengirim `score`, `feedback`, `is_late` sendiri | Diabaikan atau ditolak |
| 14 | B membuka/menilai submission kelas A | Ditolak |
| 15 | A menilai dengan nilai > max atau negatif | Ditolak |
| 16 | A menilai | Nilai tersimpan; `graded_at/by` terisi server |
| 17 | P1 mengganti file setelah dinilai | Ditolak (DB dan Storage) |
| 18 | A membatalkan nilai | P1 bisa mengganti file lagi |
| 19 | A mengubah `join_code` atau `owner_id` via API | Ditolak |
| 20 | Pengguna tanpa login mengakses tabel/Storage | Ditolak |
| 21 | Refresh di halaman dalam (setelah deploy) | Tidak 404 |
| 22 | Cari `service_role` atau secret di repo dan bundle | Tidak ada |

## Lampiran A — SQL acuan
Acuan perilaku keamanan. Agen boleh merapikan atau menyesuaikan sintaks, tapi PERILAKU dan batas hak aksesnya harus dipertahankan. Tidak ada yang sudah diuji; manusia membaca dan menguji sebelum dijalankan.

### 0001_foundation.sql
```sql
create type public.app_role as enum ('asprak', 'praktikan');

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 100),
  nim text unique check (nim is null or nim ~ '^[0-9A-Za-z]{5,20}$'),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(coalesce(new.raw_user_meta_data->>'full_name', ''), 100));
  insert into public.user_roles (user_id, role) values (new.id, 'praktikan');
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Hak akses
revoke all on public.profiles, public.user_roles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, nim, avatar_url) on public.profiles to authenticated;
grant select on public.user_roles to authenticated;
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Kebijakan (profil hanya milik sendiri dulu; diperluas di 0002)
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid());
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy user_roles_select_own on public.user_roles for select to authenticated
  using (user_id = auth.uid());
-- Sengaja TIDAK ada kebijakan insert/update/delete untuk user_roles.

-- Storage: avatars
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 2097152, array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

create policy avatars_select on storage.objects for select to authenticated
  using (bucket_id = 'avatars');
create policy avatars_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_update on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_delete on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
```

### 0002_classes.sql
```sql
create or replace function public.generate_join_code()
returns text language plpgsql security definer set search_path = public as $$
declare chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; code text; i int;
begin
  loop
    code := '';
    for i in 1..8 loop
      code := code || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    end loop;
    exit when not exists (select 1 from public.classes where join_code = code);
  end loop;
  return code;
end; $$;
-- dipakai sebagai default kolom; hanya mengembalikan kode acak, aman di-grant
grant execute on function public.generate_join_code() to authenticated;

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 100),
  description text check (description is null or char_length(description) <= 1000),
  join_code text not null unique default public.generate_join_code(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger classes_updated before update on public.classes
  for each row execute function public.set_updated_at();

create table public.class_members (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (class_id, user_id)
);
create index on public.classes (owner_id);
create index on public.class_members (user_id);

alter table public.classes enable row level security;
alter table public.class_members enable row level security;

create or replace function public.is_class_owner(_user_id uuid, _class_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.classes where id = _class_id and owner_id = _user_id);
$$;
create or replace function public.is_class_member(_user_id uuid, _class_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.class_members where class_id = _class_id and user_id = _user_id);
$$;
create or replace function public.can_view_profile(_viewer uuid, _target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.class_members m join public.classes c on c.id = m.class_id
    where (c.owner_id = _viewer and m.user_id = _target)
       or (m.user_id = _viewer and c.owner_id = _target));
$$;

create or replace function public.join_class(_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare _uid uuid := auth.uid(); _class_id uuid;
begin
  if _uid is null then raise exception 'Anda harus login'; end if;
  if not public.has_role(_uid, 'praktikan') then
    raise exception 'Hanya praktikan yang dapat bergabung ke kelas';
  end if;
  if not exists (select 1 from public.profiles where id = _uid and coalesce(trim(nim), '') <> '') then
    raise exception 'Lengkapi NIM di profil sebelum bergabung';
  end if;
  select id into _class_id from public.classes where join_code = upper(trim(_code));
  if _class_id is null then raise exception 'Kode kelas tidak ditemukan'; end if;
  insert into public.class_members (class_id, user_id) values (_class_id, _uid)
    on conflict (class_id, user_id) do nothing;
  return _class_id;
end; $$;

-- Pola grant fungsi (ulangi untuk is_class_owner, is_class_member, can_view_profile, join_class)
revoke execute on function public.join_class(text) from public, anon;
grant execute on function public.join_class(text) to authenticated;

-- Hak akses tabel
revoke all on public.classes, public.class_members from anon, authenticated;
grant select, delete on public.classes to authenticated;
grant insert (name, description, owner_id), update (name, description) on public.classes to authenticated;
grant select, delete on public.class_members to authenticated;

-- Kebijakan
create policy classes_select on public.classes for select to authenticated
  using (owner_id = auth.uid() or public.is_class_member(auth.uid(), id));
create policy classes_insert on public.classes for insert to authenticated
  with check (owner_id = auth.uid() and public.has_role(auth.uid(), 'asprak'));
create policy classes_update on public.classes for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy classes_delete on public.classes for delete to authenticated
  using (owner_id = auth.uid());

create policy members_select on public.class_members for select to authenticated
  using (user_id = auth.uid() or public.is_class_owner(auth.uid(), class_id));
create policy members_delete on public.class_members for delete to authenticated
  using (user_id = auth.uid() or public.is_class_owner(auth.uid(), class_id));
-- Tidak ada kebijakan insert: gabung hanya lewat join_class().

-- Perluas kebijakan profil
drop policy profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.can_view_profile(auth.uid(), id));
```

### 0003_assignments_submissions.sql
```sql
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 150),
  description text check (description is null or char_length(description) <= 5000),
  deadline timestamptz not null,
  max_score int not null default 100 check (max_score between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger assignments_updated before update on public.assignments
  for each row execute function public.set_updated_at();

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  file_size bigint check (file_size is null or file_size <= 10485760),
  submitted_at timestamptz not null default now(),
  is_late boolean not null default false,
  score numeric(6,2) check (score is null or score >= 0),
  feedback text check (feedback is null or char_length(feedback) <= 2000),
  graded_at timestamptz,
  graded_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id, student_id)
);
create trigger submissions_updated before update on public.submissions
  for each row execute function public.set_updated_at();
create index on public.assignments (class_id);
create index on public.submissions (assignment_id);
create index on public.submissions (student_id);

alter table public.assignments enable row level security;
alter table public.submissions enable row level security;

create or replace function public.get_assignment_class(_assignment_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select class_id from public.assignments where id = _assignment_id;
$$;
revoke execute on function public.get_assignment_class(uuid) from public, anon;
grant execute on function public.get_assignment_class(uuid) to authenticated;

-- Penjaga kolom submission
create or replace function public.submissions_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare _deadline timestamptz; _max int; _class uuid; _uid uuid := auth.uid();
begin
  if _uid is null then return new; end if; -- konteks admin (SQL Editor)
  select deadline, max_score, class_id into _deadline, _max, _class
    from public.assignments where id = new.assignment_id;

  if tg_op = 'INSERT' then
    new.submitted_at := now();
    new.is_late := now() > _deadline;
    new.score := null; new.feedback := null; new.graded_at := null; new.graded_by := null;
    return new;
  end if;

  if new.assignment_id <> old.assignment_id or new.student_id <> old.student_id then
    raise exception 'Tugas dan pemilik pengumpulan tidak boleh diubah';
  end if;

  if public.is_class_owner(_uid, _class) then
    -- asprak: hanya nilai dan feedback
    new.file_path := old.file_path; new.file_name := old.file_name; new.file_size := old.file_size;
    new.submitted_at := old.submitted_at; new.is_late := old.is_late;
    if new.score is not null and new.score > _max then
      raise exception 'Nilai tidak boleh melebihi %', _max;
    end if;
    if new.score is null then
      new.graded_at := null; new.graded_by := null;
    elsif new.score is distinct from old.score or new.feedback is distinct from old.feedback then
      new.graded_at := now(); new.graded_by := _uid;
    else
      new.graded_at := old.graded_at; new.graded_by := old.graded_by;
    end if;
  else
    -- praktikan: hanya file, dan hanya jika belum dinilai
    if old.score is not null then
      raise exception 'Pengumpulan sudah dinilai dan tidak bisa diubah';
    end if;
    new.score := null; new.feedback := null; new.graded_at := null; new.graded_by := null;
    if new.file_path is distinct from old.file_path then
      new.submitted_at := now(); new.is_late := now() > _deadline;
    else
      new.submitted_at := old.submitted_at; new.is_late := old.is_late;
    end if;
  end if;
  return new;
end; $$;
create trigger submissions_guard before insert or update on public.submissions
  for each row execute function public.submissions_guard();

-- Hak akses tabel
revoke all on public.assignments, public.submissions from anon, authenticated;
grant select, delete on public.assignments to authenticated;
grant insert (class_id, title, description, deadline, max_score),
      update (title, description, deadline, max_score) on public.assignments to authenticated;
grant select, delete on public.submissions to authenticated;
grant insert (assignment_id, student_id, file_path, file_name, file_size),
      update (file_path, file_name, file_size, score, feedback) on public.submissions to authenticated;

-- Kebijakan assignments
create policy assignments_select on public.assignments for select to authenticated
  using (public.is_class_owner(auth.uid(), class_id) or public.is_class_member(auth.uid(), class_id));
create policy assignments_insert on public.assignments for insert to authenticated
  with check (public.is_class_owner(auth.uid(), class_id));
create policy assignments_update on public.assignments for update to authenticated
  using (public.is_class_owner(auth.uid(), class_id))
  with check (public.is_class_owner(auth.uid(), class_id));
create policy assignments_delete on public.assignments for delete to authenticated
  using (public.is_class_owner(auth.uid(), class_id));

-- Kebijakan submissions
create policy submissions_select on public.submissions for select to authenticated
  using (student_id = auth.uid()
      or public.is_class_owner(auth.uid(), public.get_assignment_class(assignment_id)));
create policy submissions_insert on public.submissions for insert to authenticated
  with check (student_id = auth.uid()
      and public.is_class_member(auth.uid(), public.get_assignment_class(assignment_id)));
create policy submissions_update_student on public.submissions for update to authenticated
  using (student_id = auth.uid() and score is null
      and public.is_class_member(auth.uid(), public.get_assignment_class(assignment_id)))
  with check (student_id = auth.uid()
      and public.is_class_member(auth.uid(), public.get_assignment_class(assignment_id)));
create policy submissions_update_owner on public.submissions for update to authenticated
  using (public.is_class_owner(auth.uid(), public.get_assignment_class(assignment_id)))
  with check (public.is_class_owner(auth.uid(), public.get_assignment_class(assignment_id)));
create policy submissions_delete_student on public.submissions for delete to authenticated
  using (student_id = auth.uid() and score is null);

-- Storage: bucket submissions
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('submissions', 'submissions', false, 10485760,
        array['application/pdf','application/zip','application/x-zip-compressed'])
on conflict (id) do nothing;

-- Path: {class_id}/{assignment_id}/{student_id}/{file}
create or replace function public.can_write_submission_object(_name text, _uid uuid)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare parts text[] := string_to_array(_name, '/'); _class uuid; _assignment uuid; _student uuid;
begin
  if coalesce(array_length(parts, 1), 0) < 4 then return false; end if;
  begin
    _class := parts[1]::uuid; _assignment := parts[2]::uuid; _student := parts[3]::uuid;
  exception when others then return false;
  end;
  if _student <> _uid then return false; end if;
  if not exists (select 1 from public.assignments where id = _assignment and class_id = _class) then return false; end if;
  if not public.is_class_member(_uid, _class) then return false; end if;
  if exists (select 1 from public.submissions
             where assignment_id = _assignment and student_id = _uid and score is not null) then return false; end if;
  return true;
end; $$;

create or replace function public.can_read_submission_object(_name text, _uid uuid)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare parts text[] := string_to_array(_name, '/'); _class uuid;
begin
  if coalesce(array_length(parts, 1), 0) < 4 then return false; end if;
  if parts[3] = _uid::text then return true; end if;
  begin _class := parts[1]::uuid; exception when others then return false; end;
  return public.is_class_owner(_uid, _class);
end; $$;

revoke execute on function public.can_write_submission_object(text, uuid) from public, anon;
revoke execute on function public.can_read_submission_object(text, uuid) from public, anon;
grant execute on function public.can_write_submission_object(text, uuid) to authenticated;
grant execute on function public.can_read_submission_object(text, uuid) to authenticated;

create policy submissions_obj_select on storage.objects for select to authenticated
  using (bucket_id = 'submissions' and public.can_read_submission_object(name, auth.uid()));
create policy submissions_obj_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'submissions' and public.can_write_submission_object(name, auth.uid()));
create policy submissions_obj_update on storage.objects for update to authenticated
  using (bucket_id = 'submissions' and public.can_write_submission_object(name, auth.uid()))
  with check (bucket_id = 'submissions' and public.can_write_submission_object(name, auth.uid()));
create policy submissions_obj_delete on storage.objects for delete to authenticated
  using (bucket_id = 'submissions' and public.can_write_submission_object(name, auth.uid()));
```

### 0004_asprak_management.sql
```sql
create or replace function public.promote_to_asprak(_nim text)
returns void language plpgsql security definer set search_path = public as $$
declare _target uuid;
begin
  if not public.has_role(auth.uid(), 'asprak') then
    raise exception 'Hanya asprak yang dapat mengangkat asprak';
  end if;
  select id into _target from public.profiles where nim = trim(_nim);
  if _target is null then raise exception 'NIM tidak ditemukan'; end if;
  insert into public.user_roles (user_id, role) values (_target, 'asprak')
    on conflict (user_id, role) do nothing;
end; $$;

create or replace function public.list_asprak()
returns table (user_id uuid, full_name text, nim text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'asprak') then
    raise exception 'Hanya asprak yang dapat melihat daftar asprak';
  end if;
  return query
    select p.id, p.full_name, p.nim from public.profiles p
    join public.user_roles r on r.user_id = p.id and r.role = 'asprak'
    order by p.full_name;
end; $$;

revoke execute on function public.promote_to_asprak(text) from public, anon;
revoke execute on function public.list_asprak() from public, anon;
grant execute on function public.promote_to_asprak(text) to authenticated;
grant execute on function public.list_asprak() to authenticated;
```

## Lampiran B — `vercel.json` (SPA)
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```
Environment variables di Vercel: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.