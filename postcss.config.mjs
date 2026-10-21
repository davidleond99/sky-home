// Integración oficial de Tailwind v4 en Next.js. Antes se usaba el loader
// `@tailwindcss/turbopack`, que con la caché en disco de Turbopack servía un
// globals.css antiguo (hotfix 0.3.1).
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
