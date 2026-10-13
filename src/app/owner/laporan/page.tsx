"use client";

import * as React from "react";
import { FileDown, FileSpreadsheet } from "lucide-react";

import { ChartFrame, TabelSetara } from "@/components/charts/chart-frame";
import { GrafikPendapatanHpp } from "@/components/charts";
import {
  PageHeader,
  Panel,
  PanelHeader,
  Rupiah,
  Tombol,
} from "@/components/ui/primitives";
import {
  komposisiKategori,
  penilaianMinggu,
  pnlMingguan,
  profitabilitas,
  ringkasan,
  totalNilaiRisiko,
  totalNilaiStok,
} from "@/lib/data/queries";
import { LABEL_KATEGORI_MENU } from "@/lib/status";
import {
  LABEL_PERIODE,
  URUTAN_PERIODE,
  deskripsiRentang,
  rentangDari,
  rentangPembanding,
  type PilihanPeriode,
} from "@/lib/periode";
import {
  formatAngka,
  formatMinggu,
  formatPersen,
  formatRupiah,
  nomorMinggu,
} from "@/lib/format";
import { HARI_INI } from "@/lib/data/seed";
import { perubahanPersen } from "@/lib/utils";
import type { KategoriMenu } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function HalamanLaporan() {
  const [periode, setPeriode] = React.useState<PilihanPeriode>("minggu-ini");
  const [kabar, setKabar] = React.useState<string | null>(null);

  const data = React.useMemo(() => {
    const r = rentangDari(periode);
    const p = rentangPembanding(periode);
    const prof = profitabilitas(r);
    return {
      ini: ringkasan(r),
      lalu: ringkasan(p),
      prof,
      kategori: komposisiKategori(r),
      pnl: pnlMingguan(12),
      nilaiStok: totalNilaiStok(),
      nilaiRisiko: totalNilaiRisiko(),
      penilaian: penilaianMinggu(),
    };
  }, [periode]);

  const namaBerkas = `dashboard-bi-laporan-${HARI_INI.getFullYear()}-W${nomorMinggu(HARI_INI)}`;

  const barisPnl = [
    { k: "Pendapatan", v: data.ini.pendapatan, b: data.lalu.pendapatan },
    { k: "Harga pokok penjualan (HPP)", v: -data.ini.hpp, b: -data.lalu.hpp },
    {
      k: "Laba kotor",
      v: data.ini.labaKotor,
      b: data.lalu.labaKotor,
      tebal: true,
    },
  ];

  const perKategori = data.kategori.map((k) => {
    const menuKategori = data.prof.filter(
      (p) => p.menu.kategori === k.kategori,
    );
    const hpp = menuKategori.reduce((t, p) => t + p.hpp * p.qtyTerjual, 0);
    return {
      kategori: k.kategori as KategoriMenu,
      pendapatan: k.nilai,
      hpp,
      laba: k.nilai - hpp,
      margin: k.nilai ? ((k.nilai - hpp) / k.nilai) * 100 : 0,
    };
  });

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Laporan"
        keterangan={`Laba rugi sederhana untuk ${deskripsiRentang(periode)}.`}
        aksi={
          <>
            <Tombol
              ukuran="sm"
              onClick={() => setKabar(`${namaBerkas}.xlsx sedang disiapkan.`)}
            >
              <FileSpreadsheet size={14} strokeWidth={1.75} />
              Ekspor Excel
            </Tombol>
            <Tombol
              varian="utama"
              ukuran="sm"
              onClick={() => setKabar(`${namaBerkas}.pdf sedang disiapkan.`)}
            >
              <FileDown size={14} strokeWidth={1.75} />
              Ekspor PDF
            </Tombol>
          </>
        }
      />

      {kabar ? (
        <div
          role="status"
          aria-live="polite"
          className="anim-rise flex items-center gap-2 rounded-panel border border-line bg-brand-soft px-3 py-2.5 text-[13px] text-brand"
        >
          {kabar}
          <button
            onClick={() => setKabar(null)}
            className="ml-auto text-[12px] underline"
          >
            Tutup
          </button>
        </div>
      ) : null}

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

      {/* --- Ringkasan yang bisa dibaca langsung --- */}
      <Panel className="p-4 sm:p-5">
        <p className="t-caption text-ink-muted">{formatMinggu(HARI_INI)}</p>
        <p className="prose-width mt-2 text-[17px] leading-7 text-ink">
          {data.penilaian.kalimat} Pendapatan periode ini{" "}
          <span className="num font-semibold">
            {formatRupiah(data.ini.pendapatan)}
          </span>{" "}
          dengan laba kotor{" "}
          <span className="num font-semibold">
            {formatRupiah(data.ini.labaKotor)}
          </span>{" "}
          (margin {formatPersen(data.ini.marginPersen)}). Nilai stok yang
          tersimpan {formatRupiah(data.nilaiStok)}, dengan{" "}
          {formatRupiah(data.nilaiRisiko)} di antaranya berisiko kadaluarsa
          dalam 7 hari.
        </p>
      </Panel>

      {/* --- Laba rugi --- */}
      <Panel>
        <PanelHeader
          judul="Laba rugi"
          keterangan="Pendapatan − HPP = laba kotor. Biaya operasional belum termasuk."
        />
        <table className="w-full border-collapse text-[14px]">
          <thead>
            <tr>
              {["Pos", "Periode ini", "Periode lalu", "Perubahan"].map(
                (h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className={cn(
                      "border-b border-line bg-panel-sunken px-4 py-2 text-[12px] font-medium text-ink-muted",
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
            {barisPnl.map((r) => {
              const delta = perubahanPersen(r.v, r.b);
              return (
                <tr
                  key={r.k}
                  className={cn(
                    "border-b border-line last:border-0",
                    r.tebal && "bg-panel-sunken/50",
                  )}
                >
                  <td
                    className={cn(
                      "h-11 px-4 text-ink",
                      r.tebal && "font-semibold",
                    )}
                  >
                    {r.k}
                  </td>
                  <td
                    className={cn(
                      "h-11 px-4 text-right text-ink",
                      r.tebal && "font-semibold",
                    )}
                  >
                    <Rupiah nilai={r.v} />
                  </td>
                  <td className="h-11 px-4 text-right text-ink-muted">
                    <Rupiah nilai={r.b} />
                  </td>
                  <td
                    className={cn(
                      "num h-11 px-4 text-right font-medium",
                      Math.abs(delta) < 0.05
                        ? "text-ink-muted"
                        : delta > 0
                          ? "text-gain"
                          : "text-loss",
                    )}
                  >
                    {delta > 0 ? "↑" : delta < 0 ? "↓" : "→"}{" "}
                    {formatAngka(Math.abs(delta), 1)}%
                  </td>
                </tr>
              );
            })}
            <tr className="border-t border-line-strong bg-panel-sunken/50">
              <td className="h-11 px-4 font-semibold text-ink">Margin kotor</td>
              <td className="num h-11 px-4 text-right font-semibold text-ink">
                {formatPersen(data.ini.marginPersen)}
              </td>
              <td className="num h-11 px-4 text-right text-ink-muted">
                {formatPersen(data.lalu.marginPersen)}
              </td>
              <td className="num h-11 px-4 text-right font-medium text-ink-muted">
                {formatAngka(
                  Math.abs(data.ini.marginPersen - data.lalu.marginPersen),
                  1,
                )}
                pp
              </td>
            </tr>
          </tbody>
        </table>
      </Panel>

      {/* --- Rincian per kategori --- */}
      <Panel>
        <PanelHeader judul="Rincian per kategori menu" />
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              {["Kategori", "Pendapatan", "HPP", "Laba kotor", "Margin"].map(
                (h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className={cn(
                      "border-b border-line bg-panel-sunken px-4 py-2 text-[12px] font-medium text-ink-muted",
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
            {perKategori.map((k) => (
              <tr key={k.kategori} className="border-b border-line last:border-0">
                <td className="h-10 px-4 text-ink">
                  {LABEL_KATEGORI_MENU[k.kategori] ?? k.kategori}
                </td>
                <td className="h-10 px-4 text-right text-ink">
                  <Rupiah nilai={k.pendapatan} />
                </td>
                <td className="h-10 px-4 text-right text-ink-muted">
                  <Rupiah nilai={k.hpp} />
                </td>
                <td className="h-10 px-4 text-right text-ink">
                  <Rupiah nilai={k.laba} />
                </td>
                <td className="num h-10 px-4 text-right text-ink">
                  {formatPersen(k.margin)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <ChartFrame
        judul="Tren 12 minggu"
        legenda={[
          { label: "Pendapatan", warna: "var(--viz-1)" },
          { label: "HPP", warna: "var(--viz-4)" },
        ]}
        tinggi={240}
        tabel={
          <TabelSetara
            kepala={["Minggu", "Pendapatan", "HPP", "Laba kotor"]}
            baris={data.pnl.map((p) => [
              p.labelMinggu,
              formatRupiah(p.pendapatan),
              formatRupiah(p.hpp),
              formatRupiah(p.labaKotor),
            ])}
          />
        }
      >
        <GrafikPendapatanHpp data={data.pnl} />
      </ChartFrame>

      <p className="t-caption text-ink-faint">
        Nama berkas ekspor: {namaBerkas}.pdf / {namaBerkas}.xlsx
      </p>
    </div>
  );
}
