#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Exportar informes completos de Google Ads vía SDK (solo lectura).
Genera una carpeta por análisis: 01_analisis_campanas/<fecha>_<nombre_cuenta>/
con 4 CSV: campañas, anuncios, términos de búsqueda, palabras clave.

Uso:
    /home/airhon/Agentic_Toolbox/google_ads/.venv/bin/python exportar_informes_ads.py <customer_id> [fecha]

Ejemplo:
    /home/airhon/Agentic_Toolbox/google_ads/.venv/bin/python exportar_informes_ads.py 9399973984 2026-11-24

Requiere que las variables GOOGLE_ADS_* estén en el entorno (exportadas desde Infisical a .env.local).
"""

import csv
import os
import sys
from datetime import datetime
from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException

LOGIN_CUSTOMER_ID = os.environ["GOOGLE_ADS_LOGIN_CUSTOMER_ID"].replace("-", "")

# Mapeo de IDs conocidos a nombres legibles (se puede ampliar)
NOMBRE_CUENTA = {
    "8554149890": "Airhon_Agency_MCC",
    "9399973984": "Veta_Carp",
    "9759491517": "Pisos_Madera",
    "6104728129": "Amparo_correcciones",
}


def build_client():
    config = {
        "developer_token": os.environ["GOOGLE_ADS_DEVELOPER_TOKEN"],
        "login_customer_id": LOGIN_CUSTOMER_ID,
        "client_id": os.environ["GOOGLE_AUTH_CLIENT_ID"],
        "client_secret": os.environ["GOOGLE_AUTH_CLIENT_SECRET"],
        "refresh_token": os.environ["GOOGLE_ADS_REFRESH_TOKEN"],
        "use_proto_plus": True,
    }
    return GoogleAdsClient.load_from_dict(config)


def obtener_nombre_cuenta(client, customer_id):
    """Intenta obtener el nombre descriptivo de la cuenta desde la API."""
    if customer_id in NOMBRE_CUENTA:
        return NOMBRE_CUENTA[customer_id]
    try:
        ga = client.get_service("GoogleAdsService")
        query = f"""
            SELECT customer.descriptive_name
            FROM customer
            WHERE customer.id = {customer_id}
        """
        response = ga.search(customer_id=LOGIN_CUSTOMER_ID, query=query)
        for row in response:
            return row.customer.descriptive_name.replace(" ", "_") or customer_id
    except Exception:
        return customer_id
    return customer_id


def ejecutar_consulta(client, customer_id, query):
    ga = client.get_service("GoogleAdsService")
    response = ga.search(customer_id=customer_id, query=query)
    return list(response)


def fila_a_dict(row, campos):
    """Convierte una fila proto-plus a dict plano para CSV."""
    resultado = {}
    for campo in campos:
        partes = campo.split(".")
        valor = row
        try:
            for parte in partes:
                valor = getattr(valor, parte)
            # Si es un mensaje repetido (lista), convertir a string
            if hasattr(valor, "__iter__") and not isinstance(valor, (str, int, float, bool)):
                try:
                    valor = ", ".join(str(v) for v in valor)
                except Exception:
                    valor = str(valor)
            elif hasattr(valor, "name"):  # enum
                valor = valor.name
            elif valor is None:
                valor = ""
        except Exception:
            valor = ""
        resultado[campo] = valor
    return resultado


def escribir_csv(ruta, campos, filas):
    with open(ruta, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=campos, extrasaction="ignore")
        writer.writeheader()
        for fila in filas:
            writer.writerow(fila_a_dict(fila, campos))


def main():
    if len(sys.argv) < 2:
        print("Uso: exportar_informes_ads.py <customer_id> [fecha_inicio] [fecha_fin]")
        print("Ejemplo: exportar_informes_ads.py 9399973984 2026-08-22 2026-11-25")
        print("  Si no se indican fechas, se usan los últimos 7 días (LAST_7_DAYS).")
        sys.exit(1)

    customer_id = sys.argv[1].replace("-", "")
    fecha_inicio = sys.argv[2] if len(sys.argv) > 2 else None
    fecha_fin = sys.argv[3] if len(sys.argv) > 3 else None

    # Construir cláusula de fechas para GAQL
    if fecha_inicio and fecha_fin:
        fecha_clausula = f"segments.date BETWEEN '{fecha_inicio}' AND '{fecha_fin}'"
        etiqueta_fecha = f"{fecha_inicio}_a_{fecha_fin}"
    else:
        fecha_clausula = "segments.date DURING LAST_7_DAYS"
        etiqueta_fecha = datetime.now().strftime("%Y-%m-%d")

    client = build_client()
    nombre_cuenta = obtener_nombre_cuenta(client, customer_id)

    carpeta = f"/home/airhon/Proyectos/empresa_muebles/arnes/lineas/demanda/01_analisis_campanas/{etiqueta_fecha}_{nombre_cuenta}"
    os.makedirs(carpeta, exist_ok=True)
    print(f"Carpeta de salida: {carpeta}")
    print(f"Rango de fechas: {fecha_clausula}")

    # 1. Informe de campañas
    query_campanas = f"""
        SELECT
            campaign.id,
            campaign.name,
            campaign.status,
            campaign.serving_status,
            campaign_budget.amount_micros,
            campaign.optimization_score,
            campaign.advertising_channel_type,
            segments.date,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.ctr,
            metrics.average_cpc,
            metrics.conversions,
            metrics.cost_per_conversion,
            metrics.search_impression_share
        FROM campaign
        WHERE {fecha_clausula}
    """
    filas_campanas = ejecutar_consulta(client, customer_id, query_campanas)
    campos_campanas = [
        "campaign.id", "campaign.name", "campaign.status", "campaign.serving_status",
        "campaign_budget.amount_micros", "campaign.optimization_score",
        "campaign.advertising_channel_type", "segments.date",
        "metrics.impressions", "metrics.clicks", "metrics.cost_micros",
        "metrics.ctr", "metrics.average_cpc", "metrics.conversions",
        "metrics.cost_per_conversion", "metrics.search_impression_share",
    ]
    escribir_csv(
        f"{carpeta}/informe_campañas_{etiqueta_fecha}.csv",
        campos_campanas,
        filas_campanas,
    )
    print(f"  Campañas: {len(filas_campanas)} filas")

    # 2. Informe de anuncios
    query_anuncios = f"""
        SELECT
            ad_group_ad.ad.id,
            ad_group_ad.ad.responsive_search_ad.headlines,
            ad_group_ad.ad.responsive_search_ad.descriptions,
            ad_group_ad.status,
            ad_group_ad.policy_summary.approval_status,
            campaign.id,
            ad_group.id,
            ad_group.name,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.ctr,
            metrics.average_cpc,
            metrics.conversions,
            metrics.cost_per_conversion
        FROM ad_group_ad
        WHERE {fecha_clausula}
    """
    filas_anuncios = ejecutar_consulta(client, customer_id, query_anuncios)
    campos_anuncios = [
        "ad_group_ad.ad.id", "ad_group_ad.ad.responsive_search_ad.headlines",
        "ad_group_ad.ad.responsive_search_ad.descriptions", "ad_group_ad.status",
        "ad_group_ad.policy_summary.approval_status", "campaign.id",
        "ad_group.id", "ad_group.name", "metrics.impressions", "metrics.clicks",
        "metrics.cost_micros", "metrics.ctr", "metrics.average_cpc",
        "metrics.conversions", "metrics.cost_per_conversion",
    ]
    escribir_csv(
        f"{carpeta}/informe_anuncios_{etiqueta_fecha}.csv",
        campos_anuncios,
        filas_anuncios,
    )
    print(f"  Anuncios: {len(filas_anuncios)} filas")

    # 3. Informe de términos de búsqueda
    query_terminos = f"""
        SELECT
            search_term_view.search_term,
            ad_group.name,
            campaign.id,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.ctr,
            metrics.average_cpc,
            metrics.conversions,
            metrics.cost_per_conversion
        FROM search_term_view
        WHERE {fecha_clausula}
    """
    filas_terminos = ejecutar_consulta(client, customer_id, query_terminos)
    campos_terminos = [
        "search_term_view.search_term", "ad_group.name", "campaign.id",
        "metrics.impressions", "metrics.clicks", "metrics.cost_micros",
        "metrics.ctr", "metrics.average_cpc", "metrics.conversions",
        "metrics.cost_per_conversion",
    ]
    escribir_csv(
        f"{carpeta}/informe_terminos_busqueda_{etiqueta_fecha}.csv",
        campos_terminos,
        filas_terminos,
    )
    print(f"  Términos de búsqueda: {len(filas_terminos)} filas")

    # 4. Informe de palabras clave (datos estructurales; métricas por palabra clave
    #    se consultan desde la UI de Google Ads al no ser compatibles con el recurso
    #    ad_group_criterion en esta versión de la API)
    query_palabras = f"""
        SELECT
            ad_group_criterion.criterion_id,
            ad_group_criterion.keyword.text,
            ad_group_criterion.keyword.match_type,
            ad_group_criterion.status,
            campaign.id,
            ad_group.name
        FROM ad_group_criterion
        WHERE ad_group_criterion.type = KEYWORD
    """
    filas_palabras = ejecutar_consulta(client, customer_id, query_palabras)
    campos_palabras = [
        "ad_group_criterion.criterion_id",
        "ad_group_criterion.keyword.text",
        "ad_group_criterion.keyword.match_type",
        "ad_group_criterion.status",
        "campaign.id", "ad_group.name",
    ]
    escribir_csv(
        f"{carpeta}/informe_palabras_clave_{etiqueta_fecha}.csv",
        campos_palabras,
        filas_palabras,
    )
    print(f"  Palabras clave: {len(filas_palabras)} filas")

    print(f"\nExportación completa para cuenta {customer_id} ({nombre_cuenta}).")


if __name__ == "__main__":
    try:
        main()
    except GoogleAdsException as e:
        print(f"Error de Google Ads: {e}")
        for error in e.failure.errors:
            print(f"  - {error.error_code}: {error.message}")
        sys.exit(1)
    except KeyError as e:
        print(f"Falta variable de entorno: {e}. Exporta primero desde Infisical.")
        sys.exit(1)
