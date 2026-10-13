"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  Bell,
  CalendarClock,
  ChevronDown,
  FileText,
  Grid2x2,
  LayoutDashboard,
  LogOut,
  Moon,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  Settings,
  Sun,
  TrendingUp,
  Trash2,
  Truck,
  Upload,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { formatMinggu } from "@/lib/format";
import { HARI_INI } from "@/lib/data/seed";
import { LABEL_PERAN } from "@/lib/status";
import { BERANDA_PERAN, useSesi } from "./session";
import { NAV, WARNA_REL, type ItemNav } from "./nav";
import type { Peran } from "@/lib/types";
import { Notifikasi } from "./notifikasi";
import { tulisLokal, useNilaiLokal } from "@/lib/hooks";

const IKON = {
  LayoutDashboard,
  Package,
  Truck,
  CalendarClock,
  Trash2,
  BookOpen,
  Receipt,
  Upload,
  Grid2x2,
  TrendingUp,
  FileText,
  Users,
  Settings,
} as const;

function Ikon({ nama, ...rest }: { nama: string; size?: number; strokeWidth?: number; className?: string }) {
  const C = IKON[nama as keyof typeof IKON] ?? LayoutDashboard;
  return <C {...rest} />;
}

export function AppShell({
  peran,
  children,
  lencana,
}: {
  peran: Peran;
  children: React.ReactNode;
  lencana?: Partial<Record<"kadaluarsa" | "tanpa-resep", number>>;
}) {
  const { pengguna, siap, keluar, gantiPeran } = useSesi();
  const router = useRouter();
  const pathname = usePathname();
  const [ciut, setCiut] = React.useState(false);
  const [menuProfil, setMenuProfil] = React.useState(false);

  // Penjagaan peran di sisi klien. Di versi Supabase, RLS + middleware yang
  // menegakkan ini; di sini kita tetap tolak dengan halaman 403 yang jelas.
  React.useEffect(() => {
    if (!siap) return;
    if (!pengguna) {
      router.replace("/masuk");
      return;
    }
    if (pengguna.role !== peran) router.replace("/403");
  }, [siap, pengguna, peran, router]);

  if (!siap || !pengguna || pengguna.role !== peran) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-surface">
        <div className="skeleton h-24 w-56 rounded-panel" />
      </div>
    );
  }

  const daftar = NAV[peran];
  const tabBawah = daftar.filter((i) => !i.sekunder).slice(0, 5);

  return (
    <div className="min-h-dvh bg-surface">
      {/* ---------------- Top bar ---------------- */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-line bg-panel px-3 sm:px-4">
        <span
          className="h-6 w-[3px] shrink-0 rounded-full"
          style={{ background: WARNA_REL[peran] }}
          aria-hidden
        />

        <Link
          href={BERANDA_PERAN[peran]}
          className="shrink-0 text-[16px] font-bold tracking-[-0.01em] text-ink"
        >
          Dashboard BI
        </Link>

        <span className="hidden h-4 w-px bg-line md:block" aria-hidden />

        <span className="num hidden text-[12px] text-ink-muted md:block">
          {formatMinggu(HARI_INI)}
        </span>

        <div className="ml-auto flex items-center gap-1">
          <TombolTema />
          <Notifikasi peran={peran} />

          <div className="relative">
            <button
              onClick={() => setMenuProfil((v) => !v)}
              className="flex h-9 items-center gap-1.5 rounded-input px-2 text-[13px] text-ink transition-colors hover:bg-panel-sunken"
              aria-expanded={menuProfil}
              aria-haspopup="menu"
            >
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-brand-on"
                style={{ background: WARNA_REL[peran] }}
              >
                {pengguna.namaLengkap.charAt(0)}
              </span>
              <span className="hidden sm:inline">
                {pengguna.namaLengkap.split(" ")[0]}
              </span>
              <ChevronDown size={13} strokeWidth={1.5} className="text-ink-faint" />
            </button>

            {menuProfil ? (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuProfil(false)}
                  aria-hidden
                />
                <div
                  role="menu"
                  className="anim-rise absolute right-0 top-11 z-50 w-60 rounded-modal border border-line bg-panel p-1.5 shadow-[var(--shadow-dropdown)]"
                >
                  <div className="px-2 py-1.5">
                    <p className="t-body-strong text-ink">
                      {pengguna.namaLengkap}
                    </p>
                    <p className="t-caption text-ink-muted">{pengguna.email}</p>
                    <p className="t-caption mt-1 text-ink-faint">
                      Masuk sebagai {LABEL_PERAN[peran]}
                    </p>
                  </div>

                  <div className="my-1 h-px bg-line" />

                  <p className="px-2 pb-1 pt-1 text-[11px] text-ink-faint">
                    Ganti peran (demo)
                  </p>
                  {(["stock", "admin", "owner"] as Peran[]).map((p) => (
                    <button
                      key={p}
                      role="menuitem"
                      onClick={() => {
                        setMenuProfil(false);
                        gantiPeran(p);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-input px-2 py-1.5 text-left text-[13px] transition-colors hover:bg-panel-sunken",
                        p === peran ? "text-ink" : "text-ink-muted",
                      )}
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: WARNA_REL[p] }}
                      />
                      {LABEL_PERAN[p]}
                      {p === peran ? (
                        <span className="ml-auto text-[11px] text-ink-faint">
                          aktif
                        </span>
                      ) : null}
                    </button>
                  ))}

                  <div className="my-1 h-px bg-line" />

                  <button
                    role="menuitem"
                    onClick={keluar}
                    className="flex w-full items-center gap-2 rounded-input px-2 py-1.5 text-left text-[13px] text-ink-muted transition-colors hover:bg-panel-sunken hover:text-ink"
                  >
                    <LogOut size={14} strokeWidth={1.5} />
                    Keluar
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* ---------------- Sidebar ---------------- */}
        <aside
          className={cn(
            "sticky top-14 hidden h-[calc(100dvh-3.5rem)] shrink-0 border-r border-line bg-panel transition-[width] duration-200 sm:block",
            ciut ? "w-14" : "w-60",
          )}
        >
          {/* Rel peran — pita 3px di tepi kiri */}
          <span
            className="absolute inset-y-0 left-0 w-[3px]"
            style={{ background: WARNA_REL[peran] }}
            aria-hidden
          />

          <nav className="flex h-full flex-col gap-0.5 p-2 pl-3">
            {daftar.map((item) => (
              <ItemSidebar
                key={item.href}
                item={item}
                aktif={apakahAktif(pathname, item.href)}
                ciut={ciut}
                jumlah={item.lencana ? lencana?.[item.lencana] : undefined}
              />
            ))}

            <button
              onClick={() => setCiut((v) => !v)}
              className="mt-auto flex h-9 items-center gap-2.5 rounded-input px-2.5 text-[13px] text-ink-faint transition-colors hover:bg-panel-sunken hover:text-ink-muted"
              aria-label={ciut ? "Lebarkan sidebar" : "Ciutkan sidebar"}
            >
              {ciut ? (
                <PanelLeftOpen size={18} strokeWidth={1.5} />
              ) : (
                <>
                  <PanelLeftClose size={18} strokeWidth={1.5} />
                  Ciutkan
                </>
              )}
            </button>
          </nav>
        </aside>

        {/* ---------------- Konten ---------------- */}
        <main className="min-w-0 flex-1 pb-20 sm:pb-0">
          <div className="mx-auto w-full max-w-[1440px] px-3 py-4 sm:px-5 sm:py-6">
            {children}
          </div>
        </main>
      </div>

      {/* ---------------- Bilah tab bawah (< 640px) ---------------- */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-panel sm:hidden">
        <span
          className="absolute inset-x-0 top-0 h-[3px]"
          style={{ background: WARNA_REL[peran] }}
          aria-hidden
        />
        <ul className="flex">
          {tabBawah.map((item) => {
            const aktif = apakahAktif(pathname, item.href);
            const jumlah = item.lencana ? lencana?.[item.lencana] : undefined;
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className={cn(
                    "relative flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] transition-colors",
                    aktif ? "text-brand" : "text-ink-muted",
                  )}
                  aria-current={aktif ? "page" : undefined}
                >
                  <span className="relative">
                    <Ikon nama={item.ikon} size={20} strokeWidth={1.5} />
                    {jumlah ? (
                      <span className="num absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-critical px-1 text-[10px] font-semibold text-white">
                        {jumlah}
                      </span>
                    ) : null}
                  </span>
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function ItemSidebar({
  item,
  aktif,
  ciut,
  jumlah,
}: {
  item: ItemNav;
  aktif: boolean;
  ciut: boolean;
  jumlah?: number;
}) {
  return (
    <Link
      href={item.href}
      title={ciut ? item.label : undefined}
      aria-current={aktif ? "page" : undefined}
      className={cn(
        "flex h-9 items-center gap-2.5 rounded-input px-2.5 text-[13px] transition-colors",
        aktif
          ? "bg-brand-soft font-medium text-brand"
          : "text-ink-muted hover:bg-panel-sunken hover:text-ink",
      )}
    >
      <Ikon nama={item.ikon} size={18} strokeWidth={1.5} />
      {!ciut ? (
        <>
          <span className="truncate">{item.label}</span>
          {jumlah ? (
            <span
              className={cn(
                "num ml-auto flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[11px] font-semibold",
                item.lencana === "kadaluarsa"
                  ? "bg-critical-bg text-critical"
                  : "bg-watch-bg text-watch",
              )}
            >
              {jumlah}
            </span>
          ) : null}
        </>
      ) : null}
    </Link>
  );
}

function apakahAktif(pathname: string, href: string) {
  if (href.split("/").length === 2) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function TombolTema() {
  const tersimpan = useNilaiLokal("dashboard-bi.tema");
  const gelap = tersimpan === "dark";

  const ubah = () => {
    const berikutnya = gelap ? "light" : "dark";
    document.documentElement.dataset.theme = berikutnya;
    tulisLokal("dashboard-bi.tema", berikutnya);
  };

  return (
    <button
      onClick={ubah}
      className="flex h-9 w-9 items-center justify-center rounded-input text-ink-muted transition-colors hover:bg-panel-sunken hover:text-ink"
      aria-label={gelap ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
    >
      {gelap ? (
        <Sun size={17} strokeWidth={1.5} />
      ) : (
        <Moon size={17} strokeWidth={1.5} />
      )}
    </button>
  );
}

export { Bell };
