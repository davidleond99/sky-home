"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { activeNavItem } from "./nav-items";

/** Título de la sección actual; en rutas dinámicas espera al pathname (ver AppNav). */
export function ScreenTitle() {
  return (
    <Suspense fallback={null}>
      <ActiveTitle />
    </Suspense>
  );
}

function ActiveTitle() {
  const item = activeNavItem(usePathname());
  return item ? (item.screenTitle ?? item.title) : null;
}
