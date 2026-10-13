import { NextResponse } from "next/server";
import { z } from "zod";

import { hitungBaseline } from "@/lib/forecast";
import {
  konsumsiUntukTabel,
  penilaianMinggu,
  profitabilitas,
  rentangMingguKe,
  ringkasan,
  risikoKadaluarsa,
  semuaStok,
  totalNilaiRisiko,
} from "@/lib/data/queries";
import { formatRentang, formatRupiah } from "@/lib/format";
import { perubahanPersen } from "@/lib/utils";

/**
 * Lapisan 2 forecasting — narasi dari Gemini.
 *
 * Kunci API HANYA dibaca di sini (server). Tidak pernah ada prefix
 * NEXT_PUBLIC_, tidak pernah masuk bundel klien. Browser memanggil route
 * ini, route ini yang memanggil Google.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.1-flash-lite";
const CACHE_MS = 6 * 60 * 60 * 1000; // 6 jam
const BATAS_HARIAN = 20;
const TIMEOUT_MS = 30_000;

// Cache & penghitung sederhana. Di produksi ini pindah ke tabel forecasts.
const cache = new Map<string, { pada: number; data: unknown }>();
let pemakaianHariIni = { tanggal: "", jumlah: 0 };

const SkemaKeluaran = z.object({
  penilaian_risiko: z.object({
    status: z.enum(["aman", "waspada", "bahaya"]),
    skor: z.number(),
    temuan_utama: z.array(z.string()).max(6),
    penjelasan: z.string(),
  }),
  proyeksi_naratif: z.object({
    minggu_depan: z.string(),
    bulan_depan: z.string(),
    asumsi: z.array(z.string()).max(6),
  }),
  rekomendasi: z
    .array(
      z.object({
        kategori: z.enum(["harga", "menu", "stok", "promosi", "efisiensi"]),
        prioritas: z.enum(["tinggi", "sedang", "rendah"]),
        judul: z.string(),
        aksi: z.string(),
        dampak_estimasi: z.string(),
        dasar_data: z.string(),
      }),
    )
    .max(6),
  peringatan: z.array(z.string()).max(6),
});

const SYSTEM_PROMPT = `Kamu adalah analis bisnis untuk sebuah coffee shop di Indonesia.
Kamu menerima data agregat penjualan, biaya, dan stok beserta prediksi
baseline yang SUDAH dihitung secara statistik.

ATURAN KERAS:
1. JANGAN menghitung ulang atau mengubah angka prediksi baseline.
   Angka itu sudah final. Tugasmu menafsirkan, bukan menghitung.
2. Setiap klaim harus merujuk pada angka yang ada di data masukan.
   Kalau data tidak cukup untuk suatu kesimpulan, katakan begitu.
3. Jangan mengarang nama menu, nama bahan, atau angka yang tidak ada.
4. Jawab HANYA dalam JSON valid sesuai skema. Tanpa markdown, tanpa
   penjelasan di luar JSON.
5. Gunakan bahasa Indonesia yang lugas dan langsung ke poin. Hindari
   jargon konsultan.
6. Rekomendasi harus konkret dan bisa dieksekusi minggu ini —
   sebutkan menu/bahan spesifik dan angka spesifik.
7. Tulis untuk pemilik coffee shop, bukan untuk programmer. Jangan pernah
   menyebut nama field, kunci JSON, atau struktur data masukan (misalnya
   "risiko_bahan", "prediksi_baseline"). Sebut isinya, bukan wadahnya.

Skema keluaran:
{
  "penilaian_risiko": { "status": "aman|waspada|bahaya", "skor": 0-100,
    "temuan_utama": ["string"], "penjelasan": "string" },
  "proyeksi_naratif": { "minggu_depan": "string", "bulan_depan": "string",
    "asumsi": ["string"] },
  "rekomendasi": [{ "kategori": "harga|menu|stok|promosi|efisiensi",
    "prioritas": "tinggi|sedang|rendah", "judul": "string", "aksi": "string",
    "dampak_estimasi": "string", "dasar_data": "string" }],
  "peringatan": ["string"]
}`;

/** Payload ringkas — agregat saja, bukan seluruh baris mentah (PRD 10.3). */
function susunPayload(horizon: "next_week" | "next_month") {
  const ini = rentangMingguKe(0);
  const lalu = rentangMingguKe(-1);
  const a = ringkasan(ini);
  const b = ringkasan(lalu);
  const prof = profitabilitas(ini).filter((p) => p.punyaResep);
  const baseline = hitungBaseline(horizon);
  const risiko = risikoKadaluarsa();
  const konsumsi = konsumsiUntukTabel(ini);

  return {
    periode: formatRentang(ini.mulai, ini.selesai),
    ringkasan: {
      pendapatan: Math.round(a.pendapatan),
      hpp: Math.round(a.hpp),
      laba_kotor: Math.round(a.labaKotor),
      margin_persen: Number(a.marginPersen.toFixed(1)),
      perubahan_vs_periode_lalu: {
        pendapatan: Number(
          (perubahanPersen(a.pendapatan, b.pendapatan) / 100).toFixed(3),
        ),
        laba: Number(
          (perubahanPersen(a.labaKotor, b.labaKotor) / 100).toFixed(3),
        ),
      },
    },
    menu_teratas: [...prof]
      .sort((x, y) => y.totalKontribusi - x.totalKontribusi)
      .slice(0, 10)
      .map((p) => ({
        nama: p.menu.nama,
        qty: p.qtyTerjual,
        harga: p.menu.hargaJual,
        hpp: Math.round(p.hpp),
        margin_persen: Number(p.marginPersen.toFixed(1)),
        kuadran: p.kuadran,
      })),
    menu_terbawah: [...prof]
      .filter((p) => p.qtyTerjual > 0)
      .sort((x, y) => x.totalKontribusi - y.totalKontribusi)
      .slice(0, 10)
      .map((p) => ({
        nama: p.menu.nama,
        qty: p.qtyTerjual,
        margin_persen: Number(p.marginPersen.toFixed(1)),
        kuadran: p.kuadran,
      })),
    prediksi_baseline: baseline.prediksi.slice(0, 12).map((p) => ({
      menu: p.nama,
      [horizon === "next_week" ? "minggu_depan" : "bulan_depan"]: p.prediksi,
      rentang: [p.batasBawah, p.batasAtas],
      tren: p.tren,
      kepercayaan: p.kepercayaan,
    })),
    kebutuhan_restock: baseline.kebutuhan
      .filter((k) => k.perluPesan > 0)
      .slice(0, 12)
      .map((k) => ({
        bahan: k.bahan.nama,
        satuan: k.bahan.satuan,
        prediksi_pakai: Math.round(k.prediksiPakai),
        sisa_stok: Math.round(k.sisaStok),
        perlu_pesan: Math.round(k.perluPesan),
        batas_maksimal_sebelum_kadaluarsa: Math.round(k.batasExp),
        berisiko_terbuang: k.berisikoTerbuang,
      })),
    risiko_bahan: risiko.slice(0, 12).map((r) => ({
      bahan: r.bahan.nama,
      sisa: Math.round(r.batch.sisaQty),
      satuan: r.bahan.satuan,
      hari_tersisa: r.sisaHari,
      nilai_risiko: Math.round(r.nilaiRisiko),
    })),
    bahan_penyerap_biaya: konsumsi.slice(0, 10).map((k) => ({
      bahan: k.bahan.nama,
      nilai: Math.round(k.nilaiRupiah),
    })),
    status_kadaluarsa: {
      total_nilai_berisiko: Math.round(totalNilaiRisiko()),
      jumlah_batch: risiko.length,
    },
    bahan_perlu_restock: semuaStok().filter((s) => s.perluRestock).length,
    penilaian_sistem: penilaianMinggu(),
    mape_prediksi_terakhir: Number(baseline.mape.toFixed(1)),
    menu_tanpa_resep: baseline.menuTanpaResep.slice(0, 10),
  };
}

/** Cadangan tanpa AI — dirakit dari aturan biasa, supaya panel tetap berisi. */
function cadanganDariBaseline(horizon: "next_week" | "next_month") {
  const p = susunPayload(horizon);
  const nilai = penilaianMinggu();

  const rekomendasi: z.infer<typeof SkemaKeluaran>["rekomendasi"] = [];

  const terbuang = p.kebutuhan_restock.filter((k) => k.berisiko_terbuang);
  if (terbuang.length > 0) {
    const k = terbuang[0];
    rekomendasi.push({
      kategori: "stok",
      prioritas: "tinggi",
      judul: `Turunkan pesanan ${k.bahan} ke ${k.batas_maksimal_sebelum_kadaluarsa} ${k.satuan}`,
      aksi: `Rekomendasi mentah ${k.perlu_pesan} ${k.satuan} melebihi jumlah yang habis sebelum kadaluarsa.`,
      dampak_estimasi: "Menghindari pembelian yang kemungkinan besar terbuang.",
      dasar_data: `Batas aman ${k.batas_maksimal_sebelum_kadaluarsa} ${k.satuan}, sisa stok ${k.sisa_stok} ${k.satuan}.`,
    });
  }

  const risikoTeratas = p.risiko_bahan[0];
  if (risikoTeratas) {
    rekomendasi.push({
      kategori: "efisiensi",
      prioritas: risikoTeratas.hari_tersisa <= 3 ? "tinggi" : "sedang",
      judul: `Prioritaskan pemakaian ${risikoTeratas.bahan}`,
      aksi: `Sisa ${risikoTeratas.sisa} ${risikoTeratas.satuan} dengan ${risikoTeratas.hari_tersisa} hari tersisa.`,
      dampak_estimasi: `Menyelamatkan ${formatRupiah(risikoTeratas.nilai_risiko)}.`,
      dasar_data: `Nilai batch ${formatRupiah(risikoTeratas.nilai_risiko)}, kadaluarsa ${risikoTeratas.hari_tersisa} hari lagi.`,
    });
  }

  const tipis = p.menu_teratas
    .filter((m) => m.margin_persen < 45)
    .sort((a, b) => a.margin_persen - b.margin_persen)[0];
  if (tipis) {
    rekomendasi.push({
      kategori: "harga",
      prioritas: "sedang",
      judul: `Tinjau harga ${tipis.nama}`,
      aksi: `Margin ${tipis.margin_persen}% padahal termasuk menu yang laku (${tipis.qty} porsi minggu ini).`,
      dampak_estimasi: "Kenaikan harga kecil langsung menambah laba kotor.",
      dasar_data: `Harga jual ${formatRupiah(tipis.harga)}, HPP ${formatRupiah(tipis.hpp)}.`,
    });
  }

  return {
    penilaian_risiko: {
      status: nilai.status,
      skor:
        nilai.status === "bahaya" ? 72 : nilai.status === "waspada" ? 48 : 20,
      temuan_utama: nilai.temuan,
      penjelasan: nilai.kalimat,
    },
    proyeksi_naratif: {
      minggu_depan: `Total prediksi ${p.prediksi_baseline.reduce(
        (t, x) =>
          t + ((x as Record<string, number>).minggu_depan ?? (x as Record<string, number>).bulan_depan ?? 0),
        0,
      )} porsi untuk 12 menu teratas, dari perhitungan sistem.`,
      bulan_depan:
        "Proyeksi bulanan memakai indeks musiman dari data historis tahun lalu.",
      asumsi: [
        "Harga jual dan resep tidak berubah.",
        "Tidak ada promosi atau hari libur khusus.",
      ],
    },
    rekomendasi,
    peringatan:
      p.menu_tanpa_resep.length > 0
        ? [
            `${p.menu_tanpa_resep.length} menu belum punya resep, konsumsi bahannya tidak terhitung.`,
          ]
        : [],
    ai_gagal: true as const,
    model_digunakan: "perhitungan sistem",
    dibuat_pada: new Date().toISOString(),
  };
}

/** Coba lagi sekali dengan jeda pendek untuk kegagalan yang sifatnya sesaat. */
async function panggilGeminiDenganUlangan(payload: unknown, perbaikan?: string) {
  try {
    return await panggilGemini(payload, perbaikan);
  } catch (e) {
    if (!(e as { sementara?: boolean })?.sementara) throw e;
    await new Promise((r) => setTimeout(r, 1200));
    return panggilGemini(payload, perbaikan);
  }
}

async function panggilGemini(payload: unknown, perbaikan?: string) {
  const kunci = process.env.GEMINI_API_KEY;
  if (!kunci) throw new Error("GEMINI_API_KEY belum diatur di server.");

  const kendali = new AbortController();
  const jam = setTimeout(() => kendali.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        signal: kendali.signal,
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": kunci,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${perbaikan ? `${perbaikan}\n\n` : ""}Data masukan:\n${JSON.stringify(payload)}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: "application/json",
            maxOutputTokens: 4096,
          },
        }),
      },
    );

    if (!res.ok) {
      const teks = await res.text();
      const galat = new Error(
        `Gemini menolak permintaan (${res.status}): ${teks.slice(0, 180)}`,
      ) as Error & { sementara?: boolean };
      // 429/500/503 biasanya cuma antrean penuh sesaat, bukan permintaan salah.
      galat.sementara = res.status === 429 || res.status >= 500;
      throw galat;
    }

    const data = await res.json();
    const teks =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text ?? "")
        .join("") ?? "";
    if (!teks) throw new Error("Gemini mengembalikan jawaban kosong.");
    return JSON.parse(teks);
  } finally {
    clearTimeout(jam);
  }
}

/** Buang item yang menyebut menu/bahan yang tidak ada di data masukan. */
function saringHalusinasi(
  hasil: z.infer<typeof SkemaKeluaran>,
  payload: ReturnType<typeof susunPayload>,
) {
  const namaDikenal = new Set(
    [
      ...payload.menu_teratas.map((m) => m.nama),
      ...payload.menu_terbawah.map((m) => m.nama),
      ...payload.risiko_bahan.map((r) => r.bahan),
      ...payload.kebutuhan_restock.map((k) => k.bahan),
      ...payload.bahan_penyerap_biaya.map((b) => b.bahan),
      ...payload.prediksi_baseline.map((p) => p.menu),
    ].map((n) => n.toLowerCase()),
  );

  // Rekomendasi yang menyebut nama spesifik harus menyebut nama yang ada.
  const rekomendasi = hasil.rekomendasi.filter((r) => {
    const teks = `${r.judul} ${r.aksi}`.toLowerCase();
    const adaKutipan = /["']([^"']{3,40})["']/.exec(teks);
    if (!adaKutipan) return true;
    return [...namaDikenal].some((n) => teks.includes(n));
  });

  return { ...hasil, rekomendasi };
}

export async function POST(req: Request) {
  let badan: { horizon?: "next_week" | "next_month"; paksa?: boolean } = {};
  try {
    badan = await req.json();
  } catch {
    /* badan kosong, pakai default */
  }

  const horizon = badan.horizon === "next_month" ? "next_month" : "next_week";
  const kunciCache = `ai:${horizon}`;

  // Cache 6 jam. Tombol muat ulang boleh menembusnya, tapi tetap kena kuota.
  const tersimpan = cache.get(kunciCache);
  if (!badan.paksa && tersimpan && Date.now() - tersimpan.pada < CACHE_MS) {
    return NextResponse.json(tersimpan.data);
  }

  const hariIni = new Date().toISOString().slice(0, 10);
  if (pemakaianHariIni.tanggal !== hariIni) {
    pemakaianHariIni = { tanggal: hariIni, jumlah: 0 };
  }
  if (pemakaianHariIni.jumlah >= BATAS_HARIAN) {
    return NextResponse.json(
      {
        ...cadanganDariBaseline(horizon),
        peringatan: [
          `Kuota analisis AI hari ini sudah terpakai (${BATAS_HARIAN} panggilan). Angka di bawah dari perhitungan sistem.`,
        ],
      },
      { status: 200 },
    );
  }

  const payload = susunPayload(horizon);
  pemakaianHariIni.jumlah++;

  try {
    let mentah = await panggilGeminiDenganUlangan(payload);
    let hasil = SkemaKeluaran.safeParse(mentah);

    // Sekali percobaan ulang dengan instruksi perbaikan.
    if (!hasil.success) {
      mentah = await panggilGeminiDenganUlangan(
        payload,
        "Jawaban sebelumnya tidak sesuai skema. Balas ULANG hanya dengan JSON valid persis mengikuti skema di instruksi sistem, tanpa markdown.",
      );
      hasil = SkemaKeluaran.safeParse(mentah);
    }

    if (!hasil.success) {
      return NextResponse.json(cadanganDariBaseline(horizon));
    }

    const bersih = {
      ...saringHalusinasi(hasil.data, payload),
      model_digunakan: MODEL,
      dibuat_pada: new Date().toISOString(),
    };

    cache.set(kunciCache, { pada: Date.now(), data: bersih });
    return NextResponse.json(bersih);
  } catch (e) {
    // Gemini gagal — jangan rusakkan halaman, kembalikan hasil sistem.
    console.error("[analisis-ai]", e);
    return NextResponse.json(cadanganDariBaseline(horizon));
  }
}
