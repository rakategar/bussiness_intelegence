"use client";

import * as React from "react";
import { Info } from "lucide-react";

import { ChartFrame, TabelSetara } from "@/components/charts/chart-frame";
import { GrafikProyeksi } from "@/components/charts";
import { PanelAi } from "@/components/panels/panel-ai";
import { DataTable, type Kolom } from "@/components/ui/data-table";
import {
  EmptyState,
  PageHeader,
  Panel,
  PanelHeader,
  Rupiah,
  Tabs,
  Tombol,
} from "@/components/ui/primitives";
import { hitungBaseline, seriProyeksi } from "@/lib/forecast";
import { profitabilitas, rentangMingguKe } from "@/lib/data/queries";
import { gayaMargin } from "@/lib/status";
import {
  formatAngka,
  formatPersen,
  formatQty,
  formatRentang,
  formatRupiah,
} from "@/lib/format";
import type { KebutuhanBahan } from "@/lib/types";
import { cn } from "@/lib/utils";

type TabPeringkat = "terlaris" | "sepi" | "untung-besar" | "untung-tipis";

export default function HalamanProyeksi() {
  const [horizon, setHorizon] = React.useState<"next_week" | "next_month">(
    "next_week",
  );
  const [tab, setTab] = React.useState<TabPeringkat>("terlaris");

  const base = React.useMemo(() => hitungBaseline(horizon), [horizon]);
  const seri = React.useMemo(() => seriProyeksi(8), []);
  const prof = React.useMemo(
    () => profitabilitas(rentangMingguKe(0)).filter((p) => p.punyaResep),
    [],
  );

  const cukupData = base.jumlahPeriodeTersedia >= 4;

  const peringkat = React.useMemo(() => {
    const laku = [...prof].filter((p) => p.qtyTerjual > 0);
    switch (tab) {
      case "sepi":
        return [...laku].sort((a, b) => a.qtyTerjual - b.qtyTerjual).slice(0, 12);
      case "untung-besar":
        return [...laku]
          .sort((a, b) => b.totalKontribusi - a.totalKontribusi)
          .slice(0, 12);
      case "untung-tipis":
        return [...laku]
          .sort((a, b) => a.marginPersen - b.marginPersen)
          .slice(0, 12);
      default:
        return [...laku].sort((a, b) => b.qtyTerjual - a.qtyTerjual).slice(0, 12);
    }
  }, [prof, tab]);

  const kolomKebutuhan: Kolom<KebutuhanBahan>[] = [
    {
      kunci: "nama",
      judul: "Bahan",
      sel: (k) => <span className="font-medium text-ink">{k.bahan.nama}</span>,
      urut: (k) => k.bahan.nama,
    },
    {
      kunci: "prediksi",
      judul: "Prediksi pakai",
      angka: true,
      sel: (k) => formatQty(Math.round(k.prediksiPakai), k.bahan.satuan),
      urut: (k) => k.prediksiPakai,
    },
    {
      kunci: "sisa",
      judul: "Sisa stok",
      angka: true,
      sel: (k) => formatQty(Math.round(k.sisaStok), k.bahan.satuan),
      urut: (k) => k.sisaStok,
    },
    {
      kunci: "pesan",
      judul: "Perlu pesan",
      angka: true,
      sel: (k) =>
        k.perluPesan <= 0 ? (
          <span className="text-ink-faint">—</span>
        ) : (
          <span
            className={cn(
              "font-medium",
              k.berisikoTerbuang ? "text-critical" : "text-ink",
            )}
          >
            {formatQty(Math.round(k.perluPesan), k.bahan.satuan)}
          </span>
        ),
      urut: (k) => k.perluPesan,
    },
    {
      kunci: "batas",
      judul: "Batas exp",
      angka: true,
      sel: (k) =>
        k.perluPesan <= 0 ? (
          <span className="text-ink-faint">—</span>
        ) : (
          <span className={k.berisikoTerbuang ? "text-critical" : "text-ink-muted"}>
            maks {formatQty(Math.round(k.batasExp), k.bahan.satuan)}
          </span>
        ),
      urut: (k) => k.batasExp,
    },
  ];

  if (!cukupData) {
    return (
      <div className="space-y-4">
        <PageHeader judul="Proyeksi" />
        <Panel>
          <EmptyState
            judul="Forecast butuh minimal 4 minggu data"
            penjelasan={`Sekarang baru ada ${base.jumlahPeriodeTersedia} minggu. Unggah rekap penjualan mingguan supaya sistem bisa menghitung tren dan indeks musiman.`}
            aksi={
              <div className="w-64">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-panel-sunken">
                  <div
                    className="h-full rounded-full bg-brand transition-[width] duration-500"
                    style={{
                      width: `${(base.jumlahPeriodeTersedia / 4) * 100}%`,
                    }}
                  />
                </div>
                <p className="t-caption mt-1.5 text-ink-muted">
                  {base.jumlahPeriodeTersedia} dari 4 minggu
                </p>
              </div>
            }
          />
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Proyeksi"
        keterangan={`Periode target: ${formatRentang(base.periodeTarget.mulai, base.periodeTarget.selesai)}. Semua angka dari perhitungan sistem, bukan dari AI.`}
        aksi={
          <Tabs
            nilai={horizon}
            onUbah={setHorizon}
            daftar={[
              { nilai: "next_week" as const, label: "Minggu depan" },
              { nilai: "next_month" as const, label: "Bulan depan" },
            ]}
          />
        }
      />

      {/* Transparansi akurasi */}
      <div className="flex flex-wrap items-center gap-2 rounded-panel border border-line bg-panel px-3 py-2.5">
        <Info size={15} strokeWidth={1.5} className="shrink-0 text-ink-faint" />
        <p className="t-small text-ink-muted">
          Akurasi prediksi terakhir:{" "}
          <span className="num font-medium text-ink">
            MAPE {formatPersen(base.mape)}
          </span>
          {base.mape < 25
            ? " — masih di dalam target < 25%."
            : " — di atas target 25%, perlakukan angka di bawah dengan hati-hati."}
        </p>
      </div>

      <ChartFrame
        judul="Prediksi penjualan"
        keterangan="Garis putus-putus adalah prediksi; area pucat adalah interval kepercayaan 95%."
        legenda={[
          { label: "Aktual", warna: "var(--viz-1)" },
          { label: "Prediksi", warna: "var(--viz-2)", putus: true },
        ]}
        tinggi={280}
        tabel={
          <TabelSetara
            kepala={["Minggu", "Aktual", "Prediksi", "Batas bawah", "Batas atas"]}
            baris={seri.map((s) => [
              s.label,
              s.aktual === null ? "—" : formatAngka(s.aktual),
              s.prediksi === null ? "—" : formatAngka(s.prediksi),
              s.bawah === null ? "—" : formatAngka(s.bawah),
              s.atas === null ? "—" : formatAngka(s.atas),
            ])}
          />
        }
      >
        <GrafikProyeksi data={seri} />
      </ChartFrame>

      {/* Kebutuhan bahan */}
      <div>
        <DataTable
          data={base.kebutuhan}
          kolom={kolomKebutuhan}
          kunciBaris={(k) => k.bahan.id}
          cari={(k) => k.bahan.nama}
          garisKiri={(k) =>
            k.berisikoTerbuang ? "var(--critical)" : undefined
          }
          aksiKanan={
            <span className="t-caption text-ink-faint">
              {base.kebutuhan.filter((k) => k.berisikoTerbuang).length} berisiko
              terbuang
            </span>
          }
          kartuMobile={(k) => (
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-ink">{k.bahan.nama}</span>
                {k.perluPesan > 0 ? (
                  <span
                    className={cn(
                      "num text-[13px]",
                      k.berisikoTerbuang ? "text-critical" : "text-ink",
                    )}
                  >
                    pesan {formatQty(Math.round(k.perluPesan), k.bahan.satuan)}
                  </span>
                ) : (
                  <span className="t-caption text-fresh">stok cukup</span>
                )}
              </div>
              <p className="t-small mt-1 text-ink-muted">
                Prediksi pakai{" "}
                {formatQty(Math.round(k.prediksiPakai), k.bahan.satuan)} · sisa{" "}
                {formatQty(Math.round(k.sisaStok), k.bahan.satuan)}
              </p>
              {k.berisikoTerbuang ? (
                <p className="t-caption mt-0.5 text-critical">
                  Melebihi batas exp (maks{" "}
                  {formatQty(Math.round(k.batasExp), k.bahan.satuan)}).
                </p>
              ) : null}
            </div>
          )}
        />
        <p className="t-caption prose-width mt-2 text-ink-muted">
          Kolom &ldquo;Batas exp&rdquo; adalah jumlah maksimal yang masih habis
          sebelum kadaluarsa. Memesan melebihi angka itu berisiko terbuang, dan
          barisnya ditandai garis merah di sebelah kiri.
        </p>
      </div>

      {/* Peringkat menu */}
      <Panel>
        <PanelHeader
          judul="Peringkat menu"
          keterangan="Berdasarkan realisasi minggu berjalan."
          aksi={
            <Tabs
              nilai={tab}
              onUbah={setTab}
              daftar={[
                { nilai: "terlaris" as const, label: "Terlaris" },
                { nilai: "sepi" as const, label: "Paling sepi" },
                { nilai: "untung-besar" as const, label: "Untung terbesar" },
                { nilai: "untung-tipis" as const, label: "Untung terkecil" },
              ]}
            />
          }
        />
        <div className="scroll-thin overflow-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                {["Menu", "Qty", "Margin %", "Kontribusi", "Prediksi"].map(
                  (h, i) => (
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
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {peringkat.map((p) => {
                const pred = base.prediksi.find((x) => x.menuId === p.menu.id);
                return (
                  <tr
                    key={p.menu.id}
                    className="border-b border-line last:border-0 hover:bg-panel-sunken/70"
                  >
                    <td className="h-10 px-3 text-ink">{p.menu.nama}</td>
                    <td className="num h-10 px-3 text-right text-ink">
                      {formatAngka(p.qtyTerjual)}
                    </td>
                    <td
                      className={cn(
                        "num h-10 px-3 text-right font-medium",
                        gayaMargin(p.marginPersen),
                      )}
                    >
                      {formatPersen(p.marginPersen)}
                    </td>
                    <td className="h-10 px-3 text-right text-ink">
                      <Rupiah nilai={p.totalKontribusi} />
                    </td>
                    <td className="num h-10 px-3 text-right text-ink-muted">
                      {pred ? (
                        <>
                          {formatAngka(pred.prediksi)}
                          <span className="ml-1 text-[11px] text-ink-faint">
                            {pred.tren === "naik"
                              ? "↑"
                              : pred.tren === "turun"
                                ? "↓"
                                : "→"}
                          </span>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {base.menuTanpaResep.length > 0 ? (
        <p className="t-small rounded-panel bg-watch-bg px-3 py-2.5 text-watch">
          {base.menuTanpaResep.length} menu dilewati dari prediksi kebutuhan
          bahan karena resepnya belum diisi:{" "}
          {base.menuTanpaResep.slice(0, 5).join(", ")}
          {base.menuTanpaResep.length > 5 ? ", dan lainnya" : ""}. Konsumsi
          bahannya tidak terhitung.
        </p>
      ) : null}

      <PanelAi horizon={horizon} />
    </div>
  );
}
