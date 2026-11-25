#!/usr/bin/env python3
"""Extracción de solo lectura para el seguimiento de Google Ads (Veta Carp) y la base de producción.

Produce un JSON agregado en la carpeta de salida. NO incluye nombres, teléfonos ni correos:
solo métricas, términos de búsqueda agregados y conteos.

Uso (lo llama run.sh con las variables de .env.local cargadas):
    python3 extraer.py <carpeta_salida> <fecha_inicio> <fecha_fin>
"""
import json
import os
import sys
from datetime import date, timedelta

from google.ads.googleads.client import GoogleAdsClient

CUSTOMER = "9399973984"
CAMPAIGN_ID = "20773460137"


def client():
    return GoogleAdsClient.load_from_dict({
        "developer_token": os.environ["GOOGLE_ADS_DEVELOPER_TOKEN"],
        "login_customer_id": os.environ["GOOGLE_ADS_LOGIN_CUSTOMER_ID"].replace("-", ""),
        "client_id": os.environ["GOOGLE_AUTH_CLIENT_ID"],
        "client_secret": os.environ["GOOGLE_AUTH_CLIENT_SECRET"],
        "refresh_token": os.environ["GOOGLE_ADS_REFRESH_TOKEN"],
        "use_proto_plus": True,
    })


def main():
    out_dir, ini, fin = sys.argv[1], sys.argv[2], sys.argv[3]
    os.makedirs(out_dir, exist_ok=True)
    c = client()
    ga = c.get_service("GoogleAdsService")
    rango = f"BETWEEN '{ini}' AND '{fin}'"
    res = {"rango": [ini, fin], "generado": date.today().isoformat()}

    # 1) Métricas diarias de la campaña
    diario = []
    for r in ga.search(customer_id=CUSTOMER, query=f"""
        SELECT segments.date, metrics.impressions, metrics.clicks, metrics.cost_micros,
               metrics.conversions, metrics.search_impression_share
        FROM campaign WHERE campaign.id = {CAMPAIGN_ID} AND segments.date {rango}
        ORDER BY segments.date"""):
        diario.append({
            "fecha": r.segments.date,
            "impr": r.metrics.impressions,
            "clics": r.metrics.clicks,
            "gasto": round(r.metrics.cost_micros / 1e6),
            "conv": r.metrics.conversions,
        })
    res["diario"] = diario

    # 2) Términos de búsqueda agregados (sin fecha por fila)
    terminos = []
    for r in ga.search(customer_id=CUSTOMER, query=f"""
        SELECT search_term_view.search_term, metrics.impressions, metrics.clicks,
               metrics.cost_micros, metrics.conversions
        FROM search_term_view WHERE campaign.id = {CAMPAIGN_ID} AND segments.date {rango}
        AND metrics.impressions > 0"""):
        terminos.append({
            "termino": r.search_term_view.search_term,
            "impr": r.metrics.impressions,
            "clics": r.metrics.clicks,
            "gasto": round(r.metrics.cost_micros / 1e6),
            "conv": r.metrics.conversions,
        })
    res["terminos"] = sorted(terminos, key=lambda x: -x["gasto"])

    # 3) Calidad de palabras clave activas
    calidad = []
    for r in ga.search(customer_id=CUSTOMER, query=f"""
        SELECT ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type,
               ad_group_criterion.quality_info.quality_score,
               ad_group_criterion.quality_info.post_click_quality_score,
               ad_group_criterion.quality_info.creative_quality_score
        FROM ad_group_criterion
        WHERE campaign.id = {CAMPAIGN_ID} AND ad_group_criterion.type = 'KEYWORD'
        AND ad_group_criterion.status = 'ENABLED'"""):
        q = r.ad_group_criterion.quality_info
        calidad.append({
            "palabra": r.ad_group_criterion.keyword.text,
            "tipo": r.ad_group_criterion.keyword.match_type.name,
            "qs": q.quality_score,
            "landing": q.post_click_quality_score.name,
            "creativo": q.creative_quality_score.name,
        })
    res["calidad_palabras"] = calidad

    # 4) Estado de acciones de conversión
    acciones = []
    for r in ga.search(customer_id=CUSTOMER, query="""
        SELECT conversion_action.name, conversion_action.status, conversion_action.type,
               conversion_action.primary_for_goal
        FROM conversion_action WHERE conversion_action.status != 'REMOVED'"""):
        acciones.append({
            "nombre": r.conversion_action.name,
            "estado": r.conversion_action.status.name,
            "tipo": r.conversion_action.type_.name,
            "primaria": r.conversion_action.primary_for_goal,
        })
    res["acciones_conversion"] = acciones

    # 5) Conversiones por acción (incluye la offline, si ya se subió el CSV)
    por_accion = []
    for r in ga.search(customer_id=CUSTOMER, query=f"""
        SELECT segments.conversion_action_name, metrics.conversions, metrics.conversions_value
        FROM campaign WHERE campaign.id = {CAMPAIGN_ID} AND segments.date {rango}
        AND metrics.conversions > 0"""):
        por_accion.append({
            "accion": r.segments.conversion_action_name,
            "conv": r.metrics.conversions,
            "valor": r.metrics.conversions_value,
        })
    res["conversiones_por_accion"] = por_accion

    # 6) Configuración: estrategia de puja, negativas y ubicaciones
    cfg = list(ga.search(customer_id=CUSTOMER, query=f"""
        SELECT campaign.bidding_strategy_type, campaign.maximize_conversions.target_cpa_micros,
               campaign.ai_max_setting.enable_ai_max, campaign.status
        FROM campaign WHERE campaign.id = {CAMPAIGN_ID}"""))[0]
    res["configuracion"] = {
        "estado": cfg.campaign.status.name,
        "puja": cfg.campaign.bidding_strategy_type.name,
        "tcpa_micros": cfg.campaign.maximize_conversions.target_cpa_micros,
        "ia_max": cfg.campaign.ai_max_setting.enable_ai_max,
    }
    neg_kw = sum(1 for _ in ga.search(customer_id=CUSTOMER, query=f"""
        SELECT campaign_criterion.keyword.text FROM campaign_criterion
        WHERE campaign.id = {CAMPAIGN_ID} AND campaign_criterion.type = 'KEYWORD'
        AND campaign_criterion.negative = TRUE"""))
    neg_geo = sum(1 for _ in ga.search(customer_id=CUSTOMER, query=f"""
        SELECT campaign_criterion.location.geo_target_constant FROM campaign_criterion
        WHERE campaign.id = {CAMPAIGN_ID} AND campaign_criterion.type = 'LOCATION'
        AND campaign_criterion.negative = TRUE"""))
    res["configuracion"]["negativas_palabra"] = neg_kw
    res["configuracion"]["ubicaciones_negativas"] = neg_geo

    with open(os.path.join(out_dir, "datos_ads.json"), "w", encoding="utf-8") as f:
        json.dump(res, f, ensure_ascii=False, indent=1)
    print("OK datos_ads.json en", out_dir)


if __name__ == "__main__":
    main()
