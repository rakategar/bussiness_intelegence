"use client";

import { AppShell } from "@/components/app/shell";
import { risikoKadaluarsa } from "@/lib/data/queries";

export default function LayoutStock({
  children,
}: {
  children: React.ReactNode;
}) {
  const jumlahKadaluarsa = risikoKadaluarsa().length;
  return (
    <AppShell peran="stock" lencana={{ kadaluarsa: jumlahKadaluarsa }}>
      {children}
    </AppShell>
  );
}
