#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de creación de campaña Google Ads — Pisos de Madera (Búsqueda, Bogotá).
Usa el SDK oficial google-ads (v18) del venv de Agentic_Toolbox.
Solo lectura para auditoría + mutaciones controladas para crear la campaña.
Ejecutar con: source .env && .venv/bin/python crear_campana_pisos_madera.py
"""

import os
import sys
from datetime import datetime
from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException

# ============================================================
# CONFIGURACIÓN DE CAMPAÑA (según el diseño aprobado)
# ============================================================
CUENTA_PISOS_MADERA = "975-949-1517"
CUSTOMER_ID_CLEAN = CUENTA_PISOS_MADERA.replace("-", "")
LOGIN_CUSTOMER_ID = os.environ.get("GOOGLE_ADS_LOGIN_CUSTOMER_ID", "8554149890").replace("-", "")

PRESUPUESTO_DIARIO_MICROS = 5_000_000_000   # 5.000 COP en micros
CPC_LIMITE_MICROS = 1_500_000_000           # 1.500 COP promedio (rango 1.000-2.000)
LANDING_PISOS = "https://www.vetadorada.co/espacios/pisos-de-madera"

NOMBRE_CAMPANA = "Búsqueda – Pisos de Madera – Bogotá"

# ============================================================
# PALABRAS CLAVE (14, del diseño aprobado)
# ============================================================
PALABRAS_CLAVE = [
    # Grupo 1 — Restauración
    ("Restauración", '"restauración de pisos de madera"', "FRASE"),
    ("Restauración", '"restauración pisos de madera bogotá"', "FRASE"),
    ("Restauración", '"restaurar piso de madera"', "FRASE"),
    ("Restauración", '[restauración de pisos de madera bogotá]', "EXACTA"),
    # Grupo 2 — Pulido y Barnizado
    ("Pulido y Barnizado", '"pulido de pisos de madera"', "FRASE"),
    ("Pulido y Barnizado", '"pulido de pisos de madera bogotá"', "FRASE"),
    ("Pulido y Barnizado", '"barnizar piso de madera"', "FRASE"),
    ("Pulido y Barnizado", '"lijado y barnizado de pisos"', "FRASE"),
    ("Pulido y Barnizado", '[pulido de pisos de madera bogotá]', "EXACTA"),
    # Grupo 3 — Reparación
    ("Reparación", '"reparación de pisos de madera"', "FRASE"),
    ("Reparación", '"reparación piso de madera bogotá"', "FRASE"),
    ("Reparación", '"reparar piso de madera"', "FRASE"),
    ("Reparación", '"arreglar piso de madera"', "FRASE"),
    ("Reparación", '[reparación de pisos de madera bogotá]', "EXACTA"),
]

# ============================================================
# NEGATIVAS (9 bloques, concordancia FRASE)
# ============================================================
NEGATIVAS = [
    # Bloque 1 — Instalación y venta de pisos nuevos
    "instalación", "instalacion", "instalar", "instalador",
    "piso nuevo", "pisos nuevos", "venta", "vender", "comprar", "compra",
    "lámina", "lamina", "laminado", "flotante", "sintético", "sintetico",
    "vinílico", "vinilico", "porcelanato", "cerámica", "cerámica",
    "deck", "exterior", "madera plástica", "madera plastica",
    "proveedor", "distribuidor", "fábrica", "fabrica", "mayorista",
    # Bloque 2 — Materiales y productos
    "barniz", "barnices", "laca", "lacas", "aceite para madera",
    "tinta para madera", "sellador", "selladores", "pegamento", "cola",
    "cera", "limpiador", "limpiadores", "producto", "productos",
    # Bloque 3 — Gratis, DIY y curiosidad
    "gratis", "gratuito", "gratuita", "sin costo", "barato", "casero",
    "diy", "hacerlo uno mismo", "tutorial", "tutoriales", "curso",
    "cursos", "aprender", "pdf", "descargar",
    # Bloque 4 — Empleo y trabajo
    "empleo", "empleos", "trabajo", "trabajos", "vacante", "vacantes",
    "contratar", "contratación", "contratacion", "hoja de vida",
    "curriculum", "cv", "sueldo", "salario",
    # Bloque 5 — Alquiler y bienes raíces
    "alquiler", "arriendo", "arrendar", "alquilar", "renta", "rentar",
    "inmobiliaria", "inmueble", "inmuebles", "apartamento en venta",
    "casa en venta", "finca raíz", "finca raiz",
    # Bloque 6 — Pisos de otro tipo (no madera)
    "epóxico", "epoxico", "epoxi", "concreto", "cemento",
    "pulido de concreto", "pulido de cemento", "mármol", "marmol",
    "granito", "gres", "baldosa", "baldosas", "alfombra", "alfombras",
    "moqueta", "microcemento",
    # Bloque 7 — Servicios que no ofreces
    "muebles", "puertas", "ventanas", "closets", "cocina integral",
    "escaleras", "barandales", "pasamanos", "tarima", "tarimas",
    "repisa", "repisas",
    # Bloque 8 — Geografía fuera de cobertura
    "medellín", "medellin", "cali", "barranquilla", "cartagena",
    "bucaramanga", "cúcuta", "cucuta", "pereira", "manizales",
    "santa marta", "villavicencio", "ibagué", "ibague", "neiva",
    "pasto", "armenia", "montería", "monteria",
]

# Concordancia de frase (entre comillas) — Bloques A-E
NEGATIVAS_FRASE = [
    # Bloque 9
    '"sin madera"', '"falso"', '"falsa"', '"imitación"', '"imitacion"',
    '"simil madera"', '"parecido a madera"',
    # Bloque A
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
    # Bloque B
    '"comprar piso"', '"venta de piso"', '"precio de piso"', '"precio por metro"',
    '"lámina para piso"', '"tabla para piso"', '"rollo de piso"', '"caja de piso"',
    '"piso al por mayor"', '"distribuidor de pisos"', '"fábrica de pisos"',
    '"proveedor de pisos"', '"piso barato"', '"piso económico"',
    '"piso en oferta"', '"piso segunda mano"', '"piso usado"',
    '"piso de remate"', '"muestra de piso"', '"catálogo de pisos"',
    # Bloque C
    '"cómo instalar piso"', '"cómo poner piso"', '"cómo reparar piso"',
    '"cómo restaurar piso"', '"cómo pulir piso"', '"cómo lijar piso"',
    '"cómo barnizar piso"', '"hacer uno mismo"', '"paso a paso para"',
    '"tutorial de piso"', '"guía para instalar"', '"aprender a instalar"',
    '"curso de pisos"', '"qué es un piso"', '"ventajas de piso"',
    '"desventajas de piso"', '"opiniones de piso"', '"vale la pena piso"',
    # Bloque D
    '"trabajo de instalador"', '"empleo para pisos"', '"vacante de piso"',
    '"sueldo de instalador"', '"cómo ser instalador"', '"curso de instalación"',
    '"certificación de pisos"', '"limpieza de pisos"', '"encerado de pisos"',
    '"abrillantado de pisos"', '"lavado de pisos"', '"desmanchado de pisos"',
    '"fumigación para pisos"',
    # Bloque E (sin '"piso"' ni '"pisos"': son subcadenas de las palabras clave
    # positivas "reparar piso de madera", "pulido de pisos de madera", etc., y
    # una negativa de frase las bloquea → la campaña no sirve. Ver
    # arnes/lineas/demanda/03_campana_pisos_madera.)
    '"suelos"', '"revestimiento"', '"decoración de pisos"',
    '"tendencia de pisos"', '"tipos de pisos"', '"modelos de pisos"',
    '"colores de pisos"', '"pisos modernos"', '"pisos elegantes"',
]

# ============================================================
# RSAs (6 anuncios: 2 por grupo, 15 títulos + 4 descripciones)
# ============================================================
RSAS = [
    # Grupo 1 — Restauración
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
    # Grupo 2 — Pulido y Barnizado
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
    # Grupo 3 — Reparación
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

# ============================================================
# CLIENTE GOOGLE ADS
# ============================================================
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


# ============================================================
# OPERACIONES DE CREACIÓN
# ============================================================
def crear_presupuesto(client, customer_id):
    log("Creando presupuesto de campaña...")
    op = client.get_type("CampaignBudgetOperation")
    cb = op.create
    cb.name = f"Presupuesto {NOMBRE_CAMPANA} {datetime.now().strftime('%Y%m%d_%H%M%S')}"
    cb.amount_micros = PRESUPUESTO_DIARIO_MICROS
    cb.delivery_method = client.enums.BudgetDeliveryMethodEnum.STANDARD

    service = client.get_service("CampaignBudgetService")
    response = service.mutate_campaign_budgets(customer_id=customer_id, operations=[op])
    resource_name = response.results[0].resource_name
    log(f"  Presupuesto creado: {resource_name}")
    return resource_name


def crear_campana(client, customer_id, presupuesto_resource_name):
    log("Creando campaña...")
    op = client.get_type("CampaignOperation")
    c = op.create
    c.name = NOMBRE_CAMPANA
    c.status = client.enums.CampaignStatusEnum.PAUSED  # inicia pausada
    c.advertising_channel_type = client.enums.AdvertisingChannelTypeEnum.SEARCH
    c.campaign_budget = presupuesto_resource_name

    # Redes: solo Búsqueda de Google
    c.network_settings.target_google_search = True
    c.network_settings.target_search_network = False
    c.network_settings.target_content_network = False
    c.network_settings.target_partner_search_network = False

    # Puja CPC manual
    c.manual_cpc.enhanced_cpc_enabled = False

    # Campo requerido por Google Ads API v26 (0 = No, 1 = Sí)
    c.contains_eu_political_advertising = 0

    # Ubicación: Bogotá D.C. (target geo constant 1013579 = Bogotá)
    # No se puede agregar ubicación directamente en campaign.create sin un criterio separado,
    # se hace con CampaignCriterion después.

    service = client.get_service("CampaignService")
    response = service.mutate_campaigns(customer_id=customer_id, operations=[op])
    campaign_resource_name = response.results[0].resource_name
    campaign_id = campaign_resource_name.split("/")[-1]
    log(f"  Campaña creada: {campaign_resource_name} (ID: {campaign_id})")
    return campaign_resource_name, campaign_id


def crear_ubicacion_bogota(client, customer_id, campaign_id):
    log("Configurando ubicación Bogotá D.C...")
    # Geo target constant para Bogotá, Colombia: 1013579
    op = client.get_type("CampaignCriterionOperation")
    cc = op.create
    cc.campaign = client.get_service("CampaignService").campaign_path(customer_id, campaign_id)
    cc.location.geo_target_constant = client.get_service("GeoTargetConstantService").geo_target_constant_path("1013579")

    service = client.get_service("CampaignCriterionService")
    response = service.mutate_campaign_criteria(customer_id=customer_id, operations=[op])
    log(f"  Ubicación configurada: {response.results[0].resource_name}")


def crear_grupo_anuncios(client, customer_id, campaign_id, nombre, cpc_micros):
    op = client.get_type("AdGroupOperation")
    ag = op.create
    ag.name = nombre
    ag.status = client.enums.AdGroupStatusEnum.ENABLED
    ag.campaign = client.get_service("CampaignService").campaign_path(customer_id, campaign_id)
    ag.cpc_bid_micros = cpc_micros

    service = client.get_service("AdGroupService")
    response = service.mutate_ad_groups(customer_id=customer_id, operations=[op])
    ag_resource_name = response.results[0].resource_name
    ag_id = ag_resource_name.split("/")[-1]
    log(f"  Grupo '{nombre}' creado (ID: {ag_id})")
    return ag_resource_name, ag_id


def crear_rsa(client, customer_id, ad_group_resource_name, ad_group_id, rsa):
    log(f"  Creando RSA '{rsa['nombre']}'...")
    op = client.get_type("AdGroupAdOperation")
    adga = op.create
    adga.ad_group = ad_group_resource_name
    adga.status = client.enums.AdGroupAdStatusEnum.ENABLED

    rsa_ad = adga.ad.responsive_search_ad

    # Títulos
    for i, texto in enumerate(rsa["titulos"]):
        headline = client.get_type("AdTextAsset")
        headline.text = texto
        # Fijar el título ancla a posición 1
        if texto == rsa["titulo_fijado"]:
            headline.pinned_field = client.enums.ServedAssetFieldTypeEnum.HEADLINE_1
        rsa_ad.headlines.append(headline)

    # Descripciones
    for texto in rsa["descripciones"]:
        desc = client.get_type("AdTextAsset")
        desc.text = texto
        rsa_ad.descriptions.append(desc)

    # URLs finales
    adga.ad.final_urls.append(LANDING_PISOS)

    service = client.get_service("AdGroupAdService")
    response = service.mutate_ad_group_ads(customer_id=customer_id, operations=[op])
    resource_name = response.results[0].resource_name
    ad_id = resource_name.split("/")[-1]
    log(f"    RSA '{rsa['nombre']}' creado (ID: {ad_id})")
    return resource_name


def crear_palabra_clave(client, customer_id, ad_group_resource_name, texto, concordancia):
    op = client.get_type("AdGroupCriterionOperation")
    agc = op.create
    agc.ad_group = ad_group_resource_name
    agc.status = client.enums.AdGroupCriterionStatusEnum.ENABLED

    keyword = agc.keyword
    keyword.text = texto
    if concordancia == "FRASE":
        keyword.match_type = client.enums.KeywordMatchTypeEnum.PHRASE
    elif concordancia == "EXACTA":
        keyword.match_type = client.enums.KeywordMatchTypeEnum.EXACT

    service = client.get_service("AdGroupCriterionService")
    response = service.mutate_ad_group_criteria(customer_id=customer_id, operations=[op])
    resource_name = response.results[0].resource_name
    criterion_id = resource_name.split("/")[-1]
    log(f"    Palabra clave '{texto}' ({concordancia}) creada (ID: {criterion_id})")
    return resource_name


def crear_negativa(client, customer_id, campaign_resource_name, texto):
    op = client.get_type("CampaignCriterionOperation")
    cc = op.create
    cc.campaign = campaign_resource_name
    cc.negative = True

    keyword = cc.keyword
    keyword.text = texto
    keyword.match_type = client.enums.KeywordMatchTypeEnum.PHRASE

    service = client.get_service("CampaignCriterionService")
    response = service.mutate_campaign_criteria(customer_id=customer_id, operations=[op])
    resource_name = response.results[0].resource_name
    criterion_id = resource_name.split("/")[-1]
    return resource_name, criterion_id


# ============================================================
# FLUJO PRINCIPAL
# ============================================================
def main():
    # Cargar variables de entorno desde .env del repo de marca
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

    log(f"Cuenta Google Ads: {CUENTA_PISOS_MADERA} (clean: {customer_id})")

    # 1. Presupuesto
    presupuesto_rn = crear_presupuesto(client, customer_id)

    # 2. Campaña
    campaign_rn, campaign_id = crear_campana(client, customer_id, presupuesto_rn)

    # 3. Ubicación Bogotá
    crear_ubicacion_bogota(client, customer_id, campaign_id)

    # 4. Grupos de anuncios + RSAs + Palabras clave
    grupos = {}
    for nombre_grupo in ["Restauración", "Pulido y Barnizado", "Reparación"]:
        ag_rn, ag_id = crear_grupo_anuncios(
            client, customer_id, campaign_id, nombre_grupo, CPC_LIMITE_MICROS
        )
        grupos[nombre_grupo] = ag_rn

    # 5. RSAs
    for rsa in RSAS:
        ag_rn = grupos[rsa["grupo"]]
        crear_rsa(client, customer_id, ag_rn, None, rsa)

    # 6. Palabras clave
    palabras_por_grupo = {}
    for nombre_grupo, texto, concordancia in PALABRAS_CLAVE:
        palabras_por_grupo.setdefault(nombre_grupo, []).append((texto, concordancia))

    for nombre_grupo, palabras in palabras_por_grupo.items():
        ag_rn = grupos[nombre_grupo]
        for texto, concordancia in palabras:
            crear_palabra_clave(client, customer_id, ag_rn, texto, concordancia)

    # 7. Negativas a nivel de campaña
    log("Creando palabras clave negativas...")
    todas_negativas = [(t, "FRASE") for t in NEGATIVAS] + [(t, "FRASE") for t in NEGATIVAS_FRASE]
    for texto, _ in todas_negativas:
        try:
            crear_negativa(client, customer_id, campaign_rn, texto)
        except GoogleAdsException as e:
            log(f"  ⚠️  Negativa '{texto}' falló (posible duplicado): {e}")

    log("")
    log("=" * 60)
    log("CAMPAÑA CREADA EXITOSAMENTE")
    log(f"  Campaña ID: {campaign_id}")
    log(f"  Nombre: {NOMBRE_CAMPANA}")
    log(f"  Presupuesto: 5.000 COP/día")
    log(f"  Puja: CPC manual (1.500 COP promedio)")
    log(f"  Estado: PAUSED (activar tras revisión manual)")
    log(f"  Grupos: 3 (Restauración, Pulido y Barnizado, Reparación)")
    log(f"  RSAs: 6 (2 por grupo)")
    log(f"  Palabras clave: 14")
    log(f"  Negativas: {len(todas_negativas)}")
    log("=" * 60)
    log("")
    log("PRÓXIMOS PASOS (manual, en Google Ads UI):")
    log("  1. Revisar la campaña en ads.google.com")
    log("  2. Cambiar estado de PAUSED a ENABLED")
    log("  3. Configurar fireAdsConversion('pisos') en /espacios/pisos-de-madera")
    log("  4. Semana 1-2: no tocar, dejar correr con lista cerrada")


if __name__ == "__main__":
    main()
