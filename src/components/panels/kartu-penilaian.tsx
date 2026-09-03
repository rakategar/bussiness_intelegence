"use client";

import { cn } from "@/lib/utils";
import { AngkaBergulir, Delta } from "@/components/ui/kpi-card";
import {
  formatPersen,
  formatRupiahRingkas,
} from "@/lib/format";
import type { PenilaianMingguan } from "@/lib/types";

const GAYA = {
  aman: { pil: "bg-fresh-bg text-fresh", titik: "bg-fresh" },
  waspada: { pil: "bg-watch-bg text-watch", titik: "bg-watch" },
  bahaya: { pil: "bg-expired-bg text-expired", titik: "bg-expired" },
} as const;

export interface AngkaRingkas {
  label: string;
  nilai: number;
  format: (n: number) => string;
  delta: number;
  jenisDelta?: "persen" | "pp";
  terbalik?: boolean;
}

/**
 * Kartu pembuka dashboard Owner (DESIGN.md 4.4).
 * Pembukanya BUKAN angka besar, melainkan kalimat penilaian — dirakit dari
 * aturan biasa di penilaianMinggu(), bukan dari AI, supaya selalu muncul.
 */
export function KartuPenilaian({
  penilaian,
  angka,
  periode,
}: {
  penilaian: PenilaianMingguan;
  angka: AngkaRingkas[];
  periode: string;
}) {
  const g = GAYA[penilaian.status];

  return (
    <section className="overflow-hidden rounded-panel border border-line bg-panel">
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex h-7 items-center gap-2 rounded-[999px] px-3 text-[13px] font-semibold",
              g.pil,
            )}
          >
            <span className={cn("h-2 w-2 rounded-full", g.titik)} />
            {penilaian.status.charAt(0).toUpperCase() +
              penilaian.status.slice(1)}
          </span>
          <span className="t-caption text-ink-faint">{periode}</span>
        </div>

        <p className="mt-3 max-w-[36ch] text-[19px] font-semibold leading-7 tracking-[-0.01em] text-ink sm:max-w-[52ch] sm:text-[21px] sm:leading-8">
          {penilaian.kalimat}
        </p>

        {penilaian.temuan.length > 1 ? (
          <ul className="mt-2.5 space-y-1">
            {penilaian.temuan.slice(1).map((t) => (
              <li key={t} className="t-small flex gap-2 text-ink-muted">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-faint" />
                <span className="prose-width">{t}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {/* Empat angka ringkas dalam satu baris */}
      <div className="grid grid-cols-2 border-t border-line sm:grid-cols-4">
        {angka.map((a, i) => (
          <div
            key={a.label}
            className={cn(
              "border-line p-4",
              i % 2 === 1 && "border-l sm:border-l",
              i >= 2 && "border-t sm:border-t-0",
              i !== 0 && "sm:border-l",
            )}
          >
            <p className="t-caption text-ink-muted">{a.label}</p>
            <p className="mt-1.5">
              <AngkaBergulir
                nilai={a.nilai}
                format={a.format}
                className="num text-[19px] font-semibold leading-6 tracking-[-0.01em] text-ink sm:text-[20px]"
              />
            </p>
            <Delta
              nilai={a.delta}
              jenis={a.jenisDelta}
              terbalik={a.terbalik}
              className="mt-1"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export { formatPersen, formatRupiahRingkas };
