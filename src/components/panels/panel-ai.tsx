"use client";

import * as React from "react";
import { RefreshCw, Sparkles, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatTanggalWaktu } from "@/lib/format";
import { Skeleton, Tombol } from "@/components/ui/primitives";

/**
 * Panel Analisis AI (DESIGN.md 3.7).
 * Ditandai garis kiri 3px ungu supaya jelas ini keluaran mesin, bukan
 * angka yang dihitung sistem. Kalau AI gagal, panel tetap tampil dengan
 * pesan yang jujur — angka statistik di halaman lain tetap berguna.
 */

export interface HasilAi {
  penilaian_risiko: {
    status: "aman" | "waspada" | "bahaya";
    skor: number;
    temuan_utama: string[];
    penjelasan: string;
  };
  proyeksi_naratif: {
    minggu_depan: string;
    bulan_depan: string;
    asumsi: string[];
  };
  rekomendasi: {
    kategori: string;
    prioritas: "tinggi" | "sedang" | "rendah";
    judul: string;
    aksi: string;
    dampak_estimasi: string;
    dasar_data: string;
  }[];
  peringatan: string[];
  ai_gagal?: boolean;
  model_digunakan?: string;
  dibuat_pada?: string;
}

const GAYA_STATUS_AI = {
  aman: "bg-fresh-bg text-fresh",
  waspada: "bg-watch-bg text-watch",
  bahaya: "bg-expired-bg text-expired",
} as const;

const GAYA_PRIORITAS = {
  tinggi: "bg-critical-bg text-critical",
  sedang: "bg-watch-bg text-watch",
  rendah: "bg-panel-sunken text-ink-muted",
} as const;

export function PanelAi({
  horizon = "next_week",
  className,
}: {
  horizon?: "next_week" | "next_month";
  className?: string;
}) {
  const [hasil, setHasil] = React.useState<HasilAi | null>(null);
  const [memuat, setMemuat] = React.useState(true);
  const [galat, setGalat] = React.useState<string | null>(null);
  const [dibuat, setDibuat] = React.useState<Date | null>(null);

  const ambil = React.useCallback(
    async (paksa = false) => {
      setMemuat(true);
      setGalat(null);
      try {
        const res = await fetch("/api/analisis-ai", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ horizon, paksa }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.pesan ?? "Permintaan ditolak.");
        setHasil(data);
        setDibuat(new Date(data.dibuat_pada ?? Date.now()));
      } catch (e) {
        setGalat(e instanceof Error ? e.message : "Gagal memanggil analisis.");
      } finally {
        setMemuat(false);
      }
    },
    [horizon],
  );

  React.useEffect(() => {
    void ambil();
  }, [ambil]);

  return (
    <section
      className={cn(
        "overflow-hidden rounded-panel border border-line bg-panel",
        className,
      )}
      style={{ boxShadow: "inset 3px 0 0 0 var(--role-admin)" }}
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3 pl-5">
        <Sparkles size={15} strokeWidth={1.5} style={{ color: "var(--role-admin)" }} />
        <h3 className="t-h3 text-ink">Analisis AI</h3>
        <span className="t-caption text-ink-faint">
          {dibuat ? `Dibuat ${formatTanggalWaktu(dibuat)}` : "Menyiapkan…"}
        </span>
        <button
          onClick={() => ambil(true)}
          disabled={memuat}
          className="ml-auto flex h-7 items-center gap-1.5 rounded-input border border-line px-2 text-[12px] text-ink-muted transition-colors hover:border-line-strong hover:text-ink disabled:opacity-50"
        >
          <RefreshCw
            size={12}
            strokeWidth={1.5}
            className={memuat ? "animate-spin" : undefined}
          />
          Muat ulang
        </button>
      </div>

      <div className="space-y-4 px-4 py-4 pl-5">
        {memuat && !hasil ? (
          <>
            <Skeleton className="h-6 w-28 rounded-[999px]" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-16 w-full rounded-panel" />
          </>
        ) : galat && !hasil ? (
          <div className="flex items-start gap-2.5 rounded-panel bg-panel-sunken p-3">
            <TriangleAlert
              size={16}
              strokeWidth={1.5}
              className="mt-0.5 shrink-0 text-watch"
            />
            <div>
              <p className="t-body-strong text-ink">
                Analisis naratif tidak tersedia saat ini.
              </p>
              <p className="t-small prose-width mt-1 text-ink-muted">
                {galat} Angka prediksi di halaman ini tetap berasal dari
                perhitungan sistem dan masih bisa dipakai.
              </p>
              <Tombol
                ukuran="sm"
                className="mt-2.5"
                onClick={() => ambil(true)}
              >
                Coba muat ulang
              </Tombol>
            </div>
          </div>
        ) : hasil ? (
          <>
            {hasil.ai_gagal ? (
              <p className="rounded-input bg-watch-bg px-2.5 py-2 text-[12px] text-watch">
                Keluaran model tidak lolos validasi. Yang ditampilkan di bawah
                adalah ringkasan dari perhitungan sistem.
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex h-7 items-center gap-2 rounded-[999px] px-3 text-[13px] font-semibold",
                  GAYA_STATUS_AI[hasil.penilaian_risiko.status],
                )}
              >
                <span className="h-2 w-2 rounded-full bg-current" />
                {hasil.penilaian_risiko.status.charAt(0).toUpperCase() +
                  hasil.penilaian_risiko.status.slice(1)}
              </span>
              {hasil.model_digunakan ? (
                <span className="t-caption text-ink-faint">
                  {hasil.model_digunakan}
                </span>
              ) : null}
            </div>

            <p className="t-body prose-width text-ink">
              {hasil.penilaian_risiko.penjelasan}
            </p>

            {hasil.penilaian_risiko.temuan_utama.length > 0 ? (
              <ul className="space-y-1">
                {hasil.penilaian_risiko.temuan_utama.map((t, i) => (
                  <li
                    key={i}
                    className="t-small flex gap-2 text-ink-muted"
                  >
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-faint" />
                    <span className="prose-width">{t}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            <div>
              <div className="mb-2 flex items-center gap-2">
                <h4 className="t-caption font-semibold uppercase tracking-wide text-ink-muted">
                  Rekomendasi
                </h4>
                <span className="h-px flex-1 bg-line" />
              </div>

              <ul className="space-y-2">
                {hasil.rekomendasi.map((r, i) => (
                  <li
                    key={i}
                    className="anim-rise rounded-panel border border-line bg-panel-sunken/50 p-3"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex h-[20px] items-center rounded-[999px] px-2 text-[11px] font-medium",
                          GAYA_PRIORITAS[r.prioritas] ?? GAYA_PRIORITAS.rendah,
                        )}
                      >
                        {r.prioritas.charAt(0).toUpperCase() +
                          r.prioritas.slice(1)}
                      </span>
                      <span className="t-caption text-ink-faint">
                        {r.kategori}
                      </span>
                    </div>

                    <p className="t-body-strong mt-1.5 text-ink">{r.judul}</p>
                    <p className="t-small prose-width mt-0.5 text-ink-muted">
                      {r.aksi}
                    </p>
                    <p className="t-caption mt-1.5 text-ink-faint">
                      <span className="font-medium text-ink-muted">Dasar:</span>{" "}
                      {r.dasar_data}
                    </p>
                    {r.dampak_estimasi ? (
                      <p className="t-caption mt-0.5 text-ink-faint">
                        <span className="font-medium text-ink-muted">
                          Perkiraan dampak:
                        </span>{" "}
                        {r.dampak_estimasi}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-panel bg-panel-sunken/60 p-3">
              <p className="t-caption font-medium text-ink-muted">
                Proyeksi {horizon === "next_week" ? "minggu depan" : "bulan depan"}
              </p>
              <p className="t-small prose-width mt-1 text-ink">
                {horizon === "next_week"
                  ? hasil.proyeksi_naratif.minggu_depan
                  : hasil.proyeksi_naratif.bulan_depan}
              </p>
            </div>

            {hasil.peringatan.length > 0 ? (
              <ul className="space-y-1">
                {hasil.peringatan.map((p, i) => (
                  <li
                    key={i}
                    className="t-caption flex items-start gap-1.5 text-watch"
                  >
                    <TriangleAlert
                      size={12}
                      strokeWidth={1.6}
                      className="mt-0.5 shrink-0"
                    />
                    <span className="prose-width">{p}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        ) : null}

        <p className="t-caption border-t border-line pt-3 text-ink-faint">
          Analisis dibuat AI dari data agregat. Angka prediksi berasal dari
          perhitungan sistem.
        </p>
      </div>
    </section>
  );
}
