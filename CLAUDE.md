@AGENTS.md

# SkyHome

App privada del hogar de David y Gabriela. UI y textos en **español**. Zona horaria `America/Havana`.

## Reglas de trabajo

- **Consulta Context7 antes de escribir código que use una librería** (Next.js, Better Auth, Drizzle, shadcn, Vitest, Playwright, Recharts). Para Next.js, prioriza la documentación incluida en `node_modules/next/dist/docs/` (la versión instalada es más nueva que la de Context7).
- **Gitflow**: `main` = producción, `develop` = integración. Trabajo nuevo en `feature/<nombre>` desde `develop`; PR a `develop`. Releases en `release/x.y.z` → `main` + tag `vx.y.z`. Urgencias en `hotfix/*`. Commits con Conventional Commits.
- Antes de abrir un PR: `pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build`.

## Arquitectura

- Next.js 16 App Router con **Cache Components activado**: toda lectura de sesión o BD va dentro de `<Suspense>` (o con `loading.tsx`). No hagas `await` de la sesión en el nivel superior de un layout.
  - Patrón de página: `export default function XPage(props)` devuelve `<Suspense fallback={<Skeleton/>}><XContent {...props} /></Suspense>` y `XContent` (async) lee sesión/datos. Un `loading.tsx` NO basta: al cambiar filtros (`?from=…`) se navega a la misma página y la frontera del segmento queda por encima. En dev, Next valida esto ("blocking-route"): el log debe quedar sin errores.
- `src/proxy.ts`: solo redirección optimista por cookie. **Cada Server Action y cada query vuelve a verificar la sesión** (`requireUser()` en `src/lib/session.ts`).
- Organización por features: `src/features/<feature>/{actions.ts,queries.ts,schemas.ts,components/}`. Las queries llevan `import "server-only"`.
- BD: Drizzle + `pg` Pool (`attachDatabasePool`) contra Neon. Esquema en `src/db/schema/`. Migraciones con `pnpm db:generate` → `pnpm db:migrate` (nunca `push` contra producción).
- Auth: Better Auth propio (`src/lib/auth.ts`), solo email+contraseña, **registro deshabilitado**. Usuarios creados por `pnpm db:seed`.
- **Trazabilidad obligatoria**: toda mutación se hace en `db.transaction` junto con `recordAudit(tx, …)` (`src/features/audit/record.ts`). Borrado lógico (`deleted_at`), nunca físico.
- Dinero: columnas `numeric`; cálculos en centavos enteros con `src/lib/money.ts`.

## Entornos

| Git                     | Vercel     | Rama Neon (proyecto `sky-home`) |
| ----------------------- | ---------- | ------------------------------- |
| `main`                  | Production | `production`                    |
| `develop` / `feature/*` | Preview    | `develop`                       |
| local                   | —          | `develop`                       |

Variables: ver `.env.example`.
