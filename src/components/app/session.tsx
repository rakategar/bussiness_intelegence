"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { profil } from "@/lib/data/seed";
import type { Peran, Profil } from "@/lib/types";

/**
 * Sesi sederhana berbasis localStorage. Menggantikan Supabase Auth untuk
 * versi UI ini; bentuk API-nya sengaja dibuat mirip supabase.auth supaya
 * penggantiannya nanti terbatas di berkas ini saja.
 */

const KUNCI = "dashboard-bi.sesi";

interface IsiSesi {
  pengguna: Profil | null;
  siap: boolean;
  masuk: (email: string) => { ok: boolean; pesan?: string };
  keluar: () => void;
  gantiPeran: (peran: Peran) => void;
}

const Konteks = React.createContext<IsiSesi | null>(null);

export const BERANDA_PERAN: Record<Peran, string> = {
  stock: "/stock",
  admin: "/admin",
  owner: "/owner",
};

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [pengguna, setPengguna] = React.useState<Profil | null>(null);
  const [siap, setSiap] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    try {
      const tersimpan = window.localStorage.getItem(KUNCI);
      if (tersimpan) {
        const p = profil.find((x) => x.id === tersimpan);
        if (p?.isActive) setPengguna(p);
      }
    } catch {
      // Penyimpanan diblokir (mode privat) — anggap belum masuk.
    }
    setSiap(true);
  }, []);

  const simpan = React.useCallback((p: Profil | null) => {
    setPengguna(p);
    try {
      if (p) window.localStorage.setItem(KUNCI, p.id);
      else window.localStorage.removeItem(KUNCI);
    } catch {
      /* abaikan */
    }
  }, []);

  const masuk = React.useCallback(
    (email: string) => {
      const p = profil.find(
        (x) => x.email.toLowerCase() === email.trim().toLowerCase(),
      );
      if (!p) return { ok: false, pesan: "Email tidak terdaftar di sistem." };
      if (!p.isActive)
        return { ok: false, pesan: "Akun ini sudah dinonaktifkan." };
      simpan(p);
      return { ok: true };
    },
    [simpan],
  );

  const keluar = React.useCallback(() => {
    simpan(null);
    router.push("/masuk");
  }, [simpan, router]);

  const gantiPeran = React.useCallback(
    (peran: Peran) => {
      const p = profil.find((x) => x.role === peran && x.isActive);
      if (!p) return;
      simpan(p);
      router.push(BERANDA_PERAN[peran]);
    },
    [simpan, router],
  );

  const nilai = React.useMemo(
    () => ({ pengguna, siap, masuk, keluar, gantiPeran }),
    [pengguna, siap, masuk, keluar, gantiPeran],
  );

  return <Konteks.Provider value={nilai}>{children}</Konteks.Provider>;
}

export function useSesi(): IsiSesi {
  const k = React.useContext(Konteks);
  if (!k) throw new Error("useSesi harus dipakai di dalam SessionProvider");
  return k;
}
