"use client";

import { PageHeader } from "@/components/ui/primitives";
import { TugasPengiriman } from "@/components/panels/modul-analitik";

export default function BerandaLogistik() {
  return (
    <div>
      <PageHeader
        judul="Tugas pengiriman"
        keterangan="Rangkuman pengiriman yang perlu diantar dan dikonfirmasi."
      />
      <TugasPengiriman />
    </div>
  );
}
