"use client";

import { X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useId, useTransition } from "react";
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
  | {
      type: "select";
      key: string;
      label: string;
      options: { value: string; label: string }[];
      /** Texto de la opción "sin filtro" (por defecto "Todas"). */
      allLabel?: string;
    }
  | { type: "date"; key: string; label: string };

/** Filtros guardados en la URL (?clave=valor), compartibles y que sobreviven a recargas. */
export function UrlFilters({ filters }: { filters: UrlFilter[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const idPrefix = useId();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    next.delete("page");
    startTransition(() => router.replace(`${pathname}?${next}`, { scroll: false }));
  }

  const active = filters.some((f) => params.get(f.key));

  return (
    <div className={cn("flex flex-wrap items-end gap-3", pending && "opacity-60")}>
      {filters.map((f) => {
        const id = `${idPrefix}-${f.key}`;
        return (
          <div key={f.key} className="flex max-w-[210px] flex-[1_1_150px] flex-col gap-1.5">
            <label htmlFor={id} className="text-muted-foreground text-xs">
              {f.label}
            </label>
            {f.type === "select" ? (
              <Select value={params.get(f.key) ?? "all"} onValueChange={(v) => update(f.key, v)}>
                <SelectTrigger id={id} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{f.allLabel ?? "Todas"}</SelectItem>
                  {f.options.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={id}
                type="date"
                value={params.get(f.key) ?? ""}
                onChange={(e) => update(f.key, e.target.value)}
              />
            )}
          </div>
        );
      })}
      {active && (
        <Button
          variant="ghost"
          size="lg"
          className="text-muted-foreground"
          onClick={() => startTransition(() => router.replace(pathname, { scroll: false }))}
        >
          <X />
          Limpiar
        </Button>
      )}
    </div>
  );
}
