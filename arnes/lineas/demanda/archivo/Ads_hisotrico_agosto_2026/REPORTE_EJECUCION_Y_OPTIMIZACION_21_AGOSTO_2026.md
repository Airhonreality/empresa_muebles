# 📋 REPORTE DE EJECUCIÓN Y OPTIMIZACIÓN DE CAMPAÑA — GOOGLE ADS
## Fecha de ejecución: 21 de Agosto de 2026
**Línea de trabajo:** Demanda / Ads  
**Estado:** ✅ Ajustes tácticos aplicados y validados en interfaz de Google Ads  

---

## 🎯 1. DIAGNÓSTICO DE LA CRISIS (¿Por qué se cayó el tráfico?)

En el análisis forense de la data histórica (27 marzo – 21 agosto 2026) se identificaron 3 causas fundamentales:

1. **Ruptura Algorítmica del 17 de Agosto (Smart Bidding Update):**  
   Google Ads endureció las reglas para campañas "limitadas por presupuesto". Al tener un presupuesto bajo ($8.500/día) y un CPA objetivo irreal ($6.500 COP vs un CPC de $1.120 COP), la IA de Google congeló la entrega en subastas clave para evitar sobrecostos, generando días enteros con $0 de gasto.
2. **Canibalización y Presupuesto "Desnutrido":**  
   Los $8.500 COP/día se dividían entre 2 grupos. El grupo de mueblería general (closets, centros de TV) consumía el 47.7% del presupuesto, dejando a Cocinas Integrales con solo el 25% de cuota de impresiones en Bogotá (perdiendo el 75% del mercado de alto ticket).
3. **Métrica de Conversión Ciega (Pérdida de GCLID):**  
   Google optimizaba para "clics en botón de WhatsApp" en la web legacy (`vetadeoro.co`), atrayendo curiosos y tráfico barato ("gasolina sucia") al no poder medir conversiones offline reales por la pérdida del identificador GCLID (Tarea H2).

---

## 🛠️ 2. ACCIONES TÁCTICAS EJECUTADAS HOY (21 de Agosto de 2026)

Se realizó una reestructuración completa de la campaña en vivo para reactivar el tráfico de cocinas de alto valor:

| Configuración | Estado Anterior | **Estado Nuevo (Aplicado y Validad)** | Objetivo |
|---|---|---|---|
| **Estructura de Grupos** | 2 Grupos activos | 🔴 **Pausado:** `Anuncios de Amoblamiento Integral`<br>🟢 **100% Activo:** `Cocinas integrales` | Eliminar dispersión y concentrar recursos en el producto de mayor margen (Cocinas). |
| **Presupuesto Diario** | $8.500 COP/día | 🟢 **$15.000,00 COP/día** | Dar volumen operativo suficiente para competir de igual a igual en Bogotá. |
| **CPA Objetivo (Campaña)** | ~$6.500 COP | 🟢 **$11.719 COP** | Dar oxígeno a la IA de Google para salir del congelamiento de subastas. |
| **CPA Objetivo (Grupo Cocinas)** | Variable | 🟢 **$15.000 COP** | Priorizar la puja en subastas de cocinas de alto valor. |
| **Anuncio Solo Llamada** | Activo (0 conv) | 🔴 **Pausado** | Eliminar gasto ineficiente. |
| **Filtro de Tráfico (Negativas)** | Incompleto | 🟢 **Lista Robusta Cargada** (`LISTA_PALABRAS_NEGATIVAS_ROBUSTA_AGOSTO_2026.txt`) | Filtrar competencia, búsquedas DIY, ciudades fuera de zona y gama baja. |

---

## 🛡️ 3. ESTRUCTURA DE LA LISTA DE PALABRAS NEGATIVAS APLICADA

Se creó y aplicó una lista anticipativa agrupada en 5 barreras de protección:
1. **Competencia y Grandes Superficies:** *Jamar, Sanicoc, Madesa, Cociarte, Amaderarte, Homecenter, Sodimac, Easy, Tugó, Ikea, Madecentro, Socoda, Alfa, Tecnicocinas, etc.*
2. **Bricolaje, Cursos y Trabajo:** *cómo hacer, cómo fabricar, tutorial, diy, planos, autocad, sketchup, curso, empleo, vacantes, sueldo, herramientas, mdf suelto, etc.*
3. **Bajo Precio y Usados:** *segunda mano, usado, remate, baratas, económicas, saldos, crédito, financiada, gas natural, subsidio.*
4. **Ciudades fuera de Cobertura:** *Ibagué, Valledupar, Jamundí, Montería, Pitalito, Duitama, Rionegro, Antioquia, Medellín, Cali, Barranquilla, Bucaramanga, Pereira, etc.*
5. **Accesorios y Electrodomésticos Sueltos:** *bisagras, rieles, manijas, platero suelto, grifería, lavaplatos suelto, estufa, campana, nevecón, etc.*

---

## 🚀 4. PROYECCIÓN Y PRÓXIMOS PASOS

### Impacto Esperado (Próximas 24-72 Horas):
- **Cuota de Impresiones en Cocinas:** Aumentará del **25% al ~65%+** en Bogotá.
- **Calidad de Lead:** Reducción drástica de chats basura o fuera de zona en WhatsApp.
- **Estabilidad:** Eliminación de los "días $0" causados por la restricción de Smart Bidding.

### Hoja de Ruta de Desarrollo (Paralelo V3):
- **Implementar Bloque A (`useGclidCapture` + `leads` DB):** Conectar la web V3 para registrar el GCLID en los envíos de formulario y habilitar la importación de conversiones offline en Google Ads, cerrando el ciclo de optimización hacia **ventas cerradas real de cocinas**.

---
*Documento consolidado en `arnes/lineas/demanda/archivo/Ads_hisotrico_agosto_2026/REPORTE_EJECUCION_Y_OPTIMIZACION_21_AGOSTO_2026.md`.*
