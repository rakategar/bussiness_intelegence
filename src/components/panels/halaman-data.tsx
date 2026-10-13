"use client";

import * as React from "react";
import { Download, Pencil, Plus, RotateCcw, Trash2, Upload, X } from "lucide-react";

import { DataTable, type Kolom } from "@/components/ui/data-table";
import {
  Isian,
  Label,
  PageHeader,
  Pilihan,
  Rupiah,
  Tombol,
} from "@/components/ui/primitives";
import { ImporTabel } from "@/components/panels/impor-tabel";
import { formatAngkaLuwes, formatTanggal } from "@/lib/format";
import { labelPeriode } from "@/lib/data/operasional";
import {
  unduhTemplateSkema,
  validasiRekaman,
  type Field,
  type Rekaman,
} from "@/lib/import/skema";
import type { Koleksi } from "@/lib/data/operasional";

/**
 * Hak akses halaman data, mengikuti aturan fitur 1:
 * - penuh: Admin Operasional menambah, mengubah, menghapus.
 * - baca: Pemilik Usaha hanya melihat daftar dan detail.
 * - { hanya }: Karyawan Logistik hanya mengubah field tertentu (status).
 */
export type Akses = "penuh" | "baca" | { hanya: string[] };

export interface FilterData<T> {
  kunci: string;
  label: string;
  opsi: { nilai: string; label: string }[];
  cocok: (baris: T, nilai: string) => boolean;
}

export function tampilNilai(f: Field, v: Rekaman[string]): React.ReactNode {
  if (v === undefined || v === "") return <span className="text-ink-faint">—</span>;
  switch (f.tipe) {
    case "angka":
      return f.satuan === "Rp" ? (
        <Rupiah nilai={Number(v)} />
      ) : (
        <span className="num">
          {formatAngkaLuwes(Number(v))}
          {f.satuan ? ` ${f.satuan}` : ""}
        </span>
      );
    case "tanggal":
      return formatTanggal(String(v));
    case "bulan":
      return labelPeriode(String(v));
    case "pilihan":
      return f.opsi?.find((o) => o.nilai === v)?.label ?? String(v);
    default:
      return String(v);
  }
}

export function HalamanData<T extends { id: string }>({
  judul,
  keterangan,
  koleksi,
  fields,
  kolom,
  filter = [],
  akses,
  buatBaru,
  namaTemplate,
  contohTemplate,
  cari,
  sebelumTabel,
  detailTambahan,
  garisKiri,
  kartuMobile,
}: {
  judul: string;
  keterangan?: React.ReactNode;
  koleksi: Koleksi<T>;
  fields: Field[];
  kolom: Kolom<T>[];
  filter?: FilterData<T>[];
  akses: Akses;
  /** Ubah rekaman form/impor yang sudah valid menjadi baris tabel. */
  buatBaru: (r: Rekaman, lama?: T) => T;
  namaTemplate?: string;
  contohTemplate?: Record<string, string | number>[];
  cari?: (baris: T) => string;
  /** Isi tambahan di atas tabel (ringkasan, grafik), menerima data terfilter. */
  sebelumTabel?: (terfilter: T[]) => React.ReactNode;
  detailTambahan?: (baris: T) => React.ReactNode;
  garisKiri?: (baris: T) => string | undefined;
  kartuMobile?: (baris: T) => React.ReactNode;
}) {
  const [nilaiFilter, setNilaiFilter] = React.useState<Record<string, string>>({});
  const [detail, setDetail] = React.useState<T | null>(null);
  const [form, setForm] = React.useState<{ lama?: T } | null>(null);
  const [hapus, setHapus] = React.useState<T | null>(null);
  const [impor, setImpor] = React.useState(false);
  const [kabar, setKabar] = React.useState<string | null>(null);

  const bolehTulis = akses === "penuh";
  const bolehUbah = akses !== "baca";

  const terfilter = React.useMemo(
    () =>
      koleksi.data.filter((b) =>
        filter.every((f) => !nilaiFilter[f.kunci] || f.cocok(b, nilaiFilter[f.kunci])),
      ),
    [koleksi.data, filter, nilaiFilter],
  );

  const umumkan = (pesan: string) => {
    setKabar(pesan);
    window.setTimeout(() => setKabar(null), 3500);
  };

  const kolomLengkap: Kolom<T>[] = bolehUbah
    ? [
        ...kolom,
        {
          kunci: "_aksi",
          judul: "",
          lebar: bolehTulis ? "84px" : "48px",
          sel: (b) => (
            <div className="flex justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setForm({ lama: b })}
                className="flex h-7 w-7 items-center justify-center rounded-input text-ink-muted hover:bg-panel-sunken hover:text-ink"
                aria-label="Ubah data"
                title="Ubah"
              >
                <Pencil size={14} strokeWidth={1.5} />
              </button>
              {bolehTulis ? (
                <button
                  onClick={() => setHapus(b)}
                  className="flex h-7 w-7 items-center justify-center rounded-input text-ink-muted hover:bg-expired-bg hover:text-expired"
                  aria-label="Hapus data"
                  title="Hapus"
                >
                  <Trash2 size={14} strokeWidth={1.5} />
                </button>
              ) : null}
            </div>
          ),
        },
      ]
    : kolom;

  return (
    <div className="space-y-4">
      <PageHeader
        judul={judul}
        keterangan={keterangan}
        aksi={
          bolehTulis ? (
            <>
              {namaTemplate ? (
                <Tombol
                  ukuran="sm"
                  onClick={() => unduhTemplateSkema(namaTemplate, fields, contohTemplate ?? [])}
                >
                  <Download size={14} strokeWidth={1.75} />
                  Template
                </Tombol>
              ) : null}
              <Tombol ukuran="sm" onClick={() => setForm({})}>
                <Plus size={14} strokeWidth={1.75} />
                Tambah manual
              </Tombol>
              {namaTemplate ? (
                <Tombol varian="utama" ukuran="sm" onClick={() => setImpor(true)}>
                  <Upload size={14} strokeWidth={1.75} />
                  Unggah Excel
                </Tombol>
              ) : null}
            </>
          ) : akses === "baca" ? (
            <span className="t-caption rounded-input bg-panel-sunken px-2 py-1 text-ink-muted">
              Hanya lihat
            </span>
          ) : null
        }
      />

      {kabar ? (
        <div role="status" className="anim-rise rounded-panel border border-fresh/30 bg-fresh-bg px-3 py-2 text-[13px] text-fresh">
          {kabar}
        </div>
      ) : null}

      {sebelumTabel?.(terfilter)}

      <DataTable
        data={terfilter}
        kolom={kolomLengkap}
        kunciBaris={(b) => b.id}
        cari={cari}
        filter={filter.map(({ kunci, label, opsi }) => ({ kunci, label, opsi }))}
        nilaiFilter={nilaiFilter}
        onUbahFilter={(k, v) => setNilaiFilter((f) => ({ ...f, [k]: v }))}
        onKlikBaris={setDetail}
        barisTerpilih={(b) => b.id === detail?.id}
        garisKiri={garisKiri}
        kartuMobile={kartuMobile}
        aksiKanan={
          bolehTulis ? (
            <button
              onClick={() => {
                koleksi.pulihkan();
                umumkan("Data dikembalikan ke data contoh awal.");
              }}
              className="hidden h-7 items-center gap-1 rounded-input px-1.5 text-[12px] text-ink-faint hover:text-ink-muted sm:inline-flex"
              title="Kembalikan ke data contoh"
            >
              <RotateCcw size={12} strokeWidth={1.5} />
              Reset demo
            </button>
          ) : undefined
        }
      />

      {/* ---------------- Detail ---------------- */}
      {detail ? (
        <Laci judul="Detail data" onTutup={() => setDetail(null)}>
          <dl className="divide-y divide-line text-[13px]">
            {fields.map((f) => (
              <div key={f.kunci} className="flex justify-between gap-4 py-2">
                <dt className="text-ink-muted">{f.label}</dt>
                <dd className="text-right text-ink">
                  {tampilNilai(f, (detail as unknown as Rekaman)[f.kunci])}
                </dd>
              </div>
            ))}
          </dl>
          {detailTambahan?.(detail)}
          {bolehUbah ? (
            <div className="mt-4 flex gap-2">
              <Tombol ukuran="sm" onClick={() => setForm({ lama: detail })}>
                <Pencil size={14} strokeWidth={1.75} />
                Ubah
              </Tombol>
              {bolehTulis ? (
                <Tombol varian="bahaya" ukuran="sm" onClick={() => setHapus(detail)}>
                  <Trash2 size={14} strokeWidth={1.75} />
                  Hapus
                </Tombol>
              ) : null}
            </div>
          ) : null}
        </Laci>
      ) : null}

      {/* ---------------- Form tambah / ubah ---------------- */}
      {form ? (
        <FormData
          judul={form.lama ? "Ubah data" : "Tambah data"}
          fields={fields}
          awal={form.lama as unknown as Rekaman | undefined}
          hanya={typeof akses === "object" ? akses.hanya : undefined}
          onTutup={() => setForm(null)}
          onSimpan={(r) => {
            const baris = buatBaru(r, form.lama);
            if (form.lama) {
              koleksi.ubah(baris);
              if (detail?.id === baris.id) setDetail(baris);
              umumkan("Perubahan tersimpan.");
            } else {
              koleksi.tambah([baris]);
              umumkan("Data baru tersimpan.");
            }
            setForm(null);
          }}
        />
      ) : null}

      {/* ---------------- Konfirmasi hapus ---------------- */}
      {hapus ? (
        <Modal judul="Hapus data ini?" onTutup={() => setHapus(null)}>
          <p className="t-small text-ink-muted">
            Data yang dihapus langsung hilang dari laporan dan perhitungan cost control.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Tombol ukuran="sm" onClick={() => setHapus(null)}>
              Batal
            </Tombol>
            <Tombol
              varian="bahaya"
              ukuran="sm"
              onClick={() => {
                koleksi.hapus(hapus.id);
                if (detail?.id === hapus.id) setDetail(null);
                setHapus(null);
                umumkan("Data dihapus.");
              }}
            >
              <Trash2 size={14} strokeWidth={1.75} />
              Hapus
            </Tombol>
          </div>
        </Modal>
      ) : null}

      {impor && namaTemplate ? (
        <ImporTabel
          judul={`Unggah ${judul.toLowerCase()}`}
          fields={fields}
          namaTemplate={namaTemplate}
          contoh={contohTemplate ?? []}
          tampil={tampilNilai}
          onTutup={() => setImpor(false)}
          onSimpan={(daftar) => {
            koleksi.tambah(daftar.map((r) => buatBaru(r)));
            umumkan(`${daftar.length} baris dari Excel tersimpan.`);
          }}
        />
      ) : null}
    </div>
  );
}

function FormData({
  judul,
  fields,
  awal,
  hanya,
  onTutup,
  onSimpan,
}: {
  judul: string;
  fields: Field[];
  awal?: Rekaman;
  hanya?: string[];
  onTutup: () => void;
  onSimpan: (r: Rekaman) => void;
}) {
  const [isi, setIsi] = React.useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.kunci, awal?.[f.kunci] !== undefined ? String(awal[f.kunci]) : ""])),
  );
  const [galat, setGalat] = React.useState<string[]>([]);

  const kirim = (e: React.FormEvent) => {
    e.preventDefault();
    const h = validasiRekaman(fields, isi);
    if (!h.ok) {
      setGalat(h.galat);
      return;
    }
    onSimpan(h.rekaman);
  };

  return (
    <Modal judul={judul} onTutup={onTutup}>
      <form onSubmit={kirim} className="space-y-3" noValidate>
        {fields.map((f) => {
          const terkunci = hanya ? !hanya.includes(f.kunci) : false;
          const id = `f-${f.kunci}`;
          return (
            <div key={f.kunci}>
              <Label htmlFor={id} wajib={f.wajib && !terkunci} bantuan={f.bantuan}>
                {f.label}
                {f.satuan && f.tipe === "angka" ? ` (${f.satuan})` : ""}
              </Label>
              {f.tipe === "pilihan" ? (
                <Pilihan
                  id={id}
                  value={isi[f.kunci]}
                  disabled={terkunci}
                  onChange={(e) => setIsi((s) => ({ ...s, [f.kunci]: e.target.value }))}
                  className="h-10 w-full disabled:opacity-60"
                >
                  <option value="">Pilih…</option>
                  {f.opsi?.map((o) => (
                    <option key={o.nilai} value={o.nilai}>
                      {o.label}
                    </option>
                  ))}
                </Pilihan>
              ) : (
                <Isian
                  id={id}
                  value={isi[f.kunci]}
                  disabled={terkunci}
                  onChange={(e) => setIsi((s) => ({ ...s, [f.kunci]: e.target.value }))}
                  type={f.tipe === "tanggal" ? "date" : f.tipe === "bulan" ? "month" : f.tipe === "angka" ? "number" : "text"}
                  inputMode={f.tipe === "angka" ? "decimal" : undefined}
                  min={f.tipe === "angka" ? (f.min ?? 0) : undefined}
                  className="disabled:opacity-60"
                />
              )}
            </div>
          );
        })}

        {galat.length ? (
          <ul role="alert" className="rounded-panel border border-expired/30 bg-expired-bg px-3 py-2 text-[13px] text-expired">
            {galat.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        ) : null}

        <div className="flex justify-end gap-2 pt-1">
          <Tombol type="button" ukuran="sm" onClick={onTutup}>
            Batal
          </Tombol>
          <Tombol type="submit" varian="utama" ukuran="sm">
            Simpan
          </Tombol>
        </div>
      </form>
    </Modal>
  );
}

export function Modal({
  judul,
  onTutup,
  children,
}: {
  judul: string;
  onTutup: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/25 sm:items-center sm:p-5">
      <div className="fixed inset-0" onClick={onTutup} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={judul}
        className="anim-rise relative max-h-[92dvh] w-full max-w-md overflow-auto rounded-t-modal border border-line bg-panel shadow-[var(--shadow-modal)] sm:rounded-modal"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="t-h2 text-ink">{judul}</h2>
          <button
            onClick={onTutup}
            className="flex h-8 w-8 items-center justify-center rounded-input text-ink-muted hover:bg-panel-sunken"
            aria-label="Tutup"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>
        <div className="px-4 py-4">{children}</div>
      </div>
    </div>
  );
}

export function Laci({
  judul,
  onTutup,
  children,
}: {
  judul: string;
  onTutup: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/20">
      <div className="fixed inset-0" onClick={onTutup} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={judul}
        className="anim-rise relative h-full w-full max-w-md overflow-auto border-l border-line bg-panel shadow-[var(--shadow-modal)]"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-line bg-panel px-4 py-3">
          <h2 className="t-h2 text-ink">{judul}</h2>
          <button
            onClick={onTutup}
            className="flex h-8 w-8 items-center justify-center rounded-input text-ink-muted hover:bg-panel-sunken"
            aria-label="Tutup"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>
        <div className="px-4 py-4">{children}</div>
      </aside>
    </div>
  );
}
