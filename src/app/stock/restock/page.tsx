"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Upload, X } from "lucide-react";

import { DataTable, type Kolom } from "@/components/ui/data-table";
import {
  Isian,
  Label,
  PageHeader,
  Panel,
  Pilihan,
  Rupiah,
  Tombol,
} from "@/components/ui/primitives";
import { ImportWizard } from "@/components/panels/import-wizard";
import { bahanPerId, pemasokPerId } from "@/lib/data/queries";
import { bahan, batch, pemasok } from "@/lib/data/seed";
import { LABEL_STATUS_RESTOCK } from "@/lib/status";
import {
  formatAngkaLuwes,
  formatQty,
  formatRupiah,
  formatTanggal,
  keIsoTanggal,
  tambahHari,
} from "@/lib/format";
import { HARI_INI } from "@/lib/data/seed";
import type { BatchRestock } from "@/lib/types";

export default function HalamanRestock() {
  const params = useSearchParams();
  const [formBuka, setFormBuka] = React.useState(params.get("baru") === "1");
  const [imporBuka, setImporBuka] = React.useState(false);
  const [filter, setFilter] = React.useState<Record<string, string>>({});
  const [kabar, setKabar] = React.useState<string | null>(null);
  const [barisBaru, setBarisBaru] = React.useState<Set<string>>(new Set());

  const data = React.useMemo(
    () =>
      batch.filter(
        (b) =>
          (!filter.pemasok || b.supplierId === filter.pemasok) &&
          (!filter.status || b.status === filter.status),
      ),
    [filter],
  );

  const kolom: Kolom<BatchRestock>[] = [
    {
      kunci: "bahan",
      judul: "Bahan",
      sel: (b) => (
        <span className="font-medium text-ink">
          {bahanPerId.get(b.ingredientId)?.nama ?? "—"}
        </span>
      ),
      urut: (b) => bahanPerId.get(b.ingredientId)?.nama ?? "",
    },
    {
      kunci: "pemasok",
      judul: "Pemasok",
      sekunder: true,
      sel: (b) => (
        <span className="text-ink-muted">
          {b.supplierId ? pemasokPerId.get(b.supplierId)?.nama : "—"}
        </span>
      ),
      urut: (b) => (b.supplierId ? pemasokPerId.get(b.supplierId)?.nama ?? "" : ""),
    },
    {
      kunci: "jumlah",
      judul: "Jumlah",
      angka: true,
      sel: (b) => formatQty(b.jumlah, b.satuan),
      urut: (b) => b.jumlah,
    },
    {
      kunci: "biaya",
      judul: "Total biaya",
      angka: true,
      sel: (b) => <Rupiah nilai={b.totalBiaya} />,
      urut: (b) => b.totalBiaya,
    },
    {
      kunci: "perunit",
      judul: "Biaya/unit",
      angka: true,
      sekunder: true,
      sel: (b) => <Rupiah nilai={b.biayaPerUnit} desimal={2} />,
      urut: (b) => b.biayaPerUnit,
    },
    {
      kunci: "terima",
      judul: "Diterima",
      sel: (b) => (
        <span className="text-ink-muted">{formatTanggal(b.tanggalTerima)}</span>
      ),
      urut: (b) => b.tanggalTerima,
    },
    {
      kunci: "exp",
      judul: "Kadaluarsa",
      sekunder: true,
      sel: (b) => (
        <span className="text-ink-muted">
          {formatTanggal(b.tanggalKadaluarsa)}
        </span>
      ),
      urut: (b) => b.tanggalKadaluarsa,
    },
    {
      kunci: "status",
      judul: "Status",
      sel: (b) => (
        <span className="text-ink-muted">{LABEL_STATUS_RESTOCK[b.status]}</span>
      ),
      urut: (b) => b.status,
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        judul="Restock"
        keterangan="Riwayat semua batch yang masuk. Tanggal kadaluarsa terisi otomatis dari tanggal terima + masa simpan bahan."
        aksi={
          <>
            <Tombol ukuran="sm" onClick={() => setImporBuka(true)}>
              <Upload size={14} strokeWidth={1.75} />
              Impor Excel
            </Tombol>
            <Tombol
              varian="utama"
              ukuran="sm"
              onClick={() => setFormBuka(true)}
            >
              <Plus size={14} strokeWidth={1.75} />
              Restock baru
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

      <DataTable
        data={data}
        kolom={kolom}
        kunciBaris={(b) => b.id}
        cari={(b) => bahanPerId.get(b.ingredientId)?.nama ?? ""}
        barisBaru={barisBaru}
        filter={[
          {
            kunci: "pemasok",
            label: "Semua pemasok",
            opsi: pemasok.map((p) => ({ nilai: p.id, label: p.nama })),
          },
          {
            kunci: "status",
            label: "Semua status",
            opsi: (["arrived", "ordered", "cancelled"] as const).map((s) => ({
              nilai: s,
              label: LABEL_STATUS_RESTOCK[s],
            })),
          },
        ]}
        nilaiFilter={filter}
        onUbahFilter={(k, v) => setFilter((f) => ({ ...f, [k]: v }))}
        kartuMobile={(b) => {
          const bh = bahanPerId.get(b.ingredientId);
          return (
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-ink">{bh?.nama}</span>
                <span className="t-caption text-ink-muted">
                  {LABEL_STATUS_RESTOCK[b.status]}
                </span>
              </div>
              <p className="t-small mt-1 text-ink-muted">
                {formatQty(b.jumlah, b.satuan)} · {formatRupiah(b.totalBiaya)}
              </p>
              <p className="t-caption mt-0.5 text-ink-faint">
                Diterima {formatTanggal(b.tanggalTerima)} · exp{" "}
                {formatTanggal(b.tanggalKadaluarsa)}
              </p>
            </div>
          );
        }}
      />

      {formBuka ? (
        <FormRestock
          onTutup={() => setFormBuka(false)}
          onSimpan={(jumlahBaris) => {
            setFormBuka(false);
            setKabar(`${jumlahBaris} batch tersimpan ke sistem.`);
            setBarisBaru(new Set([batch[0]?.id ?? ""]));
            setTimeout(() => setBarisBaru(new Set()), 1400);
          }}
        />
      ) : null}

      {imporBuka ? (
        <ImportWizard
          tipe="restock"
          onTutup={() => setImporBuka(false)}
          onSelesai={(n) => {
            setImporBuka(false);
            setKabar(`${n} baris restock tersimpan ke sistem.`);
          }}
        />
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------------- */

interface BarisCepat {
  id: number;
  bahanId: string;
  jumlah: string;
  totalBiaya: string;
}

function FormRestock({
  onTutup,
  onSimpan,
}: {
  onTutup: () => void;
  onSimpan: (jumlahBaris: number) => void;
}) {
  const [mode, setMode] = React.useState<"satu" | "cepat">("satu");

  // --- mode satu batch ---
  const [bahanId, setBahanId] = React.useState(bahan[0].id);
  const [supplierId, setSupplierId] = React.useState(pemasok[0].id);
  const [jumlah, setJumlah] = React.useState("");
  const [totalBiaya, setTotalBiaya] = React.useState("");
  const [tanggal, setTanggal] = React.useState(keIsoTanggal(HARI_INI));
  const [status, setStatus] = React.useState("arrived");
  const [catatan, setCatatan] = React.useState("");

  const bahanTerpilih = bahan.find((b) => b.id === bahanId)!;
  const angkaJumlah = Number(jumlah) || 0;
  const angkaBiaya = Number(totalBiaya) || 0;
  const perUnit = angkaJumlah ? angkaBiaya / angkaJumlah : 0;
  const kadaluarsa = keIsoTanggal(
    tambahHari(tanggal, bahanTerpilih.shelfLifeHari),
  );

  // --- mode input cepat ---
  const [baris, setBaris] = React.useState<BarisCepat[]>([
    { id: 1, bahanId: bahan[0].id, jumlah: "", totalBiaya: "" },
    { id: 2, bahanId: bahan[1].id, jumlah: "", totalBiaya: "" },
    { id: 3, bahanId: bahan[2].id, jumlah: "", totalBiaya: "" },
  ]);

  const barisTerisi = baris.filter(
    (b) => Number(b.jumlah) > 0 && Number(b.totalBiaya) > 0,
  );

  const bisaSimpan =
    mode === "satu"
      ? angkaJumlah > 0 && angkaBiaya > 0
      : barisTerisi.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/25 sm:items-center sm:p-5">
      <div className="fixed inset-0" onClick={onTutup} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="judul-restock"
        className="anim-rise relative flex max-h-[92dvh] w-full max-w-2xl flex-col rounded-t-modal border border-line bg-panel shadow-[var(--shadow-modal)] sm:rounded-modal"
      >
        <div className="flex items-start justify-between gap-2 border-b border-line px-4 py-3">
          <div>
            <h2 id="judul-restock" className="t-h2 text-ink">
              Restock baru
            </h2>
            <p className="t-caption mt-0.5 text-ink-muted">
              Biaya per unit dan tanggal kadaluarsa terisi otomatis, tapi bisa
              diubah.
            </p>
          </div>
          <button
            onClick={onTutup}
            className="rounded-input p-1 text-ink-faint transition-colors hover:bg-panel-sunken hover:text-ink"
            aria-label="Tutup"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        <div className="border-b border-line px-4 py-2.5">
          <div className="inline-flex items-center gap-1 rounded-input bg-panel-sunken p-1">
            {(
              [
                ["satu", "Satu batch"],
                ["cepat", "Input cepat"],
              ] as const
            ).map(([m, label]) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={
                  mode === m
                    ? "h-7 rounded-[3px] bg-panel px-2.5 text-[13px] font-medium text-ink"
                    : "h-7 rounded-[3px] px-2.5 text-[13px] text-ink-muted hover:text-ink"
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="scroll-thin min-h-0 flex-1 overflow-auto px-4 py-4">
          {mode === "satu" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="f-bahan" wajib>
                  Bahan
                </Label>
                <Pilihan
                  id="f-bahan"
                  value={bahanId}
                  onChange={(e) => setBahanId(e.target.value)}
                  className="h-10 w-full text-[14px]"
                >
                  {bahan.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nama} ({b.sku})
                    </option>
                  ))}
                </Pilihan>
              </div>

              <div>
                <Label htmlFor="f-pemasok">Pemasok</Label>
                <Pilihan
                  id="f-pemasok"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="h-10 w-full text-[14px]"
                >
                  {pemasok.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nama}
                    </option>
                  ))}
                </Pilihan>
              </div>

              <div>
                <Label htmlFor="f-status">Status pemesanan</Label>
                <Pilihan
                  id="f-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="h-10 w-full text-[14px]"
                >
                  <option value="arrived">Diterima</option>
                  <option value="ordered">Dipesan</option>
                  <option value="cancelled">Dibatalkan</option>
                </Pilihan>
              </div>

              <div>
                <Label htmlFor="f-jumlah" wajib>
                  Jumlah ({bahanTerpilih.satuan})
                </Label>
                <Isian
                  id="f-jumlah"
                  type="number"
                  inputMode="decimal"
                  value={jumlah}
                  onChange={(e) => setJumlah(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="f-total" wajib>
                  Total biaya (Rp)
                </Label>
                <Isian
                  id="f-total"
                  type="number"
                  inputMode="decimal"
                  value={totalBiaya}
                  onChange={(e) => setTotalBiaya(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div>
                <Label
                  htmlFor="f-perunit"
                  bantuan="Terhitung otomatis, bisa diubah"
                >
                  Biaya per unit
                </Label>
                <Isian
                  id="f-perunit"
                  terhitung
                  value={perUnit ? formatAngkaLuwes(perUnit, 2) : ""}
                  readOnly
                />
              </div>

              <div>
                <Label htmlFor="f-tanggal" wajib>
                  Tanggal pemesanan
                </Label>
                <Isian
                  id="f-tanggal"
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                />
              </div>

              <div>
                <Label
                  htmlFor="f-exp"
                  bantuan={`Terima + ${bahanTerpilih.shelfLifeHari} hari. Bisa diubah.`}
                >
                  Tanggal kadaluarsa
                </Label>
                <Isian id="f-exp" terhitung type="date" defaultValue={kadaluarsa} />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="f-catatan">Catatan</Label>
                <Isian
                  id="f-catatan"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Mis. nomor invoice"
                />
              </div>
            </div>
          ) : (
            <div>
              <p className="t-small mb-3 text-ink-muted">
                Isi baris per baris seperti di spreadsheet. Biaya per unit
                terhitung otomatis di kolom terakhir.
              </p>
              <div className="scroll-thin overflow-auto rounded-panel border border-line">
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr>
                      {["Bahan", "Jumlah", "Total biaya", "Biaya/unit", ""].map(
                        (h, i) => (
                          <th
                            key={h || i}
                            scope="col"
                            className="border-b border-line bg-panel-sunken px-2 py-2 text-left text-[12px] font-medium text-ink-muted"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {baris.map((r) => {
                      const b = bahan.find((x) => x.id === r.bahanId)!;
                      const j = Number(r.jumlah) || 0;
                      const t = Number(r.totalBiaya) || 0;
                      const pu = j ? t / j : 0;
                      return (
                        <tr key={r.id} className="border-b border-line last:border-0">
                          <td className="p-1.5">
                            <Pilihan
                              value={r.bahanId}
                              onChange={(e) =>
                                setBaris((s) =>
                                  s.map((x) =>
                                    x.id === r.id
                                      ? { ...x, bahanId: e.target.value }
                                      : x,
                                  ),
                                )
                              }
                              className="w-full"
                              aria-label="Bahan"
                            >
                              {bahan.map((x) => (
                                <option key={x.id} value={x.id}>
                                  {x.nama}
                                </option>
                              ))}
                            </Pilihan>
                          </td>
                          <td className="p-1.5">
                            <Isian
                              type="number"
                              value={r.jumlah}
                              onChange={(e) =>
                                setBaris((s) =>
                                  s.map((x) =>
                                    x.id === r.id
                                      ? { ...x, jumlah: e.target.value }
                                      : x,
                                  ),
                                )
                              }
                              className="h-9 text-[13px]"
                              placeholder={b.satuan}
                              aria-label="Jumlah"
                            />
                          </td>
                          <td className="p-1.5">
                            <Isian
                              type="number"
                              value={r.totalBiaya}
                              onChange={(e) =>
                                setBaris((s) =>
                                  s.map((x) =>
                                    x.id === r.id
                                      ? { ...x, totalBiaya: e.target.value }
                                      : x,
                                  ),
                                )
                              }
                              className="h-9 text-[13px]"
                              placeholder="Rp"
                              aria-label="Total biaya"
                            />
                          </td>
                          <td className="num px-2 text-right text-ink-muted">
                            {pu ? formatAngkaLuwes(pu, 2) : "—"}
                          </td>
                          <td className="px-1.5">
                            <button
                              onClick={() =>
                                setBaris((s) => s.filter((x) => x.id !== r.id))
                              }
                              className="rounded-input p-1 text-ink-faint hover:bg-panel-sunken hover:text-expired"
                              aria-label="Hapus baris"
                            >
                              <X size={14} strokeWidth={1.5} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Tombol
                ukuran="sm"
                className="mt-2"
                onClick={() =>
                  setBaris((s) => [
                    ...s,
                    {
                      id: Math.max(0, ...s.map((x) => x.id)) + 1,
                      bahanId: bahan[0].id,
                      jumlah: "",
                      totalBiaya: "",
                    },
                  ])
                }
              >
                <Plus size={13} strokeWidth={1.75} />
                Tambah baris
              </Tombol>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line px-4 py-3">
          <Tombol onClick={onTutup}>Batal</Tombol>
          <Tombol
            varian="utama"
            disabled={!bisaSimpan}
            onClick={() =>
              onSimpan(mode === "satu" ? 1 : barisTerisi.length)
            }
          >
            {mode === "satu"
              ? "Simpan batch"
              : `Simpan ${barisTerisi.length} baris`}
          </Tombol>
        </div>
      </div>
    </div>
  );
}
