import type { Metadata } from "next";
import { CatalogManager } from "@/features/economia/components/catalog-manager";
import { getCatalog, listActiveCategories } from "@/features/economia/queries";

export const metadata: Metadata = { title: "Catálogo" };

export default async function CatalogoPage() {
  const [catalog, categories] = await Promise.all([getCatalog(), listActiveCategories()]);
  return <CatalogManager catalog={catalog} categories={categories} />;
}
