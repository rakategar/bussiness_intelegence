"use client";

import * as React from "react";
import Link from "next/link";
import { Download, Upload } from "lucide-react";

import { ImportWizard } from "@/components/panels/import-wizard";
import { RingkasanOperasional } from "@/components/panels/modul-analitik";
import { KpiCard } from "@/components/ui/kpi-card";
import {
  EmptyState,
  PageHeader,
  Panel,
  PanelHeader,
  Tombol,
} from "@/components/ui/primitives";
import { menuTanpaResep } from "@/lib/data/queries";
import { imporLog, menu } from "@/lib/data/seed";
import { HARI_INI } from "@/lib/data/seed";
import { unduhTemplate } from "@/lib/import/parser";
import {
  formatAngka,
  formatMinggu,
  formatRupiah,
  formatTanggalWaktu,
} from "@/lib/format";
import { cn } from "@/lib/utils";

export default function BerandaAdmin() {
  const [imporBuka, setImporBuka] = React.useState(false);
  const [kabar, setKabar] = React.useState<string | null>(null);
  const [sudahUnggah, setSudahUnggah] = React.useState(false);

  const tanpaResep = React.useMemo(() => menuTanpaResep(), []);
  const imporBulanIni = imporLog.filter(
    (l) => new Date(l.createdAt).getMonth() === HARI_INI.getMonth(),
  ).length;

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Beranda Admin Operasional"
        keterangan="Rangkuman anggaran, pengeluaran, penjualan, dan pengiriman, plus pekerjaan yang belum selesai minggu ini."
      />

      <RingkasanOperasional dasar="/admin" />

      {/* --- Status minggu berjalan --- */}
      <Panel className="overflow-hidden">
        <div className="border-b border-line px-4 py-2.5">
          <p className="num t-caption text-ink-muted">
            {formatMinggu(HARI_INI)}
          </p>
        </div>

        {sudahUnggah ? (
          <div className="flex flex-wrap items-center gap-3 bg-fresh-bg px-4 py-4">
            <span className="h-2 w-2 rounded-full bg-fresh" />
            <div className="min-w-0">
              <p className="t-body-strong text-fresh">
                Rekap penjualan minggu ini sudah masuk
              </p>
              <p className="t-caption mt-0.5 text-ink-muted">
                52 baris tersimpan. Stok bahan sudah dikurangi otomatis dengan
                metode FEFO.
              </p>
            </div>
            <Link href="/admin/penjualan" className="ml-auto">
              <Tombol ukuran="sm">Lihat data penjualan</Tombol>
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3 bg-watch-bg px-4 py-4">
            <span className="h-2 w-2 rounded-full bg-watch" />
            <div className="min-w-0">
              <p className="t-body-strong text-watch">
                Data penjualan minggu ini belum diunggah
              </p>
              <p className="t-caption prose-width mt-0.5 text-ink-muted">
                Tanpa data ini, konsumsi bahan dan laba minggu berjalan tidak
                bisa dihitung.
              </p>
            </div>
            <div className="ml-auto flex flex-wrap gap-2">
              <Tombol
                varian="utama"
                ukuran="sm"
                onClick={() => setImporBuka(true)}
              >
                <Upload size={14} strokeWidth={1.75} />
                Unggah rekap penjualan
              </Tombol>
              <Tombol ukuran="sm" onClick={() => unduhTemplate("sales")}>
                <Download size={14} strokeWidth={1.75} />
                Unduh template
              </Tombol>
            </div>
          </div>
        )}
      </Panel>

      {kabar ? (
        <div
          role="status"
          aria-live="polite"
          className="anim-rise flex items-center gap-2 rounded-panel border border-line bg-fresh-bg px-3 py-2.5 text-[13px] text-fresh"
        >
          <span aria-hidden>✓</span>
          {kabar}
          <button
            onClick={() => setKabar(null)}
            className="ml-auto text-[12px] underline"
          >
            Tutup
          </button>
        </div>
      ) : null}

      {/* --- Tiga KPI --- */}
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard
          label="Menu terdaftar"
          nilai={menu.length}
          format={(n) => formatAngka(Math.round(n))}
          pembanding="Termasuk add-on"
        />
        <KpiCard
          label="Menu tanpa resep"
          nilai={tanpaResep.length}
          format={(n) => formatAngka(Math.round(n))}
          peringatan={tanpaResep.length > 0}
          pembanding="Tidak masuk hitungan HPP"
        />
        <KpiCard
          label="Impor bulan ini"
          nilai={imporBulanIni}
          format={(n) => formatAngka(Math.round(n))}
          pembanding={`${imporLog.length} total tercatat`}
        />
      </div>

      {/* --- Menu tanpa resep --- */}
      <Panel>
        <PanelHeader
          judul="Menu tanpa resep"
          keterangan="Menu ini tidak masuk hitungan HPP dan konsumsi bahan. Setiap penjualannya tidak mengurangi stok apa pun."
          aksi={
            <Link
              href="/admin/menu"
              className="t-caption text-brand hover:underline"
            >
              Lihat semua menu ▸
            </Link>
          }
        />
        {tanpaResep.length === 0 ? (
          <EmptyState
            nada="baik"
            judul="Semua menu sudah punya resep"
            penjelasan="HPP dan margin terhitung untuk seluruh menu. Konsumsi bahan dari penjualan tercatat lengkap."
          />
        ) : (
          <ul className="divide-y divide-line">
            {tanpaResep.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center gap-2 px-4 py-2.5"
              >
                <span className="text-[13px] font-medium text-ink">
                  {m.nama}
                </span>
                <span className="num t-caption text-ink-faint">{m.sku}</span>
                <span className="inline-flex h-[20px] items-center rounded-[999px] bg-watch-bg px-2 text-[11px] font-medium text-watch">
                  Resep belum diisi
                </span>
                <span className="num t-caption ml-auto text-ink-muted">
                  {formatRupiah(m.hargaJual)}
                </span>
                <Link href={`/admin/menu/${m.id}`}>
                  <Tombol ukuran="sm">Isi resep</Tombol>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* --- Riwayat impor --- */}
      <Panel>
        <PanelHeader
          judul="Riwayat impor"
          keterangan="Impor yang usianya kurang dari 24 jam masih bisa dibatalkan."
        />
        <div className="scroll-thin overflow-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                {["File", "Tipe", "Waktu", "Baris", "Gagal", "Status", ""].map(
                  (h, i) => (
                    <th
                      key={h || i}
                      scope="col"
                      className={cn(
                        "border-b border-line bg-panel-sunken px-3 py-2 text-[12px] font-medium text-ink-muted",
                        i >= 3 ? "text-right" : "text-left",
                      )}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {imporLog.map((l, i) => (
                <tr
                  key={l.id}
                  className="border-b border-line last:border-0 hover:bg-panel-sunken/70"
                  style={
                    l.status === "rolled_back"
                      ? { boxShadow: "inset 3px 0 0 0 var(--expired)" }
                      : undefined
                  }
                >
                  <td className="h-10 px-3 text-ink">{l.namaFile}</td>
                  <td className="h-10 px-3 text-ink-muted">
                    {l.tipe === "sales" ? "Penjualan" : "Restock"}
                  </td>
                  <td className="h-10 px-3 text-ink-muted">
                    {formatTanggalWaktu(l.createdAt)}
                  </td>
                  <td className="num h-10 px-3 text-right text-ink">
                    {formatAngka(l.jumlahSukses)}
                  </td>
                  <td
                    className={cn(
                      "num h-10 px-3 text-right",
                      l.jumlahGagal > 0 ? "text-critical" : "text-ink-faint",
                    )}
                  >
                    {l.jumlahGagal > 0 ? formatAngka(l.jumlahGagal) : "—"}
                  </td>
                  <td className="h-10 px-3 text-right text-ink-muted">
                    {l.status === "applied"
                      ? "Diterapkan"
                      : l.status === "rolled_back"
                        ? "Dibatalkan"
                        : "Menunggu"}
                  </td>
                  <td className="h-10 px-3 text-right">
                    {i === 0 && l.status === "applied" ? (
                      <Tombol
                        ukuran="sm"
                        varian="bahaya"
                        onClick={() =>
                          setKabar(`Impor ${l.namaFile} dibatalkan.`)
                        }
                      >
                        Batalkan
                      </Tombol>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {imporBuka ? (
        <ImportWizard
          tipe="sales"
          onTutup={() => setImporBuka(false)}
          onSelesai={(n) => {
            setImporBuka(false);
            setSudahUnggah(true);
            setKabar(
              `${n} baris penjualan tersimpan. Stok bahan sudah dikurangi FEFO.`,
            );
          }}
        />
      ) : null}
    </div>
  );
}
