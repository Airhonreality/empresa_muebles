# ZU_99: Chequeo de Integridad Final

## Antes de pasar de una fase a la siguiente, verificar todos los puntos:

### Checklist General (por cada fase)

| # | Check | Verdadero/Falso |
|---|-------|-----------------|
| 1 | `tsc --noEmit` pasa con 0 errores | |
| 2 | 73/73 tests mock-store pasan (o adaptados y pasando) | |
| 3 | Multi-usuario: segundo usuario ve cambios del primero en ≤4s | |
| 4 | Perceived item creation < 200ms (optimistic UI) | |
| 5 | Solo el componente tocado re-renderiza (no global) | |
| 6 | Long-poll + BroadcastChannel aún funcionando | |
| 7 | Gates y reglas de negocio intactos | |
| 8 | No hay errores de runtime en consola | |

### Checklist por Fase

#### Fase 0 (Estructura)
- [ ] Carpetas `lib/data/stores/` existen
- [ ] `useCotizadorStore` creado y funcional (solo lectura)
- [ ] `types.ts` con tipos correctos exportados
- [ ] `selectors.ts` con selectores memoizados

#### Fase 1 (Migrar Cotizador)
- [ ] `[proyectoId]/page.tsx` usa `useDataStoreCotizador()` en lugar de `useDataStore()`
- [ ] Selectores granulares funcionando en la UI
- [ ] `React.memo` aplicado en `EspacioGroup` y `VarianteContenido`
- [ ] `useMemo` aplicado en `productMap` derivation
- [ ] Vista idéntica a la anterior

#### Fase 2 (Optimistic + P3/P4)
- [ ] Item creation es optimista (UI instantánea)
- [ ] Si Server Action falla, el optimistic se revierte
- [ ] `eliminarVariante()` funciona en la UI
- [ ] Rename inline accessible en tabs de variantes
- [ ] P3 y P4 resueltos de manera usables

#### Fase 3 (Comercial + Finanzas)
- [ ] `useComercialStore` funcional
- [ ] `useFinanzasStore` funcional
- [ ] Kanban comercial migrado sin regresiones
- [ ] Módulos de finanzas migrados sin regresiones
- [ ] Multi-usuario: cambios entre pestañas visibles

#### Fase 4 (Otros stores)
- [ ] `useTallerStore`, `useCalidadStore`, etc. creados
- [ ] Todos los módulos del ERP migrados o conviviendo
- [ ] Sin degradación de funcionalidad

#### Fase 5 (Long-poll per-domain)
- [ ] Snapshots parciales aplicándose correctamente
- [ ] Reactividad a escala preservada
- [ ] Bandwidth optimizado en polling

#### Fase 6 (Limpieza)
- [ ] `DataStoreProvider` monolítico eliminado o simplificado
- [ ] `notify()` manual eliminado de mock-store y contracts.ts
- [ ] Código más limpio, menos líneas totales

#### Fase 8 (Escalar)
- [ ] Prueba con 100 cotizadores mock completada
- [ ] Métricas de rendimiento documentadas
- [ ] Arquitectura lista para producción

### Firmas

| Rol | Firma (nombre) | Fecha |
|-----|----------------|-------|
| Responsable de Desarrollo | | |
| Supervisor (Javier) | | |
| QA | | |