import type { KategoriBahan, KategoriMenu } from "../types";

/**
 * Katalog master. Angka di sini adalah harga wajar coffee shop Indonesia
 * per satuan terkecil (rupiah per gram / per pcs), mengikuti pola data
 * asli yang dijelaskan di PRD.md bagian 6.
 */

export interface BenihBahan {
  sku: string;
  nama: string;
  kategori: KategoriBahan;
  satuan: string;
  harga: number;
  /** Pemakaian rata-rata per hari, dipakai untuk mengarang riwayat konsumsi. */
  pakaiHarian: number;
  shelfLife?: number;
}

export const BAHAN: BenihBahan[] = [
  // --- Minuman -------------------------------------------------------------
  { sku: "1-B76", nama: "UHT", kategori: "beverage", satuan: "g", harga: 21.42, pakaiHarian: 5400 },
  { sku: "1-B55", nama: "Oatside", kategori: "beverage", satuan: "g", harga: 58.5, pakaiHarian: 1350 },
  { sku: "1-B12", nama: "Beans Arabika", kategori: "beverage", satuan: "g", harga: 230, pakaiHarian: 1180 },
  { sku: "1-B13", nama: "Beans Robusta", kategori: "beverage", satuan: "g", harga: 178, pakaiHarian: 640 },
  { sku: "1-B21", nama: "Susu Kental Manis", kategori: "beverage", satuan: "g", harga: 32.8, pakaiHarian: 820 },
  { sku: "1-B22", nama: "Whipping Cream", kategori: "beverage", satuan: "g", harga: 74.5, pakaiHarian: 410 },
  { sku: "1-B31", nama: "Matcha Powder", kategori: "beverage", satuan: "g", harga: 412, pakaiHarian: 96 },
  { sku: "1-B32", nama: "Cokelat Bubuk", kategori: "beverage", satuan: "g", harga: 168, pakaiHarian: 210 },
  { sku: "1-B33", nama: "Red Velvet Powder", kategori: "beverage", satuan: "g", harga: 198, pakaiHarian: 88 },
  { sku: "1-B34", nama: "Taro Powder", kategori: "beverage", satuan: "g", harga: 186, pakaiHarian: 74 },
  { sku: "1-B41", nama: "Sirup Vanilla", kategori: "beverage", satuan: "g", harga: 64, pakaiHarian: 240 },
  { sku: "1-B42", nama: "Sirup Caramel", kategori: "beverage", satuan: "g", harga: 68, pakaiHarian: 190 },
  { sku: "1-B43", nama: "Sirup Hazelnut", kategori: "beverage", satuan: "g", harga: 71, pakaiHarian: 130 },
  { sku: "1-B51", nama: "Teh Melati", kategori: "beverage", satuan: "g", harga: 96, pakaiHarian: 120 },
  { sku: "1-B52", nama: "Lemon", kategori: "beverage", satuan: "g", harga: 28, pakaiHarian: 380 },
  { sku: "1-B61", nama: "Es Batu", kategori: "beverage", satuan: "g", harga: 1.2, pakaiHarian: 22000 },

  // --- Base / premix -------------------------------------------------------
  { sku: "1-P01", nama: "Basic Espresso", kategori: "base", satuan: "porsi", harga: 3850, pakaiHarian: 128 },
  { sku: "1-P02", nama: "Simple Syrup", kategori: "base", satuan: "g", harga: 12.4, pakaiHarian: 1900 },
  { sku: "1-P03", nama: "Palm Sugar Syrup", kategori: "base", satuan: "g", harga: 22.6, pakaiHarian: 980 },
  { sku: "1-C01", nama: "Saus Teriyaki", kategori: "base", satuan: "g", harga: 46, pakaiHarian: 340 },
  { sku: "1-C02", nama: "Saus Sambal Matah", kategori: "base", satuan: "g", harga: 58, pakaiHarian: 210 },
  { sku: "1-C03", nama: "Mayo Jepang", kategori: "base", satuan: "g", harga: 52, pakaiHarian: 290 },

  // --- Dapur ---------------------------------------------------------------
  { sku: "1-K11", nama: "Kentang Beku", kategori: "kitchen", satuan: "g", harga: 31.5, pakaiHarian: 2400 },
  { sku: "1-K12", nama: "Nugget Ayam", kategori: "kitchen", satuan: "g", harga: 68, pakaiHarian: 780 },
  { sku: "1-K13", nama: "Sosis Sapi", kategori: "kitchen", satuan: "pc", harga: 3200, pakaiHarian: 62 },
  { sku: "1-K14", nama: "Fillet Ayam", kategori: "kitchen", satuan: "g", harga: 54, pakaiHarian: 1850 },
  { sku: "1-K15", nama: "Tepung Panir", kategori: "kitchen", satuan: "g", harga: 18.4, pakaiHarian: 620 },
  { sku: "1-K16", nama: "Minyak Goreng", kategori: "kitchen", satuan: "g", harga: 19.8, pakaiHarian: 1600 },
  { sku: "1-K17", nama: "Beras Pandan Wangi", kategori: "kitchen", satuan: "g", harga: 14.6, pakaiHarian: 3200 },
  { sku: "1-K18", nama: "Mie Telur", kategori: "kitchen", satuan: "g", harga: 26, pakaiHarian: 740 },
  { sku: "1-K19", nama: "Tahu Bakso", kategori: "kitchen", satuan: "pc", harga: 2450, pakaiHarian: 48 },
  { sku: "1-K20", nama: "Roti Tawar", kategori: "kitchen", satuan: "lbr", harga: 1350, pakaiHarian: 56 },
  { sku: "1-K21", nama: "Keju Cheddar", kategori: "kitchen", satuan: "g", harga: 112, pakaiHarian: 380 },
  { sku: "1-K22", nama: "Butter", kategori: "kitchen", satuan: "g", harga: 88, pakaiHarian: 260 },

  // --- Segar ---------------------------------------------------------------
  { sku: "1-L01", nama: "Telur Ayam", kategori: "fresh", satuan: "butir", harga: 2650, pakaiHarian: 84 },
  { sku: "1-L02", nama: "Selada", kategori: "fresh", satuan: "porsi", harga: 500, pakaiHarian: 46, shelfLife: 5 },
  { sku: "1-L03", nama: "Tomat", kategori: "fresh", satuan: "g", harga: 16.5, pakaiHarian: 520, shelfLife: 7 },
  { sku: "1-L04", nama: "Bawang Bombay", kategori: "fresh", satuan: "g", harga: 22, pakaiHarian: 340 },
  { sku: "1-L05", nama: "Daun Bawang", kategori: "fresh", satuan: "g", harga: 34, pakaiHarian: 180, shelfLife: 5 },
  { sku: "1-L06", nama: "Cabai Rawit", kategori: "fresh", satuan: "g", harga: 68, pakaiHarian: 145, shelfLife: 7 },

  // --- Kemasan -------------------------------------------------------------
  { sku: "1-H01", nama: "Cup Plastik 16oz", kategori: "packaging", satuan: "pc", harga: 780, pakaiHarian: 210, shelfLife: 365 },
  { sku: "1-H02", nama: "Cup Plastik 22oz", kategori: "packaging", satuan: "pc", harga: 940, pakaiHarian: 96, shelfLife: 365 },
  { sku: "1-H03", nama: "Lid Cup", kategori: "packaging", satuan: "pc", harga: 210, pakaiHarian: 306, shelfLife: 365 },
  { sku: "1-H04", nama: "Sedotan", kategori: "packaging", satuan: "pc", harga: 92, pakaiHarian: 288, shelfLife: 365 },
  { sku: "1-H05", nama: "Paper Bowl", kategori: "packaging", satuan: "pc", harga: 1450, pakaiHarian: 74, shelfLife: 365 },
  { sku: "1-H06", nama: "Kantong Kertas", kategori: "packaging", satuan: "pc", harga: 620, pakaiHarian: 88, shelfLife: 365 },
];

export const PEMASOK = [
  { nama: "Two Seasons", kontak: "0812-3311-0090", leadTimeHari: 3 },
  { nama: "Sinar Pangan Jaya", kontak: "0813-5522-7781", leadTimeHari: 2 },
  { nama: "Toko Segar Pasar Baru", kontak: "0857-9911-2244", leadTimeHari: 1 },
  { nama: "CV Kemas Nusantara", kontak: "0811-2020-8899", leadTimeHari: 5 },
  { nama: "Roastery Kalibata", kontak: "0878-6600-1145", leadTimeHari: 4 },
];

export interface BenihMenu {
  sku: string;
  nama: string;
  kategori: KategoriMenu;
  harga: number;
  /** Rata-rata porsi terjual per minggu. */
  laku: number;
  /** Resep: [sku bahan, qty per porsi] */
  resep: [string, number][];
}

export const MENU: BenihMenu[] = [
  // --- Kopi ----------------------------------------------------------------
  { sku: "Psc01", nama: "Kopi Klasik - ICE", kategori: "coffee", harga: 20000, laku: 146, resep: [["1-P01", 1], ["1-B76", 120], ["1-P03", 22], ["1-B61", 160], ["1-H01", 1], ["1-H03", 1], ["1-H04", 1]] },
  { sku: "Psc02", nama: "Kopi Klasik - HOT", kategori: "coffee", harga: 20000, laku: 54, resep: [["1-P01", 1], ["1-B76", 140], ["1-P03", 22], ["1-H01", 1], ["1-H03", 1]] },
  { sku: "Psc03", nama: "Klasik + Oat - ICE", kategori: "coffee", harga: 26000, laku: 62, resep: [["1-P01", 1], ["1-B55", 130], ["1-P03", 22], ["1-B61", 160], ["1-H01", 1], ["1-H03", 1], ["1-H04", 1]] },
  { sku: "Psc04", nama: "Americano - ICE", kategori: "coffee", harga: 18000, laku: 71, resep: [["1-P01", 1], ["1-B61", 190], ["1-H01", 1], ["1-H03", 1], ["1-H04", 1]] },
  { sku: "Psc05", nama: "Americano - HOT", kategori: "coffee", harga: 18000, laku: 33, resep: [["1-P01", 1], ["1-H01", 1], ["1-H03", 1]] },
  { sku: "Psc06", nama: "Cappuccino - HOT", kategori: "coffee", harga: 24000, laku: 48, resep: [["1-P01", 1], ["1-B76", 150], ["1-H01", 1], ["1-H03", 1]] },
  { sku: "Psc07", nama: "Latte - ICE", kategori: "coffee", harga: 24000, laku: 88, resep: [["1-P01", 1], ["1-B76", 170], ["1-B61", 150], ["1-H01", 1], ["1-H03", 1], ["1-H04", 1]] },
  { sku: "Psc08", nama: "Latte - HOT", kategori: "coffee", harga: 24000, laku: 41, resep: [["1-P01", 1], ["1-B76", 180], ["1-H01", 1], ["1-H03", 1]] },
  { sku: "Psc09", nama: "Caramel Macchiato - ICE", kategori: "coffee", harga: 28000, laku: 76, resep: [["1-P01", 1], ["1-B76", 160], ["1-B42", 24], ["1-B61", 150], ["1-H02", 1], ["1-H03", 1], ["1-H04", 1]] },
  { sku: "Psc10", nama: "Vanilla Latte - ICE", kategori: "coffee", harga: 27000, laku: 58, resep: [["1-P01", 1], ["1-B76", 160], ["1-B41", 24], ["1-B61", 150], ["1-H02", 1], ["1-H03", 1], ["1-H04", 1]] },
  { sku: "Psc11", nama: "Hazelnut Latte - ICE", kategori: "coffee", harga: 27000, laku: 39, resep: [["1-P01", 1], ["1-B76", 160], ["1-B43", 24], ["1-B61", 150], ["1-H02", 1], ["1-H03", 1], ["1-H04", 1]] },
  { sku: "Psc12", nama: "Mocha - ICE", kategori: "coffee", harga: 28000, laku: 44, resep: [["1-P01", 1], ["1-B76", 150], ["1-B32", 18], ["1-B61", 150], ["1-H02", 1], ["1-H03", 1], ["1-H04", 1]] },
  { sku: "Psc13", nama: "Kopi Susu Gula Aren", kategori: "coffee", harga: 22000, laku: 132, resep: [["1-P01", 1], ["1-B76", 140], ["1-P03", 30], ["1-B61", 160], ["1-H01", 1], ["1-H03", 1], ["1-H04", 1]] },
  { sku: "Psc14", nama: "Espresso Single", kategori: "coffee", harga: 15000, laku: 12, resep: [["1-P01", 1], ["1-H01", 1]] },
  { sku: "Psc15", nama: "Piccolo", kategori: "coffee", harga: 22000, laku: 9, resep: [["1-P01", 1], ["1-B76", 60], ["1-H01", 1]] },
  { sku: "Psc16", nama: "Cold Brew Botol", kategori: "coffee", harga: 32000, laku: 21, resep: [["1-B13", 42], ["1-B61", 120], ["1-H02", 1], ["1-H03", 1]] },

  // --- Non-kopi ------------------------------------------------------------
  { sku: "Pnc01", nama: "Matcha Latte - ICE", kategori: "non-coffee", harga: 28000, laku: 67, resep: [["1-B31", 12], ["1-B76", 180], ["1-P02", 26], ["1-B61", 150], ["1-H02", 1], ["1-H03", 1], ["1-H04", 1]] },
  { sku: "Pnc02", nama: "Matcha Latte - HOT", kategori: "non-coffee", harga: 28000, laku: 18, resep: [["1-B31", 12], ["1-B76", 190], ["1-P02", 26], ["1-H01", 1], ["1-H03", 1]] },
  { sku: "Pnc03", nama: "Cokelat - ICE", kategori: "non-coffee", harga: 24000, laku: 54, resep: [["1-B32", 26], ["1-B76", 170], ["1-P02", 22], ["1-B61", 150], ["1-H01", 1], ["1-H03", 1], ["1-H04", 1]] },
  { sku: "Pnc04", nama: "Cokelat - HOT", kategori: "non-coffee", harga: 24000, laku: 26, resep: [["1-B32", 28], ["1-B76", 190], ["1-P02", 22], ["1-H01", 1], ["1-H03", 1]] },
  { sku: "Pnc05", nama: "Red Velvet Latte", kategori: "non-coffee", harga: 27000, laku: 31, resep: [["1-B33", 22], ["1-B76", 175], ["1-P02", 24], ["1-B61", 150], ["1-H02", 1], ["1-H03", 1], ["1-H04", 1]] },
  { sku: "Pnc06", nama: "Taro Latte", kategori: "non-coffee", harga: 26000, laku: 24, resep: [["1-B34", 22], ["1-B76", 175], ["1-P02", 24], ["1-B61", 150], ["1-H02", 1], ["1-H03", 1], ["1-H04", 1]] },
  { sku: "Pnc07", nama: "Lemon Tea - ICE", kategori: "non-coffee", harga: 16000, laku: 82, resep: [["1-B51", 4], ["1-B52", 32], ["1-P02", 30], ["1-B61", 180], ["1-H01", 1], ["1-H03", 1], ["1-H04", 1]] },
  { sku: "Pnc08", nama: "Teh Tawar", kategori: "non-coffee", harga: 8000, laku: 43, resep: [["1-B51", 4], ["1-B61", 160], ["1-H01", 1], ["1-H03", 1], ["1-H04", 1]] },
  { sku: "Pnc09", nama: "Air Mineral", kategori: "non-coffee", harga: 6000, laku: 38, resep: [] },
  { sku: "Pnc10", nama: "Milkshake Vanilla", kategori: "non-coffee", harga: 29000, laku: 17, resep: [["1-B41", 30], ["1-B76", 190], ["1-B22", 40], ["1-B61", 120], ["1-H02", 1], ["1-H03", 1], ["1-H04", 1]] },
  { sku: "Pnc11", nama: "Lychee Yakult", kategori: "non-coffee", harga: 25000, laku: 12, resep: [] },
  { sku: "Pnc12", nama: "Es Kopi Kelapa", kategori: "non-coffee", harga: 26000, laku: 7, resep: [] },

  // --- Snack ---------------------------------------------------------------
  { sku: "Psn01", nama: "Kentang Goreng", kategori: "snack", harga: 22000, laku: 96, resep: [["1-K11", 160], ["1-K16", 22], ["1-H05", 1]] },
  { sku: "Psn02", nama: "Kentang Goreng Keju", kategori: "snack", harga: 28000, laku: 41, resep: [["1-K11", 160], ["1-K16", 22], ["1-K21", 30], ["1-H05", 1]] },
  { sku: "Psn03", nama: "Nugget Ayam", kategori: "snack", harga: 24000, laku: 52, resep: [["1-K12", 130], ["1-K16", 20], ["1-H05", 1]] },
  { sku: "Psn04", nama: "Sosis Bakar", kategori: "snack", harga: 20000, laku: 34, resep: [["1-K13", 2], ["1-C01", 18], ["1-H05", 1]] },
  { sku: "Psn05", nama: "Tahu Bakso Goreng", kategori: "snack", harga: 18000, laku: 47, resep: [["1-K19", 4], ["1-K16", 18], ["1-C02", 16], ["1-H05", 1]] },
  { sku: "Psn06", nama: "Roti Bakar Cokelat", kategori: "snack", harga: 19000, laku: 28, resep: [["1-K20", 2], ["1-K22", 14], ["1-B32", 22], ["1-H05", 1]] },
  { sku: "Psn07", nama: "Pisang Goreng Madu", kategori: "snack", harga: 20000, laku: 22, resep: [] },
  { sku: "Psn08", nama: "Mix Platter", kategori: "snack", harga: 45000, laku: 14, resep: [["1-K11", 110], ["1-K12", 80], ["1-K13", 2], ["1-K16", 34], ["1-H05", 1]] },
  { sku: "Psn09", nama: "Cireng Bumbu Rujak", kategori: "snack", harga: 17000, laku: 8, resep: [] },

  // --- Nasi ----------------------------------------------------------------
  { sku: "Prc01", nama: "Chicken Katsu Teriyaki", kategori: "rice", harga: 38000, laku: 63, resep: [["1-K14", 130], ["1-K15", 40], ["1-K16", 28], ["1-K17", 180], ["1-C01", 32], ["1-L02", 1], ["1-H05", 1]] },
  { sku: "Prc02", nama: "Chicken Katsu Sambal Matah", kategori: "rice", harga: 39000, laku: 44, resep: [["1-K14", 130], ["1-K15", 40], ["1-K16", 28], ["1-K17", 180], ["1-C02", 30], ["1-L06", 12], ["1-H05", 1]] },
  { sku: "Prc03", nama: "Nasi Goreng Spesial", kategori: "rice", harga: 35000, laku: 51, resep: [["1-K17", 200], ["1-L01", 1], ["1-K16", 24], ["1-L04", 26], ["1-L05", 12], ["1-K13", 1], ["1-H05", 1]] },
  { sku: "Prc04", nama: "Mie Goreng Spesial", kategori: "rice", harga: 33000, laku: 37, resep: [["1-K18", 120], ["1-L01", 1], ["1-K16", 22], ["1-L04", 24], ["1-L05", 12], ["1-H05", 1]] },
  { sku: "Prc05", nama: "Nasi Ayam Sambal Matah", kategori: "rice", harga: 37000, laku: 29, resep: [["1-K14", 120], ["1-K17", 180], ["1-C02", 34], ["1-L06", 14], ["1-H05", 1]] },
  { sku: "Prc06", nama: "Chicken Rice Bowl Mayo", kategori: "rice", harga: 36000, laku: 33, resep: [["1-K14", 120], ["1-K15", 34], ["1-K16", 26], ["1-K17", 180], ["1-C03", 28], ["1-L03", 24], ["1-H05", 1]] },
  { sku: "Prc07", nama: "Nasi Telur Balado", kategori: "rice", harga: 26000, laku: 19, resep: [] },

  // --- Add-on --------------------------------------------------------------
  { sku: "Pad01", nama: "Extra Shot Espresso", kategori: "add-on", harga: 6000, laku: 58, resep: [["1-P01", 1]] },
  { sku: "Pad02", nama: "Ganti Susu Oat", kategori: "add-on", harga: 8000, laku: 34, resep: [["1-B55", 60]] },
  { sku: "Pad03", nama: "Extra Keju", kategori: "add-on", harga: 7000, laku: 26, resep: [["1-K21", 30]] },
  { sku: "Pad04", nama: "Extra Telur", kategori: "add-on", harga: 6000, laku: 31, resep: [["1-L01", 1], ["1-K16", 8]] },
  { sku: "Pad05", nama: "Extra Nasi", kategori: "add-on", harga: 8000, laku: 22, resep: [["1-K17", 150]] },
  { sku: "Pad06", nama: "Takeaway Kemasan", kategori: "add-on", harga: 3000, laku: 41, resep: [] },
];

/**
 * Indeks musiman bulanan (Jan–Des). Dipakai untuk mengarang riwayat penjualan
 * sekaligus jadi basis penyesuaian musiman di mesin forecast.
 */
export const INDEKS_MUSIMAN = [
  0.92, 0.88, 0.96, 1.02, 1.05, 1.12, 1.14, 1.08, 1.0, 0.98, 1.03, 1.12,
];
