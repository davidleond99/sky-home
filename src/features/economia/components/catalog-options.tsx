"use client";

import { createContext, use, type ReactNode } from "react";
import type { CategoryOption, ProductOption } from "../queries";

type CatalogOptions = { products: ProductOption[]; categories: CategoryOption[] };

const CatalogOptionsContext = createContext<CatalogOptions | null>(null);

/** Comparte productos y categorías con todas las filas de una tabla sin repetirlos. */
export function CatalogOptionsProvider({
  products,
  categories,
  children,
}: CatalogOptions & { children: ReactNode }) {
  return <CatalogOptionsContext value={{ products, categories }}>{children}</CatalogOptionsContext>;
}

export function useCatalogOptions() {
  const value = use(CatalogOptionsContext);
  if (!value) throw new Error("useCatalogOptions requiere CatalogOptionsProvider");
  return value;
}
