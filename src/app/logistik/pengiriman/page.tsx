"use client";

import { ModulPengiriman } from "@/components/panels/modul-operasional";

export default function HalamanPengirimanLogistik() {
  return (
    <ModulPengiriman
      akses={{ hanya: ["status", "catatan"] }}
      judul="Status pengiriman"
      keterangan="Perbarui status setiap kiriman: dijadwalkan → dalam perjalanan → diterima."
    />
  );
}
