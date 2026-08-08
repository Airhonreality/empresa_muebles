# Plan F7 — Sitio Publico + Frontstage (F-01..F-03, F-07, F-08)

**Fecha:** 2026-08-07 · **Zona:** datos · **Tipo:** ui + datos_contrato · **Riesgo:** alto
**Estado:** DISENO COMPLETO (4 pantallas nuevas)

---

## 1. Decisiones cerradas

| # | Materia | Decision |
|---|---|---|
| D1 | F-08 Propuesta | Destilacion existente (`destilacion_f3_publico.md`). Sin botones de pago. Viewer 3D comentado hasta integracion F8 |
| D2 | F-02 Tienda Web | Filtros usando `categorias` (arbol) + `catalogo_acabados` (chips) + rango precio |
| D3 | F-07 Portal | Proyectos, abonos/saldos, progreso E-60, acta. Garantia solo si `proyectos.estado='entregado'`, solo sobre modulos instalados |
| D4 | Viewer 3D | Placeholder comentado en F-08. Se descomenta en F8 con integracion SketchUp |

---

## 2. Alcance

| Pantalla | Ruta | Funcion | Archivo |
|---|---|---|---|
| **F-01** Landing | `/` | Por construir — PoC 3 (D4) es solo demo de tokens, no pantalla de negocio. Ver `plan_estructura_sitio_publico.md` | — |
| **F-02** Tienda Web | `/colecciones`, `[slug]` | Grid + filtros (categoria, acabado, precio, checkout) | `disenio_F02_tienda_web.md` |
| **F-03** Portafolio de Proyectos | `/portafolio`, `[slug]` | Proyectos personalizados realizados, sin precios exactos, JSON-LD | `disenio_F03_portafolio_proyectos.md` |
| **F-07** Portal cliente | `/cuenta` | Proyectos, pagos, progreso, acta, garantia | `disenio_F07_portal_cliente.md` |
| **F-08** Propuesta publica | `/propuesta/{slug}` | Snapshot inmutable, navegacion espacios, MO calculada | `disenio_F08_propuesta_publica.md` |
