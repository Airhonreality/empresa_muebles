# Análisis Retrospectivo: Campañas de Ads (Marzo 2026) vs Línea de Demanda (Agosto 2026)

Este documento formaliza el cruce de información empírica proveniente de los datos de campañas de Google Ads (Marzo 2026, ubicados en `ads_historico_marzo_2026/`) contra el estado y planificación de la línea de demanda formulados en Agosto de 2026 (`../estado_demanda.md` y `../plan_demanda.md`).

## 1. El Problema de Rastreo (H2 y H5) es una Regresión Técnica, no una falta de madurez comercial

- **Hallazgo de Marzo:** La campaña de Google Ads se estaba optimizando activamente. Había un CPA objetivo de $6.500 COP, se medían los CTR, se ajustaban concordancias de palabras clave (de amplia a frase) para reducir tráfico irrelevante (DIY, reparaciones), y se invertían $8.500 COP/día con medición de resultados.
- **Hallazgo de Agosto:** El archivo `estado_demanda.md` reporta que "se paga pauta a ciegas" (H5) y que el identificador "gclid se perdió en la migración" (H2).
- **Conclusión de Ingeniería Inversa:** La lógica y madurez comercial de medir la eficacia y hacer "fine-tuning" a las campañas ya existía en Marzo. El escenario actual de pagar a ciegas se debe a una pérdida o rotura técnica de la instrumentación (probablemente ocurrida durante el desarrollo de la V2 prototipo o en los early stages de la V3). Por tanto, el **Bloque A del `plan_demanda.md` no está creando un sistema nuevo, está *restaurando* la capacidad de medición indispensable que ya se había comprobado en Marzo.**

## 2. Validación Empírica del Embudo Híbrido (DC-3)

- **Hallazgo de Marzo:** El documento `recomendaciones_web.md` identificaba que había "Muchos 'Hola' por WhatsApp sin intención real" (la gasolina sucia). La solución exigida fue añadir un "Filtro de Clientes" (formulario de mini-calificación de 4 pasos) antes de abrir el enlace a WhatsApp.
- **Decisión de Agosto:** El plan de demanda implementó el "embudo híbrido (modal de 2 pasos + redirección)" para frenar precisamente el flujo de leads de baja calidad (Decisión DC-3).
- **Conclusión de Ingeniería Inversa:** La decisión arquitectónica (Agosto) está **perfectamente alineada y respaldada empíricamente** por el dolor real que sufrieron las campañas activas (Marzo). No es una simple mejor práctica, es una corrección operativa obligatoria.

## 3. Resolución: Eslogan vs H1 Directo para Conversión (Ads)

- **Hallazgo de Marzo:** Se diagnosticó que la frase *"Habita en el bienestar"* era "muy abstracta para Google Ads" (la gente que busca carpintería directa no clica en promesas esotéricas). La recomendación fue usar un H1 directo: "Diseño y Fabricación de Cocinas y Muebles a Medida: Directo de Fábrica en Bogotá."
- **Estado de Agosto:** Se adoptó "Diseña tu espacio. Habita el bienestar" como el **eslogan formal de marca (D1)**. Sin embargo, en el wireframe `contenido_F01_home.md`, se eligió un H1 funcional y descriptivo ("Carpintería arquitectónica. Diseñamos, fabricamos, instalamos.").
- **Conclusión de Ingeniería Inversa:** Se ha logrado conciliar exitosamente la necesidad de *Marketing de Respuesta Directa* (Ads) con la *Identidad de Marca*. El eslogan abstracto se mantiene como apoyo de posicionamiento (footer, hero subtext), pero se respeta la lección de Marzo de usar títulos descriptivos en el nivel H1 para retener el tráfico pago.

## 4. Listado de Negativas como Activo Inmediato (Acelerador de IA)

- El archivo importado `listado_negativas.md` (con decenas de términos bloqueados como DIY, usado, gratis, competencia, reparaciones) es un acelerador puro. 
- Cuando se llegue al **Bloque F (Ad manager agentivo)** del plan de demanda, el agente orquestador ya tiene un dataset pre-entrenado de exclusiones para proteger el presupuesto, evitando que la IA gaste días (y dinero) redescubriendo que "cocina de segunda mano" es un bad fit.

---
*Este análisis garantiza que las lecciones pagadas con el presupuesto de pauta de Marzo 2026 quedan integradas en las decisiones de negocio y de código de la V3.*
