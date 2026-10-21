import { House } from "lucide-react";
import { cn } from "cn";

/** Cuadrado azul Chelsea con la casa: logotipo de SkyHome. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-chelsea text-silver grid size-[38px] shrink-0 place-items-center rounded-[11px]",
        className,
      )}
    >
      <House className="size-1/2" strokeWidth={2.25} />
    </div>
  );
}
