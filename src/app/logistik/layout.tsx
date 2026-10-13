"use client";

import { AppShell } from "@/components/app/shell";

export default function LayoutLogistik({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell peran="logistik">{children}</AppShell>;
}
