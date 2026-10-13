import type { Peran } from "@/lib/types";

export interface ItemNav {
  href: string;
  label: string;
  ikon: string;
  /** Lencana angka di sebelah kanan item. */
  lencana?: "kadaluarsa" | "tanpa-resep";
  /** Sembunyikan dari bilah tab bawah di mobile (maks 5 tujuan). */
  sekunder?: boolean;
}

export const NAV: Record<Peran, ItemNav[]> = {
  logistik: [
    { href: "/logistik", label: "Beranda", ikon: "LayoutDashboard" },
    { href: "/logistik/pengiriman", label: "Pengiriman", ikon: "Truck" },
  ],
  admin: [
    { href: "/admin", label: "Beranda", ikon: "LayoutDashboard" },
    { href: "/admin/anggaran", label: "Perencanaan anggaran", ikon: "Wallet" },
    { href: "/admin/pengeluaran", label: "Pengeluaran", ikon: "Receipt" },
    { href: "/admin/penggunaan", label: "Penggunaan bahan", ikon: "Package" },
    { href: "/admin/penjualan", label: "Penjualan", ikon: "ShoppingBag", sekunder: true },
    { href: "/admin/tren", label: "Tren penjualan", ikon: "ChartLine", sekunder: true },
    { href: "/admin/forecast", label: "Forecast", ikon: "TrendingUp" },
    { href: "/admin/pengiriman", label: "Pengiriman", ikon: "Truck", sekunder: true },
    {
      href: "/admin/menu",
      label: "Menu & resep",
      ikon: "BookOpen",
      lencana: "tanpa-resep",
      sekunder: true,
    },
    {
      href: "/admin/stok",
      label: "Stok & restock",
      ikon: "Boxes",
      lencana: "kadaluarsa",
      sekunder: true,
    },
    { href: "/admin/impor", label: "Riwayat impor", ikon: "Upload", sekunder: true },
  ],
  owner: [
    { href: "/owner", label: "Beranda", ikon: "LayoutDashboard" },
    { href: "/owner/anggaran", label: "Anggaran", ikon: "Wallet" },
    { href: "/owner/pengeluaran", label: "Pengeluaran", ikon: "Receipt" },
    { href: "/owner/penggunaan", label: "Penggunaan bahan", ikon: "Package", sekunder: true },
    { href: "/owner/pengiriman", label: "Pengiriman", ikon: "Truck", sekunder: true },
    { href: "/owner/penjualan", label: "Penjualan", ikon: "ShoppingBag", sekunder: true },
    { href: "/owner/forecast", label: "Forecast", ikon: "TrendingUp" },
    { href: "/owner/cost-control", label: "Cost control", ikon: "Scale" },
    { href: "/owner/menu", label: "Analisis menu", ikon: "Grid2x2", sekunder: true },
    { href: "/owner/bahan", label: "Analisis bahan", ikon: "Boxes", sekunder: true },
    { href: "/owner/proyeksi", label: "Proyeksi menu", ikon: "ChartLine", sekunder: true },
    { href: "/owner/laporan", label: "Laporan", ikon: "FileText", sekunder: true },
    { href: "/owner/pengguna", label: "Pengguna", ikon: "Users", sekunder: true },
    {
      href: "/owner/pengaturan",
      label: "Pengaturan",
      ikon: "Settings",
      sekunder: true,
    },
  ],
};

export const WARNA_REL: Record<Peran, string> = {
  logistik: "var(--role-logistik)",
  admin: "var(--role-admin)",
  owner: "var(--role-owner)",
};
