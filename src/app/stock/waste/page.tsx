"use client";

import * as React from "react";

import { ChartFrame, TabelSetara } from "@/components/charts/chart-frame";
import { GrafikBatang } from "@/components/charts";
import { DataTable, type Kolom } from "@/components/ui/data-table";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageHeader, Rupiah } from "@/components/ui/primitives";
import { bahanPerId, totalWasteBulanIni, wasteMingguan } from "@/lib/data/queries";
import { waste } from "@/lib/data/seed";
import { LABEL_ALASAN_WASTE } from "@/lib/status";
import {
  formatAngka,
  formatQty,
  formatRupiah,
  formatRupiahRingkas,
  formatTanggal,
} from "@/lib/format";
import type { CatatanWaste } from "@/lib/types";

export default function HalamanWaste() {
  const tren = React.useMemo(() => wasteMingguan(12), []);
  const bulanIni = React.useMemo(() => totalWasteBulanIni(), []);
  const totalSemua = React.useMemo(
    () => waste.reduce((t, w) => t + w.nilaiKerugian, 0),
    [],
  );

  const kolom: Kolom<CatatanWaste>[] = [
    {
      kunci: "tanggal",
      judul: "Tanggal",
      sel: (w) => (
        <span className="text-ink-muted">{formatTanggal(w.tanggal)}</span>
      ),
      urut: (w) => w.tanggal,
    },
    {
      kunci: "bahan",
      judul: "Bahan",
      sel: (w) => (
        <span className="font-medium text-ink">
          {bahanPerId.get(w.ingredientId)?.nama ?? "—"}
        </span>
      ),
      urut: (w) => bahanPerId.get(w.ingredientId)?.nama ?? "",
    },
    {
      kunci: "qty",
      judul: "Jumlah",
      angka: true,
      sel: (w) =>
        formatQty(w.qty, bahanPerId.get(w.ingredientId)?.satuan ?? ""),
      urut: (w) => w.qty,
    },
    {
      kunci: "alasan",
      judul: "Alasan",
      sel: (w) => (
        <span className="text-ink-muted">{LABEL_ALASAN_WASTE[w.alasan]}</span>
      ),
      urut: (w) => w.alasan,
    },
    {
      kunci: "nilai",
      judul: "Nilai kerugian",
      angka: true,
      sel: (w) => <Rupiah nilai={w.nilaiKerugian} />,
      urut: (w) => w.nilaiKerugian,
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Waste"
        keterangan="Riwayat bahan terbuang. Nilai kerugian dihitung dari biaya per unit batch yang bersangkutan."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard
          label="Kerugian bulan ini"
          nilai={bulanIni}
          format={(n) => formatRupiahRingkas(n)}
          deltaTerbalik
          pembanding="Dihitung sejak tanggal 1"
        />
        <KpiCard
          label="Total tercatat"
          nilai={totalSemua}
          format={(n) => formatRupiahRingkas(n)}
          pembanding={`${waste.length} catatan`}
        />
        <KpiCard
          label="Rata-rata per minggu"
          nilai={tren.reduce((t, w) => t + w.nilai, 0) / (tren.length || 1)}
          format={(n) => formatRupiahRingkas(n)}
          pembanding="12 minggu terakhir"
        />
      </div>

      <ChartFrame
        judul="Tren nilai waste"
        keterangan="12 minggu terakhir"
        tinggi={240}
        tabel={
          <TabelSetara
            kepala={["Minggu", "Nilai kerugian", "Jumlah catatan"]}
            baris={tren.map((t) => [
              t.labelMinggu,
              formatRupiah(t.nilai),
              formatAngka(t.jumlah),
            ])}
          />
        }
      >
        <GrafikBatang
          data={tren.map((t) => ({ label: t.labelMinggu, nilai: t.nilai }))}
          warna="var(--viz-5)"
          namaSeri="Kerugian"
        />
      </ChartFrame>

      <DataTable
        data={waste}
        kolom={kolom}
        kunciBaris={(w) => w.id}
        cari={(w) => bahanPerId.get(w.ingredientId)?.nama ?? ""}
        kartuMobile={(w) => (
          <div>
            <div className="flex items-start justify-between gap-2">
              <span className="font-medium text-ink">
                {bahanPerId.get(w.ingredientId)?.nama}
              </span>
              <span className="t-caption text-ink-muted">
                {LABEL_ALASAN_WASTE[w.alasan]}
              </span>
            </div>
            <p className="t-small mt-1 text-ink-muted">
              {formatQty(w.qty, bahanPerId.get(w.ingredientId)?.satuan ?? "")} ·{" "}
              {formatRupiah(w.nilaiKerugian)}
            </p>
            <p className="t-caption mt-0.5 text-ink-faint">
              {formatTanggal(w.tanggal)}
            </p>
          </div>
        )}
      />
    </div>
  );
}
