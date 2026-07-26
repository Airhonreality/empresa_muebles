# Alineación seed ↔ fork — sesión nocturna 2026-07-25

**Objetivo:** que el seed engine produzca forks comerciales limpios y que el
upstream a empresa_muebles dé **cero conflictos**.

**Resultado: ✅ LOGRADO.** Merge seed→fork verificado con **0 conflictos**, build
OK (36/36 páginas), home renderiza HTTP 200 con título desde datos y fuentes/tema
desde `custom.css`.

---

## Qué se construyó en el SEED (puntos de extensión)

Rama `feature/agile-rendering-engine` en `Agnostic_System_Seed.git`.

| Área | Antes (el fork hackeaba un archivo de engine) | Ahora (dato/config del fork) |
|------|-----------------------------------------------|------------------------------|
| **Upload** | fork tenía su propia versión mejor | seed la adoptó (idénticos) |
| **Identidad/SEO** | título/GA/favicon/JSON-LD en `layout.tsx` | `configuracion_comercial` (soporta key/value); `src/lib/seo/siteConfig.ts`; leak "veta" eliminado del engine |
| **Theming/fuentes** | fuentes+temas en `globals.css` | `design_tokens` (vars) + `storage/styles/custom.css` (@font-face, temas). Inyectado por el layout |
| **Auth/rutas** | paths hardcodeados en `middleware.ts` | env vars `AGNOSTIC_*_PATHS`; leak `/propuesta` eliminado |
| **Ruteo público** | fork hacía `notFound()` innecesario | documentado: rutas explícitas ganan sobre `[...slug]` |

Extras del engine: `requireSession` → `NonNullable`; public-share carga
`configuracion_comercial` (SEO en páginas públicas); sync usa `--no-renames` +
`merge=ours` para capas fork.

## Qué se migró en el FORK (empresa_muebles)

Rama `sync/seed-engine-2026-07`. **`dev` y `backup/dev-pre-seed-sync-*` intactos.**

- Identidad (título, descripción, favicon, marca, url) → registros en
  `configuracion_comercial` (formato llave/valor).
- Fuentes Futura + `.theme-veta_de_oro` + Manrope → `storage/styles/custom.css`.
  **`storage/styles/` des-ignorado** → ahora el tema/paleta del fork SÍ deploya
  (antes estaba gitignored y no llegaba a producción).
- Paths protegidos (`/app`,`/setup`,`/propuesta`) → env vars (ver `.env.example`).
- Adoptados verbatim del seed: `layout.tsx`, `globals.css`, `middleware.ts`,
  `AuthContext.tsx`, `require-session.ts`; traído `src/lib/seo/`.
- `page.tsx` (VetaHome) y `[...slug]` (notFound) → se quedan del fork, protegidos
  con `merge=ours` (brackets escapados en `.gitattributes`).
- `src/lib/veta/seo/schemaGenerator.ts` → renombrado a `vetaSchemas.ts` (evita
  colisión modify/delete con el archivo borrado del seed).

## ⚠️ Acciones pendientes para ti

1. **Revisar la rama `sync/seed-engine-2026-07`**: corre `npm run dev` y verifica
   login, home, y `/propuesta` público. Todo compila y el home renderiza, pero el
   ojo humano en auth/visual es clave antes de `dev`.
2. **Setear env vars en el deploy** (Vercel/Netlify):
   `AGNOSTIC_PROTECTED_PATHS=/app,/setup` y `AGNOSTIC_PUBLIC_SHARE_PATHS=/propuesta`.
   Si faltan, `/app` y `/setup` pierden el redirect temprano a login (pero
   `requireSession` en `src/app/app/layout.tsx` los sigue protegiendo del lado
   servidor — no es hueco de seguridad, solo UX).
3. **Mergear `sync/seed-engine-2026-07` → `dev`** cuando estés conforme:
   `git checkout dev && git merge --no-ff sync/seed-engine-2026-07`.
4. Hay WIP local sin commitear en `src/app/api/admin/neon-debug/route.ts` (tuyo,
   lo dejé intacto).

## Cómo se prueba el cero-conflicto (para el futuro)

```bash
git fetch seed feature/agile-rendering-engine
git config merge.ours.driver true
git merge --no-ff -Xno-renames seed/feature/agile-rendering-engine
# -> 0 conflictos
```
El sync oficial (`scripts/admin/sync-workspaces.ps1`) ya hace esto automáticamente.
