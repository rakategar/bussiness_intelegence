"use client";

import * as React from "react";

import { ChartFrame, TabelSetara } from "@/components/charts/chart-frame";
import { GrafikBatang, GrafikBatangHorizontal } from "@/components/charts";
import { DataTable, type Kolom } from "@/components/ui/data-table";
import { KpiCard } from "@/components/ui/kpi-card";
import {
  PageHeader,
  Panel,
  PanelHeader,
  Rupiah,
} from "@/components/ui/primitives";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  konsumsiUntukTabel,
  risikoKadaluarsa,
  totalNilaiRisiko,
  totalNilaiStok,
  wasteMingguan,
} from "@/lib/data/queries";
import {
  LABEL_KATEGORI_BAHAN,
  URUTAN_STATUS,
  GAYA_STATUS,
  LABEL_STATUS,
} from "@/lib/status";
import {
  LABEL_PERIODE,
  URUTAN_PERIODE,
  rentangDari,
  type PilihanPeriode,
} from "@/lib/periode";
import {
  formatAngka,
  formatAngkaLuwes,
  formatQty,
  formatRupiah,
  formatRupiahRingkas,
  formatTanggal,
} from "@/lib/format";
import type { KonsumsiBahan } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function AnalisisBahan() {
  const [periode, setPeriode] = React.useState<PilihanPeriode>("minggu-ini");

  const data = React.useMemo(() => {
    const r = rentangDari(periode);
    const konsumsi = konsumsiUntukTabel(r);
    return {
      konsumsi,
      risiko: risikoKadaluarsa(),
      nilaiRisiko: totalNilaiRisiko(),
      nilaiStok: totalNilaiStok(),
      waste: wasteMingguan(12),
      totalKonsumsi: konsumsi.reduce((t, k) => t + k.nilaiRupiah, 0),
    };
  }, [periode]);

  const top15 = data.konsumsi.slice(0, 15);

  const risikoPerBahan = React.useMemo(() => {
    const peta = new Map<string, { nama: string; nilai: number; batch: number }>();
    for (const r of data.risiko) {
      const x = peta.get(r.bahan.id) ?? {
        nama: r.bahan.nama,
        nilai: 0,
        batch: 0,
      };
      x.nilai += r.nilaiRisiko;
      x.batch += 1;
      peta.set(r.bahan.id, x);
    }
    return [...peta.values()].sort((a, b) => b.nilai - a.nilai);
  }, [data.risiko]);

  const kolom: Kolom<KonsumsiBahan>[] = [
    {
      kunci: "nama",
      judul: "Bahan",
      sel: (k) => <span className="font-medium text-ink">{k.bahan.nama}</span>,
      urut: (k) => k.bahan.nama,
    },
    {
      kunci: "kategori",
      judul: "Kategori",
      sekunder: true,
      sel: (k) => (
        <span className="text-ink-muted">
          {LABEL_KATEGORI_BAHAN[k.bahan.kategori]}
        </span>
      ),
      urut: (k) => k.bahan.kategori,
    },
    {
      kunci: "terpakai",
      judul: "Qty terpakai",
      angka: true,
      sel: (k) => formatQty(Math.round(k.qtyTerpakai), k.bahan.satuan),
      urut: (k) => k.qtyTerpakai,
    },
    {
      kunci: "nilai",
      judul: "Nilai terpakai",
      angka: true,
      sel: (k) => <Rupiah nilai={k.nilaiRupiah} />,
      urut: (k) => k.nilaiRupiah,
    },
    {
      kunci: "sisa",
      judul: "Sisa stok",
      angka: true,
      sel: (k) => formatQty(Math.round(k.sisaStok), k.bahan.satuan),
      urut: (k) => k.sisaStok,
    },
    {
      kunci: "hari",
      judul: "Hari tersisa",
      angka: true,
      sel: (k) =>
        Number.isFinite(k.hariTersisa)
          ? formatAngkaLuwes(k.hariTersisa, 1)
          : "—",
      urut: (k) => (Number.isFinite(k.hariTersisa) ? k.hariTersisa : 9999),
    },
    {
      kunci: "status",
      judul: "Status",
      lebar: "128px",
      sel: (k) => <StatusBadge status={k.status} ringkas />,
      urut: (k) => k.status,
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Analisis bahan"
        keterangan="Bahan mana yang menyerap biaya paling besar, dan mana yang berisiko terbuang."
      />

      <div className="flex flex-wrap items-center gap-1 rounded-input bg-panel-sunken p-1">
        {URUTAN_PERIODE.map((p) => (
          <button
            key={p}
            onClick={() => setPeriode(p)}
            aria-pressed={periode === p}
            className={cn(
              "h-7 rounded-[3px] px-2.5 text-[13px] transition-colors",
              periode === p
                ? "bg-panel font-medium text-ink"
                : "text-ink-muted hover:text-ink",
            )}
          >
            {LABEL_PERIODE[p]}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard
          label="Nilai bahan terpakai"
          nilai={data.totalKonsumsi}
          format={(n) => formatRupiahRingkas(n)}
          pembanding="Periode terpilih"
        />
        <KpiCard
          label="Nilai stok tersisa"
          nilai={data.nilaiStok}
          format={(n) => formatRupiahRingkas(n)}
          pembanding="Semua batch aktif"
        />
        <KpiCard
          label="Nilai berisiko kadaluarsa"
          nilai={data.nilaiRisiko}
          format={(n) => formatRupiahRingkas(n)}
          peringatan={data.nilaiRisiko > 0}
          pembanding={`${data.risiko.length} batch dalam 7 hari`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartFrame
          judul="15 bahan penyerap biaya terbesar"
          keterangan="Nilai rupiah bahan yang terpakai di periode ini"
          tinggi={380}
          tabel={
            <TabelSetara
              kepala={["Bahan", "Nilai terpakai"]}
              baris={top15.map((k) => [k.bahan.nama, formatRupiah(k.nilaiRupiah)])}
            />
          }
        >
          <GrafikBatangHorizontal
            data={top15.map((k) => ({
              label: k.bahan.nama,
              nilai: k.nilaiRupiah,
            }))}
            warna="var(--viz-2)"
          />
        </ChartFrame>

        <div className="space-y-4">
          <Panel>
            <PanelHeader
              judul="Risiko kadaluarsa"
              keterangan={`Total ${formatRupiah(data.nilaiRisiko)} berisiko dalam 7 hari ke depan.`}
            />

            {/* Ringkasan per tingkat urgensi */}
            <div className="flex flex-wrap gap-px bg-line">
              {URUTAN_STATUS.map((s) => {
                const baris = data.risiko.filter((r) => r.status === s);
                if (baris.length === 0) return null;
                return (
                  <div key={s} className="min-w-32 flex-1 bg-panel px-3 py-2.5">
                    <span className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          GAYA_STATUS[s].titik,
                        )}
                      />
                      <span className="t-caption text-ink-muted">
                        {LABEL_STATUS[s]}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "num mt-0.5 block text-[15px] font-semibold",
                        GAYA_STATUS[s].teks,
                      )}
                    >
                      {formatRupiah(
                        baris.reduce((t, r) => t + r.nilaiRisiko, 0),
                      )}
                    </span>
                    <span className="t-caption text-ink-faint">
                      {baris.length} batch
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="scroll-thin max-h-72 overflow-auto border-t border-line">
              <table className="w-full border-collapse text-[13px]">
                <thead className="sticky top-0">
                  <tr>
                    {["Bahan", "Batch", "Nilai berisiko"].map((h, i) => (
                      <th
                        key={h}
                        scope="col"
                        className={cn(
                          "border-b border-line bg-panel-sunken px-3 py-2 text-[12px] font-medium text-ink-muted",
                          i === 0 ? "text-left" : "text-right",
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {risikoPerBahan.map((r) => (
                    <tr
                      key={r.nama}
                      className="border-b border-line last:border-0"
                    >
                      <td className="h-9 px-3 text-ink">{r.nama}</td>
                      <td className="num h-9 px-3 text-right text-ink-muted">
                        {r.batch}
                      </td>
                      <td className="h-9 px-3 text-right text-ink">
                        <Rupiah nilai={r.nilai} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <ChartFrame
            judul="Tren nilai waste"
            keterangan="12 minggu terakhir"
            tinggi={180}
            tabel={
              <TabelSetara
                kepala={["Minggu", "Nilai"]}
                baris={data.waste.map((w) => [
                  w.labelMinggu,
                  formatRupiah(w.nilai),
                ])}
              />
            }
          >
            <GrafikBatang
              data={data.waste.map((w) => ({
                label: w.labelMinggu,
                nilai: w.nilai,
              }))}
              warna="var(--viz-5)"
              namaSeri="Kerugian"
            />
          </ChartFrame>
        </div>
      </div>

      <DataTable
        data={data.konsumsi}
        kolom={kolom}
        kunciBaris={(k) => k.bahan.id}
        cari={(k) => `${k.bahan.nama} ${k.bahan.sku}`}
        kartuMobile={(k) => (
          <div>
            <div className="flex items-start justify-between gap-2">
              <span className="font-medium text-ink">{k.bahan.nama}</span>
              <StatusBadge status={k.status} ringkas />
            </div>
            <p className="t-small mt-1 text-ink-muted">
              Terpakai {formatQty(Math.round(k.qtyTerpakai), k.bahan.satuan)} ·{" "}
              {formatRupiah(k.nilaiRupiah)}
            </p>
            <p className="t-caption mt-0.5 text-ink-faint">
              Sisa {formatQty(Math.round(k.sisaStok), k.bahan.satuan)}
              {Number.isFinite(k.hariTersisa)
                ? ` · ${formatAngkaLuwes(k.hariTersisa, 1)} hari tersisa`
                : ""}
            </p>
          </div>
        )}
      />

      <p className="t-caption text-ink-faint">
        Batch berisiko paling dekat kadaluarsa:{" "}
        {data.risiko[0]
          ? `${data.risiko[0].bahan.nama}, ${formatTanggal(data.risiko[0].batch.tanggalKadaluarsa)} (${formatAngka(data.risiko[0].sisaHari)} hari).`
          : "tidak ada."}
      </p>
    </div>
  );
}
