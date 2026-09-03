"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Table2, LineChart as IkonGrafik } from "lucide-react";

/**
 * Bingkai grafik: judul, legenda mendatar di atas, dan tombol
 * "Lihat sebagai tabel" untuk aksesibilitas (DESIGN.md 3.5 & bagian 6).
 */
export function ChartFrame({
  judul,
  keterangan,
  legenda,
  aksi,
  tabel,
  tinggi = 280,
  children,
  className,
}: {
  judul: React.ReactNode;
  keterangan?: React.ReactNode;
  legenda?: { label: string; warna: string; putus?: boolean }[];
  aksi?: React.ReactNode;
  /** Tabel setara isi grafik. */
  tabel?: React.ReactNode;
  tinggi?: number;
  children: React.ReactNode;
  className?: string;
}) {
  const [modeTabel, setModeTabel] = React.useState(false);

  return (
    <section
      className={cn(
        "flex flex-col rounded-panel border border-line bg-panel",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <h3 className="t-h3 text-ink">{judul}</h3>
          {keterangan ? (
            <p className="t-caption mt-0.5 text-ink-muted">{keterangan}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5">
          {aksi}
          {tabel ? (
            <button
              onClick={() => setModeTabel((v) => !v)}
              className="inline-flex h-7 items-center gap-1.5 rounded-input border border-line px-2 text-[12px] text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
              aria-pressed={modeTabel}
            >
              {modeTabel ? <IkonGrafik size={13} strokeWidth={1.5} /> : <Table2 size={13} strokeWidth={1.5} />}
              {modeTabel ? "Lihat grafik" : "Lihat sebagai tabel"}
            </button>
          ) : null}
        </div>
      </div>

      {legenda?.length ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 pt-3">
          {legenda.map((l) => (
            <span
              key={l.label}
              className="inline-flex items-center gap-1.5 text-[12px] text-ink-muted"
            >
              <span
                className="inline-block h-0.5 w-4 rounded-full"
                style={
                  l.putus
                    ? {
                        backgroundImage: `repeating-linear-gradient(90deg, ${l.warna} 0 3px, transparent 3px 6px)`,
                      }
                    : { background: l.warna }
                }
              />
              {l.label}
            </span>
          ))}
        </div>
      ) : null}

      <div className="min-w-0 flex-1 p-3">
        {modeTabel && tabel ? (
          <div
            className="scroll-thin overflow-auto"
            style={{ maxHeight: tinggi + 24 }}
          >
            {tabel}
          </div>
        ) : (
          <div style={{ height: tinggi }} className="anim-fade">
            {children}
          </div>
        )}
      </div>
    </section>
  );
}

/** Tabel setara sederhana untuk tombol "Lihat sebagai tabel". */
export function TabelSetara({
  kepala,
  baris,
}: {
  kepala: string[];
  baris: (string | number)[][];
}) {
  return (
    <table className="w-full border-collapse text-[13px]">
      <thead className="sticky top-0">
        <tr>
          {kepala.map((h, i) => (
            <th
              key={h}
              scope="col"
              className={cn(
                "border-b border-line bg-panel-sunken px-2.5 py-1.5 text-[12px] font-medium text-ink-muted",
                i === 0 ? "text-left" : "text-right",
              )}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {baris.map((r, i) => (
          <tr key={i} className="border-b border-line last:border-0">
            {r.map((sel, j) => (
              <td
                key={j}
                className={cn(
                  "h-8 px-2.5 text-ink",
                  j === 0 ? "text-left" : "num text-right",
                )}
              >
                {sel}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Tooltip bergaya panel, dipakai semua grafik. */
export function TooltipKustom({
  judul,
  baris,
}: {
  judul: React.ReactNode;
  baris: { label: string; nilai: React.ReactNode; warna?: string }[];
}) {
  return (
    <div className="rounded-input border border-line bg-panel px-2.5 py-2 shadow-[var(--shadow-dropdown)]">
      <p className="t-caption mb-1 font-medium text-ink">{judul}</p>
      <div className="space-y-0.5">
        {baris.map((b) => (
          <div
            key={b.label}
            className="flex items-center gap-3 text-[12px] leading-4"
          >
            {b.warna ? (
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: b.warna }}
              />
            ) : null}
            <span className="text-ink-muted">{b.label}</span>
            <span className="num ml-auto font-medium text-ink">{b.nilai}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const GAYA_SUMBU = {
  tick: { fill: "var(--ink-faint)", fontSize: 11 },
  line: { stroke: "var(--line)" },
} as const;
