import { HARI_INI, mingguIni } from "./data/seed";
import type { Rentang } from "./data/queries";
import { akhirMinggu, formatRentang, tambahHari } from "./format";

export type PilihanPeriode =
  | "minggu-ini"
  | "minggu-lalu"
  | "bulan-ini"
  | "3-bulan"
  | "tahun-berjalan";

export const LABEL_PERIODE: Record<PilihanPeriode, string> = {
  "minggu-ini": "Minggu ini",
  "minggu-lalu": "Minggu lalu",
  "bulan-ini": "Bulan ini",
  "3-bulan": "3 bulan terakhir",
  "tahun-berjalan": "Tahun berjalan",
};

export const URUTAN_PERIODE: PilihanPeriode[] = [
  "minggu-ini",
  "minggu-lalu",
  "bulan-ini",
  "3-bulan",
  "tahun-berjalan",
];

export function rentangDari(pilihan: PilihanPeriode): Rentang {
  switch (pilihan) {
    case "minggu-lalu": {
      const mulai = tambahHari(mingguIni, -7);
      return { mulai, selesai: akhirMinggu(mulai), label: "Minggu lalu" };
    }
    case "bulan-ini": {
      const mulai = new Date(HARI_INI.getFullYear(), HARI_INI.getMonth(), 1);
      return { mulai, selesai: HARI_INI, label: "Bulan ini" };
    }
    case "3-bulan":
      return {
        mulai: tambahHari(mingguIni, -12 * 7),
        selesai: akhirMinggu(mingguIni),
        label: "3 bulan terakhir",
      };
    case "tahun-berjalan":
      return {
        mulai: new Date(HARI_INI.getFullYear(), 0, 1),
        selesai: akhirMinggu(mingguIni),
        label: "Tahun berjalan",
      };
    default:
      return { mulai: mingguIni, selesai: akhirMinggu(mingguIni), label: "Minggu ini" };
  }
}

/** Periode pembanding dengan panjang yang sama, persis sebelum periode ini. */
export function rentangPembanding(pilihan: PilihanPeriode): Rentang {
  const r = rentangDari(pilihan);
  const panjang =
    Math.round((r.selesai.getTime() - r.mulai.getTime()) / 86_400_000) + 1;
  const selesai = tambahHari(r.mulai, -1);
  return {
    mulai: tambahHari(selesai, -(panjang - 1)),
    selesai,
    label: "Periode sebelumnya",
  };
}

export function deskripsiRentang(pilihan: PilihanPeriode): string {
  const r = rentangDari(pilihan);
  return formatRentang(r.mulai, r.selesai);
}
