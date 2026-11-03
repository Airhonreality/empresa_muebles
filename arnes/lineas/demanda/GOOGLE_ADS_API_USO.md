# Uso de la Google Ads API para análisis de campañas — Línea de Demanda

Este documento explica cómo acceder a la Google Ads API desde el entorno de este proyecto, qué credenciales se usan, dónde está instalada la librería y cómo generar reportes de campañas. Está pensado para que cualquier agente del arnés pueda continuar sin tener que descubrirlo desde cero.

---

## 1. Dónde está instalada la librería

La librería oficial de Google Ads para Python (`google-ads`) no está instalada como dependencia de npm en el repo de Next.js. Está disponible en dos entornos virtuales de Python bajo `Agentic_Toolbox`:

| Entorno | Ruta del intérprete Python | Notas |
|---------|---------------------------|-------|
| `google_marketing_audit` | `/home/airhon/Agentic_Toolbox/google_marketing_audit/.venv/bin/python` | Entorno usado por la capacidad de auditoría semanal multiagente. Incluye `google-ads` SDK. |
| `google_ads` | `/home/airhon/Agentic_Toolbox/google_ads/.venv/bin/python` | Entorno dedicado a Google Ads. Incluye `google-ads` SDK. |

Para ejecutar scripts de Python que usen la API, usar cualquiera de estos intérpretes:

```bash
/home/airhon/Agentic_Toolbox/google_marketing_audit/.venv/bin/python tu_script.py
```

o

```bash
/home/airhon/Agentic_Toolbox/google_ads/.venv/bin/python tu_script.py
```

---

## 2. Credenciales necesarias (variables de entorno)

Las credenciales **no se commitean nunca**. Viven en Infisical (proyecto `d99dea9e-3a90-4df5-9e34-a1b117271c3b`, entorno `dev`) y se exportan al `.env.local` del repo de marca para usarlas localmente.

| Variable | Origen | Descripción |
|----------|--------|-------------|
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Infisical | Token de desarrollador de Google Ads |
| `GOOGLE_ADS_LOGIN_CUSTOMER_ID` | Infisical | ID de la cuenta de administrador (sin guiones) |
| `GOOGLE_ADS_CLIENT_ID` | Infisical | OAuth2 Client ID |
| `GOOGLE_ADS_CLIENT_SECRET` | Infisical | OAuth2 Client Secret |
| `GOOGLE_ADS_REFRESH_TOKEN` | Infisical | OAuth2 Refresh Token |
| `GOOGLE_ADS_ID_ACCOUNT_PISOS_MADERA` | Infisical | `975-949-1517` — cuenta hija de pisos de madera |
| `GOOGLE_ADS_ID_ACCOUNT_VDO_CARPINTERIA` | Infisical | `939-997-3984` — cuenta hija de carpintería VDO |

### Cómo exportar las credenciales a `.env.local`

```bash
# Desde el repo de marca
cd /home/airhon/Proyectos/empresa_muebles

infisical export --env dev --projectId d99dea9e-3a90-4df5-9e34-a1b117271c3b \
  --profile "airhonreality@gmail.com--airhon-fi-ep" \
  --output-file .env.local
```

Luego verificar que las variables `GOOGLE_ADS_*` estén presentes:

```bash
grep GOOGLE_ADS .env.local
```

---

## 3. Ejemplo de código para conectar a la API

El SDK oficial es `google.ads.googleads.client.GoogleAdsClient`. Ejemplo mínimo de conexión y lectura:

```python
import os
from google.ads.googleads.client import GoogleAdsClient

def build_client():
    config = {
        "developer_token": os.environ["GOOGLE_ADS_DEVELOPER_TOKEN"],
        "login_customer_id": os.environ["GOOGLE_ADS_LOGIN_CUSTOMER_ID"].replace("-", ""),
        "client_id": os.environ["GOOGLE_ADS_CLIENT_ID"],
        "client_secret": os.environ["GOOGLE_ADS_CLIENT_SECRET"],
        "refresh_token": os.environ["GOOGLE_ADS_REFRESH_TOKEN"],
        "use_proto_plus": True,
    }
    return GoogleAdsClient.load_from_dict(config)

client = build_client()
customer_id = "9759491517"  # sin guiones

ga_service = client.get_service("GoogleAdsService")
query = """
    SELECT campaign.id, campaign.name, campaign.status,
           metrics.cost_micros, metrics.clicks, metrics.impressions
    FROM campaign
    WHERE segments.date BETWEEN '2026-10-01' AND '2026-10-31'
"""
response = ga_service.search(customer_id=customer_id, query=query)
for row in response:
    print(row.campaign.name, row.metrics.clicks)
```

### Ejemplo de obtención de conversion label

```python
query = """
    SELECT conversion_action.id, conversion_action.name, conversion_action.status
    FROM conversion_action
    WHERE conversion_action.name = 'Contacto Pisos'
"""
response = ga_service.search(customer_id=customer_id, query=query)
for row in response:
    print(f"ID: {row.conversion_action.id}")
```

**Nota:** El `conversion_label` no es un campo consultable vía GAQL. Se obtiene solo desde la UI de Google Ads (Medición → Conversiones → Configuración de etiqueta).

---

## 4. Cuentas de Google Ads en este proyecto

| Cuenta | ID | Uso |
|--------|-----|-----|
| Pisos de Madera | `975-949-1517` | Campaña de búsqueda para restauración/pulido/reparación de pisos de madera en Bogotá. Campaña creada: `24429621538` (estado PAUSED). |
| VDO Carpintería | `939-997-3984` | Cuenta hija de carpintería Veta Dorada (no usada aún en esta línea). |

---

## 5. Reglas de operación (obligatorias)

1. **Ninguna escritura sin checkpoint explícito de Javier.** Crear campañas, cambiar presupuestos, pausar/activar o modificar pujas es plata real. Siempre requiere confirmación humana previa.
2. **Solo lectura por defecto.** Lectura de campañas, términos de búsqueda, métricas y conversion actions no requiere checkpoint, pero sí acceso a las credenciales.
3. **Nunca hardcodear credenciales.** Siempre leer desde variables de entorno (`.env.local` o Infisical).
4. **El `customer_id` en las consultas GAQL va sin guiones** (ej. `9759491517`, no `975-949-1517`).
5. **El `login_customer_id` también va sin guiones** en la configuración del cliente.

---

## 6. Qué se puede hacer con esta infraestructura

- **Lectura de rendimiento:** campañas, grupos de anuncios, anuncios, palabras clave, términos de búsqueda, métricas de clics/impresiones/costo/conversiones.
- **Auditoría de conversiones:** listar Conversion Actions, verificar estados, obtener IDs.
- **Creación de campañas/anuncios/palabras clave/negativas:** posible vía `mutate_campaigns`, `mutate_ad_groups`, `mutate_ad_group_ads`, `mutate_ad_group_criteria`, `mutate_campaign_criteria` — **requiere checkpoint de Javier**.
- **Subida de conversiones offline:** vía `conversionAdjustments:uploadClickConversions` (gclid/wbraid → Google Ads).
- **Generación de reportes:** extraer datos y procesarlos con agentes de análisis (como hace `google_marketing_audit`).

---

## 7. Archivos relacionados en el repo

| Archivo | Descripción |
|---------|-------------|
| `arnes/lineas/demanda/plan_demanda.md` | Plan estratégico de demanda, Bloque F (ad management agentivo) |
| `arnes/lineas/demanda/estado_demanda.md` | Estado actual, incluye R6 desbloqueada y credenciales en Infisical |
| `arnes/tareas/t-110.json` | Tarea de configuración de credenciales Google Ads (completada) |
| `arnes/tareas/t-190.json` | Tarea de creación campaña Pisos de Madera (completada, campaña ID 24429621538) |
| `scripts/crear_campana_sdk.py` | Script de creación de campaña usando el SDK |
| `scripts/crear_conversion_action.py` | Script de creación de Conversion Action |

---

## 8. Cómo iniciar una nueva sesión para reportes

1. Exportar credenciales de Infisical a `.env.local` (ver sección 2).
2. Usar el intérprete Python de `google_marketing_audit` o `google_ads`.
3. Conectar con `GoogleAdsClient.load_from_dict(config)`.
4. Ejecutar consultas GAQL contra `customer_id` `9759491517` (pisos de madera) o `9399973984` (VDO Carpintería).
5. Si se necesita escritura (crear campaña, cambiar puja, etc.), solicitar checkpoint explícito de Javier antes.
