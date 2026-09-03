"use client";

import * as React from "react";
import { Plus, TriangleAlert, Upload } from "lucide-react";

import { DataTable, type Kolom } from "@/components/ui/data-table";
import { ImportWizard } from "@/components/panels/import-wizard";
import {
  Isian,
  Label,
  PageHeader,
  Panel,
  Pilihan,
  Rupiah,
  Tombol,
} from "@/components/ui/primitives";
import { menuPerId, penjualanMingguan } from "@/lib/data/queries";
import { menu, mingguan } from "@/lib/data/seed";
import {
  formatAngka,
  formatRentang,
  keIsoTanggal,
  labelMinggu,
} from "@/lib/format";
import type { CatatanPenjualan } from "@/lib/types";

export default function HalamanPenjualan() {
  const [imporBuka, setImporBuka] = React.useState(false);
  const [manualBuka, setManualBuka] = React.useState(false);
  const [filter, setFilter] = React.useState<Record<string, string>>({});
  const [kabar, setKabar] = React.useState<string | null>(null);

  const data = React.useMemo(
    () =>
      penjualanMingguan.filter(
        (p) =>
          (!filter.periode || p.periodeMulai === filter.periode) &&
          (!filter.menu || p.menuId === filter.menu),
      ),
    [filter],
  );

  // Peringatan periode bolong: minggu yang ada di rentang tapi tanpa data.
  const periodeBolong = React.useMemo(() => {
    const adaData = new Set(penjualanMingguan.map((p) => p.periodeMulai));
    return mingguan
      .slice(0, -1)
      .filter((s) => !adaData.has(keIsoTanggal(s)))
      .map((s) => labelMinggu(s));
  }, []);

  const kolom: Kolom<CatatanPenjualan>[] = [
    {
      kunci: "periode",
      judul: "Periode",
      sel: (p) => (
        <span className="text-ink-muted">
          {formatRentang(p.periodeMulai, p.periodeSelesai)}
        </span>
      ),
      urut: (p) => p.periodeMulai,
    },
    {
      kunci: "menu",
      judul: "Menu",
      sel: (p) => (
        <span className="font-medium text-ink">
          {menuPerId.get(p.menuId)?.nama ?? "—"}
        </span>
      ),
      urut: (p) => menuPerId.get(p.menuId)?.nama ?? "",
    },
    {
      kunci: "sku",
      judul: "SKU",
      sekunder: true,
      sel: (p) => (
        <span className="num text-ink-muted">
          {menuPerId.get(p.menuId)?.sku}
        </span>
      ),
      urut: (p) => menuPerId.get(p.menuId)?.sku ?? "",
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
      judul: "Harga saat itu",
      angka: true,
      sekunder: true,
      sel: (p) => <Rupiah nilai={p.hargaSaatItu} />,
      urut: (p) => p.hargaSaatItu,
    },
    {
      kunci: "pendapatan",
      judul: "Pendapatan",
      angka: true,
      sel: (p) => <Rupiah nilai={p.qtyTerjual * p.hargaSaatItu} />,
      urut: (p) => p.qtyTerjual * p.hargaSaatItu,
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Penjualan"
        keterangan="Setelah impor tersimpan, stok bahan otomatis berkurang mengikuti resep dengan metode FEFO."
        aksi={
          <>
            <Tombol ukuran="sm" onClick={() => setManualBuka(true)}>
              <Plus size={14} strokeWidth={1.75} />
              Input manual
            </Tombol>
            <Tombol
              varian="utama"
              ukuran="sm"
              onClick={() => setImporBuka(true)}
            >
              <Upload size={14} strokeWidth={1.75} />
              Impor Excel
            </Tombol>
          </>
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

      {periodeBolong.length > 0 ? (
        <div className="flex items-start gap-2 rounded-panel border border-line bg-watch-bg px-3 py-2.5">
          <TriangleAlert
            size={15}
            strokeWidth={1.5}
            className="mt-0.5 shrink-0 text-watch"
          />
          <p className="t-small prose-width text-watch">
            Ada periode yang bolong: {periodeBolong.join(", ")}. Analisis tren
            dan forecast akan meleset selama data ini belum diisi.
          </p>
        </div>
      ) : null}

      <DataTable
        data={data}
        kolom={kolom}
        kunciBaris={(p) => p.id}
        cari={(p) => menuPerId.get(p.menuId)?.nama ?? ""}
        filter={[
          {
            kunci: "periode",
            label: "Semua periode",
            opsi: [...mingguan].reverse().map((s) => ({
              nilai: keIsoTanggal(s),
              label: labelMinggu(s),
            })),
          },
          {
            kunci: "menu",
            label: "Semua menu",
            opsi: menu.map((m) => ({ nilai: m.id, label: m.nama })),
          },
        ]}
        nilaiFilter={filter}
        onUbahFilter={(k, v) => setFilter((f) => ({ ...f, [k]: v }))}
        kartuMobile={(p) => (
          <div>
            <div className="flex items-start justify-between gap-2">
              <span className="font-medium text-ink">
                {menuPerId.get(p.menuId)?.nama}
              </span>
              <span className="num text-[13px] text-ink">
                {formatAngka(p.qtyTerjual)}
              </span>
            </div>
            <p className="t-caption mt-0.5 text-ink-faint">
              {formatRentang(p.periodeMulai, p.periodeSelesai)}
            </p>
          </div>
        )}
      />

      {imporBuka ? (
        <ImportWizard
          tipe="sales"
          onTutup={() => setImporBuka(false)}
          onSelesai={(n) => {
            setImporBuka(false);
            setKabar(`${n} baris penjualan tersimpan. Stok dikurangi FEFO.`);
          }}
        />
      ) : null}

      {manualBuka ? (
        <FormManual
          onTutup={() => setManualBuka(false)}
          onSimpan={(nama, qty) => {
            setManualBuka(false);
            setKabar(`Penjualan ${nama} sebanyak ${formatAngka(qty)} porsi tersimpan.`);
          }}
        />
      ) : null}
    </div>
  );
}

function FormManual({
  onTutup,
  onSimpan,
}: {
  onTutup: () => void;
  onSimpan: (nama: string, qty: number) => void;
}) {
  const [menuId, setMenuId] = React.useState(menu[0].id);
  const [periode, setPeriode] = React.useState(
    keIsoTanggal(mingguan[mingguan.length - 1]),
  );
  const [qty, setQty] = React.useState("");

  const m = menu.find((x) => x.id === menuId)!;
  const angka = Number(qty) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/25 sm:items-center sm:p-5">
      <div className="fixed inset-0" onClick={onTutup} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        className="anim-rise relative w-full max-w-md rounded-t-modal border border-line bg-panel shadow-[var(--shadow-modal)] sm:rounded-modal"
      >
        <div className="border-b border-line px-4 py-3">
          <h2 className="t-h2 text-ink">Input penjualan manual</h2>
          <p className="t-caption mt-0.5 text-ink-muted">
            Untuk koreksi atau periode yang tidak ada di export kasir.
          </p>
        </div>

        <div className="space-y-4 px-4 py-4">
          <div>
            <Label htmlFor="m-menu" wajib>
              Menu
            </Label>
            <Pilihan
              id="m-menu"
              value={menuId}
              onChange={(e) => setMenuId(e.target.value)}
              className="h-10 w-full text-[14px]"
            >
              {menu.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.nama} ({x.sku})
                </option>
              ))}
            </Pilihan>
          </div>

          <div>
            <Label htmlFor="m-periode" wajib>
              Minggu
            </Label>
            <Pilihan
              id="m-periode"
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              className="h-10 w-full text-[14px]"
            >
              {[...mingguan].reverse().map((s) => (
                <option key={keIsoTanggal(s)} value={keIsoTanggal(s)}>
                  {labelMinggu(s)}
                </option>
              ))}
            </Pilihan>
          </div>

          <div>
            <Label htmlFor="m-qty" wajib>
              Qty terjual
            </Label>
            <Isian
              id="m-qty"
              type="number"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="0"
            />
          </div>

          <div>
            <Label htmlFor="m-pendapatan" bantuan="Terhitung otomatis dari harga jual menu.">
              Pendapatan
            </Label>
            <Isian
              id="m-pendapatan"
              terhitung
              readOnly
              value={new Intl.NumberFormat("id-ID").format(
                angka * m.hargaJual,
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-line px-4 py-3">
          <Tombol onClick={onTutup}>Batal</Tombol>
          <Tombol
            varian="utama"
            disabled={angka <= 0}
            onClick={() => onSimpan(m.nama, angka)}
          >
            Simpan
          </Tombol>
        </div>
      </div>
    </div>
  );
}
