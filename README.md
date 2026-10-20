# SkyHome

Gestión del hogar de David y Gabriela. Primer módulo: **economía doméstica**. Registra las ventas de USD a CUP y los gastos por producto y categoría, mantiene el saldo común en CUP y guarda una traza completa de quién hizo qué y cuándo.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind v4 · shadcn/ui · Drizzle ORM · Neon Postgres · Better Auth · Vitest · Playwright · Vercel

## Puesta en marcha

```bash
pnpm install
cp .env.example .env.local   # rellena DATABASE_URL*, BETTER_AUTH_SECRET y SEED_PASSWORD
pnpm db:migrate              # aplica migraciones a la rama Neon de .env.local
pnpm db:seed                 # crea los usuarios y el catálogo de ejemplo (idempotente)
pnpm dev
```

## Scripts

| Script                               | Qué hace                                   |
| ------------------------------------ | ------------------------------------------ |
| `pnpm dev` / `build` / `start`       | Next.js                                    |
| `pnpm lint` / `typecheck` / `format` | Calidad de código                          |
| `pnpm test`                          | Tests unitarios (Vitest)                   |
| `pnpm test:e2e`                      | Tests E2E (Playwright; levanta `pnpm dev`) |
| `pnpm db:generate`                   | Genera una migración a partir del esquema  |
| `pnpm db:migrate`                    | Aplica las migraciones                     |
| `pnpm db:seed`                       | Siembra usuarios y catálogo                |
| `pnpm db:studio`                     | Drizzle Studio                             |

## Flujo Git (gitflow)

```bash
git flow feature start mi-cambio     # desde develop
# ...commits (Conventional Commits)...
git push -u origin feature/mi-cambio
gh pr create --base develop          # CI: lint, format, typecheck, test, build

git flow release start 0.2.0         # cuando develop está listo
git flow release finish 0.2.0        # merge a main + tag v0.2.0 + back-merge a develop
git push origin main develop --tags  # main despliega a producción en Vercel
```

- `main` → Vercel Production → Neon `production`
- `develop` y `feature/*` → Vercel Preview → Neon `develop`

Vercel no aplica migraciones. Si la release trae migraciones nuevas, aplícalas a production **antes** del push a `main`:

```bash
DATABASE_URL_UNPOOLED='<URL directa de Neon production>' pnpm db:migrate
```
