# Dashboard BI

Dashboard business intelligence dan forecasting untuk operasional coffee shop.
Menyatukan data restock bahan, penjualan menu, dan analisis yang menghubungkan
keduanya — berapa bahan terpakai, berapa sisa, berapa untung, berapa potensi
rugi karena kadaluarsa.

Acuan: [`PRD.md`](PRD.md) untuk kebutuhan, [`DESIGN.md`](DESIGN.md) untuk sistem
visual, [`MASTERPROMPT.md`](MASTERPROMPT.md) untuk urutan pembangunannya.

## Menjalankan

```bash
npm install
cp .env.example .env.local   # isi GEMINI_API_KEY
npm run dev                  # http://localhost:3000
```

Akun demo (kata sandi apa pun, minimal 8 karakter):

| Email | Peran |
|---|---|
| `andi@dashboardbi.id` | Owner |
| `budi@dashboardbi.id` | Admin |
| `rina@dashboardbi.id` | Stock |

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 — seluruh warna lewat token di `src/app/globals.css`
- Recharts untuk grafik, Lucide untuk ikon
- SheetJS (`xlsx`) untuk parsing impor Excel di sisi klien
- Gemini lewat Route Handler sendiri, tidak pernah dari browser

## Peta berkas

```
src/
  app/
    masuk/                 halaman login
    403/                   penolakan akses yang menjelaskan sebabnya
    stock/                 modul Stock  — bahan, restock, kadaluarsa, waste
    admin/                 modul Admin  — menu & resep, penjualan, impor
    owner/                 modul Owner  — analitik, proyeksi, laporan, pengguna
    api/analisis-ai/       Route Handler yang memanggil Gemini (server-only)
  components/
    app/                   rangka aplikasi, sesi, navigasi, notifikasi
    charts/                grafik Recharts + bingkai "Lihat sebagai tabel"
    panels/                panel AI, wizard impor, dialog waste, kartu penilaian
    ui/                    StatusBadge, KpiCard, DataTable, EmptyState, dll.
  lib/
    data/katalog.ts        katalog bahan, menu, resep, pemasok
    data/seed.ts           pembangkit data contoh yang deterministik
    data/queries.ts        padanan view di PRD 7.3, dihitung di memori
    forecast.ts            mesin baseline statistik (Lapisan 1)
    import/parser.ts       parser Excel restock & penjualan
    format.ts              format angka, rupiah, tanggal, minggu (id-ID)
    status.ts              ambang kesegaran, kuadran, label
```

## Keputusan yang perlu diketahui

**Angka tidak pernah datang dari AI.** Seluruh prediksi dihitung di
`src/lib/forecast.ts` — rata-rata bergerak tertimbang, indeks musiman, komponen
tren, Croston untuk menu jarang terjual, interval kepercayaan. Gemini hanya
menafsirkan angka yang sudah jadi. Kalau Gemini gagal, panel jatuh ke ringkasan
yang dirakit dari aturan biasa dan halaman tetap berguna.

**Kunci API hanya di server.** Dibaca lewat `process.env.GEMINI_API_KEY` di
`src/app/api/analisis-ai/route.ts`. Tidak ada prefix `NEXT_PUBLIC_`. Verifikasi:

```bash
npm run build && grep -r "AIza" .next/static | wc -l   # harus 0
```

**Status kesegaran adalah warna paling menonjol.** Token `--fresh` / `--watch` /
`--critical` / `--expired` dipakai untuk badge, titik, dan garis kiri baris.
Status selalu punya teks, tidak pernah hanya warna.

**Data masih dari seed, belum Supabase.** `src/lib/data/` sengaja dibentuk
seperti tabel dan view di PRD bagian 7, sehingga penggantian ke Supabase
terbatas pada modul itu dan `src/components/app/session.tsx`. Penjagaan peran
saat ini berjalan di klien; saat pindah ke Supabase, RLS dan middleware yang
menegakkannya.

**Tanggal acuan dipatok 3 September 2026** (`HARI_INI` di `src/lib/data/seed.ts`)
supaya angka contoh stabil dan cocok dengan PRD.
