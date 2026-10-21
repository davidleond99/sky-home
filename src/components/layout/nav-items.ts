import {
  DollarSign,
  History,
  LayoutGrid,
  ShoppingBasket,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
  /** Título en la cabecera cuando es distinto del de la navegación. */
  screenTitle?: string;
};

export const NAV_ITEMS: NavItem[] = [
  { title: "Inicio", href: "/", icon: LayoutGrid, exact: true },
  { title: "Compras", href: "/compras", icon: ShoppingBasket, screenTitle: "Lista de la compra" },
  { title: "Economía", href: "/economia", icon: Wallet },
  { title: "Dólares", href: "/dolares", icon: DollarSign },
  { title: "Actividad", href: "/actividad", icon: History },
];

export function isActive(item: NavItem, pathname: string) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

/** Sección activa para un pathname (o undefined fuera de las secciones). */
export function activeNavItem(pathname: string) {
  return NAV_ITEMS.find((item) => isActive(item, pathname));
}
