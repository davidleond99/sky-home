import { ChevronRight } from "lucide-react";
import { Suspense } from "react";
import { BrandMark } from "./brand-mark";
import { ScreenTitle } from "./screen-title";
import { ThemeToggle } from "./theme-toggle";
import { TodayLabel } from "./today-label";
import { MobileUserMenu } from "./user-menu";

/** Barra flotante en escritorio (miga + fecha) y barra fija en móvil (marca, tema, usuario). */
export function AppHeader() {
  return (
    <>
      <header className="glass sticky top-3 z-20 mx-3 mt-3 hidden h-14 shrink-0 items-center justify-between gap-4 rounded-[18px] px-6 md:flex">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <span>SkyHome</span>
          <ChevronRight className="size-3" />
          <span className="text-foreground font-medium">
            <ScreenTitle />
          </span>
        </div>
        <Suspense fallback={null}>
          <TodayLabel />
        </Suspense>
      </header>
      <header className="border-glass-border sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2.5 border-b bg-(--glass-bar) px-4 backdrop-blur-[22px] backdrop-saturate-[1.7] md:hidden">
        <BrandMark className="size-8 rounded-[9px]" />
        <span className="flex-1 text-base font-semibold">SkyHome</span>
        <ThemeToggle />
        <Suspense fallback={<div className="size-[34px]" />}>
          <MobileUserMenu />
        </Suspense>
      </header>
    </>
  );
}
