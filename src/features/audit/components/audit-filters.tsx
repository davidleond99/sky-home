"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { HouseholdUser } from "@/features/users/queries";
import { ACTION_LABELS, ENTITY_LABELS } from "../labels";

type Option = { value: string; label: string };

export function AuditFilters({ users }: { users: HouseholdUser[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value === "all") next.delete(key);
    else next.set(key, value);
    next.delete("page");
    startTransition(() => router.replace(`${pathname}?${next}`));
  }

  const filters: { key: string; label: string; options: Option[] }[] = [
    { key: "user", label: "Persona", options: users.map((u) => ({ value: u.id, label: u.name })) },
    {
      key: "entity",
      label: "Tipo",
      options: Object.entries(ENTITY_LABELS).map(([value, label]) => ({ value, label })),
    },
    {
      key: "action",
      label: "Acción",
      options: Object.entries(ACTION_LABELS).map(([value, label]) => ({ value, label })),
    },
  ];

  return (
    <div className="flex flex-wrap gap-2" data-pending={pending || undefined}>
      {filters.map(({ key, label, options }) => (
        <Select key={key} value={params.get(key) ?? "all"} onValueChange={(v) => update(key, v)}>
          <SelectTrigger className="w-44" aria-label={label}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{label}: todas</SelectItem>
            {options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
    </div>
  );
}
