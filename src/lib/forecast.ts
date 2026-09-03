import { INDEKS_MUSIMAN } from "./data/katalog";
import {
  HARI_INI,
  bahan,
  mingguan,
  mingguIni,
} from "./data/seed";
import {
  bahanPerId,
  konsumsiHarian,
  menuPerId,
  penjualanMingguanMenu,
  pemasokPerId,
  resepMenu,
  stdevKonsumsiHarian,
  stokBahan,
} from "./data/queries";
import { menu as semuaMenu } from "./data/seed";
import { tambahHari } from "./format";
import type { KebutuhanBahan, PrediksiMenu } from "./types";
import { rata2, stdev } from "./utils";

/**
 * Lapisan 1 forecasting — perhitungan statistik murni, tanpa AI.
 * Semua angka prediksi di seluruh aplikasi berasal dari sini.
 * Rumus mengikuti PRD.md bagian 10.2.
 */

const BUFFER_PEMBOROSAN = 1.05;
const TINGKAT_LAYANAN = 1.65; // setara 95%

/** Regresi linear sederhana; mengembalikan kemiringan dan korelasi. */
function regresi(y: number[]): { slope: number; r: number } {
  const n = y.length;
  if (n < 3) return { slope: 0, r: 0 };
  const x = y.map((_, i) => i);
  const mx = rata2(x);
  const my = rata2(y);
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += (x[i] - mx) * (y[i] - my);
    sxx += (x[i] - mx) ** 2;
    syy += (y[i] - my) ** 2;
  }
  if (sxx === 0 || syy === 0) return { slope: 0, r: 0 };
  return { slope: sxy / sxx, r: sxy / Math.sqrt(sxx * syy) };
}

export interface HasilBaseline {
  prediksi: PrediksiMenu[];
  kebutuhan: KebutuhanBahan[];
  horizon: "next_week" | "next_month";
  periodeTarget: { mulai: Date; selesai: Date };
  mape: number;
  menuTanpaResep: string[];
  jumlahPeriodeTersedia: number;
}

function prediksiSatuMenu(menuId: string, bulanTarget: number): PrediksiMenu {
  const m = menuPerId.get(menuId)!;
  const seri = penjualanMingguanMenu(menuId, 12).map((x) => x.qty);
  const terisi = seri.filter((q) => q > 0);
  const rasioNol = seri.length ? 1 - terisi.length / seri.length : 1;

  let dasar: number;
  let metode: PrediksiMenu["metode"] = "moving-average";
  let kepercayaan: PrediksiMenu["kepercayaan"] = "tinggi";

  if (terisi.length < 8) {
    // Menu baru — pinjam rata-rata kategori yang sama.
    const sekategori = semuaMenu.filter(
      (x) => x.kategori === m.kategori && x.id !== menuId,
    );
    const rerata = rata2(
      sekategori.map((x) =>
        rata2(penjualanMingguanMenu(x.id, 8).map((s) => s.qty)),
      ),
    );
    dasar = rerata;
    metode = "kategori";
    kepercayaan = "rendah";
  } else if (rasioNol > 0.4) {
    // Permintaan terputus-putus — Croston sederhana.
    const qtySaatTerjual = rata2(terisi);
    let jarakTotal = 0;
    let jarakHitung = 0;
    let terakhir = -1;
    seri.forEach((q, i) => {
      if (q > 0) {
        if (terakhir >= 0) {
          jarakTotal += i - terakhir;
          jarakHitung++;
        }
        terakhir = i;
      }
    });
    const jarakRata = jarakHitung ? jarakTotal / jarakHitung : seri.length;
    dasar = qtySaatTerjual / Math.max(1, jarakRata);
    metode = "croston";
    kepercayaan = "rendah";
  } else {
    // Rata-rata bergerak tertimbang: 0.4/0.3/0.2/0.1, W1 = minggu terakhir.
    const [w4, w3, w2, w1] = seri.slice(-4);
    dasar = 0.4 * w1 + 0.3 * w2 + 0.2 * w3 + 0.1 * w4;
    kepercayaan = "sedang";
  }

  // Komponen tren atas 8 periode terakhir, hanya kalau |r| > 0.5.
  const delapan = seri.slice(-8);
  const { slope, r } = regresi(delapan);
  let tren: PrediksiMenu["tren"] = "datar";
  if (Math.abs(r) > 0.5 && metode === "moving-average") {
    dasar += slope;
    tren = slope > 0 ? "naik" : "turun";
  } else if (Math.abs(r) > 0.35) {
    tren = slope > 0 ? "naik" : slope < 0 ? "turun" : "datar";
  }

  // Penyesuaian musiman bulanan dari data historis.
  const rerataIndeks = rata2(INDEKS_MUSIMAN);
  const indeks = INDEKS_MUSIMAN[bulanTarget] / rerataIndeks;
  const prediksi = Math.max(0, dasar * indeks);

  // Interval kepercayaan dari standar deviasi residual.
  const residual = delapan.map((q, i) => q - (rata2(delapan) + slope * (i - 3.5)));
  const sd = stdev(residual);
  const lebar = 1.96 * sd;

  return {
    menuId,
    nama: m.nama,
    prediksi: Math.round(prediksi),
    batasBawah: Math.max(0, Math.round(prediksi - lebar)),
    batasAtas: Math.round(prediksi + lebar),
    tren,
    kepercayaan,
    metode,
  };
}

export function hitungBaseline(
  horizon: "next_week" | "next_month" = "next_week",
): HasilBaseline {
  const mulai =
    horizon === "next_week"
      ? tambahHari(mingguIni, 7)
      : new Date(HARI_INI.getFullYear(), HARI_INI.getMonth() + 1, 1);
  const selesai =
    horizon === "next_week"
      ? tambahHari(mulai, 6)
      : new Date(HARI_INI.getFullYear(), HARI_INI.getMonth() + 2, 0);

  const pengaliHorizon = horizon === "next_week" ? 1 : 4.33;
  const bulanTarget = mulai.getMonth();

  const prediksi = semuaMenu
    .map((m) => {
      const p = prediksiSatuMenu(m.id, bulanTarget);
      return {
        ...p,
        prediksi: Math.round(p.prediksi * pengaliHorizon),
        batasBawah: Math.round(p.batasBawah * pengaliHorizon),
        batasAtas: Math.round(p.batasAtas * pengaliHorizon),
      };
    })
    .sort((a, b) => b.prediksi - a.prediksi);

  // Kebutuhan bahan diturunkan dari prediksi menu × resep, plus buffer 5%.
  const kebutuhanQty = new Map<string, number>();
  const tanpaResep: string[] = [];
  for (const p of prediksi) {
    const items = resepMenu(p.menuId);
    if (items.length === 0) {
      if (p.prediksi > 0) tanpaResep.push(p.nama);
      continue;
    }
    for (const item of items) {
      kebutuhanQty.set(
        item.ingredientId,
        (kebutuhanQty.get(item.ingredientId) ?? 0) +
          p.prediksi * item.qtyPerPorsi,
      );
    }
  }

  const hariHorizon = horizon === "next_week" ? 7 : 30;

  const kebutuhan: KebutuhanBahan[] = bahan
    .filter((b) => b.isActive)
    .map((b) => {
      const prediksiPakai = (kebutuhanQty.get(b.id) ?? 0) * BUFFER_PEMBOROSAN;
      const stok = stokBahan(b);
      const leadTime =
        pemasokPerId.get(stok.batchTerdekat?.supplierId ?? "")?.leadTimeHari ??
        3;
      const harian = konsumsiHarian(b.id);
      const safety =
        TINGKAT_LAYANAN * stdevKonsumsiHarian(b.id) * Math.sqrt(leadTime);
      const perluPesan = Math.max(
        0,
        prediksiPakai - stok.sisaStok + safety,
      );
      // Batas kadaluarsa — kendala paling mahal di produk ini.
      const batasExp = harian * (b.shelfLifeHari - leadTime) * 0.9;
      return {
        bahan: b,
        prediksiPakai,
        sisaStok: stok.sisaStok,
        perluPesan,
        batasExp,
        berisikoTerbuang: perluPesan > batasExp && perluPesan > 0,
      };
    })
    .filter((k) => k.prediksiPakai > 0 || k.perluPesan > 0)
    .sort((a, b) => b.perluPesan - a.perluPesan);

  void hariHorizon;

  return {
    prediksi,
    kebutuhan,
    horizon,
    periodeTarget: { mulai, selesai },
    mape: mapeTerakhir(),
    menuTanpaResep: tanpaResep,
    jumlahPeriodeTersedia: mingguan.length,
  };
}

/**
 * MAPE prediksi periode lalu terhadap realisasinya. Dihitung dengan
 * memundurkan basis satu minggu, lalu membandingkan ke angka aktual.
 */
export function mapeTerakhir(): number {
  const galat: number[] = [];
  for (const m of semuaMenu) {
    const seri = penjualanMingguanMenu(m.id, 12).map((x) => x.qty);
    if (seri.length < 6) continue;
    const aktual = seri[seri.length - 1];
    if (aktual < 5) continue; // menu sepi bikin MAPE meledak, kecualikan
    const [w4, w3, w2, w1] = seri.slice(-5, -1);
    const prediksi = 0.4 * w1 + 0.3 * w2 + 0.2 * w3 + 0.1 * w4;
    galat.push(Math.abs(aktual - prediksi) / aktual);
  }
  return galat.length ? rata2(galat) * 100 : 0;
}

/** Deret prediksi + interval untuk grafik garis di halaman proyeksi. */
export function seriProyeksi(jumlahMingguRiwayat = 8) {
  const riwayat = mingguan.slice(-jumlahMingguRiwayat).map((senin) => {
    let total = 0;
    for (const m of semuaMenu) {
      const s = penjualanMingguanMenu(m.id, 12);
      const cocok = s.find(
        (x) => x.label === `M${nomorMingguDari(senin)}`,
      );
      total += cocok?.qty ?? 0;
    }
    return {
      label: `M${nomorMingguDari(senin)}`,
      aktual: total,
      prediksi: null as number | null,
      bawah: null as number | null,
      atas: null as number | null,
    };
  });

  const base = hitungBaseline("next_week");
  const totalPrediksi = base.prediksi.reduce((t, p) => t + p.prediksi, 0);
  const totalBawah = base.prediksi.reduce((t, p) => t + p.batasBawah, 0);
  const totalAtas = base.prediksi.reduce((t, p) => t + p.batasAtas, 0);

  // Sambungkan garis: titik terakhir riwayat juga jadi awal garis prediksi.
  const terakhir = riwayat[riwayat.length - 1];
  if (terakhir) {
    terakhir.prediksi = terakhir.aktual;
    terakhir.bawah = terakhir.aktual;
    terakhir.atas = terakhir.aktual;
  }

  const mingguDepan = tambahHari(mingguIni, 7);
  return [
    ...riwayat,
    {
      label: `M${nomorMingguDari(mingguDepan)}`,
      aktual: null as number | null,
      prediksi: totalPrediksi,
      bawah: totalBawah,
      atas: totalAtas,
    },
  ];
}

function nomorMingguDari(d: Date): number {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() + 3 - ((x.getDay() + 6) % 7));
  const kamis = new Date(x.getFullYear(), 0, 4);
  kamis.setDate(kamis.getDate() + 3 - ((kamis.getDay() + 6) % 7));
  return 1 + Math.round((x.getTime() - kamis.getTime()) / (7 * 86_400_000));
}

export { bahanPerId };
