"use client";

import * as React from "react";
import Link from "next/link";
import { Download, RefreshCw } from "lucide-react";

import {
  GrafikDonatKategori,
  GrafikPendapatanHpp,
  LegendaKategori,
} from "@/components/charts";
import { ChartFrame, TabelSetara } from "@/components/charts/chart-frame";
import { KartuPenilaian } from "@/components/panels/kartu-penilaian";
import { PanelAi } from "@/components/panels/panel-ai";
import {
  RangkumanBulanan,
  RingkasanOperasional,
} from "@/components/panels/modul-analitik";
import { Panel, PanelHeader, Tombol } from "@/components/ui/primitives";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  formatAngka,
  formatPersen,
  formatRupiah,
  formatRupiahRingkas,
} from "@/lib/format";
import {
  komposisiKategori,
  konsumsiUntukTabel,
  penilaianMinggu,
  pnlMingguan,
  profitabilitas,
  ringkasan,
  totalNilaiRisiko,
  totalNilaiStok,
} from "@/lib/data/queries";
import {
  LABEL_KATEGORI_MENU,
  gayaMargin,
} from "@/lib/status";
import {
  LABEL_PERIODE,
  URUTAN_PERIODE,
  deskripsiRentang,
  rentangDari,
  rentangPembanding,
  type PilihanPeriode,
} from "@/lib/periode";
import { perubahanPersen } from "@/lib/utils";
import type { KategoriMenu } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function BerandaOwner() {
  const [periode, setPeriode] = React.useState<PilihanPeriode>("minggu-ini");

  const data = React.useMemo(() => {
    const r = rentangDari(periode);
    const p = rentangPembanding(periode);
    const ini = ringkasan(r);
    const lalu = ringkasan(p);
    const prof = profitabilitas(r);
    return {
      r,
      ini,
      lalu,
      prof,
      pnl: pnlMingguan(12),
      kategori: komposisiKategori(r),
      konsumsi: konsumsiUntukTabel(r),
      nilaiStok: totalNilaiStok(),
      nilaiRisiko: totalNilaiRisiko(),
      penilaian: penilaianMinggu(),
    };
  }, [periode]);

  const angkaRingkas = [
    {
      label: "Pendapatan",
      nilai: data.ini.pendapatan,
      format: (n: number) => formatRupiahRingkas(n),
      delta: perubahanPersen(data.ini.pendapatan, data.lalu.pendapatan),
    },
    {
      label: "Laba kotor",
      nilai: data.ini.labaKotor,
      format: (n: number) => formatRupiahRingkas(n),
      delta: perubahanPersen(data.ini.labaKotor, data.lalu.labaKotor),
    },
    {
      label: "Margin",
      nilai: data.ini.marginPersen,
      format: (n: number) => formatPersen(n),
      delta: data.ini.marginPersen - data.lalu.marginPersen,
      jenisDelta: "pp" as const,
    },
    {
      // Tidak ada snapshot stok periode lalu, jadi tidak ada delta yang jujur
      // untuk ditampilkan. Yang relevan justru berapa bagian yang berisiko.
      label: "Nilai stok",
      nilai: data.nilaiStok,
      format: (n: number) => formatRupiahRingkas(n),
      catatan: `${formatRupiahRingkas(data.nilaiRisiko)} berisiko kadaluarsa`,
    },
  ];

  const menuTeratas = [...data.prof]
    .filter((p) => p.punyaResep && p.qtyTerjual > 0)
    .sort((a, b) => b.totalKontribusi - a.totalKontribusi)
    .slice(0, 10);

  const bahanTeratas = data.konsumsi.slice(0, 15);

  return (
    <div className="space-y-4">
      <RingkasanOperasional dasar="/owner" />
      <RangkumanBulanan />

      {/* --- Bilah kendali --- */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1 rounded-input bg-panel-sunken p-1">
          {URUTAN_PERIODE.map((p) => (
            <button
              key={p}
              onClick={() => setPeriode(p)}
              aria-pressed={periode === p}
              className={cn(
                "h-7 rounded-[3px] px-2.5 text-[13px] transition-colors",
                periode === p
                  ? "bg-panel font-medium text-ink shadow-[0_1px_2px_rgba(20,24,29,0.06)]"
                  : "text-ink-muted hover:text-ink",
              )}
            >
              {LABEL_PERIODE[p]}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/owner/laporan">
            <Tombol ukuran="sm">
              <Download size={13} strokeWidth={1.5} />
              Ekspor
            </Tombol>
          </Link>
          <Link href="/owner/proyeksi">
            <Tombol ukuran="sm" varian="utama">
              <RefreshCw size={13} strokeWidth={1.5} />
              Proyeksi
            </Tombol>
          </Link>
        </div>
      </div>

      {/* --- Kartu penilaian (hero) --- */}
      <KartuPenilaian
        penilaian={data.penilaian}
        angka={angkaRingkas}
        periode={deskripsiRentang(periode)}
      />

      {/* --- Tren + komposisi --- */}
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <ChartFrame
          judul="Pendapatan vs HPP"
          keterangan="12 minggu terakhir"
          legenda={[
            { label: "Pendapatan", warna: "var(--viz-1)" },
            { label: "HPP", warna: "var(--viz-4)" },
          ]}
          tinggi={260}
          tabel={
            <TabelSetara
              kepala={["Minggu", "Pendapatan", "HPP", "Laba kotor", "Margin"]}
              baris={data.pnl.map((p) => [
                p.labelMinggu,
                formatRupiah(p.pendapatan),
                formatRupiah(p.hpp),
                formatRupiah(p.labaKotor),
                formatPersen(p.marginPersen),
              ])}
            />
          }
        >
          <GrafikPendapatanHpp data={data.pnl} />
        </ChartFrame>

        <ChartFrame
          judul="Komposisi kategori"
          keterangan="Pendapatan per kategori menu"
          tinggi={260}
          tabel={
            <TabelSetara
              kepala={["Kategori", "Pendapatan"]}
              baris={data.kategori.map((k) => [
                LABEL_KATEGORI_MENU[k.kategori as KategoriMenu] ?? k.kategori,
                formatRupiah(k.nilai),
              ])}
            />
          }
        >
          <div className="grid h-full grid-cols-[1fr_auto] items-center gap-3">
            <GrafikDonatKategori data={data.kategori} />
            <div className="w-32 shrink-0">
              <LegendaKategori data={data.kategori} />
            </div>
          </div>
        </ChartFrame>
      </div>

      {/* --- Panel AI --- */}
      <PanelAi />

      {/* --- Dua tabel bersebelahan --- */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            judul="Menu paling menguntungkan"
            keterangan="Diurutkan berdasarkan total kontribusi laba"
            aksi={
              <Link
                href="/owner/menu"
                className="t-caption text-brand hover:underline"
              >
                Lihat semua ▸
              </Link>
            }
          />
          <div className="scroll-thin overflow-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th scope="col" className="border-b border-line bg-panel-sunken px-3 py-2 text-left text-[12px] font-medium text-ink-muted">
                    Menu
                  </th>
                  <th scope="col" className="border-b border-line bg-panel-sunken px-3 py-2 text-right text-[12px] font-medium text-ink-muted">
                    Qty
                  </th>
                  <th scope="col" className="border-b border-line bg-panel-sunken px-3 py-2 text-right text-[12px] font-medium text-ink-muted">
                    Margin
                  </th>
                  <th scope="col" className="border-b border-line bg-panel-sunken px-3 py-2 text-right text-[12px] font-medium text-ink-muted">
                    Kontribusi
                  </th>
                </tr>
              </thead>
              <tbody>
                {menuTeratas.map((p) => (
                  <tr
                    key={p.menu.id}
                    className="border-b border-line last:border-0 hover:bg-panel-sunken/70"
                  >
                    <td className="h-10 px-3 text-ink">
                      <span className="line-clamp-1">{p.menu.nama}</span>
                    </td>
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
                    <td className="num h-10 px-3 text-right text-ink">
                      {formatRupiah(p.totalKontribusi)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            judul="Bahan penyerap biaya terbesar"
            keterangan={`Total nilai berisiko kadaluarsa: ${formatRupiah(data.nilaiRisiko)}`}
            aksi={
              <Link
                href="/owner/bahan"
                className="t-caption text-brand hover:underline"
              >
                Lihat semua ▸
              </Link>
            }
          />
          <div className="scroll-thin max-h-[420px] overflow-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead className="sticky top-0">
                <tr>
                  <th scope="col" className="border-b border-line bg-panel-sunken px-3 py-2 text-left text-[12px] font-medium text-ink-muted">
                    Bahan
                  </th>
                  <th scope="col" className="border-b border-line bg-panel-sunken px-3 py-2 text-right text-[12px] font-medium text-ink-muted">
                    Nilai terpakai
                  </th>
                  <th scope="col" className="border-b border-line bg-panel-sunken px-3 py-2 text-right text-[12px] font-medium text-ink-muted">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {bahanTeratas.map((k) => (
                  <tr
                    key={k.bahan.id}
                    className="border-b border-line last:border-0 hover:bg-panel-sunken/70"
                  >
                    <td className="h-10 px-3 text-ink">
                      <span className="line-clamp-1">{k.bahan.nama}</span>
                    </td>
                    <td className="num h-10 px-3 text-right text-ink">
                      {formatRupiah(k.nilaiRupiah)}
                    </td>
                    <td className="h-10 px-3 text-right">
                      <StatusBadge status={k.status} ringkas />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
