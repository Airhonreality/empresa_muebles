#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Diagnóstico de solo lectura de la campaña Google Ads "Pisos de Madera".
NO modifica nada en la cuenta. Solo consulta estado de campañas, anuncios,
palabras clave y métricas para saber por qué no arranca.
Ejecución: /home/airhon/Agentic_Toolbox/google_ads/.venv/bin/python diagnosticar_campana_pisos.py
Requiere que GOOGLE_ADS_* estén en el entorno (exportadas desde Infisical).
"""

import os
from datetime import datetime, timedelta
from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException

CUENTA_PISOS_MADERA = "975-949-1517"
CUSTOMER_ID = CUENTA_PISOS_MADERA.replace("-", "")


def build_client():
    config = {
        "developer_token": os.environ["GOOGLE_ADS_DEVELOPER_TOKEN"],
        "login_customer_id": os.environ["GOOGLE_ADS_LOGIN_CUSTOMER_ID"].replace("-", ""),
        "client_id": os.environ["GOOGLE_AUTH_CLIENT_ID"],
        "client_secret": os.environ["GOOGLE_AUTH_CLIENT_SECRET"],
        "refresh_token": os.environ["GOOGLE_ADS_REFRESH_TOKEN"],
        "use_proto_plus": True,
    }
    return GoogleAdsClient.load_from_dict(config)


def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")


def buscar(client, query, customer_id=CUSTOMER_ID):
    ga = client.get_service("GoogleAdsService")
    response = ga.search(customer_id=customer_id, query=query)
    return list(response)


def obtener_ids_campanas_pisos(client, customer_id=CUSTOMER_ID):
    """Devuelve lista de (id, nombre) de campañas cuyo nombre contenga 'Pisos de Madera'."""
    rows = buscar(client, """
        SELECT campaign.id, campaign.name
        FROM campaign
        WHERE campaign.name LIKE '%Pisos de Madera%'
    """)
    return [(r.campaign.id, r.campaign.name) for r in rows]


def main():
    client = build_client()
    log(f"Consultando cuenta {CUENTA_PISOS_MADERA} ({CUSTOMER_ID})")

    campanas = obtener_ids_campanas_pisos(client)
    if not campanas:
        log("No se encontraron campañas de Pisos de Madera.")
        return

    # 1. Campañas de la cuenta
    log("\n=== CAMPAÑAS ===")
    for camp_id, camp_nombre in campanas:
        rows = buscar(client, f"""
            SELECT campaign.id, campaign.name, campaign.status, campaign.serving_status,
                   campaign_budget.amount_micros,
                   metrics.impressions, metrics.clicks, metrics.cost_micros
            FROM campaign
            WHERE campaign.id = {camp_id}
              AND segments.date DURING LAST_7_DAYS
        """)
        for r in rows:
            print(f"  ID={r.campaign.id} | {r.campaign.name}")
            print(f"    status={r.campaign.status.name} | serving_status={r.campaign.serving_status.name}")
            print(f"    impresiones={r.metrics.impressions} | clics={r.metrics.clicks} | costo={r.metrics.cost_micros / 1_000_000:.2f} COP")

    # 2. Anuncios de las campañas de pisos
    log("\n=== ANUNCIOS (RSA) ===")
    for camp_id, camp_nombre in campanas:
        rows = buscar(client, f"""
            SELECT ad_group_ad.ad.id, ad_group_ad.ad.responsive_search_ad.headlines,
                   ad_group_ad.status, ad_group_ad.policy_summary.approval_status,
                   ad_group.id, ad_group.name
            FROM ad_group_ad
            WHERE campaign.id = {camp_id}
        """)
        for r in rows:
            titulos = r.ad_group_ad.ad.responsive_search_ad.headlines
            titulo = titulos[0].text if titulos else "(sin título)"
            print(f"  Campaña={camp_id} ({camp_nombre}) | Grupo={r.ad_group.id} ({r.ad_group.name})")
            print(f"    AdID={r.ad_group_ad.ad.id} | {titulo[:60]}")
            print(f"    status={r.ad_group_ad.status.name} | approval={r.ad_group_ad.policy_summary.approval_status.name}")

    # 3. Palabras clave
    log("\n=== PALABRAS CLAVE ===")
    for camp_id, camp_nombre in campanas:
        rows = buscar(client, f"""
            SELECT ad_group_criterion.criterion_id, ad_group_criterion.keyword.text,
                   ad_group_criterion.keyword.match_type, ad_group_criterion.status,
                   ad_group_criterion.quality_info.quality_score,
                   ad_group.id, ad_group.name
            FROM ad_group_criterion
            WHERE campaign.id = {camp_id}
              AND ad_group_criterion.type = KEYWORD
        """)
        for r in rows:
            qscore = r.ad_group_criterion.quality_info.quality_score if r.ad_group_criterion.quality_info else "-"
            print(f"  Campaña={camp_id} | Grupo={r.ad_group.id} ({r.ad_group.name})")
            print(f"    '{r.ad_group_criterion.keyword.text}' | {r.ad_group_criterion.keyword.match_type.name}")
            print(f"    status={r.ad_group_criterion.status.name} | calidad={qscore}")

    # 4. Negativas a nivel de campaña
    log("\n=== NEGATIVAS (CAMPAÑA) ===")
    for camp_id, camp_nombre in campanas:
        rows = buscar(client, f"""
            SELECT campaign_criterion.keyword.text, campaign_criterion.keyword.match_type,
                   campaign_criterion.status
            FROM campaign_criterion
            WHERE campaign.id = {camp_id}
              AND campaign_criterion.negative = TRUE
            LIMIT 50
        """)
        for r in rows:
            print(f"  Campaña={camp_id} | - '{r.campaign_criterion.keyword.text}' ({r.campaign_criterion.keyword.match_type.name}) | {r.campaign_criterion.status.name}")

    log("\nFin del diagnóstico de solo lectura.")


if __name__ == "__main__":
    try:
        main()
    except GoogleAdsException as e:
        print(f"Error de Google Ads: {e}")
        for error in e.failure.errors:
            print(f"  - {error.error_code}: {error.message}")
    except KeyError as e:
        print(f"Falta variable de entorno: {e}. Exporta primero desde Infisical.")
