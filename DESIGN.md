# DESIGN — Duanda BI

**Dokumen desain visual & antarmuka**
Pendamping: `PRD.md`
Versi: 1.0

---

## 1. Arah Desain

### 1.1 Siapa yang memakai ini

Tiga orang dengan kebutuhan yang sangat berbeda:

- **Rina (Stock)** berdiri di dekat kiriman barang, tangan kotor, buru-buru. Butuh entri data yang cepat dan target sentuh yang besar.
- **Budi (Admin)** duduk di laptop, kerja borongan sekali seminggu. Butuh tabel padat dan alur impor yang jelas.
- **Pak Andi (Owner)** buka dari HP di sela-sela kegiatan. Butuh jawaban, bukan data mentah.

Ini bukan aplikasi konsumen. Ini pengganti spreadsheet. Kualitas desainnya diukur dari **seberapa cepat orang menemukan angka yang mereka cari**, bukan dari seberapa cantik tampilannya.

### 1.2 Konsep: Papan Dapur

Rujukan visualnya bukan kafe hipster — melainkan **bagian belakang** kafe: meja prep stainless steel, label tanggal yang ditempel di wadah, papan tulis jadwal. Dingin, fungsional, dan yang paling penting: **waktu adalah informasi utama**. Di dapur, hal pertama yang orang cek dari sebuah wadah adalah tanggalnya.

Itu jadi prinsip desain utama produk ini: **status kesegaran adalah warna paling menonjol di seluruh antarmuka.** Bukan logo, bukan tombol utama. Kalau ada sesuatu yang mau kadaluarsa, itulah yang paling terang di layar.

### 1.3 Yang sengaja dihindari

| Dihindari | Alasan |
|---|---|
| Palet cokelat kopi / krem hangat | Klise coffee shop, dan pada aplikasi operasional bikin angka susah dibaca |
| Kartu bersudut membulat seragam di segala hal | Menghilangkan hierarki. Di sini kepadatan lebih penting dari kelapangan |
| Gradien sebagai dekorasi | Tidak menyampaikan informasi apa pun |
| Label huruf kapital semua di atas setiap judul | Ruang layar terbuang, tidak menambah kejelasan |
| Animasi masuk di tiap seksi | Memperlambat orang yang datang untuk mencari satu angka |

### 1.4 Prinsip

1. **Kepadatan itu ramah.** Pengguna ini datang dari Excel. Tabel dengan 40 baris terlihat lebih baik daripada 8 kartu besar.
2. **Warna hanya untuk arti.** Kalau sesuatu berwarna, itu karena statusnya. Elemen netral tetap netral.
3. **Angka disejajarkan, satuan diredam.** `Rp 1.250.000` — bagian "Rp" lebih redup dari angkanya.
4. **Setiap layar menjawab satu pertanyaan.** Kalau sebuah halaman menjawab dua pertanyaan, itu dua halaman.
5. **Keadaan kosong adalah instruksi.** "Belum ada data" itu buntu. "Unggah penjualan minggu ini untuk mulai" itu arahan.

---

## 2. Token Desain

### 2.1 Warna

```css
:root {
  /* Netral — dasar dingin, bukan krem */
  --ink:           #14181D;   /* teks utama */
  --ink-muted:     #5A6673;   /* label, satuan, teks sekunder */
  --ink-faint:     #8A94A0;   /* placeholder, teks nonaktif */
  --surface:       #F6F7F9;   /* latar aplikasi */
  --panel:         #FFFFFF;   /* latar tabel, panel, modal */
  --panel-sunken:  #EEF1F4;   /* baris header tabel, area input */
  --line:          #E0E4E9;   /* garis pemisah */
  --line-strong:   #C6CDD5;   /* garis pembatas struktural */

  /* Brand — teal baja, terinspirasi peralatan dapur */
  --brand:         #1B4D57;
  --brand-hover:   #16404A;
  --brand-soft:    #E4EEF0;   /* latar badge, baris terpilih */
  --brand-on:      #FFFFFF;

  /* Status kesegaran — inilah palet paling penting di produk ini */
  --fresh:         #2F7D4F;   /* Aman        — sisa > 7 hari */
  --fresh-bg:      #E7F3EC;
  --watch:         #C08400;   /* Waspada     — sisa 4–7 hari */
  --watch-bg:      #FBF2DC;
  --critical:      #D9541E;   /* Kritis      — sisa 1–3 hari */
  --critical-bg:   #FCEBE2;
  --expired:       #B02418;   /* Kadaluarsa  — sisa ≤ 0 */
  --expired-bg:    #FAE6E4;

  /* Semantik finansial */
  --gain:          #2F7D4F;   /* naik/untung */
  --loss:          #B02418;   /* turun/rugi */

  /* Rel identitas peran — pita tipis di tepi sidebar */
  --role-stock:    #3E8A93;
  --role-admin:    #6B5CA5;
  --role-owner:    #1B4D57;

  /* Urutan warna grafik — dipilih agar bisa dibedakan
     oleh penderita buta warna dan tetap jelas saat dicetak abu-abu */
  --viz-1: #1B4D57;
  --viz-2: #3E8A93;
  --viz-3: #7FB8AE;
  --viz-4: #C08400;
  --viz-5: #D9541E;
  --viz-6: #6B5CA5;
  --viz-7: #A8B2BC;

  --focus-ring:    #3E8A93;
}
```

**Mode gelap** (untuk pemakaian malam di outlet):

```css
[data-theme="dark"] {
  --ink:          #E8ECF0;
  --ink-muted:    #9AA5B1;
  --ink-faint:    #6B7683;
  --surface:      #101418;
  --panel:        #171C21;
  --panel-sunken: #1E242A;
  --line:         #2A3138;
  --line-strong:  #3A434C;
  --brand:        #4E9BA6;
  --brand-soft:   #163034;
  --fresh:   #4FAE77;  --fresh-bg:    #14281D;
  --watch:   #DBA537;  --watch-bg:    #2B220E;
  --critical:#E87848;  --critical-bg: #2E1A11;
  --expired: #D95F52;  --expired-bg:  #2E1512;
}
```

### 2.2 Tipografi

Dua peran, dua keluarga huruf:

| Peran | Keluarga | Kenapa |
|---|---|---|
| Antarmuka & teks | **Archivo** | Grotesk dengan bentuk agak sempit — muat lebih banyak di header tabel tanpa terasa sesak. Punya berat 400–700 yang jelas bedanya. |
| Angka di tabel & KPI | **JetBrains Mono** | Lebar digit seragam, jadi kolom rupiah tersejajar rapi. **Hanya untuk angka**, tidak untuk label — memakai monospace pada label adalah dekorasi tanpa fungsi. |

```css
--font-ui:  'Archivo', system-ui, -apple-system, sans-serif;
--font-num: 'JetBrains Mono', ui-monospace, monospace;
```

Skala tipe:

| Token | Ukuran / Tinggi baris | Berat | Dipakai untuk |
|---|---|---|---|
| `display` | 32 / 38 | 700 | Angka KPI besar |
| `h1` | 24 / 32 | 600 | Judul halaman |
| `h2` | 18 / 26 | 600 | Judul seksi |
| `h3` | 15 / 22 | 600 | Judul kartu, header grup |
| `body` | 14 / 21 | 400 | Teks umum |
| `body-strong` | 14 / 21 | 500 | Penekanan dalam teks |
| `small` | 13 / 19 | 400 | Isi sel tabel |
| `caption` | 12 / 16 | 400 | Label, satuan, teks bantuan |
| `num-lg` | 28 / 34 | 600 | Nilai KPI |
| `num-md` | 14 / 20 | 500 | Angka di sel tabel |

Tracking: `-0.01em` untuk display dan h1. Sisanya normal. Panjang baris teks paragraf dibatasi 68 karakter.

### 2.3 Ruang & Bentuk

Kelipatan 4px: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64`

Radius **berbeda menurut fungsi**, bukan seragam:

```css
--radius-input:  4px;   /* input, tombol — presisi */
--radius-panel:  8px;   /* kartu, panel */
--radius-modal: 12px;   /* dialog, sheet */
--radius-pill: 999px;   /* badge status */
```

Bayangan dipakai sangat hemat — hanya untuk elemen yang benar-benar melayang:

```css
--shadow-dropdown: 0 4px 12px rgba(20, 24, 29, 0.10);
--shadow-modal:    0 16px 40px rgba(20, 24, 29, 0.18);
```

Kartu **tidak berbayang**. Kartu dibatasi garis `--line`. Ini menjaga tampilan tetap datar dan padat.

### 2.4 Grid

| Breakpoint | Lebar | Layout |
|---|---|---|
| `sm` | < 640px | Satu kolom. Sidebar jadi bilah tab bawah. Tabel jadi daftar kartu. |
| `md` | 640–1023px | Sidebar menciut jadi ikon. Grid 2 kolom. |
| `lg` | 1024–1439px | Sidebar penuh 240px. Grid 12 kolom, jarak 20px. |
| `xl` | ≥ 1440px | Konten dibatasi maksimal 1440px, ditengahkan. |

---

## 3. Komponen

### 3.1 Lencana Status (komponen paling penting)

Muncul di mana pun ada bahan atau batch. Pil dengan titik warna — **selalu ada teksnya**, warna saja tidak cukup untuk aksesibilitas.

```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ ● Aman  12 hari  │  │ ● Waspada 5 hari │  │ ● Kritis  2 hari │
└──────────────────┘  └──────────────────┘  └──────────────────┘
      hijau                 kuning                oranye
```

- Tinggi 22px, padding 8px, `--radius-pill`
- Latar `*-bg`, teks dan titik `*` sesuai status
- Sertakan `aria-label` yang menyebut status dan sisa hari

### 3.2 Kartu KPI

```
┌────────────────────────────────┐
│ Laba Kotor                     │  caption, --ink-muted
│                                │
│ Rp 27.400.000        ↑ 8,2%    │  num-lg + delta
│                                │
│ vs minggu lalu Rp 25.320.000   │  caption, --ink-faint
└────────────────────────────────┘
```

- Delta berwarna `--gain` / `--loss`, disertai panah — jangan hanya warna
- Prefiks "Rp" pakai `--ink-muted` dan ukuran lebih kecil dari angkanya
- Bisa diklik untuk membuka rincian
- Saat memuat: kerangka abu-abu, jangan spinner

### 3.3 Tabel Data

Ini komponen yang paling sering dilihat. Perlakukan dengan serius.

```
┌─────────────────────────────────────────────────────────────────┐
│ [Cari…]         [Kategori ▾] [Status ▾]     245 baris  [Ekspor] │
├──────┬────────────────┬──────────┬──────────┬─────────┬─────────┤
│ SKU  │ Bahan          │ Sisa     │ Nilai    │ Status  │         │  ← header lengket
├──────┼────────────────┼──────────┼──────────┼─────────┼─────────┤
│1-B76 │ UHT            │ 42.500 g │ Rp 910k  │ ● Aman  │    ⋯    │
│1-B55 │ Oatside        │  4.200 g │ Rp 246k  │ ● Kritis│    ⋯    │
└──────┴────────────────┴──────────┴──────────┴─────────┴─────────┘
```

Aturan:
- Tinggi baris 40px. Padat, tapi masih bisa disentuh.
- Kolom angka rata kanan, pakai `--font-num`
- Kolom teks rata kiri
- Header lengket saat digulir
- Kolom pertama bisa dikunci saat menggulir horizontal
- Gulir horizontal, **jangan** kecilkan teks agar muat
- Baris hover: latar `--panel-sunken`
- Baris terpilih: latar `--brand-soft` + garis kiri 2px `--brand`
- Baris kadaluarsa: garis kiri 3px `--expired` (bukan seluruh baris merah — terlalu berisik)
- Urutkan dengan klik header; arah urutan ditandai panah
- 50 baris per halaman, atau gulir tak hingga di mobile

Di layar `sm`, tabel berubah jadi daftar kartu:

```
┌─────────────────────────────────┐
│ Oatside            ● Kritis     │
│ 1-B55                           │
│ Sisa 4.200 g  ·  Rp 246.000     │
│ Kadaluarsa 6 Sep 2026           │
└─────────────────────────────────┘
```

### 3.4 Pratinjau Impor

Layar terpenting dalam alur kerja mingguan. Dibagi tiga bagian.

```
┌──────────────────────────────────────────────────────────────┐
│  Pratinjau impor — restock_september.xlsx                    │
│  572 baris terbaca                                           │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                      │
│  │ 541      │ │ 24       │ │ 7        │                      │
│  │ Siap     │ │ Bahan    │ │ Bermasa- │                      │
│  │ masuk    │ │ baru     │ │ lah      │                      │
│  └──────────┘ └──────────┘ └──────────┘                      │
│   hijau        kuning       merah                            │
│                                                              │
│  [Semua] [Siap] [Bahan baru] [Bermasalah]        ← filter    │
├──────────────────────────────────────────────────────────────┤
│ ⬤ │ 12 │ Oatside  │ 60.000 g │ Rp 3.510.000 │ 7 Jan  │      │
│ ⬤ │ 13 │ Kentang  │ —        │ Rp 1.880.000 │ 7 Jan  │ ⚠    │
│      └─ Jumlah kosong. [Isi sekarang ▸]                      │
├──────────────────────────────────────────────────────────────┤
│                        [Batal]  [Simpan 541 baris ke sistem] │
└──────────────────────────────────────────────────────────────┘
```

- Baris bermasalah bisa diperbaiki langsung di tempat
- Tombol simpan menyebut jumlahnya, biar jelas apa yang terjadi
- Setelah simpan, tampilkan ringkasan + tombol "Batalkan impor ini" yang aktif 24 jam

### 3.5 Grafik

Semua grafik memakai token `--viz-*` dengan urutan yang sama. Aturan:

- Sumbu Y selalu mulai dari nol untuk grafik batang
- Maksimal 6 seri; sisanya digabung jadi "Lainnya"
- Legenda di atas grafik, mendatar, bukan di samping (hemat lebar di mobile)
- Tooltip menampilkan nilai persis dengan format rupiah lengkap
- Garis grid horizontal `--line`, tipis, tanpa garis vertikal
- Tinggi minimal 240px, maksimal 400px

| Jenis grafik | Dipakai untuk |
|---|---|
| Garis | Tren pendapatan vs HPP per minggu |
| Batang | 15 bahan penyerap biaya terbesar |
| Batang horizontal | Peringkat menu terlaris |
| Donat | Komposisi penjualan per kategori |
| Sebar (scatter) | Matriks kuadran menu |
| Area bertumpuk | Proyeksi konsumsi bahan |

### 3.6 Matriks Kuadran

Grafik paling khas di produk ini. Kalau cuma satu visual yang boleh menonjol, ini yang dipilih.

```
Margin %
  ▲
  │  TEKA-TEKI          │  BINTANG
  │  untung, sepi       │  untung, laku
  │      ○   ○          │        ●    ●
  │        ○            │     ●     ●
──┼─────────────────────┼──────────────────▶ Volume
  │  ANJING             │  KUDA BEBAN
  │  sepi, tipis        │  laku, tipis
  │   ○  ○              │      ●   ●
  │     ○               │    ●
```

- Garis pembagi = median volume dan median margin (bukan nol)
- Ukuran titik = total kontribusi laba
- Label kuadran di sudut, warna `--ink-faint`, ukuran caption
- Hover memunculkan nama menu, klik membuka detail menu
- Di mobile: grafik tetap tampil tapi ditambah daftar teks per kuadran di bawahnya, karena titik terlalu kecil untuk disentuh

### 3.7 Panel Wawasan AI

Menampung keluaran Gemini. Harus **terlihat jelas berbeda** dari angka yang dihitung sistem, supaya Owner tahu mana fakta dan mana tafsiran.

```
┌────────────────────────────────────────────────────┐
│ Analisis AI          Dibuat 3 Sep 2026, 09:14  ↻   │
├────────────────────────────────────────────────────┤
│                                                    │
│  Status: ● Waspada                                 │
│                                                    │
│  Penjualan naik 8% tapi nilai bahan berisiko       │
│  kadaluarsa juga naik jadi Rp 1,25 juta. Oatside   │
│  dipesan 60kg sementara konsumsi 4 minggu          │
│  terakhir cuma 38kg per bulan.                     │
│                                                    │
│  ── Rekomendasi ─────────────────────────────      │
│  ▸ [Tinggi]  Kurangi pesanan Oatside jadi 40kg     │
│              Dasar: konsumsi 38kg/bulan, exp 14hr  │
│  ▸ [Sedang]  Naikkan harga Tahu Bakso Rp 2.000     │
│              Dasar: margin 31%, di bawah rata2 54% │
│                                                    │
│  Analisis dibuat AI dari data agregat. Angka       │
│  prediksi berasal dari perhitungan sistem.         │
└────────────────────────────────────────────────────┘
```

- Latar `--panel` dengan garis kiri 3px `--role-admin` (ungu) — menandai "ini keluaran mesin"
- Selalu tampilkan waktu pembuatan dan tombol muat ulang
- Setiap rekomendasi **wajib** menyertakan barisan "Dasar:" yang menyebut angkanya
- Catatan kaki penyangkalan selalu ada, ukuran caption

### 3.8 Formulir

- Label di atas kolom isian, bukan di samping (lebih baik di mobile)
- Tinggi kolom isian 40px, 44px di mobile
- Teks bantuan di bawah kolom, `caption`, `--ink-muted`
- Error di bawah kolom, `--expired`, dengan ikon — jangan hanya warna
- Kolom wajib ditandai `*` setelah label
- Kolom yang saling terkait dikelompokkan dengan garis tipis dan judul `h3`
- Isian otomatis (misal biaya per unit, tanggal kadaluarsa) diberi latar `--brand-soft` dan teks bantuan "Terhitung otomatis, bisa diubah"

### 3.9 Keadaan Kosong

Jangan pernah tampilkan sekadar "Tidak ada data".

| Layar | Isi keadaan kosong |
|---|---|
| Daftar bahan | "Belum ada bahan terdaftar. Unggah file restock atau tambah satu per satu." + dua tombol |
| Penjualan | "Data penjualan minggu ini belum masuk. Unggah rekap dari kasir." + tombol unggah + tautan template |
| Kadaluarsa | "Tidak ada bahan yang mendekati kadaluarsa. Semua batch masih di atas 7 hari." (ini kabar baik, sampaikan begitu) |
| Forecast | "Forecast butuh minimal 4 minggu data. Sekarang baru ada 2 minggu." + bilah kemajuan |

---

## 4. Kerangka Halaman

### 4.1 Rangka Aplikasi

```
┌──────────────────────────────────────────────────────────────┐
│▌ Duanda BI          Minggu 36 · 1–7 Sep    🔔 3   Rina ▾     │  56px
├─┬────────────────────────────────────────────────────────────┤
│▌│                                                            │
│▌│  ← rel peran, 3px, warnanya sesuai peran                   │
│▌│                                                            │
│ │  Sidebar 240px          Area konten                        │
│ │                                                            │
│ │  Beranda                                                   │
│ │  Bahan                                                     │
│ │  Restock                                                   │
│ │  Kadaluarsa   ③  ← lencana angka                           │
│ │  Waste                                                     │
│ │                                                            │
└─┴────────────────────────────────────────────────────────────┘
```

Rel peran adalah pita 3px di tepi kiri sidebar. Warnanya berbeda per peran (`--role-stock` teal, `--role-admin` ungu, `--role-owner` teal tua). Ini isyarat halus tapi cukup untuk mencegah orang bingung sedang login sebagai siapa — lebih baik daripada membuat tiga tema warna terpisah, yang bikin produk terasa seperti tiga aplikasi berbeda.

Di mobile, sidebar diganti bilah tab bawah berisi maksimal 5 tujuan.

### 4.2 Dashboard Stock

Menjawab: *"Apa yang harus saya kerjakan hari ini?"*

```
┌────────────────────────────────────────────────────────────┐
│  Beranda Stock                            [+ Restock baru] │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  7 bahan perlu perhatian                             │  │  ← paling atas,
│  │  ●●●●●●●○○○○○○○○○○○○○  Rp 1.250.000 berisiko         │  │    paling menonjol
│  │  [Lihat daftar ▸]                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐     │
│  │ 104 bahan     │ │ 12 menipis    │ │ Rp 48,2 jt    │     │
│  │ aktif         │ │ perlu pesan   │ │ nilai stok    │     │
│  └───────────────┘ └───────────────┘ └───────────────┘     │
│                                                            │
│  Akan kadaluarsa 7 hari ke depan                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Bahan     │ Batch      │ Sisa   │ Exp   │ Nilai      │  │
│  │ Oatside   │ 12 Ags     │ 4.200g │ 2 hr  │ Rp 246.000 │  │
│  │ Selada    │ 28 Ags     │ 12 prs │ 3 hr  │ Rp   6.000 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  Restock terakhir                          [Lihat semua ▸] │
│  └── tabel ringkas 5 baris                                 │
└────────────────────────────────────────────────────────────┘
```

Bilah bertitik di kartu paling atas adalah 20 titik yang mewakili batch aktif, diwarnai sesuai status kesegaran. Sekilas pandang langsung terlihat porsi mana yang bermasalah. Ini pengganti "big number + gradien" yang biasa.

### 4.3 Dashboard Admin

Menjawab: *"Apa yang belum saya selesaikan minggu ini?"*

```
┌────────────────────────────────────────────────────────────┐
│  Beranda Admin                                             │
│                                                            │
│  Minggu 36 · 1–7 September                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ○ Data penjualan minggu ini belum diunggah           │ │
│  │    [Unggah rekap penjualan]  [Unduh template]         │ │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐     │
│  │ 116 menu      │ │ 14 menu       │ │ 4 impor       │     │
│  │ terdaftar     │ │ tanpa resep ⚠ │ │ bulan ini     │     │
│  └───────────────┘ └───────────────┘ └───────────────┘     │
│                                                            │
│  Menu tanpa resep                                          │
│  Menu ini tidak masuk hitungan HPP dan konsumsi bahan.     │
│  └── daftar + tombol "Isi resep" per baris                 │
│                                                            │
│  Riwayat impor                                             │
│  └── tabel: file, tanggal, baris, status, [batalkan]       │
└────────────────────────────────────────────────────────────┘
```

### 4.4 Dashboard Owner

Menjawab: *"Bisnis saya sedang bagaimana?"*

Bagian pembuka bukan angka besar, melainkan **kalimat penilaian**. Owner yang membuka dari HP dapat jawabannya dalam satu detik, baru kemudian menggali ke angkanya.

```
┌────────────────────────────────────────────────────────────┐
│  [Minggu ini ▾]                          [Ekspor] [↻ AI]   │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ● Waspada                                           │  │
│  │                                                      │  │
│  │  Penjualan naik 8%, tapi Rp 1,25 juta bahan          │  │  ← "hero"
│  │  berisiko kadaluarsa minggu ini.                     │  │
│  │                                                      │  │
│  │  Pendapatan  Laba kotor   Margin    Nilai stok       │  │
│  │  Rp 45,0 jt  Rp 27,4 jt   60,9%     Rp 48,2 jt       │  │
│  │  ↑ 8,2%      ↑ 5,1%       ↓ 1,8pp   ↑ 3,0%           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌────────────────────────────┐ ┌────────────────────────┐ │
│  │ Pendapatan vs HPP          │ │ Komposisi kategori     │ │
│  │ [grafik garis 12 minggu]   │ │ [donat]                │ │
│  └────────────────────────────┘ └────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Peta posisi menu                                     │  │
│  │ [matriks kuadran]                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Analisis AI  →  panel 3.7                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  Menu paling menguntungkan / Bahan penyerap biaya          │
│  └── dua tabel bersebelahan                                │
└────────────────────────────────────────────────────────────┘
```

Kalimat penilaian di kartu pembuka dirakit sistem dari aturan sederhana (bukan AI), supaya selalu muncul walau Gemini sedang gagal:

```
Kalau nilai_risiko_kadaluarsa > 5% pendapatan  → "Waspada"
Kalau margin turun > 5pp dari minggu lalu      → "Waspada"
Kalau ada bahan dengan hari_tersisa < lead_time→ "Waspada"
Kalau ≥ 2 kondisi di atas terpenuhi            → "Bahaya"
Selain itu                                     → "Aman"
```

### 4.5 Halaman Forecast (Owner)

```
┌────────────────────────────────────────────────────────────┐
│  Proyeksi         [Minggu depan | Bulan depan]             │
│                                                            │
│  Akurasi prediksi terakhir: MAPE 18,4%      ← transparansi │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Prediksi penjualan  [grafik garis + area kepercayaan]│  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  Kebutuhan bahan minggu depan                              │
│  ┌───────────┬──────────┬─────────┬──────────┬──────────┐  │
│  │ Bahan     │ Prediksi │ Sisa    │ Perlu    │ Batas    │  │
│  │           │ pakai    │ stok    │ pesan    │ exp      │  │
│  ├───────────┼──────────┼─────────┼──────────┼──────────┤  │
│  │ UHT       │ 38.000 g │ 42.500g │      —   │          │  │
│  │ Beans     │  8.400 g │  3.100g │  5.900 g │ maks 11k │  │
│  └───────────┴──────────┴─────────┴──────────┴──────────┘  │
│                                                            │
│  Kolom "Batas exp" adalah jumlah maksimal yang masih       │
│  habis sebelum kadaluarsa. Pesan melebihi ini berisiko     │
│  terbuang.                                                 │
│                                                            │
│  Peringkat menu   [Terlaris|Sepi|Untung besar|Untung tipis]│
│  └── tabel bisa ditukar tabnya                             │
│                                                            │
│  Saran pengembangan  →  panel AI                           │
└────────────────────────────────────────────────────────────┘
```

Kolom "Batas exp" adalah keputusan desain yang lahir langsung dari kendala bisnisnya: karena semua bahan kadaluarsa dalam 14 hari, rekomendasi jumlah pesan tanpa batas atas justru berbahaya. Menampilkan batas itu di sebelah angka rekomendasi mencegah kesalahan yang paling mahal.

---

## 5. Gerak

Sedikit dan hanya sebagai respons atas tindakan pengguna.

| Interaksi | Perlakuan |
|---|---|
| Modal / sheet muncul | Naik 8px + pudar, 180ms, `cubic-bezier(0.2, 0, 0, 1)` |
| Baris tabel bertambah setelah impor | Sorot latar `--fresh-bg` selama 1,2 detik lalu pudar |
| Nilai KPI berubah | Angka bergulir 400ms |
| Grafik pertama tampil | Garis tergambar dari kiri, 500ms, sekali saja |
| Muat data | Kerangka abu-abu, bukan spinner |
| Kesalahan validasi | Getar horizontal 2px, dua kali, 120ms |

Semuanya hormati `prefers-reduced-motion: reduce` — kalau diaktifkan, ganti dengan pudar sederhana atau tanpa animasi sama sekali.

---

## 6. Aksesibilitas

- Kontras teks minimal 4,5:1; teks besar 3:1
- **Status tidak pernah disampaikan hanya lewat warna** — selalu ada teks dan bentuk ikon
- Cincin fokus terlihat: garis luar 2px `--focus-ring`, jarak 2px
- Semua tabel pakai `<th scope>` yang benar
- Grafik punya tabel data yang setara, bisa dibuka lewat tombol "Lihat sebagai tabel"
- Target sentuh minimal 44×44px di mobile
- Perubahan penting diumumkan lewat `aria-live` (hasil impor, error)
- Bisa dioperasikan penuh dengan keyboard, termasuk navigasi tabel dengan panah

---

## 7. Bahasa Antarmuka

Bahasa Indonesia, kalimat biasa, bukan huruf kapital semua.

| Konteks | Contoh benar | Hindari |
|---|---|---|
| Tombol | "Simpan 541 baris" | "Submit" |
| Konfirmasi | "541 baris tersimpan" | "Operasi berhasil" |
| Error | "Kolom jumlah kosong di baris 13" | "Terjadi kesalahan" |
| Kosong | "Unggah rekap penjualan untuk mulai" | "Tidak ada data" |
| Bahaya | "Hapus bahan ini? Riwayat restocknya ikut hilang." | "Anda yakin?" |

Nama aksi konsisten dari awal sampai akhir: tombol "Unggah" menghasilkan pesan "Terunggah", bukan "Berhasil disimpan".

Format angka:

| Jenis | Format |
|---|---|
| Rupiah penuh | `Rp 1.250.000` |
| Rupiah ringkas (KPI) | `Rp 45,0 jt` / `Rp 1,2 M` |
| Desimal | koma — `21,42` |
| Persen | `60,9%` |
| Perubahan poin persen | `1,8pp` |
| Tanggal | `3 Sep 2026` |
| Rentang | `1–7 Sep 2026` |
| Minggu | `Minggu 36 · 1–7 Sep` |

---

## 8. Aset

| Aset | Keterangan |
|---|---|
| Ikon | Lucide, ukuran 16px di tabel, 20px di navigasi, ketebalan garis 1,5 |
| Logo | Wordmark "Duanda BI" dengan Archivo 700, tanpa ikon terpisah |
| Favicon | Monogram "D" putih di atas `--brand` |
| Font | Muat dari Google Fonts atau host sendiri; sertakan `font-display: swap` |
