import { acakDeterministik } from "../utils";
import {
  awalMinggu,
  keIsoTanggal,
  keTanggal,
  tambahHari,
} from "../format";
import type {
  Bahan,
  BatchRestock,
  CatatanPenjualan,
  CatatanWaste,
  ItemResep,
  LogImpor,
  Menu,
  Pemasok,
  Profil,
} from "../types";
import { BAHAN, INDEKS_MUSIMAN, MENU, PEMASOK } from "./katalog";

/**
 * Tanggal acuan sistem. Dipatok supaya seluruh angka contoh stabil dan
 * cocok dengan PRD (3 September 2026, minggu 36).
 */
export const HARI_INI = keTanggal("2026-09-03");

const rnd = acakDeterministik(20260903);

/** Variasi ±`spread` di sekitar 1. */
function goyang(spread: number): number {
  return 1 + (rnd() - 0.5) * 2 * spread;
}

// ---------------------------------------------------------------------------
// Master
// ---------------------------------------------------------------------------

export const profil: Profil[] = [
  {
    id: "u-owner",
    namaLengkap: "Andi Prasetyo",
    email: "andi@dashboardbi.id",
    role: "owner",
    isActive: true,
    createdAt: "2026-01-04",
  },
  {
    id: "u-admin",
    namaLengkap: "Budi Santoso",
    email: "budi@dashboardbi.id",
    role: "admin",
    isActive: true,
    createdAt: "2026-01-04",
  },
  {
    id: "u-stock",
    namaLengkap: "Rina Meilani",
    email: "rina@dashboardbi.id",
    role: "stock",
    isActive: true,
    createdAt: "2026-01-04",
  },
  {
    id: "u-stock-2",
    namaLengkap: "Dewi Anggraini",
    email: "dewi@dashboardbi.id",
    role: "stock",
    isActive: false,
    createdAt: "2026-03-11",
  },
];

export const pemasok: Pemasok[] = PEMASOK.map((p, i) => ({
  id: `sup-${i + 1}`,
  nama: p.nama,
  kontak: p.kontak,
  leadTimeHari: p.leadTimeHari,
}));

export const bahan: Bahan[] = BAHAN.map((b, i) => ({
  id: `ing-${i + 1}`,
  sku: b.sku,
  nama: b.nama,
  kategori: b.kategori,
  satuan: b.satuan,
  shelfLifeHari: b.shelfLife ?? 14,
  stokMinimum: null,
  hargaPerUnitTerakhir: b.harga,
  isActive: true,
}));

const bahanPerSku = new Map(bahan.map((b) => [b.sku, b]));
const benihPerSku = new Map(BAHAN.map((b) => [b.sku, b]));

export const menu: Menu[] = MENU.map((m, i) => ({
  id: `menu-${i + 1}`,
  sku: m.sku,
  nama: m.nama,
  kategori: m.kategori,
  hargaJual: m.harga,
  isActive: true,
}));

export const resep: ItemResep[] = MENU.flatMap((m, i) =>
  m.resep.map(([sku, qty], j) => {
    const b = bahanPerSku.get(sku)!;
    return {
      id: `res-${i + 1}-${j + 1}`,
      menuId: `menu-${i + 1}`,
      ingredientId: b.id,
      qtyPerPorsi: qty,
      satuan: b.satuan,
      isOptional: false,
    };
  }),
);

// ---------------------------------------------------------------------------
// Penjualan — mingguan 20 minggu terakhir + bulanan sepanjang 2025
// ---------------------------------------------------------------------------

export const JUMLAH_MINGGU = 20;

/** Senin dari minggu berjalan. */
export const mingguIni = awalMinggu(HARI_INI);

/** Daftar Senin, dari yang paling lama ke minggu berjalan. */
export const mingguan: Date[] = Array.from({ length: JUMLAH_MINGGU }, (_, i) =>
  tambahHari(mingguIni, -(JUMLAH_MINGGU - 1 - i) * 7),
);

const penjualanList: CatatanPenjualan[] = [];

MENU.forEach((m, i) => {
  const menuId = `menu-${i + 1}`;

  // Menu musiman: dua menu baru muncul di pertengahan periode, meniru
  // temuan di PRD bagian 6.2 (menu baru, jangan dianggap penurunan).
  const mulaiDariMinggu =
    m.sku === "Pnc12" ? 13 : m.sku === "Prc07" ? 9 : 0;

  // Tren lembut per menu supaya regresi linear di forecast punya bahan.
  const arah = rnd() < 0.42 ? 1 : rnd() < 0.7 ? -1 : 0;
  const kekuatanTren = arah * (0.004 + rnd() * 0.012);

  mingguan.forEach((senin, w) => {
    if (w < mulaiDariMinggu) return;

    const musim = INDEKS_MUSIMAN[senin.getMonth()];
    const tren = 1 + kekuatanTren * (w - JUMLAH_MINGGU / 2);
    const dasar = m.laku * musim * tren * goyang(0.16);

    // Menu jarang terjual sering kosong sama sekali di suatu minggu.
    const qty =
      m.laku < 15 && rnd() < 0.45 ? 0 : Math.max(0, Math.round(dasar));

    penjualanList.push({
      id: `sale-w-${i + 1}-${w}`,
      menuId,
      periodeMulai: keIsoTanggal(senin),
      periodeSelesai: keIsoTanggal(tambahHari(senin, 6)),
      granularitas: "weekly",
      qtyTerjual: qty,
      hargaSaatItu: m.harga,
    });
  });

  // Riwayat bulanan 2025 — baseline musiman.
  for (let bulan = 0; bulan < 12; bulan++) {
    const qty = Math.round(
      m.laku * 4.33 * INDEKS_MUSIMAN[bulan] * 0.94 * goyang(0.12),
    );
    const mulai = new Date(2025, bulan, 1);
    const selesai = new Date(2025, bulan + 1, 0);
    penjualanList.push({
      id: `sale-m-${i + 1}-${bulan}`,
      menuId,
      periodeMulai: keIsoTanggal(mulai),
      periodeSelesai: keIsoTanggal(selesai),
      granularitas: "monthly",
      qtyTerjual: qty,
      hargaSaatItu: m.harga,
    });
  }
});

export const penjualan: CatatanPenjualan[] = penjualanList;

// ---------------------------------------------------------------------------
// Restock — batch dibuat mundur dari hari ini, sisa qty diatur supaya
// sebagian bahan jatuh ke zona kritis/waspada. Kadaluarsa = terima + shelf life.
// ---------------------------------------------------------------------------

const batchList: BatchRestock[] = [];
let nomorBatch = 0;

/** Bahan-bahan yang sengaja dibuat bermasalah, biar dashboard punya cerita. */
const BERMASALAH: Record<string, number> = {
  "1-B55": 2, // Oatside — kritis, sisa 2 hari
  "1-L02": 1, // Selada — kritis
  "1-L05": 3,
  "1-B33": 5, // Red Velvet — waspada
  "1-B34": 6,
  "1-L06": 4,
  "1-K19": 3,
  "1-B31": 7,
  "1-C02": 6,
  "1-L03": -1, // sudah kadaluarsa
};

BAHAN.forEach((b, i) => {
  const bh = bahan[i];
  const shelf = bh.shelfLifeHari;
  const supplierId =
    pemasok[
      b.kategori === "packaging"
        ? 3
        : b.kategori === "fresh"
          ? 2
          : b.kategori === "beverage" && b.nama.startsWith("Beans")
            ? 4
            : b.kategori === "kitchen"
              ? 1
              : 0
    ].id;

  // Batch lama yang sudah habis — jadi riwayat restock.
  const jumlahBatchLama = 4 + Math.floor(rnd() * 4);
  for (let k = jumlahBatchLama; k >= 1; k--) {
    const terima = tambahHari(HARI_INI, -(k * Math.max(5, shelf - 2) + 3));
    const qty = Math.round(b.pakaiHarian * shelf * goyang(0.2));
    const hargaSaatItu = b.harga * (1 - k * 0.012) * goyang(0.03);
    const total = Math.round(qty * hargaSaatItu);
    nomorBatch++;
    batchList.push({
      id: `bat-${nomorBatch}`,
      ingredientId: bh.id,
      supplierId,
      jumlah: qty,
      sisaQty: 0,
      satuan: b.satuan,
      totalBiaya: total,
      biayaPerUnit: Math.round((total / qty) * 100) / 100,
      tanggalPemesanan: keIsoTanggal(tambahHari(terima, -2)),
      tanggalTerima: keIsoTanggal(terima),
      tanggalKadaluarsa: keIsoTanggal(tambahHari(terima, shelf)),
      status: "arrived",
      catatan: k === 1 ? "invoice TS 0" + (300 + i) : undefined,
    });
  }

  // Batch aktif — sisa hari ditentukan langsung supaya statusnya terkendali.
  const sisaHariTarget =
    BERMASALAH[b.sku] ?? Math.round(shelf * (0.45 + rnd() * 0.5));
  const terimaAktif = tambahHari(HARI_INI, sisaHariTarget - shelf);
  const qtyAktif = Math.round(b.pakaiHarian * shelf * goyang(0.15));
  const totalAktif = Math.round(qtyAktif * b.harga * goyang(0.02));
  // Sisa proporsional dengan umur batch, plus sedikit variasi.
  const terpakai = Math.min(
    qtyAktif,
    Math.round(b.pakaiHarian * (shelf - sisaHariTarget) * goyang(0.18)),
  );
  nomorBatch++;
  batchList.push({
    id: `bat-${nomorBatch}`,
    ingredientId: bh.id,
    supplierId,
    jumlah: qtyAktif,
    sisaQty: Math.max(0, qtyAktif - terpakai),
    satuan: b.satuan,
    totalBiaya: totalAktif,
    biayaPerUnit: Math.round((totalAktif / qtyAktif) * 100) / 100,
    tanggalPemesanan: keIsoTanggal(tambahHari(terimaAktif, -2)),
    tanggalTerima: keIsoTanggal(terimaAktif),
    tanggalKadaluarsa: keIsoTanggal(tambahHari(terimaAktif, shelf)),
    status: "arrived",
  });

  // Sebagian bahan punya batch kedua yang lebih baru — supaya FEFO terasa.
  if (rnd() < 0.55) {
    const sisaHari2 = Math.min(shelf, sisaHariTarget + Math.round(shelf * 0.6));
    const terima2 = tambahHari(HARI_INI, sisaHari2 - shelf);
    const qty2 = Math.round(b.pakaiHarian * shelf * 0.7 * goyang(0.15));
    const total2 = Math.round(qty2 * b.harga * goyang(0.02));
    nomorBatch++;
    batchList.push({
      id: `bat-${nomorBatch}`,
      ingredientId: bh.id,
      supplierId,
      jumlah: qty2,
      sisaQty: qty2,
      satuan: b.satuan,
      totalBiaya: total2,
      biayaPerUnit: Math.round((total2 / qty2) * 100) / 100,
      tanggalPemesanan: keIsoTanggal(tambahHari(terima2, -2)),
      tanggalTerima: keIsoTanggal(terima2),
      tanggalKadaluarsa: keIsoTanggal(tambahHari(terima2, shelf)),
      status: "arrived",
    });
  }

  // Satu pesanan yang masih di jalan.
  if (rnd() < 0.18) {
    const pesan = tambahHari(HARI_INI, -1);
    const qty3 = Math.round(b.pakaiHarian * shelf * 0.8);
    nomorBatch++;
    batchList.push({
      id: `bat-${nomorBatch}`,
      ingredientId: bh.id,
      supplierId,
      jumlah: qty3,
      sisaQty: qty3,
      satuan: b.satuan,
      totalBiaya: Math.round(qty3 * b.harga),
      biayaPerUnit: b.harga,
      tanggalPemesanan: keIsoTanggal(pesan),
      tanggalTerima: keIsoTanggal(tambahHari(pesan, 3)),
      tanggalKadaluarsa: keIsoTanggal(tambahHari(pesan, 3 + shelf)),
      status: "ordered",
      catatan: "menunggu kiriman",
    });
  }
});

export const batch: BatchRestock[] = batchList.sort((a, b) =>
  a.tanggalTerima < b.tanggalTerima ? 1 : -1,
);

// ---------------------------------------------------------------------------
// Waste — 14 minggu terakhir
// ---------------------------------------------------------------------------

const wasteList: CatatanWaste[] = [];
const alasanTersedia = ["expired", "rusak", "tumpah", "lainnya"] as const;

for (let w = 13; w >= 0; w--) {
  const jumlahCatatan = 1 + Math.floor(rnd() * 4);
  for (let k = 0; k < jumlahCatatan; k++) {
    const b = BAHAN[Math.floor(rnd() * BAHAN.length)];
    const bh = bahanPerSku.get(b.sku)!;
    const qty = Math.round(b.pakaiHarian * (0.2 + rnd() * 1.4));
    if (qty <= 0) continue;
    wasteList.push({
      id: `wst-${w}-${k}`,
      batchId: batch.find((x) => x.ingredientId === bh.id)?.id ?? "bat-1",
      ingredientId: bh.id,
      qty,
      alasan: alasanTersedia[Math.floor(rnd() * (rnd() < 0.6 ? 1 : 4))],
      nilaiKerugian: Math.round(qty * b.harga),
      tanggal: keIsoTanggal(tambahHari(mingguIni, -w * 7 + Math.floor(rnd() * 6))),
      catatan: undefined,
    });
  }
}

export const waste: CatatanWaste[] = wasteList.sort((a, b) =>
  a.tanggal < b.tanggal ? 1 : -1,
);

// ---------------------------------------------------------------------------
// Riwayat impor
// ---------------------------------------------------------------------------

export const imporLog: LogImpor[] = [
  {
    id: "imp-1",
    tipe: "sales",
    namaFile: "rekap-penjualan-2026-W35.xlsx",
    jumlahBaris: 52,
    jumlahSukses: 52,
    jumlahGagal: 0,
    status: "applied",
    createdAt: "2026-09-01T09:12:00+07:00",
    createdBy: "Budi Santoso",
  },
  {
    id: "imp-2",
    tipe: "restock",
    namaFile: "restock_september.xlsx",
    jumlahBaris: 572,
    jumlahSukses: 565,
    jumlahGagal: 7,
    status: "applied",
    createdAt: "2026-08-31T16:40:00+07:00",
    createdBy: "Rina Meilani",
  },
  {
    id: "imp-3",
    tipe: "sales",
    namaFile: "rekap-penjualan-2026-W34.xlsx",
    jumlahBaris: 52,
    jumlahSukses: 51,
    jumlahGagal: 1,
    status: "applied",
    createdAt: "2026-08-25T08:55:00+07:00",
    createdBy: "Budi Santoso",
  },
  {
    id: "imp-4",
    tipe: "restock",
    namaFile: "restock_agustus_koreksi.xlsx",
    jumlahBaris: 38,
    jumlahSukses: 0,
    jumlahGagal: 38,
    status: "rolled_back",
    createdAt: "2026-08-19T14:02:00+07:00",
    createdBy: "Rina Meilani",
  },
  {
    id: "imp-5",
    tipe: "sales",
    namaFile: "rekap-penjualan-2026-W33.xlsx",
    jumlahBaris: 52,
    jumlahSukses: 52,
    jumlahGagal: 0,
    status: "applied",
    createdAt: "2026-08-18T09:30:00+07:00",
    createdBy: "Budi Santoso",
  },
];

export { benihPerSku };
