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

import { Tombol } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { formatAngka } from "@/lib/format";
import {
  GalatImpor,
  bacaExcel,
  unduhTemplateSkema,
  type Field,
  type HasilImpor,
  type Rekaman,
} from "@/lib/import/skema";

type Langkah = "unggah" | "pratinjau" | "selesai";

/**
 * Impor Excel serbaguna — satu komponen untuk anggaran, pengeluaran,
 * penggunaan bahan, dan pengiriman. Impor bersifat transaksional: kalau ada
 * satu baris tidak valid, tidak ada yang disimpan dan admin diminta
 * memperbaiki berkasnya.
 */
export function ImporTabel({
  judul,
  fields,
  namaTemplate,
  contoh,
  onTutup,
  onSimpan,
  tampil,
}: {
  judul: string;
  fields: Field[];
  namaTemplate: string;
  contoh: Record<string, string | number>[];
  onTutup: () => void;
  /** Transformasi & mapping rekaman valid ke tabel, lalu simpan. */
  onSimpan: (rekaman: Rekaman[]) => void;
  /** Format nilai field untuk tabel hasil. */
  tampil: (f: Field, nilai: Rekaman[string]) => React.ReactNode;
}) {
  const [langkah, setLangkah] = React.useState<Langkah>("unggah");
  const [hasil, setHasil] = React.useState<HasilImpor | null>(null);
  const [galat, setGalat] = React.useState<string | null>(null);
  const [memproses, setMemproses] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const bacaBerkas = async (berkas: File) => {
    setMemproses(true);
    setGalat(null);
    try {
      const h = bacaExcel(await berkas.arrayBuffer(), berkas.name, fields);
      setHasil(h);
      setLangkah("pratinjau");
    } catch (e) {
      setGalat(
        e instanceof GalatImpor
          ? e.message
          : "Berkas tidak bisa dibaca. Pastikan memakai template yang disediakan.",
      );
    } finally {
      setMemproses(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const baris = hasil?.baris ?? [];
  const bermasalah = baris.filter((b) => b.galat.length > 0);
  const valid = baris.filter((b) => b.rekaman);
  const bisaSimpan = baris.length > 0 && bermasalah.length === 0;

  const simpan = () => {
    onSimpan(valid.map((b) => b.rekaman!));
    setLangkah("selesai");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/25 sm:items-center sm:p-5">
      <div className="fixed inset-0" onClick={onTutup} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="judul-impor-tabel"
        className="anim-rise relative flex max-h-[94dvh] w-full max-w-4xl flex-col rounded-t-modal border border-line bg-panel shadow-[var(--shadow-modal)] sm:rounded-modal"
      >
        <div className="flex items-start justify-between gap-2 border-b border-line px-4 py-3">
          <div className="min-w-0">
            <h2 id="judul-impor-tabel" className="t-h2 text-ink">
              {langkah === "selesai" ? "Hasil unggahan" : judul}
            </h2>
            <ol className="t-caption mt-1 flex flex-wrap gap-x-3 text-ink-faint">
              {(["unggah", "pratinjau", "selesai"] as Langkah[]).map((l, i) => (
                <li key={l} className={cn(langkah === l && "font-medium text-ink")}>
                  {i + 1}. {l === "unggah" ? "Unggah" : l === "pratinjau" ? "Validasi" : "Tersimpan"}
                </li>
              ))}
            </ol>
          </div>
          <button
            onClick={onTutup}
            className="flex h-8 w-8 items-center justify-center rounded-input text-ink-muted hover:bg-panel-sunken"
            aria-label="Tutup"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        <div className="scroll-thin min-h-0 flex-1 overflow-auto px-4 py-4">
          {langkah === "unggah" ? (
            <div className="space-y-4">
              <button
                onClick={() => inputRef.current?.click()}
                disabled={memproses}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files[0];
                  if (f) void bacaBerkas(f);
                }}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-panel border border-dashed border-line-strong bg-panel-sunken/50 px-6 py-10 text-center transition-colors hover:bg-panel-sunken"
              >
                <FileSpreadsheet size={28} strokeWidth={1.5} className="text-ink-muted" />
                <span className="t-body-strong text-ink">
                  {memproses ? "Membaca berkas…" : "Pilih atau seret berkas Excel"}
                </span>
                <span className="t-caption text-ink-muted">
                  .xlsx, .xls, atau .csv — baris pertama berisi judul kolom
                </span>
              </button>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void bacaBerkas(f);
                }}
              />

              {galat ? (
                <div role="alert" className="flex gap-2 rounded-panel border border-expired/30 bg-expired-bg px-3 py-2.5 text-[13px] text-expired">
                  <AlertTriangle size={16} strokeWidth={1.75} className="mt-0.5 shrink-0" />
                  <span>{galat}</span>
                </div>
              ) : null}

              <div className="rounded-panel border border-line">
                <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
                  <span className="t-caption font-medium text-ink">Kolom yang dibaca</span>
                  <Tombol
                    ukuran="sm"
                    onClick={() => unduhTemplateSkema(namaTemplate, fields, contoh)}
                  >
                    <Download size={14} strokeWidth={1.75} />
                    Unduh template
                  </Tombol>
                </div>
                <ul className="divide-y divide-line text-[13px]">
                  {fields.map((f) => (
                    <li key={f.kunci} className="flex flex-wrap items-baseline gap-x-2 px-3 py-1.5">
                      <span className="font-medium text-ink">{f.label}</span>
                      {f.wajib ? <span className="t-caption text-expired">wajib</span> : null}
                      <span className="t-caption text-ink-muted">
                        {f.tipe === "angka"
                          ? `angka ≥ ${f.min ?? 0}${f.satuan ? ` (${f.satuan})` : ""}`
                          : f.tipe === "tanggal"
                            ? "tanggal YYYY-MM-DD"
                            : f.tipe === "bulan"
                              ? "bulan YYYY-MM"
                              : f.tipe === "pilihan"
                                ? `salah satu: ${f.opsi?.slice(0, 4).map((o) => o.label).join(", ")}${(f.opsi?.length ?? 0) > 4 ? ", …" : ""}`
                                : "teks"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {langkah === "pratinjau" ? (
                bermasalah.length ? (
                  <div role="alert" className="rounded-panel border border-expired/30 bg-expired-bg px-3 py-2.5 text-[13px] text-expired">
                    <p className="font-medium">
                      {bermasalah.length} dari {baris.length} baris tidak valid — data belum disimpan.
                    </p>
                    <p className="mt-0.5">
                      Perbaiki berkas {hasil?.namaFile} sesuai catatan di bawah, lalu unggah ulang.
                    </p>
                  </div>
                ) : (
                  <div role="status" className="flex items-center gap-2 rounded-panel border border-fresh/30 bg-fresh-bg px-3 py-2.5 text-[13px] text-fresh">
                    <CheckCircle2 size={16} strokeWidth={1.75} />
                    Format, struktur, dan isi {formatAngka(baris.length)} baris valid. Siap disimpan.
                  </div>
                )
              ) : (
                <div role="status" className="flex items-center gap-2 rounded-panel border border-fresh/30 bg-fresh-bg px-3 py-2.5 text-[13px] text-fresh">
                  <CheckCircle2 size={16} strokeWidth={1.75} />
                  {formatAngka(valid.length)} baris dari {hasil?.namaFile} tersimpan ke database.
                </div>
              )}

              <div className="scroll-thin overflow-auto rounded-panel border border-line">
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr className="bg-panel-sunken text-left text-[12px] text-ink-muted">
                      <th className="px-3 py-2 font-medium">Baris</th>
                      {fields.map((f) => (
                        <th key={f.kunci} className={cn("px-3 py-2 font-medium", f.tipe === "angka" && "text-right")}>
                          {f.label}
                        </th>
                      ))}
                      {langkah === "pratinjau" ? <th className="px-3 py-2 font-medium">Validasi</th> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {(langkah === "selesai" ? valid : baris).map((b) => (
                      <tr key={b.nomor} className={cn("border-t border-line", b.galat.length && "bg-expired-bg/50")}>
                        <td className="num px-3 py-1.5 text-ink-faint">{b.nomor}</td>
                        {fields.map((f) => (
                          <td key={f.kunci} className={cn("px-3 py-1.5 text-ink", f.tipe === "angka" && "num text-right")}>
                            {b.rekaman ? tampil(f, b.rekaman[f.kunci]) : String(b.mentah[f.kunci] ?? "") || "—"}
                          </td>
                        ))}
                        {langkah === "pratinjau" ? (
                          <td className="px-3 py-1.5">
                            {b.galat.length ? (
                              <span className="text-expired">{b.galat.join(" ")}</span>
                            ) : (
                              <span className="text-fresh">Valid</span>
                            )}
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line px-4 py-3">
          {langkah === "pratinjau" ? (
            <>
              <Tombol ukuran="sm" onClick={() => { setHasil(null); setLangkah("unggah"); }}>
                <Upload size={14} strokeWidth={1.75} />
                Unggah ulang
              </Tombol>
              <Tombol varian="utama" ukuran="sm" disabled={!bisaSimpan} onClick={simpan}>
                Simpan {formatAngka(valid.length)} baris
              </Tombol>
            </>
          ) : (
            <Tombol varian={langkah === "selesai" ? "utama" : "sekunder"} ukuran="sm" onClick={onTutup}>
              {langkah === "selesai" ? "Selesai" : "Batal"}
            </Tombol>
          )}
        </div>
      </div>
    </div>
  );
}
