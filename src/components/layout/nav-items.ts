import { History, LayoutDashboard, ShoppingBasket, Wallet, type LucideIcon } from "lucide-react";

export type NavItem = { title: string; href: string; icon: LucideIcon; exact?: boolean };

export const NAV_ITEMS: NavItem[] = [
  { title: "Inicio", href: "/", icon: LayoutDashboard, exact: true },
  { title: "Compras", href: "/compras", icon: ShoppingBasket },
  { title: "Economía", href: "/economia", icon: Wallet },
  { title: "Actividad", href: "/actividad", icon: History },
];
