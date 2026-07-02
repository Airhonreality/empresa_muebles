# Plan de Implementacion ERP y Checklist de Cambios

Este documento separa el trabajo en dos horizontes:

- corto plazo: cerrar el flujo comercial hacia produccion con una accion explicita del usuario;
- largo plazo: usar el scheduler operativo que ya trae el engine antes de crear UI propia.

El objetivo es evitar magia oculta, duplicacion de logica y entropia innecesaria.

---

## Fase 1: Backend de Automatizacion

- [x] `zap_activar_produccion` ya genera o reutiliza contrato.
- [x] `zap_activar_produccion` divide el contrato en 3 obligaciones (`50%`, `25%`, `25%`).
- [x] `zap_activar_produccion` crea `ordenes_trabajo` en estado `pendiente`.
- [x] `zap_activar_produccion` cambia el estado del proyecto a `produccion`.

---

## Fase 2: Integracion Comercial

Objetivo: activar produccion solo con una accion explicita de UI.

- [ ] Agregar un boton literal de "Pasar a produccion" en `src/components/specialized/kanban/ComercialKanban.tsx`.
- [ ] Agregar el mismo boton en `src/components/specialized/CotizadorPro.tsx` cuando el contexto lo permita.
- [ ] Abrir un modal intermedio de confirmacion antes de ejecutar la transicion.
- [ ] Invocar `zap_activar_produccion` solo despues de la confirmacion manual del usuario.
- [ ] No activar produccion solo por firma del contrato.

Notas de diseno:

- La UI puede requerir contrato disponible para habilitar el boton.
- La UI no debe inferir produccion automaticamente a partir de la firma.
- El zap sigue siendo la unica pieza que materializa la transicion final.

---

## Fase 3: Calendario Operativo

El engine ya trae un scheduler por defecto, asi que la primera opcion es reutilizarlo.

- [ ] Verificar que el scheduler nativo cubra agenda, semanal y diario.
- [ ] Si falta cobertura, crear solo un wrapper especializado del fork.
- [ ] Agregar filtros por departamento sobre la base del scheduler del engine.
- [ ] Registrar bloque propio solo si el engine no expone la pieza necesaria.
- [ ] Registrar la ruta `/app/calendar` y la navegacion correspondiente cuando la integracion lo requiera.

Regla:

- No crear `VetaCalendar` por defecto si el engine ya resuelve la planificacion.
- Solo se crea UI custom donde exista una brecha funcional real.

---

## Fase 4: Validacion

- [ ] Ejecutar `npm run agnostic:compile` si cambian schemas o contratos tipados.
- [ ] Verificar que las rutas del fork sigan resolviendo sus bloques.
- [ ] Probar la transicion manual hacia produccion desde Comercial y Cotizador.
- [ ] Confirmar que el calendario reutiliza el scheduler del engine sin duplicarlo.

---

## Criterios De Calidad

- Una sola via para pasar a produccion.
- Sin activaciones automaticas ocultas.
- Sin duplicar scheduler ni calendario si el engine ya lo trae.
- Sin tocar engine para necesidades de negocio del fork.
- Sin editar `storage/**/*.json` a mano.

---

## Pendientes No Bloqueantes

- Mejorar la estetica del kanban comercial para acercarla a la familia visual del kanban de produccion.
- Probar una version del kanban comercial organizada por pestañas de estado.
- Revisar si hace falta un adaptador ligero para el scheduler del engine.

