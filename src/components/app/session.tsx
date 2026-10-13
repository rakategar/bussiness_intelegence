"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { profil } from "@/lib/data/seed";
import { bacaLokal, tulisLokal, useNilaiLokal, useSudahTerhidrasi } from "@/lib/hooks";
import type { Peran, Profil } from "@/lib/types";

/**
 * Sesi sederhana berbasis localStorage. Menggantikan Supabase Auth untuk
 * versi UI ini; bentuk API-nya sengaja dibuat mirip supabase.auth supaya
 * penggantiannya nanti terbatas di berkas ini saja.
 */

const KUNCI = "dashboard-bi.sesi";

interface IsiSesi {
  pengguna: Profil | null;
  /** false selama render server dan hidrasi pertama — jangan redirect dulu. */
  siap: boolean;
  masuk: (email: string) => { ok: boolean; pesan?: string };
  keluar: () => void;
  gantiPeran: (peran: Peran) => void;
}

const Konteks = React.createContext<IsiSesi | null>(null);

export const BERANDA_PERAN: Record<Peran, string> = {
  logistik: "/logistik",
  admin: "/admin",
  owner: "/owner",
};

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const siap = useSudahTerhidrasi();
  const idTersimpan = useNilaiLokal(KUNCI);

  const pengguna = React.useMemo(() => {
    const p = profil.find((x) => x.id === idTersimpan);
    return p?.isActive ? p : null;
  }, [idTersimpan]);

  const masuk = React.useCallback((email: string) => {
    const p = profil.find(
      (x) => x.email.toLowerCase() === email.trim().toLowerCase(),
    );
    if (!p) return { ok: false, pesan: "Email tidak terdaftar di sistem." };
    if (!p.isActive) return { ok: false, pesan: "Akun ini sudah dinonaktifkan." };
    tulisLokal(KUNCI, p.id);
    return { ok: true };
  }, []);

  const keluar = React.useCallback(() => {
    tulisLokal(KUNCI, null);
    router.push("/masuk");
  }, [router]);

  const gantiPeran = React.useCallback(
    (peran: Peran) => {
      const p = profil.find((x) => x.role === peran && x.isActive);
      if (!p) return;
      tulisLokal(KUNCI, p.id);
      router.push(BERANDA_PERAN[peran]);
    },
    [router],
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

export { bacaLokal };
