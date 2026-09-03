"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Copy, Plus, Trash2 } from "lucide-react";

import { ChartFrame, TabelSetara } from "@/components/charts/chart-frame";
import { Sparkline } from "@/components/charts";
import {
  EmptyState,
  Isian,
  Label,
  Panel,
  PanelHeader,
  Pilihan,
  Rupiah,
  Tombol,
} from "@/components/ui/primitives";
import { AngkaBergulir } from "@/components/ui/kpi-card";
import {
  bahanPerId,
  menuPerId,
  penjualanBulananMenu,
  penjualanMingguanMenu,
  resepMenu,
} from "@/lib/data/queries";
import { bahan, menu as semuaMenu } from "@/lib/data/seed";
import { LABEL_KATEGORI_MENU, gayaMargin } from "@/lib/status";
import {
  formatAngka,
  formatAngkaLuwes,
  formatPersen,
  formatRupiah,
} from "@/lib/format";
import { cn } from "@/lib/utils";

interface BarisResep {
  key: string;
  ingredientId: string;
  qty: string;
}

export default function DetailMenu() {
  const params = useParams<{ id: string }>();
  const m = menuPerId.get(params.id);

  const [baris, setBaris] = React.useState<BarisResep[]>(() =>
    resepMenu(params.id).map((r) => ({
      key: r.id,
      ingredientId: r.ingredientId,
      qty: String(r.qtyPerPorsi),
    })),
  );
  const [harga, setHarga] = React.useState(String(m?.hargaJual ?? 0));
  const [kabar, setKabar] = React.useState<string | null>(null);

  const trenMingguan = React.useMemo(
    () => penjualanMingguanMenu(params.id, 12),
    [params.id],
  );
  const trenBulanan = React.useMemo(
    () => penjualanBulananMenu(params.id),
    [params.id],
  );

  if (!m) {
    return (
      <Panel>
        <EmptyState
          judul="Menu tidak ditemukan"
          penjelasan="Menu dengan ID ini tidak ada di sistem. Mungkin sudah dihapus."
          aksi={
            <Link href="/admin/menu">
              <Tombol varian="utama">Kembali ke daftar menu</Tombol>
            </Link>
          }
        />
      </Panel>
    );
  }

  // HPP dan margin terhitung ulang langsung tiap resep diubah, sebelum disimpan.
  const rincian = baris.map((b) => {
    const bh = bahanPerId.get(b.ingredientId)!;
    const qty = Number(b.qty) || 0;
    return {
      ...b,
      bahan: bh,
      qty,
      subtotal: qty * bh.hargaPerUnitTerakhir,
    };
  });

  const hpp = rincian.reduce((t, r) => t + r.subtotal, 0);
  const hargaAngka = Number(harga) || 0;
  const marginRp = hargaAngka - hpp;
  const marginPersen = hargaAngka ? (marginRp / hargaAngka) * 100 : 0;

  const tambahBaris = () => {
    const belumDipakai = bahan.find(
      (b) => !baris.some((r) => r.ingredientId === b.id),
    );
    if (!belumDipakai) return;
    setBaris((s) => [
      ...s,
      {
        key: `baru-${Date.now()}`,
        ingredientId: belumDipakai.id,
        qty: "",
      },
    ]);
  };

  const duplikatDari = (menuId: string) => {
    const sumber = resepMenu(menuId);
    setBaris(
      sumber.map((r, i) => ({
        key: `dup-${i}`,
        ingredientId: r.ingredientId,
        qty: String(r.qtyPerPorsi),
      })),
    );
    setKabar(
      `Resep disalin dari ${menuPerId.get(menuId)?.nama}. Sesuaikan takarannya sebelum menyimpan.`,
    );
  };

  return (
    <div className="space-y-4">
      <Link
        href="/admin/menu"
        className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={14} strokeWidth={1.75} />
        Semua menu
      </Link>

      {/* --- Info menu --- */}
      <Panel className="p-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Label htmlFor="nama-menu">Nama menu</Label>
              <Isian id="nama-menu" defaultValue={m.nama} />
            </div>
            <div>
              <Label htmlFor="sku-menu">SKU</Label>
              <Isian id="sku-menu" defaultValue={m.sku} className="num" />
            </div>
            <div>
              <Label htmlFor="kat-menu">Kategori</Label>
              <Pilihan
                id="kat-menu"
                defaultValue={m.kategori}
                className="h-10 w-full text-[14px]"
              >
                {Object.entries(LABEL_KATEGORI_MENU).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Pilihan>
            </div>
            <div>
              <Label htmlFor="harga-menu" wajib>
                Harga jual (Rp)
              </Label>
              <Isian
                id="harga-menu"
                type="number"
                value={harga}
                onChange={(e) => setHarga(e.target.value)}
              />
            </div>
          </div>
        </div>
      </Panel>

      {kabar ? (
        <div
          role="status"
          aria-live="polite"
          className="anim-rise flex items-center gap-2 rounded-panel border border-line bg-brand-soft px-3 py-2.5 text-[13px] text-brand"
        >
          {kabar}
          <button
            onClick={() => setKabar(null)}
            className="ml-auto text-[12px] underline"
          >
            Tutup
          </button>
        </div>
      ) : null}

      {/* --- Editor resep --- */}
      <Panel>
        <PanelHeader
          judul="Resep per porsi"
          keterangan="HPP dan margin terhitung ulang langsung, sebelum disimpan."
          aksi={
            <div className="flex items-center gap-2">
              <Pilihan
                defaultValue=""
                onChange={(e) => e.target.value && duplikatDari(e.target.value)}
                aria-label="Duplikat resep dari menu lain"
              >
                <option value="">Duplikat dari menu lain…</option>
                {semuaMenu
                  .filter(
                    (x) => x.id !== m.id && resepMenu(x.id).length > 0,
                  )
                  .map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.nama}
                    </option>
                  ))}
              </Pilihan>
              <Tombol ukuran="sm" onClick={tambahBaris}>
                <Plus size={13} strokeWidth={1.75} />
                Tambah bahan
              </Tombol>
            </div>
          }
        />

        {rincian.length === 0 ? (
          <EmptyState
            judul="Resep belum diisi"
            penjelasan="Tanpa resep, menu ini tidak masuk hitungan HPP dan penjualannya tidak mengurangi stok bahan apa pun."
            aksi={
              <>
                <Tombol varian="utama" onClick={tambahBaris}>
                  Tambah bahan pertama
                </Tombol>
                <Tombol
                  onClick={() => {
                    const contoh = semuaMenu.find(
                      (x) =>
                        x.kategori === m.kategori && resepMenu(x.id).length > 0,
                    );
                    if (contoh) duplikatDari(contoh.id);
                  }}
                >
                  <Copy size={14} strokeWidth={1.75} />
                  Salin dari menu sekategori
                </Tombol>
              </>
            }
          />
        ) : (
          <div className="scroll-thin overflow-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  {[
                    "Bahan",
                    "Qty per porsi",
                    "Satuan",
                    "Biaya per unit",
                    "Subtotal",
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
                {rincian.map((r) => (
                  <tr key={r.key} className="border-b border-line last:border-0">
                    <td className="p-1.5">
                      <Pilihan
                        value={r.ingredientId}
                        onChange={(e) =>
                          setBaris((s) =>
                            s.map((x) =>
                              x.key === r.key
                                ? { ...x, ingredientId: e.target.value }
                                : x,
                            ),
                          )
                        }
                        className="w-full min-w-40"
                        aria-label="Bahan"
                      >
                        {bahan.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.nama}
                          </option>
                        ))}
                      </Pilihan>
                    </td>
                    <td className="p-1.5">
                      <Isian
                        type="number"
                        inputMode="decimal"
                        value={r.qty}
                        onChange={(e) =>
                          setBaris((s) =>
                            s.map((x) =>
                              x.key === r.key
                                ? { ...x, qty: e.target.value }
                                : x,
                            ),
                          )
                        }
                        className="h-9 w-28 text-[13px]"
                        aria-label="Qty per porsi"
                      />
                    </td>
                    <td className="px-3 text-ink-muted">
                      {/* Satuan terisi otomatis dari bahan, tidak bisa diubah
                          — validasi PRD FR-M7. */}
                      {r.bahan.satuan}
                    </td>
                    <td className="num px-3 text-right text-ink-muted">
                      {formatRupiah(r.bahan.hargaPerUnitTerakhir, 2)}
                    </td>
                    <td className="num px-3 text-right font-medium text-ink">
                      {formatRupiah(r.subtotal, 2)}
                    </td>
                    <td className="px-1.5 text-right">
                      <button
                        onClick={() =>
                          setBaris((s) => s.filter((x) => x.key !== r.key))
                        }
                        className="rounded-input p-1.5 text-ink-faint transition-colors hover:bg-panel-sunken hover:text-expired"
                        aria-label={`Hapus ${r.bahan.nama} dari resep`}
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Ringkasan HPP — terhitung ulang langsung */}
        <div className="grid grid-cols-2 gap-px border-t border-line bg-line sm:grid-cols-4">
          {[
            { k: "HPP", v: hpp, f: (n: number) => formatRupiah(n), warna: "text-ink" },
            {
              k: "Harga jual",
              v: hargaAngka,
              f: (n: number) => formatRupiah(n),
              warna: "text-ink",
            },
            {
              k: "Margin Rp",
              v: marginRp,
              f: (n: number) => formatRupiah(n),
              warna: marginRp >= 0 ? "text-gain" : "text-loss",
            },
            {
              k: "Margin %",
              v: marginPersen,
              f: (n: number) => formatPersen(n),
              warna: gayaMargin(marginPersen),
            },
          ].map((x) => (
            <div key={x.k} className="bg-panel px-4 py-3">
              <p className="t-caption text-ink-muted">{x.k}</p>
              <p className="mt-1">
                <AngkaBergulir
                  nilai={x.v}
                  format={x.f}
                  className={cn(
                    "num text-[17px] font-semibold tracking-[-0.01em]",
                    x.warna,
                  )}
                />
              </p>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 border-t border-line px-4 py-3">
          <Tombol
            onClick={() =>
              setBaris(
                resepMenu(params.id).map((r) => ({
                  key: r.id,
                  ingredientId: r.ingredientId,
                  qty: String(r.qtyPerPorsi),
                })),
              )
            }
          >
            Kembalikan
          </Tombol>
          <Tombol
            varian="utama"
            disabled={rincian.some((r) => r.qty <= 0)}
            onClick={() =>
              setKabar(
                `Resep tersimpan. HPP ${formatRupiah(hpp)}, margin ${formatPersen(marginPersen)}.`,
              )
            }
          >
            Simpan resep
          </Tombol>
        </div>
      </Panel>

      {/* --- Tren penjualan --- */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartFrame
          judul="Penjualan mingguan"
          keterangan="12 minggu terakhir"
          tinggi={220}
          tabel={
            <TabelSetara
              kepala={["Minggu", "Qty terjual"]}
              baris={trenMingguan.map((t) => [t.label, formatAngka(t.qty)])}
            />
          }
        >
          <Sparkline data={trenMingguan} warna="var(--viz-2)" />
        </ChartFrame>

        <ChartFrame
          judul="Penjualan bulanan"
          keterangan="Riwayat 2025 — dipakai sebagai indeks musiman"
          tinggi={220}
          tabel={
            <TabelSetara
              kepala={["Bulan", "Qty terjual"]}
              baris={trenBulanan.map((t) => [t.label, formatAngka(t.qty)])}
            />
          }
        >
          <Sparkline data={trenBulanan} warna="var(--viz-1)" />
        </ChartFrame>
      </div>

      <p className="t-caption text-ink-faint">
        Total qty per porsi resep saat ini:{" "}
        <span className="num">
          {formatAngkaLuwes(rincian.reduce((t, r) => t + r.qty, 0), 2)}
        </span>{" "}
        unit gabungan dari {rincian.length} bahan.
      </p>
    </div>
  );
}
