#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Creación de campaña Google Ads — Pisos de Madera (Búsqueda, Bogotá).
Usa el SDK oficial google-ads (v26) del venv de Agentic_Toolbox.
Credenciales desde .env del repo de marca.
Ejecución: .venv/bin/python crear_campana_sdk.py
"""

import os
import uuid
from datetime import datetime
from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException

CUENTA_PISOS_MADERA = "975-949-1517"
CUSTOMER_ID_CLEAN = CUENTA_PISOS_MADERA.replace("-", "")
LOGIN_CUSTOMER_ID = os.environ.get("GOOGLE_ADS_LOGIN_CUSTOMER_ID", "8554149890").replace("-", "")

PRESUPUESTO_DIARIO_MICROS = 5_000_000_000
CPC_LIMITE_MICROS = 1_500_000_000
LANDING_PISOS = "https://www.vetadorada.co/espacios/pisos-de-madera"
NOMBRE_CAMPANA = f"Búsqueda – Pisos de Madera – Bogotá {uuid.uuid4().hex[:8]}"

PALABRAS_CLAVE = [
    ("Restauración", '"restauración de pisos de madera"', "FRASE"),
    ("Restauración", '"restauración pisos de madera bogotá"', "FRASE"),
    ("Restauración", '"restaurar piso de madera"', "FRASE"),
    ("Restauración", '[restauración de pisos de madera bogotá]', "EXACTA"),
    ("Pulido y Barnizado", '"pulido de pisos de madera"', "FRASE"),
    ("Pulido y Barnizado", '"pulido de pisos de madera bogotá"', "FRASE"),
    ("Pulido y Barnizado", '"barnizar piso de madera"', "FRASE"),
    ("Pulido y Barnizado", '"lijado y barnizado de pisos"', "FRASE"),
    ("Pulido y Barnizado", '[pulido de pisos de madera bogotá]', "EXACTA"),
    ("Reparación", '"reparación de pisos de madera"', "FRASE"),
    ("Reparación", '"reparación piso de madera bogotá"', "FRASE"),
    ("Reparación", '"reparar piso de madera"', "FRASE"),
    ("Reparación", '"arreglar piso de madera"', "FRASE"),
    ("Reparación", '[reparación de pisos de madera bogotá]', "EXACTA"),
]

NEGATIVAS = [
    "instalación", "instalacion", "instalar", "instalador",
    "piso nuevo", "pisos nuevos", "venta", "vender", "comprar", "compra",
    "lámina", "lamina", "laminado", "flotante", "sintético", "sintetico",
    "vinílico", "vinilico", "porcelanato", "cerámica", "deck", "exterior",
    "madera plástica", "madera plastica", "proveedor", "distribuidor",
    "fábrica", "fabrica", "mayorista",
    "barniz", "barnices", "laca", "lacas", "aceite para madera",
    "tinta para madera", "sellador", "selladores", "pegamento", "cola",
    "cera", "limpiador", "limpiadores", "producto", "productos",
    "gratis", "gratuito", "gratuita", "sin costo", "barato", "casero",
    "diy", "hacerlo uno mismo", "tutorial", "tutoriales", "curso",
    "cursos", "aprender", "pdf", "descargar",
    "empleo", "empleos", "trabajo", "trabajos", "vacante", "vacantes",
    "contratar", "contratación", "contratacion", "hoja de vida",
    "curriculum", "cv", "sueldo", "salario",
    "alquiler", "arriendo", "arrendar", "alquilar", "renta", "rentar",
    "inmobiliaria", "inmueble", "inmuebles", "apartamento en venta",
    "casa en venta", "finca raíz", "finca raiz",
    "epóxico", "epoxico", "epoxi", "concreto", "cemento",
    "pulido de concreto", "pulido de cemento", "mármol", "marmol",
    "granito", "gres", "baldosa", "baldosas", "alfombra", "alfombras",
    "moqueta", "microcemento", "muebles", "puertas", "ventanas",
    "closets", "cocina integral", "escaleras", "barandales", "pasamanos",
    "tarima", "tarimas", "repisa", "repisas",
    "medellín", "medellin", "cali", "barranquilla", "cartagena",
    "bucaramanga", "cúcuta", "cucuta", "pereira", "manizales",
    "santa marta", "villavicencio", "ibagué", "ibague", "neiva",
    "pasto", "armenia", "montería", "monteria",
]

NEGATIVAS_FRASE = [
    '"sin madera"', '"falso"', '"falsa"', '"imitación"', '"imitacion"',
    '"simil madera"', '"parecido a madera"',
    '"piso pvc"', '"piso vinílico"', '"piso vinilo"', '"piso laminado"',
    '"piso flotante"', '"piso sintético"', '"piso de goma"', '"piso de caucho"',
    '"piso LVT"', '"piso SPC"', '"piso WPC"', '"piso de bambú"',
    '"piso autoadherible"', '"piso adhesivo"', '"piso en rollo"',
    '"piso porcelanato"', '"piso cerámica"', '"piso de mármol"',
    '"piso de granito"', '"piso epóxico"', '"piso de concreto"',
    '"piso pulido de cemento"', '"microcemento para piso"', '"piso de exterior"',
    '"deck de madera"', '"piso para garaje"', '"piso para baño"',
    '"piso para cocina"', '"piso industrial"', '"piso deportivo"',
    '"piso para gimnasio"',
    '"comprar piso"', '"venta de piso"', '"precio de piso"', '"precio por metro"',
    '"lámina para piso"', '"tabla para piso"', '"rollo de piso"', '"caja de piso"',
    '"piso al por mayor"', '"distribuidor de pisos"', '"fábrica de pisos"',
    '"proveedor de pisos"', '"piso barato"', '"piso económico"',
    '"piso en oferta"', '"piso segunda mano"', '"piso usado"',
    '"piso de remate"', '"muestra de piso"', '"catálogo de pisos"',
    '"cómo instalar piso"', '"cómo poner piso"', '"cómo reparar piso"',
    '"cómo restaurar piso"', '"cómo pulir piso"', '"cómo lijar piso"',
    '"cómo barnizar piso"', '"hacer uno mismo"', '"paso a paso para"',
    '"tutorial de piso"', '"guía para instalar"', '"aprender a instalar"',
    '"curso de pisos"', '"qué es un piso"', '"ventajas de piso"',
    '"desventajas de piso"', '"opiniones de piso"', '"vale la pena piso"',
    '"trabajo de instalador"', '"empleo para pisos"', '"vacante de piso"',
    '"sueldo de instalador"', '"cómo ser instalador"', '"curso de instalación"',
    '"certificación de pisos"', '"limpieza de pisos"', '"encerado de pisos"',
    '"abrillantado de pisos"', '"lavado de pisos"', '"desmanchado de pisos"',
    '"fumigación para pisos"',
    '"pisos"', '"piso"', '"suelos"', '"revestimiento"', '"decoración de pisos"',
    '"tendencia de pisos"', '"tipos de pisos"', '"modelos de pisos"',
    '"colores de pisos"', '"pisos modernos"', '"pisos elegantes"',
]

RSAS = [
    {
        "grupo": "Restauración",
        "nombre": "RSA 1 – Restauración – Servicio + oferta",
        "titulos": [
            "Restauración de Pisos Madera", "Diagnóstico Sin Costo Bogotá",
            "Conservamos su Piso Original", "Casas, Oficinas y Locales",
            "Acabados de Bajo VOC", "Solicite su Visita Técnica",
            "Sin Reemplazar su Piso", "Bogotá y Alrededores",
            "Restauramos su Piso Madera", "Recupere su Piso Original",
            "Visita Sin Costo", "Expertos en Pisos de Madera",
            "Pida su Diagnóstico Gratis", "Pisos de Madera Como Nuevos",
            "Conserve su Piso de Madera",
        ],
        "descripciones": [
            "Restauramos pisos de madera en cualquier espacio. Diagnóstico sin costo y sin compromiso.",
            "Pulido, reparación y sellado con acabados de bajo VOC. Conservamos la madera original.",
            "Casas, apartamentos, oficinas y locales en Bogotá. Solicite su visita técnica hoy.",
            "Devolvemos la vida a su piso de madera sin reemplazarlo. Diagnóstico gratuito en Bogotá.",
        ],
        "titulo_fijado": "Restauración de Pisos Madera",
    },
    {
        "grupo": "Restauración",
        "nombre": "RSA 2 – Restauración – Beneficio + confianza",
        "titulos": [
            "Restauración Pisos de Madera", "Su Piso de Madera Como Nuevo",
            "Diagnóstico Gratis Bogotá", "No Reemplace, Restaure",
            "Acabados al Agua Bajo VOC", "Atendemos Todo Tipo Espacio",
            "Contacto por WhatsApp", "Pida Presupuesto",
            "Pida Diagnóstico Gratis", "Pisos de Madera Restaurados",
            "Conservación Madera Original", "Bogotá · Diagnóstico Gratis",
            "Llame o Escriba por WhatsApp", "Servicio Profesional Bogotá",
            "Expertos en Restauración",
        ],
        "descripciones": [
            "Restauración profesional de pisos de madera en Bogotá. Diagnóstico sin costo.",
            "Conservamos y protegemos su piso de madera. Acabados de bajo VOC y sin reemplazo.",
            "Atendemos casas, apartamentos, oficinas y locales. Solicite su visita técnica.",
            "Recupere la belleza de su piso de madera. Contacto directo por WhatsApp.",
        ],
        "titulo_fijado": "Restauración Pisos de Madera",
    },
    {
        "grupo": "Pulido y Barnizado",
        "nombre": "RSA 1 – Pulido y Barnizado – Servicio + oferta",
        "titulos": [
            "Pulido de Pisos de Madera", "Lijado y Barnizado",
            "Recupere el Brillo Original", "Bogotá · Diagnóstico Gratis",
            "Acabados al Agua Bajo VOC", "Casas, Apartamentos, Locales",
            "Pulido Sin Reemplazar Piso", "Solicite su Visita Técnica",
            "Barnizado Profesional Bogotá", "Pida su Diagnóstico Gratis",
            "Pisos de Madera Como Nuevos", "Expertos en Pulido de Madera",
            "Bogotá y Alrededores", "Contacto WhatsApp Directo",
            "Presupuesto Sin Compromiso",
        ],
        "descripciones": [
            "Pulido y barnizado profesional de pisos de madera en Bogotá. Diagnóstico sin costo.",
            "Recupere el brillo y la protección de su piso. Acabados de bajo VOC.",
            "Atendemos casas, apartamentos, oficinas y locales. Solicite su visita técnica.",
            "Lijado, pulido y sellado con productos de bajo VOC. Contacto directo por WhatsApp.",
        ],
        "titulo_fijado": "Pulido de Pisos de Madera",
    },
    {
        "grupo": "Pulido y Barnizado",
        "nombre": "RSA 2 – Pulido y Barnizado – Beneficio + confianza",
        "titulos": [
            "Pulido Pisos de Madera Bogotá", "Barnizado y Sellado",
            "Deje su Piso Como Nuevo", "Diagnóstico Gratis Bogotá",
            "Acabados de Bajo VOC", "Todo Tipo de Espacios",
            "Solicite Visita Técnica", "Recupere su Piso de Madera",
            "Sin Reemplazar su Piso", "Bogotá y Alrededores",
            "Presupuesto Sin Compromiso", "Expertos en Madera",
            "Pida su Diagnóstico Hoy", "Contacto por WhatsApp",
            "Servicio Profesional",
        ],
        "descripciones": [
            "Pulido, lijado y barnizado de pisos de madera. Diagnóstico sin costo en Bogotá.",
            "Acabados al agua y poliuretano de bajo VOC. Proteja su piso sin reemplazarlo.",
            "Casas, apartamentos, oficinas y locales. Solicite su visita técnica hoy.",
            "Recupere el brillo de su piso de madera. Contacto directo por WhatsApp.",
        ],
        "titulo_fijado": "Pulido Pisos de Madera Bogotá",
    },
    {
        "grupo": "Reparación",
        "nombre": "RSA 1 – Reparación – Problema + solución",
        "titulos": [
            "Reparación de Pisos de Madera", "Piezas Sueltas y Desgaste",
            "Arreglamos Sin Reemplazar", "Visita Técnica Sin Costo",
            "Bogotá y Alrededores", "Diagnóstico Gratis Bogotá",
            "Reparamos su Piso de Madera", "Piezas Sueltas o Ruidosas",
            "Humedad y Manchas", "Solicite su Diagnóstico",
            "Contacto WhatsApp Directo", "Expertos en Reparación",
            "Presupuesto Sin Compromiso", "Casas, Oficinas y Locales",
            "Su Piso de Madera Como Nuevo",
        ],
        "descripciones": [
            "Reparación de pisos de madera en Bogotá. Diagnóstico sin costo y sin compromiso.",
            "Reparamos piezas sueltas, desgaste, humedad y manchas. Sin reemplazar su piso.",
            "Atendemos casas, apartamentos, oficinas y locales. Solicite su visita técnica.",
            "Arreglamos su piso de madera sin reemplazarlo. Contacto directo por WhatsApp.",
        ],
        "titulo_fijado": "Reparación de Pisos de Madera",
    },
    {
        "grupo": "Reparación",
        "nombre": "RSA 2 – Reparación – Beneficio + confianza",
        "titulos": [
            "Reparación Pisos Madera Bogotá", "Piso de Madera con Problemas",
            "Reparamos Sin Reemplazar", "Diagnóstico Sin Costo",
            "Visita Técnica en Bogotá", "Piezas Sueltas y Ruidos",
            "Humedad, Manchas, Desgaste", "Solicite su Visita Técnica",
            "Bogotá y Alrededores", "Expertos en Reparación",
            "Contacto por WhatsApp", "Presupuesto Sin Compromiso",
            "Su Piso Como Nuevo", "Atención Profesional",
            "Pida su Diagnóstico Hoy",
        ],
        "descripciones": [
            "Reparamos su piso de madera sin reemplazarlo. Diagnóstico gratis en Bogotá.",
            "Solucionamos piezas sueltas, desgaste, humedad y manchas. Visita sin costo.",
            "Casas, apartamentos, oficinas y locales. Solicite su visita técnica hoy.",
            "Reparación profesional de pisos de madera. Contacto directo por WhatsApp.",
        ],
        "titulo_fijado": "Reparación Pisos Madera Bogotá",
    },
]


def build_client():
    config = {
        "developer_token": os.environ["GOOGLE_ADS_DEVELOPER_TOKEN"],
        "login_customer_id": LOGIN_CUSTOMER_ID,
        "client_id": os.environ["GOOGLE_ADS_CLIENT_ID"],
        "client_secret": os.environ["GOOGLE_ADS_CLIENT_SECRET"],
        "refresh_token": os.environ["GOOGLE_ADS_REFRESH_TOKEN"],
        "use_proto_plus": True,
    }
    return GoogleAdsClient.load_from_dict(config)


def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")


def main():
    env_path = "/home/airhon/Proyectos/empresa_muebles/.env"
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, _, val = line.partition("=")
                    val = val.strip().strip("'").strip('"')
                    os.environ[key.strip()] = val

    client = build_client()
    customer_id = CUSTOMER_ID_CLEAN

    log(f"Cuenta: {CUENTA_PISOS_MADERA} ({customer_id})")

    # 1. Presupuesto
    log("Creando presupuesto...")
    op = client.get_type("CampaignBudgetOperation")
    cb = op.create
    cb.name = f"Presupuesto {NOMBRE_CAMPANA} {uuid.uuid4().hex[:8]}"
    cb.amount_micros = PRESUPUESTO_DIARIO_MICROS
    cb.delivery_method = client.enums.BudgetDeliveryMethodEnum.STANDARD

    service = client.get_service("CampaignBudgetService")
    resp = service.mutate_campaign_budgets(customer_id=customer_id, operations=[op])
    presupuesto_rn = resp.results[0].resource_name
    log(f"  Presupuesto: {presupuesto_rn}")

    # 2. Campaña
    log("Creando campaña...")
    op = client.get_type("CampaignOperation")
    c = op.create
    c.name = NOMBRE_CAMPANA
    c.status = client.enums.CampaignStatusEnum.PAUSED
    c.advertising_channel_type = client.enums.AdvertisingChannelTypeEnum.SEARCH
    c.campaign_budget = presupuesto_rn
    c.network_settings.target_google_search = True
    c.network_settings.target_search_network = False
    c.network_settings.target_content_network = False
    c.network_settings.target_partner_search_network = False
    c.manual_cpc.enhanced_cpc_enabled = False
    c.contains_eu_political_advertising = client.enums.EuPoliticalAdvertisingStatusEnum.DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING

    service = client.get_service("CampaignService")
    resp = service.mutate_campaigns(customer_id=customer_id, operations=[op])
    campaign_rn = resp.results[0].resource_name
    campaign_id = campaign_rn.split("/")[-1]
    log(f"  Campaña: {campaign_rn} (ID: {campaign_id})")

    # 3. Ubicación Bogotá
    log("Configurando ubicación Bogotá...")
    op = client.get_type("CampaignCriterionOperation")
    cc = op.create
    cc.campaign = campaign_rn
    cc.location.geo_target_constant = client.get_service("GeoTargetConstantService").geo_target_constant_path("1013579")

    service = client.get_service("CampaignCriterionService")
    resp = service.mutate_campaign_criteria(customer_id=customer_id, operations=[op])
    log(f"  Ubicación: {resp.results[0].resource_name}")

    # 4. Grupos
    grupos = {}
    for nombre in ["Restauración", "Pulido y Barnizado", "Reparación"]:
        log(f"  Grupo: {nombre}")
        op = client.get_type("AdGroupOperation")
        ag = op.create
        ag.name = nombre
        ag.status = client.enums.AdGroupStatusEnum.ENABLED
        ag.campaign = campaign_rn
        ag.cpc_bid_micros = CPC_LIMITE_MICROS

        service = client.get_service("AdGroupService")
        resp = service.mutate_ad_groups(customer_id=customer_id, operations=[op])
        ag_rn = resp.results[0].resource_name
        grupos[nombre] = ag_rn

    # 5. RSAs
    for rsa in RSAS:
        ag_rn = grupos[rsa["grupo"]]
        log(f"  RSA: {rsa['nombre']}")
        op = client.get_type("AdGroupAdOperation")
        adga = op.create
        adga.ad_group = ag_rn
        adga.status = client.enums.AdGroupAdStatusEnum.ENABLED

        rsa_ad = adga.ad.responsive_search_ad
        for texto in rsa["titulos"]:
            h = client.get_type("AdTextAsset")
            h.text = texto
            if texto == rsa["titulo_fijado"]:
                h.pinned_field = client.enums.ServedAssetFieldTypeEnum.HEADLINE_1
            rsa_ad.headlines.append(h)

        for texto in rsa["descripciones"]:
            d = client.get_type("AdTextAsset")
            d.text = texto
            rsa_ad.descriptions.append(d)

        adga.ad.final_urls.append(LANDING_PISOS)

        service = client.get_service("AdGroupAdService")
        resp = service.mutate_ad_group_ads(customer_id=customer_id, operations=[op])
        log(f"    Creado: {resp.results[0].resource_name}")

    # 6. Palabras clave
    palabras_por_grupo = {}
    for nombre_grupo, texto, concordancia in PALABRAS_CLAVE:
        palabras_por_grupo.setdefault(nombre_grupo, []).append((texto, concordancia))

    for nombre_grupo, palabras in palabras_por_grupo.items():
        ag_rn = grupos[nombre_grupo]
        for texto, concordancia in palabras:
            log(f"  Palabra clave: {texto} ({concordancia})")
            op = client.get_type("AdGroupCriterionOperation")
            agc = op.create
            agc.ad_group = ag_rn
            agc.status = client.enums.AdGroupCriterionStatusEnum.ENABLED
            agc.keyword.text = texto
            if concordancia == "FRASE":
                agc.keyword.match_type = client.enums.KeywordMatchTypeEnum.PHRASE
            elif concordancia == "EXACTA":
                agc.keyword.match_type = client.enums.KeywordMatchTypeEnum.EXACT

            service = client.get_service("AdGroupCriterionService")
            resp = service.mutate_ad_group_criteria(customer_id=customer_id, operations=[op])
            log(f"    Creada: {resp.results[0].resource_name}")

    # 7. Negativas
    log("Creando negativas...")
    todas = [(t, "FRASE") for t in NEGATIVAS] + [(t, "FRASE") for t in NEGATIVAS_FRASE]
    for texto, _ in todas:
        try:
            op = client.get_type("CampaignCriterionOperation")
            cc = op.create
            cc.campaign = campaign_rn
            cc.negative = True
            cc.keyword.text = texto
            cc.keyword.match_type = client.enums.KeywordMatchTypeEnum.PHRASE

            service = client.get_service("CampaignCriterionService")
            service.mutate_campaign_criteria(customer_id=customer_id, operations=[op])
        except GoogleAdsException as e:
            log(f"  ⚠️  '{texto}' falló: {e}")

    log("")
    log("=" * 60)
    log("CAMPAÑA CREADA")
    log(f"  ID: {campaign_id}")
    log(f"  Presupuesto: 5.000 COP/día")
    log(f"  Puja: CPC manual 1.500 COP")
    log(f"  Estado: PAUSED")
    log(f"  Grupos: 3 | RSAs: 6 | Palabras clave: 14 | Negativas: {len(todas)}")
    log("=" * 60)
    log("")
    log("PRÓXIMOS PASOS (manual, en Google Ads UI):")
    log("  1. Revisar la campaña en ads.google.com")
    log("  2. Cambiar estado de PAUSED a ENABLED")
    log("  3. Configurar fireAdsConversion('pisos') en /espacios/pisos-de-madera")


if __name__ == "__main__":
    main()
