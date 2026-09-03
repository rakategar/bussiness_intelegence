"use client";

import * as React from "react";
import { UserPlus } from "lucide-react";

import {
  Isian,
  Label,
  PageHeader,
  Panel,
  Pilihan,
  Tombol,
} from "@/components/ui/primitives";
import { WARNA_REL } from "@/components/app/nav";
import { profil } from "@/lib/data/seed";
import { LABEL_PERAN } from "@/lib/status";
import { formatTanggal } from "@/lib/format";
import type { Peran } from "@/lib/types";
import { cn } from "@/lib/utils";

const HAK_PERAN: Record<Peran, string> = {
  stock:
    "Kelola bahan, restock, waste, dan peringatan kadaluarsa. Tidak bisa melihat laporan laba.",
  admin:
    "Kelola menu, resep, dan impor penjualan. Melihat analitik terbatas.",
  owner:
    "Akses penuh termasuk laporan laba rugi, forecasting, dan kelola pengguna.",
};

export default function HalamanPengguna() {
  const [undangBuka, setUndangBuka] = React.useState(false);
  const [kabar, setKabar] = React.useState<string | null>(null);
  const [daftar, setDaftar] = React.useState(profil);

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Pengguna"
        keterangan="Peran menentukan halaman yang bisa dibuka. Pembatasannya ditegakkan di server, bukan sekadar disembunyikan dari menu."
        aksi={
          <Tombol
            varian="utama"
            ukuran="sm"
            onClick={() => setUndangBuka(true)}
          >
            <UserPlus size={14} strokeWidth={1.75} />
            Undang pengguna
          </Tombol>
        }
      />

      {kabar ? (
        <div
          role="status"
          aria-live="polite"
          className="anim-rise flex items-center gap-2 rounded-panel border border-line bg-fresh-bg px-3 py-2.5 text-[13px] text-fresh"
        >
          <span aria-hidden>✓</span>
          {kabar}
          <button
            onClick={() => setKabar(null)}
            className="ml-auto text-[12px] underline"
          >
            Tutup
          </button>
        </div>
      ) : null}

      <Panel>
        <ul className="divide-y divide-line">
          {daftar.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3"
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-brand-on"
                style={{ background: WARNA_REL[p.role] }}
              >
                {p.namaLengkap.charAt(0)}
              </span>

              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-ink">
                  {p.namaLengkap}
                  {!p.isActive ? (
                    <span className="ml-2 inline-flex h-[18px] items-center rounded-[999px] bg-panel-sunken px-1.5 text-[11px] font-normal text-ink-muted">
                      nonaktif
                    </span>
                  ) : null}
                </span>
                <span className="t-caption block text-ink-muted">
                  {p.email} · bergabung {formatTanggal(p.createdAt)}
                </span>
              </span>

              <span className="ml-auto flex flex-wrap items-center gap-2">
                <Pilihan
                  value={p.role}
                  onChange={(e) => {
                    const peranBaru = e.target.value as Peran;
                    setDaftar((d) =>
                      d.map((x) =>
                        x.id === p.id ? { ...x, role: peranBaru } : x,
                      ),
                    );
                    setKabar(
                      `Peran ${p.namaLengkap} diubah jadi ${LABEL_PERAN[peranBaru]}.`,
                    );
                  }}
                  aria-label={`Peran ${p.namaLengkap}`}
                >
                  {(["stock", "admin", "owner"] as Peran[]).map((r) => (
                    <option key={r} value={r}>
                      {LABEL_PERAN[r]}
                    </option>
                  ))}
                </Pilihan>

                <Tombol
                  ukuran="sm"
                  varian={p.isActive ? "bahaya" : "sekunder"}
                  onClick={() => {
                    setDaftar((d) =>
                      d.map((x) =>
                        x.id === p.id ? { ...x, isActive: !x.isActive } : x,
                      ),
                    );
                    setKabar(
                      p.isActive
                        ? `${p.namaLengkap} dinonaktifkan. Sesinya berakhir saat berikutnya membuka aplikasi.`
                        : `${p.namaLengkap} diaktifkan kembali.`,
                    );
                  }}
                >
                  {p.isActive ? "Nonaktifkan" : "Aktifkan"}
                </Tombol>
              </span>

              <p className="t-caption prose-width w-full text-ink-faint">
                {HAK_PERAN[p.role]}
              </p>
            </li>
          ))}
        </ul>
      </Panel>

      {undangBuka ? (
        <DialogUndang
          onTutup={() => setUndangBuka(false)}
          onKirim={(email, peran) => {
            setUndangBuka(false);
            setKabar(
              `Undangan terkirim ke ${email} sebagai ${LABEL_PERAN[peran]}.`,
            );
          }}
        />
      ) : null}
    </div>
  );
}

function DialogUndang({
  onTutup,
  onKirim,
}: {
  onTutup: () => void;
  onKirim: (email: string, peran: Peran) => void;
}) {
  const [email, setEmail] = React.useState("");
  const [peran, setPeran] = React.useState<Peran>("stock");
  const sah = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/25 sm:items-center sm:p-5">
      <div className="fixed inset-0" onClick={onTutup} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        className="anim-rise relative w-full max-w-md rounded-t-modal border border-line bg-panel shadow-[var(--shadow-modal)] sm:rounded-modal"
      >
        <div className="border-b border-line px-4 py-3">
          <h2 className="t-h2 text-ink">Undang pengguna</h2>
          <p className="t-caption mt-0.5 text-ink-muted">
            Undangan berisi tautan untuk membuat kata sandi sendiri.
          </p>
        </div>

        <div className="space-y-4 px-4 py-4">
          <div>
            <Label htmlFor="u-email" wajib>
              Email
            </Label>
            <Isian
              id="u-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@contoh.id"
            />
            {email && !sah ? (
              <p className="mt-1 text-[12px] text-expired">
                ⚠ Format email belum benar.
              </p>
            ) : null}
          </div>

          <div>
            <Label htmlFor="u-peran" wajib>
              Peran
            </Label>
            <Pilihan
              id="u-peran"
              value={peran}
              onChange={(e) => setPeran(e.target.value as Peran)}
              className="h-10 w-full text-[14px]"
            >
              {(["stock", "admin", "owner"] as Peran[]).map((r) => (
                <option key={r} value={r}>
                  {LABEL_PERAN[r]}
                </option>
              ))}
            </Pilihan>
            <p className={cn("t-caption mt-1.5 text-ink-muted")}>
              {HAK_PERAN[peran]}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-line px-4 py-3">
          <Tombol onClick={onTutup}>Batal</Tombol>
          <Tombol
            varian="utama"
            disabled={!sah}
            onClick={() => onKirim(email, peran)}
          >
            Kirim undangan
          </Tombol>
        </div>
      </div>
    </div>
  );
}
