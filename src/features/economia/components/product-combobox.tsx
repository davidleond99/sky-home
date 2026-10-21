"use client";

import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { ProductOption } from "../queries";

export function ProductCombobox({
  id,
  products,
  value,
  onChange,
  onCreate,
  invalid,
}: {
  id?: string;
  products: ProductOption[];
  value: string;
  onChange: (product: ProductOption) => void;
  /** Se llama con el texto buscado cuando la persona quiere crear un producto nuevo. */
  onCreate: (name: string) => void;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = products.find((p) => p.id === value);

  const groups = useMemo(() => {
    const map = new Map<string, ProductOption[]>();
    for (const p of products) map.set(p.categoryName, [...(map.get(p.categoryName) ?? []), p]);
    return [...map.entries()];
  }, [products]);

  const exactMatch = products.some((p) => p.name.toLowerCase() === search.trim().toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid}
          size="lg"
          className="w-full justify-between font-normal"
        >
          {selected ? (
            <span className="truncate">
              {selected.name}
              <span className="text-muted-foreground"> · {selected.categoryName}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">Elige un producto…</span>
          )}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar producto…" value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>No hay productos con ese nombre.</CommandEmpty>
            {groups.map(([category, items]) => (
              <CommandGroup key={category} heading={category}>
                {items.map((p) => (
                  <CommandItem
                    key={p.id}
                    value={`${p.name} ${p.categoryName}`}
                    onSelect={() => {
                      onChange(p);
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    {p.name}
                    <Check
                      className={cn("ml-auto", p.id === value ? "opacity-100" : "opacity-0")}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
            {search.trim() && !exactMatch && (
              <>
                <CommandSeparator />
                <CommandGroup forceMount>
                  <CommandItem
                    forceMount
                    value={`__create__ ${search}`}
                    onSelect={() => {
                      onCreate(search.trim());
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    <Plus />
                    Crear «{search.trim()}»
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
