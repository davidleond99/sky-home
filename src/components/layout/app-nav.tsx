"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { NAV_ITEMS } from "./nav-items";

/**
 * En rutas con params dinámicos (p. ej. /compras/[id]) el pathname solo se
 * conoce en la petición: `usePathname` suspende. El fallback es el mismo menú
 * sin enlace activo, así el resto del layout se sigue prerenderizando.
 */
export function AppNav() {
  return (
    <Suspense fallback={<NavMenu pathname={null} />}>
      <ActiveNav />
    </Suspense>
  );
}

function ActiveNav() {
  return <NavMenu pathname={usePathname()} />;
}

function NavMenu({ pathname }: { pathname: string | null }) {
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarMenu>
      {NAV_ITEMS.map(({ title, href, icon: Icon, exact }) => {
        const active = pathname !== null && (exact ? pathname === href : pathname.startsWith(href));
        return (
          <SidebarMenuItem key={href}>
            <SidebarMenuButton asChild isActive={active} tooltip={title}>
              <Link href={href} onClick={() => setOpenMobile(false)}>
                <Icon />
                <span>{title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
