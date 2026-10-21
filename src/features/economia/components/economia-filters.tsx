import { type UrlFilter, UrlFilters } from "@/components/url-filters";
import type { HouseholdUser } from "@/features/users/queries";
import type { CategoryOption } from "../queries";

export function EconomiaFilters({
  users,
  categories,
  withKind = false,
}: {
  users: HouseholdUser[];
  categories?: CategoryOption[];
  withKind?: boolean;
}) {
  const filters: UrlFilter[] = [
    { type: "date", key: "from", label: "Desde" },
    { type: "date", key: "to", label: "Hasta" },
    {
      type: "select",
      key: "user",
      label: "Persona",
      options: users.map((u) => ({ value: u.id, label: u.name })),
    },
  ];
  if (withKind) {
    filters.push({
      type: "select",
      key: "kind",
      label: "Tipo",
      allLabel: "Todos",
      options: [
        { value: "exchange", label: "Ventas de USD" },
        { value: "expense", label: "Gastos" },
      ],
    });
  }
  if (categories) {
    filters.push({
      type: "select",
      key: "category",
      label: "Categoría",
      options: categories.map((c) => ({ value: c.id, label: c.name })),
    });
  }
  return <UrlFilters filters={filters} />;
}
