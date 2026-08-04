# Loop 2 — nuevos hallazgos + loop metodológico de retroalimentación al mapa

**Qué es esto:** el segundo pase de auditoría sobre las respuestas de la ronda 2 y el cierre del diamante (`cierre_diamante.md`), buscando hallazgos que el primer cierre no capturó. Y la definición del **loop metodológico** que se implementará para integrar todo en `logica_de_negocio.md` (el "documento 1"), cerrando formalmente la iteración del diamante.

**Qué NO es esto:** no es el mapa. `logica_de_negocio.md` no se toca hasta que este loop se ejecute (paso 3 de la Parte B).

**Método:** relectura crítica de cada respuesta contra lo ya destilado en el cierre — lo que el cierre no capturó, o capturó incompleto. (Segunda vuelta del mismo §2.C: cada vuelta agrega profundidad.)

---

# PARTE A — Loop 2: nuevos hallazgos

## A1. El schema ES el definidor — ahora con respaldo estructural (Q1 + Q9)

El cierre corrigió la tesis; el loop 2 encuentra **por qué es estructural, no semántico**:

- La matrioshka **proyecto → espacio → módulos/items** ya existe en el cotizador como concepto (no como propuesta): cada capa tiene su propio detalle.
- Cada **espacio** captura el contexto físico real del cliente: elementos existentes (neveras, electrodomésticos, fichas técnicas de **voltaje**, aperturas, artefactos dependientes como impresoras o computadores) con sus medidas y requisitos de instalación sobre el módulo. → **El schema no describe solo lo que se vende; describe el lugar donde se instala.** Esa es la mitad "definidor de proyectos".
- El **"Veta Designer"** (prototipo en `devs`) es la materialización en software de esa mitad: traduce el schema de proyecto a etiquetas del modelo 3D (piezas melamínicas, herrajes por módulo, colores, escenas de render). Su ambición declarada: diseño por **control CLI con módulos y predefiniciones dinámicas**.
- **Implicación de diseño:** el schema de proyecto es el contrato de datos que alimenta el check de aprobación (A2), el modelo 3D y la lista de corte. No es una tabla más — es la columna vertebral del lado "definir".

## A2. Separación ejecutor-verificador a nivel de evento, no de persona (Q4)

> "Si es la misma persona, se tiene que reunir con ella misma para hacer la validación sobre el schema."

- La validación pre-compras es un **acto del rol verificador**, distinto del acto del rol ejecutor (desarrollo), aunque el actor físico sea el mismo.
- **Implicación de diseño:** el sistema modela el check de schema como un evento con autoridad propia (quién aprueba), no como "la misma persona confirmando". Refuerza el invariante 1 (roles-no-personas) con un caso real: hoy una persona ocupa ambos roles.

## A3. Gates estructurales, no procedimentales (Q5)

> "A veces me salto mis propios protocolos."

- El propio comercial (Javier) admite saltarse protocolos. Si el control depende de que alguien lo respete, no hay control.
- **Implicación de diseño:** el gate debe ser una **propiedad del estado del proyecto** (no se avanza sin el check registrado), no una instrucción. El sistema no debería permitir avanzar de estado sin el acto de validación — ni siquiera al dueño.

## A4. El gate de recepción de material = transferencia a producción (Q6)

- El proyecto pasa a "**control total del subsistema desarrollo-taller**" cuando el desarrollador marca **tres verificaciones**: (1) compras hizo bien el pedido, (2) el proveedor hizo bien su despacho, (3) el material está en el taller, verificado en cantidades y funcionamiento.
- **Y "comercial solo espera citación a revisión de calidad"** → la calidad es un evento **empujado (push)** desde Producción hacia Comercial, no algo que Comercial agenda.
- **Implicación de diseño:** son 3 sub-verificaciones que juntas son el gate; la calidad se modela como citación, no como tarea de Comercial.

## A5. SLA de novedad crítica: 5-24 horas (Q7)

- La tipología de eventos del cierre ya la listó; el loop 2 agrega que tiene **ventana de respuesta 5-24h** — es un evento con SLA, no un aviso.
- **Implicación de diseño:** requiere registrar hora de entrada y hora de resolución para auditar el cumplimiento del SLA.

## A6. La causa del desfase es dato auditable (Q7)

- El cierre dice "solo eventos externos mueven el cronograma". El loop 2 profundiza: **cada cambio de cronograma se clasifica como causa interna o externa, y de esa clasificación dependen nóminas e incentivos** (si es interno, los aliados pierden estímulo; si es externo, se corren los plazos y los empleados se miden contra los nuevos).
- **Implicación de diseño:** el sistema debe registrar la causa del desfase como **dato estructurado** (interno/externo + motivo), no como texto libre, porque alimenta el cálculo de comisiones. Es un input de Finanzas, no de calendario.

## A7. Micro cuentas de cobro autogeneradas (Q12)

- Solución propuesta concreta: **permiso de uso de firma previo + autogenerar la micro cuenta de cobro con cada registro transaccional**.
- **Implicación de diseño:** la compensación a socios/aliados genera su documento (cuenta de cobro) automáticamente por registro. Es automatización documental de la capa de compensación — misma familia que la firma virtual del contrato (RED2).

## A8. El control de compras es gobernanza, no solo operación (Q13)

- "Se necesita control de compras prioritariamente **para mantener la confianza del equipo de socios**."
- **Implicación de diseño:** la transparencia de compras/caja es el contrato de confianza entre socios. El dashboard de compras no es interno de Compras — es el mecanismo que mantiene viva la sociedad. Se conecta con el punto 6 (salud de caja visible).

## A9. Estimación de duración por tamaño de proyecto (Q17)

- "Si el proyecto crece, se estima un porcentaje de crecimiento en los tiempos; el tamaño se mide por **valor y cantidad de ítems/módulos**."
- **Implicación de diseño:** existe una función de estimación de duración (≈ f(valor, cantidad de ítems/módulos)) que permite **proyectar el cronograma antes del contrato** — es lo que hace que el cronograma del contrato (invariante 3) sea calculable y no estimado de memoria.

## A10. Las 4 rutinas clave = núcleo de la capa 1 (Q19)

> "Con esas 4 rutinas claves cumplidas con calidad se asegura el resto de la calidad del proyecto por default. Lo demás es capa 2."

1. **Retoma de medidas.**
2. **Reunión post-desarrollo con comercial** (aprobar proyecto → hoy reunión, mañana check de schema).
3. **Comprar** (proceso distribuido a proveedores y terceros, pago apenas se dispone del dinero, prioridad: materiales → arriendos → nóminas).
4. **Recibir material exitoso.**

- **Implicación de diseño:** el MVP del sistema es controlar estas 4 rutinas. Es el alcance mínimo de la capa 1 — todo lo demás (taller detallado, manual ISO, pantallas de carpinteros) es capa 2.

## A11. Desequilibrio estructural 4:1 — el negocio está limitado por demanda, no por fábrica (Q17)

- Producción: 1.25 proy/semana ≈ **5/mes**. Comercial: **1.25/mes**. Ratio ≈ 4:1.
- **Implicación estratégica (operativa, no de estrategia §2.D):** el desbloqueo del negocio hoy está en comercial/leads/marketing, no en capacidad productiva. Refuerza la prioridad de tienda web + producto de catálogo como línea de crecimiento y el cuello de botella detectado en el cierre (§5).

## A12. Las 3 verificación de recepción del taller son la frontera real de la capa 1

- Síntesis de A4: la capa 1 de control entre subsistemas se materializa en **pocos gates concretos**: (a) check de schema pre-compras, (b) triple verificación de recepción de material, (c) citación de calidad, (d) cronograma inmutable con causa registrada. Es un conjunto pequeño y cerrado — no una plataforma de workflow.

---

# PARTE B — Loop metodológico de retroalimentación al mapa

**Objetivo:** integrar las rondas 1 y 2 en `logica_de_negocio.md` (Parte I) de forma auditable y verificada, y cerrar formalmente la iteración del diamante.

## Fuentes del loop

| Documento | Rol en el loop |
|---|---|
| `logica_de_negocio.md` | **Documento 1 — el mapa.** Destino de la integración. |
| `segunda_ronda_preguntas.md` | Fuente cruda de las respuestas de Javier. |
| `cierre_diamante.md` | Destilado de convergencia (Define). |
| `loop2_y_retroalimentacion.md` (este) | Hallazgos de profundidad + la definición de este loop. |

## Pasos del loop (en orden, sin atajos)

### Paso 1 — Inventario de cambios
Mapear cada hallazgo (cierre §1-§10 + loop 2 A1-A12) contra la sección del mapa que toca. Tabla de 3 columnas: **hallazgo → sección del mapa → tipo de cambio**.

### Paso 2 — Clasificación de cada cambio
Cada hallazgo se clasifica como exactamente una de:
- **Corrección** — dato del mapa que está mal (ej. $100k → $130k).
- **Adición** — dato nuevo que el mapa no tenía (ej. Control de cronograma, integraciones, documentación).
- **Refuerzo** — confirma lo que el mapa ya decía (ej. la cadena dura de Producción).
- **Diferido** — se registra pero NO se edita (capa 2, sesión estratégica §2.D, R2, neto post-impuestos).

### Paso 3 — Edición del mapa
- Solo se edita **Parte I** (`logica_de_negocio.md`). La Parte II no se toca hasta cerrar la Parte I.
- Respeto estricto de prohibiciones del arnés: sin mutación de schema/reglas, sin inventar contenido que no salió de las respuestas.
- Los cambios marcados **corrección** se hacen con nota de autocorrección (patrón ya usado en el propio mapa: no se borra el error, se registra).

### Paso 4 — Verificación de consistencia cruzada
- Releer el mapa editado contra las respuestas crudas y el cierre: ¿todo hallazgo integrado? ¿alguna contradicción nueva introducida? ¿quedó información sin integrar?
- Chequeo mecánico: cada hallazgo del inventario del paso 1 debe tener su cambio correspondiente en el mapa (trazabilidad uno-a-uno).

### Paso 5 — Marcado Living Documentation
- Cada sección editada se marca como **registro histórico** (explica una decisión pasada, no se actualiza) o **contrato vivo** (el schema/UI actuales DEBEN reflejarlo). Ninguna sección queda ambigua.
- El diagrama Mermaid del flujo completo se actualiza en el MISMO commit que las secciones que lo tocan (ej. agregar el gate de recepción triple, la citación de calidad, la novedad crítica).

### Paso 6 — Checkpoint del Supervisor
- Javier aprueba con **evidencia mecánica, no con la palabra del agente**: el mapa releído de punta a punta, la tabla de trazabilidad (paso 1) llena, y las contradicciones resueltas listadas.
- Si rechaza: se corrige y se vuelve a mostrar. Sin aprobación no hay "cierre de iteración".

### Paso 7 — Cierre de la iteración del diamante
- Actualizar `arnes/estado.md` (qué cambió, qué se integró, qué quedó diferido).
- Actualizar `arnes/INDEX.md` (agregar los 3 documentos nuevos del ciclo: banco, cierre, este).
- Recién acá: abrir la **Parte II** — decidir qué módulos de capa 1 pasan a diseño de schema/UI (candidatos de A12: Control de cronograma, Desarrollo, Calidad, Finanzas/Compensación).

## Criterio de salida del loop

El mapa refleja **todos** los hallazgos del cierre + loop 2, sin contradicciones internas, con trazabilidad uno-a-uno verificada, Living Documentation marcada, y aprobación explícita del Supervisor. Si algo de eso falta, el loop no está cerrado.

---

# PARTE C — Ejecución del loop (registro, 2026-08-03)

## Paso 1-2 — Inventario y clasificación de cambios

Tabla de trazabilidad uno-a-uno: cada hallazgo del cierre + loop 2 mapeado contra `logica_de_negocio.md` (Parte I).

| Hallazgo | Sección del mapa (Parte I) | Tipo de cambio |
|---|---|---|
| Cierre §8.1: $100k → $130k + DIAN | Diagrama Mermaid (node diseño 3D); árbol de problemas; línea de tiempo (Diseño 3D); narrativa presupuesto→contrato | **Corrección** (con nota) |
| Cierre §3: "gig" → "socios-por-comisión" + tabla compensación | Sección "Idea de negocio" | **Corrección** + **Adición** (tabla) |
| Cierre §6: Control de cronograma (modelo temporal) | Sección nueva "Control de cronograma" | **Adición** |
| Cierre §4/§8.3: dos capas; subdivisión de Producción | Sección "Capa 1 = control entre subsistemas"; nota Hallazgo B | **Adición** |
| Loop 2 A1: schema = definidor estructural | Narrativa "integraciones de producción" | **Adición** |
| Loop 2 A2: separación ejecutor-verificador por evento | Sección "Capa 1" | **Adición** |
| Loop 2 A3: gates estructurales, no procedimentales | Sección "Capa 1" | **Adición** |
| Loop 2 A4: triple verificación + citación de calidad push | Sección "Capa 1" + diagrama Mermaid | **Adición** |
| Loop 2 A5: SLA novedad crítica 5-24h | Sección "Control de cronograma" | **Adición** |
| Loop 2 A6: causa del desfase = dato auditable | Sección "Control de cronograma" | **Adición** |
| Loop 2 A7: micro cuentas de cobro autogeneradas | Narrativa "financiero/compensación" | **Adición** |
| Loop 2 A8: control de compras = gobernanza de la sociedad | Narrativa "política financiera no acumular deuda" | **Adición** |
| Loop 2 A9: estimación por tamaño (f valor, ítems/módulos) | Sección "Control de cronograma" | **Adición** |
| Loop 2 A10: 4 rutinas clave = núcleo capa 1 | Sección "Capa 1" | **Adición** |
| Loop 2 A11: desequilibrio 4:1, demanda > fábrica | Sección "Capacidad instalada y restricciones" | **Adición** |
| Loop 2 A12: 4 gates de la capa 1 | Sección "Capa 1" | **Adición** |
| Cierre §5: capacidad instalada (Q17/20/21) | Sección "Capacidad instalada y restricciones" | **Adición** |
| Cierre §7: precisión de tiempos (rango 5 días, garantía 8-12) | Línea de tiempo (Instalación, Garantía); narrativa garantía; diagrama Mermaid | **Adición** |
| Cierre §10: franjas libres visita | Línea de tiempo (Se agenda visita) | **Adición** |
| Cierre §10: Integraciones (SketchUp/OpenCutList/CVC/Corte Cloud) | Narrativa "integraciones de producción" | **Adición** |
| Cierre §10: Documentación (Drive VETA_ERP) | Narrativa "documentación" + Discover ancho | **Adición** |
| Cierre §10: política "no acumular deuda" | Narrativa "política financiera no acumular deuda" | **Adición** |
| Aprobación pre-compras = check de schema, no reunión | Línea de tiempo (Aprobación); sección "Capa 1" | **Adición** |

**Diferido (registrado, NO editado):** cálculo del neto post-impuestos del diseñador (pendiente de negocio); diagnóstico de `G:\Mi unidad\VETA_ERP`; modelo de micro cuentas de cobro en detalle (Paso II); % del carpintero "por tamaño" (sin número); capa 2 (taller/ISO); sesión estratégica §2.D.

## Paso 4 — Verificación de consistencia cruzada (chequeo mecánico)

- **Trazabilidad uno-a-uno:** cada hallazgo del inventario tiene su cambio en el mapa (verificado contra `cierre_diamante.md` §1-§10 y este documento A1-A12).
- **Contradicciones nuevas introducidas:** ninguna detectada en la relectura de la Parte I.
- **Información del mapa que contradice la ronda 2:** la única era el precio del diseño 3D ($100k), corregida en los 4 lugares donde aparecía (diagrama, árbol de problemas, línea de tiempo, narrativa).
- **Pendiente conocido, no contradictorio:** la Parte II conserva la fila "Producción — ⚠ candidato a subdividir, ver hallazgo B" en la tabla de módulos. Es **intencional** (el loop Paso 3 prohíbe tocar la Parte II hasta cerrar la Parte I); se reconcilia cuando se abra la Parte II.

## Paso 5 — Marcado Living Documentation

- **CONTRATO VIVO:** compensación por rol; Control de cronograma; Capa 1/gates; política financiera; integraciones de producción; documentación; micro cuentas de cobro.
- **REGISTRO HISTÓRICO:** Capacidad instalada y restricciones.
- **Diagrama Mermaid actualizado en el mismo pase** que las secciones que toca (check de schema, triple verificación, citación de calidad push, prioridad de pagos, garantía 8-12 días).

## Paso 6 — Pendiente: aprobación del Supervisor (Javier)

Evidencia para el checkpoint: el mapa releído (Parte I), la tabla de trazabilidad de arriba, y las contradicciones resueltas (listadas en Paso 4). Sin aprobación no hay cierre de iteración.

---

## Registro

- Fecha: 2026-08-03
- Autor del pase: agente (ejecución del loop sobre `logica_de_negocio.md`).
- Estado: Pasos 1-5 ejecutados; **a la espera del checkpoint del Supervisor (Paso 6)**. Si aprueba → Paso 7 (actualizar `arnes/estado.md` e `arnes/INDEX.md`, abrir Parte II).
