import * as React from "react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------
   Panel — kartu dibatasi garis, tanpa bayangan (DESIGN.md 2.3)
   ------------------------------------------------------------------------- */

export function Panel({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-panel border border-line bg-panel",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function PanelHeader({
  judul,
  keterangan,
  aksi,
  className,
}: {
  judul: React.ReactNode;
  keterangan?: React.ReactNode;
  aksi?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 border-b border-line px-4 py-3",
        className,
      )}
    >
      <div className="min-w-0">
        <h3 className="t-h3 text-ink">{judul}</h3>
        {keterangan ? (
          <p className="t-caption mt-0.5 text-ink-muted">{keterangan}</p>
        ) : null}
      </div>
      {aksi ? <div className="shrink-0">{aksi}</div> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Tombol
   ------------------------------------------------------------------------- */

type VarianTombol = "utama" | "sekunder" | "halus" | "bahaya";
type UkuranTombol = "sm" | "md";

const GAYA_TOMBOL: Record<VarianTombol, string> = {
  utama:
    "bg-brand text-brand-on border border-brand hover:bg-brand-hover disabled:opacity-45",
  sekunder:
    "bg-panel text-ink border border-line-strong hover:bg-panel-sunken disabled:opacity-45",
  halus:
    "bg-transparent text-ink-muted border border-transparent hover:bg-panel-sunken hover:text-ink",
  bahaya:
    "bg-panel text-expired border border-expired/40 hover:bg-expired-bg",
};

const UKURAN_TOMBOL: Record<UkuranTombol, string> = {
  sm: "h-8 px-2.5 text-[13px] gap-1.5",
  md: "h-10 px-3.5 text-[14px] gap-2",
};

export const Tombol = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    varian?: VarianTombol;
    ukuran?: UkuranTombol;
  }
>(function Tombol(
  { className, varian = "sekunder", ukuran = "md", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex select-none items-center justify-center rounded-input font-medium transition-colors",
        "disabled:cursor-not-allowed",
        GAYA_TOMBOL[varian],
        UKURAN_TOMBOL[ukuran],
        className,
      )}
      {...rest}
    />
  );
});

/* -------------------------------------------------------------------------
   Isian
   ------------------------------------------------------------------------- */

export const Isian = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { terhitung?: boolean }
>(function Isian({ className, terhitung, ...rest }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-input border border-line-strong px-2.5 text-[14px] text-ink",
        "placeholder:text-ink-faint",
        terhitung ? "bg-brand-soft" : "bg-panel",
        className,
      )}
      {...rest}
    />
  );
});

export const Pilihan = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Pilihan({ className, ...rest }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        "h-9 rounded-input border border-line-strong bg-panel px-2 text-[13px] text-ink",
        className,
      )}
      {...rest}
    />
  );
});

export function Label({
  children,
  wajib,
  bantuan,
  className,
  htmlFor,
}: {
  children: React.ReactNode;
  wajib?: boolean;
  bantuan?: string;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={cn("mb-1", className)}>
      <label htmlFor={htmlFor} className="t-caption font-medium text-ink">
        {children}
        {wajib ? <span className="text-expired"> *</span> : null}
      </label>
      {bantuan ? (
        <p className="t-caption mt-0.5 text-ink-muted">{bantuan}</p>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Judul halaman
   ------------------------------------------------------------------------- */

export function PageHeader({
  judul,
  keterangan,
  aksi,
}: {
  judul: string;
  keterangan?: React.ReactNode;
  aksi?: React.ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="t-h1 text-ink">{judul}</h1>
        {keterangan ? (
          <p className="t-small prose-width mt-1 text-ink-muted">
            {keterangan}
          </p>
        ) : null}
      </div>
      {aksi ? (
        <div className="flex flex-wrap items-center gap-2">{aksi}</div>
      ) : null}
    </header>
  );
}

/* -------------------------------------------------------------------------
   Keadaan kosong — selalu berisi arahan, bukan "tidak ada data"
   ------------------------------------------------------------------------- */

export function EmptyState({
  ikon,
  judul,
  penjelasan,
  aksi,
  nada = "netral",
}: {
  ikon?: React.ReactNode;
  judul: string;
  penjelasan: string;
  aksi?: React.ReactNode;
  nada?: "netral" | "baik";
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      {ikon ? (
        <div
          className={cn(
            "mb-3 flex h-10 w-10 items-center justify-center rounded-panel",
            nada === "baik" ? "bg-fresh-bg text-fresh" : "bg-panel-sunken text-ink-muted",
          )}
        >
          {ikon}
        </div>
      ) : null}
      <h3 className="t-h3 text-ink">{judul}</h3>
      <p className="t-small prose-width mt-1.5 text-ink-muted">{penjelasan}</p>
      {aksi ? (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {aksi}
        </div>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Kerangka muat
   ------------------------------------------------------------------------- */

export function Skeleton({
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton", className)} aria-hidden {...rest} />;
}

/* -------------------------------------------------------------------------
   Angka rupiah — prefiks "Rp" diredam (DESIGN.md prinsip 3)
   ------------------------------------------------------------------------- */

export function Rupiah({
  nilai,
  className,
  ringkas,
  desimal = 0,
}: {
  nilai: number;
  className?: string;
  ringkas?: boolean;
  desimal?: number;
}) {
  const teks = ringkas
    ? angkaRingkasLokal(nilai)
    : new Intl.NumberFormat("id-ID", {
        minimumFractionDigits: desimal,
        maximumFractionDigits: desimal,
      }).format(nilai);
  return (
    <span className={cn("num whitespace-nowrap", className)}>
      <span className="mr-1 text-[0.82em] font-normal text-ink-muted">Rp</span>
      {teks}
    </span>
  );
}

function angkaRingkasLokal(nilai: number): string {
  const f = (n: number, d: number) =>
    new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    }).format(n);
  const abs = Math.abs(nilai);
  if (abs >= 1_000_000_000) return `${f(nilai / 1_000_000_000, 1)} M`;
  if (abs >= 1_000_000) return `${f(nilai / 1_000_000, 1)} jt`;
  if (abs >= 1_000) return `${f(nilai / 1_000, 0)}k`;
  return f(nilai, 0);
}

/* -------------------------------------------------------------------------
   Pil kecil serbaguna
   ------------------------------------------------------------------------- */

export function Pil({
  children,
  className,
  warna,
}: {
  children: React.ReactNode;
  className?: string;
  warna?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-1.5 rounded-[999px] px-2 text-[12px] leading-none",
        warna ?? "bg-panel-sunken text-ink-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------
   Tab sederhana
   ------------------------------------------------------------------------- */

export function Tabs<T extends string>({
  nilai,
  onUbah,
  daftar,
  className,
}: {
  nilai: T;
  onUbah: (v: T) => void;
  daftar: { nilai: T; label: React.ReactNode; jumlah?: number }[];
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex flex-wrap items-center gap-1 rounded-input bg-panel-sunken p-1",
        className,
      )}
    >
      {daftar.map((t) => {
        const aktif = t.nilai === nilai;
        return (
          <button
            key={t.nilai}
            role="tab"
            aria-selected={aktif}
            onClick={() => onUbah(t.nilai)}
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-[3px] px-2.5 text-[13px] transition-colors",
              aktif
                ? "bg-panel font-medium text-ink shadow-[0_1px_2px_rgba(20,24,29,0.06)]"
                : "text-ink-muted hover:text-ink",
            )}
          >
            {t.label}
            {t.jumlah !== undefined ? (
              <span className="num text-[11px] text-ink-faint">{t.jumlah}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
