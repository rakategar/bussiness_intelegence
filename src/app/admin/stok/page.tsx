"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Plus, PackageCheck } from "lucide-react";

import { Panel, PanelHeader, PageHeader, Tombol, EmptyState, Rupiah } from "@/components/ui/primitives";
import { KpiCard } from "@/components/ui/kpi-card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  batchAktif,
  restockTerakhir,
  risikoKadaluarsa,
  semuaBatchBerisiko,
  semuaStok,
  totalNilaiRisiko,
  totalNilaiStok,
} from "@/lib/data/queries";
import { GAYA_STATUS, LABEL_STATUS_RESTOCK, URUTAN_STATUS } from "@/lib/status";
import {
  formatAngka,
  formatQty,
  formatRupiahRingkas,
  formatTanggalPendek,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { StatusKesegaran } from "@/lib/types";

export default function RingkasanStok() {
  const data = React.useMemo(() => {
    const stok = semuaStok();
    const berisiko = semuaBatchBerisiko();
    const dalam7Hari = risikoKadaluarsa(7);
    return {
      stok,
      berisiko,
      dalam7Hari,
      menipis: stok.filter((s) => s.perluRestock),
      nilaiStok: totalNilaiStok(),
      nilaiRisiko: totalNilaiRisiko(),
      restock: restockTerakhir(5),
      jumlahBatch: batchAktif.length,
    };
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Ringkasan stok"
        keterangan="Apa yang harus dikerjakan hari ini."
        aksi={
          <Link href="/admin/stok/restock?baru=1">
            <Tombol varian="utama" ukuran="sm">
              <Plus size={14} strokeWidth={1.75} />
              Restock baru
            </Tombol>
          </Link>
        }
      />

      {/* --- Kartu paling menonjol: bahan perlu perhatian --- */}
      <KartuPerluPerhatian
        berisiko={data.berisiko}
        jumlahPerhatian={data.dalam7Hari.length}
        nilaiRisiko={data.nilaiRisiko}
      />

      {/* --- Tiga KPI --- */}
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard
          label="Bahan aktif"
          nilai={data.stok.length}
          format={(n) => formatAngka(Math.round(n))}
          pembanding="Terdaftar dan masih dipakai"
        />
        <KpiCard
          label="Bahan menipis"
          nilai={data.menipis.length}
          format={(n) => formatAngka(Math.round(n))}
          peringatan={data.menipis.length > 0}
          pembanding="Sisa hari lebih pendek dari lead time"
        />
        <KpiCard
          label="Nilai stok"
          nilai={data.nilaiStok}
          format={(n) => formatRupiahRingkas(n)}
          pembanding={`${data.jumlahBatch} batch aktif`}
        />
      </div>

      {/* --- Akan kadaluarsa --- */}
      <Panel>
        <PanelHeader
          judul="Akan kadaluarsa 7 hari ke depan"
          keterangan="Diurutkan dari yang paling mendesak."
          aksi={
            <Link
              href="/admin/stok/kadaluarsa"
              className="t-caption text-brand hover:underline"
            >
              Lihat semua ▸
            </Link>
          }
        />
        {data.dalam7Hari.length === 0 ? (
          <EmptyState
            nada="baik"
            ikon={<PackageCheck size={18} strokeWidth={1.5} />}
            judul="Tidak ada bahan yang mendekati kadaluarsa"
            penjelasan="Semua batch masih di atas 7 hari. Ini kabar baik — tidak ada yang perlu diprioritaskan hari ini."
          />
        ) : (
          <div className="scroll-thin overflow-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  {["Bahan", "Batch diterima", "Sisa", "Status", "Nilai"].map(
                    (h, i) => (
                      <th
                        key={h}
                        scope="col"
                        className={cn(
                          "border-b border-line bg-panel-sunken px-3 py-2 text-[12px] font-medium text-ink-muted",
                          i >= 2 ? "text-right" : "text-left",
                        )}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {data.dalam7Hari.slice(0, 8).map((r) => (
                  <tr
                    key={r.batch.id}
                    className="border-b border-line last:border-0 hover:bg-panel-sunken/70"
                    style={
                      r.status === "kadaluarsa"
                        ? { boxShadow: "inset 3px 0 0 0 var(--expired)" }
                        : undefined
                    }
                  >
                    <td className="h-10 px-3 text-ink">
                      <span className="font-medium">{r.bahan.nama}</span>
                      <span className="num ml-2 text-[12px] text-ink-faint">
                        {r.bahan.sku}
                      </span>
                    </td>
                    <td className="h-10 px-3 text-ink-muted">
                      {formatTanggalPendek(r.batch.tanggalTerima)}
                    </td>
                    <td className="num h-10 px-3 text-right text-ink">
                      {formatQty(r.batch.sisaQty, r.bahan.satuan)}
                    </td>
                    <td className="h-10 px-3 text-right">
                      <StatusBadge status={r.status} sisaHari={r.sisaHari} />
                    </td>
                    <td className="h-10 px-3 text-right text-ink">
                      <Rupiah nilai={r.nilaiRisiko} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* --- Restock terakhir --- */}
      <Panel>
        <PanelHeader
          judul="Restock terakhir"
          aksi={
            <Link
              href="/admin/stok/restock"
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
                {["Bahan", "Diterima", "Jumlah", "Total biaya", "Status"].map(
                  (h, i) => (
                    <th
                      key={h}
                      scope="col"
                      className={cn(
                        "border-b border-line bg-panel-sunken px-3 py-2 text-[12px] font-medium text-ink-muted",
                        i >= 2 && i < 4 ? "text-right" : "text-left",
                        i === 4 && "text-right",
                      )}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {data.restock.map(({ batch: b, bahan: bh }) => (
                <tr
                  key={b.id}
                  className="border-b border-line last:border-0 hover:bg-panel-sunken/70"
                >
                  <td className="h-10 px-3 text-ink">{bh.nama}</td>
                  <td className="h-10 px-3 text-ink-muted">
                    {formatTanggalPendek(b.tanggalTerima)}
                  </td>
                  <td className="num h-10 px-3 text-right text-ink">
                    {formatQty(b.jumlah, b.satuan)}
                  </td>
                  <td className="h-10 px-3 text-right text-ink">
                    <Rupiah nilai={b.totalBiaya} />
                  </td>
                  <td className="h-10 px-3 text-right text-ink-muted">
                    {LABEL_STATUS_RESTOCK[b.status]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

/**
 * Bilah 20 titik yang mewakili batch aktif, diwarnai sesuai status kesegaran.
 * Ini pengganti "angka besar + gradien" yang biasa — sekilas pandang langsung
 * terlihat porsi mana yang bermasalah (DESIGN.md 4.2).
 */
function KartuPerluPerhatian({
  berisiko,
  jumlahPerhatian,
  nilaiRisiko,
}: {
  berisiko: { status: StatusKesegaran }[];
  jumlahPerhatian: number;
  nilaiRisiko: number;
}) {
  const total = berisiko.length || 1;

  // 20 titik proporsional dengan sebaran status batch aktif.
  const titik: StatusKesegaran[] = React.useMemo(() => {
    const hitung: Record<StatusKesegaran, number> = {
      kadaluarsa: 0,
      kritis: 0,
      waspada: 0,
      aman: 0,
    };
    for (const b of berisiko) hitung[b.status]++;

    const hasil: StatusKesegaran[] = [];
    for (const s of URUTAN_STATUS) {
      const n = Math.round((hitung[s] / total) * 20);
      for (let i = 0; i < n && hasil.length < 20; i++) hasil.push(s);
    }
    while (hasil.length < 20) hasil.push("aman");
    return hasil.slice(0, 20);
  }, [berisiko, total]);

  const ringkasStatus = URUTAN_STATUS.map((s) => ({
    status: s,
    jumlah: berisiko.filter((b) => b.status === s).length,
  })).filter((x) => x.jumlah > 0);

  return (
    <Panel className="p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-ink">
            <span className="num">{jumlahPerhatian}</span> bahan perlu
            perhatian
          </h2>
          <p className="t-small mt-0.5 text-ink-muted">
            Batch dengan sisa 7 hari atau kurang.
          </p>
        </div>
        <Link href="/admin/stok/kadaluarsa">
          <Tombol ukuran="sm">
            Lihat daftar
            <ArrowRight size={13} strokeWidth={1.75} />
          </Tombol>
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
        <div
          className="flex flex-wrap items-center gap-1.5"
          role="img"
          aria-label={`Sebaran status ${berisiko.length} batch aktif: ${ringkasStatus
            .map((r) => `${r.jumlah} ${r.status}`)
            .join(", ")}`}
        >
          {titik.map((s, i) => (
            <span
              key={i}
              className={cn(
                "anim-dot-in h-3 w-3 rounded-full",
                GAYA_STATUS[s].titik,
              )}
              style={{ animationDelay: `${i * 22}ms` }}
            />
          ))}
        </div>

        <div className="flex items-baseline gap-1.5">
          <Rupiah
            nilai={nilaiRisiko}
            className="text-[17px] font-semibold text-ink"
          />
          <span className="t-caption text-ink-muted">berisiko</span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line pt-3">
        {ringkasStatus.map((r) => (
          <span
            key={r.status}
            className="flex items-center gap-1.5 text-[12px] text-ink-muted"
          >
            <span
              className={cn("h-2 w-2 rounded-full", GAYA_STATUS[r.status].titik)}
            />
            <span className="num font-medium text-ink">{r.jumlah}</span>
            {r.status}
          </span>
        ))}
        <span className="t-caption ml-auto text-ink-faint">
          {berisiko.length} batch aktif seluruhnya
        </span>
      </div>
    </Panel>
  );
}
