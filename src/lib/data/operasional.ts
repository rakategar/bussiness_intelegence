"use client";

import * as React from "react";
import { acakDeterministik, jumlah } from "../utils";
import { keIsoTanggal, keTanggal, tambahHari } from "../format";
import { tulisLokal, useNilaiLokal } from "../hooks";
import type {
  Anggaran,
  Cabang,
  CatatanPenjualan,
  KategoriMenu,
  Pengeluaran,
  PenggunaanBahan,
  Pengiriman,
} from "../types";
import { HARI_INI, bahan, menu } from "./seed";
import {
  bahanPerId,
  konsumsiBahanRentang,
  menuPerId,
  penjualanMingguan,
  type Rentang,
} from "./queries";

/**
 * Data operasional per cabang: anggaran, pengeluaran, penggunaan bahan, dan
 * pengiriman (Deskripsi per fitur, fitur 3–5, 13–14, 17). Seed dibangkitkan
 * deterministik; perubahan admin disimpan di localStorage lewat useKoleksi
 * sampai backend Supabase tersedia.
 */

const rnd = acakDeterministik(20261013);
const goyang = (spread: number) => 1 + (rnd() - 0.5) * 2 * spread;

// ---------------------------------------------------------------------------
// Master cabang
// ---------------------------------------------------------------------------

export const cabang: Cabang[] = [
  { id: "cab-1", nama: "Dago (Pusat)", kota: "Bandung" },
  { id: "cab-2", nama: "Kemang", kota: "Jakarta Selatan" },
  { id: "cab-3", nama: "Kaliurang", kota: "Yogyakarta" },
];

export const cabangPerId = new Map(cabang.map((c) => [c.id, c]));

/**
 * Porsi penjualan tiap cabang. Data penjualan kasir belum dipecah per cabang,
 * jadi angka per cabang diturunkan dari porsi ini (asumsi).
 */
export const PORSI_CABANG: Record<string, number> = {
  "cab-1": 0.42,
  "cab-2": 0.33,
  "cab-3": 0.25,
};

export function porsiCabang(cabangId?: string): number {
  return cabangId ? (PORSI_CABANG[cabangId] ?? 0) : 1;
}

/** Bulan yang punya data operasional, YYYY-MM, lama ke baru. */
export const PERIODE_OPERASIONAL = [
  "2026-05",
  "2026-06",
  "2026-07",
  "2026-08",
  "2026-09",
];

export function labelPeriode(periode: string): string {
  const [t, b] = periode.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(new Date(t, b - 1, 1));
}

export function rentangBulan(periode: string): Rentang {
  const [t, b] = periode.split("-").map(Number);
  return {
    mulai: new Date(t, b - 1, 1),
    selesai: new Date(t, b, 0),
    label: labelPeriode(periode),
  };
}

export const periodeDari = (tanggal: string) => tanggal.slice(0, 7);

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

const DASAR_ANGGARAN = {
  bahan: { "cab-1": 46_000_000, "cab-2": 37_000_000, "cab-3": 28_000_000 },
  logistik: { "cab-1": 2_400_000, "cab-2": 2_900_000, "cab-3": 2_100_000 },
} as const;

const anggaranAwal: Anggaran[] = PERIODE_OPERASIONAL.flatMap((periode) =>
  cabang.flatMap((c) =>
    (["bahan", "logistik"] as const).map((kategori) => ({
      id: `ang-${periode}-${c.id}-${kategori}`,
      periode,
      cabangId: c.id,
      kategori,
      nominal:
        Math.round(
          (DASAR_ANGGARAN[kategori][c.id as "cab-1"] * goyang(0.04)) / 100_000,
        ) * 100_000,
    })),
  ),
);

/** Bahan yang dibeli rutin — dipakai untuk pengeluaran. */
const bahanBelanja = bahan.filter((b) => b.hargaPerUnitTerakhir > 0).slice(0, 40);

const pengeluaranAwal: Pengeluaran[] = [];
for (const periode of PERIODE_OPERASIONAL) {
  const r = rentangBulan(periode);
  // September baru berjalan 3 hari: realisasinya proporsional.
  const hariAktif =
    periode === "2026-09"
      ? HARI_INI.getDate()
      : r.selesai.getDate();
  const porsiBulan = hariAktif / r.selesai.getDate();

  for (const c of cabang) {
    const target =
      DASAR_ANGGARAN.bahan[c.id as "cab-1"] *
      porsiBulan *
      // Kemang sengaja sering melampaui anggaran agar cost control punya temuan.
      (c.id === "cab-2" ? 1.04 + rnd() * 0.1 : 0.86 + rnd() * 0.16);

    const jumlahBaris = periode === "2026-09" ? 3 : 10;
    const dipilih = [...bahanBelanja]
      .sort(() => rnd() - 0.5)
      .slice(0, jumlahBaris);
    const bobot = dipilih.map(() => 0.4 + rnd());
    const totalBobot = jumlah(bobot);

    dipilih.forEach((b, i) => {
      const nominal =
        Math.round(((target * bobot[i]) / totalBobot) / 1000) * 1000;
      const hari = 1 + Math.floor(rnd() * hariAktif);
      pengeluaranAwal.push({
        id: `exp-${periode}-${c.id}-${i}`,
        tanggal: keIsoTanggal(r.mulai).slice(0, 8) + String(hari).padStart(2, "0"),
        cabangId: c.id,
        bahan: b.nama,
        qty: Math.max(1, Math.round(nominal / b.hargaPerUnitTerakhir)),
        satuan: b.satuan,
        nominal,
      });
    });
  }
}
pengeluaranAwal.sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1));

/** Bahan yang pemakaiannya sengaja lebih boros dari standar resep. */
const BAHAN_BOROS = new Set(
  bahan
    .filter((_, i) => i % 9 === 2)
    .map((b) => b.id),
);

const penggunaanAwal: PenggunaanBahan[] = [];
for (const periode of PERIODE_OPERASIONAL) {
  const standar = konsumsiBahanRentang(rentangBulan(periode));
  for (const c of cabang) {
    for (const [ingredientId, qty] of standar) {
      const boros = BAHAN_BOROS.has(ingredientId) && c.id !== "cab-3";
      const faktor = (boros ? 1.14 : 1) * goyang(0.05);
      penggunaanAwal.push({
        id: `use-${periode}-${c.id}-${ingredientId}`,
        periode,
        cabangId: c.id,
        ingredientId,
        qty: Math.round(qty * porsiCabang(c.id) * faktor),
      });
    }
  }
}

const KURIR = ["Armada internal", "Deliveree", "Lalamove", "JNE Trucking"];
const MUATAN = [
  "Susu UHT & Oatside",
  "Beans Arabika & Robusta",
  "Sirup & powder",
  "Cup, lid & sedotan",
  "Bahan dapur kering",
  "Roti & bahan segar",
];

const pengirimanAwal: Pengiriman[] = [];
{
  let nomor = 1;
  const awal = keTanggal("2026-05-01");
  const akhir = tambahHari(HARI_INI, 10);
  for (let d = awal; d <= akhir; d = tambahHari(d, 1)) {
    const hari = d.getDay();
    for (const c of cabang) {
      // Kirim dua kali seminggu: Senin & Kamis (Kemang juga Sabtu).
      const jadwal =
        hari === 1 || hari === 4 || (c.id === "cab-2" && hari === 6);
      if (!jadwal) continue;
      const selisih = Math.round((d.getTime() - HARI_INI.getTime()) / 86_400_000);
      pengirimanAwal.push({
        id: `kirim-${nomor}`,
        kode: `KRM-${String(nomor).padStart(4, "0")}`,
        tanggal: keIsoTanggal(d),
        cabangId: c.id,
        muatan: MUATAN[Math.floor(rnd() * MUATAN.length)],
        kurir: KURIR[Math.floor(rnd() * KURIR.length)],
        biaya:
          Math.round(
            ((c.id === "cab-1" ? 180_000 : c.id === "cab-2" ? 260_000 : 230_000) *
              goyang(0.25)) /
              5_000,
          ) * 5_000,
        status: selisih > 0 ? "dijadwalkan" : selisih === 0 ? "dikirim" : "diterima",
      });
      nomor++;
    }
  }
  pengirimanAwal.sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1));
}

export const SEED = {
  anggaran: anggaranAwal,
  pengeluaran: pengeluaranAwal,
  penggunaan: penggunaanAwal,
  pengiriman: pengirimanAwal,
  penjualan: penjualanMingguan,
};

// ---------------------------------------------------------------------------
// Store — koleksi yang bisa ditambah, diubah, dihapus
// ---------------------------------------------------------------------------

type NamaKoleksi = keyof typeof SEED;
type IsiKoleksi = {
  anggaran: Anggaran;
  pengeluaran: Pengeluaran;
  penggunaan: PenggunaanBahan;
  pengiriman: Pengiriman;
  penjualan: CatatanPenjualan;
};

export interface Koleksi<T extends { id: string }> {
  data: T[];
  tambah: (baris: T[]) => void;
  ubah: (baris: T) => void;
  hapus: (id: string) => void;
  pulihkan: () => void;
}

const kunciKoleksi = (nama: NamaKoleksi) => `dashboard-bi.data.${nama}`;

export function useKoleksi<N extends NamaKoleksi>(
  nama: N,
): Koleksi<IsiKoleksi[N]> {
  type T = IsiKoleksi[N];
  const kunci = kunciKoleksi(nama);
  const mentah = useNilaiLokal(kunci);

  const data = React.useMemo<T[]>(() => {
    if (!mentah) return SEED[nama] as T[];
    try {
      return JSON.parse(mentah) as T[];
    } catch {
      return SEED[nama] as T[];
    }
  }, [mentah, nama]);

  const simpan = React.useCallback(
    (berikut: T[]) => tulisLokal(kunci, JSON.stringify(berikut)),
    [kunci],
  );

  return React.useMemo(
    () => ({
      data,
      tambah: (baris) => simpan([...baris, ...data]),
      ubah: (baris) => simpan(data.map((x) => (x.id === baris.id ? baris : x))),
      hapus: (id) => simpan(data.filter((x) => x.id !== id)),
      pulihkan: () => tulisLokal(kunci, null),
    }),
    [data, simpan, kunci],
  );
}

export function idBaru(awalan: string): string {
  return `${awalan}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

// ---------------------------------------------------------------------------
// Query turunan
// ---------------------------------------------------------------------------

export interface BarisCostControl {
  periode: string;
  cabangId: string | null;
  anggaranBahan: number;
  realisasiBahan: number;
  anggaranLogistik: number;
  realisasiLogistik: number;
  pendapatan: number;
  /** Pendapatan − (pengeluaran bahan + logistik). */
  surplus: number;
}

export function pendapatanPeriode(
  penjualan: CatatanPenjualan[],
  periode: string,
  cabangId?: string,
): number {
  // Penjualan dicatat per minggu; minggu yang melintasi dua bulan dibagi
  // proporsional menurut jumlah harinya di bulan ini.
  let total = 0;
  for (const p of penjualan) {
    let hari = 0;
    for (let i = 0; i < 7; i++) {
      if (periodeDari(keIsoTanggal(tambahHari(p.periodeMulai, i))) === periode) hari++;
    }
    if (hari) total += (p.qtyTerjual * p.hargaSaatItu * hari) / 7;
  }
  return total * porsiCabang(cabangId);
}

export function costControl(
  d: {
    anggaran: Anggaran[];
    pengeluaran: Pengeluaran[];
    pengiriman: Pengiriman[];
    penjualan: CatatanPenjualan[];
  },
  cabangId?: string,
): BarisCostControl[] {
  const cocok = (id: string) => !cabangId || id === cabangId;
  return PERIODE_OPERASIONAL.map((periode) => {
    const ang = d.anggaran.filter(
      (a) => a.periode === periode && cocok(a.cabangId),
    );
    const realisasiBahan = jumlah(
      d.pengeluaran
        .filter((p) => periodeDari(p.tanggal) === periode && cocok(p.cabangId))
        .map((p) => p.nominal),
    );
    const realisasiLogistik = jumlah(
      d.pengiriman
        .filter(
          (p) =>
            periodeDari(p.tanggal) === periode &&
            cocok(p.cabangId) &&
            p.tanggal <= keIsoTanggal(HARI_INI),
        )
        .map((p) => p.biaya),
    );
    const pendapatan = pendapatanPeriode(d.penjualan, periode, cabangId);
    return {
      periode,
      cabangId: cabangId ?? null,
      anggaranBahan: jumlah(ang.filter((a) => a.kategori === "bahan").map((a) => a.nominal)),
      realisasiBahan,
      anggaranLogistik: jumlah(ang.filter((a) => a.kategori === "logistik").map((a) => a.nominal)),
      realisasiLogistik,
      pendapatan,
      surplus: pendapatan - realisasiBahan - realisasiLogistik,
    };
  });
}

export interface AnalisisPenggunaan {
  ingredientId: string;
  nama: string;
  satuan: string;
  pemakaian: number;
  /** Kebutuhan standar dari penjualan × resep. */
  standar: number;
  /** Qty dibeli menurut pengeluaran (dicocokkan lewat nama bahan). */
  pembelian: number;
  selisihPersen: number;
  status: "sesuai" | "boros" | "hemat";
}

export function analisisPenggunaan(
  penggunaan: PenggunaanBahan[],
  pengeluaran: Pengeluaran[],
  periode: string,
  cabangId?: string,
): AnalisisPenggunaan[] {
  const standar = konsumsiBahanRentang(rentangBulan(periode));
  const porsi = porsiCabang(cabangId);
  const pakai = new Map<string, number>();
  for (const u of penggunaan) {
    if (u.periode !== periode || (cabangId && u.cabangId !== cabangId)) continue;
    pakai.set(u.ingredientId, (pakai.get(u.ingredientId) ?? 0) + u.qty);
  }
  const beli = new Map<string, number>();
  for (const p of pengeluaran) {
    if (periodeDari(p.tanggal) !== periode || (cabangId && p.cabangId !== cabangId)) continue;
    beli.set(p.bahan, (beli.get(p.bahan) ?? 0) + p.qty);
  }

  return [...pakai].map(([ingredientId, pemakaian]) => {
    const b = bahanPerId.get(ingredientId);
    const std = (standar.get(ingredientId) ?? 0) * porsi;
    const selisihPersen = std > 0 ? ((pemakaian - std) / std) * 100 : 0;
    return {
      ingredientId,
      nama: b?.nama ?? ingredientId,
      satuan: b?.satuan ?? "",
      pemakaian,
      standar: std,
      pembelian: beli.get(b?.nama ?? "") ?? 0,
      selisihPersen,
      status: selisihPersen > 8 ? "boros" : selisihPersen < -8 ? "hemat" : "sesuai",
    };
  });
}

// ---------------------------------------------------------------------------
// Forecast per kategori & cabang (fitur 8)
// ---------------------------------------------------------------------------

export interface TitikForecast {
  label: string;
  aktual: number | null;
  prediksi: number | null;
  bawah: number | null;
  atas: number | null;
}

/** Deret qty mingguan setelah difilter kategori & cabang. */
export function deretMingguan(
  penjualan: CatatanPenjualan[],
  opsi: { kategori?: KategoriMenu; cabangId?: string },
) {
  const peta = new Map<string, number>();
  for (const p of penjualan) {
    const m = menuPerId.get(p.menuId);
    if (opsi.kategori && m?.kategori !== opsi.kategori) continue;
    peta.set(p.periodeMulai, (peta.get(p.periodeMulai) ?? 0) + p.qtyTerjual);
  }
  const porsi = porsiCabang(opsi.cabangId);
  return [...peta]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([minggu, qty]) => ({ minggu, qty: Math.round(qty * porsi) }));
}

const BOBOT_WMA = [0.1, 0.2, 0.3, 0.4];

function wma(seri: number[]): number {
  const akhir = seri.slice(-BOBOT_WMA.length);
  const bobot = BOBOT_WMA.slice(-akhir.length);
  const total = jumlah(bobot);
  return akhir.reduce((t, v, i) => t + v * bobot[i], 0) / (total || 1);
}

/**
 * Peramalan mingguan: weighted moving average 4 minggu (bobot 0,1–0,4)
 * ditambah tren linear dari 8 minggu terakhir. MAE dihitung dengan
 * backtest one-step-ahead pada minggu-minggu riwayat yang terlihat.
 */
export function forecastMingguan(
  deret: { minggu: string; qty: number }[],
  jumlahRiwayat: number,
  horizon = 4,
) {
  const qty = deret.map((d) => d.qty);
  const tren = (seri: number[]) => {
    const s = seri.slice(-8);
    if (s.length < 3) return 0;
    const n = s.length;
    const mx = (n - 1) / 2;
    const my = jumlah(s) / n;
    let a = 0;
    let b = 0;
    s.forEach((v, i) => {
      a += (i - mx) * (v - my);
      b += (i - mx) ** 2;
    });
    return b ? a / b : 0;
  };
  const ramal = (seri: number[], langkah: number) =>
    Math.max(0, wma(seri) + tren(seri) * (langkah + 1.5));

  // Backtest
  const galat: { minggu: string; aktual: number; prediksi: number }[] = [];
  const mulai = Math.max(4, qty.length - jumlahRiwayat);
  for (let i = mulai; i < qty.length; i++) {
    const prediksi = ramal(qty.slice(0, i), 0);
    galat.push({ minggu: deret[i].minggu, aktual: qty[i], prediksi });
  }
  const mae = galat.length
    ? jumlah(galat.map((g) => Math.abs(g.aktual - g.prediksi))) / galat.length
    : 0;
  const rataAktual = galat.length ? jumlah(galat.map((g) => g.aktual)) / galat.length : 0;

  const riwayat: TitikForecast[] = deret.slice(-jumlahRiwayat).map((d) => ({
    label: d.minggu,
    aktual: d.qty,
    prediksi: null,
    bawah: null,
    atas: null,
  }));
  const terakhir = riwayat[riwayat.length - 1];
  if (terakhir) {
    terakhir.prediksi = terakhir.aktual;
    terakhir.bawah = terakhir.aktual;
    terakhir.atas = terakhir.aktual;
  }

  const ke = deret.length ? keTanggal(deret[deret.length - 1].minggu) : HARI_INI;
  const prediksi: TitikForecast[] = Array.from({ length: horizon }, (_, h) => {
    const p = ramal(qty, h);
    const lebar = mae * 1.25 * Math.sqrt(h + 1);
    return {
      label: keIsoTanggal(tambahHari(ke, 7 * (h + 1))),
      aktual: null,
      prediksi: Math.round(p),
      bawah: Math.max(0, Math.round(p - lebar)),
      atas: Math.round(p + lebar),
    };
  });

  return {
    seri: [...riwayat, ...prediksi],
    prediksi,
    mae,
    maePersen: rataAktual ? (mae / rataAktual) * 100 : 0,
    backtest: galat,
  };
}

/** Prediksi qty minggu depan per menu, lalu dikonversi ke bahan lewat resep. */
export function kebutuhanBahanMingguDepan(
  penjualan: CatatanPenjualan[],
  opsi: { kategori?: KategoriMenu; cabangId?: string },
  resepMenu: (menuId: string) => { ingredientId: string; qtyPerPorsi: number }[],
) {
  const porsi = porsiCabang(opsi.cabangId);
  const kebutuhan = new Map<string, number>();
  const perMenu: { menuId: string; nama: string; prediksi: number }[] = [];
  for (const m of menu) {
    if (opsi.kategori && m.kategori !== opsi.kategori) continue;
    const seri = penjualan
      .filter((p) => p.menuId === m.id)
      .sort((a, b) => (a.periodeMulai < b.periodeMulai ? -1 : 1))
      .map((p) => p.qtyTerjual);
    if (!seri.length) continue;
    const pred = wma(seri) * porsi;
    perMenu.push({ menuId: m.id, nama: m.nama, prediksi: pred });
    for (const r of resepMenu(m.id)) {
      kebutuhan.set(
        r.ingredientId,
        (kebutuhan.get(r.ingredientId) ?? 0) + pred * r.qtyPerPorsi,
      );
    }
  }
  return {
    perMenu: perMenu.sort((a, b) => b.prediksi - a.prediksi),
    bahan: [...kebutuhan]
      .map(([id, qty]) => {
        const b = bahanPerId.get(id);
        return {
          ingredientId: id,
          nama: b?.nama ?? id,
          satuan: b?.satuan ?? "",
          qty,
          biaya: qty * (b?.hargaPerUnitTerakhir ?? 0),
        };
      })
      .sort((a, b) => b.biaya - a.biaya),
  };
}
