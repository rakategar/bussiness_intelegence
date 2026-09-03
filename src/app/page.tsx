"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BERANDA_PERAN, useSesi } from "@/components/app/session";

export default function Beranda() {
  const { pengguna, siap } = useSesi();
  const router = useRouter();

  React.useEffect(() => {
    if (!siap) return;
    router.replace(pengguna ? BERANDA_PERAN[pengguna.role] : "/masuk");
  }, [siap, pengguna, router]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface">
      <div className="skeleton h-20 w-52 rounded-panel" />
    </div>
  );
}
