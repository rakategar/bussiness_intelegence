"use client";

import * as React from "react";

import { HalamanData, type Akses, type FilterData } from "./halaman-data";
import type { Kolom } from "@/components/ui/data-table";
import { KpiCard } from "@/components/ui/kpi-card";
import { Panel, PanelHeader, Pil, Pilihan, Rupiah } from "@/components/ui/primitives";
import { ChartFrame } from "@/components/charts/chart-frame";
import { GrafikBatangHorizontal } from "@/components/charts";
import { GrafikBatangKelompok } from "@/components/charts/operasional";
import { bahan } from "@/lib/data/seed";
import { bahanPerId } from "@/lib/data/queries";
import {
  PERIODE_OPERASIONAL,
  analisisPenggunaan,
  cabang,
  cabangPerId,
  idBaru,
  labelPeriode,
  periodeDari,
  useKoleksi,
} from "@/lib/data/operasional";
import {
  LABEL_KATEGORI_ANGGARAN,
  LABEL_STATUS_PENGIRIMAN,
} from "@/lib/status";
import {
  formatAngka,
  formatAngkaLuwes,
  formatPersen,
  formatRupiah,
  formatRupiahRingkas,
  formatTanggal,
  keIsoTanggal,
} from "@/lib/format";
import { HARI_INI } from "@/lib/data/seed";
import type { Field } from "@/lib/import/skema";
import type {
  Anggaran,
  KategoriAnggaran,
  Pengeluaran,
  PenggunaanBahan,
  Pengiriman,
  StatusPengiriman,
} from "@/lib/types";
import { cn, jumlah } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Opsi & filter bersama
// ---------------------------------------------------------------------------

const OPSI_CABANG = cabang.map((c) => ({ nilai: c.id, label: c.nama }));
const OPSI_BULAN = [...PERIODE_OPERASIONAL].reverse().map((p) => ({
  nilai: p,
  label: labelPeriode(p),
}));
const OPSI_BAHAN_NAMA = bahan.map((b) => ({ nilai: b.nama, label: b.nama }));
const OPSI_BAHAN_ID = bahan.map((b) => ({ nilai: b.id, label: b.nama }));

const namaCabang = (id: string) => cabangPerId.get(id)?.nama ?? id;

function filterCabang<T extends { cabangId: string }>(): FilterData<T> {
  return {
    kunci: "cabang",
    label: "Semua cabang",
    opsi: OPSI_CABANG,
    cocok: (b, v) => b.cabangId === v,
  };
}

function filterBulan<T>(ambil: (b: T) => string): FilterData<T> {
  return {
    kunci: "bulan",
    label: "Semua bulan",
    opsi: OPSI_BULAN,
    cocok: (b, v) => ambil(b) === v,
  };
}

const kolomCabang = <T extends { cabangId: string }>(): Kolom<T> => ({
  kunci: "cabang",
  judul: "Cabang",
  sel: (b) => namaCabang(b.cabangId),
  urut: (b) => namaCabang(b.cabangId),
});

const s = (v: unknown) => (v === undefined ? undefined : String(v));

// ---------------------------------------------------------------------------
// Fitur 3 & 10 — Perencanaan anggaran
// ---------------------------------------------------------------------------

const FIELD_ANGGARAN: Field[] = [
  { kunci: "periode", label: "Periode", tipe: "bulan", wajib: true },
  { kunci: "cabangId", label: "Cabang", tipe: "pilihan", wajib: true, opsi: OPSI_CABANG },
  {
    kunci: "kategori",
    label: "Kategori",
    tipe: "pilihan",
    wajib: true,
    opsi: Object.entries(LABEL_KATEGORI_ANGGARAN).map(([nilai, label]) => ({ nilai, label })),
  },
  { kunci: "nominal", label: "Nominal", tipe: "angka", wajib: true, satuan: "Rp", min: 1, maks: 10_000_000_000 },
  { kunci: "catatan", label: "Catatan", tipe: "teks" },
];

export function ModulAnggaran({ akses }: { akses: Akses }) {
  const koleksi = useKoleksi("anggaran");
  const kolom: Kolom<Anggaran>[] = [
    { kunci: "periode", judul: "Periode", sel: (a) => labelPeriode(a.periode), urut: (a) => a.periode },
    kolomCabang(),
    {
      kunci: "kategori",
      judul: "Kategori",
      sel: (a) => (
        <Pil warna={a.kategori === "bahan" ? "bg-brand-soft text-brand" : "bg-watch-bg text-watch"}>
          {LABEL_KATEGORI_ANGGARAN[a.kategori]}
        </Pil>
      ),
      urut: (a) => a.kategori,
    },
    { kunci: "nominal", judul: "Batas anggaran", angka: true, sel: (a) => <Rupiah nilai={a.nominal} />, urut: (a) => a.nominal },
    { kunci: "catatan", judul: "Catatan", sekunder: true, sel: (a) => <span className="text-ink-muted">{a.catatan ?? "—"}</span> },
  ];

  return (
    <HalamanData
      judul="Perencanaan anggaran"
      keterangan="Batas anggaran bahan baku dan logistik per bulan dan cabang — pembanding realisasi di cost control."
      koleksi={koleksi}
      fields={FIELD_ANGGARAN}
      kolom={kolom}
      akses={akses}
      filter={[filterBulan<Anggaran>((a) => a.periode), filterCabang<Anggaran>()]}
      namaTemplate="template-anggaran.xlsx"
      contohTemplate={[
        { periode: "2026-10", cabangId: "Dago (Pusat)", kategori: "Bahan baku", nominal: 46000000, catatan: "" },
        { periode: "2026-10", cabangId: "Dago (Pusat)", kategori: "Logistik", nominal: 2400000, catatan: "" },
      ]}
      cari={(a) => `${labelPeriode(a.periode)} ${namaCabang(a.cabangId)} ${a.catatan ?? ""}`}
      buatBaru={(r, lama) => ({
        id: lama?.id ?? idBaru("ang"),
        periode: String(r.periode),
        cabangId: String(r.cabangId),
        kategori: r.kategori as KategoriAnggaran,
        nominal: Number(r.nominal),
        catatan: s(r.catatan),
      })}
      sebelumTabel={(data) => (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <KpiCard
            label="Anggaran bahan baku"
            nilai={jumlah(data.filter((a) => a.kategori === "bahan").map((a) => a.nominal))}
            format={formatRupiahRingkas}
            pembanding="Total sesuai filter"
          />
          <KpiCard
            label="Anggaran logistik"
            nilai={jumlah(data.filter((a) => a.kategori === "logistik").map((a) => a.nominal))}
            format={formatRupiahRingkas}
            pembanding="Total sesuai filter"
          />
          <KpiCard label="Baris anggaran" nilai={data.length} format={(n) => formatAngka(n)} pembanding={`${cabang.length} cabang`} />
        </div>
      )}
    />
  );
}

// ---------------------------------------------------------------------------
// Fitur 4 & 11 — Pengeluaran bahan baku per cabang
// ---------------------------------------------------------------------------

const FIELD_PENGELUARAN: Field[] = [
  { kunci: "tanggal", label: "Tanggal", tipe: "tanggal", wajib: true },
  { kunci: "cabangId", label: "Cabang", tipe: "pilihan", wajib: true, opsi: OPSI_CABANG },
  { kunci: "bahan", label: "Bahan", tipe: "pilihan", wajib: true, opsi: OPSI_BAHAN_NAMA },
  { kunci: "qty", label: "Jumlah", tipe: "angka", wajib: true, min: 0.01 },
  { kunci: "satuan", label: "Satuan", tipe: "teks", wajib: true },
  { kunci: "nominal", label: "Nominal", tipe: "angka", wajib: true, satuan: "Rp", min: 1, maks: 10_000_000_000 },
  { kunci: "catatan", label: "Catatan", tipe: "teks" },
];

export function ModulPengeluaran({ akses }: { akses: Akses }) {
  const koleksi = useKoleksi("pengeluaran");
  const kolom: Kolom<Pengeluaran>[] = [
    { kunci: "tanggal", judul: "Tanggal", sel: (p) => <span className="text-ink-muted">{formatTanggal(p.tanggal)}</span>, urut: (p) => p.tanggal },
    kolomCabang(),
    { kunci: "bahan", judul: "Bahan", sel: (p) => <span className="font-medium">{p.bahan}</span>, urut: (p) => p.bahan },
    { kunci: "qty", judul: "Jumlah", angka: true, sekunder: true, sel: (p) => `${formatAngkaLuwes(p.qty)} ${p.satuan}`, urut: (p) => p.qty },
    { kunci: "nominal", judul: "Nominal", angka: true, sel: (p) => <Rupiah nilai={p.nominal} />, urut: (p) => p.nominal },
  ];

  return (
    <HalamanData
      judul="Pengeluaran bahan baku"
      keterangan="Belanja bahan baku tiap cabang. Pilih satu baris untuk melihat detailnya."
      koleksi={koleksi}
      fields={FIELD_PENGELUARAN}
      kolom={kolom}
      akses={akses}
      filter={[filterCabang<Pengeluaran>(), filterBulan<Pengeluaran>((p) => periodeDari(p.tanggal))]}
      namaTemplate="template-pengeluaran.xlsx"
      contohTemplate={[
        { tanggal: "2026-09-02", cabangId: "Kemang", bahan: "UHT", qty: 24000, satuan: "g", nominal: 514000, catatan: "" },
      ]}
      cari={(p) => `${p.bahan} ${namaCabang(p.cabangId)} ${p.catatan ?? ""}`}
      buatBaru={(r, lama) => ({
        id: lama?.id ?? idBaru("exp"),
        tanggal: String(r.tanggal),
        cabangId: String(r.cabangId),
        bahan: String(r.bahan),
        qty: Number(r.qty),
        satuan: String(r.satuan),
        nominal: Number(r.nominal),
        catatan: s(r.catatan),
      })}
      kartuMobile={(p) => (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="t-body-strong truncate text-ink">{p.bahan}</p>
            <p className="t-caption text-ink-muted">
              {formatTanggal(p.tanggal)} · {namaCabang(p.cabangId)}
            </p>
          </div>
          <Rupiah nilai={p.nominal} />
        </div>
      )}
      sebelumTabel={(data) => {
        const perCabang = cabang.map((c) => ({
          label: c.nama,
          nilai: jumlah(data.filter((p) => p.cabangId === c.id).map((p) => p.nominal)),
        }));
        return (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <KpiCard
              label="Total pengeluaran"
              nilai={jumlah(data.map((p) => p.nominal))}
              format={formatRupiahRingkas}
              pembanding={`${formatAngka(data.length)} transaksi sesuai filter`}
            />
            <ChartFrame judul="Pengeluaran per cabang" tinggi={110} className="lg:col-span-2">
              <GrafikBatangHorizontal data={perCabang} formatNilai={formatRupiah} lebarLabel={110} />
            </ChartFrame>
          </div>
        );
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Fitur 5 & 12 — Penggunaan bahan baku
// ---------------------------------------------------------------------------

const FIELD_PENGGUNAAN: Field[] = [
  { kunci: "periode", label: "Periode", tipe: "bulan", wajib: true },
  { kunci: "cabangId", label: "Cabang", tipe: "pilihan", wajib: true, opsi: OPSI_CABANG },
  { kunci: "ingredientId", label: "Bahan", tipe: "pilihan", wajib: true, opsi: OPSI_BAHAN_ID },
  { kunci: "qty", label: "Jumlah pemakaian", tipe: "angka", wajib: true, min: 0 },
];

const GAYA_ANALISIS = {
  boros: { label: "Boros", warna: "bg-critical-bg text-critical" },
  hemat: { label: "Di bawah standar", warna: "bg-watch-bg text-watch" },
  sesuai: { label: "Sesuai SOP", warna: "bg-fresh-bg text-fresh" },
} as const;

export function ModulPenggunaan({ akses }: { akses: Akses }) {
  const koleksi = useKoleksi("penggunaan");
  const { data: pengeluaran } = useKoleksi("pengeluaran");
  const [periode, setPeriode] = React.useState("2026-08");
  const [cab, setCab] = React.useState("");

  const analisis = React.useMemo(
    () =>
      analisisPenggunaan(koleksi.data, pengeluaran, periode, cab || undefined).sort(
        (a, b) => b.selisihPersen - a.selisihPersen,
      ),
    [koleksi.data, pengeluaran, periode, cab],
  );
  const boros = analisis.filter((a) => a.status === "boros");

  const satuanBahan = (id: string) => bahanPerId.get(id)?.satuan ?? "";
  const kolom: Kolom<PenggunaanBahan>[] = [
    { kunci: "periode", judul: "Periode", sel: (u) => labelPeriode(u.periode), urut: (u) => u.periode },
    kolomCabang(),
    {
      kunci: "bahan",
      judul: "Bahan",
      sel: (u) => <span className="font-medium">{bahanPerId.get(u.ingredientId)?.nama ?? u.ingredientId}</span>,
      urut: (u) => bahanPerId.get(u.ingredientId)?.nama ?? "",
    },
    {
      kunci: "qty",
      judul: "Pemakaian",
      angka: true,
      sel: (u) => `${formatAngka(u.qty)} ${satuanBahan(u.ingredientId)}`,
      urut: (u) => u.qty,
    },
  ];

  return (
    <HalamanData
      judul="Penggunaan bahan baku"
      keterangan="Pemakaian bahan per bulan dan cabang, dibandingkan dengan pembelian dan kebutuhan standar dari penjualan × resep."
      koleksi={koleksi}
      fields={FIELD_PENGGUNAAN}
      kolom={kolom}
      akses={akses}
      filter={[
        filterBulan<PenggunaanBahan>((u) => u.periode),
        filterCabang<PenggunaanBahan>(),
      ]}
      namaTemplate="template-penggunaan-bahan.xlsx"
      contohTemplate={[{ periode: "2026-09", cabangId: "Dago (Pusat)", ingredientId: "UHT", qty: 68000 }]}
      cari={(u) => `${bahanPerId.get(u.ingredientId)?.nama ?? ""} ${namaCabang(u.cabangId)}`}
      buatBaru={(r, lama) => ({
        id: lama?.id ?? idBaru("use"),
        periode: String(r.periode),
        cabangId: String(r.cabangId),
        ingredientId: String(r.ingredientId),
        qty: Number(r.qty),
      })}
      detailTambahan={(u) => {
        const a = analisisPenggunaan(koleksi.data, pengeluaran, u.periode, u.cabangId).find(
          (x) => x.ingredientId === u.ingredientId,
        );
        if (!a) return null;
        return (
          <div className="mt-4 rounded-panel border border-line p-3 text-[13px]">
            <p className="t-caption mb-2 font-medium text-ink">Analisis bahan ini</p>
            <div className="flex justify-between py-0.5"><span className="text-ink-muted">Standar resep</span><span className="num">{formatAngka(a.standar)} {a.satuan}</span></div>
            <div className="flex justify-between py-0.5"><span className="text-ink-muted">Dibeli</span><span className="num">{formatAngka(a.pembelian)} {a.satuan}</span></div>
            <div className="flex justify-between py-0.5"><span className="text-ink-muted">Selisih vs standar</span><span className="num">{formatPersen(a.selisihPersen)}</span></div>
            <div className="mt-2"><Pil warna={GAYA_ANALISIS[a.status].warna}>{GAYA_ANALISIS[a.status].label}</Pil></div>
          </div>
        );
      }}
      sebelumTabel={() => (
        <Panel>
          <PanelHeader
            judul="Analisis per bahan"
            keterangan={`${boros.length} bahan dipakai lebih dari 8% di atas standar resep — indikasi pemborosan atau SOP tidak dijalankan.`}
            aksi={
              <div className="flex gap-2">
                <Pilihan value={periode} onChange={(e) => setPeriode(e.target.value)} aria-label="Periode analisis">
                  {OPSI_BULAN.map((o) => <option key={o.nilai} value={o.nilai}>{o.label}</option>)}
                </Pilihan>
                <Pilihan value={cab} onChange={(e) => setCab(e.target.value)} aria-label="Cabang analisis">
                  <option value="">Semua cabang</option>
                  {OPSI_CABANG.map((o) => <option key={o.nilai} value={o.nilai}>{o.label}</option>)}
                </Pilihan>
              </div>
            }
          />
          <div className="scroll-thin max-h-72 overflow-auto">
            <table className="w-full text-[13px]">
              <thead className="sticky top-0 bg-panel-sunken text-[12px] text-ink-muted">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Bahan</th>
                  <th className="px-3 py-2 text-right font-medium">Pemakaian</th>
                  <th className="hidden px-3 py-2 text-right font-medium sm:table-cell">Standar resep</th>
                  <th className="hidden px-3 py-2 text-right font-medium md:table-cell">Pembelian</th>
                  <th className="px-3 py-2 text-right font-medium">Selisih</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {analisis.map((a) => (
                  <tr key={a.ingredientId} className="border-t border-line">
                    <td className="px-3 py-1.5 font-medium text-ink">{a.nama}</td>
                    <td className="num px-3 py-1.5 text-right">{formatAngka(a.pemakaian)} {a.satuan}</td>
                    <td className="num hidden px-3 py-1.5 text-right text-ink-muted sm:table-cell">{formatAngka(a.standar)}</td>
                    <td className="num hidden px-3 py-1.5 text-right text-ink-muted md:table-cell">{a.pembelian ? formatAngka(a.pembelian) : "—"}</td>
                    <td className={cn("num px-3 py-1.5 text-right", a.status === "boros" && "font-medium text-critical")}>
                      {a.selisihPersen > 0 ? "+" : ""}{formatPersen(a.selisihPersen)}
                    </td>
                    <td className="px-3 py-1.5"><Pil warna={GAYA_ANALISIS[a.status].warna}>{GAYA_ANALISIS[a.status].label}</Pil></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    />
  );
}

// ---------------------------------------------------------------------------
// Fitur 13 & 14 — Pengiriman (jadwal, status, biaya)
// ---------------------------------------------------------------------------

export const GAYA_PENGIRIMAN: Record<StatusPengiriman, string> = {
  dijadwalkan: "bg-panel-sunken text-ink-muted",
  dikirim: "bg-watch-bg text-watch",
  diterima: "bg-fresh-bg text-fresh",
};

export function PilStatusKirim({ status }: { status: StatusPengiriman }) {
  return <Pil warna={GAYA_PENGIRIMAN[status]}>{LABEL_STATUS_PENGIRIMAN[status]}</Pil>;
}

const FIELD_PENGIRIMAN: Field[] = [
  { kunci: "kode", label: "Kode", tipe: "teks", wajib: true },
  { kunci: "tanggal", label: "Tanggal kirim", tipe: "tanggal", wajib: true },
  { kunci: "cabangId", label: "Cabang tujuan", tipe: "pilihan", wajib: true, opsi: OPSI_CABANG },
  { kunci: "muatan", label: "Muatan", tipe: "teks", wajib: true },
  { kunci: "kurir", label: "Kurir", tipe: "teks", wajib: true },
  { kunci: "biaya", label: "Biaya", tipe: "angka", wajib: true, satuan: "Rp", min: 0, maks: 100_000_000 },
  {
    kunci: "status",
    label: "Status",
    tipe: "pilihan",
    wajib: true,
    opsi: Object.entries(LABEL_STATUS_PENGIRIMAN).map(([nilai, label]) => ({ nilai, label })),
  },
  { kunci: "catatan", label: "Catatan", tipe: "teks" },
];

export function ModulPengiriman({
  akses,
  judul = "Jadwal pengiriman",
  keterangan = "Jadwal kiriman bahan dari gudang pusat ke cabang, beserta status dan biayanya.",
}: {
  akses: Akses;
  judul?: string;
  keterangan?: string;
}) {
  const koleksi = useKoleksi("pengiriman");
  const hariIni = keIsoTanggal(HARI_INI);
  const kolom: Kolom<Pengiriman>[] = [
    { kunci: "kode", judul: "Kode", sel: (p) => <span className="num text-ink-muted">{p.kode}</span>, urut: (p) => p.kode },
    { kunci: "tanggal", judul: "Tanggal", sel: (p) => formatTanggal(p.tanggal), urut: (p) => p.tanggal },
    kolomCabang(),
    { kunci: "muatan", judul: "Muatan", sekunder: true, sel: (p) => p.muatan },
    { kunci: "status", judul: "Status", sel: (p) => <PilStatusKirim status={p.status} />, urut: (p) => p.status },
    { kunci: "biaya", judul: "Biaya", angka: true, sel: (p) => <Rupiah nilai={p.biaya} />, urut: (p) => p.biaya },
  ];

  return (
    <HalamanData
      judul={judul}
      keterangan={keterangan}
      koleksi={koleksi}
      fields={FIELD_PENGIRIMAN}
      kolom={kolom}
      akses={akses}
      filter={[
        {
          kunci: "status",
          label: "Semua status",
          opsi: Object.entries(LABEL_STATUS_PENGIRIMAN).map(([nilai, label]) => ({ nilai, label })),
          cocok: (p, v) => p.status === v,
        },
        filterCabang<Pengiriman>(),
        filterBulan<Pengiriman>((p) => periodeDari(p.tanggal)),
      ]}
      namaTemplate={akses === "penuh" ? "template-pengiriman.xlsx" : undefined}
      contohTemplate={[
        { kode: "KRM-9001", tanggal: "2026-09-07", cabangId: "Kemang", muatan: "Susu UHT & Oatside", kurir: "Lalamove", biaya: 250000, status: "Dijadwalkan", catatan: "" },
      ]}
      cari={(p) => `${p.kode} ${p.muatan} ${p.kurir} ${namaCabang(p.cabangId)}`}
      garisKiri={(p) => (p.tanggal === hariIni && p.status !== "diterima" ? "var(--watch)" : undefined)}
      buatBaru={(r, lama) => ({
        id: lama?.id ?? idBaru("kirim"),
        kode: String(r.kode),
        tanggal: String(r.tanggal),
        cabangId: String(r.cabangId),
        muatan: String(r.muatan),
        kurir: String(r.kurir),
        biaya: Number(r.biaya),
        status: r.status as StatusPengiriman,
        catatan: s(r.catatan),
      })}
      kartuMobile={(p) => (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="t-body-strong text-ink">{namaCabang(p.cabangId)}</p>
            <p className="t-caption text-ink-muted">{formatTanggal(p.tanggal)} · {p.kode}</p>
          </div>
          <PilStatusKirim status={p.status} />
        </div>
      )}
      sebelumTabel={(data) => {
        const perBulan = PERIODE_OPERASIONAL.map((per) => ({
          label: labelPeriode(per).split(" ")[0].slice(0, 3),
          biaya: jumlah(data.filter((p) => periodeDari(p.tanggal) === per).map((p) => p.biaya)),
        }));
        return (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
            <KpiCard label="Total biaya logistik" nilai={jumlah(data.map((p) => p.biaya))} format={formatRupiahRingkas} pembanding={`${formatAngka(data.length)} pengiriman sesuai filter`} />
            <KpiCard
              label="Rata-rata per pengiriman"
              nilai={data.length ? jumlah(data.map((p) => p.biaya)) / data.length : 0}
              format={formatRupiah}
              pembanding={`${data.filter((p) => p.status !== "diterima").length} belum diterima`}
            />
            <ChartFrame judul="Biaya pengiriman per bulan" tinggi={110} className="lg:col-span-2">
              <GrafikBatangKelompok
                data={perBulan}
                seri={[{ kunci: "biaya", label: "Biaya", warna: "var(--viz-4)" }]}
                formatNilai={formatRupiah}
              />
            </ChartFrame>
          </div>
        );
      }}
    />
  );
}
