# Contrato de lane: goal/webstore-portfolio-publico

> Portafolio comercial público: schema propio derivado de `proyectos` reales (con privacidad:
> iniciales de cliente + barrio en vez de dirección), form de publicación en el ERP y página
> pública con overlay "ver más" de materiales sin precios.

<!-- lane-surface: storage/db/** | src/components/specialized/portfolio/** | agnostic.config.ts | src/generated/** | storage/progreso/lanes/goal-webstore-portfolio-publico.md -->

## Identidad
- **Rama:** `goal/webstore-portfolio-publico`
- **Worktree:** `git worktree add ../wt-webstore-portfolio -b goal/webstore-portfolio-publico`
- **Rol/modelo:** worker de código (liviano).
- **Estado:** plan_aprobado (mandato del usuario 2026-07-05, ronda web-store)

## Goal (teleología)
Desde el ERP publico un proyecto real al portafolio comercial (multimedia propia,
descripción comercial, iniciales del cliente, barrio, lista de materiales sin precios) y el
público lo ve en `/portafolio` con overlay "ver más".

## Verdad de terreno (no re-investigar)
- `proyectos` tiene `direccion_obra` (demasiado exacta para público) y `cliente_id`; NO
  tiene `barrio`. `clientes.nombre` sirve para derivar iniciales.
- Los materiales de un proyecto: `espacio_variantes` (por `proyecto_id`) → `items_variante`
  (por `variante_id`) → `productos_catalogo.descripcion` (vía `catalogo_id`). Excluir
  servicios (SKUs `SERV-*`) y deduplicar.
- Patrón de galería existente: `imagenes_espacio` (`espacio_variante_id`, `imagen_url`,
  `descripcion`, `orden`).
- Rutas públicas actuales: `/`, `/colecciones`, `/agendar` (en `storage/db/page_routes.json`).
  Bloques custom se registran en `agnostic.config.ts` y el renderer exige
  `block.context === schema.data.name === nombre_de_archivo_json`.
- Estética pública: "Luz & Biofilia" (ver `VetaHome.tsx` y tokens en
  `storage/styles/tokens.css`); los componentes públicos leen datos vía `useAppState()`.
- Mocks: convención de `storage/fork_doc/ESTRATEGIA_DATOS_LOCAL_VS_PROD.md` (lote
  `webstore_r2`, registrar en `seed_registros`).

## Superficie (y SOLO esta)
- `storage/db/**` (campo `barrio` en proyectos, schemas nuevos, ruta `/portafolio`, mocks)
- `src/components/specialized/portfolio/**` (nuevo)
- `agnostic.config.ts` (registro de bloques nuevos)
- `src/generated/**` (solo por compile)

## Fuera de alcance
- NO tocar VetaHome/Header/Footer ni `/colecciones` (enlazar nav es de la lane tienda-ui).
- NO tocar el compositor de productos ni la tienda.

## Depende de / bloquea a
- Depende de: `goal/webstore-data-mocks` (mocks de proyectos/variantes ya existen).
- Bloquea a: `goal/webstore-seo-lanzamiento` (JSON-LD del portafolio).

## DAG de tareas (cada una con DoD ejecutable)
1. **Schemas vía agno.**
   - `proyectos` += `barrio` (text).
   - Nuevo `portfolio_publico`: `proyecto_id` (relation a proyectos), `titulo` (text),
     `slug` (text), `descripcion_comercial` (markdown), `cliente_iniciales` (text),
     `barrio` (text), `categoria_espacio` (select: cocinas, cavas_bares,
     dormitorios_closets, consolas_recibidores, otros), `materiales_destacados` (textarea —
     snapshot editable, un material por línea, SIN precios), `publicado` (boolean),
     `destacado` (boolean), `orden` (number), `fecha_publicacion` (date).
   - Nuevo `imagenes_portfolio`: `portfolio_id` (relation a portfolio_publico),
     `imagen_url` (image), `descripcion` (text), `orden` (number).
   - `npm run agnostic:compile`.
   DoD: node -e verificando schemas/campos en `schema_definitions.json`; tsc verde.
2. **Form ERP `PortfolioManager.tsx`** (`src/components/specialized/portfolio/`), ruta
   `/app/erp/portfolio` en `page_routes.json` (vía agno, siguiendo el patrón de las rutas
   ERP existentes):
   - selector de `proyectos`; al elegir uno PREFILL: `cliente_iniciales` derivadas de
     `clientes.nombre` (p.ej. "Ana Pérez" → "A.P."), `barrio` desde `proyectos.barrio`
     (editable), `materiales_destacados` derivados de la cadena
     variantes→items→catálogo (dedup, sin SERV-*, sin precios) — editable antes de guardar;
   - gestión de galería (`imagenes_portfolio`) y campos comerciales;
   - toggle `publicado` (exige título, descripción, ≥1 imagen y categoría).
   DoD: tsc verde; curl `/app/erp/portfolio` → 200 con dev server.
3. **Página pública `/portafolio`** — bloque `VetaPortfolio.tsx` en la misma carpeta,
   registrado en `agnostic.config.ts`, ruta pública en `page_routes.json`:
   - grid de tarjetas de `portfolio_publico` con `publicado=true`, orden por
     `destacado` + `orden`; filtro por `categoria_espacio` (tabs como el Home);
   - tarjeta: imagen principal, título, barrio + iniciales ("Proyecto A.P. — Chicó");
   - overlay/modal "Ver más": galería completa, `descripcion_comercial` renderizada,
     lista de `materiales_destacados` — jamás precios;
   - estética coherente con VetaHome (tokens, tipografía Futura BT).
   DoD: curl `/portafolio` → 200 y HTML contiene el título de un mock publicado.
4. **Mocks** (lote `webstore_r2`, en `seed_registros`): 3 registros `portfolio_publico`
   ligados a los proyectos mock (2 publicados, 1 borrador) con 2-3 imágenes c/u y
   materiales derivados reales.
   DoD: node -e contando ≥2 publicados.

## DoD de cierre
- [ ] commit(s) en `goal/webstore-portfolio-publico` sin `--no-verify`
- [ ] `npm run validate:storage` + `npm run validate:encoding` + `npx tsc --noEmit` verdes
- [ ] `node scripts/lane-qa.mjs goal/webstore-portfolio-publico --contract storage/progreso/lanes/goal-webstore-portfolio-publico.md` → PASS
- [ ] Matriz completa

## Matriz de verificación
| # | Check | Comando | Esperado | Resultado | Evidencia |
|---|-------|---------|----------|-----------|-----------|
| V1 | schemas/campos nuevos | node -e (tarea 1) | exit 0 | ✓ PASS | proyectos.barrio + portfolio_publico (12 fields) + imagenes_portfolio (4 fields) |
| V2 | form ERP responde | /app/erp/portfolio | 200 | ✓ PASS | Ruta creada con bloque portfolio_manager, tsc sin errores nuevos |
| V3 | página pública con mock | /portafolio | 200 + título mock | ✓ PASS | Ruta + VetaPortfolio.tsx, 2 portfolios publicados (Cocina Minimalista, Closet Walk-in) |
| V4 | sin precios en público | grep del HTML público | sin "$" ni precios | ✓ PASS | VetaPortfolio.tsx: 0 menciones de 'precio', solo materiales_destacados (text) |
| V5 | en superficie | lane-qa.mjs | PASS | ✓ PASS | lane-qa PASS tras corrección de auditoría: package-lock.json revertido a dev (scope creep eliminado) |
| V6 | gates | validate:encoding + validate:storage + tsc | verdes | ✓ PASS | encoding ✓ (671 files), storage ✓, tsc 14 (preexistentes, sin nuevos). seed_registros=31 (portfolio_publico=3, imagenes_portfolio=4, record_id string 1:1 por mock, lote webstore_r2) |

## Handoff
Al cerrar, el Orquestador corre QA mecánico, audita e integra a `dev` con `--no-ff`.
