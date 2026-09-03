"use client";

import * as React from "react";
import { ChevronRight, Download, Upload } from "lucide-react";

import { ImportWizard } from "@/components/panels/import-wizard";
import { PageHeader, Panel, Tombol } from "@/components/ui/primitives";
import { imporLog } from "@/lib/data/seed";
import { unduhTemplate } from "@/lib/import/parser";
import { formatAngka, formatTanggalWaktu } from "@/lib/format";
import { cn } from "@/lib/utils";

const CONTOH_ERROR: Record<string, string[]> = {
  "imp-2": [
    "Baris 41 — Baris kosong.",
    "Baris 88 — Nama bahan kosong.",
    "Baris 214 — SKU internal kosong (1Martabak Mini).",
    "Baris 302 — Jumlah kosong.",
    "Baris 415 — Total biaya tidak terbaca.",
    "Baris 501 — Tanggal pemesanan tidak terbaca.",
    "Baris 559 — Duplikat: SKU + tanggal + jumlah sama persis dengan baris 233.",
  ],
  "imp-3": ["Baris 62 — Harga jual kosong."],
  "imp-4": [
    "Seluruh 38 baris dibatalkan: kolom SKU tidak ditemukan di sheet.",
    "Impor bersifat transaksional — gagal sebagian berarti batal semua.",
  ],
};

export default function HalamanImpor() {
  const [wizard, setWizard] = React.useState<"restock" | "sales" | null>(null);
  const [terbuka, setTerbuka] = React.useState<string | null>(null);
  const [kabar, setKabar] = React.useState<string | null>(null);

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Riwayat impor"
        keterangan="Setiap impor tercatat lengkap dengan detail errornya, dan bisa dibatalkan dalam 24 jam."
        aksi={
          <>
            <Tombol ukuran="sm" onClick={() => unduhTemplate("sales")}>
              <Download size={14} strokeWidth={1.75} />
              Template penjualan
            </Tombol>
            <Tombol
              varian="utama"
              ukuran="sm"
              onClick={() => setWizard("sales")}
            >
              <Upload size={14} strokeWidth={1.75} />
              Impor baru
            </Tombol>
          </>
        }
      />

      {kabar ? (
        <div
          role="status"
          className="anim-rise rounded-panel border border-line bg-fresh-bg px-3 py-2.5 text-[13px] text-fresh"
        >
          {kabar}
        </div>
      ) : null}

      <Panel>
        <ul className="divide-y divide-line">
          {imporLog.map((l) => {
            const buka = terbuka === l.id;
            const error = CONTOH_ERROR[l.id] ?? [];
            return (
              <li key={l.id}>
                <button
                  onClick={() => setTerbuka(buka ? null : l.id)}
                  className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-left transition-colors hover:bg-panel-sunken/60"
                  aria-expanded={buka}
                  style={
                    l.status === "rolled_back"
                      ? { boxShadow: "inset 3px 0 0 0 var(--expired)" }
                      : l.jumlahGagal > 0
                        ? { boxShadow: "inset 3px 0 0 0 var(--watch)" }
                        : undefined
                  }
                >
                  <ChevronRight
                    size={14}
                    strokeWidth={1.75}
                    className={cn(
                      "shrink-0 text-ink-faint transition-transform",
                      buka && "rotate-90",
                    )}
                  />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium text-ink">
                      {l.namaFile}
                    </span>
                    <span className="t-caption block text-ink-muted">
                      {l.tipe === "sales" ? "Penjualan" : "Restock"} ·{" "}
                      {formatTanggalWaktu(l.createdAt)} · {l.createdBy}
                    </span>
                  </span>

                  <span className="ml-auto flex items-center gap-3">
                    <span className="num t-caption text-fresh">
                      {formatAngka(l.jumlahSukses)} sukses
                    </span>
                    {l.jumlahGagal > 0 ? (
                      <span className="num t-caption text-critical">
                        {formatAngka(l.jumlahGagal)} gagal
                      </span>
                    ) : null}
                    <span
                      className={cn(
                        "inline-flex h-[20px] items-center rounded-[999px] px-2 text-[11px] font-medium",
                        l.status === "applied"
                          ? "bg-fresh-bg text-fresh"
                          : l.status === "rolled_back"
                            ? "bg-expired-bg text-expired"
                            : "bg-watch-bg text-watch",
                      )}
                    >
                      {l.status === "applied"
                        ? "Diterapkan"
                        : l.status === "rolled_back"
                          ? "Dibatalkan"
                          : "Menunggu"}
                    </span>
                  </span>
                </button>

                {buka ? (
                  <div className="anim-fade border-t border-line bg-panel-sunken/40 px-4 py-3 pl-11">
                    {error.length === 0 ? (
                      <p className="t-small text-ink-muted">
                        Tidak ada baris bermasalah. Seluruh{" "}
                        {formatAngka(l.jumlahBaris)} baris masuk tanpa koreksi.
                      </p>
                    ) : (
                      <ul className="space-y-1">
                        {error.map((e, i) => (
                          <li key={i} className="t-small text-ink-muted">
                            {e}
                          </li>
                        ))}
                      </ul>
                    )}

                    {l.status === "applied" ? (
                      <Tombol
                        ukuran="sm"
                        varian="bahaya"
                        className="mt-3"
                        onClick={() =>
                          setKabar(`Impor ${l.namaFile} dibatalkan.`)
                        }
                      >
                        Batalkan impor ini
                      </Tombol>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </Panel>

      {wizard ? (
        <ImportWizard
          tipe={wizard}
          onTutup={() => setWizard(null)}
          onSelesai={(n) => {
            setWizard(null);
            setKabar(`${n} baris tersimpan ke sistem.`);
          }}
        />
      ) : null}
    </div>
  );
}
