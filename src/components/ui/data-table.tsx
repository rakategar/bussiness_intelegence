"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { EmptyState, Isian, Pilihan } from "./primitives";
import { Search } from "lucide-react";

export interface Kolom<T> {
  kunci: string;
  judul: string;
  /** Isi sel. */
  sel: (baris: T) => React.ReactNode;
  /** Nilai untuk pengurutan; kalau tidak ada, kolom tidak bisa diurutkan. */
  urut?: (baris: T) => number | string;
  /** Kolom angka: rata kanan + font mono. */
  angka?: boolean;
  lebar?: string;
  /** Sembunyikan di layar sempit walau tabel masih bentuk tabel. */
  sekunder?: boolean;
}

export interface FilterTabel {
  kunci: string;
  label: string;
  opsi: { nilai: string; label: string }[];
}

export function DataTable<T>({
  data,
  kolom,
  kunciBaris,
  cari,
  filter,
  nilaiFilter,
  onUbahFilter,
  onKlikBaris,
  barisTerpilih,
  garisKiri,
  kartuMobile,
  kosong,
  perHalaman = 50,
  aksiKanan,
  tinggiMaks = "70vh",
  barisBaru,
}: {
  data: T[];
  kolom: Kolom<T>[];
  kunciBaris: (baris: T) => string;
  /** Teks yang dipakai pencarian. Kalau tidak diisi, kotak cari disembunyikan. */
  cari?: (baris: T) => string;
  filter?: FilterTabel[];
  nilaiFilter?: Record<string, string>;
  onUbahFilter?: (kunci: string, nilai: string) => void;
  onKlikBaris?: (baris: T) => void;
  barisTerpilih?: (baris: T) => boolean;
  /** Garis kiri 3px, mis. merah untuk batch kadaluarsa. */
  garisKiri?: (baris: T) => string | undefined;
  /** Tampilan kartu di layar < 640px. */
  kartuMobile?: (baris: T) => React.ReactNode;
  kosong?: React.ReactNode;
  perHalaman?: number;
  aksiKanan?: React.ReactNode;
  tinggiMaks?: string;
  /** Kunci baris yang baru masuk — disorot hijau 1,2 detik. */
  barisBaru?: Set<string>;
}) {
  const [kueri, setKueri] = React.useState("");
  const [urutan, setUrutan] = React.useState<{
    kunci: string;
    arah: "asc" | "desc";
  } | null>(null);
  const [halaman, setHalaman] = React.useState(0);

  const tersaring = React.useMemo(() => {
    let hasil = data;
    if (kueri.trim() && cari) {
      const q = kueri.trim().toLowerCase();
      hasil = hasil.filter((b) => cari(b).toLowerCase().includes(q));
    }
    if (urutan) {
      const k = kolom.find((c) => c.kunci === urutan.kunci);
      if (k?.urut) {
        hasil = [...hasil].sort((a, b) => {
          const va = k.urut!(a);
          const vb = k.urut!(b);
          const cmp =
            typeof va === "number" && typeof vb === "number"
              ? va - vb
              : String(va).localeCompare(String(vb), "id");
          return urutan.arah === "asc" ? cmp : -cmp;
        });
      }
    }
    return hasil;
  }, [data, kueri, urutan, kolom, cari]);

  // Balik ke halaman pertama saat pencarian, urutan, atau datanya berganti.
  // Penyesuaian dilakukan saat render, bukan lewat efek — pola yang
  // direkomendasikan React untuk state turunan.
  const tanda = `${kueri}|${urutan?.kunci ?? ""}|${urutan?.arah ?? ""}|${data.length}`;
  const [tandaSebelumnya, setTandaSebelumnya] = React.useState(tanda);
  if (tanda !== tandaSebelumnya) {
    setTandaSebelumnya(tanda);
    setHalaman(0);
  }

  const totalHalaman = Math.max(1, Math.ceil(tersaring.length / perHalaman));
  const halamanAman = Math.min(halaman, totalHalaman - 1);
  const terlihat = tersaring.slice(
    halamanAman * perHalaman,
    (halamanAman + 1) * perHalaman,
  );

  const ubahUrutan = (kunci: string) => {
    setUrutan((u) =>
      u?.kunci === kunci
        ? { kunci, arah: u.arah === "asc" ? "desc" : "asc" }
        : { kunci, arah: "asc" },
    );
  };

  const punyaBilah = Boolean(cari || filter?.length || aksiKanan);

  return (
    <div className="rounded-panel border border-line bg-panel">
      {punyaBilah ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2.5">
          {cari ? (
            <div className="relative min-w-0 flex-1 sm:max-w-64">
              <Search
                size={14}
                strokeWidth={1.5}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint"
              />
              <Isian
                value={kueri}
                onChange={(e) => setKueri(e.target.value)}
                placeholder="Cari…"
                aria-label="Cari di tabel"
                className="h-9 pl-8 text-[13px]"
              />
            </div>
          ) : null}

          {filter?.map((f) => (
            <Pilihan
              key={f.kunci}
              value={nilaiFilter?.[f.kunci] ?? ""}
              onChange={(e) => onUbahFilter?.(f.kunci, e.target.value)}
              aria-label={f.label}
            >
              <option value="">{f.label}</option>
              {f.opsi.map((o) => (
                <option key={o.nilai} value={o.nilai}>
                  {o.label}
                </option>
              ))}
            </Pilihan>
          ))}

          <div className="ml-auto flex items-center gap-2">
            <span className="num t-caption whitespace-nowrap text-ink-faint">
              {tersaring.length} baris
            </span>
            {aksiKanan}
          </div>
        </div>
      ) : null}

      {tersaring.length === 0 ? (
        kosong ?? (
          <EmptyState
            judul="Tidak ada baris yang cocok"
            penjelasan="Ubah kata kunci pencarian atau kosongkan filternya."
          />
        )
      ) : (
        <>
          {/* --- Tabel: md ke atas --- */}
          <div
            className={cn(
              "scroll-thin hidden overflow-auto sm:block",
              kartuMobile ? "" : "block",
            )}
            style={{ maxHeight: tinggiMaks }}
          >
            <table className="w-full border-collapse text-[13px]">
              <thead className="sticky top-0 z-10">
                <tr>
                  {kolom.map((k) => {
                    const aktif = urutan?.kunci === k.kunci;
                    return (
                      <th
                        key={k.kunci}
                        scope="col"
                        aria-sort={
                          !k.urut
                            ? undefined
                            : aktif
                              ? urutan.arah === "asc"
                                ? "ascending"
                                : "descending"
                              : "none"
                        }
                        style={k.lebar ? { width: k.lebar } : undefined}
                        className={cn(
                          "border-b border-line bg-panel-sunken px-3 py-2 text-[12px] font-medium text-ink-muted",
                          k.angka ? "text-right" : "text-left",
                          k.sekunder && "hidden lg:table-cell",
                        )}
                      >
                        {k.urut ? (
                          <button
                            onClick={() => ubahUrutan(k.kunci)}
                            className={cn(
                              "inline-flex items-center gap-1 transition-colors hover:text-ink",
                              aktif && "text-ink",
                            )}
                          >
                            {k.judul}
                            <span
                              className={cn(
                                "text-[9px] transition-opacity",
                                aktif ? "opacity-100" : "opacity-25",
                              )}
                              aria-hidden
                            >
                              {aktif && urutan.arah === "desc" ? "▼" : "▲"}
                            </span>
                          </button>
                        ) : (
                          k.judul
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {terlihat.map((baris) => {
                  const id = kunciBaris(baris);
                  const terpilih = barisTerpilih?.(baris);
                  const garis = garisKiri?.(baris);
                  return (
                    <tr
                      key={id}
                      onClick={onKlikBaris ? () => onKlikBaris(baris) : undefined}
                      tabIndex={onKlikBaris ? 0 : undefined}
                      onKeyDown={
                        onKlikBaris
                          ? (e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                onKlikBaris(baris);
                              }
                            }
                          : undefined
                      }
                      className={cn(
                        "group border-b border-line last:border-0 transition-colors",
                        onKlikBaris && "cursor-pointer",
                        terpilih
                          ? "bg-brand-soft"
                          : "hover:bg-panel-sunken/70",
                        barisBaru?.has(id) && "anim-highlight",
                      )}
                      style={
                        garis || terpilih
                          ? {
                              boxShadow: `inset ${terpilih ? 2 : 3}px 0 0 0 ${
                                terpilih ? "var(--brand)" : garis
                              }`,
                            }
                          : undefined
                      }
                    >
                      {kolom.map((k) => (
                        <td
                          key={k.kunci}
                          className={cn(
                            "h-10 px-3 align-middle text-ink",
                            k.angka ? "num text-right" : "text-left",
                            k.sekunder && "hidden lg:table-cell",
                          )}
                        >
                          {k.sel(baris)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* --- Kartu: < 640px --- */}
          {kartuMobile ? (
            <div className="divide-y divide-line sm:hidden">
              {terlihat.map((baris) => {
                const id = kunciBaris(baris);
                const garis = garisKiri?.(baris);
                return (
                  <div
                    key={id}
                    onClick={onKlikBaris ? () => onKlikBaris(baris) : undefined}
                    className={cn(
                      "px-3 py-3",
                      onKlikBaris && "cursor-pointer active:bg-panel-sunken",
                      barisBaru?.has(id) && "anim-highlight",
                    )}
                    style={
                      garis
                        ? { boxShadow: `inset 3px 0 0 0 ${garis}` }
                        : undefined
                    }
                  >
                    {kartuMobile(baris)}
                  </div>
                );
              })}
            </div>
          ) : null}

          {totalHalaman > 1 ? (
            <div className="flex items-center justify-between gap-2 border-t border-line px-3 py-2">
              <span className="t-caption num text-ink-faint">
                {halamanAman * perHalaman + 1}–
                {Math.min((halamanAman + 1) * perHalaman, tersaring.length)} dari{" "}
                {tersaring.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setHalaman((h) => Math.max(0, h - 1))}
                  disabled={halamanAman === 0}
                  className="h-7 rounded-input border border-line-strong px-2 text-[12px] text-ink disabled:opacity-40"
                >
                  Sebelumnya
                </button>
                <span className="num t-caption px-1.5 text-ink-muted">
                  {halamanAman + 1}/{totalHalaman}
                </span>
                <button
                  onClick={() =>
                    setHalaman((h) => Math.min(totalHalaman - 1, h + 1))
                  }
                  disabled={halamanAman >= totalHalaman - 1}
                  className="h-7 rounded-input border border-line-strong px-2 text-[12px] text-ink disabled:opacity-40"
                >
                  Berikutnya
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
