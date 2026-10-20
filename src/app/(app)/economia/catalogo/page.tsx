import type { Metadata } from "next";
import { TableSkeleton } from "@/components/skeletons";
import { Suspense } from "react";
import { CatalogManager } from "@/features/economia/components/catalog-manager";
import { getCatalog, listActiveCategories } from "@/features/economia/queries";

export const metadata: Metadata = { title: "Catálogo" };

async function CatalogoContent() {
  const [catalog, categories] = await Promise.all([getCatalog(), listActiveCategories()]);
  return <CatalogManager catalog={catalog} categories={categories} />;
}

/**
 * La sesión y los datos se leen dentro de <Suspense>: así las navegaciones
 * (incluido cambiar filtros en la misma página) muestran el esqueleto al instante.
 */
export default function CatalogoPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <CatalogoContent />
    </Suspense>
  );
}
