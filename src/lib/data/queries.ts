import {
  akhirMinggu,
  keIsoTanggal,
  keTanggal,
  labelMinggu,
  selisihHari,
  tambahHari,
} from "../format";
import { statusDariSisaHari, tentukanKuadran } from "../status";
import type {
  Bahan,
  BatchRestock,
  KonsumsiBahan,
  Menu,
  PenilaianMingguan,
  PnlMingguan,
  ProfitabilitasMenu,
  RisikoBatch,
  StokBahan,
} from "../types";
import { median, rata2, stdev } from "../utils";
import {
  HARI_INI,
  bahan,
  batch,
  menu,
  mingguan,
  mingguIni,
  penjualan,
  pemasok,
  resep,
  waste,
} from "./seed";

// Padanan view di PRD bagian 7.3, dihitung di memori.
// Semua fungsi murni supaya gampang dipindah ke SQL nanti.

export const bahanPerId = new Map(bahan.map((b) => [b.id, b]));
export const menuPerId = new Map(menu.map((m) => [m.id, m]));
export const pemasokPerId = new Map(pemasok.map((p) => [p.id, p]));

const resepPerMenu = new Map<string, typeof resep>();
for (const r of resep) {
  const daftar = resepPerMenu.get(r.menuId) ?? [];
  daftar.push(r);
  resepPerMenu.set(r.menuId, daftar);
}

export function resepMenu(menuId: string) {
  return resepPerMenu.get(menuId) ?? [];
}

const penjualanMingguan = penjualan.filter((p) => p.granularitas === "weekly");
const penjualanBulanan = penjualan.filter((p) => p.granularitas === "monthly");

export { penjualanMingguan, penjualanBulanan };

/** Batch yang sudah diterima dan masih menyisakan stok. */
export const batchAktif = batch.filter(
  (b) => b.status === "arrived" && b.sisaQty > 0,
);

// ---------------------------------------------------------------------------
// v_menu_hpp
// ---------------------------------------------------------------------------

export function hppMenu(menuId: string): number {
  return resepMenu(menuId).reduce((total, item) => {
    const b = bahanPerId.get(item.ingredientId);
    return total + (b ? item.qtyPerPorsi * b.hargaPerUnitTerakhir : 0);
  }, 0);
}

/** Rincian HPP per bahan — untuk grafik batang bertumpuk di detail menu. */
export function rincianHpp(menuId: string) {
  return resepMenu(menuId)
    .map((item) => {
      const b = bahanPerId.get(item.ingredientId)!;
      return {
        bahan: b,
        qtyPerPorsi: item.qtyPerPorsi,
        satuan: item.satuan,
        biayaPerUnit: b.hargaPerUnitTerakhir,
        subtotal: item.qtyPerPorsi * b.hargaPerUnitTerakhir,
      };
    })
    .sort((a, b) => b.subtotal - a.subtotal);
}

// ---------------------------------------------------------------------------
// Penjualan per periode
// ---------------------------------------------------------------------------

export interface Rentang {
  mulai: Date;
  selesai: Date;
  label: string;
}

export function rentangMingguKe(offset: number): Rentang {
  const mulai = tambahHari(mingguIni, offset * 7);
  return {
    mulai,
    selesai: akhirMinggu(mulai),
    label: labelMinggu(mulai),
  };
}

export function penjualanDalamRentang(r: Rentang) {
  const a = keIsoTanggal(r.mulai);
  const b = keIsoTanggal(r.selesai);
  return penjualanMingguan.filter(
    (p) => p.periodeMulai >= a && p.periodeMulai <= b,
  );
}

export function qtyPerMenu(r: Rentang): Map<string, number> {
  const peta = new Map<string, number>();
  for (const p of penjualanDalamRentang(r)) {
    peta.set(p.menuId, (peta.get(p.menuId) ?? 0) + p.qtyTerjual);
  }
  return peta;
}

// ---------------------------------------------------------------------------
// v_menu_profitability
// ---------------------------------------------------------------------------

export function profitabilitas(r: Rentang): ProfitabilitasMenu[] {
  const qty = qtyPerMenu(r);

  const dasar = menu.map((m) => {
    const hpp = hppMenu(m.id);
    const punyaResep = resepMenu(m.id).length > 0;
    const terjual = qty.get(m.id) ?? 0;
    const marginRp = m.hargaJual - hpp;
    const marginPersen = m.hargaJual ? (marginRp / m.hargaJual) * 100 : 0;
    return {
      menu: m,
      hpp,
      punyaResep,
      qtyTerjual: terjual,
      marginRp,
      marginPersen,
      totalKontribusi: marginRp * terjual,
      pendapatan: m.hargaJual * terjual,
    };
  });

  // Pembagi kuadran pakai median, bukan nol — DESIGN.md bagian 3.6.
  const denganResep = dasar.filter((d) => d.punyaResep && d.qtyTerjual > 0);
  const medQty = median(denganResep.map((d) => d.qtyTerjual));
  const medMargin = median(denganResep.map((d) => d.marginPersen));

  return dasar.map((d) => ({
    ...d,
    kuadran: tentukanKuadran(d.qtyTerjual, d.marginPersen, medQty, medMargin),
  }));
}

export function medianKuadran(data: ProfitabilitasMenu[]) {
  const layak = data.filter((d) => d.punyaResep && d.qtyTerjual > 0);
  return {
    qty: median(layak.map((d) => d.qtyTerjual)),
    margin: median(layak.map((d) => d.marginPersen)),
  };
}

// ---------------------------------------------------------------------------
// v_ingredient_consumption
// ---------------------------------------------------------------------------

export function konsumsiBahanRentang(r: Rentang): Map<string, number> {
  const peta = new Map<string, number>();
  const qty = qtyPerMenu(r);
  for (const [menuId, terjual] of qty) {
    for (const item of resepMenu(menuId)) {
      peta.set(
        item.ingredientId,
        (peta.get(item.ingredientId) ?? 0) + terjual * item.qtyPerPorsi,
      );
    }
  }
  return peta;
}

/** Konsumsi harian rata-rata 28 hari terakhir — PRD bagian 9.6. */
const konsumsiHarianCache = new Map<string, number>();

export function konsumsiHarian(ingredientId: string): number {
  if (konsumsiHarianCache.size === 0) {
    const r: Rentang = {
      mulai: tambahHari(mingguIni, -28),
      selesai: tambahHari(mingguIni, -1),
      label: "28 hari",
    };
    for (const [id, total] of konsumsiBahanRentang(r)) {
      konsumsiHarianCache.set(id, total / 28);
    }
  }
  return konsumsiHarianCache.get(ingredientId) ?? 0;
}

/** Standar deviasi konsumsi harian, diturunkan dari sebaran mingguan. */
export function stdevKonsumsiHarian(ingredientId: string): number {
  const mingguanQty = mingguan.slice(-8).map((senin) => {
    const r: Rentang = {
      mulai: senin,
      selesai: akhirMinggu(senin),
      label: labelMinggu(senin),
    };
    return (konsumsiBahanRentang(r).get(ingredientId) ?? 0) / 7;
  });
  return stdev(mingguanQty);
}

// ---------------------------------------------------------------------------
// v_stock_on_hand
// ---------------------------------------------------------------------------

const batchPerBahan = new Map<string, BatchRestock[]>();
for (const b of batchAktif) {
  const daftar = batchPerBahan.get(b.ingredientId) ?? [];
  daftar.push(b);
  batchPerBahan.set(b.ingredientId, daftar);
}
for (const daftar of batchPerBahan.values()) {
  // FEFO: yang paling dekat kadaluarsa duluan.
  daftar.sort((a, b) => (a.tanggalKadaluarsa < b.tanggalKadaluarsa ? -1 : 1));
}

export function batchAktifBahan(ingredientId: string): BatchRestock[] {
  return batchPerBahan.get(ingredientId) ?? [];
}

export function riwayatBatch(ingredientId: string): BatchRestock[] {
  return batch
    .filter((b) => b.ingredientId === ingredientId)
    .sort((a, b) => (a.tanggalTerima < b.tanggalTerima ? 1 : -1));
}

export function stokBahan(b: Bahan): StokBahan {
  const batches = batchAktifBahan(b.id);
  const sisaStok = batches.reduce((t, x) => t + x.sisaQty, 0);
  const nilaiStok = batches.reduce((t, x) => t + x.sisaQty * x.biayaPerUnit, 0);
  const harian = konsumsiHarian(b.id);
  const hariTersisa = harian > 0 ? sisaStok / harian : Infinity;
  const terdekat = batches[0] ?? null;
  const sisaHariExp = terdekat
    ? selisihHari(terdekat.tanggalKadaluarsa, HARI_INI)
    : Infinity;

  const sup = pemasok[0];
  const leadTime = sup?.leadTimeHari ?? 3;

  return {
    bahan: b,
    sisaStok,
    nilaiStok,
    konsumsiHarian: harian,
    hariTersisa,
    status: statusDariSisaHari(
      Number.isFinite(sisaHariExp) ? sisaHariExp : 999,
    ),
    batchAktif: batches,
    batchTerdekat: terdekat,
    perluRestock: hariTersisa < leadTime + 2,
  };
}

export function semuaStok(): StokBahan[] {
  return bahan.filter((b) => b.isActive).map(stokBahan);
}

// ---------------------------------------------------------------------------
// v_expiry_risk
// ---------------------------------------------------------------------------

export function risikoKadaluarsa(dalamHari = 7): RisikoBatch[] {
  return batchAktif
    .map((b) => {
      const sisaHari = selisihHari(b.tanggalKadaluarsa, HARI_INI);
      return {
        batch: b,
        bahan: bahanPerId.get(b.ingredientId)!,
        sisaHari,
        status: statusDariSisaHari(sisaHari),
        nilaiRisiko: b.sisaQty * b.biayaPerUnit,
      };
    })
    .filter((x) => x.sisaHari <= dalamHari)
    .sort((a, b) => a.sisaHari - b.sisaHari);
}

export function semuaBatchBerisiko(): RisikoBatch[] {
  return batchAktif
    .map((b) => {
      const sisaHari = selisihHari(b.tanggalKadaluarsa, HARI_INI);
      return {
        batch: b,
        bahan: bahanPerId.get(b.ingredientId)!,
        sisaHari,
        status: statusDariSisaHari(sisaHari),
        nilaiRisiko: b.sisaQty * b.biayaPerUnit,
      };
    })
    .sort((a, b) => a.sisaHari - b.sisaHari);
}

export function totalNilaiStok(): number {
  return batchAktif.reduce((t, b) => t + b.sisaQty * b.biayaPerUnit, 0);
}

export function totalNilaiRisiko(): number {
  return risikoKadaluarsa().reduce((t, r) => t + r.nilaiRisiko, 0);
}

// ---------------------------------------------------------------------------
// v_weekly_pnl
// ---------------------------------------------------------------------------

export function pnlMingguan(jumlahMinggu = 12): PnlMingguan[] {
  return mingguan.slice(-jumlahMinggu).map((senin) => {
    const r: Rentang = {
      mulai: senin,
      selesai: akhirMinggu(senin),
      label: labelMinggu(senin),
    };
    let pendapatan = 0;
    let hpp = 0;
    for (const p of penjualanDalamRentang(r)) {
      pendapatan += p.qtyTerjual * p.hargaSaatItu;
      hpp += p.qtyTerjual * hppMenu(p.menuId);
    }
    const labaKotor = pendapatan - hpp;
    return {
      minggu: keIsoTanggal(senin),
      labelMinggu: r.label,
      pendapatan,
      hpp,
      labaKotor,
      marginPersen: pendapatan ? (labaKotor / pendapatan) * 100 : 0,
    };
  });
}

export interface RingkasanPeriode {
  pendapatan: number;
  hpp: number;
  labaKotor: number;
  marginPersen: number;
  qtyTotal: number;
}

export function ringkasan(r: Rentang): RingkasanPeriode {
  let pendapatan = 0;
  let hpp = 0;
  let qtyTotal = 0;
  for (const p of penjualanDalamRentang(r)) {
    pendapatan += p.qtyTerjual * p.hargaSaatItu;
    hpp += p.qtyTerjual * hppMenu(p.menuId);
    qtyTotal += p.qtyTerjual;
  }
  const labaKotor = pendapatan - hpp;
  return {
    pendapatan,
    hpp,
    labaKotor,
    marginPersen: pendapatan ? (labaKotor / pendapatan) * 100 : 0,
    qtyTotal,
  };
}

// ---------------------------------------------------------------------------
// Konsumsi bahan untuk halaman Owner
// ---------------------------------------------------------------------------

export function konsumsiUntukTabel(r: Rentang): KonsumsiBahan[] {
  const konsumsi = konsumsiBahanRentang(r);
  return bahan
    .filter((b) => b.isActive)
    .map((b) => {
      const stok = stokBahan(b);
      const qtyTerpakai = konsumsi.get(b.id) ?? 0;
      return {
        bahan: b,
        qtyTerpakai,
        nilaiRupiah: qtyTerpakai * b.hargaPerUnitTerakhir,
        sisaStok: stok.sisaStok,
        hariTersisa: stok.hariTersisa,
        status: stok.status,
      };
    })
    .sort((a, b) => b.nilaiRupiah - a.nilaiRupiah);
}

// ---------------------------------------------------------------------------
// Waste
// ---------------------------------------------------------------------------

export function wasteMingguan(jumlahMinggu = 12) {
  return mingguan.slice(-jumlahMinggu).map((senin) => {
    const a = keIsoTanggal(senin);
    const b = keIsoTanggal(akhirMinggu(senin));
    const baris = waste.filter((w) => w.tanggal >= a && w.tanggal <= b);
    return {
      minggu: keIsoTanggal(senin),
      labelMinggu: labelMinggu(senin),
      nilai: baris.reduce((t, w) => t + w.nilaiKerugian, 0),
      jumlah: baris.length,
    };
  });
}

export function totalWasteBulanIni(): number {
  const awalBulan = keIsoTanggal(
    new Date(HARI_INI.getFullYear(), HARI_INI.getMonth(), 1),
  );
  return waste
    .filter((w) => w.tanggal >= awalBulan)
    .reduce((t, w) => t + w.nilaiKerugian, 0);
}

// ---------------------------------------------------------------------------
// Penilaian mingguan — aturan biasa, BUKAN AI (DESIGN.md bagian 4.4)
// ---------------------------------------------------------------------------

export function penilaianMinggu(): PenilaianMingguan {
  const ini = rentangMingguKe(0);
  const lalu = rentangMingguKe(-1);
  const a = ringkasan(ini);
  const b = ringkasan(lalu);
  const nilaiRisiko = totalNilaiRisiko();

  const temuan: string[] = [];

  const risikoTinggi = a.pendapatan > 0 && nilaiRisiko > a.pendapatan * 0.05;
  if (risikoTinggi) {
    temuan.push(
      `Nilai bahan berisiko kadaluarsa ${((nilaiRisiko / a.pendapatan) * 100).toFixed(1).replace(".", ",")}% dari pendapatan minggu ini.`,
    );
  }

  const turunMargin = b.marginPersen - a.marginPersen;
  if (turunMargin > 5) {
    temuan.push(
      `Margin turun ${turunMargin.toFixed(1).replace(".", ",")} poin persen dari minggu lalu.`,
    );
  }

  const mepet = semuaStok().filter((s) => s.perluRestock);
  if (mepet.length > 0) {
    temuan.push(
      `${mepet.length} bahan punya sisa hari di bawah lead time pemasok.`,
    );
  }

  const status =
    temuan.length >= 2 ? "bahaya" : temuan.length === 1 ? "waspada" : "aman";

  const naikPendapatan = b.pendapatan
    ? ((a.pendapatan - b.pendapatan) / b.pendapatan) * 100
    : 0;

  const arah = naikPendapatan >= 0 ? "naik" : "turun";
  const besaran = Math.abs(naikPendapatan).toFixed(1).replace(".", ",");

  let kalimat: string;
  if (status === "aman") {
    kalimat = `Penjualan ${arah} ${besaran}% dan tidak ada bahan yang mendesak. Semua batch masih di atas 7 hari.`;
  } else if (risikoTinggi) {
    const jt = (nilaiRisiko / 1_000_000).toFixed(2).replace(".", ",");
    kalimat = `Penjualan ${arah} ${besaran}%, tapi Rp ${jt} juta bahan berisiko kadaluarsa minggu ini.`;
  } else {
    kalimat = `Penjualan ${arah} ${besaran}%. ${temuan[0]}`;
  }

  return { status, kalimat, temuan };
}

// ---------------------------------------------------------------------------
// Turunan kecil yang dipakai beberapa halaman
// ---------------------------------------------------------------------------

export function menuTanpaResep(): Menu[] {
  return menu.filter((m) => resepMenu(m.id).length === 0);
}

export function komposisiKategori(r: Rentang) {
  const qty = qtyPerMenu(r);
  const peta = new Map<string, number>();
  for (const [menuId, terjual] of qty) {
    const m = menuPerId.get(menuId);
    if (!m) continue;
    peta.set(m.kategori, (peta.get(m.kategori) ?? 0) + terjual * m.hargaJual);
  }
  return [...peta.entries()]
    .map(([kategori, nilai]) => ({ kategori, nilai }))
    .sort((a, b) => b.nilai - a.nilai);
}

export function konsumsiMingguanBahan(ingredientId: string, jumlahMinggu = 8) {
  return mingguan.slice(-jumlahMinggu).map((senin) => {
    const r: Rentang = {
      mulai: senin,
      selesai: akhirMinggu(senin),
      label: labelMinggu(senin),
    };
    return {
      label: r.label,
      qty: konsumsiBahanRentang(r).get(ingredientId) ?? 0,
    };
  });
}

export function penjualanMingguanMenu(menuId: string, jumlahMinggu = 12) {
  return mingguan.slice(-jumlahMinggu).map((senin) => {
    const iso = keIsoTanggal(senin);
    const baris = penjualanMingguan.find(
      (p) => p.menuId === menuId && p.periodeMulai === iso,
    );
    return { label: labelMinggu(senin), qty: baris?.qtyTerjual ?? 0 };
  });
}

export function penjualanBulananMenu(menuId: string) {
  return penjualanBulanan
    .filter((p) => p.menuId === menuId)
    .sort((a, b) => (a.periodeMulai < b.periodeMulai ? -1 : 1))
    .map((p) => ({
      label: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"][
        keTanggal(p.periodeMulai).getMonth()
      ],
      qty: p.qtyTerjual,
    }));
}

export function restockTerakhir(n = 5) {
  return batch
    .filter((b) => b.status === "arrived")
    .slice(0, n)
    .map((b) => ({ batch: b, bahan: bahanPerId.get(b.ingredientId)! }));
}

export function rataRataKonsumsiHarianSemua() {
  return rata2(bahan.map((b) => konsumsiHarian(b.id)));
}
