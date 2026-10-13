"use client";

import { AppShell } from "@/components/app/shell";
import { menuTanpaResep, risikoKadaluarsa } from "@/lib/data/queries";

export default function LayoutAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell peran="admin" lencana={{
        "tanpa-resep": menuTanpaResep().length,
        kadaluarsa: risikoKadaluarsa().length,
      }}>
      {children}
    </AppShell>
  );
}
