"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { signInSchema, type SignInInput } from "./schemas";

export type SignInResult = { error: string } | undefined;

function safeNext(next: string | undefined) {
  // Solo rutas internas para evitar redirecciones abiertas.
  return next?.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export async function signIn(input: SignInInput, next?: string): Promise<SignInResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return { error: "Revisa el correo y la contraseña" };

  try {
    await auth.api.signInEmail({ body: parsed.data, headers: await headers() });
  } catch (error) {
    if (error instanceof APIError) return { error: "Correo o contraseña incorrectos" };
    throw error;
  }
  redirect(safeNext(next));
}

export async function signOut() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/login");
}
