# P-19 — Acta de Entrega (Cierre E-26)

**Fecha:** 2026-08-07 · **Estado:** propuesta · **Fase:** F5 · **Ruta:** `/app/erp/instalaciones/[id]/acta` · **Roles:** instalador, cliente (firma diferida), gerente

---

## 1. Entidades que consume

| Entidad | § REGISTRO | Columnas usadas | Uso |
|---|---|---|---|
| `actas_entrega` | §8 | id, proyecto_id, pdf_url, estado, holgura_operativa_dias, fotos, observaciones | Entidad central |
| `proyectos` | §3 | id, nombre_proyecto, estado ('instalado'), cliente_id | Contexto |
| `instalaciones` | §8 | id, proyecto_id, estado ('instalada') | Precondición |

---

## 2. Estados que transiciona

| Estado origen | Acción | Estado destino | Evento | Validación |
|---|---|---|---|---|
| — | Generar acta (PDF) | `generada` | — | `instalaciones.estado='instalada'` |
| `generada` | Enviar al cliente | `enviada` | — | `pdf_url` no vacío |
| `enviada` | Registrar firma (manual, sin wizard) | `firmada` + `proyectos.estado→entregado` | E-26 | — |

**Firma digital DIFERIDA:** `FirmaWizard` compartido con E-13. Por ahora, el instalador marca manualmente como firmada (checkpoint de confianza). No bloquea el cierre.

---

## 3. Vocabulario H07

| Label | Código |
|---|---|
| "Acta de entrega" | `actas_entrega` |
| "Generada" | `generada` |
| "Enviada" | `enviada` |
| "Firmada" | `firmada` |
| "Entregado" | `entregado` (proyecto) |

---

## 4. Reglas de negocio

| # | Regla | Validación |
|---|---|---|
| R1 | Solo se genera acta si `instalaciones.estado='instalada'` | Servidor |
| R2 | `holgura_operativa_dias = 12` | Default, editable |
| R3 | Al firmar, `proyectos.estado → 'entregado'` y se dispara E-26 | Servidor, atómico |
| R4 | Generar PDF: plantilla con datos del proyecto + instalación + fotos | Server-side (puppeteer / pdf-lib) |

---

## 5. Componentes UI

| Componente | Tipo | Props |
|---|---|---|
| `ActaWizard` | Client | `instalacion, proyecto`: pasos generar → enviar → firmar |
| `ActaPreview` | Client | `pdf_url`: iframe/vista previa del PDF |
| `FirmaManualBtn` | Client | Sin wizard de firma: botón "Registrar como firmada" |
| `ActaResumen` | Client | Datos del proyecto, fechas, fotos, holgura |

**DIFERIDO:** `FirmaWizard` (compartido con E-13, firma digital con token)

---

## 6. Comportamiento

| # | Evento | Gatillo | Acción | Trace |
|---|---|---|---|---|
| 1 | Generar acta | Click "Generar" | `POST /api/erp/actas-entrega` → genera PDF → guarda en R2 → `pdf_url` | — |
| 2 | Enviar al cliente | Click "Enviar" | `PATCH /api/erp/actas-entrega/:id {estado:'enviada'}` | — |
| 3 | Firmar (manual) | Click "Registrar firma" | `PATCH acta {estado:'firmada'}` + `PATCH proyecto {estado:'entregado'}` | E-26 |

---

## 7. Criterios de aceptación

| # | Criterio | Verificación |
|---|---|---|
| CA-1 | `tsc --noEmit` = 0 | `tsc --noEmit` |
| CA-2 | Generar sin instalación `instalada` → botón deshabilitado | Playwright: razón visible |
| CA-3 | PDF generado: URL en R2, `pdf_url` no vacío | Test: GET acta → `pdf_url` empieza con `https://` |
| CA-4 | Firmar → `proyectos.estado = 'entregado'` | Test: GET proyecto → estado = 'entregado' |
| CA-5 | Firma digital DIFERIDA: no hay wizard, solo botón manual | Playwright: existe "Registrar firma", no existe `FirmaWizard` |
