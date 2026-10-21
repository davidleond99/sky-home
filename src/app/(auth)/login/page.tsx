import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { BrandMark } from "@/components/layout/brand-mark";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LoginForm } from "@/features/auth/components/login-form";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Entrar" };

async function RedirectIfSignedIn() {
  if (await getCurrentUser()) redirect("/");
  return null;
}

export default function LoginPage() {
  return (
    <main className="grid min-h-svh flex-1 grid-cols-[repeat(auto-fit,minmax(min(420px,100%),1fr))]">
      <Suspense>
        <RedirectIfSignedIn />
      </Suspense>
      <section className="glass-section m-4 flex flex-col justify-between gap-10 rounded-[28px] px-8 py-10 md:px-12">
        <div className="flex items-center gap-3">
          <BrandMark className="size-10 rounded-xl bg-white/14" />
          <span className="text-lg font-semibold">SkyHome</span>
        </div>
        <p className="max-w-[440px] text-[clamp(34px,4vw,48px)] leading-[1.05] font-medium tracking-[-0.03em]">
          Gestión del hogar de David y Gabriela
        </p>
        <span className="text-on-section-muted text-xs">
          Acceso privado · solo miembros de la casa
        </span>
      </section>
      <div className="relative grid place-items-center px-6 py-12">
        <div className="absolute top-5 right-5">
          <ThemeToggle />
        </div>
        <div className="glass w-full max-w-[400px] rounded-3xl p-8 shadow-(--glass-shadow-lg)">
          <div className="mb-[18px]">
            <h1 className="text-[28px] leading-tight font-medium tracking-[-0.02em]">Entrar</h1>
            <p className="text-muted-foreground mt-1 text-sm">Entra con tu correo y contraseña</p>
          </div>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
