/** Model data — mengikuti PRD.md bagian 7.2. */

export type Peran = "stock" | "admin" | "owner";

export type KategoriBahan =
  | "beverage"
  | "kitchen"
  | "packaging"
  | "fresh"
  | "base";

export type KategoriMenu =
  | "coffee"
  | "non-coffee"
  | "snack"
  | "rice"
  | "add-on";

export type StatusKesegaran = "aman" | "waspada" | "kritis" | "kadaluarsa";

export type StatusRestock = "ordered" | "arrived" | "cancelled";

export type AlasanWaste = "expired" | "rusak" | "tumpah" | "lainnya";

export type Kuadran = "bintang" | "teka-teki" | "kuda-beban" | "anjing";

export interface Profil {
  id: string;
  namaLengkap: string;
  email: string;
  role: Peran;
  isActive: boolean;
  createdAt: string;
}

export interface Pemasok {
  id: string;
  nama: string;
  kontak?: string;
  leadTimeHari: number;
}

export interface Bahan {
  id: string;
  sku: string;
  nama: string;
  kategori: KategoriBahan;
  satuan: string;
  shelfLifeHari: number;
  stokMinimum: number | null;
  hargaPerUnitTerakhir: number;
  isActive: boolean;
}

export interface BatchRestock {
  id: string;
  ingredientId: string;
  supplierId: string | null;
  jumlah: number;
  sisaQty: number;
  satuan: string;
  totalBiaya: number;
  biayaPerUnit: number;
  tanggalPemesanan: string;
  tanggalTerima: string;
  tanggalKadaluarsa: string;
  status: StatusRestock;
  catatan?: string;
}

export interface Menu {
  id: string;
  sku: string;
  nama: string;
  kategori: KategoriMenu;
  hargaJual: number;
  isActive: boolean;
}

export interface ItemResep {
  id: string;
  menuId: string;
  ingredientId: string;
  qtyPerPorsi: number;
  satuan: string;
  isOptional: boolean;
}

export interface CatatanPenjualan {
  id: string;
  menuId: string;
  periodeMulai: string;
  periodeSelesai: string;
  granularitas: "weekly" | "monthly";
  qtyTerjual: number;
  hargaSaatItu: number;
}

export interface CatatanWaste {
  id: string;
  batchId: string;
  ingredientId: string;
  qty: number;
  alasan: AlasanWaste;
  nilaiKerugian: number;
  tanggal: string;
  catatan?: string;
}

export interface LogImpor {
  id: string;
  tipe: "restock" | "sales";
  namaFile: string;
  jumlahBaris: number;
  jumlahSukses: number;
  jumlahGagal: number;
  status: "pending" | "applied" | "rolled_back";
  createdAt: string;
  createdBy: string;
}

// ---------------------------------------------------------------------------
// Bentuk turunan — hasil hitungan, bukan tabel
// ---------------------------------------------------------------------------

export interface StokBahan {
  bahan: Bahan;
  sisaStok: number;
  nilaiStok: number;
  konsumsiHarian: number;
  hariTersisa: number;
  status: StatusKesegaran;
  batchAktif: BatchRestock[];
  batchTerdekat: BatchRestock | null;
  perluRestock: boolean;
}

export interface ProfitabilitasMenu {
  menu: Menu;
  hpp: number;
  punyaResep: boolean;
  qtyTerjual: number;
  marginRp: number;
  marginPersen: number;
  totalKontribusi: number;
  pendapatan: number;
  kuadran: Kuadran;
}

export interface RisikoBatch {
  batch: BatchRestock;
  bahan: Bahan;
  sisaHari: number;
  status: StatusKesegaran;
  nilaiRisiko: number;
}

export interface PnlMingguan {
  minggu: string;
  labelMinggu: string;
  pendapatan: number;
  hpp: number;
  labaKotor: number;
  marginPersen: number;
}

export interface KonsumsiBahan {
  bahan: Bahan;
  qtyTerpakai: number;
  nilaiRupiah: number;
  sisaStok: number;
  hariTersisa: number;
  status: StatusKesegaran;
}

export interface PrediksiMenu {
  menuId: string;
  nama: string;
  prediksi: number;
  batasBawah: number;
  batasAtas: number;
  tren: "naik" | "turun" | "datar";
  kepercayaan: "tinggi" | "sedang" | "rendah";
  metode: "moving-average" | "croston" | "kategori";
}

export interface KebutuhanBahan {
  bahan: Bahan;
  prediksiPakai: number;
  sisaStok: number;
  perluPesan: number;
  batasExp: number;
  berisikoTerbuang: boolean;
}

export interface PenilaianMingguan {
  status: "aman" | "waspada" | "bahaya";
  kalimat: string;
  temuan: string[];
}
