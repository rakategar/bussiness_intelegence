"use client";

import * as React from "react";
import { PackageCheck } from "lucide-react";

import {
  EmptyState,
  PageHeader,
  Panel,
  Rupiah,
  Tombol,
} from "@/components/ui/primitives";
import { StatusBadge } from "@/components/ui/status-badge";
import { DialogWaste } from "@/components/panels/dialog-waste";
import { semuaBatchBerisiko } from "@/lib/data/queries";
import { GAYA_STATUS, LABEL_STATUS, URUTAN_STATUS } from "@/lib/status";
import { formatQty, formatRupiah, formatTanggal } from "@/lib/format";
import type { RisikoBatch, StatusKesegaran } from "@/lib/types";
import { cn } from "@/lib/utils";

const KETERANGAN: Record<StatusKesegaran, string> = {
  kadaluarsa: "Sudah lewat tanggal. Catat sebagai terbuang.",
  kritis: "Sisa 1–3 hari. Prioritaskan pemakaiannya hari ini.",
  waspada: "Sisa 4–7 hari. Rencanakan pemakaiannya minggu ini.",
  aman: "Sisa di atas 7 hari. Tidak perlu tindakan khusus.",
};

export default function HalamanKadaluarsa() {
  const semua = React.useMemo(() => semuaBatchBerisiko(), []);
  const [wasteUntuk, setWasteUntuk] = React.useState<RisikoBatch | null>(null);
  const [kabar, setKabar] = React.useState<string | null>(null);

  const kelompok = URUTAN_STATUS.map((s) => ({
    status: s,
    baris: semua.filter((r) => r.status === s),
  }));

  const adaYangMendesak = semua.some((r) => r.sisaHari <= 7);

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Kadaluarsa"
        keterangan="Semua batch yang masih bersisa, diurutkan dari tanggal kadaluarsa terdekat."
      />

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

      {!adaYangMendesak ? (
        <Panel>
          <EmptyState
            nada="baik"
            ikon={<PackageCheck size={18} strokeWidth={1.5} />}
            judul="Tidak ada bahan yang mendekati kadaluarsa"
            penjelasan="Semua batch masih di atas 7 hari. Ini kabar baik — tidak ada yang perlu diprioritaskan."
          />
        </Panel>
      ) : null}

      {kelompok.map(({ status, baris }) =>
        baris.length === 0 ? null : (
          <Panel key={status} className="overflow-hidden">
            <div
              className={cn(
                "flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line px-4 py-3",
                GAYA_STATUS[status].latar,
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  GAYA_STATUS[status].titik,
                )}
              />
              <h2
                className={cn("t-h3", GAYA_STATUS[status].teks)}
              >
                {LABEL_STATUS[status]}
              </h2>
              <span className="num t-caption text-ink-muted">
                {baris.length} batch
              </span>
              <span className="t-caption hidden text-ink-muted sm:inline">
                · {KETERANGAN[status]}
              </span>
              <span className="ml-auto flex items-baseline gap-1.5">
                <Rupiah
                  nilai={baris.reduce((t, r) => t + r.nilaiRisiko, 0)}
                  className={cn("text-[15px] font-semibold", GAYA_STATUS[status].teks)}
                />
                <span className="t-caption text-ink-muted">total nilai</span>
              </span>
            </div>

            <div className="scroll-thin overflow-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr>
                    {[
                      "Bahan",
                      "Diterima",
                      "Kadaluarsa",
                      "Sisa",
                      "Status",
                      "Nilai",
                      "",
                    ].map((h, i) => (
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
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {baris.map((r) => (
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
                        {formatTanggal(r.batch.tanggalTerima)}
                      </td>
                      <td className="h-10 px-3 text-ink-muted">
                        {formatTanggal(r.batch.tanggalKadaluarsa)}
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
                      <td className="h-10 px-3 text-right">
                        <Tombol
                          ukuran="sm"
                          onClick={() => setWasteUntuk(r)}
                        >
                          Catat terbuang
                        </Tombol>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        ),
      )}

      {wasteUntuk ? (
        <DialogWaste
          risiko={wasteUntuk}
          onTutup={() => setWasteUntuk(null)}
          onSimpan={(qty, nilai) => {
            // Pada versi Supabase, di sini dipanggil insert waste_logs +
            // stock_movements. Untuk demo, cukup beri umpan balik.
            setKabar(
              `Tercatat ${formatQty(qty, wasteUntuk.bahan.satuan)} ${
                wasteUntuk.bahan.nama
              } terbuang, kerugian ${formatRupiah(nilai)}.`,
            );
            setWasteUntuk(null);
          }}
        />
      ) : null}
    </div>
  );
}
