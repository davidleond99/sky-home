import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  appName: "SkyHome",
  baseURL: {
    allowedHosts: ["localhost:*", "skyhome.vercel.app", "skyhome-*.vercel.app"],
    fallback: process.env.BETTER_AUTH_URL,
  },
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    // Solo David y Gabriela: los usuarios se crean con `pnpm db:seed`.
    disableSignUp: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 días
    updateAge: 60 * 60 * 24, // renueva una vez al día
  },
  plugins: [nextCookies()], // debe ser el último plugin
});

export type Session = typeof auth.$Infer.Session;
