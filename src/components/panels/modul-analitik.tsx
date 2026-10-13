"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";

import { ChartFrame } from "@/components/charts/chart-frame";
import { GrafikProyeksi } from "@/components/charts";
import {
  GrafikBatangKelompok,
  GrafikGarisMulti,
  WARNA_SERI,
} from "@/components/charts/operasional";
import { KpiCard } from "@/components/ui/kpi-card";
import {
  PageHeader,
  Panel,
  PanelHeader,
  Pil,
  Pilihan,
  Rupiah,
} from "@/components/ui/primitives";
import { PilStatusKirim } from "./modul-operasional";
import { menu } from "@/lib/data/seed";
import { HARI_INI } from "@/lib/data/seed";
import { resepMenu } from "@/lib/data/queries";
import {
  PERIODE_OPERASIONAL,
  cabang,
  cabangPerId,
  costControl,
  deretMingguan,
  forecastMingguan,
  kebutuhanBahanMingguDepan,
  labelPeriode,
  periodeDari,
  porsiCabang,
  useKoleksi,
  type BarisCostControl,
} from "@/lib/data/operasional";
import { LABEL_KATEGORI_MENU } from "@/lib/status";
import {
  formatAngka,
  formatPersen,
  formatQty,
  formatRupiah,
  formatRupiahRingkas,
  formatTanggal,
  keIsoTanggal,
  labelMinggu,
} from "@/lib/format";
import type { KategoriMenu } from "@/lib/types";
import { cn, jumlah } from "@/lib/utils";

const OPSI_KATEGORI = Object.entries(LABEL_KATEGORI_MENU) as [KategoriMenu, string][];
const PILIHAN_RENTANG = [8, 12, 20] as const;
const BULAN_BERJALAN = keIsoTanggal(HARI_INI).slice(0, 7);

function PilihCabang({ nilai, onUbah }: { nilai: string; onUbah: (v: string) => void }) {
  return (
    <Pilihan value={nilai} onChange={(e) => onUbah(e.target.value)} aria-label="Cabang">
      <option value="">Semua cabang</option>
      {cabang.map((c) => (
        <option key={c.id} value={c.id}>
          {c.nama}
        </option>
      ))}
    </Pilihan>
  );
}

function PilihKategori({ nilai, onUbah }: { nilai: string; onUbah: (v: string) => void }) {
  return (
    <Pilihan value={nilai} onChange={(e) => onUbah(e.target.value)} aria-label="Kategori produk">
      <option value="">Semua kategori</option>
      {OPSI_KATEGORI.map(([k, l]) => (
        <option key={k} value={k}>
          {l}
        </option>
      ))}
    </Pilihan>
  );
}

function PilihRentang({ nilai, onUbah }: { nilai: number; onUbah: (v: number) => void }) {
  return (
    <Pilihan value={nilai} onChange={(e) => onUbah(Number(e.target.value))} aria-label="Rentang waktu">
      {PILIHAN_RENTANG.map((n) => (
        <option key={n} value={n}>
          {n} minggu terakhir
        </option>
      ))}
    </Pilihan>
  );
}

// ---------------------------------------------------------------------------
// Fitur 7 & 15 — Tren penjualan per menu (mingguan)
// ---------------------------------------------------------------------------

export function ModulTren({ judul = "Tren penjualan per menu" }: { judul?: string }) {
  const { data: penjualan } = useKoleksi("penjualan");
  const [kategori, setKategori] = React.useState("");
  const [menuId, setMenuId] = React.useState("");
  const [cab, setCab] = React.useState("");
  const [rentang, setRentang] = React.useState<number>(12);

  const minggu = React.useMemo(
    () => [...new Set(penjualan.map((p) => p.periodeMulai))].sort().slice(-rentang),
    [penjualan, rentang],
  );

  const daftarMenu = React.useMemo(() => {
    const porsi = porsiCabang(cab || undefined);
    return menu
      .filter((m) => (!kategori || m.kategori === kategori) && (!menuId || m.id === menuId))
      .map((m) => {
        const qty = minggu.map((w) =>
          Math.round(
            (penjualan.find((p) => p.menuId === m.id && p.periodeMulai === w)?.qtyTerjual ?? 0) * porsi,
          ),
        );
        const paruh = Math.floor(qty.length / 2);
        const awal = jumlah(qty.slice(0, paruh));
        const akhir = jumlah(qty.slice(paruh));
        return {
          menu: m,
          qty,
          total: jumlah(qty),
          perubahan: awal ? ((akhir - awal) / awal) * 100 : 0,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [penjualan, minggu, kategori, menuId, cab]);

  // Grafik: maksimal 6 garis agar terbaca; tabel di bawah memuat semua menu.
  const digambar = daftarMenu.slice(0, 6);
  const dataGrafik = minggu.map((w, i) => {
    const titik: Record<string, string | number> = { label: labelMinggu(w) };
    for (const d of digambar) titik[d.menu.id] = d.qty[i];
    return titik;
  });

  return (
    <div className="space-y-4">
      <PageHeader
        judul={judul}
        keterangan="Pola permintaan tiap menu per minggu. Tanpa filter, seluruh menu ditampilkan di tabel; grafik menampilkan 6 menu terlaris."
        aksi={
          <>
            <PilihRentang nilai={rentang} onUbah={setRentang} />
            <PilihCabang nilai={cab} onUbah={setCab} />
            <PilihKategori nilai={kategori} onUbah={(v) => { setKategori(v); setMenuId(""); }} />
            <Pilihan value={menuId} onChange={(e) => setMenuId(e.target.value)} aria-label="Menu">
              <option value="">Semua menu</option>
              {menu
                .filter((m) => !kategori || m.kategori === kategori)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nama}
                  </option>
                ))}
            </Pilihan>
          </>
        }
      />

      <ChartFrame
        judul="Qty terjual per minggu"
        keterangan={`${digambar.length} dari ${daftarMenu.length} menu · ${minggu.length} minggu`}
        legenda={digambar.map((d, i) => ({ label: d.menu.nama, warna: WARNA_SERI[i] }))}
        tinggi={300}
      >
        <GrafikGarisMulti
          data={dataGrafik}
          seri={digambar.map((d, i) => ({ kunci: d.menu.id, label: d.menu.nama, warna: WARNA_SERI[i] }))}
          formatNilai={(v) => `${formatAngka(v)} porsi`}
        />
      </ChartFrame>

      <Panel>
        <PanelHeader judul="Rincian per menu" keterangan="Perubahan membandingkan paruh kedua rentang dengan paruh pertama." />
        <div className="scroll-thin max-h-[420px] overflow-auto">
          <table className="w-full text-[13px]">
            <thead className="sticky top-0 bg-panel-sunken text-[12px] text-ink-muted">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Menu</th>
                <th className="hidden px-3 py-2 text-left font-medium sm:table-cell">Kategori</th>
                <th className="px-3 py-2 text-right font-medium">Total</th>
                <th className="hidden px-3 py-2 text-right font-medium md:table-cell">Rata-rata/minggu</th>
                <th className="px-3 py-2 text-right font-medium">Perubahan</th>
              </tr>
            </thead>
            <tbody>
              {daftarMenu.map((d) => (
                <tr key={d.menu.id} className="border-t border-line">
                  <td className="px-3 py-1.5 font-medium text-ink">{d.menu.nama}</td>
                  <td className="hidden px-3 py-1.5 text-ink-muted sm:table-cell">{LABEL_KATEGORI_MENU[d.menu.kategori]}</td>
                  <td className="num px-3 py-1.5 text-right">{formatAngka(d.total)}</td>
                  <td className="num hidden px-3 py-1.5 text-right text-ink-muted md:table-cell">
                    {formatAngka(d.total / Math.max(1, minggu.length), 1)}
                  </td>
                  <td className={cn("num px-3 py-1.5 text-right", d.perubahan > 5 ? "text-fresh" : d.perubahan < -5 ? "text-critical" : "text-ink-muted")}>
                    {d.perubahan > 0 ? "↑" : d.perubahan < 0 ? "↓" : "→"} {formatPersen(Math.abs(d.perubahan))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fitur 8 & 16 — Dashboard Forecast
// ---------------------------------------------------------------------------

export function ModulForecast({ untukPemilik = false }: { untukPemilik?: boolean }) {
  const { data: penjualan } = useKoleksi("penjualan");
  const { data: anggaran } = useKoleksi("anggaran");
  const { data: pengeluaran } = useKoleksi("pengeluaran");
  const { data: pengiriman } = useKoleksi("pengiriman");
  const [kategori, setKategori] = React.useState("");
  const [cab, setCab] = React.useState("");
  const [rentang, setRentang] = React.useState<number>(12);

  const opsi = React.useMemo(
    () => ({ kategori: (kategori || undefined) as KategoriMenu | undefined, cabangId: cab || undefined }),
    [kategori, cab],
  );

  const hasil = React.useMemo(
    () => forecastMingguan(deretMingguan(penjualan, opsi), rentang),
    [penjualan, opsi, rentang],
  );
  const kebutuhan = React.useMemo(
    () => kebutuhanBahanMingguDepan(penjualan, opsi, resepMenu),
    [penjualan, opsi],
  );
  const cc = React.useMemo(
    () => costControl({ anggaran, pengeluaran, pengiriman, penjualan }, cab || undefined),
    [anggaran, pengeluaran, pengiriman, penjualan, cab],
  );

  const seri = hasil.seri.map((t) => ({ ...t, label: labelMinggu(t.label) }));
  const mingguDepan = hasil.prediksi[0];
  const aktualTerakhir = hasil.seri.filter((t) => t.aktual !== null).at(-1)?.aktual ?? 0;
  const totalBiayaBahan = jumlah(kebutuhan.bahan.map((b) => b.biaya));
  const bulanLalu = cc.filter((c) => c.periode < BULAN_BERJALAN).slice(-2);
  const trenPengeluaran =
    bulanLalu.length === 2 && bulanLalu[0].realisasiBahan
      ? ((bulanLalu[1].realisasiBahan - bulanLalu[0].realisasiBahan) / bulanLalu[0].realisasiBahan) * 100
      : 0;

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Forecast"
        keterangan={
          untukPemilik
            ? "Data historis dan prediksi sebagai dasar menentukan anggaran dan rencana pembelian. Hanya lihat."
            : "Data historis dan prediksi penjualan serta kebutuhan bahan baku untuk keputusan pengadaan."
        }
        aksi={
          <>
            <PilihRentang nilai={rentang} onUbah={setRentang} />
            <PilihCabang nilai={cab} onUbah={setCab} />
            <PilihKategori nilai={kategori} onUbah={setKategori} />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Prediksi minggu depan"
          nilai={mingguDepan?.prediksi ?? 0}
          format={(n) => `${formatAngka(n)} porsi`}
          delta={aktualTerakhir ? (((mingguDepan?.prediksi ?? 0) - aktualTerakhir) / aktualTerakhir) * 100 : undefined}
          pembanding={`Rentang ${formatAngka(mingguDepan?.bawah ?? 0)}–${formatAngka(mingguDepan?.atas ?? 0)}`}
        />
        <KpiCard
          label="Akurasi (MAE)"
          nilai={hasil.mae}
          format={(n) => `${formatAngka(n, 1)} porsi`}
          pembanding={`Rata-rata meleset ${formatPersen(hasil.maePersen)} · backtest ${hasil.backtest.length} minggu`}
        />
        <KpiCard
          label="Kebutuhan bahan minggu depan"
          nilai={totalBiayaBahan}
          format={formatRupiahRingkas}
          pembanding={`${kebutuhan.bahan.length} bahan dari resep`}
        />
        <KpiCard
          label="Tren pengeluaran bahan"
          nilai={bulanLalu[1]?.realisasiBahan ?? 0}
          format={formatRupiahRingkas}
          delta={trenPengeluaran}
          deltaTerbalik
          pembanding={bulanLalu[1] ? `${labelPeriode(bulanLalu[1].periode)} vs bulan sebelumnya` : undefined}
        />
      </div>

      <ChartFrame
        judul="Penjualan historis dan prediksi"
        keterangan="Garis utuh = aktual, garis putus = prediksi 4 minggu ke depan, area = rentang ketidakpastian (±1,25 × MAE)."
        legenda={[
          { label: "Aktual", warna: "var(--viz-1)" },
          { label: "Prediksi", warna: "var(--viz-4)", putus: true },
        ]}
        tinggi={300}
        tabel={
          <table className="w-full text-[13px]">
            <thead><tr className="text-ink-muted"><th className="py-1 text-left">Minggu</th><th className="text-right">Aktual</th><th className="text-right">Prediksi</th></tr></thead>
            <tbody>
              {seri.map((t) => (
                <tr key={t.label} className="border-t border-line">
                  <td className="py-1">{t.label}</td>
                  <td className="num text-right">{t.aktual === null ? "—" : formatAngka(t.aktual)}</td>
                  <td className="num text-right">{t.prediksi === null ? "—" : formatAngka(t.prediksi)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      >
        <GrafikProyeksi data={seri} />
      </ChartFrame>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader judul="Tabel nilai prediksi" keterangan="Granularitas mingguan" />
          <table className="w-full text-[13px]">
            <thead className="bg-panel-sunken text-[12px] text-ink-muted">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Minggu</th>
                <th className="px-3 py-2 text-right font-medium">Batas bawah</th>
                <th className="px-3 py-2 text-right font-medium">Prediksi</th>
                <th className="px-3 py-2 text-right font-medium">Batas atas</th>
              </tr>
            </thead>
            <tbody>
              {hasil.prediksi.map((p) => (
                <tr key={p.label} className="border-t border-line">
                  <td className="px-3 py-1.5">{labelMinggu(p.label)} · {formatTanggal(p.label)}</td>
                  <td className="num px-3 py-1.5 text-right text-ink-muted">{formatAngka(p.bawah ?? 0)}</td>
                  <td className="num px-3 py-1.5 text-right font-medium">{formatAngka(p.prediksi ?? 0)}</td>
                  <td className="num px-3 py-1.5 text-right text-ink-muted">{formatAngka(p.atas ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-line px-3 py-2">
            <p className="t-caption mb-1 font-medium text-ink">Menu dengan prediksi tertinggi</p>
            <ul className="t-caption grid grid-cols-1 gap-x-4 text-ink-muted sm:grid-cols-2">
              {kebutuhan.perMenu.slice(0, 6).map((m) => (
                <li key={m.menuId} className="flex justify-between">
                  <span className="truncate">{m.nama}</span>
                  <span className="num">{formatAngka(m.prediksi)}</span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>

        <Panel>
          <PanelHeader judul="Kebutuhan bahan baku minggu depan" keterangan="Prediksi per menu × resep (qty per porsi)" />
          <div className="scroll-thin max-h-80 overflow-auto">
            <table className="w-full text-[13px]">
              <thead className="sticky top-0 bg-panel-sunken text-[12px] text-ink-muted">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Bahan</th>
                  <th className="px-3 py-2 text-right font-medium">Kebutuhan</th>
                  <th className="px-3 py-2 text-right font-medium">Estimasi biaya</th>
                </tr>
              </thead>
              <tbody>
                {kebutuhan.bahan.slice(0, 25).map((b) => (
                  <tr key={b.ingredientId} className="border-t border-line">
                    <td className="px-3 py-1.5 font-medium">{b.nama}</td>
                    <td className="num px-3 py-1.5 text-right">{formatQty(Math.round(b.qty), b.satuan)}</td>
                    <td className="px-3 py-1.5 text-right"><Rupiah nilai={b.biaya} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <RingkasanCostControl data={cc} href={untukPemilik ? "/owner/cost-control" : undefined} />

      <p className="t-caption flex items-start gap-1.5 text-ink-faint">
        <Info size={13} strokeWidth={1.5} className="mt-0.5 shrink-0" />
        Metode: weighted moving average 4 minggu (bobot 0,1–0,4) ditambah tren linear 8 minggu, granularitas mingguan.
        Kebutuhan bahan = prediksi qty tiap menu × resep. MAE dihitung dari backtest one-step-ahead pada rentang yang dipilih.
        Angka per cabang memakai porsi penjualan cabang (Dago 42%, Kemang 33%, Kaliurang 25%).
      </p>
    </div>
  );
}

function RingkasanCostControl({ data, href }: { data: BarisCostControl[]; href?: string }) {
  const terakhir = data.filter((c) => c.periode < BULAN_BERJALAN).at(-1);
  if (!terakhir) return null;
  const selisih = terakhir.anggaranBahan + terakhir.anggaranLogistik - terakhir.realisasiBahan - terakhir.realisasiLogistik;
  return (
    <Panel>
      <PanelHeader
        judul="Ringkasan cost control"
        keterangan={labelPeriode(terakhir.periode)}
        aksi={
          href ? (
            <Link href={href} className="t-caption inline-flex items-center gap-1 text-brand hover:underline">
              Detail <ArrowRight size={12} />
            </Link>
          ) : undefined
        }
      />
      <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
        {[
          ["Anggaran", <Rupiah key="a" nilai={terakhir.anggaranBahan + terakhir.anggaranLogistik} />],
          ["Realisasi", <Rupiah key="r" nilai={terakhir.realisasiBahan + terakhir.realisasiLogistik} />],
          [selisih >= 0 ? "Sisa anggaran" : "Melampaui", <Rupiah key="s" nilai={Math.abs(selisih)} className={selisih < 0 ? "text-critical" : "text-fresh"} />],
          [terakhir.surplus >= 0 ? "Surplus" : "Defisit", <Rupiah key="p" nilai={Math.abs(terakhir.surplus)} className={terakhir.surplus < 0 ? "text-critical" : "text-fresh"} />],
        ].map(([l, v]) => (
          <div key={String(l)} className="bg-panel px-4 py-3">
            <p className="t-caption text-ink-muted">{l}</p>
            <p className="mt-1 text-[15px] font-semibold">{v}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Fitur 17 — Analisis cost control
// ---------------------------------------------------------------------------

function persenPakai(realisasi: number, anggaran: number) {
  return anggaran ? (realisasi / anggaran) * 100 : 0;
}

function SelPakai({ realisasi, anggaran }: { realisasi: number; anggaran: number }) {
  const p = persenPakai(realisasi, anggaran);
  const lewat = p > 100;
  return (
    <div className="flex items-center justify-end gap-2">
      <div className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-panel-sunken sm:block">
        <div
          className={cn("h-full rounded-full", lewat ? "bg-critical" : p > 90 ? "bg-watch" : "bg-fresh")}
          style={{ width: `${Math.min(100, p)}%` }}
        />
      </div>
      <span className={cn("num", lewat && "font-semibold text-critical")}>{formatPersen(p, 0)}</span>
      {lewat ? <Pil warna="bg-critical-bg text-critical">Melampaui</Pil> : null}
    </div>
  );
}

export function ModulCostControl() {
  const { data: penjualan } = useKoleksi("penjualan");
  const { data: anggaran } = useKoleksi("anggaran");
  const { data: pengeluaran } = useKoleksi("pengeluaran");
  const { data: pengiriman } = useKoleksi("pengiriman");
  const [cab, setCab] = React.useState("");
  const [bulan, setBulan] = React.useState("2026-08");

  const sumber = { anggaran, pengeluaran, pengiriman, penjualan };
  const data = costControl(sumber, cab || undefined);
  const perCabang = cabang.map((c) => ({
    cabang: c,
    baris: costControl(sumber, c.id).find((b) => b.periode === bulan)!,
  }));

  const grafik = data.map((d) => ({
    label: labelPeriode(d.periode).split(" ")[0].slice(0, 3),
    anggaran: d.anggaranBahan + d.anggaranLogistik,
    realisasi: d.realisasiBahan + d.realisasiLogistik,
  }));
  const grafikSurplus = data.map((d) => ({
    label: labelPeriode(d.periode).split(" ")[0].slice(0, 3),
    pendapatan: Math.round(d.pendapatan),
    pengeluaran: d.realisasiBahan + d.realisasiLogistik,
  }));
  const jumlahLewat = data.filter(
    (d) => d.realisasiBahan > d.anggaranBahan || d.realisasiLogistik > d.anggaranLogistik,
  ).length;

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Analisis cost control"
        keterangan="Anggaran yang ditetapkan dibandingkan realisasi pengeluaran, per kategori dan bulan. Pelampauan anggaran ditandai merah."
        aksi={<PilihCabang nilai={cab} onUbah={setCab} />}
      />

      {jumlahLewat ? (
        <div role="alert" className="rounded-panel border border-critical/30 bg-critical-bg px-3 py-2.5 text-[13px] text-critical">
          {jumlahLewat} dari {data.length} bulan melampaui anggaran pada setidaknya satu kategori
          {cab ? ` di cabang ${cabangPerId.get(cab)?.nama}` : ""}.
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartFrame
          judul="Anggaran vs realisasi"
          keterangan="Bahan baku + logistik"
          legenda={[
            { label: "Anggaran", warna: "var(--viz-7)" },
            { label: "Realisasi", warna: "var(--viz-2)" },
          ]}
          tinggi={240}
        >
          <GrafikBatangKelompok
            data={grafik}
            seri={[
              { kunci: "anggaran", label: "Anggaran", warna: "var(--viz-7)" },
              { kunci: "realisasi", label: "Realisasi", warna: "var(--viz-2)" },
            ]}
            formatNilai={formatRupiah}
          />
        </ChartFrame>
        <ChartFrame
          judul="Pendapatan vs pengeluaran operasional"
          keterangan="Selisihnya adalah surplus / defisit bulanan"
          legenda={[
            { label: "Pendapatan", warna: "var(--viz-1)" },
            { label: "Pengeluaran", warna: "var(--viz-5)" },
          ]}
          tinggi={240}
        >
          <GrafikBatangKelompok
            data={grafikSurplus}
            seri={[
              { kunci: "pendapatan", label: "Pendapatan", warna: "var(--viz-1)" },
              { kunci: "pengeluaran", label: "Pengeluaran", warna: "var(--viz-5)" },
            ]}
            formatNilai={formatRupiah}
          />
        </ChartFrame>
      </div>

      <Panel>
        <PanelHeader judul="Selisih per kategori per bulan" keterangan={cab ? cabangPerId.get(cab)?.nama : "Semua cabang"} />
        <div className="scroll-thin overflow-auto">
          <table className="w-full min-w-[760px] text-[13px]">
            <thead className="bg-panel-sunken text-[12px] text-ink-muted">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Bulan</th>
                <th className="px-3 py-2 text-right font-medium">Anggaran bahan</th>
                <th className="px-3 py-2 text-right font-medium">Realisasi bahan</th>
                <th className="px-3 py-2 text-right font-medium">Terpakai</th>
                <th className="px-3 py-2 text-right font-medium">Anggaran logistik</th>
                <th className="px-3 py-2 text-right font-medium">Realisasi logistik</th>
                <th className="px-3 py-2 text-right font-medium">Terpakai</th>
                <th className="px-3 py-2 text-right font-medium">Surplus / defisit</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.periode} className="border-t border-line">
                  <td className="px-3 py-2">
                    {labelPeriode(d.periode)}
                    {d.periode === BULAN_BERJALAN ? <span className="t-caption ml-1 text-ink-faint">(berjalan)</span> : null}
                  </td>
                  <td className="px-3 py-2 text-right"><Rupiah nilai={d.anggaranBahan} /></td>
                  <td className="px-3 py-2 text-right"><Rupiah nilai={d.realisasiBahan} /></td>
                  <td className="px-3 py-2"><SelPakai realisasi={d.realisasiBahan} anggaran={d.anggaranBahan} /></td>
                  <td className="px-3 py-2 text-right"><Rupiah nilai={d.anggaranLogistik} /></td>
                  <td className="px-3 py-2 text-right"><Rupiah nilai={d.realisasiLogistik} /></td>
                  <td className="px-3 py-2"><SelPakai realisasi={d.realisasiLogistik} anggaran={d.anggaranLogistik} /></td>
                  <td className={cn("px-3 py-2 text-right font-medium", d.surplus < 0 ? "text-critical" : "text-fresh")}>
                    {d.surplus < 0 ? "−" : "+"}
                    <Rupiah nilai={Math.abs(d.surplus)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          judul="Perbandingan antar cabang"
          aksi={
            <Pilihan value={bulan} onChange={(e) => setBulan(e.target.value)} aria-label="Bulan">
              {[...PERIODE_OPERASIONAL].reverse().map((p) => (
                <option key={p} value={p}>{labelPeriode(p)}</option>
              ))}
            </Pilihan>
          }
        />
        <div className="grid grid-cols-1 gap-px bg-line md:grid-cols-3">
          {perCabang.map(({ cabang: c, baris }) => (
            <div key={c.id} className="space-y-1.5 bg-panel px-4 py-3 text-[13px]">
              <p className="t-body-strong text-ink">{c.nama}</p>
              <div className="flex justify-between"><span className="text-ink-muted">Bahan baku</span><SelPakai realisasi={baris.realisasiBahan} anggaran={baris.anggaranBahan} /></div>
              <div className="flex justify-between"><span className="text-ink-muted">Logistik</span><SelPakai realisasi={baris.realisasiLogistik} anggaran={baris.anggaranLogistik} /></div>
              <div className="flex justify-between border-t border-line pt-1.5">
                <span className="text-ink-muted">{baris.surplus >= 0 ? "Surplus" : "Defisit"}</span>
                <Rupiah nilai={Math.abs(baris.surplus)} className={baris.surplus < 0 ? "text-critical" : "text-fresh"} />
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fitur 2 & 9 — Ringkasan dashboard per peran
// ---------------------------------------------------------------------------

export function RingkasanOperasional({ dasar }: { dasar: "/admin" | "/owner" }) {
  const { data: penjualan } = useKoleksi("penjualan");
  const { data: anggaran } = useKoleksi("anggaran");
  const { data: pengeluaran } = useKoleksi("pengeluaran");
  const { data: pengiriman } = useKoleksi("pengiriman");
  const [bulan, setBulan] = React.useState("2026-08");

  const b = costControl({ anggaran, pengeluaran, pengiriman, penjualan }).find((x) => x.periode === bulan)!;
  const kirimBulan = pengiriman.filter((p) => periodeDari(p.tanggal) === bulan);
  const belumDiterima = pengiriman.filter((p) => p.status !== "diterima").length;
  const totalAnggaran = b.anggaranBahan + b.anggaranLogistik;
  const totalRealisasi = b.realisasiBahan + b.realisasiLogistik;

  const kartu = [
    {
      label: "Anggaran",
      nilai: totalAnggaran,
      ket: `Bahan ${formatRupiahRingkas(b.anggaranBahan)} · logistik ${formatRupiahRingkas(b.anggaranLogistik)}`,
      href: `${dasar}/anggaran`,
    },
    {
      label: "Pengeluaran",
      nilai: totalRealisasi,
      ket: `${formatPersen(persenPakai(totalRealisasi, totalAnggaran), 0)} dari anggaran`,
      href: `${dasar}/pengeluaran`,
      peringatan: totalRealisasi > totalAnggaran,
    },
    {
      label: "Penjualan",
      nilai: b.pendapatan,
      ket: b.surplus >= 0 ? `Surplus ${formatRupiahRingkas(b.surplus)}` : `Defisit ${formatRupiahRingkas(-b.surplus)}`,
      href: `${dasar}/penjualan`,
    },
    {
      label: "Biaya pengiriman",
      nilai: jumlah(kirimBulan.map((p) => p.biaya)),
      ket: `${kirimBulan.length} pengiriman · ${belumDiterima} belum diterima`,
      href: `${dasar}/pengiriman`,
    },
  ];

  return (
    <section aria-label="Ringkasan operasional" className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="t-h3 text-ink">Ringkasan operasional</h2>
        <Pilihan value={bulan} onChange={(e) => setBulan(e.target.value)} aria-label="Bulan ringkasan">
          {[...PERIODE_OPERASIONAL].reverse().map((p) => (
            <option key={p} value={p}>
              {labelPeriode(p)}
              {p === BULAN_BERJALAN ? " (berjalan)" : ""}
            </option>
          ))}
        </Pilihan>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kartu.map((k) => (
          <Link key={k.label} href={k.href} className="block">
            <KpiCard label={k.label} nilai={k.nilai} format={formatRupiahRingkas} pembanding={k.ket} peringatan={k.peringatan} className="h-full hover:border-line-strong" />
          </Link>
        ))}
      </div>
    </section>
  );
}

/** Fitur 9 — rangkuman pengeluaran bulanan per cabang (hanya baca). */
export function RangkumanBulanan() {
  const { data: pengeluaran } = useKoleksi("pengeluaran");
  const { data: pengiriman } = useKoleksi("pengiriman");
  const baris = [...PERIODE_OPERASIONAL].reverse().map((per) => {
    const perCabang = cabang.map((c) =>
      jumlah(pengeluaran.filter((p) => p.cabangId === c.id && periodeDari(p.tanggal) === per).map((p) => p.nominal)),
    );
    const logistik = jumlah(
      pengiriman
        .filter((p) => periodeDari(p.tanggal) === per && p.tanggal <= keIsoTanggal(HARI_INI))
        .map((p) => p.biaya),
    );
    return { per, perCabang, logistik, total: jumlah(perCabang) + logistik };
  });

  return (
    <Panel>
      <PanelHeader judul="Rangkuman pengeluaran per bulan" keterangan="Dari data yang diinput Admin Operasional" />
      <div className="scroll-thin overflow-auto">
        <table className="w-full min-w-[640px] text-[13px]">
          <thead className="bg-panel-sunken text-[12px] text-ink-muted">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Bulan</th>
              {cabang.map((c) => (
                <th key={c.id} className="px-3 py-2 text-right font-medium">{c.nama}</th>
              ))}
              <th className="px-3 py-2 text-right font-medium">Logistik</th>
              <th className="px-3 py-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {baris.map((b) => (
              <tr key={b.per} className="border-t border-line">
                <td className="px-3 py-2">
                  {labelPeriode(b.per)}
                  {b.per === BULAN_BERJALAN ? <span className="t-caption ml-1 text-ink-faint">(berjalan)</span> : null}
                </td>
                {b.perCabang.map((n, i) => (
                  <td key={i} className="px-3 py-2 text-right"><Rupiah nilai={n} /></td>
                ))}
                <td className="px-3 py-2 text-right"><Rupiah nilai={b.logistik} /></td>
                <td className="px-3 py-2 text-right font-semibold"><Rupiah nilai={b.total} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/** Daftar tugas pengiriman untuk beranda Karyawan Logistik. */
export function TugasPengiriman() {
  const { data } = useKoleksi("pengiriman");
  const hariIni = keIsoTanggal(HARI_INI);
  const aktif = data
    .filter((p) => p.status !== "diterima")
    .sort((a, b) => (a.tanggal < b.tanggal ? -1 : 1));
  const hari = aktif.filter((p) => p.tanggal === hariIni);
  const terlambat = aktif.filter((p) => p.tanggal < hariIni);
  const diterimaMingguIni = data.filter(
    (p) => p.status === "diterima" && p.tanggal >= keIsoTanggal(new Date(HARI_INI.getTime() - 6 * 86_400_000)),
  ).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Kirim hari ini" nilai={hari.length} format={(n) => formatAngka(n)} pembanding={formatTanggal(HARI_INI)} />
        <KpiCard label="Dalam perjalanan" nilai={aktif.filter((p) => p.status === "dikirim").length} format={(n) => formatAngka(n)} pembanding="Menunggu konfirmasi diterima" />
        <KpiCard label="Dijadwalkan" nilai={aktif.filter((p) => p.status === "dijadwalkan").length} format={(n) => formatAngka(n)} pembanding="Belum berangkat" />
        <KpiCard
          label="Diterima 7 hari terakhir"
          nilai={diterimaMingguIni}
          format={(n) => formatAngka(n)}
          peringatan={terlambat.length > 0}
          pembanding={terlambat.length ? `${terlambat.length} lewat jadwal belum diterima` : "Tidak ada yang terlambat"}
        />
      </div>

      <Panel>
        <PanelHeader
          judul="Tugas pengiriman berikutnya"
          aksi={
            <Link href="/logistik/pengiriman" className="t-caption inline-flex items-center gap-1 text-brand hover:underline">
              Ubah status <ArrowRight size={12} />
            </Link>
          }
        />
        <ul className="divide-y divide-line">
          {aktif.slice(0, 8).map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px]">
              <div className="min-w-0">
                <p className="font-medium text-ink">
                  {cabangPerId.get(p.cabangId)?.nama} <span className="num font-normal text-ink-faint">· {p.kode}</span>
                </p>
                <p className="t-caption truncate text-ink-muted">
                  {formatTanggal(p.tanggal)} · {p.muatan} · {p.kurir}
                </p>
              </div>
              <PilStatusKirim status={p.status} />
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

