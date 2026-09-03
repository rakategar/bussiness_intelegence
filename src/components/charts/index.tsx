"use client";

import * as React from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import {
  angkaRingkas,
  formatAngka,
  formatPersen,
  formatRupiah,
  formatRupiahRingkas,
} from "@/lib/format";
import {
  LABEL_KATEGORI_MENU,
  LABEL_KUADRAN,
  WARNA_KATEGORI_MENU,
  WARNA_KUADRAN,
} from "@/lib/status";
import type { KategoriMenu, ProfitabilitasMenu } from "@/lib/types";
import { cn } from "@/lib/utils";
import { GAYA_SUMBU, TooltipKustom } from "./chart-frame";

const DURASI = 700;

function pakaiGerakBerkurang() {
  const [kurangi, setKurangi] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setKurangi(mq.matches);
    const ubah = () => setKurangi(mq.matches);
    mq.addEventListener("change", ubah);
    return () => mq.removeEventListener("change", ubah);
  }, []);
  return kurangi;
}

/* ==========================================================================
   Garis: Pendapatan vs HPP
   ========================================================================== */

export function GrafikPendapatanHpp({
  data,
}: {
  data: { labelMinggu: string; pendapatan: number; hpp: number }[];
}) {
  const kurangi = pakaiGerakBerkurang();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -8 }}>
        <CartesianGrid vertical={false} stroke="var(--line)" />
        <XAxis
          dataKey="labelMinggu"
          tick={GAYA_SUMBU.tick}
          tickLine={false}
          axisLine={GAYA_SUMBU.line}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={GAYA_SUMBU.tick}
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={(v: number) => angkaRingkas(v)}
        />
        <Tooltip
          cursor={{ stroke: "var(--line-strong)", strokeWidth: 1 }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <TooltipKustom
                judul={label as string}
                baris={[
                  {
                    label: "Pendapatan",
                    nilai: formatRupiah(payload[0]?.value as number),
                    warna: "var(--viz-1)",
                  },
                  {
                    label: "HPP",
                    nilai: formatRupiah(payload[1]?.value as number),
                    warna: "var(--viz-4)",
                  },
                ]}
              />
            ) : null
          }
        />
        <Line
          type="monotone"
          dataKey="pendapatan"
          stroke="var(--viz-1)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
          isAnimationActive={!kurangi}
          animationDuration={DURASI}
          animationEasing="ease-out"
        />
        <Line
          type="monotone"
          dataKey="hpp"
          stroke="var(--viz-4)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
          isAnimationActive={!kurangi}
          animationDuration={DURASI}
          animationBegin={140}
          animationEasing="ease-out"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ==========================================================================
   Donat: komposisi penjualan per kategori
   ========================================================================== */

export function GrafikDonatKategori({
  data,
}: {
  data: { kategori: string; nilai: number }[];
}) {
  const kurangi = pakaiGerakBerkurang();
  const total = data.reduce((t, d) => t + d.nilai, 0);
  const [aktif, setAktif] = React.useState<number | null>(null);

  return (
    <div className="relative h-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="nilai"
            nameKey="kategori"
            innerRadius="58%"
            outerRadius="86%"
            paddingAngle={1.5}
            stroke="var(--panel)"
            strokeWidth={2}
            isAnimationActive={!kurangi}
            animationDuration={DURASI}
            animationEasing="ease-out"
            onMouseEnter={(_, i) => setAktif(i)}
            onMouseLeave={() => setAktif(null)}
          >
            {data.map((d, i) => (
              <Cell
                key={d.kategori}
                fill={
                  WARNA_KATEGORI_MENU[d.kategori as KategoriMenu] ??
                  `var(--viz-${(i % 7) + 1})`
                }
                opacity={aktif === null || aktif === i ? 1 : 0.45}
                style={{ transition: "opacity 160ms" }}
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) =>
              active && payload?.length ? (
                <TooltipKustom
                  judul={
                    LABEL_KATEGORI_MENU[
                      payload[0].payload.kategori as KategoriMenu
                    ] ?? payload[0].payload.kategori
                  }
                  baris={[
                    {
                      label: "Pendapatan",
                      nilai: formatRupiah(payload[0].value as number),
                    },
                    {
                      label: "Porsi",
                      nilai: formatPersen(
                        ((payload[0].value as number) / total) * 100,
                      ),
                    },
                  ]}
                />
              ) : null
            }
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Angka total di tengah donat */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="t-caption text-ink-muted">Total</span>
        <span className="num text-[18px] font-semibold text-ink">
          {formatRupiahRingkas(total)}
        </span>
      </div>
    </div>
  );
}

export function LegendaKategori({
  data,
}: {
  data: { kategori: string; nilai: number }[];
}) {
  const total = data.reduce((t, d) => t + d.nilai, 0);
  return (
    <ul className="space-y-1.5">
      {data.map((d) => (
        <li key={d.kategori} className="flex items-center gap-2 text-[12px]">
          <span
            className="h-2 w-2 shrink-0 rounded-[2px]"
            style={{
              background:
                WARNA_KATEGORI_MENU[d.kategori as KategoriMenu] ??
                "var(--viz-7)",
            }}
          />
          <span className="truncate text-ink-muted">
            {LABEL_KATEGORI_MENU[d.kategori as KategoriMenu] ?? d.kategori}
          </span>
          <span className="num ml-auto text-ink">
            {formatPersen(total ? (d.nilai / total) * 100 : 0)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ==========================================================================
   Batang horizontal: peringkat bahan / menu
   ========================================================================== */

export function GrafikBatangHorizontal({
  data,
  warna = "var(--viz-2)",
  formatNilai = (v: number) => formatRupiah(v),
  lebarLabel = 130,
}: {
  data: { label: string; nilai: number }[];
  warna?: string;
  formatNilai?: (v: number) => string;
  lebarLabel?: number;
}) {
  const kurangi = pakaiGerakBerkurang();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 2, right: 12, bottom: 0, left: 4 }}
        barCategoryGap={4}
      >
        <CartesianGrid horizontal={false} stroke="var(--line)" />
        <XAxis
          type="number"
          tick={GAYA_SUMBU.tick}
          tickLine={false}
          axisLine={GAYA_SUMBU.line}
          tickFormatter={(v: number) => angkaRingkas(v)}
        />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ ...GAYA_SUMBU.tick, fill: "var(--ink-muted)" }}
          tickLine={false}
          axisLine={false}
          width={lebarLabel}
        />
        <Tooltip
          cursor={{ fill: "var(--panel-sunken)" }}
          content={({ active, payload }) =>
            active && payload?.length ? (
              <TooltipKustom
                judul={payload[0].payload.label}
                baris={[
                  {
                    label: "Nilai",
                    nilai: formatNilai(payload[0].value as number),
                    warna,
                  },
                ]}
              />
            ) : null
          }
        />
        <Bar
          dataKey="nilai"
          fill={warna}
          radius={[0, 3, 3, 0]}
          isAnimationActive={!kurangi}
          animationDuration={DURASI}
          animationEasing="ease-out"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ==========================================================================
   Batang tegak sederhana (tren waste, konsumsi bahan)
   ========================================================================== */

export function GrafikBatang({
  data,
  warna = "var(--viz-5)",
  formatNilai = (v: number) => formatRupiah(v),
  namaSeri = "Nilai",
}: {
  data: { label: string; nilai: number }[];
  warna?: string;
  formatNilai?: (v: number) => string;
  namaSeri?: string;
}) {
  const kurangi = pakaiGerakBerkurang();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -10 }}>
        <CartesianGrid vertical={false} stroke="var(--line)" />
        <XAxis
          dataKey="label"
          tick={GAYA_SUMBU.tick}
          tickLine={false}
          axisLine={GAYA_SUMBU.line}
          interval="preserveStartEnd"
        />
        {/* Sumbu Y bar chart selalu mulai dari nol */}
        <YAxis
          domain={[0, "auto"]}
          tick={GAYA_SUMBU.tick}
          tickLine={false}
          axisLine={false}
          width={52}
          tickFormatter={(v: number) => angkaRingkas(v)}
        />
        <Tooltip
          cursor={{ fill: "var(--panel-sunken)" }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <TooltipKustom
                judul={label as string}
                baris={[
                  {
                    label: namaSeri,
                    nilai: formatNilai(payload[0].value as number),
                    warna,
                  },
                ]}
              />
            ) : null
          }
        />
        <Bar
          dataKey="nilai"
          fill={warna}
          radius={[3, 3, 0, 0]}
          isAnimationActive={!kurangi}
          animationDuration={DURASI}
          animationEasing="ease-out"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ==========================================================================
   Matriks kuadran — visual paling khas (DESIGN.md 3.6)
   Pembagi di MEDIAN volume dan MEDIAN margin, bukan nol.
   Ukuran titik proporsional dengan total kontribusi laba.
   ========================================================================== */

export function MatriksKuadran({
  data,
  medianQty,
  medianMargin,
  onKlikMenu,
}: {
  data: ProfitabilitasMenu[];
  medianQty: number;
  medianMargin: number;
  onKlikMenu?: (menuId: string) => void;
}) {
  const kurangi = pakaiGerakBerkurang();

  const titik = data
    .filter((d) => d.punyaResep && d.qtyTerjual > 0)
    .map((d) => ({
      x: d.qtyTerjual,
      y: d.marginPersen,
      z: Math.max(1, d.totalKontribusi),
      nama: d.menu.nama,
      menuId: d.menu.id,
      kuadran: d.kuadran,
      kontribusi: d.totalKontribusi,
      harga: d.menu.hargaJual,
      hpp: d.hpp,
    }));

  const maksX = Math.max(...titik.map((t) => t.x), 1);
  const maksY = Math.max(...titik.map((t) => t.y), 1);
  const minY = Math.min(...titik.map((t) => t.y), 0);

  return (
    <div className="relative h-full">
      {/* Label kuadran di keempat sudut, --ink-faint, ukuran caption */}
      <LabelKuadran posisi="kiri-atas" nama="Teka-teki" sub="untung, sepi" />
      <LabelKuadran posisi="kanan-atas" nama="Bintang" sub="untung, laku" />
      <LabelKuadran posisi="kiri-bawah" nama="Anjing" sub="sepi, tipis" />
      <LabelKuadran posisi="kanan-bawah" nama="Kuda Beban" sub="laku, tipis" />

      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 24, right: 20, bottom: 6, left: -6 }}>
          <CartesianGrid stroke="var(--line)" strokeDasharray="0" vertical={false} />
          <XAxis
            type="number"
            dataKey="x"
            name="Volume"
            domain={[0, Math.ceil(maksX * 1.08)]}
            tick={GAYA_SUMBU.tick}
            tickLine={false}
            axisLine={GAYA_SUMBU.line}
            label={{
              value: "Qty terjual",
              position: "insideBottomRight",
              offset: -2,
              fill: "var(--ink-faint)",
              fontSize: 11,
            }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Margin"
            domain={[Math.floor(minY * 0.9), Math.ceil(maksY * 1.06)]}
            tick={GAYA_SUMBU.tick}
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={(v: number) => `${Math.round(v)}%`}
          />
          <ZAxis type="number" dataKey="z" range={[36, 460]} />

          {/* Garis pembagi di median */}
          <ReferenceLine
            x={medianQty}
            stroke="var(--line-strong)"
            strokeDasharray="4 4"
          />
          <ReferenceLine
            y={medianMargin}
            stroke="var(--line-strong)"
            strokeDasharray="4 4"
          />

          <Tooltip
            cursor={{ strokeDasharray: "3 3", stroke: "var(--line-strong)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as (typeof titik)[number];
              return (
                <TooltipKustom
                  judul={
                    <span className="flex items-center gap-1.5">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: WARNA_KUADRAN[p.kuadran] }}
                      />
                      {p.nama}
                    </span>
                  }
                  baris={[
                    { label: "Kuadran", nilai: LABEL_KUADRAN[p.kuadran] },
                    { label: "Qty terjual", nilai: formatAngka(p.x) },
                    { label: "Margin", nilai: formatPersen(p.y) },
                    {
                      label: "Kontribusi laba",
                      nilai: formatRupiah(p.kontribusi),
                    },
                  ]}
                />
              );
            }}
          />

          <Scatter
            data={titik}
            isAnimationActive={!kurangi}
            animationDuration={DURASI}
            animationEasing="ease-out"
            onClick={(t) => {
              const id = (t as unknown as { menuId?: string })?.menuId;
              if (id) onKlikMenu?.(id);
            }}
            cursor={onKlikMenu ? "pointer" : undefined}
          >
            {titik.map((t) => (
              <Cell
                key={t.menuId}
                fill={WARNA_KUADRAN[t.kuadran]}
                fillOpacity={0.62}
                stroke={WARNA_KUADRAN[t.kuadran]}
                strokeWidth={1.2}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

function LabelKuadran({
  posisi,
  nama,
  sub,
}: {
  posisi: "kiri-atas" | "kanan-atas" | "kiri-bawah" | "kanan-bawah";
  nama: string;
  sub: string;
}) {
  const kelas = {
    "kiri-atas": "left-12 top-1",
    "kanan-atas": "right-4 top-1 text-right",
    "kiri-bawah": "bottom-8 left-12",
    "kanan-bawah": "bottom-8 right-4 text-right",
  }[posisi];

  return (
    <div className={cn("pointer-events-none absolute z-10", kelas)}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
        {nama}
      </p>
      <p className="text-[11px] leading-3 text-ink-faint/70">{sub}</p>
    </div>
  );
}

/* ==========================================================================
   Proyeksi: garis + area interval kepercayaan
   ========================================================================== */

export function GrafikProyeksi({
  data,
}: {
  data: {
    label: string;
    aktual: number | null;
    prediksi: number | null;
    bawah: number | null;
    atas: number | null;
  }[];
}) {
  const kurangi = pakaiGerakBerkurang();

  // Recharts menggambar area dari `bawah` setinggi `rentang`.
  const siap = data.map((d) => ({
    ...d,
    rentang:
      d.atas !== null && d.bawah !== null ? d.atas - d.bawah : null,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={siap}
        margin={{ top: 6, right: 10, bottom: 0, left: -8 }}
      >
        <CartesianGrid vertical={false} stroke="var(--line)" />
        <XAxis
          dataKey="label"
          tick={GAYA_SUMBU.tick}
          tickLine={false}
          axisLine={GAYA_SUMBU.line}
        />
        <YAxis
          tick={GAYA_SUMBU.tick}
          tickLine={false}
          axisLine={false}
          width={50}
          tickFormatter={(v: number) => angkaRingkas(v)}
        />
        <Tooltip
          cursor={{ stroke: "var(--line-strong)" }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload;
            const baris = [];
            if (p.aktual !== null)
              baris.push({
                label: "Aktual",
                nilai: `${formatAngka(p.aktual)} porsi`,
                warna: "var(--viz-1)",
              });
            if (p.prediksi !== null)
              baris.push({
                label: "Prediksi",
                nilai: `${formatAngka(p.prediksi)} porsi`,
                warna: "var(--viz-2)",
              });
            if (p.bawah !== null && p.atas !== null)
              baris.push({
                label: "Rentang 95%",
                nilai: `${formatAngka(p.bawah)}–${formatAngka(p.atas)}`,
              });
            return <TooltipKustom judul={label as string} baris={baris} />;
          }}
        />

        {/* Dasar area transparan, lalu pita rentangnya */}
        <Area
          dataKey="bawah"
          stackId="ci"
          stroke="none"
          fill="transparent"
          isAnimationActive={false}
          connectNulls
        />
        <Area
          dataKey="rentang"
          stackId="ci"
          stroke="none"
          fill="var(--viz-2)"
          fillOpacity={0.16}
          isAnimationActive={!kurangi}
          animationDuration={DURASI}
          connectNulls
        />

        <Line
          type="monotone"
          dataKey="aktual"
          stroke="var(--viz-1)"
          strokeWidth={2}
          dot={{ r: 2.5, strokeWidth: 0, fill: "var(--viz-1)" }}
          isAnimationActive={!kurangi}
          animationDuration={DURASI}
          connectNulls={false}
        />
        <Line
          type="monotone"
          dataKey="prediksi"
          stroke="var(--viz-2)"
          strokeWidth={2}
          strokeDasharray="5 4"
          dot={{ r: 3, strokeWidth: 0, fill: "var(--viz-2)" }}
          isAnimationActive={!kurangi}
          animationDuration={DURASI}
          animationBegin={180}
          connectNulls
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/* ==========================================================================
   Batang bertumpuk: rincian HPP per bahan
   ========================================================================== */

export function GrafikHppBertumpuk({
  data,
}: {
  data: { nama: string; subtotal: number }[];
}) {
  const kurangi = pakaiGerakBerkurang();
  const total = data.reduce((t, d) => t + d.subtotal, 0);
  // Maksimal 6 seri; sisanya digabung jadi "Lainnya".
  const utama = data.slice(0, 6);
  const sisa = data.slice(6);
  const seri = sisa.length
    ? [
        ...utama,
        { nama: "Lainnya", subtotal: sisa.reduce((t, d) => t + d.subtotal, 0) },
      ]
    : utama;

  const satuBaris = seri.reduce<Record<string, number>>(
    (o, d) => ({ ...o, [d.nama]: d.subtotal }),
    { name: "HPP" } as never,
  );

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={[satuBaris]}
        layout="vertical"
        margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
      >
        <XAxis
          type="number"
          domain={[0, total]}
          tick={GAYA_SUMBU.tick}
          tickLine={false}
          axisLine={GAYA_SUMBU.line}
          tickFormatter={(v: number) => angkaRingkas(v)}
        />
        <YAxis type="category" dataKey="name" hide />
        <Tooltip
          cursor={{ fill: "transparent" }}
          content={({ active, payload }) =>
            active && payload?.length ? (
              <TooltipKustom
                judul="Rincian HPP"
                baris={payload.map((p, i) => ({
                  label: String(p.dataKey),
                  nilai: formatRupiah(p.value as number),
                  warna: `var(--viz-${(i % 7) + 1})`,
                }))}
              />
            ) : null
          }
        />
        <Legend
          verticalAlign="top"
          align="left"
          iconType="square"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, color: "var(--ink-muted)", paddingBottom: 8 }}
        />
        {seri.map((d, i) => (
          <Bar
            key={d.nama}
            dataKey={d.nama}
            stackId="hpp"
            fill={`var(--viz-${(i % 7) + 1})`}
            isAnimationActive={!kurangi}
            animationDuration={DURASI}
            radius={
              i === 0
                ? [3, 0, 0, 3]
                : i === seri.length - 1
                  ? [0, 3, 3, 0]
                  : 0
            }
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ==========================================================================
   Sparkline mungil untuk panel detail
   ========================================================================== */

export function Sparkline({
  data,
  warna = "var(--viz-2)",
}: {
  data: { label: string; qty: number }[];
  warna?: string;
}) {
  const kurangi = pakaiGerakBerkurang();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: -20 }}>
        <CartesianGrid vertical={false} stroke="var(--line)" />
        <XAxis
          dataKey="label"
          tick={{ ...GAYA_SUMBU.tick, fontSize: 10 }}
          tickLine={false}
          axisLine={GAYA_SUMBU.line}
        />
        <YAxis
          domain={[0, "auto"]}
          tick={{ ...GAYA_SUMBU.tick, fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          width={44}
          tickFormatter={(v: number) => angkaRingkas(v)}
        />
        <Tooltip
          cursor={{ fill: "var(--panel-sunken)" }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <TooltipKustom
                judul={label as string}
                baris={[
                  {
                    label: "Qty",
                    nilai: formatAngka(payload[0].value as number),
                    warna,
                  },
                ]}
              />
            ) : null
          }
        />
        <Bar
          dataKey="qty"
          fill={warna}
          radius={[2, 2, 0, 0]}
          isAnimationActive={!kurangi}
          animationDuration={500}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
