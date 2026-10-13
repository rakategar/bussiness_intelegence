"use client";

import * as React from "react";

/**
 * Hook kecil yang membaca keadaan di luar React (media query, localStorage)
 * lewat useSyncExternalStore, bukan lewat setState di dalam useEffect.
 */

function langgananMedia(kueri: string) {
  return (beritahu: () => void) => {
    const mq = window.matchMedia(kueri);
    mq.addEventListener("change", beritahu);
    return () => mq.removeEventListener("change", beritahu);
  };
}

/** true kalau pengguna minta animasi dikurangi. */
export function useGerakBerkurang(): boolean {
  return React.useSyncExternalStore(
    React.useMemo(
      () => langgananMedia("(prefers-reduced-motion: reduce)"),
      [],
    ),
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false, // di server: anggap animasi boleh jalan
  );
}

const tanpaLangganan = () => () => {};

/** false saat render server dan render hidrasi pertama, true setelahnya. */
export function useSudahTerhidrasi(): boolean {
  return React.useSyncExternalStore(
    tanpaLangganan,
    () => true,
    () => false,
  );
}

/* -------------------------------------------------------------------------
   Penyimpanan lokal — dibungkus supaya mode privat yang memblokir storage
   tidak membuat aplikasi meledak.
   ------------------------------------------------------------------------- */

const pendengar = new Set<() => void>();

function beritahuSemua() {
  for (const p of pendengar) p();
}

function langgananLokal(beritahu: () => void) {
  pendengar.add(beritahu);
  window.addEventListener("storage", beritahu);
  return () => {
    pendengar.delete(beritahu);
    window.removeEventListener("storage", beritahu);
  };
}

export function bacaLokal(kunci: string): string | null {
  try {
    return window.localStorage.getItem(kunci);
  } catch {
    return null;
  }
}

export function tulisLokal(kunci: string, nilai: string | null) {
  try {
    if (nilai === null) window.localStorage.removeItem(kunci);
    else window.localStorage.setItem(kunci, nilai);
  } catch {
    /* penyimpanan diblokir — abaikan, aplikasi tetap jalan */
  }
  beritahuSemua();
}

/** Nilai localStorage yang ikut ter-update saat ditulis lewat tulisLokal. */
export function useNilaiLokal(kunci: string): string | null {
  return React.useSyncExternalStore(
    langgananLokal,
    () => bacaLokal(kunci),
    () => null,
  );
}
