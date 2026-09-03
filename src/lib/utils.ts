import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function median(angka: number[]): number {
  if (angka.length === 0) return 0;
  const urut = [...angka].sort((a, b) => a - b);
  const tengah = Math.floor(urut.length / 2);
  return urut.length % 2 === 0
    ? (urut[tengah - 1] + urut[tengah]) / 2
    : urut[tengah];
}

export function jumlah(angka: number[]): number {
  return angka.reduce((a, b) => a + b, 0);
}

export function rata2(angka: number[]): number {
  return angka.length === 0 ? 0 : jumlah(angka) / angka.length;
}

export function stdev(angka: number[]): number {
  if (angka.length < 2) return 0;
  const m = rata2(angka);
  return Math.sqrt(jumlah(angka.map((x) => (x - m) ** 2)) / (angka.length - 1));
}

/** Perubahan relatif dalam persen; 0 kalau pembanding nol. */
export function perubahanPersen(sekarang: number, sebelum: number): number {
  if (!sebelum) return 0;
  return ((sekarang - sebelum) / sebelum) * 100;
}

/** Angka acak deterministik dari benih — supaya seed data stabil antar render. */
export function acakDeterministik(benih: number): () => number {
  let s = benih >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
