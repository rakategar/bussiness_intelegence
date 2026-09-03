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
  stock: [
    { href: "/stock", label: "Beranda", ikon: "LayoutDashboard" },
    { href: "/stock/bahan", label: "Bahan", ikon: "Package" },
    { href: "/stock/restock", label: "Restock", ikon: "Truck" },
    {
      href: "/stock/kadaluarsa",
      label: "Kadaluarsa",
      ikon: "CalendarClock",
      lencana: "kadaluarsa",
    },
    { href: "/stock/waste", label: "Waste", ikon: "Trash2" },
  ],
  admin: [
    { href: "/admin", label: "Beranda", ikon: "LayoutDashboard" },
    {
      href: "/admin/menu",
      label: "Menu & resep",
      ikon: "BookOpen",
      lencana: "tanpa-resep",
    },
    { href: "/admin/penjualan", label: "Penjualan", ikon: "Receipt" },
    { href: "/admin/impor", label: "Impor", ikon: "Upload" },
  ],
  owner: [
    { href: "/owner", label: "Beranda", ikon: "LayoutDashboard" },
    { href: "/owner/menu", label: "Analisis menu", ikon: "Grid2x2" },
    { href: "/owner/bahan", label: "Analisis bahan", ikon: "Package" },
    { href: "/owner/proyeksi", label: "Proyeksi", ikon: "TrendingUp" },
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
  stock: "var(--role-stock)",
  admin: "var(--role-admin)",
  owner: "var(--role-owner)",
};
