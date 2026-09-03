"use client";

import * as React from "react";

import {
  Isian,
  Label,
  PageHeader,
  Panel,
  PanelHeader,
  Tombol,
} from "@/components/ui/primitives";

interface Pengaturan {
  shelfLife: string;
  bufferForecast: string;
  tingkatLayanan: string;
  leadTime: string;
  ambangWaspada: string;
  ambangBahaya: string;
}

const AWAL: Pengaturan = {
  shelfLife: "14",
  bufferForecast: "1.05",
  tingkatLayanan: "1.65",
  leadTime: "3",
  ambangWaspada: "5",
  ambangBahaya: "2",
};

export default function HalamanPengaturan() {
  const [nilai, setNilai] = React.useState(AWAL);
  const [kabar, setKabar] = React.useState<string | null>(null);

  const ubah = (k: keyof Pengaturan) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setNilai((s) => ({ ...s, [k]: e.target.value }));

  const berubah = JSON.stringify(nilai) !== JSON.stringify(AWAL);

  return (
    <div className="max-w-3xl space-y-4">
      <PageHeader
        judul="Pengaturan"
        keterangan="Angka-angka ini dipakai di seluruh perhitungan stok dan forecast. Mengubahnya langsung memengaruhi rekomendasi restock."
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
        <PanelHeader
          judul="Stok & kadaluarsa"
          keterangan="Dipakai saat menghitung tanggal kadaluarsa dan batas jumlah pesan."
        />
        <div className="grid gap-4 px-4 py-4 sm:grid-cols-2">
          <div>
            <Label
              htmlFor="p-shelf"
              bantuan="Dipakai kalau bahan tidak punya masa simpan sendiri."
            >
              Masa simpan bawaan (hari)
            </Label>
            <Isian
              id="p-shelf"
              type="number"
              value={nilai.shelfLife}
              onChange={ubah("shelfLife")}
            />
          </div>
          <div>
            <Label
              htmlFor="p-lead"
              bantuan="Dipakai kalau pemasok belum punya lead time sendiri."
            >
              Lead time pemasok bawaan (hari)
            </Label>
            <Isian
              id="p-lead"
              type="number"
              value={nilai.leadTime}
              onChange={ubah("leadTime")}
            />
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          judul="Forecast"
          keterangan="Menentukan seberapa konservatif rekomendasi jumlah pesan."
        />
        <div className="grid gap-4 px-4 py-4 sm:grid-cols-2">
          <div>
            <Label
              htmlFor="p-buffer"
              bantuan="1,05 berarti buffer pemborosan 5% di atas kebutuhan terhitung."
            >
              Faktor buffer
            </Label>
            <Isian
              id="p-buffer"
              type="number"
              step="0.01"
              value={nilai.bufferForecast}
              onChange={ubah("bufferForecast")}
            />
          </div>
          <div>
            <Label
              htmlFor="p-layanan"
              bantuan="1,65 setara tingkat layanan 95%. Semakin tinggi, semakin besar safety stock."
            >
              Tingkat layanan safety stock
            </Label>
            <Isian
              id="p-layanan"
              type="number"
              step="0.01"
              value={nilai.tingkatLayanan}
              onChange={ubah("tingkatLayanan")}
            />
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          judul="Ambang penilaian"
          keterangan="Menentukan kapan kartu pembuka di beranda Owner berubah jadi Waspada atau Bahaya."
        />
        <div className="grid gap-4 px-4 py-4 sm:grid-cols-2">
          <div>
            <Label
              htmlFor="p-waspada"
              bantuan="Nilai risiko kadaluarsa di atas persentase ini dari pendapatan memicu status Waspada."
            >
              Ambang Waspada (% pendapatan)
            </Label>
            <Isian
              id="p-waspada"
              type="number"
              value={nilai.ambangWaspada}
              onChange={ubah("ambangWaspada")}
            />
          </div>
          <div>
            <Label
              htmlFor="p-bahaya"
              bantuan="Jumlah kondisi Waspada yang harus terpenuhi sekaligus untuk jadi Bahaya."
            >
              Ambang Bahaya (jumlah kondisi)
            </Label>
            <Isian
              id="p-bahaya"
              type="number"
              value={nilai.ambangBahaya}
              onChange={ubah("ambangBahaya")}
            />
          </div>
        </div>
      </Panel>

      <div className="flex items-center justify-end gap-2">
        <Tombol onClick={() => setNilai(AWAL)} disabled={!berubah}>
          Kembalikan ke bawaan
        </Tombol>
        <Tombol
          varian="utama"
          disabled={!berubah}
          onClick={() => setKabar("Pengaturan tersimpan.")}
        >
          Simpan pengaturan
        </Tombol>
      </div>
    </div>
  );
}
