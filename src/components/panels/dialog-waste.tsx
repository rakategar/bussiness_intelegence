"use client";

import * as React from "react";
import { X } from "lucide-react";

import { Isian, Label, Pilihan, Tombol } from "@/components/ui/primitives";
import { formatQty, formatRupiah, formatTanggal } from "@/lib/format";
import { LABEL_ALASAN_WASTE } from "@/lib/status";
import type { AlasanWaste, RisikoBatch } from "@/lib/types";

/**
 * Form catat waste. Nilai kerugian terhitung otomatis dari biaya_per_unit
 * batch yang dipilih, jadi field-nya berlatar --brand-soft (DESIGN.md 3.8).
 */
export function DialogWaste({
  risiko,
  onTutup,
  onSimpan,
}: {
  risiko: RisikoBatch;
  onTutup: () => void;
  onSimpan: (qty: number, nilai: number) => void;
}) {
  const [qty, setQty] = React.useState(String(Math.round(risiko.batch.sisaQty)));
  const [alasan, setAlasan] = React.useState<AlasanWaste>(
    risiko.sisaHari <= 0 ? "expired" : "rusak",
  );
  const [catatan, setCatatan] = React.useState("");

  const angka = Number(qty) || 0;
  const nilai = angka * risiko.batch.biayaPerUnit;
  const terlaluBanyak = angka > risiko.batch.sisaQty;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/25 p-0 sm:items-center sm:p-5">
      <div
        className="fixed inset-0"
        onClick={onTutup}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="judul-waste"
        className="anim-rise relative w-full max-w-md rounded-t-modal border border-line bg-panel shadow-[var(--shadow-modal)] sm:rounded-modal"
      >
        <div className="flex items-start justify-between gap-2 border-b border-line px-4 py-3">
          <div>
            <h2 id="judul-waste" className="t-h2 text-ink">
              Catat terbuang
            </h2>
            <p className="t-caption mt-0.5 text-ink-muted">
              {risiko.bahan.nama} · batch diterima{" "}
              {formatTanggal(risiko.batch.tanggalTerima)}
            </p>
          </div>
          <button
            onClick={onTutup}
            className="rounded-input p-1 text-ink-faint transition-colors hover:bg-panel-sunken hover:text-ink"
            aria-label="Tutup"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        <div className="space-y-4 px-4 py-4">
          <div className="rounded-input bg-panel-sunken px-3 py-2">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-ink-muted">Sisa batch</span>
              <span className="num font-medium text-ink">
                {formatQty(risiko.batch.sisaQty, risiko.bahan.satuan)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[13px]">
              <span className="text-ink-muted">Biaya per unit</span>
              <span className="num font-medium text-ink">
                {formatRupiah(risiko.batch.biayaPerUnit, 2)}
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="qty-waste" wajib>
              Jumlah terbuang ({risiko.bahan.satuan})
            </Label>
            <Isian
              id="qty-waste"
              type="number"
              inputMode="decimal"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              min={0}
              max={risiko.batch.sisaQty}
            />
            {terlaluBanyak ? (
              <p className="mt-1 flex items-center gap-1 text-[12px] text-expired">
                <span aria-hidden>⚠</span>
                Jumlah melebihi sisa batch (
                {formatQty(risiko.batch.sisaQty, risiko.bahan.satuan)}).
              </p>
            ) : null}
          </div>

          <div>
            <Label htmlFor="alasan-waste" wajib>
              Alasan
            </Label>
            <Pilihan
              id="alasan-waste"
              value={alasan}
              onChange={(e) => setAlasan(e.target.value as AlasanWaste)}
              className="h-10 w-full text-[14px]"
            >
              {(
                Object.keys(LABEL_ALASAN_WASTE) as AlasanWaste[]
              ).map((a) => (
                <option key={a} value={a}>
                  {LABEL_ALASAN_WASTE[a]}
                </option>
              ))}
            </Pilihan>
          </div>

          <div>
            <Label
              htmlFor="nilai-waste"
              bantuan="Terhitung otomatis dari biaya per unit batch ini."
            >
              Nilai kerugian
            </Label>
            <Isian
              id="nilai-waste"
              terhitung
              readOnly
              value={formatRupiah(nilai)}
            />
          </div>

          <div>
            <Label htmlFor="catatan-waste">Catatan</Label>
            <Isian
              id="catatan-waste"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Opsional"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-line px-4 py-3">
          <Tombol onClick={onTutup}>Batal</Tombol>
          <Tombol
            varian="utama"
            disabled={angka <= 0 || terlaluBanyak}
            onClick={() => onSimpan(angka, nilai)}
          >
            Catat {formatQty(angka, risiko.bahan.satuan)}
          </Tombol>
        </div>
      </div>
    </div>
  );
}
