"use client";

import { cn } from "cn";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { isActive, NAV_ITEMS } from "./nav-items";

type Variant = "sidebar" | "bottom";

/**
 * En rutas con params dinámicos (p. ej. /compras/[id]) el pathname solo se
 * conoce en la petición: `usePathname` suspende. El fallback es el mismo menú
 * sin enlace activo, así el resto del layout se sigue prerenderizando.
 */
export function AppNav({ variant }: { variant: Variant }) {
  return (
    <Suspense fallback={<NavMenu variant={variant} pathname={null} />}>
      <ActiveNav variant={variant} />
    </Suspense>
  );
}

function ActiveNav({ variant }: { variant: Variant }) {
  return <NavMenu variant={variant} pathname={usePathname()} />;
}

function NavMenu({ variant, pathname }: { variant: Variant; pathname: string | null }) {
  if (variant === "bottom") {
    return (
      <nav
        aria-label="Secciones"
        className="glass-strong fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 grid grid-cols-5 rounded-3xl px-2 py-1.5 md:hidden"
      >
        {NAV_ITEMS.map((item) => {
          const active = pathname !== null && isActive(item, pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-13 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="size-5.5" strokeWidth={active ? 2.25 : 1.75} />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav aria-label="Secciones" className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = pathname !== null && isActive(item, pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "hover:bg-accent flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-accent text-primary" : "text-foreground",
            )}
          >
            <Icon className="size-[19px]" strokeWidth={active ? 2.25 : 1.75} />
            <span>{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}
