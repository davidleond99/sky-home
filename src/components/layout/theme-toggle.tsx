"use client";

import { Moon, Sun } from "lucide-react";
import { setTheme, useResolvedTheme } from "@/components/theme";
import { Button } from "@/components/ui/button";

/**
 * Alterna claro/oscuro. El icono y el texto cambian por CSS (`dark:`), así el
 * HTML del servidor coincide con el del cliente aunque aún no se sepa el tema.
 */
export function ThemeToggle({ withLabel = false }: { withLabel?: boolean }) {
  const resolvedTheme = useResolvedTheme();
  const toggle = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");

  if (withLabel) {
    return (
      <Button variant="secondary" size="lg" className="justify-start gap-2.5 px-3" onClick={toggle}>
        <Moon className="size-[17px] dark:hidden" />
        <Sun className="hidden size-[17px] dark:block" />
        <span className="dark:hidden">Modo oscuro</span>
        <span className="hidden dark:inline">Modo claro</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon-lg"
      aria-label="Cambiar entre modo claro y oscuro"
      title="Cambiar entre modo claro y oscuro"
      onClick={toggle}
    >
      <Moon className="size-[19px] dark:hidden" />
      <Sun className="hidden size-[19px] dark:block" />
    </Button>
  );
}
