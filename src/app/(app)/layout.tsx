import { AppHeader } from "@/components/layout/app-header";
import { AppNav } from "@/components/layout/app-nav";
import { AppSidebar } from "@/components/layout/app-sidebar";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-svh">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 px-4 pt-5 pb-28 md:px-7 md:pt-7 md:pb-16">
          <div className="flex max-w-[1180px] flex-col gap-7">{children}</div>
        </main>
      </div>
      <AppNav variant="bottom" />
    </div>
  );
}
