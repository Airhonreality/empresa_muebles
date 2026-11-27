# 01 — Análisis de campañas Google Ads

Cada análisis vive en su propia subcarpeta con todo junto: reportes (.md) y CSV de export de la UI de Ads. No hay carpeta `csv/` aparte.

| Carpeta | Período | Cuenta de Ads | Contenido |
|---------|---------|---------------|-----------|
| `agosto_2026/` | 27-mar → 21-ago | **Veta Carp** (`9399973984`) | `DIAGNOSTICO_AGOSTO_2026.md`, `REPORTE_EJECUCION_Y_OPTIMIZACION_21_AGOSTO_2026.md`, `RELANZAMIENTO_29_AGOSTO_2026.md`, `LISTA_PALABRAS_NEGATIVAS_ROBUSTA_AGOSTO_2026.txt`, CSV de anuncios, términos de búsqueda, palabras clave, serie temporal |
| `marzo_2026/` | marzo 2026 | **Veta Carp** (`9399973984`) | `reporte_final_marzo_2026.md`, `analisis_retrospectivo_ads_marzo.md`, `listado_negativas.md`, `recomendaciones_web.md`, CSV de campaña, anuncio, palabras clave, términos de búsqueda |
| `2026-08-22_a_2026-11-25_Veta_Carp/` | 22-ago → 25-nov | **Veta Carp** (`9399973984`) | Exportación vía SDK: `informe_campañas_2026-08-22_a_2026-11-25.csv`, `informe_anuncios_2026-08-22_a_2026-11-25.csv`, `informe_terminos_busqueda_2026-08-22_a_2026-11-25.csv`, `informe_palabras_clave_2026-08-22_a_2026-11-25.csv` |

**Nota:** Ambos análisis históricos corresponden a la campaña principal de Veta Carp (cocinas/amoblamiento de la web de la empresa). La campaña de **Pisos Madera** (`9759491517`) aún no tiene análisis porque **no ha arrancado** (0 impresiones, 0 clics, sin entrega).

**Regla para nuevos análisis:** crear una subcarpeta nueva (ej. `semanal_YYYY-MM-DD/` o `YYYY-MM-DD_NombreCuenta/`) y meter dentro el reporte `.md` y los CSV que se usaron. Nunca crear una carpeta `csv/` suelta en la raíz de esta carpeta.

---

## Script de exportación automática (SDK de Google Ads)

Ubicación: `/home/airhon/Proyectos/empresa_muebles/scripts/exportar_informes_ads.py`
Wrapper: `/home/airhon/Proyectos/empresa_muebles/scripts/exportar_informes_ads.sh`

Extrae 4 informes de solo lectura (campañas, anuncios, términos de búsqueda, palabras clave) y los guarda como CSV en una carpeta nombrada `<fecha>_<nombre_cuenta>/` dentro de `01_analisis_campanas/`.

**Uso:**
```bash
# Exportar para Veta Carp con rango de fechas (trazabilidad desde el último análisis)
./scripts/exportar_informes_ads.sh 9399973984 2026-08-22 2026-11-25

# Exportar para Pisos Madera con rango de fechas
./scripts/exportar_informes_ads.sh 9759491517 2026-08-22 2026-11-25

# Sin fechas: usa los últimos 7 días (LAST_7_DAYS)
./scripts/exportar_informes_ads.sh 9399973984
```

Requisitos: credenciales `GOOGLE_ADS_*` exportadas desde Infisical a `.env.local` (ejecutado por el wrapper automáticamente).

---

## Protocolo de análisis semanal

Cada semana, crear carpeta `01_analisis_campanas/semanal_YYYY-MM-DD/` y seguir este orden:

### Paso 1 — Screenshot de estado general (UI de Google Ads)
Tomar capturas de pantalla de:
- Tabla de campañas: nombre, estado (ENABLED/PAUSED), presupuesto diario, tipo de estrategia de puja, estado de entrega (¿limitada por presupuesto?, ¿apagado?), cuota de impresiones.
- Últimos 15-20 días: días con $0 de gasto.
- Avisos o alertas de Google Ads (ej. cambios de algoritmo, limitaciones de presupuesto, anuncios en revisión).

### Paso 2 — Exportar CSV
Opción A: usar el script SDK (recomendado):
```bash
./scripts/exportar_informes_ads.sh 9399973984 2026-11-24
```
Opción B: exportar manualmente desde la UI de Google Ads y guardar en la carpeta semanal:
- `campañas_YYYY-MM-DD.csv`
- `anuncios_YYYY-MM-DD.csv`
- `terminos_busqueda_YYYY-MM-DD.csv`
- `palabras_clave_YYYY-MM-DD.csv`

### Paso 3 — Comparativa vs semana anterior
Llenar el template de reporte semanal con las métricas clave y su variación.

### Paso 4 — Revisión de términos de búsqueda (gasolina sucia)
Identificar términos que activaron anuncios pero no son tu nicho (ej. competencia, DIY, ciudades fuera de zona, nichos equivocados como "mesón"). Marcar cuáles agregar a negativas.

### Paso 5 — Revisión de Performance Max / "IA Max"
Confirmar si está activo, cuánto gastó, qué tipo de tráfico trae. Si no es tu nicho, pausarlo o excluirlo.

### Paso 6 — Registro de decisiones
Qué se pausó/activó, qué negativas se agregaron, qué cambios de presupuesto o CPA se hicieron, y la próxima acción.

---

## Plantilla de reporte semanal

Ver `analisis_semanal_TEMPLATE.md`.
