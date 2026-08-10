# Checklist de progreso — pantallas F10 (B2 en adelante)

**Contrato vivo.** Fecha: 2026-08-09. Aplica a toda tarea de tipo `pantalla` o `datos` dentro de F10 (bloques B2–B6 en adelante), sin excepción. No es una sugerencia: es la Definición de Hecho de esta línea a partir de hoy.

**Por qué existe:** el cierre de B1 costó ~10 vueltas de debugging sobre un síntoma ("no logro cambiar el nombre de un espacio") que resultó ser dos cosas evitables: (1) una decisión de arquitectura ya tomada (POC-10#2/#4, "el data layer mock DEBE ser reactivo") que quedó en prosa sin ningún artefacto ni test que la hiciera cumplir — ver `m07_capa_reactividad.md`; y (2) un control de UI real que nadie encontraba porque estaba enterrado tres niveles de clics. Ninguna de las dos causas tenía un chequeo mecánico que la atrapara antes de llegar al Supervisor. Este checklist es ese chequeo.

**A quién se dirige:**
- **Iniciador:** copia los criterios de la sección aplicable directamente a "Criterios de aceptación" de tu plan — no los resumas de memoria, cítalos por número.
- **Código:** son parte de tu autorrevisión (`arnes/roles/codigo.md` §"Autorrevisión antes de entregar"), además de la tuya habitual.
- **QA:** si el Iniciador citó estos criterios, los verificas como cualquier otro (`arnes/roles/qa.md` §3, output crudo, no resumido). Si el plan de una tarea de pantalla/datos de F10 **no** los citó, los exigís igual — es el contrato vivo de la línea, no algo opcional por omisión del Iniciador.

---

## 1. Capa de datos — toda tarea que toque `lib/data/`

1. Se lee con `useDataStore()` (`lib/data/index.ts`), nunca `getDataStore()` directo en `app/`. Enforced por `eslint.config.mjs` (`no-restricted-imports`), pero es la regla a seguir por diseño, no solo porque el linter la bloquea.
2. Ningún componente reinventa `useState(0) + setTrigger` ni un `onRefresh` manual pasado por props. Si algo no refresca, la causa solo puede ser (a) el método mutador del store no llama `notify()`, o (b) el componente no llama `useDataStore()`. No hay un tercer lugar donde buscar.
3. Todo método mutador nuevo en `mock-store.ts` (de cualquier dominio: cronograma, gates, compras, taller, lo que traiga B2 en adelante) llama `notify()` antes de `return`. Se agrega al escribir el método, no como parche posterior.
4. Si un `useMemo` envuelve una lectura del store, su arreglo de dependencias incluye `store.getVersion()` — nunca `store` solo (referencia estable, no cambia) ni un `trigger` manual.

## 2. Definición de "hecho" para un dominio/pantalla nueva

5. Todo dominio nuevo agrega su propio caso de round-trip a `lib/data/mock-store.test.ts` (crear → leer → actualizar → leer de nuevo) **antes** de darse por terminado. Esto es lo que `arnes/roles/qa.md` ya exige para tareas tipo `datos`/`lógica de negocio` ("validación de contrato + round-trip", "no vale 'se ve bien'") — este test es la forma concreta de cumplirlo para `lib/data/`.
6. Se corren y se pega el output crudo de: `npx tsc --noEmit`, `npx eslint .`, `DATA_IMPL=mock npx next build`, y `npx tsx lib/data/mock-store.test.ts`. Los cuatro, no un subconjunto.
7. Nadie declara una pantalla "lista" solo porque compiló o porque "el agente dice que ya quedó" (`arnes/roles/qa.md` §"Prohibido"). El round-trip del punto 5 es la prueba; el resto es higiene.

## 3. UX — que el control se pueda encontrar

8. Todo control de edición de un campo "obvio" de la pantalla (nombre, estado, cantidad — lo primero que un usuario real busca) es visible en el nivel superior del componente (header/card), sin expandir ni abrir un sub-formulario. Antes de dar una pantalla por lista: **¿el campo más buscado se ve sin excavar?**
9. Si el `disenio_PXX.md`/`disenio_FXX.md` de la pantalla no dice explícitamente dónde va cada control de edición común, es un gap de diseño que se cierra antes de codificar — no algo que el agente Código improvisa mientras escribe.
10. Cualquier hallazgo de "el campo existe pero está escondido" se registra en `registro_hallazgos_poc4.md` con el mismo formato que los demás — es un hallazgo de tipo `solo_ui`, no un descarte.
11. **Todo input de imagen (pantallas privadas o públicas) usa `components/veta/image-picker.tsx`** (`multiple={false}` para un solo campo, ej. `fotoUrl`; `multiple={true}` — default — para arreglos, ej. `fotosEspacio`). Nunca un `<input type="text" placeholder="https://...">` nuevo — es exactamente el patrón que generó la Auditoría 2, hallazgo 5.

## 4. Paralelización de lotes (B2 en adelante)

11. Dos lotes corren en paralelo **solo si** ninguno de los dos toca `lib/data/{contracts,mock-store,index}.ts` al mismo tiempo que el otro — son archivos compartidos entre todos los dominios; si un lote nuevo necesita tocarlos, se serializa esa porción con cualquier otro lote activo.
12. Un lote se declara "hecho" solo con: su propio caso de round-trip (punto 5) + los 4 comandos del punto 6 + el chequeo de UX (punto 8) — no antes.
13. Antes de arrancar un lote nuevo en paralelo con el cierre de otro, se revisa `registro_hallazgos_poc4.md` del lote que cierra: si tiene hallazgos abiertos que puedan mutar schema/contratos compartidos, el lote nuevo espera a que cierren (pueden cambiar lo que el lote nuevo daría por sentado).

---

## Verificación de integridad de este checklist

- [x] Cada punto es verificable mecánicamente o por inspección directa (ninguno dice "que quede prolijo" o "sea eficiente" — mismo estándar que exige `arnes/roles/iniciador.md` para criterios de aceptación).
- [x] Cubre las dos causas raíz de POC-14 (reactividad sin enforcement, UI sin discoverability) y la pregunta abierta del Supervisor sobre paralelización de lotes.
- [x] Referenciado desde `arnes/INDEX.md` §3.a, `arnes/lineas/ola7/estado_ola7.md` y `plan_f10.md` — entra en la lectura de arranque de cualquier agente de esta línea, no depende de que el Iniciador lo recuerde.
