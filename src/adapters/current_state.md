1. Estoy por crear los planes de imlpementacion de cada uno de estos adapters, anticipa vectores dentropia o flags que debamos tener en cuenta en el diseño de estos sub sistemas del sistema agnostyc engine, el cual funciona como un kernel SDK de orqeustación server less, integraciones y desarrollo custom.

Se deben contrusir los adapters src\adapters de cada api sigueindo el patron agnostico del engine, sus contratos y forms de configuración. Deben permitir el uso de la api por el resto del sistema de manera agnostica y ser compatibles con el modelo de @comandos CLI.md con la api, osea todo debe ser accionable configurable y orquestable por un cli robusto de api,   Luego deben levnatarse los "modulos" [ ](../modules) conjuncion de estos adapters en pro de un objetivo comun ejemplo: payments, Inbox, Render-Studio etc, brindando la oportunidad de administrar las orquestaciones. 
Todos los work flows deben de poderse administrar tambien  dsde CLI par aagilidad dev.

instalar todas als depednencias necesarias para adminsitrar las apis asi como netlify cli funciona en la aprte de serverless, buscamos que cada adpeter tambien ofresca la mayor cantidad de capacidades cli posibles. 

EL goal: Sería tener todos los modulos funcionando y conectados a las apis con el minimo esfuerzo humano posible maximo ejecutar auths o pegar apis, la posibildiad de crear flow / loops con scripts desde la cli procesa run mensaje por un pipeline de llms que buscan en la db del erp agregan tono de voz, devuelven mensaje / comentario o dispara una busqeuda de informacion enredes sociales sobre tendencias, pasa a llm de contenido, manda a producir video, manda a publicar, repite lop, etc.. poder vizualiazr  el desempeño de los flows o las orquestaciones. 


--- 
EL desarrollo sería construir un harnness y definir lso loops y agentes que realizaran la labor y mantendran la coherencia del arnes para que se cumplan los obejtivos teleologicos y se mantenga la homeostasis del repositorio con el largo plazo asegurnaod su escalabildiad.

1. FABLE 5 (planificador)
   Corre el prompt. Produce, por objetivo: INDEX.md (Estado: plan_borrador),
   diff de contrato, tabla de entropía, DAG con DoD. + STATE_MANIFEST al cierre.
        ↓
2. QA AUTOMÁTICO (modelo liviano, barato — Sonnet/Haiku, no tú a mano)
   Por cada objetivo en plan_borrador, corre un pase mecánico:
   - ¿Cada tarea del DAG tiene un comando DoD real y ejecutable (no prosa)?
   - ¿El diff de contrato tipa/compila como stub?
   - ¿Los verbos CLI nuevos chocan con algo detectado en la Fase 0 de homeostasis?
   - ¿Quedó algún "TBD"/"esto se define después"?
   Salida: PASA / FALLA + motivo puntual. Esto es barato porque es un modelo chico
   verificando estructura, no razonando de nuevo el diseño.
        ↓
3. TÚ (aprobación humana) — solo ves lo que ya pasó QA
   Lees el objetivo con juicio de negocio/arquitectura (¿es la forma correcta de
   exponer esta capability?). Si estás de acuerdo, cambias una línea:
   Estado: plan_borrador → Estado: plan_aprobado. Eso es todo — un git diff de
   una línea por objetivo, no una revisión de documento completo desde cero.
        ↓
4. MODELO LIVIANO (codificador)
   Instrucción explícita: "solo trabajas sobre objetivos con Estado: plan_aprobado;
   si ves plan_borrador, párate y pide aprobación". Ejecuta el DAG tarea por tarea,
   corriendo el DoD de cada una. Si algo no cuadra contra el plan, no improvisa
   diseño — reabre el objetivo (Estado: requiere_ajuste) y vuelve a Fable 5/humano,
   no lo resuelve por su cuenta.
        ↓
5. FABLE 5 (auditor — sesión posterior, MODO: AUDITORIA)
   Revisa el código real ya escrito por el paso 4 contra el plan_aprobado y el
   contrato. No corrige nada él mismo ni cambia el Estado — solo emite un veredicto
   por objetivo (CONFORME / DESVIACION_DETECTADA con evidencia archivo:línea) y
   distingue si la desviación es un bug de código (vuelve al paso 4) o un error del
   plan original (vuelve al paso 1). Re-corre también un chequeo de homeostasis
   ahora que existe código real (duplicados, choques de verbos CLI, patrones
   prohibidos). El humano decide el Estado final a partir de ese veredicto.

Ver prompt maestro completo (los 2 modos: PLANIFICACION y AUDITORIA) en
`PROMPT_FABLE5_ARQUITECTO_ARNES.md` (este mismo directorio).

---

Estado del pipeline (2026-07-03): paso 1 COMPLETO — los 10 objetivos en
`Estado: plan_borrador` (ver `INDEX.md`; los hallazgos de ads se pegaron
el mismo día y desbloquearon los 2 de conversions). Fase 0 + addendum en
`AUDITORIA_HOMEOSTASIS_2026-07-03.md`.

Paso 2 COMPLETADO: se ejecutó el QA mecánico sobre los 10 borradores.

Paso 3 COMPLETADO para los adapters que pasaron el QA estructural y ya tienen
código real alineado con el arnés (`llm`, `whatsapp`, `wompi`, `meta`,
`tiktok`). Los adapters `runpod-comfyui`, `shotstack-composer`, `meta-conversions-api`
y `google-ads-conversions` han sido extraídos a proyectos/carpetas satélite y su
capability es provista vía HTTP por `estudio_multimedia` y `adapters_archive`.

Estado operativo actual:
- Verde: `llm`, `whatsapp`, `wompi`, `meta`, `tiktok`
- Amarillo: `gmail` (modo test; G0 y watch pendientes)

Siguiente: no hay nueva ola de implementación de adapters locales todavía. La próxima
sesión arranca en la misma línea de trabajo y solo cubre los pendientes
manuales de los activos locales sin generar documentación nueva.
