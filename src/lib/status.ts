import type { StatusKesegaran, Kuadran, KategoriBahan, KategoriMenu } from "./types";

/** Ambang urgensi kesegaran — PRD.md bagian 9.5. */
export function statusDariSisaHari(sisaHari: number): StatusKesegaran {
  if (sisaHari <= 0) return "kadaluarsa";
  if (sisaHari <= 3) return "kritis";
  if (sisaHari <= 7) return "waspada";
  return "aman";
}

export const LABEL_STATUS: Record<StatusKesegaran, string> = {
  aman: "Aman",
  waspada: "Waspada",
  kritis: "Kritis",
  kadaluarsa: "Kadaluarsa",
};

/** Kelas Tailwind per status — dipakai badge, titik, garis kiri baris. */
export const GAYA_STATUS: Record<
  StatusKesegaran,
  { teks: string; latar: string; titik: string; garis: string; hex: string }
> = {
  aman: {
    teks: "text-fresh",
    latar: "bg-fresh-bg",
    titik: "bg-fresh",
    garis: "border-l-fresh",
    hex: "var(--fresh)",
  },
  waspada: {
    teks: "text-watch",
    latar: "bg-watch-bg",
    titik: "bg-watch",
    garis: "border-l-watch",
    hex: "var(--watch)",
  },
  kritis: {
    teks: "text-critical",
    latar: "bg-critical-bg",
    titik: "bg-critical",
    garis: "border-l-critical",
    hex: "var(--critical)",
  },
  kadaluarsa: {
    teks: "text-expired",
    latar: "bg-expired-bg",
    titik: "bg-expired",
    garis: "border-l-expired",
    hex: "var(--expired)",
  },
};

export const URUTAN_STATUS: StatusKesegaran[] = [
  "kadaluarsa",
  "kritis",
  "waspada",
  "aman",
];

export const LABEL_KUADRAN: Record<Kuadran, string> = {
  bintang: "Bintang",
  "teka-teki": "Teka-teki",
  "kuda-beban": "Kuda Beban",
  anjing: "Anjing",
};

export const PENJELASAN_KUADRAN: Record<Kuadran, string> = {
  bintang: "Laku dan untung besar — pertahankan, promosikan.",
  "teka-teki": "Untung besar tapi sepi — butuh promosi.",
  "kuda-beban": "Laku tapi tipis — naikkan harga atau tekan HPP.",
  anjing: "Sepi dan tipis — pertimbangkan dihapus.",
};

export const WARNA_KUADRAN: Record<Kuadran, string> = {
  bintang: "var(--viz-1)",
  "teka-teki": "var(--viz-6)",
  "kuda-beban": "var(--viz-4)",
  anjing: "var(--viz-7)",
};

export function tentukanKuadran(
  qty: number,
  marginPersen: number,
  medianQty: number,
  medianMargin: number,
): Kuadran {
  const laku = qty >= medianQty;
  const untung = marginPersen >= medianMargin;
  if (laku && untung) return "bintang";
  if (!laku && untung) return "teka-teki";
  if (laku && !untung) return "kuda-beban";
  return "anjing";
}

/** Warna margin di tabel menu — MASTERPROMPT Prompt 4. */
export function gayaMargin(marginPersen: number): string {
  if (marginPersen < 40) return "text-critical";
  if (marginPersen <= 60) return "text-watch";
  return "text-fresh";
}

export const LABEL_KATEGORI_BAHAN: Record<KategoriBahan, string> = {
  beverage: "Minuman",
  kitchen: "Dapur",
  packaging: "Kemasan",
  fresh: "Segar",
  base: "Base/premix",
};

export const LABEL_KATEGORI_MENU: Record<KategoriMenu, string> = {
  coffee: "Kopi",
  "non-coffee": "Non-kopi",
  snack: "Snack",
  rice: "Nasi",
  "add-on": "Add-on",
};

export const WARNA_KATEGORI_MENU: Record<KategoriMenu, string> = {
  coffee: "var(--viz-1)",
  "non-coffee": "var(--viz-2)",
  snack: "var(--viz-4)",
  rice: "var(--viz-5)",
  "add-on": "var(--viz-6)",
};

export const LABEL_PERAN = {
  logistik: "Karyawan Logistik",
  admin: "Admin Operasional",
  owner: "Pemilik Usaha",
} as const;

export const LABEL_STATUS_PENGIRIMAN = {
  dijadwalkan: "Dijadwalkan",
  dikirim: "Dalam perjalanan",
  diterima: "Diterima",
} as const;

export const LABEL_KATEGORI_ANGGARAN = {
  bahan: "Bahan baku",
  logistik: "Logistik",
} as const;

export const LABEL_ALASAN_WASTE = {
  expired: "Kadaluarsa",
  rusak: "Rusak",
  tumpah: "Tumpah",
  lainnya: "Lainnya",
} as const;

export const LABEL_STATUS_RESTOCK = {
  ordered: "Dipesan",
  arrived: "Diterima",
  cancelled: "Dibatalkan",
} as const;
