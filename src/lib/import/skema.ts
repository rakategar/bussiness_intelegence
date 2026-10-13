import * as XLSX from "xlsx";
import { z } from "zod";
import { keIsoTanggal } from "../format";

/**
 * Skema kolom yang dipakai bersama oleh form tambah/ubah dan impor Excel.
 * Pola impor mengikuti catatan developer di Deskripsi per fitur:
 * unggah → validasi (format, struktur, isi) → transformasi & mapping → simpan.
 */

export type TipeField = "teks" | "angka" | "tanggal" | "bulan" | "pilihan";

export interface Field {
  kunci: string;
  label: string;
  tipe: TipeField;
  wajib?: boolean;
  /** Untuk tipe pilihan: nilai disimpan, label boleh dipakai di Excel. */
  opsi?: { nilai: string; label: string }[];
  /** Batas bawah angka (default 0 — nominal uang tidak boleh negatif). */
  min?: number;
  /** Batas atas angka. */
  maks?: number;
  satuan?: string;
  bantuan?: string;
}

export type Rekaman = Record<string, string | number | undefined>;

const normal = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

function keTeks(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return keIsoTanggal(v);
  return String(v).trim();
}

/** Ubah nilai sel/isian menjadi nilai field, atau pesan galat. */
export function validasiNilai(
  f: Field,
  mentah: unknown,
): { ok: true; nilai: string | number | undefined } | { ok: false; pesan: string } {
  const teks = keTeks(mentah);
  if (!teks) {
    return f.wajib
      ? { ok: false, pesan: `${f.label} wajib diisi.` }
      : { ok: true, nilai: undefined };
  }

  switch (f.tipe) {
    case "angka": {
      const bersih =
        typeof mentah === "number"
          ? mentah
          : Number(teks.replace(/rp/gi, "").replace(/\s/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", "."));
      const hasil = z
        .number({ error: `${f.label} harus berupa angka.` })
        .finite(`${f.label} harus berupa angka.`)
        .min(f.min ?? 0, `${f.label} minimal ${f.min ?? 0}.`)
        .max(f.maks ?? Number.MAX_SAFE_INTEGER, `${f.label} maksimal ${f.maks}.`)
        .safeParse(bersih);
      return hasil.success
        ? { ok: true, nilai: hasil.data }
        : { ok: false, pesan: hasil.error.issues[0].message };
    }
    case "tanggal": {
      let iso = teks;
      if (typeof mentah === "number") {
        const d = XLSX.SSF.parse_date_code(mentah);
        iso = d ? `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}` : "";
      } else if (/^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(teks)) {
        const [dd, mm, yy] = teks.split(/[/-]/);
        iso = `${yy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
      }
      const sah =
        /^\d{4}-\d{2}-\d{2}$/.test(iso) && !Number.isNaN(new Date(iso).getTime());
      return sah
        ? { ok: true, nilai: iso }
        : { ok: false, pesan: `${f.label} "${teks}" bukan tanggal (YYYY-MM-DD).` };
    }
    case "bulan": {
      let iso = teks;
      if (mentah instanceof Date) iso = keIsoTanggal(mentah).slice(0, 7);
      else if (/^\d{4}-\d{2}-\d{2}$/.test(teks)) iso = teks.slice(0, 7);
      else if (/^\d{1,2}[/-]\d{4}$/.test(teks)) {
        const [mm, yy] = teks.split(/[/-]/);
        iso = `${yy}-${mm.padStart(2, "0")}`;
      }
      const sah = /^\d{4}-(0[1-9]|1[0-2])$/.test(iso);
      return sah
        ? { ok: true, nilai: iso }
        : { ok: false, pesan: `${f.label} "${teks}" bukan bulan (YYYY-MM).` };
    }
    case "pilihan": {
      const cocok = f.opsi?.find(
        (o) => normal(o.nilai) === normal(teks) || normal(o.label) === normal(teks),
      );
      return cocok
        ? { ok: true, nilai: cocok.nilai }
        : {
            ok: false,
            pesan: `${f.label} "${teks}" tidak dikenal. Pilihan: ${f.opsi
              ?.map((o) => o.label)
              .slice(0, 6)
              .join(", ")}${(f.opsi?.length ?? 0) > 6 ? ", …" : ""}.`,
          };
    }
    default:
      return teks.length > 200
        ? { ok: false, pesan: `${f.label} terlalu panjang (maks 200 karakter).` }
        : { ok: true, nilai: teks };
  }
}

/** Validasi satu rekaman lengkap; mengembalikan rekaman bersih atau daftar galat. */
export function validasiRekaman(
  fields: Field[],
  mentah: Record<string, unknown>,
): { ok: true; rekaman: Rekaman } | { ok: false; galat: string[] } {
  const rekaman: Rekaman = {};
  const galat: string[] = [];
  for (const f of fields) {
    const h = validasiNilai(f, mentah[f.kunci]);
    if (h.ok) rekaman[f.kunci] = h.nilai;
    else galat.push(h.pesan);
  }
  return galat.length ? { ok: false, galat } : { ok: true, rekaman };
}

export interface BarisImpor {
  nomor: number;
  mentah: Record<string, unknown>;
  rekaman?: Rekaman;
  galat: string[];
}

export interface HasilImpor {
  namaFile: string;
  namaSheet: string;
  baris: BarisImpor[];
}

export class GalatImpor extends Error {}

const EKSTENSI = /\.(xlsx|xls|csv)$/i;

/**
 * Baca file Excel: cek format berkas, cek struktur (semua kolom wajib ada di
 * baris judul), lalu validasi isi tiap baris.
 */
export function bacaExcel(
  buf: ArrayBuffer,
  namaFile: string,
  fields: Field[],
): HasilImpor {
  if (!EKSTENSI.test(namaFile)) {
    throw new GalatImpor(
      `Format berkas "${namaFile}" tidak didukung. Gunakan .xlsx, .xls, atau .csv.`,
    );
  }

  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(buf, { type: "array", cellDates: true });
  } catch {
    throw new GalatImpor("Berkas rusak atau bukan spreadsheet yang sah.");
  }
  const namaSheet = wb.SheetNames[0];
  if (!namaSheet) throw new GalatImpor("Berkas tidak berisi sheet apa pun.");

  const aoa = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[namaSheet], {
    header: 1,
    blankrows: false,
    defval: "",
  });
  if (aoa.length < 2) {
    throw new GalatImpor("Sheet pertama kosong atau hanya berisi judul kolom.");
  }

  const judul = (aoa[0] as unknown[]).map((h) => normal(keTeks(h)));
  const posisi = new Map<string, number>();
  const hilang: string[] = [];
  for (const f of fields) {
    const i = judul.findIndex((h) => h === normal(f.kunci) || h === normal(f.label));
    if (i >= 0) posisi.set(f.kunci, i);
    else if (f.wajib) hilang.push(f.label);
  }
  if (hilang.length) {
    throw new GalatImpor(
      `Struktur kolom tidak sesuai template. Kolom wajib yang tidak ditemukan: ${hilang.join(", ")}.`,
    );
  }

  const baris: BarisImpor[] = aoa.slice(1).map((sel, i) => {
    const mentah: Record<string, unknown> = {};
    for (const [kunci, idx] of posisi) mentah[kunci] = (sel as unknown[])[idx];
    const h = validasiRekaman(fields, mentah);
    return h.ok
      ? { nomor: i + 2, mentah, rekaman: h.rekaman, galat: [] }
      : { nomor: i + 2, mentah, galat: h.galat };
  });

  return { namaFile, namaSheet, baris };
}

/** Unduh template Excel berisi judul kolom + satu baris contoh. */
export function unduhTemplateSkema(
  namaBerkas: string,
  fields: Field[],
  contoh: Record<string, string | number>[],
) {
  const wb = XLSX.utils.book_new();
  const data = [
    fields.map((f) => f.label),
    ...contoh.map((c) => fields.map((f) => c[f.kunci] ?? "")),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), "data");
  XLSX.writeFile(wb, namaBerkas);
}
