# UI — pendiente

`InboxShell.tsx` (el componente que renderiza la bandeja unificada, consumiendo `MessagingAdapter` de todos los adapters instalados) se escribe cuando exista al menos un adapter real funcionando en [`../../../adapters/`](../../../adapters/INDEX.md). Construir la UI antes de tener un adapter real es especulativo — el contrato de datos que la UI necesita se termina de confirmar con el primer proveedor implementado.

Cuando se escriba, sigue el patron de `src/components/specialized/calendar/CalendarScheduler.tsx` para el registro en `agnostic.config.ts` (`blocks: { inbox: () => import('./src/modules/inbox/ui/InboxShell') }`).
