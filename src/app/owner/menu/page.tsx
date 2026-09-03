"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Download, X } from "lucide-react";

import { ChartFrame, TabelSetara } from "@/components/charts/chart-frame";
import { GrafikHppBertumpuk, Sparkline } from "@/components/charts";
import { DataTable, type Kolom } from "@/components/ui/data-table";
import {
  PageHeader,
  Panel,
  Rupiah,
  Tombol,
} from "@/components/ui/primitives";
import {
  penjualanBulananMenu,
  penjualanMingguanMenu,
  profitabilitas,
  rincianHpp,
} from "@/lib/data/queries";
import {
  LABEL_KATEGORI_MENU,
  LABEL_KUADRAN,
  PENJELASAN_KUADRAN,
  WARNA_KUADRAN,
  gayaMargin,
} from "@/lib/status";
import {
  LABEL_PERIODE,
  URUTAN_PERIODE,
  rentangDari,
  type PilihanPeriode,
} from "@/lib/periode";
import { formatAngka, formatPersen, formatRupiah } from "@/lib/format";
import type { KategoriMenu, Kuadran, ProfitabilitasMenu } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function AnalisisMenu() {
  const params = useSearchParams();
  const [periode, setPeriode] = React.useState<PilihanPeriode>("minggu-ini");
  const [filter, setFilter] = React.useState<Record<string, string>>({});
  const [terpilih, setTerpilih] = React.useState<string | null>(
    params.get("menu"),
  );

  const semua = React.useMemo(
    () => profitabilitas(rentangDari(periode)),
    [periode],
  );

  const data = React.useMemo(
    () =>
      semua.filter(
        (p) =>
          (!filter.kategori || p.menu.kategori === filter.kategori) &&
          (!filter.kuadran || p.kuadran === filter.kuadran),
      ),
    [semua, filter],
  );

  const detail = terpilih ? semua.find((p) => p.menu.id === terpilih) : null;

  const kolom: Kolom<ProfitabilitasMenu>[] = [
    {
      kunci: "nama",
      judul: "Menu",
      sel: (p) => <span className="font-medium text-ink">{p.menu.nama}</span>,
      urut: (p) => p.menu.nama,
    },
    {
      kunci: "kategori",
      judul: "Kategori",
      sekunder: true,
      sel: (p) => (
        <span className="text-ink-muted">
          {LABEL_KATEGORI_MENU[p.menu.kategori]}
        </span>
      ),
      urut: (p) => p.menu.kategori,
    },
    {
      kunci: "qty",
      judul: "Qty terjual",
      angka: true,
      sel: (p) => formatAngka(p.qtyTerjual),
      urut: (p) => p.qtyTerjual,
    },
    {
      kunci: "harga",
      judul: "Harga jual",
      angka: true,
      sekunder: true,
      sel: (p) => <Rupiah nilai={p.menu.hargaJual} />,
      urut: (p) => p.menu.hargaJual,
    },
    {
      kunci: "hpp",
      judul: "HPP",
      angka: true,
      sel: (p) =>
        p.punyaResep ? <Rupiah nilai={p.hpp} /> : <span className="text-ink-faint">—</span>,
      urut: (p) => p.hpp,
    },
    {
      kunci: "marginrp",
      judul: "Margin Rp",
      angka: true,
      sekunder: true,
      sel: (p) =>
        p.punyaResep ? <Rupiah nilai={p.marginRp} /> : <span className="text-ink-faint">—</span>,
      urut: (p) => p.marginRp,
    },
    {
      kunci: "marginpersen",
      judul: "Margin %",
      angka: true,
      sel: (p) =>
        p.punyaResep ? (
          <span className={cn("font-medium", gayaMargin(p.marginPersen))}>
            {formatPersen(p.marginPersen)}
          </span>
        ) : (
          <span className="text-ink-faint">—</span>
        ),
      urut: (p) => p.marginPersen,
    },
    {
      kunci: "kontribusi",
      judul: "Kontribusi laba",
      angka: true,
      sel: (p) => <Rupiah nilai={p.totalKontribusi} />,
      urut: (p) => p.totalKontribusi,
    },
    {
      kunci: "kuadran",
      judul: "Kuadran",
      lebar: "112px",
      sel: (p) =>
        p.punyaResep && p.qtyTerjual > 0 ? (
          <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-muted">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: WARNA_KUADRAN[p.kuadran] }}
            />
            {LABEL_KUADRAN[p.kuadran]}
          </span>
        ) : (
          <span className="text-ink-faint">—</span>
        ),
      urut: (p) => p.kuadran,
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Analisis menu"
        keterangan="Profitabilitas penuh per menu. Kuadran ditentukan relatif terhadap median, bukan angka mutlak."
        aksi={
          <Tombol ukuran="sm">
            <Download size={13} strokeWidth={1.75} />
            Ekspor
          </Tombol>
        }
      />

      <div className="flex flex-wrap items-center gap-1 rounded-input bg-panel-sunken p-1">
        {URUTAN_PERIODE.map((p) => (
          <button
            key={p}
            onClick={() => setPeriode(p)}
            aria-pressed={periode === p}
            className={cn(
              "h-7 rounded-[3px] px-2.5 text-[13px] transition-colors",
              periode === p
                ? "bg-panel font-medium text-ink"
                : "text-ink-muted hover:text-ink",
            )}
          >
            {LABEL_PERIODE[p]}
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_auto]">
        <DataTable
          data={data}
          kolom={kolom}
          kunciBaris={(p) => p.menu.id}
          cari={(p) => `${p.menu.nama} ${p.menu.sku}`}
          filter={[
            {
              kunci: "kategori",
              label: "Semua kategori",
              opsi: (Object.keys(LABEL_KATEGORI_MENU) as KategoriMenu[]).map(
                (k) => ({ nilai: k, label: LABEL_KATEGORI_MENU[k] }),
              ),
            },
            {
              kunci: "kuadran",
              label: "Semua kuadran",
              opsi: (Object.keys(LABEL_KUADRAN) as Kuadran[]).map((k) => ({
                nilai: k,
                label: LABEL_KUADRAN[k],
              })),
            },
          ]}
          nilaiFilter={filter}
          onUbahFilter={(k, v) => setFilter((f) => ({ ...f, [k]: v }))}
          onKlikBaris={(p) => setTerpilih(p.menu.id)}
          barisTerpilih={(p) => p.menu.id === terpilih}
          garisKiri={(p) => (p.punyaResep ? undefined : "var(--watch)")}
          kartuMobile={(p) => (
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-ink">{p.menu.nama}</span>
                <span className={cn("num text-[13px]", gayaMargin(p.marginPersen))}>
                  {formatPersen(p.marginPersen)}
                </span>
              </div>
              <p className="t-small mt-1 text-ink-muted">
                {formatAngka(p.qtyTerjual)} porsi ·{" "}
                {formatRupiah(p.totalKontribusi)}
              </p>
              <p className="t-caption mt-0.5 text-ink-faint">
                {LABEL_KUADRAN[p.kuadran]}
              </p>
            </div>
          )}
        />

        {detail ? (
          <DetailMenuOwner
            data={detail}
            onTutup={() => setTerpilih(null)}
          />
        ) : null}
      </div>
    </div>
  );
}

function DetailMenuOwner({
  data,
  onTutup,
}: {
  data: ProfitabilitasMenu;
  onTutup: () => void;
}) {
  const rincian = React.useMemo(
    () => rincianHpp(data.menu.id),
    [data.menu.id],
  );
  const mingguan = React.useMemo(
    () => penjualanMingguanMenu(data.menu.id, 12),
    [data.menu.id],
  );
  const bulanan = React.useMemo(
    () => penjualanBulananMenu(data.menu.id),
    [data.menu.id],
  );

  return (
    <Panel className="anim-rise w-full self-start xl:sticky xl:top-20 xl:w-[380px]">
      <div className="flex items-start justify-between gap-2 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <h3 className="t-h3 text-ink">{data.menu.nama}</h3>
          <p className="t-caption text-ink-muted">
            <span className="num">{data.menu.sku}</span> ·{" "}
            {LABEL_KATEGORI_MENU[data.menu.kategori]}
          </p>
        </div>
        <button
          onClick={onTutup}
          className="rounded-input p-1 text-ink-faint transition-colors hover:bg-panel-sunken hover:text-ink"
          aria-label="Tutup detail"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: WARNA_KUADRAN[data.kuadran] }}
        />
        <span className="t-body-strong text-ink">
          {LABEL_KUADRAN[data.kuadran]}
        </span>
        <span className="t-caption text-ink-muted">
          {PENJELASAN_KUADRAN[data.kuadran]}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-px bg-line">
        {[
          { k: "Qty terjual", v: formatAngka(data.qtyTerjual) },
          { k: "Pendapatan", v: formatRupiah(data.pendapatan) },
          { k: "HPP per porsi", v: formatRupiah(data.hpp) },
          { k: "Margin", v: formatPersen(data.marginPersen) },
        ].map((x) => (
          <div key={x.k} className="bg-panel px-4 py-2.5">
            <dt className="t-caption text-ink-muted">{x.k}</dt>
            <dd className="num mt-0.5 text-[13px] font-medium text-ink">
              {x.v}
            </dd>
          </div>
        ))}
      </dl>

      {rincian.length > 0 ? (
        <div className="border-t border-line">
          <ChartFrame
            judul="Rincian HPP per bahan"
            tinggi={120}
            className="border-0"
            tabel={
              <TabelSetara
                kepala={["Bahan", "Qty", "Subtotal"]}
                baris={rincian.map((r) => [
                  r.bahan.nama,
                  `${r.qtyPerPorsi} ${r.satuan}`,
                  formatRupiah(r.subtotal, 2),
                ])}
              />
            }
          >
            <GrafikHppBertumpuk
              data={rincian.map((r) => ({
                nama: r.bahan.nama,
                subtotal: r.subtotal,
              }))}
            />
          </ChartFrame>
        </div>
      ) : (
        <p className="t-small border-t border-line px-4 py-3 text-watch">
          Resep belum diisi, jadi HPP menu ini belum bisa dihitung.
        </p>
      )}

      <div className="border-t border-line px-4 py-3">
        <h4 className="t-caption font-semibold uppercase tracking-wide text-ink-muted">
          Tren mingguan
        </h4>
        <div className="mt-2 h-24">
          <Sparkline data={mingguan} warna="var(--viz-2)" />
        </div>
      </div>

      <div className="border-t border-line px-4 py-3">
        <h4 className="t-caption font-semibold uppercase tracking-wide text-ink-muted">
          Tren bulanan 2025
        </h4>
        <div className="mt-2 h-24">
          <Sparkline data={bulanan} warna="var(--viz-1)" />
        </div>
      </div>
    </Panel>
  );
}
