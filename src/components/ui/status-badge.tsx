import { cn } from "@/lib/utils";
import { GAYA_STATUS, LABEL_STATUS } from "@/lib/status";
import type { StatusKesegaran } from "@/lib/types";

/**
 * Lencana status — komponen paling penting (DESIGN.md 3.1).
 * Selalu ada teksnya; warna saja tidak cukup untuk aksesibilitas.
 */
export function StatusBadge({
  status,
  sisaHari,
  className,
  ringkas,
}: {
  status: StatusKesegaran;
  sisaHari?: number;
  className?: string;
  ringkas?: boolean;
}) {
  const g = GAYA_STATUS[status];
  const label = LABEL_STATUS[status];

  const keterangan =
    sisaHari === undefined
      ? undefined
      : sisaHari <= 0
        ? `lewat ${Math.abs(sisaHari)} hari`
        : `${sisaHari} hari`;

  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-[999px] px-2 text-[12px] font-medium leading-none",
        g.latar,
        g.teks,
        className,
      )}
      aria-label={
        keterangan ? `${label}, sisa ${keterangan}` : `Status ${label}`
      }
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", g.titik)} />
      {label}
      {keterangan && !ringkas ? (
        <span className="num font-normal opacity-80">{keterangan}</span>
      ) : null}
    </span>
  );
}

/** Titik status telanjang, untuk bilah 20 titik di beranda Stock. */
export function TitikStatus({
  status,
  className,
  style,
}: {
  status: StatusKesegaran;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={cn(
        "block h-2.5 w-2.5 rounded-full",
        GAYA_STATUS[status].titik,
        className,
      )}
      style={style}
    />
  );
}
