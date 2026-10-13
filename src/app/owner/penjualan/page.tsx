"use client";

import { HalamanData } from "@/components/panels/halaman-data";
import { ModulTren } from "@/components/panels/modul-analitik";
import type { Kolom } from "@/components/ui/data-table";
import { Rupiah } from "@/components/ui/primitives";
import { menu } from "@/lib/data/seed";
import { menuPerId } from "@/lib/data/queries";
import { useKoleksi } from "@/lib/data/operasional";
import { formatAngka, formatRentang, formatTanggal, labelMinggu } from "@/lib/format";
import type { Field } from "@/lib/import/skema";
import type { CatatanPenjualan } from "@/lib/types";

const FIELD: Field[] = [
  { kunci: "periodeMulai", label: "Tanggal transaksi (awal minggu)", tipe: "tanggal" },
  { kunci: "periodeSelesai", label: "Sampai", tipe: "tanggal" },
  { kunci: "menuId", label: "Produk", tipe: "pilihan", opsi: menu.map((m) => ({ nilai: m.id, label: m.nama })) },
  { kunci: "qtyTerjual", label: "Jumlah", tipe: "angka", satuan: "porsi" },
  { kunci: "hargaSaatItu", label: "Harga", tipe: "angka", satuan: "Rp" },
];

const KOLOM: Kolom<CatatanPenjualan>[] = [
  {
    kunci: "periode",
    judul: "Tanggal transaksi",
    sel: (p) => <span className="text-ink-muted">{formatRentang(p.periodeMulai, p.periodeSelesai)}</span>,
    urut: (p) => p.periodeMulai,
  },
  {
    kunci: "menu",
    judul: "Produk",
    sel: (p) => <span className="font-medium">{menuPerId.get(p.menuId)?.nama ?? "—"}</span>,
    urut: (p) => menuPerId.get(p.menuId)?.nama ?? "",
  },
  { kunci: "qty", judul: "Jumlah", angka: true, sel: (p) => formatAngka(p.qtyTerjual), urut: (p) => p.qtyTerjual },
  { kunci: "harga", judul: "Harga", angka: true, sekunder: true, sel: (p) => <Rupiah nilai={p.hargaSaatItu} />, urut: (p) => p.hargaSaatItu },
  {
    kunci: "pendapatan",
    judul: "Pendapatan",
    angka: true,
    sel: (p) => <Rupiah nilai={p.qtyTerjual * p.hargaSaatItu} />,
    urut: (p) => p.qtyTerjual * p.hargaSaatItu,
  },
];

export default function HalamanPenjualanPemilik() {
  const koleksi = useKoleksi("penjualan");
  const minggu = [...new Set(koleksi.data.map((p) => p.periodeMulai))].sort().reverse();

  return (
    <div className="space-y-8">
      <HalamanData
        judul="Data penjualan"
        keterangan="Daftar penjualan per minggu. Pilih satu baris untuk melihat detail tanggal, produk, jumlah, dan harga."
        koleksi={koleksi}
        fields={FIELD}
        kolom={KOLOM}
        akses="baca"
        buatBaru={(_, lama) => lama!}
        cari={(p) => menuPerId.get(p.menuId)?.nama ?? ""}
        filter={[
          {
            kunci: "minggu",
            label: "Semua minggu",
            opsi: minggu.map((m) => ({ nilai: m, label: `${labelMinggu(m)} · ${formatTanggal(m)}` })),
            cocok: (p, v) => p.periodeMulai === v,
          },
          {
            kunci: "menu",
            label: "Semua produk",
            opsi: menu.map((m) => ({ nilai: m.id, label: m.nama })),
            cocok: (p, v) => p.menuId === v,
          },
        ]}
      />
      <ModulTren judul="Grafik tren per menu" />
    </div>
  );
}
