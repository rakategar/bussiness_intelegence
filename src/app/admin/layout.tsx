"use client";

import { AppShell } from "@/components/app/shell";
import { menuTanpaResep } from "@/lib/data/queries";

export default function LayoutAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell peran="admin" lencana={{ "tanpa-resep": menuTanpaResep().length }}>
      {children}
    </AppShell>
  );
}
