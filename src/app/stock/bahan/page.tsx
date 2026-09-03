"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";

import { DataTable, type Kolom } from "@/components/ui/data-table";
import {
  EmptyState,
  PageHeader,
  Panel,
  Rupiah,
  Tombol,
} from "@/components/ui/primitives";
import { StatusBadge } from "@/components/ui/status-badge";
import { Sparkline } from "@/components/charts";
import {
  konsumsiMingguanBahan,
  riwayatBatch,
  semuaStok,
} from "@/lib/data/queries";
import {
  GAYA_STATUS,
  LABEL_KATEGORI_BAHAN,
  LABEL_STATUS,
} from "@/lib/status";
import {
  formatAngkaLuwes,
  formatQty,
  formatRupiah,
  formatTanggal,
} from "@/lib/format";
import type { KategoriBahan, StokBahan } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function HalamanBahan() {
  const semua = React.useMemo(() => semuaStok(), []);
  const [filter, setFilter] = React.useState<Record<string, string>>({});
  const [terpilih, setTerpilih] = React.useState<StokBahan | null>(null);

  const data = React.useMemo(
    () =>
      semua.filter(
        (s) =>
          (!filter.kategori || s.bahan.kategori === filter.kategori) &&
          (!filter.status || s.status === filter.status),
      ),
    [semua, filter],
  );

  const kolom: Kolom<StokBahan>[] = [
    {
      kunci: "sku",
      judul: "SKU",
      lebar: "88px",
      sel: (s) => <span className="num text-ink-muted">{s.bahan.sku}</span>,
      urut: (s) => s.bahan.sku,
    },
    {
      kunci: "nama",
      judul: "Bahan",
      sel: (s) => <span className="font-medium text-ink">{s.bahan.nama}</span>,
      urut: (s) => s.bahan.nama,
    },
    {
      kunci: "kategori",
      judul: "Kategori",
      sekunder: true,
      sel: (s) => (
        <span className="text-ink-muted">
          {LABEL_KATEGORI_BAHAN[s.bahan.kategori]}
        </span>
      ),
      urut: (s) => s.bahan.kategori,
    },
    {
      kunci: "sisa",
      judul: "Sisa stok",
      angka: true,
      sel: (s) => (
        <>
          {formatAngkaLuwes(s.sisaStok, 0)}
          <span className="ml-1 text-[11px] text-ink-muted">
            {s.bahan.satuan}
          </span>
        </>
      ),
      urut: (s) => s.sisaStok,
    },
    {
      kunci: "nilai",
      judul: "Nilai stok",
      angka: true,
      sel: (s) => <Rupiah nilai={s.nilaiStok} />,
      urut: (s) => s.nilaiStok,
    },
    {
      kunci: "hari",
      judul: "Hari tersisa",
      angka: true,
      sekunder: true,
      sel: (s) => (
        <span className={s.perluRestock ? "text-critical" : "text-ink"}>
          {Number.isFinite(s.hariTersisa)
            ? formatAngkaLuwes(s.hariTersisa, 1)
            : "—"}
        </span>
      ),
      urut: (s) => (Number.isFinite(s.hariTersisa) ? s.hariTersisa : 9999),
    },
    {
      kunci: "status",
      judul: "Status",
      lebar: "132px",
      sel: (s) => (
        <StatusBadge
          status={s.status}
          sisaHari={
            s.batchTerdekat
              ? Math.round(
                  (new Date(s.batchTerdekat.tanggalKadaluarsa).getTime() -
                    new Date("2026-09-03").getTime()) /
                    86_400_000,
                )
              : undefined
          }
        />
      ),
      urut: (s) => s.status,
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Master bahan"
        keterangan="Bahan yang punya riwayat transaksi tidak bisa dihapus, hanya dinonaktifkan."
        aksi={
          <Tombol varian="utama" ukuran="sm">
            <Plus size={14} strokeWidth={1.75} />
            Tambah bahan
          </Tombol>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <DataTable
          data={data}
          kolom={kolom}
          kunciBaris={(s) => s.bahan.id}
          cari={(s) => `${s.bahan.nama} ${s.bahan.sku}`}
          filter={[
            {
              kunci: "kategori",
              label: "Semua kategori",
              opsi: (
                Object.keys(LABEL_KATEGORI_BAHAN) as KategoriBahan[]
              ).map((k) => ({ nilai: k, label: LABEL_KATEGORI_BAHAN[k] })),
            },
            {
              kunci: "status",
              label: "Semua status",
              opsi: (["aman", "waspada", "kritis", "kadaluarsa"] as const).map(
                (s) => ({ nilai: s, label: LABEL_STATUS[s] }),
              ),
            },
          ]}
          nilaiFilter={filter}
          onUbahFilter={(k, v) => setFilter((f) => ({ ...f, [k]: v }))}
          onKlikBaris={(s) => setTerpilih(s)}
          barisTerpilih={(s) => s.bahan.id === terpilih?.bahan.id}
          garisKiri={(s) =>
            s.status === "kadaluarsa" || s.status === "kritis"
              ? GAYA_STATUS[s.status].hex
              : undefined
          }
          kartuMobile={(s) => (
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-ink">{s.bahan.nama}</span>
                <StatusBadge status={s.status} ringkas />
              </div>
              <p className="num t-caption mt-0.5 text-ink-faint">
                {s.bahan.sku}
              </p>
              <p className="t-small mt-1 text-ink-muted">
                Sisa {formatQty(s.sisaStok, s.bahan.satuan)} ·{" "}
                {formatRupiah(s.nilaiStok)}
              </p>
              {s.batchTerdekat ? (
                <p className="t-caption mt-0.5 text-ink-faint">
                  Kadaluarsa terdekat{" "}
                  {formatTanggal(s.batchTerdekat.tanggalKadaluarsa)}
                </p>
              ) : null}
            </div>
          )}
          kosong={
            <EmptyState
              judul="Belum ada bahan terdaftar"
              penjelasan="Unggah file restock untuk mengisi master bahan sekaligus, atau tambahkan satu per satu lewat formulir."
              aksi={
                <>
                  <Tombol varian="utama" ukuran="sm">
                    Unggah file restock
                  </Tombol>
                  <Tombol ukuran="sm">Tambah bahan</Tombol>
                </>
              }
            />
          }
        />

        {terpilih ? (
          <PanelDetailBahan
            stok={terpilih}
            onTutup={() => setTerpilih(null)}
          />
        ) : null}
      </div>
    </div>
  );
}

function PanelDetailBahan({
  stok,
  onTutup,
}: {
  stok: StokBahan;
  onTutup: () => void;
}) {
  const konsumsi = React.useMemo(
    () => konsumsiMingguanBahan(stok.bahan.id, 8),
    [stok.bahan.id],
  );
  const riwayat = React.useMemo(
    () => riwayatBatch(stok.bahan.id).slice(0, 6),
    [stok.bahan.id],
  );

  return (
    <Panel className="anim-rise w-full self-start lg:sticky lg:top-20 lg:w-[340px]">
      <div className="flex items-start justify-between gap-2 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <h3 className="t-h3 truncate text-ink">{stok.bahan.nama}</h3>
          <p className="num t-caption text-ink-muted">
            {stok.bahan.sku} · {LABEL_KATEGORI_BAHAN[stok.bahan.kategori]}
          </p>
        </div>
        <button
          onClick={onTutup}
          className="rounded-input p-1 text-ink-faint transition-colors hover:bg-panel-sunken hover:text-ink"
          aria-label="Tutup panel detail"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>

      <dl className="grid grid-cols-2 gap-px bg-line">
        {[
          {
            k: "Sisa stok",
            v: formatQty(stok.sisaStok, stok.bahan.satuan),
          },
          { k: "Nilai stok", v: formatRupiah(stok.nilaiStok) },
          {
            k: "Konsumsi/hari",
            v: formatQty(stok.konsumsiHarian, stok.bahan.satuan),
          },
          {
            k: "Hari tersisa",
            v: Number.isFinite(stok.hariTersisa)
              ? `${formatAngkaLuwes(stok.hariTersisa, 1)} hari`
              : "—",
          },
        ].map((x) => (
          <div key={x.k} className="bg-panel px-4 py-2.5">
            <dt className="t-caption text-ink-muted">{x.k}</dt>
            <dd className="num mt-0.5 text-[13px] font-medium text-ink">
              {x.v}
            </dd>
          </div>
        ))}
      </dl>

      <div className="border-t border-line px-4 py-3">
        <h4 className="t-caption font-semibold uppercase tracking-wide text-ink-muted">
          Konsumsi 8 minggu
        </h4>
        <div className="mt-2 h-28">
          <Sparkline data={konsumsi} />
        </div>
      </div>

      <div className="border-t border-line px-4 py-3">
        <h4 className="t-caption font-semibold uppercase tracking-wide text-ink-muted">
          Batch aktif
        </h4>
        {stok.batchAktif.length === 0 ? (
          <p className="t-small mt-1.5 text-ink-muted">
            Tidak ada batch bersisa. Buat restock baru untuk mengisi lagi.
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {stok.batchAktif.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between gap-2 rounded-input bg-panel-sunken/60 px-2.5 py-1.5 text-[12px]"
              >
                <span className="text-ink-muted">
                  exp {formatTanggal(b.tanggalKadaluarsa)}
                </span>
                <span className="num font-medium text-ink">
                  {formatQty(b.sisaQty, b.satuan)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-line px-4 py-3">
        <h4 className="t-caption font-semibold uppercase tracking-wide text-ink-muted">
          Riwayat restock
        </h4>
        <ul className="mt-2 space-y-1">
          {riwayat.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between gap-2 text-[12px]"
            >
              <span className="text-ink-muted">
                {formatTanggal(b.tanggalTerima)}
              </span>
              <span className="num text-ink">
                {formatQty(b.jumlah, b.satuan)}
              </span>
              <span className="num w-24 text-right text-ink-muted">
                {formatRupiah(b.totalBiaya)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-line px-4 py-3">
        <Tombol
          varian="bahaya"
          ukuran="sm"
          className={cn("w-full")}
          title="Bahan ini punya riwayat transaksi, jadi tidak bisa dihapus"
        >
          Nonaktifkan bahan
        </Tombol>
        <p className="t-caption mt-1.5 text-ink-muted">
          Bahan ini punya riwayat restock, jadi tidak bisa dihapus. Menonaktifkan
          akan menyembunyikannya dari formulir tanpa menghilangkan riwayatnya.
        </p>
      </div>
    </Panel>
  );
}
