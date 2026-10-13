"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { angkaRingkas } from "@/lib/format";
import { useGerakBerkurang } from "@/lib/hooks";
import { GAYA_SUMBU, TooltipKustom } from "./chart-frame";

const DURASI = 700;

export interface Seri {
  kunci: string;
  label: string;
  warna: string;
}

/** Batang berkelompok — mis. anggaran vs realisasi per bulan. */
export function GrafikBatangKelompok({
  data,
  seri,
  formatNilai,
}: {
  data: Record<string, string | number>[];
  seri: Seri[];
  formatNilai: (v: number) => string;
}) {
  const kurangi = useGerakBerkurang();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -6 }} barGap={2}>
        <CartesianGrid vertical={false} stroke="var(--line)" />
        <XAxis dataKey="label" tick={GAYA_SUMBU.tick} tickLine={false} axisLine={GAYA_SUMBU.line} />
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
                baris={payload.map((p) => ({
                  label: String(p.name),
                  nilai: formatNilai(Number(p.value)),
                  warna: String(p.color),
                }))}
              />
            ) : null
          }
        />
        {seri.map((s) => (
          <Bar
            key={s.kunci}
            dataKey={s.kunci}
            name={s.label}
            fill={s.warna}
            radius={[3, 3, 0, 0]}
            isAnimationActive={!kurangi}
            animationDuration={DURASI}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Garis banyak seri — tren penjualan mingguan per menu. */
export function GrafikGarisMulti({
  data,
  seri,
  formatNilai,
}: {
  data: Record<string, string | number>[];
  seri: Seri[];
  formatNilai: (v: number) => string;
}) {
  const kurangi = useGerakBerkurang();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 6, right: 10, bottom: 0, left: -8 }}>
        <CartesianGrid vertical={false} stroke="var(--line)" />
        <XAxis dataKey="label" tick={GAYA_SUMBU.tick} tickLine={false} axisLine={GAYA_SUMBU.line} interval="preserveStartEnd" />
        <YAxis
          tick={GAYA_SUMBU.tick}
          tickLine={false}
          axisLine={false}
          width={46}
          tickFormatter={(v: number) => angkaRingkas(v)}
        />
        <Tooltip
          cursor={{ stroke: "var(--line-strong)" }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <TooltipKustom
                judul={label as string}
                baris={payload.map((p) => ({
                  label: String(p.name),
                  nilai: formatNilai(Number(p.value)),
                  warna: String(p.color),
                }))}
              />
            ) : null
          }
        />
        {seri.map((s) => (
          <Line
            key={s.kunci}
            type="monotone"
            dataKey={s.kunci}
            name={s.label}
            stroke={s.warna}
            strokeWidth={2}
            dot={false}
            isAnimationActive={!kurangi}
            animationDuration={DURASI}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export const WARNA_SERI = [
  "var(--viz-1)",
  "var(--viz-2)",
  "var(--viz-3)",
  "var(--viz-4)",
  "var(--viz-5)",
  "var(--viz-6)",
];
