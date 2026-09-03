# PRD — Business Intelligence & Forecasting Dashboard untuk Coffee Shop

**Nama Produk (sementara):** Duanda BI
**Versi:** 1.0
**Tanggal:** 3 September 2026
**Status:** Draft untuk implementasi

---

## 1. Ringkasan Eksekutif

Duanda BI adalah dashboard internal coffee shop yang menyatukan tiga hal yang selama ini terpisah di file Excel:

1. **Data restock bahan baku** (apa yang dibeli, berapa, dari siapa, berapa harganya)
2. **Data penjualan menu** (menu apa yang laku, berapa banyak, harga berapa)
3. **Analisis** yang menghubungkan keduanya — berapa bahan yang terpakai, berapa sisa, berapa untung, berapa potensi rugi karena kadaluarsa

Di atas itu ada lapisan **forecasting berbasis AI** yang memberi peringkat performa menu, memprediksi kebutuhan minggu/bulan depan, dan memberi rekomendasi pengembangan bisnis.

Sistem punya tiga peran pengguna dengan dashboard yang berbeda: **Stock**, **Admin**, dan **Owner**.

---

## 2. Latar Belakang & Masalah

Saat ini semua data ada di satu file Excel dua sheet:

- Sheet `stock ` — 572 baris transaksi restock, 104 bahan unik, rentang Desember 2024 sampai 2025
- Sheet `produk terjual` — 116 menu dengan angka penjualan per bulan sepanjang 2025

Masalah dengan pendekatan Excel:

| Masalah | Dampak |
|---|---|
| Tidak ada penghubung antara menu dan bahan | Tidak bisa tahu bahan mana yang terpakai untuk penjualan minggu ini |
| Tidak ada perhitungan stok berjalan (running balance) | Tidak tahu sisa stok riil, sering kehabisan atau kelebihan |
| Tidak ada data kadaluarsa | Bahan busuk baru ketahuan saat dibuang |
| Harga bahan berubah tiap restock | HPP menu tidak pernah akurat, margin cuma tebakan |
| Rekap manual | Owner baru lihat laporan berminggu-minggu kemudian |
| Data granularitas bulanan | Terlalu kasar untuk keputusan restock mingguan |

---

## 3. Tujuan & Metrik Keberhasilan

### 3.1 Tujuan Produk

| # | Tujuan |
|---|---|
| G1 | Satu sumber kebenaran untuk stok, penjualan, dan biaya |
| G2 | Owner bisa melihat kondisi bisnis kapan saja tanpa minta rekap manual |
| G3 | Mengurangi bahan terbuang karena kadaluarsa |
| G4 | Membuat keputusan restock berdasarkan proyeksi, bukan feeling |
| G5 | Tahu menu mana yang sebenarnya menguntungkan (bukan sekadar yang laku) |

### 3.2 Metrik

| Metrik | Baseline | Target |
|---|---|---|
| Waktu input data stok mingguan | ~2 jam manual | < 15 menit (via import Excel) |
| Waktu Owner mendapat laporan | Mingguan/manual | Realtime |
| Nilai bahan terbuang per bulan | Belum terukur | Terukur, lalu turun 30% dalam 3 bulan |
| Akurasi forecast penjualan (MAPE) | — | < 25% untuk 20 menu teratas |
| Menu dengan HPP terhitung | 0% | 100% |

---

## 4. Pengguna & Peran

### 4.1 Matriks Peran

| Fitur | Stock | Admin | Owner |
|---|:---:|:---:|:---:|
| Login | ✅ | ✅ | ✅ |
| CRUD master bahan | ✅ | 👁️ | 👁️ |
| Input restock manual | ✅ | ❌ | 👁️ |
| Import Excel restock | ✅ | ❌ | ❌ |
| Catat bahan terbuang (waste) | ✅ | ❌ | 👁️ |
| Lihat peringatan kadaluarsa | ✅ | 👁️ | ✅ |
| CRUD master menu | ❌ | ✅ | 👁️ |
| CRUD resep (menu → bahan) | 👁️ | ✅ | 👁️ |
| Import Excel penjualan | ❌ | ✅ | ❌ |
| Input penjualan manual | ❌ | ✅ | ❌ |
| Dashboard analitik penuh | ❌ | Terbatas | ✅ |
| Laporan laba/rugi | ❌ | ❌ | ✅ |
| Forecasting AI | ❌ | ❌ | ✅ |
| Kelola pengguna | ❌ | ❌ | ✅ |
| Ekspor laporan (PDF/Excel) | ❌ | ✅ | ✅ |

Legenda: ✅ penuh · 👁️ hanya baca · ❌ tidak ada akses

### 4.2 Persona

**Rina — Staf Stock**
Setiap Senin pagi menerima kiriman dari pemasok. Butuh input cepat: scan invoice, upload Excel, atau ketik satu-satu. Dia juga yang paling perlu tahu bahan mana yang mau kadaluarsa supaya bisa diprioritaskan pemakaiannya.

**Budi — Admin**
Setiap akhir minggu menarik laporan penjualan dari kasir/POS, lalu unggah ke sistem. Dia juga yang merawat daftar menu dan resepnya. Butuh feedback cepat kalau ada menu di file penjualan yang belum terdaftar di sistem.

**Pak Andi — Owner**
Tidak mau input data. Mau buka dashboard dan langsung paham: minggu ini untung berapa, menu apa yang jalan, bahan apa yang menumpuk, dan minggu depan aman atau tidak. Sering buka dari HP.

---

## 5. Ruang Lingkup

### 5.1 Termasuk (v1.0)

- Autentikasi dan otorisasi berbasis peran
- Master data: bahan, pemasok, menu, resep
- Transaksi: restock (manual + import Excel), penjualan (manual + import Excel), waste
- Perhitungan otomatis: stok berjalan, HPP menu, konsumsi bahan, risiko kadaluarsa
- Dashboard terpisah per peran
- Forecasting hybrid (statistik + AI)
- Ekspor laporan

### 5.2 Tidak Termasuk (v1.0)

- Integrasi langsung ke POS/kasir (v1 pakai import Excel)
- Manajemen pembayaran/kasir
- Aplikasi mobile native (web responsif saja)
- Multi-cabang (v1 asumsi satu outlet)
- Manajemen karyawan/absensi
- Purchase order otomatis ke pemasok

---

## 6. Analisis Data Sumber

### 6.1 Sheet `stock ` (572 baris)

Struktur nyata di file:

```
Baris 1: RESTOCK INVENTARIS  (judul)
Baris 2: header
Baris 3+: data
```

| Kolom | Header | Contoh | Catatan Parsing |
|---|---|---|---|
| A | `#` | 1 | Nomor urut, abaikan |
| B | `BAHAN` | `1UHT` | **Ada prefix `1` yang harus dibuang** |
| C | `SKU INTERNAL` | `1-B76` | Kunci utama bahan |
| D | `PEMASOK` | `Two Seasons` | |
| E | `JUMLAH` | 240000 | |
| F | `SATUAN` | `g` | g, pc, porsi, sachet, lbr, butir, botol, tube, cup |
| G–H | `TOTAL BIAYA` | `Rp` \| 5140000 | **Kolom G berisi label "Rp", nilai di kolom H** |
| I–J | `BIAYA PER UNIT` | `Rp` \| 21.42 | **Sama, label di I, nilai di J** |
| K | `TANGGAL PEMESANAN` | 2025-01-07 | |
| L | `STATUS PEMESANAN` | `Arrived` | |
| M | `CATATAN` | `invoice TS 030` | |

**Temuan penting:**
- 104 bahan unik, satu bahan bisa muncul belasan kali (contoh: `1UHT` 13 kali) → ini **log transaksi**, bukan master data. Master bahan harus di-derive dengan mengambil nilai unik per SKU.
- Harga per unit **berubah tiap pembelian** (contoh Beans: Rp220 di Januari, Rp230 di Desember 2024). HPP harus pakai harga bergerak, bukan harga tetap.
- Ada 3 baris kosong dan 1 bahan tanpa SKU (`1Martabak Mini`) → parser harus tahan data kotor.
- Kategori tersirat dari prefix SKU: `B` = beverage/bahan minuman, `K` = kitchen/bahan dapur, `H` = handling/kemasan, `L` = logistik/bahan segar, `P`/`C` = base/premix.

### 6.2 Sheet `produk terjual` (116 menu)

Format **wide** — satu baris per menu, satu kolom per bulan. Harus di-*unpivot* ke format long saat impor.

| Kolom | Header | Contoh | Catatan |
|---|---|---|---|
| B | `ITEM` | 1 | Nomor urut |
| C | `Nama Menu` | `_Kopi Klasik - ICE` | **Ada prefix `_` yang harus dibuang** |
| D | `SKU` | `Psc01` | Kunci menu |
| E–F | `HARGA JUAL` | `Rp` \| 20000 | Label di E, nilai di F |
| G–R | `JANUARY`–`DECEMBER` | 127, 275, … | Qty terjual per bulan |
| S | `TOTAL TERJUAL` | 7603 | Hasil penjumlahan, hitung ulang jangan percaya |

**Temuan penting:**
- Baris 110–116 bukan menu jual, tapi **komponen base** (`1Basic Espresso`, `1Simple Syrup`, `1Rice`) dengan "harga" yang sebenarnya biaya per unit. Ini harus dipisahkan ke tabel bahan, bukan menu.
- Distribusi penjualan sangat timpang: menu teratas 7.603 porsi/tahun, sementara belasan menu 0 porsi. Model forecast harus menangani menu jarang terjual (*intermittent demand*) secara berbeda.
- Ada menu musiman/baru: `_Chicken Katsu Teriyaki` mulai muncul Juli, `_Klasik + Oat` mulai November. Forecast tidak boleh menganggap bulan-bulan nol sebagai penurunan.
- Data hanya granularitas **bulanan**, sementara sistem baru butuh **mingguan**. Data historis 2025 dipakai sebagai baseline musiman; data mingguan mulai dikumpulkan dari sistem berjalan.

### 6.3 Data yang Harus Dibuat (belum ada di Excel)

| Data | Cara Pengadaan |
|---|---|
| **Resep / BOM** (menu → bahan + takaran) | Di-seed dengan estimasi wajar, lalu dikoreksi manual oleh Admin lewat UI |
| **Masa simpan (shelf life)** | Default **14 hari** untuk semua bahan sesuai instruksi. Field bisa diedit per bahan. |
| **Stok minimum (reorder point)** | Dihitung otomatis dari rata-rata konsumsi × lead time, bisa dioverride manual |
| **Data penjualan mingguan** | Terkumpul dari import mingguan mulai sistem berjalan |

---

## 7. Model Data

### 7.1 Diagram Relasi

```
profiles ──┐
           │
suppliers ─┴─< restock_batches >── ingredients ──< recipe_items >── menus
                     │                  │                            │
                     │                  └──< waste_logs              │
                     │                                               │
              (FEFO consumption)                              sales_records
                     │                                               │
                     └──────────< stock_movements >──────────────────┘
                                                                     │
                                                               forecasts
```

### 7.2 Tabel

#### `profiles`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid PK | referensi ke auth.users |
| nama_lengkap | text | |
| role | enum | `stock` \| `admin` \| `owner` |
| is_active | boolean | default true |
| created_at | timestamptz | |

#### `suppliers`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid PK | |
| nama | text unique | contoh: Two Seasons |
| kontak | text | nullable |
| lead_time_hari | int | default 3, dipakai untuk reorder point |

#### `ingredients` (master bahan)
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid PK | |
| sku | text unique | `1-B76` |
| nama | text | `UHT` (prefix sudah dibersihkan) |
| kategori | enum | `beverage` \| `kitchen` \| `packaging` \| `fresh` \| `base` |
| satuan | text | g, pc, porsi, sachet, lbr, butir, botol, tube, cup |
| shelf_life_hari | int | **default 14** |
| stok_minimum | numeric | nullable, auto-hitung kalau kosong |
| harga_per_unit_terakhir | numeric | di-update tiap restock baru |
| is_active | boolean | |

#### `restock_batches` (transaksi masuk — satu baris = satu batch)
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid PK | |
| ingredient_id | uuid FK | |
| supplier_id | uuid FK | nullable |
| jumlah | numeric | qty awal batch |
| sisa_qty | numeric | **berkurang saat dikonsumsi (FEFO)** |
| satuan | text | |
| total_biaya | numeric | |
| biaya_per_unit | numeric | disimpan per batch — inilah kunci HPP akurat |
| tanggal_pemesanan | date | |
| tanggal_terima | date | default = tanggal_pemesanan kalau kosong |
| tanggal_kadaluarsa | date | **generated: tanggal_terima + shelf_life_hari** |
| status | enum | `ordered` \| `arrived` \| `cancelled` |
| catatan | text | |
| import_batch_id | uuid | nullable, untuk rollback impor |

#### `menus`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid PK | |
| sku | text unique | `Psc01` |
| nama | text | `Kopi Klasik - ICE` |
| kategori | enum | `coffee` \| `non-coffee` \| `snack` \| `rice` \| `add-on` |
| harga_jual | numeric | |
| is_active | boolean | |

#### `recipe_items` (BOM)
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid PK | |
| menu_id | uuid FK | |
| ingredient_id | uuid FK | |
| qty_per_porsi | numeric | |
| satuan | text | harus cocok dengan satuan bahan |
| is_optional | boolean | untuk topping/add-on |

Unique constraint: `(menu_id, ingredient_id)`

#### `sales_records`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid PK | |
| menu_id | uuid FK | |
| periode_mulai | date | |
| periode_selesai | date | |
| granularitas | enum | `weekly` \| `monthly` |
| qty_terjual | int | |
| harga_saat_itu | numeric | snapshot harga, jangan ambil dari menus |
| import_batch_id | uuid | nullable |

Unique constraint: `(menu_id, periode_mulai, granularitas)` — mencegah dobel impor.

#### `stock_movements` (buku besar stok)
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid PK | |
| ingredient_id | uuid FK | |
| batch_id | uuid FK | nullable |
| tipe | enum | `in` \| `consumption` \| `waste` \| `adjustment` |
| qty | numeric | positif untuk in, negatif untuk keluar |
| ref_id | uuid | id sales_record / waste_log / restock_batch |
| tanggal | date | |
| created_by | uuid FK | |

#### `waste_logs`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid PK | |
| batch_id | uuid FK | |
| qty | numeric | |
| alasan | enum | `expired` \| `rusak` \| `tumpah` \| `lainnya` |
| nilai_kerugian | numeric | qty × biaya_per_unit batch |
| tanggal | date | |
| catatan | text | |

#### `import_logs`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid PK | |
| tipe | enum | `restock` \| `sales` |
| nama_file | text | |
| jumlah_baris | int | |
| jumlah_sukses | int | |
| jumlah_gagal | int | |
| detail_error | jsonb | |
| status | enum | `pending` \| `applied` \| `rolled_back` |
| created_by | uuid FK | |

#### `forecasts`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid PK | |
| tipe | enum | `demand` \| `ranking` \| `advisory` \| `risk` |
| horizon | enum | `next_week` \| `next_month` |
| periode_target | daterange | |
| baseline_json | jsonb | hasil hitungan statistik |
| ai_json | jsonb | hasil dari Gemini |
| model_digunakan | text | |
| created_at | timestamptz | |

### 7.3 View Turunan

| View | Isi |
|---|---|
| `v_stock_on_hand` | Sisa stok per bahan = SUM(sisa_qty batch aktif), plus nilai rupiahnya |
| `v_menu_hpp` | HPP per menu = Σ(qty_per_porsi × harga_per_unit_terakhir bahan) |
| `v_menu_profitability` | harga_jual, hpp, margin_rp, margin_persen, qty_terjual, total_profit |
| `v_ingredient_consumption` | Konsumsi bahan per periode = Σ(qty_terjual menu × qty_per_porsi) |
| `v_expiry_risk` | Batch dengan sisa_qty > 0 dan tanggal_kadaluarsa dalam 7 hari, plus nilai risiko |
| `v_weekly_pnl` | Pendapatan, HPP, laba kotor per minggu |

---

## 8. Kebutuhan Fungsional

### 8.1 Autentikasi (semua peran)

- **FR-A1** Login dengan email + password
- **FR-A2** Setelah login, pengguna diarahkan ke dashboard sesuai perannya
- **FR-A3** Otorisasi ditegakkan di level database (Row Level Security), bukan hanya di UI
- **FR-A4** Owner bisa mengundang, menonaktifkan, dan mengubah peran pengguna lain
- **FR-A5** Sesi otomatis berakhir setelah 12 jam tidak aktif

### 8.2 Modul Stock

**Master Bahan**
- **FR-S1** Tabel bahan dengan pencarian, filter kategori, filter status stok (aman/menipis/habis)
- **FR-S2** Tambah/ubah/nonaktifkan bahan. Menghapus bahan yang punya riwayat transaksi dilarang — hanya boleh dinonaktifkan
- **FR-S3** Field wajib: SKU, nama, kategori, satuan. Opsional: shelf life (default 14), stok minimum

**Restock Manual**
- **FR-S4** Form input satu batch: bahan, pemasok, jumlah, satuan, total biaya, tanggal pesan, status, catatan
- **FR-S5** Biaya per unit dihitung otomatis = total biaya ÷ jumlah, tapi bisa diisi manual sebagai override
- **FR-S6** Tanggal kadaluarsa terisi otomatis = tanggal terima + shelf life, bisa diubah manual
- **FR-S7** Mode input cepat: baris-per-baris seperti spreadsheet untuk memasukkan banyak batch sekaligus

**Import Excel Restock**
- **FR-S8** Unggah file `.xlsx`. Sistem membaca sheet yang namanya mengandung "stock" (case-insensitive, toleran spasi berlebih)
- **FR-S9** Parser harus menangani: prefix `1` pada nama bahan, kolom label "Rp" yang terpisah dari nilainya, baris kosong, dan baris tanpa SKU
- **FR-S10** Tampilkan **pratinjau sebelum menyimpan**: baris yang akan masuk (hijau), baris dengan bahan baru (kuning — minta konfirmasi buat bahan baru), baris error (merah + alasan)
- **FR-S11** Pengguna bisa memperbaiki baris error langsung di layar pratinjau
- **FR-S12** Deteksi duplikat: kombinasi SKU + tanggal + jumlah yang sama persis diberi tanda peringatan
- **FR-S13** Sediakan tombol unduh template Excel
- **FR-S14** Setiap impor tercatat di `import_logs` dan bisa di-rollback dalam 24 jam

**Waste & Kadaluarsa**
- **FR-S15** Halaman "Akan Kadaluarsa" — daftar batch yang exp dalam 7 hari, diurutkan paling mendesak, dengan nilai rupiahnya
- **FR-S16** Form catat waste: pilih batch, qty, alasan. Nilai kerugian terhitung otomatis
- **FR-S17** Notifikasi di dalam aplikasi saat ada bahan masuk zona kadaluarsa

### 8.3 Modul Admin

**Master Menu**
- **FR-M1** CRUD menu: SKU, nama, kategori, harga jual, status aktif
- **FR-M2** Tabel menu menampilkan HPP terhitung dan margin di sampingnya
- **FR-M3** Menu tanpa resep diberi badge peringatan "Resep belum diisi" — karena menu ini tidak akan terhitung di analisis konsumsi bahan

**Resep / BOM**
- **FR-M4** Editor resep per menu: tambah bahan + takaran per porsi
- **FR-M5** Saat resep diubah, HPP dan margin langsung terhitung ulang dan ditampilkan
- **FR-M6** Fitur duplikat resep — untuk varian (misal ICE vs HOT dari menu yang sama)
- **FR-M7** Validasi: satuan takaran harus sama dengan satuan bahan

**Import Penjualan**
- **FR-M8** Unggah `.xlsx` format wide (kolom = bulan) maupun long (satu baris per menu per periode). Sistem mendeteksi formatnya otomatis
- **FR-M9** Pilih granularitas dan periode saat impor (minggu ke-berapa, atau bulan apa)
- **FR-M10** Cocokkan menu berdasarkan SKU dulu, kalau tidak ketemu baru berdasarkan nama (fuzzy match, tampilkan skor kemiripan untuk dikonfirmasi)
- **FR-M11** Menu di file yang tidak ada di sistem: tawarkan buat baru atau petakan ke menu yang sudah ada
- **FR-M12** Pratinjau sebelum simpan, sama seperti impor restock
- **FR-M13** Import ulang periode yang sama menawarkan pilihan: timpa atau batalkan
- **FR-M14** Setelah impor tersimpan, sistem **otomatis menurunkan stok** berdasarkan resep, memakai metode FEFO (batch yang paling dekat kadaluarsa dipakai duluan)

**Input Penjualan Manual**
- **FR-M15** Form entri penjualan per menu per minggu, untuk koreksi atau outlet tanpa export POS

### 8.4 Modul Owner

**Ringkasan (Overview)**
- **FR-O1** Kartu KPI: Pendapatan, HPP, Laba Kotor, Margin %, Nilai Stok, Nilai Risiko Kadaluarsa — dengan perbandingan periode sebelumnya (naik/turun berapa %)
- **FR-O2** Pemilih rentang waktu: minggu ini, minggu lalu, bulan ini, 3 bulan, tahun berjalan, kustom
- **FR-O3** Grafik tren pendapatan vs HPP (garis, mingguan)
- **FR-O4** Grafik komposisi penjualan per kategori menu (donat)
- **FR-O5** Daftar 10 menu terlaris dan 10 menu paling sepi

**Analisis Menu**
- **FR-O6** Tabel profitabilitas lengkap: menu, qty terjual, harga jual, HPP, margin/porsi, margin %, total kontribusi laba — bisa diurutkan per kolom
- **FR-O7** **Matriks kuadran** (scatter): sumbu X = volume penjualan, sumbu Y = margin %. Empat kuadran diberi label:
  - Kanan atas — **Bintang** (laku & untung besar) → pertahankan, promosikan
  - Kiri atas — **Teka-teki** (untung besar tapi sepi) → butuh promosi
  - Kanan bawah — **Kuda Beban** (laku tapi tipis) → naikkan harga atau tekan HPP
  - Kiri bawah — **Anjing** (sepi & tipis) → pertimbangkan dihapus
- **FR-O8** Klik menu untuk melihat detail: tren bulanan, rincian HPP per bahan, riwayat perubahan harga

**Analisis Bahan**
- **FR-O9** Tabel konsumsi bahan periode terpilih: qty terpakai, nilai rupiah, sisa stok, hari tersisa (days of cover)
- **FR-O10** Grafik batang 15 bahan penyerap biaya terbesar
- **FR-O11** Panel risiko kadaluarsa: total nilai berisiko, rincian per bahan, tanggal exp
- **FR-O12** Riwayat waste dan tren nilai kerugiannya

**Laporan**
- **FR-O13** Laporan laba rugi sederhana per periode: pendapatan − HPP = laba kotor
- **FR-O14** Ekspor ke PDF dan Excel
- **FR-O15** Ringkasan mingguan otomatis yang bisa dibaca di halaman terpisah

**Manajemen Pengguna**
- **FR-O16** Daftar pengguna, undang baru, ubah peran, nonaktifkan

### 8.5 Modul Forecasting

Lihat Bagian 10 untuk spesifikasi lengkap.

- **FR-F1** Prediksi permintaan per menu untuk minggu depan dan bulan depan
- **FR-F2** Prediksi kebutuhan bahan yang diturunkan dari prediksi permintaan + resep
- **FR-F3** Rekomendasi restock: bahan apa, berapa banyak, kapan
- **FR-F4** Penilaian risiko: "kalau pola ini diteruskan, apakah aman?" dengan status Aman / Waspada / Bahaya
- **FR-F5** Peringkat menu otomatis dengan penjelasan naratif
- **FR-F6** Saran pengembangan bisnis (harga, menu, promosi, efisiensi)
- **FR-F7** Hasil forecast disimpan dan bisa dibandingkan dengan realisasi (untuk mengukur akurasi)

---

## 9. Logika Bisnis & Rumus

### 9.1 HPP (Harga Pokok Penjualan) per Menu

```
HPP(menu) = Σ [ qty_per_porsi(bahan) × harga_per_unit_terakhir(bahan) ]
```

Untuk laporan historis, gunakan harga rata-rata tertimbang dari batch yang benar-benar terpakai pada periode itu:

```
harga_efektif(bahan, periode) = Σ(qty_terpakai_batch × biaya_per_unit_batch) / Σ(qty_terpakai_batch)
```

### 9.2 Margin

```
margin_rupiah  = harga_jual − HPP
margin_persen  = (harga_jual − HPP) / harga_jual × 100
total_kontribusi = margin_rupiah × qty_terjual
```

### 9.3 Konsumsi Bahan

```
konsumsi(bahan, periode) = Σ atas semua menu [ qty_terjual(menu, periode) × qty_per_porsi(menu, bahan) ]
```

### 9.4 Sisa Stok

```
sisa_stok(bahan) = Σ(jumlah batch masuk) − Σ(konsumsi) − Σ(waste) ± Σ(penyesuaian)
```

Implementasi per batch: `sisa_qty` dikurangi dengan metode **FEFO** (First Expired, First Out) — batch dengan tanggal kadaluarsa paling dekat dikonsumsi lebih dulu.

### 9.5 Risiko Kadaluarsa

```
tanggal_kadaluarsa = tanggal_terima + shelf_life_hari   (default 14)

nilai_risiko = Σ [ sisa_qty(batch) × biaya_per_unit(batch) ]
               untuk batch dengan tanggal_kadaluarsa ≤ hari_ini + 7
```

Tingkat urgensi:

| Sisa hari | Status | Warna |
|---|---|---|
| ≤ 0 | Kadaluarsa | Merah |
| 1–3 | Kritis | Oranye |
| 4–7 | Waspada | Kuning |
| > 7 | Aman | Hijau |

### 9.6 Hari Tersisa (Days of Cover)

```
konsumsi_harian_rata2 = konsumsi(bahan, 28 hari terakhir) / 28
hari_tersisa = sisa_stok / konsumsi_harian_rata2
```

Kalau `hari_tersisa < lead_time_pemasok + 2`, tandai **perlu restock**.

### 9.7 Titik Pesan Ulang (Reorder Point)

```
reorder_point = (konsumsi_harian_rata2 × lead_time_hari) + safety_stock
safety_stock  = 1.65 × standar_deviasi_konsumsi_harian × √lead_time_hari
```

Angka 1,65 setara tingkat layanan 95%. Nilai ini boleh dijadikan pengaturan.

### 9.8 Batasan Kadaluarsa vs Kuantitas Pesan

Karena semua bahan kadaluarsa dalam 14 hari, jumlah pesan tidak boleh melebihi konsumsi 14 hari:

```
qty_pesan_maksimum = konsumsi_harian_rata2 × (shelf_life_hari − lead_time_hari) × 0.9
```

Kalau rekomendasi restock melebihi angka ini, sistem memberi peringatan bahwa pesanan berpotensi terbuang.

---

## 10. Spesifikasi Forecasting

### 10.1 Prinsip: Pendekatan Hybrid

**AI bahasa tidak boleh dipakai sendirian untuk menghitung angka prediksi.** Model bahasa buruk dalam aritmetika deret waktu dan hasilnya tidak konsisten antar-pemanggilan. Rancangan yang dipakai:

| Lapisan | Teknologi | Tugas |
|---|---|---|
| **Lapisan 1 — Angka** | SQL / TypeScript murni, jalan di server | Menghitung baseline prediksi, indeks musiman, tren, interval kepercayaan |
| **Lapisan 2 — Makna** | Gemini API | Menerjemahkan angka jadi peringkat, penjelasan, penilaian risiko, saran bisnis |

Angka di dashboard **selalu** berasal dari Lapisan 1. Gemini tidak pernah jadi sumber angka.

### 10.2 Lapisan 1 — Baseline Statistik

**a. Rata-rata bergerak tertimbang (untuk menu dengan penjualan rutin)**

```
prediksi(minggu_depan) = 0.4×W₁ + 0.3×W₂ + 0.2×W₃ + 0.1×W₄
```
(W₁ = minggu terakhir, dst.)

**b. Penyesuaian musiman bulanan**

Dari data historis 2025:
```
indeks_musiman(bulan) = rata2_penjualan(bulan) / rata2_penjualan(seluruh bulan)
prediksi_disesuaikan = prediksi_dasar × indeks_musiman(bulan_target)
```

**c. Komponen tren**

Regresi linear sederhana atas 8 minggu terakhir. Kalau kemiringannya signifikan (|r| > 0,5), tambahkan komponen tren.

**d. Menu jarang terjual (intermittent)**

Kalau lebih dari 40% periode bernilai nol, jangan pakai rata-rata bergerak. Pakai metode Croston sederhana:
```
prediksi = rata2_qty_saat_terjual / rata2_jarak_antar_penjualan
```

**e. Menu baru (< 8 minggu data)**

Jangan diprediksi sendiri. Pakai rata-rata menu lain dalam kategori yang sama, dan beri label kepercayaan rendah.

**f. Interval kepercayaan**

```
batas = prediksi ± 1.96 × standar_deviasi_residual
```

**g. Prediksi kebutuhan bahan**

```
kebutuhan(bahan) = Σ [ prediksi(menu) × qty_per_porsi(menu, bahan) ] × 1.05
```
Faktor 1,05 adalah buffer pemborosan 5%.

### 10.3 Lapisan 2 — Gemini API

**Yang dikirim ke Gemini:** data yang sudah **diagregasi dan diringkas**, bukan seluruh baris mentah. Ini menjaga biaya token tetap rendah dan hasilnya fokus.

Payload masukan (JSON):

```json
{
  "periode": "2026-09-01 s/d 2026-09-07",
  "ringkasan": {
    "pendapatan": 45000000,
    "hpp": 18000000,
    "laba_kotor": 27000000,
    "margin_persen": 60,
    "perubahan_vs_periode_lalu": { "pendapatan": 0.08, "laba": 0.05 }
  },
  "menu_teratas": [
    { "nama": "Kopi Klasik - ICE", "qty": 210, "harga": 20000, "hpp": 6200, "margin_persen": 69 }
  ],
  "menu_terbawah": [ ... ],
  "prediksi_baseline": [
    { "menu": "Kopi Klasik - ICE", "minggu_depan": 218, "rentang": [190, 246], "tren": "naik" }
  ],
  "risiko_bahan": [
    { "bahan": "Oatside", "sisa": 4200, "satuan": "g", "hari_tersisa": 3, "nilai_risiko": 245700 }
  ],
  "status_kadaluarsa": { "total_nilai_berisiko": 1250000, "jumlah_batch": 7 }
}
```

**System prompt untuk Gemini:**

```
Kamu adalah analis bisnis untuk sebuah coffee shop di Indonesia.
Kamu menerima data agregat penjualan, biaya, dan stok beserta prediksi
baseline yang SUDAH dihitung secara statistik.

ATURAN KERAS:
1. JANGAN menghitung ulang atau mengubah angka prediksi baseline.
   Angka itu sudah final. Tugasmu menafsirkan, bukan menghitung.
2. Setiap klaim harus merujuk pada angka yang ada di data masukan.
   Kalau data tidak cukup untuk suatu kesimpulan, katakan begitu.
3. Jangan mengarang nama menu, nama bahan, atau angka yang tidak ada.
4. Jawab HANYA dalam JSON valid sesuai skema. Tanpa markdown, tanpa
   penjelasan di luar JSON.
5. Gunakan bahasa Indonesia yang lugas dan langsung ke poin. Hindari
   jargon konsultan.
6. Rekomendasi harus konkret dan bisa dieksekusi minggu ini —
   sebutkan menu/bahan spesifik dan angka spesifik.
```

**Skema keluaran:**

```json
{
  "peringkat": {
    "terlaris": [{ "menu": "string", "qty": 0, "alasan": "string" }],
    "paling_sepi": [{ "menu": "string", "qty": 0, "alasan": "string" }],
    "profit_tertinggi": [{ "menu": "string", "kontribusi_laba": 0, "alasan": "string" }],
    "profit_terendah": [{ "menu": "string", "kontribusi_laba": 0, "alasan": "string" }]
  },
  "penilaian_risiko": {
    "status": "aman | waspada | bahaya",
    "skor": 0,
    "temuan_utama": ["string"],
    "penjelasan": "string"
  },
  "proyeksi_naratif": {
    "minggu_depan": "string",
    "bulan_depan": "string",
    "asumsi": ["string"]
  },
  "rekomendasi": [
    {
      "kategori": "harga | menu | stok | promosi | efisiensi",
      "prioritas": "tinggi | sedang | rendah",
      "judul": "string",
      "aksi": "string",
      "dampak_estimasi": "string",
      "dasar_data": "string"
    }
  ],
  "peringatan": ["string"]
}
```

**Konfigurasi pemanggilan:**

| Parameter | Nilai |
|---|---|
| Model | Ambil dari environment variable `GEMINI_MODEL`. Verifikasi ID model yang tepat di Google AI Studio sebelum deploy. |
| Temperature | 0.3 (rendah — kita mau konsisten, bukan kreatif) |
| Response MIME type | `application/json` |
| Max output tokens | 4096 |
| Timeout | 30 detik |

### 10.4 Keamanan Kunci API

**Ini wajib, bukan opsional.**

- Kunci Gemini **disimpan sebagai secret di Supabase Edge Function**, tidak pernah masuk ke kode frontend, tidak pernah masuk ke repo git, tidak pernah pakai prefix `VITE_`
- Frontend memanggil Edge Function milik sendiri; Edge Function yang memanggil Gemini
- Edge Function memverifikasi JWT dan menolak pemanggil yang bukan berperan `owner`
- Pembatasan laju: maksimal 20 pemanggilan per pengguna per hari
- Hasil forecast di-cache 6 jam — pemanggilan berulang dalam jendela itu mengambil dari cache

Alur:
```
Browser Owner ──JWT──> Edge Function ──API key (secret)──> Gemini
                            │
                            └──> simpan ke tabel forecasts
```

### 10.5 Penanganan Kegagalan

| Kondisi | Perilaku |
|---|---|
| Gemini timeout / error | Tampilkan hasil Lapisan 1 (angka) saja, dengan pesan "Analisis naratif tidak tersedia. Coba lagi." |
| Gemini balas JSON tidak valid | Coba ulang sekali dengan instruksi perbaikan. Kalau masih gagal, mundur ke Lapisan 1 |
| Data historis < 4 minggu | Tampilkan pesan bahwa forecast belum bisa diandalkan, tampilkan data deskriptif saja |
| Menu tanpa resep | Kecualikan dari prediksi bahan, tampilkan daftar menu yang terlewat |

### 10.6 Pengukuran Akurasi

Setiap forecast disimpan. Saat data aktual periode itu masuk, sistem menghitung:

```
MAPE = rata-rata( |aktual − prediksi| / aktual ) × 100
```

Ditampilkan di halaman forecast supaya Owner tahu seberapa bisa dipercaya angkanya.

---

## 11. Kebutuhan Non-Fungsional

| Kategori | Kebutuhan |
|---|---|
| **Performa** | Dashboard tampil < 2 detik. Impor 600 baris selesai < 10 detik. Kueri agregat pakai materialized view kalau perlu. |
| **Skala** | Sanggup menampung 3 tahun data: ~150 bahan, ~200 menu, ~10.000 batch restock, ~50.000 baris penjualan |
| **Keamanan** | RLS aktif di semua tabel. Kunci API hanya di server. Password kena kebijakan minimal. Audit log untuk operasi hapus. |
| **Keandalan** | Impor bersifat transaksional — gagal sebagian berarti batal semua. Backup harian. |
| **Kegunaan** | Responsif dari 360px. Dashboard Owner harus enak dibaca di HP. |
| **Aksesibilitas** | Kontras WCAG AA. Bisa dinavigasi dengan keyboard. Informasi tidak boleh hanya disampaikan lewat warna. |
| **Bahasa** | Antarmuka bahasa Indonesia. Format angka Indonesia (Rp 1.250.000). Tanggal `DD MMM YYYY`. |
| **Zona waktu** | Asia/Jakarta (WIB). Minggu dimulai hari Senin. |
| **Browser** | Chrome, Safari, Edge, Firefox versi terbaru |

---

## 12. Rencana Rilis

### Fase 1 — Fondasi
Autentikasi, peran, master bahan, master menu, CRUD dasar, seed data dari Excel.

### Fase 2 — Transaksi
Restock manual + impor Excel, penjualan manual + impor Excel, pengurangan stok otomatis FEFO, pencatatan waste.

### Fase 3 — Analitik
Dashboard Owner, semua grafik, tabel profitabilitas, matriks kuadran, laporan, ekspor.

### Fase 4 — Forecasting
Mesin baseline statistik, Edge Function, integrasi Gemini, halaman forecast, pengukuran akurasi.

### Fase 5 — Penyempurnaan
Notifikasi, ringkasan mingguan, pengaturan, optimasi performa.

---

## 13. Kriteria Penerimaan

Sistem dianggap selesai kalau semua ini benar:

- [ ] Tiga peran login dan hanya melihat menu navigasi yang jadi haknya
- [ ] Mencoba mengakses URL peran lain langsung ditolak (bukan cuma disembunyikan)
- [ ] File Excel asli bisa diimpor tanpa diedit dulu, prefix `1` dan `_` terbersihkan otomatis
- [ ] Impor 572 baris restock berhasil, laporan error jelas untuk baris bermasalah
- [ ] Impor penjualan format wide ter-unpivot jadi baris per menu per periode
- [ ] Setelah impor penjualan, stok bahan berkurang sesuai resep dengan FEFO
- [ ] Semua batch punya tanggal kadaluarsa = tanggal terima + 14 hari
- [ ] Halaman kadaluarsa menampilkan nilai rupiah yang berisiko
- [ ] HPP dan margin muncul untuk setiap menu yang punya resep
- [ ] Matriks kuadran menempatkan menu di kuadran yang benar
- [ ] Forecast menghasilkan angka baseline tanpa memanggil AI
- [ ] Forecast AI menghasilkan JSON valid sesuai skema
- [ ] Kunci Gemini tidak ada di bundle frontend (dicek dengan pencarian teks di hasil build)
- [ ] Pengguna non-owner tidak bisa memanggil Edge Function forecast
- [ ] Dashboard Owner terbaca di layar 375px
- [ ] Ekspor PDF dan Excel menghasilkan file yang benar

---

## 14. Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Resep hasil seed tidak akurat | HPP salah, semua analisis profit meleset | Tandai jelas resep yang belum diverifikasi. Sediakan alur verifikasi. Owner lihat badge "belum diverifikasi" di angka HPP. |
| Data historis cuma bulanan | Forecast mingguan awalnya lemah | Pakai indeks musiman bulanan sebagai baseline. Beri label kepercayaan rendah selama 8 minggu pertama. |
| Kunci API bocor | Kuota terkuras, biaya membengkak | Kunci hanya di Edge Function. Rate limiting. Rotasi berkala. |
| Halusinasi AI | Owner ambil keputusan salah | Angka selalu dari lapisan statistik. Output AI diberi label "analisis AI" dan selalu menyertakan dasar datanya. |
| Format Excel berubah | Impor gagal | Deteksi header fleksibel. Pratinjau sebelum simpan. Template unduhan. |
| Staf tidak konsisten mengisi | Data bolong, analisis meleset | Indikator kelengkapan data di dashboard. Pengingat kalau minggu tertentu belum diisi. |
| Asumsi kadaluarsa 14 hari salah | Peringatan palsu, staf mengabaikan sistem | Shelf life bisa diedit per bahan. Prioritaskan mengoreksi ini setelah v1 jalan. |

---

## 15. Pertanyaan Terbuka

1. Berapa lead time nyata dari Two Seasons? Angka ini penting untuk reorder point.
2. Apakah ada POS yang bisa export otomatis, supaya impor manual bisa dihilangkan di v2?
3. Apakah biaya operasional (sewa, gaji, listrik) mau dimasukkan? Kalau ya, laporan bisa naik dari laba kotor ke laba bersih.
4. Apakah ada lebih dari satu outlet dalam rencana?
5. Apakah harga jual pernah berbeda antar-kanal (dine-in vs ojol)? Kalau ya, model data perlu menampung itu.
