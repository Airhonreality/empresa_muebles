# ZU_03: Roadmap Faseado (8 Fases)

## Objetivo General

Mejorar la arquitectura del data layer para soportar 100 cotizadores simultáneos, sin detener el cotizador en producción.

## Fase 0: Estructurar Stores (S1)

| Entregable | Descripción |
|------------|-------------|
| `lib/data/stores/` estructura | Carpetas y files iniciales |
| `useCotizadorStore` (solo lectura) | Store con selectors granulares, sin re-render global |
| `useComercialStore` (esqueleto) | Esqueleto para later |
| `useFinanzasStore` (esqueleto) | Esqueleto para later |

### Criterios de Éxito
- [ ] `tsc --noEmit` 0 errores
- [ ] Estructura de carpetas creada
- [ ] Primer store cotizador funcional (solo lectura)
- [ ] No se tocó el cotizador en producción (sigue en `dev` igual)

### Invariantes (nunca cambiar)
- Drizzle + Server Actions preservados
- 73 tests mock-store preservados
- Long-poll + BroadcastChannel preservados
- Gates y reglas de negocio intactas

---

## Fase 1: Migrar Cotizador a useDataStoreCotizador (S1-S2)

| Entregable | Descripción |
|------------|-------------|
| Migrar `[proyectoId]/page.tsx` | Reemplazar `useDataStore()` → `useDataStoreCotizador()` |
| Selectores granulares en componentes | `useSelectPorVariante`, `useSelectTotales`, etc. |
| React.memo en EspacioGroup y VarianteContenido | Evitar re-renders innecesarios |
| useMemo para productMap | Solo recomputa cuando catalogo cambia |

### Criterios de Éxito
- [ ] `tsc --noEmit` 0 errores
- [ ] Vista idéntica, `73/73 tests` adaptados
- [ ] Solo el componente tocado re-renderiza (no global)
- [ ] Percepción de item creation < 200ms (optimistic)

---

## Fase 2: Acciones Optimistic + React.memo + useMemo (S2-S3)

| Entregable | Descripción |
|------------|-------------|
| `crearItemOptimistic` | Actualización instantánea en UI, server en background |
| Revert en error | Si el Server Action falla, el optimistic se revierte automáticamente |
| `eliminarVariante()` | Acción concreta en el store (resuelve P3) |
| Rename inline en tabs | Accesible desde la lista de variantes (resuelve P4) |

### Criterios de Éxito
- [ ] UI instantánea al crear item (no espera red)
- [ ] Revert automático en error de Server Action
- [ ] P3/P4 resueltos y usables en la UI
- [ ] Tests aún pasan

---

## Fase 3: Stores Comercial y Finanzas (S3-S4)

| Entregable | Descripción |
|------------|-------------|
| `useComercialStore` | Proyectos, clientes, contratos, hitos |
| `useFinanzasStore` | Cajas, obligaciones, movimientos |
| Migrar kanban comercial | A usar store en lugar de useDataStore global |
| Migrar finanzas | Cajas y obligaciones |

### Criterios de Éxito
- [ ] `tsc --noEmit` 0 errores
- [ ] Multi-usuario intacto (long-poll funciona)
- [ ] No hay regresiones en módulos comerciales/financieros

---

## Fase 4: Stores Restantes (Taller, Calidad, etc.) (S4-S5)

| Entregable | Descripción |
|------------|-------------|
| `useTallerStore` | Órdenes de trabajo, herramientas |
| `useCalidadStore` | Verificaciones, reprocesos, garantía |
| `useAlmacenStore` | Inventario, movimientos |
| `useGarantiaStore` | Casos, diagnósticos, órdenes de reparación |

### Criterios de Éxito
- [ ] Todos los módulos migrados
- [ `tsc --noEmit` 0 errores
- [ ] Sin degradación de funcionalidad en ningún módulo

---

## Fase 5: Long-Poll Per-Domain (S5-S6)

| Entregable | Descripción |
|------------|-------------|
| Aplicar snapshots parciales | En lugar de re-hidratar las 64 tablas, aplicar solo el dominio relevante |
| Reactividad ≤4s a escala | Cambios de otro usuario visibles en ≤4s en el dominio correcto |
| Optimizar bandwidth | Menor transferencia de datos en cada poll |

### Criterios de Éxito
- [ ] Reactividad preservada o mejorada
- [ ] Menor uso de bandwidth en polling
- [ ] Sin degradación multi-usuario

---

## Fase 6: Limpieza Final (S6-S7)

| Entregable | Descripción |
|------------|-------------|
| Eliminar `DataStoreProvider` monolítico | Sustituir por provider que suscribe a stores por dominio |
| Eliminar `notify()` manual | Simplificar contracts.ts - quitar notify() de mock-store |
| Simplificar contracts.ts | Remover tipos y funciones ya no necesarias |

### Criterios de Éxito
- [ ] Código más limpio, menos líneas
- [ ] `tsc --noEmit` 0 errores
- [ ] Sin `notify()` manual en el código

---

## Fase 7: Pruebas a Escala (S7-S8)

| Entregable | Descripción |
|------------|-------------|
| Probar con 100 cotizadores mock | Simular 100 usuarios cotizando simultáneamente |
| Medir perf: re-renders, latencia, memory | Confirmar que la arquitectura soporta la carga |
| Ajustes finales | Ajustes menores si la medición muestra cuellos de botella |

### Criterios de Éxito
- [ ] Fluido con 100 cotizadores simultáneos
- [ ] Métricas de rendimiento confirmadas
- [ ] Proyecto listo para producción con nueva arquitectura