import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { recordAudit } from "@/features/audit/record";

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
    // La sesión se valida con una cookie firmada sin ir a la BD en cada navegación.
    // Un cierre de sesión en otro dispositivo tarda como mucho `maxAge` en aplicarse.
    cookieCache: { enabled: true, maxAge: 60 * 60 },
  },
  databaseHooks: {
    session: {
      create: {
        // Cada inicio de sesión queda en la traza con IP y navegador.
        after: async (session) => {
          await recordAudit(db, {
            userId: session.userId,
            action: "login",
            entity: "session",
            entityId: session.id,
            summary: "Inició sesión",
            ipAddress: session.ipAddress,
            userAgent: session.userAgent,
          });
        },
      },
    },
  },
  hooks: {
    // El cierre de sesión se registra antes de que la sesión se elimine.
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-out") return;
      const current = await getSessionFromCtx(ctx);
      if (!current) return;
      await recordAudit(db, {
        userId: current.user.id,
        action: "logout",
        entity: "session",
        entityId: current.session.id,
        summary: "Cerró sesión",
        ipAddress: current.session.ipAddress,
        userAgent: current.session.userAgent,
      });
    }),
  },
  plugins: [nextCookies()], // debe ser el último plugin
});

export type Session = typeof auth.$Infer.Session;
