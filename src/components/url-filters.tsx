"use client";

import { X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type UrlFilter =
  | { type: "select"; key: string; label: string; options: { value: string; label: string }[] }
  | { type: "date"; key: string; label: string };

/** Filtros guardados en la URL (?clave=valor), compartibles y que sobreviven a recargas. */
export function UrlFilters({ filters }: { filters: UrlFilter[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    next.delete("page");
    startTransition(() => router.replace(`${pathname}?${next}`, { scroll: false }));
  }

  const active = filters.some((f) => params.get(f.key));

  return (
    <div className={cn("flex flex-wrap items-center gap-2", pending && "opacity-60")}>
      {filters.map((f) =>
        f.type === "select" ? (
          <Select
            key={f.key}
            value={params.get(f.key) ?? "all"}
            onValueChange={(v) => update(f.key, v)}
          >
            <SelectTrigger className="w-44" aria-label={f.label}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{f.label}: todas</SelectItem>
              {f.options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <label key={f.key} className="text-muted-foreground flex items-center gap-2 text-sm">
            {f.label}
            <Input
              type="date"
              className="w-40"
              value={params.get(f.key) ?? ""}
              onChange={(e) => update(f.key, e.target.value)}
            />
          </label>
        ),
      )}
      {active && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => startTransition(() => router.replace(pathname, { scroll: false }))}
        >
          <X />
          Limpiar
        </Button>
      )}
    </div>
  );
}
