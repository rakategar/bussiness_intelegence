/**
 * Format angka Indonesia. Semua komponen memformat lewat sini — jangan
 * memanggil toLocaleString langsung di komponen, supaya format konsisten.
 * Locale id-ID, timezone Asia/Jakarta, minggu mulai Senin.
 */

const LOCALE = "id-ID";

const BULAN_PENDEK = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Ags",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

const BULAN_PANJANG = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

/** `formatRupiah(1250000)` → `"Rp 1.250.000"` */
export function formatRupiah(nilai: number, desimal = 0): string {
  return `Rp ${formatAngka(nilai, desimal)}`;
}

/** `formatRupiahRingkas(45000000)` → `"Rp 45,0 jt"` — untuk KPI */
export function formatRupiahRingkas(nilai: number): string {
  return `Rp ${angkaRingkas(nilai)}`;
}

export function angkaRingkas(nilai: number): string {
  const abs = Math.abs(nilai);
  if (abs >= 1_000_000_000) return `${formatAngka(nilai / 1_000_000_000, 1)} M`;
  if (abs >= 1_000_000) return `${formatAngka(nilai / 1_000_000, 1)} jt`;
  // Di bawah 10 ribu, satu desimal wajib: tanpa itu 1.500 dan 2.250 sama-sama
  // jadi "2k" dan label sumbu grafik terlihat kembar.
  if (abs >= 1_000) return `${formatAngka(nilai / 1_000, abs < 10_000 ? 1 : 0)}k`;
  return formatAngka(nilai, 0);
}

/** `formatAngka(21.42)` → `"21,42"` — koma sebagai desimal */
export function formatAngka(nilai: number, desimal = 0): string {
  if (!Number.isFinite(nilai)) return "—";
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: desimal,
    maximumFractionDigits: desimal,
  }).format(nilai);
}

/** Angka dengan desimal seperlunya, maksimal `maks` digit. */
export function formatAngkaLuwes(nilai: number, maks = 2): string {
  if (!Number.isFinite(nilai)) return "—";
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: maks }).format(
    nilai,
  );
}

/** `formatPersen(60.94)` → `"60,9%"` */
export function formatPersen(nilai: number, desimal = 1): string {
  if (!Number.isFinite(nilai)) return "—";
  return `${formatAngka(nilai, desimal)}%`;
}

/** Perubahan poin persen — `"1,8pp"` */
export function formatPoinPersen(nilai: number, desimal = 1): string {
  return `${formatAngka(Math.abs(nilai), desimal)}pp`;
}

/** Delta bertanda untuk KPI — `"↑ 8,2%"` / `"↓ 1,8pp"` */
export function formatDelta(
  nilai: number,
  jenis: "persen" | "pp" = "persen",
): string {
  const panah = nilai > 0 ? "↑" : nilai < 0 ? "↓" : "→";
  const teks =
    jenis === "pp"
      ? formatPoinPersen(nilai)
      : `${formatAngka(Math.abs(nilai), 1)}%`;
  return `${panah} ${teks}`;
}

/** Qty + satuan, satuan diredam di UI lewat kelas terpisah. */
export function formatQty(nilai: number, satuan?: string): string {
  const angka = formatAngkaLuwes(nilai, nilai % 1 === 0 ? 0 : 2);
  return satuan ? `${angka} ${satuan}` : angka;
}

// ---------------------------------------------------------------------------
// Tanggal
// ---------------------------------------------------------------------------

export function keTanggal(nilai: Date | string): Date {
  return nilai instanceof Date ? nilai : new Date(`${nilai}T00:00:00+07:00`);
}

/** `formatTanggal("2026-09-03")` → `"3 Sep 2026"` */
export function formatTanggal(nilai: Date | string): string {
  const d = keTanggal(nilai);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getDate()} ${BULAN_PENDEK[d.getMonth()]} ${d.getFullYear()}`;
}

/** Tanggal pendek tanpa tahun — `"3 Sep"` */
export function formatTanggalPendek(nilai: Date | string): string {
  const d = keTanggal(nilai);
  return `${d.getDate()} ${BULAN_PENDEK[d.getMonth()]}`;
}

export function formatWaktu(nilai: Date | string): string {
  const d = nilai instanceof Date ? nilai : new Date(nilai);
  return `${String(d.getHours()).padStart(2, "0")}.${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}

/** `"3 Sep 2026, 09.14"` */
export function formatTanggalWaktu(nilai: Date | string): string {
  const d = nilai instanceof Date ? nilai : new Date(nilai);
  return `${formatTanggal(d)}, ${formatWaktu(d)}`;
}

/** `"1–7 Sep 2026"` — tahun hanya ditulis sekali kalau sama */
export function formatRentang(
  mulai: Date | string,
  selesai: Date | string,
): string {
  const a = keTanggal(mulai);
  const b = keTanggal(selesai);
  const tahunSama = a.getFullYear() === b.getFullYear();
  const bulanSama = tahunSama && a.getMonth() === b.getMonth();
  if (bulanSama) {
    return `${a.getDate()}–${b.getDate()} ${BULAN_PENDEK[b.getMonth()]} ${b.getFullYear()}`;
  }
  if (tahunSama) {
    return `${formatTanggalPendek(a)} – ${formatTanggalPendek(b)} ${b.getFullYear()}`;
  }
  return `${formatTanggal(a)} – ${formatTanggal(b)}`;
}

export function namaBulan(indeks: number, panjang = false): string {
  return (panjang ? BULAN_PANJANG : BULAN_PENDEK)[indeks] ?? "—";
}

// ---------------------------------------------------------------------------
// Minggu ISO — minggu mulai Senin
// ---------------------------------------------------------------------------

export function awalMinggu(nilai: Date | string): Date {
  const d = new Date(keTanggal(nilai));
  const hari = (d.getDay() + 6) % 7; // Senin = 0
  d.setDate(d.getDate() - hari);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function akhirMinggu(nilai: Date | string): Date {
  const d = awalMinggu(nilai);
  d.setDate(d.getDate() + 6);
  return d;
}

export function nomorMinggu(nilai: Date | string): number {
  const d = new Date(keTanggal(nilai));
  d.setHours(0, 0, 0, 0);
  // Kamis pada minggu yang sama menentukan tahun ISO-nya
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const kamisPertama = new Date(d.getFullYear(), 0, 4);
  kamisPertama.setDate(
    kamisPertama.getDate() + 3 - ((kamisPertama.getDay() + 6) % 7),
  );
  return (
    1 + Math.round((d.getTime() - kamisPertama.getTime()) / (7 * 86_400_000))
  );
}

/** `formatMinggu(...)` → `"Minggu 36 · 1–7 Sep"` */
export function formatMinggu(nilai: Date | string): string {
  const a = awalMinggu(nilai);
  const b = akhirMinggu(nilai);
  const rentang =
    a.getMonth() === b.getMonth()
      ? `${a.getDate()}–${b.getDate()} ${BULAN_PENDEK[b.getMonth()]}`
      : `${formatTanggalPendek(a)}–${formatTanggalPendek(b)}`;
  return `Minggu ${nomorMinggu(a)} · ${rentang}`;
}

/** Label ringkas untuk sumbu grafik — `"M36"` */
export function labelMinggu(nilai: Date | string): string {
  return `M${nomorMinggu(nilai)}`;
}

export function tambahHari(nilai: Date | string, hari: number): Date {
  const d = new Date(keTanggal(nilai));
  d.setDate(d.getDate() + hari);
  return d;
}

export function selisihHari(a: Date | string, b: Date | string): number {
  const ms = keTanggal(a).getTime() - keTanggal(b).getTime();
  return Math.round(ms / 86_400_000);
}

/** `"2026-09-03"` — untuk kunci dan penyimpanan */
export function keIsoTanggal(nilai: Date | string): string {
  const d = keTanggal(nilai);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}
