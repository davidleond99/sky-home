import { UrlFilters } from "@/components/url-filters";
import type { HouseholdUser } from "@/features/users/queries";
import { ACTION_LABELS, ENTITY_LABELS } from "../labels";

export function AuditFilters({ users }: { users: HouseholdUser[] }) {
  return (
    <UrlFilters
      filters={[
        {
          type: "select",
          key: "user",
          label: "Persona",
          options: users.map((u) => ({ value: u.id, label: u.name })),
        },
        {
          type: "select",
          key: "entity",
          label: "Tipo",
          options: Object.entries(ENTITY_LABELS).map(([value, label]) => ({ value, label })),
        },
        {
          type: "select",
          key: "action",
          label: "Acción",
          options: Object.entries(ACTION_LABELS).map(([value, label]) => ({ value, label })),
        },
      ]}
    />
  );
}
