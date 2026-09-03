import * as XLSX from "xlsx";
import { keIsoTanggal, keTanggal } from "../format";

/**
 * Parser untuk file Excel asli, yang strukturnya tidak rapi.
 * Semua kejanggalan yang ditemukan di PRD.md bagian 6 ditangani di sini,
 * bukan dengan menyuruh pengguna merapikan file dulu.
 */

export type StatusBaris = "siap" | "konfirmasi" | "bermasalah";

export interface BarisRestock {
  no: number;
  barisAsli: number;
  status: StatusBaris;
  alasan?: string;
  nama: string;
  sku: string;
  pemasok: string;
  jumlah: number | null;
  satuan: string;
  totalBiaya: number | null;
  biayaPerUnit: number | null;
  tanggal: string | null;
  statusPesanan: string;
  catatan: string;
  /** Bahan belum ada di sistem — perlu konfirmasi buat baru / petakan. */
  bahanBaru?: boolean;
}

export interface BarisPenjualan {
  no: number;
  barisAsli: number;
  status: StatusBaris;
  alasan?: string;
  namaMenu: string;
  sku: string;
  hargaJual: number | null;
  periodeMulai: string;
  periodeSelesai: string;
  qtyTerjual: number;
  /** Skor kemiripan nama saat SKU tidak ketemu. */
  skorKecocokan?: number;
  menuBaru?: boolean;
}

export interface HasilParse<T> {
  namaFile: string;
  namaSheet: string;
  baris: T[];
  dilewati: { barisAsli: number; alasan: string }[];
  format?: "wide" | "long";
}

/** Buang prefix angka "1" pada nama bahan: "1UHT" → "UHT". */
export function bersihkanNamaBahan(nilai: unknown): string {
  return String(nilai ?? "")
    .trim()
    .replace(/^1(?=\D)/, "")
    .trim();
}

/** Buang prefix "_" pada nama menu: "_Kopi Klasik - ICE" → "Kopi Klasik - ICE". */
export function bersihkanNamaMenu(nilai: unknown): string {
  return String(nilai ?? "")
    .trim()
    .replace(/^_+/, "")
    .trim();
}

/** Baris yang nama menunya diawali "1" bukan menu jual, tapi komponen bahan. */
export function adalahKomponenBahan(nama: unknown): boolean {
  return /^1\D/.test(String(nama ?? "").trim());
}

function keAngka(nilai: unknown): number | null {
  if (nilai === null || nilai === undefined || nilai === "") return null;
  if (typeof nilai === "number") return Number.isFinite(nilai) ? nilai : null;
  const bersih = String(nilai)
    .replace(/rp/gi, "")
    .replace(/\s/g, "")
    .replace(/\.(?=\d{3}\b)/g, "")
    .replace(",", ".");
  const n = Number(bersih);
  return Number.isFinite(n) ? n : null;
}

/** Tanggal bisa berupa Date object atau serial number Excel. */
function keTanggalExcel(nilai: unknown): string | null {
  if (!nilai) return null;
  if (nilai instanceof Date) return keIsoTanggal(nilai);
  if (typeof nilai === "number") {
    const d = XLSX.SSF.parse_date_code(nilai);
    if (!d) return null;
    return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  const d = new Date(String(nilai));
  return Number.isNaN(d.getTime()) ? null : keIsoTanggal(d);
}

/** Cari sheet yang namanya mengandung kata kunci — toleran huruf besar-kecil
 *  DAN spasi berlebih di ujung (nama sheet asli adalah "stock " dengan spasi). */
export function cariSheet(wb: XLSX.WorkBook, kunci: string): string | null {
  const cocok = wb.SheetNames.find((n) =>
    n.trim().toLowerCase().includes(kunci.toLowerCase()),
  );
  return cocok ?? null;
}

type Baris = unknown[];

function keMatriks(sheet: XLSX.WorkSheet): Baris[] {
  return XLSX.utils.sheet_to_json<Baris>(sheet, {
    header: 1,
    raw: true,
    defval: null,
    blankrows: true,
  });
}

/* ==========================================================================
   Parser restock
   ========================================================================== */

export function parseRestock(
  buffer: ArrayBuffer,
  namaFile: string,
  skuDikenal: Set<string>,
): HasilParse<BarisRestock> {
  const wb = XLSX.read(buffer, { cellDates: true });
  const namaSheet = cariSheet(wb, "stock");
  if (!namaSheet) {
    throw new Error(
      `Tidak ada sheet yang namanya mengandung "stock" di ${namaFile}. Sheet yang tersedia: ${wb.SheetNames.join(", ")}.`,
    );
  }

  const matriks = keMatriks(wb.Sheets[namaSheet]);
  const baris: BarisRestock[] = [];
  const dilewati: { barisAsli: number; alasan: string }[] = [];

  // Baris 1 judul "RESTOCK INVENTARIS", baris 2 header, data mulai baris 3.
  for (let i = 2; i < matriks.length; i++) {
    const r = matriks[i] ?? [];
    const barisAsli = i + 1;

    const namaMentah = r[1];
    const sku = String(r[2] ?? "").trim();

    if (!namaMentah && !sku) {
      dilewati.push({ barisAsli, alasan: "Baris kosong." });
      continue;
    }

    const nama = bersihkanNamaBahan(namaMentah);
    if (!nama) {
      dilewati.push({ barisAsli, alasan: "Nama bahan kosong." });
      continue;
    }

    // Kolom G dan I hanya berisi teks "Rp" karena sel-nya di-merge.
    // Nilai uangnya ada di kolom H (indeks 7) dan J (indeks 9).
    const jumlah = keAngka(r[4]);
    const totalBiaya = keAngka(r[7]);
    const biayaPerUnit = keAngka(r[9]);
    const tanggal = keTanggalExcel(r[10]);

    let status: StatusBaris = "siap";
    const masalah: string[] = [];

    if (!sku) masalah.push("SKU internal kosong");
    if (jumlah === null || jumlah <= 0) masalah.push("Jumlah kosong");
    if (totalBiaya === null) masalah.push("Total biaya kosong");
    if (!tanggal) masalah.push("Tanggal pemesanan tidak terbaca");

    const bahanBaru = Boolean(sku) && !skuDikenal.has(sku);

    if (masalah.length > 0) status = "bermasalah";
    else if (bahanBaru) status = "konfirmasi";

    baris.push({
      no: baris.length + 1,
      barisAsli,
      status,
      alasan: masalah.length ? masalah.join(". ") + "." : undefined,
      nama,
      sku,
      pemasok: String(r[3] ?? "").trim(),
      jumlah,
      satuan: String(r[5] ?? "").trim(),
      totalBiaya,
      biayaPerUnit:
        biayaPerUnit ??
        (totalBiaya !== null && jumlah ? totalBiaya / jumlah : null),
      tanggal,
      statusPesanan: String(r[11] ?? "Arrived").trim(),
      catatan: String(r[12] ?? "").trim(),
      bahanBaru,
    });
  }

  return { namaFile, namaSheet, baris, dilewati };
}

/* ==========================================================================
   Parser penjualan — deteksi otomatis format wide vs long
   ========================================================================== */

const BULAN_KOLOM = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

export function parsePenjualan(
  buffer: ArrayBuffer,
  namaFile: string,
  menuDikenal: { sku: string; nama: string }[],
  tahun = new Date().getFullYear(),
): HasilParse<BarisPenjualan> {
  const wb = XLSX.read(buffer, { cellDates: true });
  const namaSheet =
    cariSheet(wb, "produk terjual") ??
    cariSheet(wb, "penjualan") ??
    wb.SheetNames[0];

  const matriks = keMatriks(wb.Sheets[namaSheet]);

  // Deteksi format: cari baris header yang mengandung nama bulan Inggris.
  let barisHeader = -1;
  for (let i = 0; i < Math.min(matriks.length, 15); i++) {
    const teks = (matriks[i] ?? [])
      .map((x) => String(x ?? "").toLowerCase())
      .join("|");
    if (BULAN_KOLOM.filter((b) => teks.includes(b)).length >= 6) {
      barisHeader = i;
      break;
    }
  }

  return barisHeader >= 0
    ? parseWide(matriks, barisHeader, namaFile, namaSheet, menuDikenal, tahun)
    : parseLong(matriks, namaFile, namaSheet, menuDikenal);
}

function parseWide(
  matriks: Baris[],
  barisHeader: number,
  namaFile: string,
  namaSheet: string,
  menuDikenal: { sku: string; nama: string }[],
  tahun: number,
): HasilParse<BarisPenjualan> {
  const baris: BarisPenjualan[] = [];
  const dilewati: { barisAsli: number; alasan: string }[] = [];
  const skuDikenal = new Set(menuDikenal.map((m) => m.sku));

  for (let i = barisHeader + 1; i < matriks.length; i++) {
    const r = matriks[i] ?? [];
    const barisAsli = i + 1;
    const namaMentah = r[2];
    if (!namaMentah) continue;

    // Baris yang nama menunya diawali "1" bukan menu jual — itu komponen bahan.
    if (adalahKomponenBahan(namaMentah)) {
      dilewati.push({
        barisAsli,
        alasan: `Dilewati: komponen bahan, bukan menu (${String(namaMentah).trim()}).`,
      });
      continue;
    }

    const nama = bersihkanNamaMenu(namaMentah);
    const sku = String(r[3] ?? "").trim();
    const harga = keAngka(r[5]); // kolom E berisi label "Rp", nilai di F

    const cocok = cocokkanMenu(sku, nama, menuDikenal);

    // UNPIVOT: kolom G–R (indeks 6–17) = Januari–Desember.
    for (let bulan = 0; bulan < 12; bulan++) {
      const qty = keAngka(r[6 + bulan]);
      if (!qty || qty <= 0) continue; // lewati bulan yang nol atau kosong

      const mulai = new Date(tahun, bulan, 1);
      const selesai = new Date(tahun, bulan + 1, 0);

      baris.push({
        no: baris.length + 1,
        barisAsli,
        status:
          harga === null
            ? "bermasalah"
            : cocok.baru
              ? "konfirmasi"
              : "siap",
        alasan: harga === null ? "Harga jual kosong." : undefined,
        namaMenu: nama,
        sku,
        hargaJual: harga,
        periodeMulai: keIsoTanggal(mulai),
        periodeSelesai: keIsoTanggal(selesai),
        qtyTerjual: Math.round(qty),
        skorKecocokan: cocok.skor,
        menuBaru: cocok.baru,
      });
    }

    if (!sku && !skuDikenal.has(sku)) {
      // hanya penanda; baris tetap ikut lewat status konfirmasi
    }
  }

  return { namaFile, namaSheet, baris, dilewati, format: "wide" };
}

function parseLong(
  matriks: Baris[],
  namaFile: string,
  namaSheet: string,
  menuDikenal: { sku: string; nama: string }[],
): HasilParse<BarisPenjualan> {
  const baris: BarisPenjualan[] = [];
  const dilewati: { barisAsli: number; alasan: string }[] = [];

  const header = (matriks[0] ?? []).map((x) =>
    String(x ?? "").trim().toLowerCase(),
  );
  const kol = (nama: string) => header.indexOf(nama);

  const iSku = kol("sku");
  const iNama = kol("nama_menu");
  const iMulai = kol("periode_mulai");
  const iQty = kol("qty_terjual");

  for (let i = 1; i < matriks.length; i++) {
    const r = matriks[i] ?? [];
    const barisAsli = i + 1;
    if (!r[iNama] && !r[iSku]) continue;

    const nama = bersihkanNamaMenu(r[iNama]);
    const sku = String(r[iSku] ?? "").trim();
    const mulai = keTanggalExcel(r[iMulai]);
    const qty = keAngka(r[iQty]);

    if (!mulai || qty === null) {
      dilewati.push({
        barisAsli,
        alasan: !mulai ? "Periode tidak terbaca." : "Qty terjual kosong.",
      });
      continue;
    }

    const cocok = cocokkanMenu(sku, nama, menuDikenal);
    const akhir = keTanggal(mulai);
    akhir.setDate(akhir.getDate() + 6);

    baris.push({
      no: baris.length + 1,
      barisAsli,
      status: cocok.baru ? "konfirmasi" : "siap",
      namaMenu: nama,
      sku,
      hargaJual: null,
      periodeMulai: mulai,
      periodeSelesai: keIsoTanggal(akhir),
      qtyTerjual: Math.round(qty),
      skorKecocokan: cocok.skor,
      menuBaru: cocok.baru,
    });
  }

  return { namaFile, namaSheet, baris, dilewati, format: "long" };
}

/* ==========================================================================
   Pencocokan menu: SKU dulu, baru fuzzy nama
   ========================================================================== */

export function cocokkanMenu(
  sku: string,
  nama: string,
  daftar: { sku: string; nama: string }[],
): { sku?: string; skor?: number; baru: boolean } {
  if (sku) {
    const persis = daftar.find((m) => m.sku === sku);
    if (persis) return { sku: persis.sku, skor: 100, baru: false };
  }

  let terbaik: { sku: string; skor: number } | null = null;
  for (const m of daftar) {
    const s = kemiripan(nama, m.nama);
    if (!terbaik || s > terbaik.skor) terbaik = { sku: m.sku, skor: s };
  }

  if (terbaik && terbaik.skor >= 82) {
    return { sku: terbaik.sku, skor: Math.round(terbaik.skor), baru: false };
  }
  return { skor: terbaik ? Math.round(terbaik.skor) : 0, baru: true };
}

/** Kemiripan 0–100 pakai jarak Levenshtein yang dinormalisasi. */
export function kemiripan(a: string, b: string): number {
  const x = a.toLowerCase().trim();
  const y = b.toLowerCase().trim();
  if (!x || !y) return 0;
  if (x === y) return 100;

  const m = x.length;
  const n = y.length;
  let sebelum = Array.from({ length: n + 1 }, (_, j) => j);
  let sekarang = new Array<number>(n + 1);

  for (let i = 1; i <= m; i++) {
    sekarang[0] = i;
    for (let j = 1; j <= n; j++) {
      sekarang[j] = Math.min(
        sebelum[j] + 1,
        sekarang[j - 1] + 1,
        sebelum[j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1),
      );
    }
    [sebelum, sekarang] = [sekarang, sebelum];
  }

  return (1 - sebelum[n] / Math.max(m, n)) * 100;
}

/* ==========================================================================
   Template unduhan
   ========================================================================== */

export function unduhTemplate(tipe: "restock" | "sales") {
  const wb = XLSX.utils.book_new();

  if (tipe === "restock") {
    const data = [
      ["RESTOCK INVENTARIS"],
      [
        "#",
        "BAHAN",
        "SKU INTERNAL",
        "PEMASOK",
        "JUMLAH",
        "SATUAN",
        "",
        "TOTAL BIAYA",
        "",
        "BIAYA PER UNIT",
        "TANGGAL PEMESANAN",
        "STATUS PEMESANAN",
        "CATATAN",
      ],
      [1, "UHT", "1-B76", "Two Seasons", 240000, "g", "Rp", 5140000, "Rp", 21.42, "2026-09-01", "Arrived", "invoice TS 030"],
      [2, "Oatside", "1-B55", "Two Seasons", 60000, "g", "Rp", 3510000, "Rp", 58.5, "2026-09-01", "Arrived", ""],
    ];
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(data),
      "stock",
    );
  } else {
    const data = [
      ["sku", "nama_menu", "periode_mulai", "qty_terjual"],
      ["Psc01", "Kopi Klasik - ICE", "2026-09-01", 146],
      ["Psc13", "Kopi Susu Gula Aren", "2026-09-01", 132],
    ];
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(data),
      "penjualan",
    );
  }

  XLSX.writeFile(
    wb,
    tipe === "restock"
      ? "template-restock.xlsx"
      : "template-penjualan.xlsx",
  );
}
