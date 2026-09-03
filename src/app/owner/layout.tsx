"use client";

import { AppShell } from "@/components/app/shell";

export default function LayoutOwner({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell peran="owner">{children}</AppShell>;
}
