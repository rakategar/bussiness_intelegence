"use client";

import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Upload,
  X,
} from "lucide-react";

import {
  EmptyState,
  Isian,
  Pilihan,
  Tabs,
  Tombol,
} from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { formatAngka, formatRupiah, formatTanggal, keIsoTanggal } from "@/lib/format";
import { HARI_INI, bahan, menu } from "@/lib/data/seed";
import {
  parsePenjualan,
  parseRestock,
  unduhTemplate,
  type BarisPenjualan,
  type BarisRestock,
  type HasilParse,
  type StatusBaris,
} from "@/lib/import/parser";

type Langkah = "unggah" | "pratinjau" | "selesai";
type Tipe = "restock" | "sales";

type BarisApa = BarisRestock | BarisPenjualan;

const GAYA_STATUS_BARIS: Record<
  StatusBaris,
  { titik: string; latar: string; teks: string; label: string }
> = {
  siap: {
    titik: "bg-fresh",
    latar: "bg-fresh-bg",
    teks: "text-fresh",
    label: "Siap masuk",
  },
  konfirmasi: {
    titik: "bg-watch",
    latar: "bg-watch-bg",
    teks: "text-watch",
    label: "Butuh konfirmasi",
  },
  bermasalah: {
    titik: "bg-expired",
    latar: "bg-expired-bg",
    teks: "text-expired",
    label: "Bermasalah",
  },
};

export function ImportWizard({
  tipe,
  onTutup,
  onSelesai,
}: {
  tipe: Tipe;
  onTutup: () => void;
  onSelesai: (jumlahBaris: number) => void;
}) {
  const [langkah, setLangkah] = React.useState<Langkah>("unggah");
  const [hasil, setHasil] = React.useState<HasilParse<BarisApa> | null>(null);
  const [galat, setGalat] = React.useState<string | null>(null);
  const [saring, setSaring] = React.useState<StatusBaris | "semua">("semua");
  const [granularitas, setGranularitas] = React.useState<"weekly" | "monthly">(
    "weekly",
  );
  const [periode, setPeriode] = React.useState(keIsoTanggal(HARI_INI));
  const [memproses, setMemproses] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const bacaBerkas = async (berkas: File) => {
    setMemproses(true);
    setGalat(null);
    try {
      const buf = await berkas.arrayBuffer();
      const parsed =
        tipe === "restock"
          ? (parseRestock(
              buf,
              berkas.name,
              new Set(bahan.map((b) => b.sku)),
            ) as HasilParse<BarisApa>)
          : (parsePenjualan(
              buf,
              berkas.name,
              menu.map((m) => ({ sku: m.sku, nama: m.nama })),
            ) as HasilParse<BarisApa>);
      setHasil(parsed);
      setLangkah("pratinjau");
    } catch (e) {
      setGalat(
        e instanceof Error
          ? e.message
          : "File tidak bisa dibaca. Pastikan formatnya .xlsx.",
      );
    } finally {
      setMemproses(false);
    }
  };

  const pakaiContoh = () => {
    setHasil(contohHasil(tipe));
    setLangkah("pratinjau");
  };

  const baris = hasil?.baris ?? [];
  const hitung = {
    siap: baris.filter((b) => b.status === "siap").length,
    konfirmasi: baris.filter((b) => b.status === "konfirmasi").length,
    bermasalah: baris.filter((b) => b.status === "bermasalah").length,
  };
  const terlihat =
    saring === "semua" ? baris : baris.filter((b) => b.status === saring);
  const bisaSimpan = hitung.siap + hitung.konfirmasi;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/25 sm:items-center sm:p-5">
      <div className="fixed inset-0" onClick={onTutup} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="judul-impor"
        className="anim-rise relative flex max-h-[94dvh] w-full max-w-4xl flex-col rounded-t-modal border border-line bg-panel shadow-[var(--shadow-modal)] sm:rounded-modal"
      >
        {/* --- Kepala --- */}
        <div className="flex items-start justify-between gap-2 border-b border-line px-4 py-3">
          <div className="min-w-0">
            <h2 id="judul-impor" className="t-h2 text-ink">
              {langkah === "selesai"
                ? "Impor selesai"
                : `Impor ${tipe === "restock" ? "restock" : "penjualan"}`}
            </h2>
            <p className="t-caption mt-0.5 truncate text-ink-muted">
              {hasil
                ? `${hasil.namaFile} · sheet "${hasil.namaSheet}" · ${baris.length} baris terbaca`
                : "Unggah → pratinjau → simpan. Tidak ada yang masuk sebelum Anda menyetujuinya."}
            </p>
          </div>
          <button
            onClick={onTutup}
            className="rounded-input p-1 text-ink-faint transition-colors hover:bg-panel-sunken hover:text-ink"
            aria-label="Tutup"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* --- Langkah --- */}
        <ol className="flex items-center gap-2 border-b border-line px-4 py-2.5 text-[12px]">
          {(
            [
              ["unggah", "Unggah"],
              ["pratinjau", "Pratinjau"],
              ["selesai", "Simpan"],
            ] as [Langkah, string][]
          ).map(([k, label], i) => {
            const urut: Langkah[] = ["unggah", "pratinjau", "selesai"];
            const aktif = urut.indexOf(langkah) >= i;
            return (
              <li key={k} className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold",
                    aktif
                      ? "bg-brand text-brand-on"
                      : "bg-panel-sunken text-ink-faint",
                  )}
                >
                  {i + 1}
                </span>
                <span className={aktif ? "text-ink" : "text-ink-faint"}>
                  {label}
                </span>
                {i < 2 ? (
                  <span className="h-px w-6 bg-line sm:w-10" aria-hidden />
                ) : null}
              </li>
            );
          })}
        </ol>

        {/* --- Isi --- */}
        <div className="scroll-thin min-h-0 flex-1 overflow-auto">
          {langkah === "unggah" ? (
            <div className="px-4 py-6">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) void bacaBerkas(f);
                }}
                className="rounded-panel border border-dashed border-line-strong bg-panel-sunken/40 px-6 py-10 text-center"
              >
                <FileSpreadsheet
                  size={26}
                  strokeWidth={1.3}
                  className="mx-auto text-ink-faint"
                />
                <p className="t-h3 mt-3 text-ink">
                  Letakkan file .xlsx di sini
                </p>
                <p className="t-small prose-width mx-auto mt-1 text-ink-muted">
                  {tipe === "restock"
                    ? 'File asli boleh diunggah apa adanya. Prefix "1" pada nama bahan dan kolom "Rp" yang terpisah dari nilainya ditangani otomatis.'
                    : 'Format wide (kolom per bulan) maupun long dikenali otomatis. Prefix "_" pada nama menu dibersihkan, baris komponen bahan dilewati.'}
                </p>

                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void bacaBerkas(f);
                  }}
                />

                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <Tombol
                    varian="utama"
                    onClick={() => inputRef.current?.click()}
                    disabled={memproses}
                  >
                    <Upload size={14} strokeWidth={1.75} />
                    {memproses ? "Membaca…" : "Pilih file"}
                  </Tombol>
                  <Tombol onClick={() => unduhTemplate(tipe)}>
                    <Download size={14} strokeWidth={1.75} />
                    Unduh template
                  </Tombol>
                  <Tombol varian="halus" onClick={pakaiContoh}>
                    Pakai contoh data
                  </Tombol>
                </div>
              </div>

              {galat ? (
                <p
                  role="alert"
                  className="mt-3 flex items-start gap-1.5 text-[13px] text-expired"
                >
                  <AlertTriangle
                    size={14}
                    strokeWidth={1.5}
                    className="mt-0.5 shrink-0"
                  />
                  {galat}
                </p>
              ) : null}

              {tipe === "sales" ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="granularitas"
                      className="t-caption mb-1 block font-medium text-ink"
                    >
                      Granularitas
                    </label>
                    <Pilihan
                      id="granularitas"
                      value={granularitas}
                      onChange={(e) =>
                        setGranularitas(e.target.value as "weekly" | "monthly")
                      }
                      className="h-10 w-full text-[14px]"
                    >
                      <option value="weekly">Mingguan</option>
                      <option value="monthly">Bulanan</option>
                    </Pilihan>
                  </div>
                  <div>
                    <label
                      htmlFor="periode"
                      className="t-caption mb-1 block font-medium text-ink"
                    >
                      Periode target
                    </label>
                    <Isian
                      id="periode"
                      type="date"
                      value={periode}
                      onChange={(e) => setPeriode(e.target.value)}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          ) : langkah === "pratinjau" ? (
            <div>
              {/* Tiga kartu ringkasan */}
              <div className="grid gap-3 px-4 py-4 sm:grid-cols-3">
                {(
                  [
                    ["siap", hitung.siap],
                    ["konfirmasi", hitung.konfirmasi],
                    ["bermasalah", hitung.bermasalah],
                  ] as [StatusBaris, number][]
                ).map(([s, n]) => {
                  const g = GAYA_STATUS_BARIS[s];
                  return (
                    <button
                      key={s}
                      onClick={() => setSaring(s)}
                      className={cn(
                        "rounded-panel border p-3 text-left transition-colors",
                        saring === s ? "border-line-strong" : "border-line",
                        g.latar,
                      )}
                    >
                      <span className={cn("num block text-[24px] font-semibold leading-7", g.teks)}>
                        {n}
                      </span>
                      <span className={cn("t-caption", g.teks)}>{g.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab filter */}
              <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
                <Tabs
                  nilai={saring}
                  onUbah={setSaring}
                  daftar={[
                    { nilai: "semua" as const, label: "Semua", jumlah: baris.length },
                    { nilai: "siap" as const, label: "Siap", jumlah: hitung.siap },
                    {
                      nilai: "konfirmasi" as const,
                      label: tipe === "restock" ? "Bahan baru" : "Menu baru",
                      jumlah: hitung.konfirmasi,
                    },
                    {
                      nilai: "bermasalah" as const,
                      label: "Bermasalah",
                      jumlah: hitung.bermasalah,
                    },
                  ]}
                />
                {hasil?.format ? (
                  <span className="t-caption ml-auto text-ink-faint">
                    Format terdeteksi: {hasil.format}
                  </span>
                ) : null}
              </div>

              {/* Tabel baris */}
              <div className="border-t border-line">
                {terlihat.length === 0 ? (
                  <EmptyState
                    judul="Tidak ada baris di kelompok ini"
                    penjelasan="Pilih tab lain untuk melihat baris yang tersedia."
                  />
                ) : (
                  <table className="w-full border-collapse text-[13px]">
                    <thead className="sticky top-0 z-10">
                      <tr>
                        {(tipe === "restock"
                          ? ["", "#", "Bahan", "SKU", "Jumlah", "Total biaya", "Tanggal"]
                          : ["", "#", "Menu", "SKU", "Periode", "Qty", "Cocok"]
                        ).map((h, i) => (
                          <th
                            key={h || i}
                            scope="col"
                            className={cn(
                              "border-b border-line bg-panel-sunken px-3 py-2 text-[12px] font-medium text-ink-muted",
                              i >= 4 ? "text-right" : "text-left",
                            )}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {terlihat.slice(0, 200).map((b) => (
                        <BarisPratinjau
                          key={`${b.barisAsli}-${b.no}`}
                          baris={b}
                          tipe={tipe}
                        />
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {hasil && hasil.dilewati.length > 0 ? (
                <details className="border-t border-line px-4 py-3">
                  <summary className="t-small cursor-pointer text-ink-muted">
                    {hasil.dilewati.length} baris dilewati — lihat alasannya
                  </summary>
                  <ul className="mt-2 space-y-1">
                    {hasil.dilewati.slice(0, 30).map((d, i) => (
                      <li key={i} className="t-caption text-ink-faint">
                        <span className="num">Baris {d.barisAsli}</span> —{" "}
                        {d.alasan}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </div>
          ) : (
            <div className="px-4 py-8">
              <EmptyState
                nada="baik"
                ikon={<CheckCircle2 size={18} strokeWidth={1.5} />}
                judul={`${formatAngka(bisaSimpan)} baris tersimpan`}
                penjelasan={
                  tipe === "sales"
                    ? "Stok bahan sudah dikurangi otomatis dengan metode FEFO berdasarkan resep tiap menu."
                    : "Batch baru sudah masuk dengan tanggal kadaluarsa terisi otomatis dari masa simpan bahan."
                }
                aksi={
                  <>
                    <Tombol onClick={() => onSelesai(bisaSimpan)}>
                      Kembali ke daftar
                    </Tombol>
                    <Tombol varian="bahaya">Batalkan impor ini</Tombol>
                  </>
                }
              />
              <p className="t-caption mt-2 text-center text-ink-faint">
                Tombol batalkan aktif selama 24 jam sejak impor.
              </p>

              {tipe === "sales" ? (
                <p className="t-small prose-width mx-auto mt-4 rounded-panel bg-watch-bg px-3 py-2.5 text-watch">
                  {menu.filter((m) => m.sku.startsWith("P")).length > 0
                    ? "7 menu dilewati karena resepnya belum diisi. Konsumsi bahannya tidak terhitung."
                    : null}
                </p>
              ) : null}
            </div>
          )}
        </div>

        {/* --- Kaki --- */}
        {langkah === "pratinjau" ? (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-4 py-3">
            <Tombol onClick={() => setLangkah("unggah")}>Ganti file</Tombol>
            <Tombol onClick={onTutup}>Batal</Tombol>
            <Tombol
              varian="utama"
              disabled={bisaSimpan === 0}
              onClick={() => setLangkah("selesai")}
            >
              Simpan {formatAngka(bisaSimpan)} baris ke sistem
            </Tombol>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------- */

function BarisPratinjau({ baris, tipe }: { baris: BarisApa; tipe: Tipe }) {
  const [buka, setBuka] = React.useState(false);
  const g = GAYA_STATUS_BARIS[baris.status];
  const r = baris as BarisRestock;
  const p = baris as BarisPenjualan;

  return (
    <>
      <tr
        className="border-b border-line hover:bg-panel-sunken/60"
        style={
          baris.status === "bermasalah"
            ? { boxShadow: "inset 3px 0 0 0 var(--expired)" }
            : undefined
        }
      >
        <td className="h-10 px-3">
          <span
            className={cn("block h-2.5 w-2.5 rounded-full", g.titik)}
            title={g.label}
          />
        </td>
        <td className="num h-10 px-3 text-ink-faint">{baris.barisAsli}</td>
        <td className="h-10 px-3 text-ink">
          {tipe === "restock" ? r.nama : p.namaMenu}
          {baris.status === "konfirmasi" ? (
            <span className="ml-2 inline-flex h-[18px] items-center rounded-[999px] bg-watch-bg px-1.5 text-[11px] text-watch">
              {tipe === "restock" ? "bahan baru" : "menu baru"}
            </span>
          ) : null}
        </td>
        <td className="num h-10 px-3 text-ink-muted">
          {tipe === "restock" ? r.sku || "—" : p.sku || "—"}
        </td>

        {tipe === "restock" ? (
          <>
            <td className="num h-10 px-3 text-right text-ink">
              {r.jumlah === null ? (
                <span className="text-expired">—</span>
              ) : (
                `${formatAngka(r.jumlah)} ${r.satuan}`
              )}
            </td>
            <td className="num h-10 px-3 text-right text-ink">
              {r.totalBiaya === null ? "—" : formatRupiah(r.totalBiaya)}
            </td>
            <td className="h-10 px-3 text-right text-ink-muted">
              {r.tanggal ? formatTanggal(r.tanggal) : "—"}
            </td>
          </>
        ) : (
          <>
            <td className="h-10 px-3 text-right text-ink-muted">
              {formatTanggal(p.periodeMulai)}
            </td>
            <td className="num h-10 px-3 text-right text-ink">
              {formatAngka(p.qtyTerjual)}
            </td>
            <td className="num h-10 px-3 text-right text-ink-muted">
              {p.skorKecocokan ? `${p.skorKecocokan}%` : "—"}
            </td>
          </>
        )}
      </tr>

      {/* Baris bermasalah bisa diperbaiki langsung di layar ini */}
      {baris.status === "bermasalah" ? (
        <tr className="border-b border-line bg-expired-bg/40">
          <td />
          <td colSpan={6} className="px-3 pb-2.5 pt-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="t-caption text-expired">
                {baris.alasan ?? "Baris bermasalah."}
              </span>
              {buka ? (
                <span className="flex flex-wrap items-center gap-1.5">
                  <Isian
                    className="h-8 w-28 text-[13px]"
                    placeholder="Jumlah"
                    aria-label="Perbaiki jumlah"
                  />
                  <Isian
                    className="h-8 w-32 text-[13px]"
                    placeholder="Total biaya"
                    aria-label="Perbaiki total biaya"
                  />
                  <Tombol ukuran="sm" varian="utama">
                    Terapkan
                  </Tombol>
                  <Tombol ukuran="sm" varian="halus" onClick={() => setBuka(false)}>
                    Batal
                  </Tombol>
                </span>
              ) : (
                <button
                  onClick={() => setBuka(true)}
                  className="t-caption text-brand underline"
                >
                  Isi sekarang ▸
                </button>
              )}
            </div>
          </td>
        </tr>
      ) : null}

      {baris.status === "konfirmasi" ? (
        <tr className="border-b border-line bg-watch-bg/30">
          <td />
          <td colSpan={6} className="px-3 pb-2.5 pt-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="t-caption text-ink-muted">
                {tipe === "restock"
                  ? "Bahan ini belum ada di sistem."
                  : `Menu belum ditemukan. Kemiripan nama tertinggi ${p.skorKecocokan ?? 0}%.`}
              </span>
              <Tombol ukuran="sm">Buat baru</Tombol>
              <Pilihan className="h-8" aria-label="Petakan ke yang sudah ada">
                <option>Petakan ke yang sudah ada…</option>
                {(tipe === "restock" ? bahan : menu).slice(0, 40).map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.nama}
                  </option>
                ))}
              </Pilihan>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------------------- */

/** Contoh hasil parse, supaya layar pratinjau bisa dilihat tanpa file asli. */
function contohHasil(tipe: Tipe): HasilParse<BarisApa> {
  if (tipe === "restock") {
    const baris: BarisRestock[] = bahan.slice(0, 24).map((b, i) => {
      const bermasalah = i === 12;
      const baru = i === 5 || i === 17;
      return {
        no: i + 1,
        barisAsli: i + 3,
        status: bermasalah ? "bermasalah" : baru ? "konfirmasi" : "siap",
        alasan: bermasalah ? "Jumlah kosong." : undefined,
        nama: b.nama,
        sku: baru ? `${b.sku}-N` : b.sku,
        pemasok: "Two Seasons",
        jumlah: bermasalah ? null : Math.round(1000 + i * 730),
        satuan: b.satuan,
        totalBiaya: Math.round((1000 + i * 730) * b.hargaPerUnitTerakhir),
        biayaPerUnit: b.hargaPerUnitTerakhir,
        tanggal: "2026-09-01",
        statusPesanan: "Arrived",
        catatan: "",
        bahanBaru: baru,
      };
    });
    return {
      namaFile: "restock_september.xlsx",
      namaSheet: "stock ",
      baris,
      dilewati: [
        { barisAsli: 41, alasan: "Baris kosong." },
        { barisAsli: 88, alasan: "Nama bahan kosong." },
        { barisAsli: 214, alasan: "SKU internal kosong (1Martabak Mini)." },
      ],
    };
  }

  const baris: BarisPenjualan[] = menu.slice(0, 26).map((m, i) => {
    const baru = i === 9;
    return {
      no: i + 1,
      barisAsli: i + 7,
      status: baru ? "konfirmasi" : "siap",
      namaMenu: m.nama,
      sku: baru ? "" : m.sku,
      hargaJual: m.hargaJual,
      periodeMulai: "2026-09-01",
      periodeSelesai: "2026-09-07",
      qtyTerjual: 20 + i * 7,
      skorKecocokan: baru ? 74 : 100,
      menuBaru: baru,
    };
  });

  return {
    namaFile: "rekap-penjualan-2026-W36.xlsx",
    namaSheet: "produk terjual",
    baris,
    dilewati: [
      {
        barisAsli: 110,
        alasan: "Dilewati: komponen bahan, bukan menu (1Basic Espresso).",
      },
      {
        barisAsli: 111,
        alasan: "Dilewati: komponen bahan, bukan menu (1Simple Syrup).",
      },
      { barisAsli: 112, alasan: "Dilewati: komponen bahan, bukan menu (1Rice)." },
    ],
    format: "wide",
  };
}
