"use client";

import * as React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRupiah } from "@/lib/format";
import {
  menuTanpaResep,
  risikoKadaluarsa,
  semuaStok,
  totalNilaiRisiko,
} from "@/lib/data/queries";
import type { Peran } from "@/lib/types";

interface Butir {
  id: string;
  judul: string;
  detail: string;
  href: string;
  nada: "kritis" | "waspada" | "info";
}

function butirUntuk(peran: Peran): Butir[] {
  const daftar: Butir[] = [];

  if (peran === "stock" || peran === "owner") {
    const kritis = risikoKadaluarsa(3);
    if (kritis.length > 0) {
      daftar.push({
        id: "exp-kritis",
        judul: `${kritis.length} batch masuk zona kritis`,
        detail: `Sisa 3 hari atau kurang. Total ${formatRupiah(
          kritis.reduce((t, r) => t + r.nilaiRisiko, 0),
        )} berisiko.`,
        href: peran === "stock" ? "/stock/kadaluarsa" : "/owner/bahan",
        nada: "kritis",
      });
    }

    const menipis = semuaStok().filter((s) => s.perluRestock);
    if (menipis.length > 0) {
      daftar.push({
        id: "stok-menipis",
        judul: `${menipis.length} bahan di bawah titik pesan ulang`,
        detail: "Sisa hari lebih pendek dari lead time pemasok.",
        href: peran === "stock" ? "/stock/bahan" : "/owner/bahan",
        nada: "waspada",
      });
    }

    if (peran === "owner") {
      daftar.push({
        id: "risiko-total",
        judul: "Nilai bahan berisiko kadaluarsa",
        detail: `${formatRupiah(totalNilaiRisiko())} dalam 7 hari ke depan.`,
        href: "/owner/bahan",
        nada: "info",
      });
    }
  }

  if (peran === "admin") {
    daftar.push({
      id: "penjualan-belum",
      judul: "Data penjualan minggu ini belum diunggah",
      detail: "Sudah lewat hari Selasa. Unggah rekap dari kasir.",
      href: "/admin/penjualan",
      nada: "waspada",
    });
    const tanpa = menuTanpaResep();
    if (tanpa.length > 0) {
      daftar.push({
        id: "tanpa-resep",
        judul: `${tanpa.length} menu belum punya resep`,
        detail: "Menu ini tidak masuk hitungan HPP dan konsumsi bahan.",
        href: "/admin/menu",
        nada: "waspada",
      });
    }
  }

  return daftar;
}

const NADA = {
  kritis: "bg-critical",
  waspada: "bg-watch",
  info: "bg-brand",
} as const;

export function Notifikasi({ peran }: { peran: Peran }) {
  const [buka, setBuka] = React.useState(false);
  const butir = React.useMemo(() => butirUntuk(peran), [peran]);

  return (
    <div className="relative">
      <button
        onClick={() => setBuka((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-input text-ink-muted transition-colors hover:bg-panel-sunken hover:text-ink"
        aria-label={`Notifikasi, ${butir.length} butir`}
        aria-expanded={buka}
      >
        <Bell size={17} strokeWidth={1.5} />
        {butir.length > 0 ? (
          <span className="num absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-critical px-1 text-[10px] font-semibold text-white">
            {butir.length}
          </span>
        ) : null}
      </button>

      {buka ? (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setBuka(false)}
            aria-hidden
          />
          <div className="anim-rise absolute right-0 top-11 z-50 w-[min(21rem,calc(100vw-1.5rem))] overflow-hidden rounded-modal border border-line bg-panel shadow-[var(--shadow-dropdown)]">
            <div className="border-b border-line px-3 py-2">
              <p className="t-h3 text-ink">Notifikasi</p>
            </div>

            {butir.length === 0 ? (
              <p className="px-3 py-6 text-center text-[13px] text-ink-muted">
                Tidak ada yang perlu ditindaklanjuti. Semua batch masih di atas
                7 hari.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {butir.map((b) => (
                  <li key={b.id}>
                    <Link
                      href={b.href}
                      onClick={() => setBuka(false)}
                      className="flex gap-2.5 px-3 py-2.5 transition-colors hover:bg-panel-sunken"
                    >
                      <span
                        className={cn(
                          "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                          NADA[b.nada],
                        )}
                      />
                      <span className="min-w-0">
                        <span className="block text-[13px] font-medium text-ink">
                          {b.judul}
                        </span>
                        <span className="t-caption block text-ink-muted">
                          {b.detail}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
