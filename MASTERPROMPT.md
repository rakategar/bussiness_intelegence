# MASTERPROMPT — Duanda BI

Berisi prompt siap pakai untuk **Lovable** (membangun aplikasi) dan **Claude Design** (membuat desainnya).

---

## Cara Memakai Dokumen Ini

Lovable bekerja jauh lebih baik dengan **prompt bertahap** daripada satu prompt raksasa. Satu prompt panjang biasanya menghasilkan aplikasi yang setengah jadi di semua bagian. Karena itu di bawah ini dibagi jadi 8 tahap.

**Urutan yang disarankan:**

1. Buat project Lovable baru
2. Aktifkan integrasi Supabase (Lovable → Settings → Supabase)
3. Unggah `PRD.md` dan `DESIGN.md` ke Knowledge base project
4. Jalankan Prompt 0, tunggu selesai, cek hasilnya
5. Lanjut ke Prompt 1, dan seterusnya
6. **Setelah tiap tahap: uji dulu, baru lanjut.** Kalau ada yang salah, perbaiki di tahap itu juga — jangan menumpuk perbaikan.

**Aturan penting untuk Anda sendiri:**
- Jangan pernah menempelkan kunci API Gemini ke chat Lovable. Kunci itu masuk lewat Supabase Edge Function secrets, dari dashboard Supabase langsung.
- Kalau Lovable memberi hasil yang menyimpang, lebih baik pakai fitur revert daripada menumpuk prompt perbaikan.

---

## Prompt 0 — Fondasi & Sistem Desain

```
Saya sedang membangun "Duanda BI", dashboard business intelligence untuk
sebuah coffee shop di Indonesia. Dokumen PRD.md dan DESIGN.md sudah saya
unggah ke knowledge base — pakai keduanya sebagai acuan utama.

Untuk tahap ini, buatkan HANYA fondasinya. Jangan bikin halaman fitur dulu.

Stack:
- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Supabase untuk database dan autentikasi
- Recharts untuk grafik
- React Router untuk routing

Yang saya butuhkan di tahap ini:

1. SISTEM DESAIN
   Terapkan token warna, tipografi, spacing, dan radius persis seperti
   di DESIGN.md bagian 2. Masukkan ke tailwind.config.ts dan index.css
   sebagai CSS custom properties. Termasuk mode gelap.
   Font: Archivo untuk antarmuka, JetBrains Mono khusus untuk angka.
   Muat dari Google Fonts.

   PENTING: jangan pakai warna default Tailwind. Semua warna harus lewat
   token yang saya definisikan. Jangan tambahkan gradien atau bayangan
   pada kartu — kartu dibatasi border, bukan shadow.

2. RANGKA APLIKASI
   - Sidebar kiri 240px yang bisa diciutkan, dengan "rel peran" berupa
     pita 3px di tepi kiri yang warnanya berubah sesuai peran login
   - Top bar berisi nama aplikasi, indikator minggu berjalan
     (format "Minggu 36 · 1–7 Sep"), lonceng notifikasi, menu profil
   - Di layar < 640px: sidebar berubah jadi bottom tab bar (maks 5 item)
   - Area konten maksimal 1440px, ditengahkan

3. KOMPONEN DASAR (buat sebagai komponen reusable, belum dipakai di halaman)
   - StatusBadge: pil dengan titik warna + teks, varian aman/waspada/
     kritis/kadaluarsa. Wajib ada teks, bukan cuma warna.
   - KpiCard: label, nilai besar, delta dengan panah dan warna,
     baris pembanding periode lalu. Ada state loading berupa skeleton.
   - DataTable: header lengket, tinggi baris 40px, kolom angka rata kanan
     dengan font mono, bisa diurutkan, ada search dan filter di atas,
     berubah jadi daftar kartu di layar < 640px
   - EmptyState: judul, penjelasan, dan tombol aksi — tidak boleh cuma
     tulisan "tidak ada data"
   - PageHeader: judul halaman + slot untuk tombol aksi

4. FORMAT ANGKA (buat util di src/lib/format.ts)
   - formatRupiah(1250000) → "Rp 1.250.000"
   - formatRupiahRingkas(45000000) → "Rp 45,0 jt"
   - formatAngka(21.42) → "21,42"  (koma sebagai desimal)
   - formatTanggal → "3 Sep 2026"
   - formatMinggu → "Minggu 36 · 1–7 Sep"
   Locale id-ID, timezone Asia/Jakarta, minggu mulai Senin.

5. AUTENTIKASI
   Supabase Auth email + password. Halaman login. Tabel `profiles`
   dengan kolom id, nama_lengkap, role (enum: stock/admin/owner),
   is_active. Trigger yang membuat baris profiles otomatis saat user
   baru mendaftar.

6. ROUTING BERBASIS PERAN
   Setelah login, redirect: stock → /stock, admin → /admin, owner → /owner.
   Route yang dilindungi. Kalau peran tidak sesuai, tampilkan halaman 403
   yang jelas, bukan redirect diam-diam.
   Buat halaman placeholder kosong untuk tiap peran dulu.

Seluruh teks antarmuka dalam bahasa Indonesia, kalimat biasa
(sentence case), bukan huruf kapital semua.
```

---

## Prompt 1 — Skema Database

```
Sekarang buat skema database lengkap di Supabase sesuai PRD.md bagian 7.

Tabel yang dibutuhkan:
profiles, suppliers, ingredients, restock_batches, menus, recipe_items,
sales_records, stock_movements, waste_logs, import_logs, forecasts

Ikuti definisi kolom persis seperti di PRD bagian 7.2. Poin yang harus
diperhatikan:

- restock_batches.tanggal_kadaluarsa adalah GENERATED COLUMN:
  tanggal_terima + (shelf_life_hari dari ingredients) hari.
  Kalau generated column lintas tabel tidak bisa, pakai trigger BEFORE
  INSERT/UPDATE yang mengisinya.
- restock_batches.sisa_qty diinisialisasi = jumlah, lalu berkurang saat
  ada konsumsi
- ingredients.shelf_life_hari DEFAULT 14
- Unique constraint sales_records (menu_id, periode_mulai, granularitas)
- Unique constraint recipe_items (menu_id, ingredient_id)
- Index pada kolom yang sering difilter: tanggal, ingredient_id, menu_id,
  tanggal_kadaluarsa

ROW LEVEL SECURITY — aktifkan di semua tabel:
- owner: SELECT semua tabel, INSERT/UPDATE/DELETE pada profiles
- admin: SELECT semua; INSERT/UPDATE/DELETE pada menus, recipe_items,
  sales_records, import_logs
- stock: SELECT semua; INSERT/UPDATE/DELETE pada ingredients, suppliers,
  restock_batches, waste_logs, stock_movements, import_logs
- Semua policy pakai helper function get_user_role() yang membaca
  profiles.role dari auth.uid()

Buat juga VIEW berikut (definisinya ada di PRD bagian 7.3 dan rumusnya
di bagian 9):
- v_stock_on_hand
- v_menu_hpp
- v_menu_profitability
- v_ingredient_consumption
- v_expiry_risk
- v_weekly_pnl

Dan satu function penting:
- consume_stock_fefo(p_ingredient_id uuid, p_qty numeric, p_tanggal date)
  Mengurangi sisa_qty dari restock_batches secara FEFO — batch dengan
  tanggal_kadaluarsa paling dekat dipakai duluan. Kalau satu batch tidak
  cukup, lanjut ke batch berikutnya. Setiap pengurangan mencatat baris
  di stock_movements. Kalau stok tidak cukup, tetap catat pengurangan
  tapi kembalikan flag kekurangan supaya bisa ditampilkan sebagai
  peringatan.

Belum perlu bikin UI apa pun di tahap ini.
```

---

## Prompt 2 — Modul Stock

```
Bangun modul untuk peran "stock". Semua halaman di bawah /stock.

HALAMAN /stock (beranda)
Ikuti wireframe DESIGN.md bagian 4.2.
- Paling atas: kartu "N bahan perlu perhatian" dengan bilah 20 titik yang
  mewakili batch aktif, diwarnai sesuai status kesegaran, plus total
  nilai rupiah yang berisiko. Ini elemen paling menonjol di halaman.
- Tiga KpiCard: jumlah bahan aktif, jumlah bahan menipis, total nilai stok
- Tabel "Akan kadaluarsa 7 hari ke depan": bahan, tanggal batch, sisa,
  sisa hari, nilai. Urut dari yang paling mendesak.
- Tabel ringkas 5 restock terakhir

HALAMAN /stock/bahan
- DataTable master bahan: SKU, nama, kategori, satuan, sisa stok,
  nilai stok, status, hari tersisa
- Search, filter kategori, filter status
- Tombol tambah bahan → dialog form
- Klik baris → panel samping berisi detail bahan: riwayat restock,
  grafik konsumsi 8 minggu, daftar batch aktif dengan tanggal kadaluarsa
- Bahan yang punya riwayat transaksi tidak bisa dihapus, hanya
  dinonaktifkan. Tombol hapus jadi "Nonaktifkan" dengan penjelasan.

HALAMAN /stock/restock
- Tabel riwayat restock, filter rentang tanggal dan pemasok
- Tombol "Restock baru" → form: bahan (combobox dengan search),
  pemasok, jumlah, satuan (terisi otomatis dari bahan), total biaya,
  tanggal pemesanan, status, catatan
- Biaya per unit terhitung otomatis = total biaya / jumlah. Field-nya
  berlatar --brand-soft dengan teks bantuan "Terhitung otomatis, bisa
  diubah"
- Tanggal kadaluarsa terisi otomatis = tanggal terima + 14 hari,
  ditampilkan sebagai info, bisa diubah
- Mode input cepat: tabel yang bisa diisi baris per baris seperti
  spreadsheet, untuk memasukkan banyak batch sekaligus

HALAMAN /stock/kadaluarsa
- Daftar semua batch dengan sisa_qty > 0, urut dari tanggal kadaluarsa
  terdekat
- Kelompokkan: Kadaluarsa | Kritis (1–3 hari) | Waspada (4–7 hari) |
  Aman (> 7 hari)
- Tiap kelompok menampilkan total nilai rupiahnya
- Tombol "Catat terbuang" per baris → dialog form waste

HALAMAN /stock/waste
- Riwayat pencatatan waste dengan total nilai kerugian per bulan
- Grafik batang tren nilai waste 12 minggu
- Form catat waste: pilih batch, qty, alasan (kadaluarsa/rusak/tumpah/
  lainnya), catatan. Nilai kerugian terhitung otomatis dari
  biaya_per_unit batch tersebut.

Semua tabel harus jadi daftar kartu di layar < 640px.
```

---

## Prompt 3 — Impor Excel

```
Bangun fitur impor Excel. Pakai library "xlsx" (SheetJS) di sisi klien
untuk parsing, lalu kirim data yang sudah bersih ke Supabase.

Buat komponen ImportWizard yang dipakai dua tempat dengan konfigurasi
berbeda. Alur tiga langkah: Unggah → Pratinjau → Simpan.

=== PARSER RESTOCK (untuk peran stock) ===

File asli punya struktur yang tidak rapi. Parser harus menangani ini:
- Cari sheet yang namanya mengandung "stock", abaikan besar-kecil huruf
  DAN spasi berlebih di ujung (nama sheet asli adalah "stock " dengan
  spasi di akhir)
- Baris 1 adalah judul "RESTOCK INVENTARIS", lewati
- Baris 2 adalah header, data mulai baris 3
- Kolom: A=#, B=BAHAN, C=SKU INTERNAL, D=PEMASOK, E=JUMLAH, F=SATUAN,
  G=label "Rp", H=TOTAL BIAYA, I=label "Rp", J=BIAYA PER UNIT,
  K=TANGGAL PEMESANAN, L=STATUS, M=CATATAN
- PENTING: kolom G dan I hanya berisi teks "Rp" karena sel-nya di-merge.
  Nilai uangnya ada di kolom H dan J. Jangan salah ambil.
- Nama bahan punya prefix angka "1" yang harus dibuang.
  Contoh: "1UHT" → "UHT", "1Beans 500 gr" → "Beans 500 gr"
- Ada baris kosong dan baris tanpa SKU — lewati dengan mencatat alasannya
- Tanggal bisa berupa Date object atau serial number Excel

=== PARSER PENJUALAN (untuk peran admin) ===

Deteksi otomatis dua format:

Format WIDE (seperti file asli, sheet "produk terjual"):
- Header ada di baris 6
- Kolom: B=nomor, C=Nama Menu, D=SKU, E=label "Rp", F=HARGA JUAL,
  G sampai R = JANUARY sampai DECEMBER, S=TOTAL
- Nama menu punya prefix "_" yang harus dibuang
- Baris yang nama menunya diawali "1" (misal "1Basic Espresso",
  "1Simple Syrup") BUKAN menu jual — itu komponen bahan. Lewati dan
  laporkan sebagai "dilewati: komponen bahan, bukan menu"
- Lakukan UNPIVOT: satu baris menu × 12 kolom bulan menjadi 12 baris
  sales_records. Lewati bulan yang nilainya 0 atau kosong.
- Jangan percaya kolom TOTAL — hitung ulang sendiri

Format LONG:
- Kolom: sku, nama_menu, periode_mulai, qty_terjual
- Satu baris per menu per periode

Saat impor penjualan, pengguna memilih granularitas (mingguan/bulanan)
dan periode target lewat date picker.

=== LAYAR PRATINJAU (ikuti DESIGN.md bagian 3.4) ===

- Tiga kartu ringkasan: jumlah siap masuk (hijau), jumlah butuh
  konfirmasi (kuning), jumlah bermasalah (merah)
- Tab filter untuk melihat tiap kelompok
- Tabel semua baris dengan indikator status per baris
- Baris bermasalah menampilkan alasannya dan BISA DIPERBAIKI langsung
  di layar itu — bukan disuruh perbaiki di Excel lalu unggah ulang
- Bahan/menu yang belum ada di sistem: tawarkan "Buat baru" atau
  "Petakan ke yang sudah ada" lewat combobox
- Pencocokan menu: SKU dulu, kalau tidak ketemu baru fuzzy match nama.
  Tampilkan skor kemiripan untuk dikonfirmasi manusia.
- Deteksi duplikat: kombinasi yang sama persis dengan data yang sudah
  ada diberi tanda peringatan
- Tombol simpan menyebut angkanya: "Simpan 541 baris ke sistem"

=== SETELAH SIMPAN ===

- Impor bersifat transaksional. Kalau ada yang gagal di tengah, batalkan
  semuanya. Jangan biarkan data masuk separuh.
- Catat ke import_logs
- Tampilkan ringkasan hasil + tombol "Batalkan impor ini" yang aktif
  selama 24 jam
- Baris yang baru masuk di tabel disorot dengan latar hijau muda selama
  1,2 detik lalu memudar

=== EFEK SAMPING IMPOR PENJUALAN ===

Setelah sales_records tersimpan, sistem otomatis mengurangi stok:
untuk tiap menu × qty terjual, ambil resepnya, lalu panggil
consume_stock_fefo() untuk tiap bahan.
Menu yang belum punya resep dilewati — tapi tampilkan daftarnya sebagai
peringatan: "14 menu dilewati karena resepnya belum diisi. Konsumsi
bahannya tidak terhitung."

=== TEMPLATE ===

Sediakan tombol "Unduh template" di kedua alur impor, yang menghasilkan
file .xlsx berisi header yang benar dan 2 baris contoh.
```

---

## Prompt 4 — Modul Admin

```
Bangun modul untuk peran "admin". Semua halaman di bawah /admin.

HALAMAN /admin (beranda)
Ikuti wireframe DESIGN.md bagian 4.3.
- Kartu status minggu berjalan: kalau data penjualan minggu ini belum
  diunggah, tampilkan pengingat dengan tombol "Unggah rekap penjualan"
  dan "Unduh template". Kalau sudah, tampilkan ringkasan yang diimpor.
- Tiga KpiCard: jumlah menu terdaftar, jumlah menu tanpa resep (dengan
  ikon peringatan kalau > 0), jumlah impor bulan ini
- Daftar menu tanpa resep, dengan penjelasan kenapa itu masalah dan
  tombol "Isi resep" per baris
- Tabel riwayat impor dengan tombol batalkan untuk impor < 24 jam

HALAMAN /admin/menu
- DataTable: SKU, nama, kategori, harga jual, HPP, margin Rp, margin %,
  status resep
- Menu tanpa resep diberi badge peringatan "Resep belum diisi"
- Kolom margin % diwarnai: di bawah 40% pakai --critical, 40-60% pakai
  --watch, di atas 60% pakai --fresh
- Tombol tambah menu → dialog form
- Klik baris → halaman detail menu

HALAMAN /admin/menu/:id (detail menu)
- Info menu di atas, bisa diedit inline
- Editor resep: tabel bahan dengan kolom bahan (combobox), qty per porsi,
  satuan (terisi otomatis dari bahan, read-only), biaya per unit terkini,
  subtotal biaya
- Di bawah tabel: ringkasan HPP, harga jual, margin Rp, margin %.
  Angka ini terhitung ulang secara langsung setiap resep diubah,
  sebelum disimpan.
- Tombol "Duplikat resep dari menu lain" — untuk varian ICE/HOT
- Validasi: satuan takaran harus sama dengan satuan bahan
- Grafik tren penjualan bulanan menu ini

HALAMAN /admin/penjualan
- Tabel sales_records, filter periode dan menu
- Tombol "Impor Excel" → ImportWizard
- Tombol "Input manual" → form entri penjualan per menu per minggu
- Peringatan kalau ada periode yang bolong (misal minggu 34 tidak ada
  datanya sementara minggu 33 dan 35 ada)

HALAMAN /admin/impor
- Riwayat semua impor dengan detail error yang bisa dibuka
```

---

## Prompt 5 — Dashboard Owner

```
Bangun modul untuk peran "owner". Semua halaman di bawah /owner.
Prioritas utama: harus enak dibaca di layar HP 375px.

HALAMAN /owner (beranda)
Ikuti wireframe DESIGN.md bagian 4.4.

Bagian pembuka BUKAN angka besar, tapi kartu penilaian:
- Badge status (Aman / Waspada / Bahaya)
- Satu atau dua kalimat yang merangkum kondisi minggu ini
- Di bawahnya, empat angka ringkas dalam satu baris: Pendapatan,
  Laba kotor, Margin %, Nilai stok — masing-masing dengan delta

Kalimat penilaian dirakit dari aturan biasa, BUKAN dari AI, supaya
selalu muncul walaupun AI sedang gagal:
  nilai_risiko_kadaluarsa > 5% pendapatan          → Waspada
  margin turun > 5 poin persen dari periode lalu   → Waspada
  ada bahan dengan hari_tersisa < lead_time        → Waspada
  ≥ 2 kondisi terpenuhi                            → Bahaya
  selain itu                                       → Aman

Selanjutnya:
- Pemilih rentang waktu: minggu ini, minggu lalu, bulan ini, 3 bulan,
  tahun berjalan, kustom
- Grafik garis: Pendapatan vs HPP, 12 minggu terakhir
- Grafik donat: komposisi penjualan per kategori menu
- Matriks kuadran menu (lihat spesifikasi di bawah)
- Panel Analisis AI (kosong dulu, diisi di Prompt 6)
- Dua tabel bersebelahan: 10 menu paling menguntungkan,
  15 bahan penyerap biaya terbesar

MATRIKS KUADRAN (DESIGN.md bagian 3.6) — ini visual paling khas:
- Scatter plot Recharts. Sumbu X = qty terjual, sumbu Y = margin %
- Garis pembagi di MEDIAN volume dan MEDIAN margin, bukan di nol
- Ukuran titik proporsional dengan total kontribusi laba
- Label kuadran di keempat sudut dengan warna --ink-faint:
  kanan atas "Bintang", kiri atas "Teka-teki",
  kanan bawah "Kuda Beban", kiri bawah "Anjing"
- Hover menampilkan nama menu dan angkanya
- Klik membuka detail menu
- Di layar < 640px, tampilkan grafiknya DAN daftar teks per kuadran di
  bawahnya, karena titiknya terlalu kecil untuk disentuh

HALAMAN /owner/menu
- Tabel profitabilitas penuh: menu, kategori, qty terjual, harga jual,
  HPP, margin Rp, margin %, total kontribusi laba, kuadran
- Bisa diurutkan tiap kolom, bisa diekspor
- Klik baris → detail: tren bulanan, rincian HPP per bahan (grafik
  batang bertumpuk), riwayat harga

HALAMAN /owner/bahan
- Tabel konsumsi: bahan, qty terpakai periode ini, nilai rupiah,
  sisa stok, hari tersisa, status
- Grafik batang horizontal 15 bahan penyerap biaya terbesar
- Panel risiko kadaluarsa: total nilai berisiko + rincian per bahan
- Grafik tren nilai waste

HALAMAN /owner/laporan
- Laporan laba rugi sederhana: pendapatan, HPP, laba kotor, margin
- Rincian per kategori menu
- Tombol ekspor PDF dan Excel
- Ringkasan mingguan yang bisa dibaca langsung di halaman

HALAMAN /owner/pengguna
- Daftar pengguna, undang baru, ubah peran, nonaktifkan

Semua grafik: sumbu Y mulai dari nol untuk bar chart, maksimal 6 seri,
legenda mendatar di atas, tinggi 240–400px, dan sediakan tombol
"Lihat sebagai tabel" untuk aksesibilitas.
```

---

## Prompt 6 — Mesin Forecasting (Lapisan Statistik)

```
Bangun mesin forecasting LAPISAN 1: perhitungan statistik murni,
tanpa AI sama sekali. Ini yang menghasilkan semua angka prediksi.

Buat Supabase Edge Function bernama "hitung-baseline" dengan logika
sesuai PRD.md bagian 10.2:

1. RATA-RATA BERGERAK TERTIMBANG (menu dengan penjualan rutin)
   prediksi = 0.4×W1 + 0.3×W2 + 0.2×W3 + 0.1×W4
   (W1 = periode terakhir)

2. INDEKS MUSIMAN BULANAN
   Dihitung dari data historis 2025 yang sudah di-seed:
   indeks(bulan) = rata2_penjualan(bulan) / rata2_penjualan(semua bulan)
   prediksi_final = prediksi_dasar × indeks(bulan_target)

3. KOMPONEN TREN
   Regresi linear atas 8 periode terakhir. Kalau |r| > 0.5, tambahkan
   komponen trennya. Kalau tidak, abaikan.

4. MENU JARANG TERJUAL
   Kalau > 40% periode bernilai nol, jangan pakai moving average.
   Pakai Croston sederhana:
   prediksi = rata2_qty_saat_terjual / rata2_jarak_antar_penjualan

5. MENU BARU (< 8 periode data)
   Pakai rata-rata menu lain dalam kategori yang sama.
   Beri label confidence: "rendah"

6. INTERVAL KEPERCAYAAN
   batas = prediksi ± 1.96 × standar_deviasi_residual

7. PREDIKSI KEBUTUHAN BAHAN
   kebutuhan(bahan) = Σ[prediksi(menu) × qty_per_porsi] × 1.05

8. REKOMENDASI RESTOCK
   perlu_pesan = maksimum(0, kebutuhan − sisa_stok + safety_stock)
   safety_stock = 1.65 × stdev_konsumsi_harian × √lead_time

9. BATAS KADALUARSA — ini penting karena semua bahan exp 14 hari
   batas_maks = konsumsi_harian_rata2 × (shelf_life − lead_time) × 0.9
   Kalau perlu_pesan > batas_maks, beri flag "berisiko terbuang"
   dan tampilkan batas_maks di UI sebagai kolom terpisah.

Simpan hasilnya ke tabel forecasts kolom baseline_json.

HALAMAN /owner/proyeksi:
- Toggle "Minggu depan" / "Bulan depan"
- Tampilkan MAPE dari forecast periode sebelumnya sebagai indikator
  kepercayaan: "Akurasi prediksi terakhir: MAPE 18,4%"
- Grafik garis prediksi penjualan dengan area interval kepercayaan
- Tabel kebutuhan bahan: bahan, prediksi pakai, sisa stok, perlu pesan,
  batas exp. Kolom batas exp diberi teks penjelas di bawah tabel.
- Tabel peringkat menu dengan tab: Terlaris | Paling sepi |
  Untung terbesar | Untung terkecil
- Kalau data historis < 4 periode, tampilkan EmptyState yang menjelaskan
  berapa periode lagi yang dibutuhkan, dengan progress bar

Simpan tiap forecast. Saat data aktual periode itu masuk, hitung
MAPE = rata-rata(|aktual − prediksi| / aktual) × 100 dan simpan.
```

---

## Prompt 7 — Integrasi Gemini (Lapisan Narasi)

> **JANGAN tempelkan kunci API ke chat Lovable.**
> Buat Edge Function-nya dulu lewat prompt ini, lalu masukkan kunci
> secara terpisah lewat dashboard Supabase:
> `Project Settings → Edge Functions → Secrets → tambah GEMINI_API_KEY`
> Tambahkan juga secret `GEMINI_MODEL` berisi ID model yang benar.
> Verifikasi ID model yang tepat di Google AI Studio sebelum mengisi.

```
Bangun LAPISAN 2 forecasting: analisis naratif dengan Gemini API.

KEAMANAN — ini tidak bisa ditawar:
- Kunci API HANYA ada di Supabase Edge Function secrets, dibaca lewat
  Deno.env.get("GEMINI_API_KEY")
- JANGAN pernah menaruh kunci di kode frontend
- JANGAN pakai environment variable berprefix VITE_ untuk ini
- JANGAN menuliskan kunci di file mana pun di repo
- Frontend memanggil Edge Function kita sendiri, bukan Google langsung

Buat Edge Function "analisis-ai":

1. OTORISASI
   - Verifikasi JWT dari header Authorization
   - Baca profiles.role dari database
   - Kalau bukan "owner", kembalikan 403. Jangan cuma sembunyikan
     tombolnya di UI.

2. RATE LIMITING
   - Maksimal 20 pemanggilan per pengguna per hari
   - Cache hasil selama 6 jam. Pemanggilan dalam jendela itu mengambil
     dari tabel forecasts, tidak memanggil Gemini lagi.
   - Tombol "muat ulang" di UI bisa memaksa panggilan baru, tapi tetap
     kena hitungan rate limit

3. PENYIAPAN DATA
   Ambil data agregat dari database dan susun payload ringkas sesuai
   PRD.md bagian 10.3. JANGAN kirim seluruh baris mentah — hanya
   agregat, 10 menu teratas, 10 menu terbawah, hasil baseline dari
   Edge Function "hitung-baseline", dan daftar bahan berisiko.

4. PANGGILAN GEMINI
   - Model dari Deno.env.get("GEMINI_MODEL")
   - temperature: 0.3
   - responseMimeType: "application/json"
   - maxOutputTokens: 4096
   - timeout 30 detik

   System prompt persis seperti di PRD.md bagian 10.3, intinya:
   * JANGAN menghitung ulang atau mengubah angka baseline
   * Setiap klaim harus merujuk angka yang ada di data masukan
   * Jangan mengarang nama menu, bahan, atau angka
   * Jawab HANYA JSON valid sesuai skema, tanpa markdown
   * Bahasa Indonesia lugas
   * Rekomendasi harus konkret dan bisa dieksekusi minggu ini

   Skema keluaran persis seperti di PRD bagian 10.3: peringkat,
   penilaian_risiko, proyeksi_naratif, rekomendasi, peringatan.

5. VALIDASI KELUARAN
   - Validasi JSON dengan Zod terhadap skema
   - Kalau tidak valid, coba ulang SEKALI dengan instruksi perbaikan
   - Kalau masih gagal, kembalikan hasil baseline saja dengan flag
     ai_gagal: true
   - Verifikasi bahwa nama menu dan bahan yang disebut AI benar-benar
     ada di data masukan. Kalau ada yang mengarang, buang item itu.

6. SIMPAN
   Simpan ke forecasts.ai_json beserta model_digunakan dan timestamp.

UI — Panel Analisis AI (DESIGN.md bagian 3.7):
- Ditempatkan di /owner dan /owner/proyeksi
- Garis kiri 3px berwarna ungu (--role-admin) untuk menandai bahwa ini
  keluaran mesin, berbeda dari angka sistem
- Header: "Analisis AI", waktu pembuatan, tombol muat ulang
- Badge status besar (Aman/Waspada/Bahaya)
- Narasi ringkas
- Daftar rekomendasi, tiap item punya badge prioritas, judul, aksi, dan
  baris "Dasar:" yang menyebut angkanya
- Catatan kaki: "Analisis dibuat AI dari data agregat. Angka prediksi
  berasal dari perhitungan sistem."
- Kalau AI gagal: tampilkan angka baseline saja dengan pesan
  "Analisis naratif tidak tersedia saat ini. Coba muat ulang."
  Jangan tampilkan halaman error — angka statistiknya tetap berguna.
```

---

## Prompt 8 — Penyempurnaan

```
Tahap terakhir. Perbaikan dan pemolesan.

1. SEED DATA
   Buat halaman /admin/seed (hanya untuk owner) yang bisa mengunggah
   empat file CSV: seed_bahan.csv, seed_menu.csv, seed_resep.csv,
   seed_penjualan_historis.csv. Tampilkan pratinjau sebelum menyimpan.

2. NOTIFIKASI
   - Lonceng di top bar dengan hitungan
   - Pemicu: bahan masuk zona kritis (≤ 3 hari), stok di bawah reorder
     point, data mingguan belum diunggah setelah hari Selasa
   - Notifikasi diarahkan ke halaman yang relevan

3. EKSPOR
   - Ekspor PDF laporan Owner: judul, periode, KPI, grafik sebagai
     gambar, tabel. Pakai jspdf + html2canvas.
   - Ekspor Excel: satu sheet per tabel, format angka rupiah yang benar
   - Nama file: "duanda-laporan-2026-W36.pdf"

4. PENGATURAN (/owner/pengaturan)
   - Shelf life default (14 hari, bisa diubah)
   - Faktor buffer forecast (1.05)
   - Tingkat layanan safety stock (1.65)
   - Lead time default pemasok
   - Ambang status Waspada/Bahaya

5. AKSESIBILITAS — periksa semuanya
   - Kontras minimal 4,5:1
   - Status tidak pernah hanya lewat warna
   - Cincin fokus terlihat: outline 2px --focus-ring, offset 2px
   - Tabel pakai <th scope> yang benar
   - Semua grafik punya tombol "Lihat sebagai tabel"
   - Target sentuh 44×44px di mobile
   - Hormati prefers-reduced-motion
   - Navigasi keyboard penuh termasuk tabel dengan tombol panah

6. PERFORMA
   - Materialized view untuk agregat yang berat, refresh setelah impor
   - Pagination 50 baris
   - Lazy load rute per peran
   - Skeleton, bukan spinner

7. PENANGANAN ERROR
   - Error boundary di tiap rute
   - Pesan error menyebut apa yang salah dan bagaimana memperbaikinya
   - Retry otomatis dengan backoff untuk kegagalan jaringan

8. PEMERIKSAAN KEAMANAN TERAKHIR
   - Jalankan `npm run build`, lalu cari string "AIza" di folder dist.
     Kalau ada hasilnya, kunci bocor ke frontend — perbaiki segera.
   - Uji: login sebagai stock, coba akses /owner langsung lewat URL.
     Harus ditolak.
   - Uji: panggil Edge Function analisis-ai dengan JWT peran stock.
     Harus 403.
   - Pastikan RLS aktif di semua tabel, tidak ada yang terlewat.
```

---

## Prompt untuk Claude Design

Kalau Anda mau desainnya dibuat lebih dulu sebelum dibangun:

```
Buatkan desain antarmuka untuk "Duanda BI" — dashboard business
intelligence internal sebuah coffee shop di Indonesia.

KONTEKS
Ini bukan aplikasi konsumen, melainkan pengganti spreadsheet untuk
operasional. Tiga peran dengan kebutuhan berbeda:

- Stock: berdiri di dekat kiriman barang, tangan kotor, buru-buru.
  Butuh entri cepat dan target sentuh besar.
- Admin: duduk di laptop, kerja borongan seminggu sekali. Butuh tabel
  padat dan alur impor yang jelas.
- Owner: buka dari HP di sela kegiatan. Butuh jawaban, bukan data mentah.

KONSEP VISUAL: "Papan Dapur"
Rujukannya bukan kafe hipster, tapi bagian belakang kafe — meja prep
stainless steel, label tanggal yang ditempel di wadah, papan tulis
jadwal. Dingin, fungsional.

Prinsip utamanya: status kesegaran bahan adalah warna paling menonjol
di seluruh antarmuka. Bukan logo, bukan tombol. Kalau ada bahan yang
mau kadaluarsa, itulah yang paling terang di layar.

JANGAN pakai:
- Palet cokelat kopi atau krem hangat (klise, dan bikin angka susah
  dibaca)
- Kartu bersudut membulat seragam untuk segala hal
- Gradien sebagai dekorasi
- Label huruf kapital semua di atas tiap judul
- Animasi masuk di tiap seksi

PALET
Netral dingin: #14181D ink, #5A6673 ink-muted, #F6F7F9 surface,
#FFFFFF panel, #E0E4E9 line
Brand teal baja: #1B4D57
Status kesegaran (ini yang paling penting):
  Aman #2F7D4F · Waspada #C08400 · Kritis #D9541E · Kadaluarsa #B02418

TIPOGRAFI
Archivo untuk antarmuka. JetBrains Mono khusus untuk angka di tabel dan
KPI, supaya kolom rupiah tersejajar — bukan untuk label.

YANG SAYA BUTUHKAN
1. Dashboard Owner (desktop 1440px dan mobile 375px) — bagian pembuka
   berupa kartu penilaian dengan badge status dan satu kalimat
   kesimpulan, bukan angka besar. Di bawahnya empat KPI ringkas,
   grafik tren, matriks kuadran menu, panel analisis AI.
2. Dashboard Stock (desktop) — paling atas kartu "N bahan perlu
   perhatian" dengan bilah 20 titik berwarna status yang mewakili batch
   aktif. Lalu tiga KPI, tabel akan-kadaluarsa, tabel restock terakhir.
3. Layar pratinjau impor Excel — tiga kartu ringkasan (siap/konfirmasi/
   bermasalah), tab filter, tabel dengan baris yang bisa diperbaiki
   langsung.
4. Matriks kuadran menu — scatter dengan pembagi di median, empat
   kuadran berlabel Bintang / Teka-teki / Kuda Beban / Anjing.
5. Kumpulan komponen: badge status, kartu KPI, baris tabel, keadaan
   kosong, panel analisis AI.

Seluruh teks bahasa Indonesia, kalimat biasa. Format rupiah
"Rp 1.250.000", desimal pakai koma, tanggal "3 Sep 2026".
```

---

## Kalau Lovable Menyimpang

Prompt perbaikan yang biasanya efektif:

| Masalah | Prompt perbaikan |
|---|---|
| Warna kembali ke default Tailwind | "Ganti semua warna hardcoded dengan token dari index.css. Jangan pakai kelas warna bawaan Tailwind seperti bg-blue-500. Rujuk ulang DESIGN.md bagian 2." |
| Kartu bertambah bayangan dan gradien | "Hapus semua box-shadow dan gradien dari kartu. Kartu dibatasi border 1px --line saja. Ini sudah disebut di DESIGN.md bagian 2.3." |
| Tabel terlalu lapang | "Rapatkan tabel: tinggi baris 40px, padding 12px. Pengguna datang dari Excel, mereka mau lihat banyak baris sekaligus." |
| Teks jadi bahasa Inggris | "Semua teks antarmuka harus bahasa Indonesia dengan kalimat biasa. Ganti semua label, tombol, pesan error, dan keadaan kosong." |
| Angka format Amerika | "Semua angka pakai format Indonesia: Rp 1.250.000, desimal dengan koma. Pakai util di src/lib/format.ts, jangan format manual di komponen." |
| AI dipakai menghitung angka | "Angka prediksi HARUS dari Edge Function hitung-baseline, bukan dari Gemini. Gemini hanya menafsirkan angka yang sudah ada. Rujuk PRD.md bagian 10.1." |
| Kunci API muncul di frontend | "Pindahkan pemanggilan Gemini ke Edge Function. Kunci dibaca lewat Deno.env.get, tidak boleh ada di kode klien sama sekali." |

---

## Daftar Periksa Sebelum Dianggap Selesai

- [ ] Tiga peran login dan hanya melihat navigasi yang jadi haknya
- [ ] Akses langsung ke URL peran lain ditolak, bukan cuma disembunyikan
- [ ] File Excel asli bisa diimpor tanpa diedit dulu
- [ ] Prefix `1` pada bahan dan `_` pada menu terbersihkan otomatis
- [ ] Kolom "Rp" yang terpisah dari nilainya terbaca benar
- [ ] Format wide penjualan ter-unpivot jadi baris per menu per periode
- [ ] Baris `1Basic Espresso` dan sejenisnya dilewati saat impor menu
- [ ] Stok berkurang otomatis FEFO setelah impor penjualan
- [ ] Semua batch punya tanggal kadaluarsa = terima + 14 hari
- [ ] HPP dan margin muncul untuk menu yang punya resep
- [ ] Menu tanpa resep diberi badge peringatan
- [ ] Matriks kuadran memakai median, bukan nol, sebagai pembagi
- [ ] Forecast baseline jalan tanpa memanggil AI
- [ ] AI gagal tidak membuat halaman rusak — angka tetap tampil
- [ ] `npm run build` lalu cari "AIza" di folder dist → tidak ada hasil
- [ ] Edge Function analisis-ai menolak JWT non-owner dengan 403
- [ ] Dashboard Owner terbaca di 375px
- [ ] Semua grafik punya tombol "Lihat sebagai tabel"
- [ ] Ekspor PDF dan Excel menghasilkan file yang benar
