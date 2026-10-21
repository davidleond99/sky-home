import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AppNav } from "./app-nav";
import { BrandMark } from "./brand-mark";
import { ThemeToggle } from "./theme-toggle";
import { UserCard } from "./user-menu";

export function AppSidebar() {
  return (
    <aside className="glass sticky top-3 m-3 mr-0 hidden h-[calc(100svh-24px)] w-64 shrink-0 flex-col gap-6 rounded-[22px] px-4 py-5 md:flex">
      <div className="flex items-center gap-3 px-2">
        <BrandMark />
        <div className="flex flex-col leading-tight">
          <span className="text-[17px] font-semibold tracking-[-0.01em]">SkyHome</span>
          <span className="text-muted-foreground text-xs">Casa de David y Gabriela</span>
        </div>
      </div>
      <AppNav variant="sidebar" />
      <div className="flex-1" />
      <ThemeToggle withLabel />
      <Suspense fallback={<Skeleton className="h-[58px] w-full rounded-[14px]" />}>
        <UserCard />
      </Suspense>
    </aside>
  );
}
