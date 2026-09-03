"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { DataTable, type Kolom } from "@/components/ui/data-table";
import { PageHeader, Rupiah, Tombol } from "@/components/ui/primitives";
import { hppMenu, resepMenu } from "@/lib/data/queries";
import { menu } from "@/lib/data/seed";
import { LABEL_KATEGORI_MENU, gayaMargin } from "@/lib/status";
import { formatPersen, formatRupiah } from "@/lib/format";
import type { KategoriMenu, Menu } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BarisMenu {
  menu: Menu;
  hpp: number;
  punyaResep: boolean;
  marginRp: number;
  marginPersen: number;
}

export default function HalamanMenuAdmin() {
  const router = useRouter();
  const [filter, setFilter] = React.useState<Record<string, string>>({});

  const semua: BarisMenu[] = React.useMemo(
    () =>
      menu.map((m) => {
        const hpp = hppMenu(m.id);
        const punyaResep = resepMenu(m.id).length > 0;
        const marginRp = m.hargaJual - hpp;
        return {
          menu: m,
          hpp,
          punyaResep,
          marginRp,
          marginPersen: m.hargaJual ? (marginRp / m.hargaJual) * 100 : 0,
        };
      }),
    [],
  );

  const data = React.useMemo(
    () =>
      semua.filter(
        (b) =>
          (!filter.kategori || b.menu.kategori === filter.kategori) &&
          (!filter.resep ||
            (filter.resep === "ada" ? b.punyaResep : !b.punyaResep)),
      ),
    [semua, filter],
  );

  const kolom: Kolom<BarisMenu>[] = [
    {
      kunci: "sku",
      judul: "SKU",
      lebar: "76px",
      sel: (b) => <span className="num text-ink-muted">{b.menu.sku}</span>,
      urut: (b) => b.menu.sku,
    },
    {
      kunci: "nama",
      judul: "Menu",
      sel: (b) => (
        <span className="flex items-center gap-2">
          <span className="font-medium text-ink">{b.menu.nama}</span>
          {!b.punyaResep ? (
            <span className="inline-flex h-[18px] shrink-0 items-center rounded-[999px] bg-watch-bg px-1.5 text-[11px] font-medium text-watch">
              Resep belum diisi
            </span>
          ) : null}
        </span>
      ),
      urut: (b) => b.menu.nama,
    },
    {
      kunci: "kategori",
      judul: "Kategori",
      sekunder: true,
      sel: (b) => (
        <span className="text-ink-muted">
          {LABEL_KATEGORI_MENU[b.menu.kategori]}
        </span>
      ),
      urut: (b) => b.menu.kategori,
    },
    {
      kunci: "harga",
      judul: "Harga jual",
      angka: true,
      sel: (b) => <Rupiah nilai={b.menu.hargaJual} />,
      urut: (b) => b.menu.hargaJual,
    },
    {
      kunci: "hpp",
      judul: "HPP",
      angka: true,
      sel: (b) =>
        b.punyaResep ? (
          <Rupiah nilai={b.hpp} />
        ) : (
          <span className="text-ink-faint">—</span>
        ),
      urut: (b) => b.hpp,
    },
    {
      kunci: "marginrp",
      judul: "Margin Rp",
      angka: true,
      sekunder: true,
      sel: (b) =>
        b.punyaResep ? (
          <Rupiah nilai={b.marginRp} />
        ) : (
          <span className="text-ink-faint">—</span>
        ),
      urut: (b) => b.marginRp,
    },
    {
      kunci: "marginpersen",
      judul: "Margin %",
      angka: true,
      sel: (b) =>
        b.punyaResep ? (
          <span className={cn("font-medium", gayaMargin(b.marginPersen))}>
            {formatPersen(b.marginPersen)}
          </span>
        ) : (
          <span className="text-ink-faint">—</span>
        ),
      urut: (b) => b.marginPersen,
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Menu & resep"
        keterangan="Margin di bawah 40% ditandai merah, 40–60% kuning, di atas 60% hijau."
        aksi={
          <Tombol varian="utama" ukuran="sm">
            <Plus size={14} strokeWidth={1.75} />
            Tambah menu
          </Tombol>
        }
      />

      <DataTable
        data={data}
        kolom={kolom}
        kunciBaris={(b) => b.menu.id}
        cari={(b) => `${b.menu.nama} ${b.menu.sku}`}
        filter={[
          {
            kunci: "kategori",
            label: "Semua kategori",
            opsi: (Object.keys(LABEL_KATEGORI_MENU) as KategoriMenu[]).map(
              (k) => ({ nilai: k, label: LABEL_KATEGORI_MENU[k] }),
            ),
          },
          {
            kunci: "resep",
            label: "Semua status resep",
            opsi: [
              { nilai: "ada", label: "Resep sudah diisi" },
              { nilai: "kosong", label: "Resep belum diisi" },
            ],
          },
        ]}
        nilaiFilter={filter}
        onUbahFilter={(k, v) => setFilter((f) => ({ ...f, [k]: v }))}
        onKlikBaris={(b) => router.push(`/admin/menu/${b.menu.id}`)}
        garisKiri={(b) => (b.punyaResep ? undefined : "var(--watch)")}
        kartuMobile={(b) => (
          <div>
            <div className="flex items-start justify-between gap-2">
              <span className="font-medium text-ink">{b.menu.nama}</span>
              {b.punyaResep ? (
                <span className={cn("num text-[13px]", gayaMargin(b.marginPersen))}>
                  {formatPersen(b.marginPersen)}
                </span>
              ) : (
                <span className="t-caption text-watch">Belum ada resep</span>
              )}
            </div>
            <p className="num t-caption mt-0.5 text-ink-faint">{b.menu.sku}</p>
            <p className="t-small mt-1 text-ink-muted">
              {formatRupiah(b.menu.hargaJual)}
              {b.punyaResep ? ` · HPP ${formatRupiah(b.hpp)}` : ""}
            </p>
          </div>
        )}
      />
    </div>
  );
}
