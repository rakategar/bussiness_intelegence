"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatAngka, formatPoinPersen } from "@/lib/format";
import { Skeleton } from "./primitives";

/**
 * Angka bergulir 400ms saat nilai berubah (DESIGN.md bagian 5).
 * Hormati prefers-reduced-motion: langsung ke nilai akhir.
 */
export function AngkaBergulir({
  nilai,
  format,
  durasi = 400,
  className,
}: {
  nilai: number;
  format: (n: number) => string;
  durasi?: number;
  className?: string;
}) {
  const [tampil, setTampil] = React.useState(nilai);
  const dariRef = React.useRef(nilai);
  const rafRef = React.useRef<number | undefined>(undefined);

  React.useEffect(() => {
    const kurangiGerak =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (kurangiGerak) {
      dariRef.current = nilai;
      setTampil(nilai);
      return;
    }

    const dari = dariRef.current;
    const mulai = performance.now();

    const langkah = (t: number) => {
      const p = Math.min(1, (t - mulai) / durasi);
      // easeOutCubic — cepat di awal, mendarat halus
      const e = 1 - Math.pow(1 - p, 3);
      setTampil(dari + (nilai - dari) * e);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(langkah);
      } else {
        dariRef.current = nilai;
      }
    };

    rafRef.current = requestAnimationFrame(langkah);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      dariRef.current = nilai;
    };
  }, [nilai, durasi]);

  return <span className={className}>{format(tampil)}</span>;
}

export function Delta({
  nilai,
  jenis = "persen",
  className,
  terbalik,
}: {
  nilai: number;
  jenis?: "persen" | "pp";
  className?: string;
  /** Untuk metrik yang naiknya buruk (waste, risiko). */
  terbalik?: boolean;
}) {
  const naik = nilai > 0;
  const netral = Math.abs(nilai) < 0.05;
  const baik = terbalik ? !naik : naik;

  return (
    <span
      className={cn(
        "num inline-flex items-center gap-0.5 text-[13px] font-medium whitespace-nowrap",
        netral ? "text-ink-muted" : baik ? "text-gain" : "text-loss",
        className,
      )}
    >
      <span aria-hidden>{netral ? "→" : naik ? "↑" : "↓"}</span>
      {jenis === "pp"
        ? formatPoinPersen(nilai)
        : `${formatAngka(Math.abs(nilai), 1)}%`}
      <span className="sr-only">
        {netral ? "tidak berubah" : naik ? "naik" : "turun"}
      </span>
    </span>
  );
}

export function KpiCard({
  label,
  nilai,
  format,
  delta,
  jenisDelta,
  deltaTerbalik,
  pembanding,
  ikon,
  memuat,
  onClick,
  peringatan,
  className,
}: {
  label: string;
  nilai: number;
  format: (n: number) => string;
  delta?: number;
  jenisDelta?: "persen" | "pp";
  deltaTerbalik?: boolean;
  pembanding?: React.ReactNode;
  ikon?: React.ReactNode;
  memuat?: boolean;
  onClick?: () => void;
  peringatan?: boolean;
  className?: string;
}) {
  const Wadah = onClick ? "button" : "div";

  if (memuat) {
    return (
      <div className="rounded-panel border border-line bg-panel p-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-7 w-32" />
        <Skeleton className="mt-3 h-3 w-40" />
      </div>
    );
  }

  return (
    <Wadah
      onClick={onClick}
      className={cn(
        "block w-full rounded-panel border border-line bg-panel p-4 text-left transition-colors",
        onClick && "hover:border-line-strong hover:bg-panel-sunken/40",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="t-caption text-ink-muted">{label}</span>
        {peringatan ? (
          <span
            className="flex h-4 w-4 items-center justify-center rounded-full bg-watch-bg text-[11px] font-bold text-watch"
            aria-label="perlu perhatian"
          >
            !
          </span>
        ) : ikon ? (
          <span className="text-ink-faint">{ikon}</span>
        ) : null}
      </div>

      <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <AngkaBergulir
          nilai={nilai}
          format={format}
          className="t-num-lg text-ink"
        />
        {delta !== undefined ? (
          <Delta nilai={delta} jenis={jenisDelta} terbalik={deltaTerbalik} />
        ) : null}
      </div>

      {pembanding ? (
        <p className="t-caption mt-2 text-ink-faint">{pembanding}</p>
      ) : null}
    </Wadah>
  );
}
