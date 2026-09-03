"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

import { BERANDA_PERAN, useSesi } from "@/components/app/session";
import { Isian, Label, Tombol } from "@/components/ui/primitives";
import { profil } from "@/lib/data/seed";
import { LABEL_PERAN } from "@/lib/status";
import { WARNA_REL } from "@/components/app/nav";
import { formatMinggu } from "@/lib/format";
import { HARI_INI } from "@/lib/data/seed";

export default function HalamanMasuk() {
  const { masuk, pengguna, siap } = useSesi();
  const router = useRouter();
  const [email, setEmail] = React.useState("andi@dashboardbi.id");
  const [sandi, setSandi] = React.useState("demo1234");
  const [galat, setGalat] = React.useState<string | null>(null);
  const [goyang, setGoyang] = React.useState(0);

  React.useEffect(() => {
    if (siap && pengguna) router.replace(BERANDA_PERAN[pengguna.role]);
  }, [siap, pengguna, router]);

  const kirim = (e: React.FormEvent) => {
    e.preventDefault();
    if (sandi.length < 8) {
      setGalat("Kata sandi minimal 8 karakter.");
      setGoyang((g) => g + 1);
      return;
    }
    const hasil = masuk(email);
    if (!hasil.ok) {
      setGalat(hasil.pesan ?? "Gagal masuk.");
      setGoyang((g) => g + 1);
      return;
    }
    setGalat(null);
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_460px]">
      {/* Sisi kiri — konteks produk, tersembunyi di layar kecil */}
      <div className="relative hidden flex-col justify-between bg-brand p-10 text-brand-on lg:flex">
        <div>
          <p className="text-[18px] font-bold tracking-[-0.01em]">
            Dashboard BI
          </p>
          <p className="mt-1 text-[13px] text-brand-on/70">
            {formatMinggu(HARI_INI)}
          </p>
        </div>

        <div className="max-w-md">
          <p className="text-[26px] font-semibold leading-9 tracking-[-0.01em]">
            Stok, penjualan, dan biaya dalam satu sumber kebenaran.
          </p>
          <p className="mt-3 text-[14px] leading-6 text-brand-on/75">
            Pengganti spreadsheet untuk operasional coffee shop. Status
            kesegaran bahan adalah hal paling menonjol di layar — kalau ada yang
            mau kadaluarsa, itu yang pertama Anda lihat.
          </p>

          <div className="mt-6 flex items-center gap-2">
            {(["kadaluarsa", "kritis", "waspada", "aman"] as const).map(
              (s, i) => (
                <span
                  key={s}
                  className="anim-dot-in flex items-center gap-1.5 rounded-[999px] bg-white/10 px-2.5 py-1 text-[12px]"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      background:
                        s === "aman"
                          ? "#8fd7ac"
                          : s === "waspada"
                            ? "#f0cd76"
                            : s === "kritis"
                              ? "#f0a179"
                              : "#eb9086",
                    }}
                  />
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </span>
              ),
            )}
          </div>
        </div>

        <p className="text-[12px] text-brand-on/50">
          Data pada demo ini dihasilkan dari seed, bukan data pelanggan nyata.
        </p>
      </div>

      {/* Sisi kanan — formulir */}
      <div className="flex items-center justify-center bg-panel px-5 py-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <p className="text-[18px] font-bold tracking-[-0.01em] text-ink">
              Dashboard BI
            </p>
            <p className="t-caption mt-1 text-ink-muted">
              {formatMinggu(HARI_INI)}
            </p>
            <div className="my-6 h-px bg-line" />
          </div>

          <h1 className="t-h1 text-ink">Masuk</h1>
          <p className="t-small mt-1 text-ink-muted">
            Gunakan salah satu akun demo di bawah untuk melihat tampilan tiap
            peran.
          </p>

          <form
            onSubmit={kirim}
            className="mt-6 space-y-4"
            key={goyang}
          >
            <div className={galat ? "anim-shake" : undefined}>
              <Label htmlFor="email" wajib>
                Email
              </Label>
              <Isian
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div>
              <Label htmlFor="sandi" wajib>
                Kata sandi
              </Label>
              <Isian
                id="sandi"
                type="password"
                value={sandi}
                onChange={(e) => setSandi(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {galat ? (
              <p
                className="flex items-start gap-1.5 text-[13px] text-expired"
                role="alert"
              >
                <AlertCircle size={14} strokeWidth={1.5} className="mt-0.5 shrink-0" />
                {galat}
              </p>
            ) : null}

            <Tombol type="submit" varian="utama" className="w-full">
              Masuk
            </Tombol>
          </form>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <span className="t-caption text-ink-faint">akun demo</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <ul className="space-y-1.5">
            {profil
              .filter((p) => p.isActive)
              .map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => {
                      setEmail(p.email);
                      setGalat(null);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-input border border-line px-2.5 py-2 text-left transition-colors hover:border-line-strong hover:bg-panel-sunken"
                  >
                    <span
                      className="h-6 w-[3px] rounded-full"
                      style={{ background: WARNA_REL[p.role] }}
                    />
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium text-ink">
                        {p.namaLengkap}
                      </span>
                      <span className="t-caption block truncate text-ink-muted">
                        {p.email}
                      </span>
                    </span>
                    <span className="t-caption ml-auto shrink-0 text-ink-faint">
                      {LABEL_PERAN[p.role]}
                    </span>
                  </button>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
