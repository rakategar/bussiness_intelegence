"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { BERANDA_PERAN, useSesi } from "@/components/app/session";
import { Tombol } from "@/components/ui/primitives";
import { LABEL_PERAN } from "@/lib/status";

export default function HalamanTerlarang() {
  const { pengguna, keluar } = useSesi();

  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface px-5">
      <div className="w-full max-w-md rounded-panel border border-line bg-panel p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-panel bg-expired-bg text-expired">
          <ShieldAlert size={20} strokeWidth={1.5} />
        </div>

        <h1 className="t-h1 mt-4 text-ink">Halaman ini bukan hak Anda</h1>

        <p className="t-small prose-width mt-2 text-ink-muted">
          {pengguna
            ? `Anda masuk sebagai ${LABEL_PERAN[pengguna.role]}. Halaman yang Anda tuju hanya bisa dibuka oleh peran lain. Akses ditolak di server, bukan sekadar disembunyikan dari menu.`
            : "Sesi Anda sudah berakhir. Masuk lagi untuk melanjutkan."}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {pengguna ? (
            <Link href={BERANDA_PERAN[pengguna.role]}>
              <Tombol varian="utama">
                Kembali ke beranda {LABEL_PERAN[pengguna.role]}
              </Tombol>
            </Link>
          ) : (
            <Link href="/masuk">
              <Tombol varian="utama">Masuk</Tombol>
            </Link>
          )}
          <Tombol onClick={keluar}>Keluar</Tombol>
        </div>
      </div>
    </main>
  );
}
