#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de creación de campaña Google Ads — Pisos de Madera (Búsqueda, Bogotá).
Usa Google Ads API REST (v18) con GoogleAdsService.Mutate.
Credenciales cargadas desde .env del repo de marca.
Ejecución: .venv/bin/python crear_campana_rest.py
"""

import os
import json
import requests
from datetime import datetime

# ============================================================
# CONFIGURACIÓN
# ============================================================
API_VERSION = "v18"
BASE_URL = f"https://googleads.googleapis.com/{API_VERSION}"

CUENTA_PISOS_MADERA = "975-949-1517"
CUSTOMER_ID_CLEAN = CUENTA_PISOS_MADERA.replace("-", "")
LOGIN_CUSTOMER_ID = os.environ.get("GOOGLE_ADS_LOGIN_CUSTOMER_ID", "8554149890").replace("-", "")

PRESUPUESTO_DIARIO_MICROS = 5_000_000_000   # 5.000 COP
CPC_LIMITE_MICROS = 1_500_000_000           # 1.500 COP promedio
LANDING_PISOS = "https://www.vetadorada.co/espacios/pisos-de-madera"
NOMBRE_CAMPANA = "Búsqueda – Pisos de Madera – Bogotá"

# ============================================================
# PALABRAS CLAVE (14)
# ============================================================
PALABRAS_CLAVE = [
    ("Restauración", '"restauración de pisos de madera"', "PHRASE"),
    ("Restauración", '"restauración pisos de madera bogotá"', "PHRASE"),
    ("Restauración", '"restaurar piso de madera"', "PHRASE"),
    ("Restauración", '[restauración de pisos de madera bogotá]', "EXACT"),
    ("Pulido y Barnizado", '"pulido de pisos de madera"', "PHRASE"),
    ("Pulido y Barnizado", '"pulido de pisos de madera bogotá"', "PHRASE"),
    ("Pulido y Barnizado", '"barnizar piso de madera"', "PHRASE"),
    ("Pulido y Barnizado", '"lijado y barnizado de pisos"', "PHRASE"),
    ("Pulido y Barnizado", '[pulido de pisos de madera bogotá]', "EXACT"),
    ("Reparación", '"reparación de pisos de madera"', "PHRASE"),
    ("Reparación", '"reparación piso de madera bogotá"', "PHRASE"),
    ("Reparación", '"reparar piso de madera"', "PHRASE"),
    ("Reparación", '"arreglar piso de madera"', "PHRASE"),
    ("Reparación", '[reparación de pisos de madera bogotá]', "EXACT"),
]

# ============================================================
# NEGATIVAS (~130, concordancia FRASE)
# ============================================================
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

# ============================================================
# RSAs (6 anuncios)
# ============================================================
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

# ============================================================
# CLIENTE REST GOOGLE ADS
# ============================================================
class GoogleAdsREST:
    def __init__(self):
        self.access_token = None
        self.token_expiry = 0
        self.customer_id = CUSTOMER_ID_CLEAN
        self.login_customer_id = LOGIN_CUSTOMER_ID

    def _get_access_token(self):
        import time
        ahora = time.time()
        if self.access_token and self.token_expiry > ahora + 60:
            return self.access_token

        resp = requests.post("https://oauth2.googleapis.com/token", data={
            "grant_type": "refresh_token",
            "refresh_token": os.environ["GOOGLE_ADS_REFRESH_TOKEN"],
            "client_id": os.environ["GOOGLE_ADS_CLIENT_ID"],
            "client_secret": os.environ["GOOGLE_ADS_CLIENT_SECRET"],
        })
        if not resp.ok:
            raise Exception(f"Error obteniendo token: {resp.status_code} {resp.text}")
        datos = resp.json()
        self.access_token = datos["access_token"]
        self.token_expiry = ahora + datos["expires_in"]
        return self.access_token

    def _headers(self):
        return {
            "Authorization": f"Bearer {self._get_access_token()}",
            "developer-token": os.environ["GOOGLE_ADS_DEVELOPER_TOKEN"],
            "login-customer-id": self.login_customer_id,
            "Content-Type": "application/json",
        }

    def mutate(self, operations):
        """Envía múltiples operaciones de mutación a GoogleAdsService.Mutate."""
        url = f"{BASE_URL}/{self.customer_id}/googleAds:mutate"
        payload = {
            "mutate_operations": operations,
            "partial_failure": True,
        }
        resp = requests.post(url, headers=self._headers(), json=payload)
        if not resp.ok:
            raise Exception(f"googleAds:mutate falló: {resp.status_code} {resp.text}")
        return resp.json()


def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")


def main():
    # Cargar .env
    env_path = "/home/airhon/Proyectos/empresa_muebles/.env"
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, _, val = line.partition("=")
                    val = val.strip().strip("'").strip('"')
                    os.environ[key.strip()] = val

    ads = GoogleAdsREST()
    log(f"Cuenta: {CUENTA_PISOS_MADERA} ({ads.customer_id})")

    operaciones = []

    # 1. Presupuesto de campaña
    log("Preparando presupuesto...")
    presupuesto_id = f"presupuesto_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    operaciones.append({
        "campaignBudgetOperation": {
            "create": {
                "resourceName": f"customers/{ads.customer_id}/campaignBudgets/{presupuesto_id}",
                "name": f"Presupuesto {NOMBRE_CAMPANA}",
                "amountMicros": str(PRESUPUESTO_DIARIO_MICROS),
                "deliveryMethod": "STANDARD",
            }
        }
    })

    # 2. Campaña
    log("Preparando campaña...")
    operaciones.append({
        "campaignOperation": {
            "create": {
                "resourceName": f"customers/{ads.customer_id}/campaigns/0",  # placeholder, se asigna
                "name": NOMBRE_CAMPANA,
                "status": "PAUSED",
                "advertisingChannelType": "SEARCH",
                "campaignBudget": f"customers/{ads.customer_id}/campaignBudgets/{presupuesto_id}",
                "networkSettings": {
                    "targetGoogleSearch": True,
                    "targetSearchNetwork": False,
                    "targetContentNetwork": False,
                    "targetPartnerSearchNetwork": False,
                },
                "manualCpc": {
                    "enhancedCpcEnabled": False,
                },
                "containsEuPoliticalAdvertising": False,
            }
        }
    })

    # 3. Ubicación Bogotá (geo target constant 1013579)
    log("Preparando ubicación Bogotá...")
    operaciones.append({
        "campaignCriterionOperation": {
            "create": {
                "campaign": f"customers/{ads.customer_id}/campaigns/0",
                "location": {
                    "geoTargetConstant": f"customers/{ads.customer_id}/geoTargetConstants/1013579",
                },
            }
        }
    })

    # 4. Grupos de anuncios
    grupos = {}
    for nombre in ["Restauración", "Pulido y Barnizado", "Reparación"]:
        log(f"  Preparando grupo: {nombre}")
        ag_id = f"ag_{nombre.lower().replace(' ', '_')}_{datetime.now().strftime('%H%M%S')}"
        operaciones.append({
            "adGroupOperation": {
                "create": {
                    "resourceName": f"customers/{ads.customer_id}/adGroups/{ag_id}",
                    "name": nombre,
                    "status": "ENABLED",
                    "campaign": f"customers/{ads.customer_id}/campaigns/0",
                    "cpcBidMicros": str(CPC_LIMITE_MICROS),
                }
            }
        })
        grupos[nombre] = ag_id

    # 5. RSAs
    for rsa in RSAS:
        ag_id = grupos[rsa["grupo"]]
        log(f"  Preparando RSA: {rsa['nombre']}")
        headlines = []
        for texto in rsa["titulos"]:
            h = {"text": texto}
            if texto == rsa["titulo_fijado"]:
                h["pinnedField"] = "HEADLINE_1"
            headlines.append(h)

        descriptions = [{"text": d} for d in rsa["descripciones"]]

        rsa_id = f"rsa_{datetime.now().strftime('%H%M%S')}"
        operaciones.append({
            "adGroupAdOperation": {
                "create": {
                    "resourceName": f"customers/{ads.customer_id}/adGroupAds/{rsa_id}",
                    "adGroup": f"customers/{ads.customer_id}/adGroups/{ag_id}",
                    "status": "ENABLED",
                    "ad": {
                        "responsiveSearchAd": {
                            "headlines": headlines,
                            "descriptions": descriptions,
                        },
                        "finalUrls": [LANDING_PISOS],
                    },
                }
            }
        })

    # 6. Palabras clave
    palabras_por_grupo = {}
    for nombre_grupo, texto, concordancia in PALABRAS_CLAVE:
        palabras_por_grupo.setdefault(nombre_grupo, []).append((texto, concordancia))

    for nombre_grupo, palabras in palabras_por_grupo.items():
        ag_id = grupos[nombre_grupo]
        for texto, concordancia in palabras:
            log(f"  Preparando palabra clave: {texto} ({concordancia})")
            kw_id = f"kw_{datetime.now().strftime('%H%M%S%f')}"
            operaciones.append({
                "adGroupCriterionOperation": {
                    "create": {
                        "resourceName": f"customers/{ads.customer_id}/adGroupCriteria/{kw_id}",
                        "adGroup": f"customers/{ads.customer_id}/adGroups/{ag_id}",
                        "status": "ENABLED",
                        "keyword": {
                            "text": texto,
                            "matchType": concordancia,
                        },
                    }
                }
            })

    # 7. Negativas
    log("Preparando negativas...")
    todas = [(t, "PHRASE") for t in NEGATIVAS] + [(t, "PHRASE") for t in NEGATIVAS_FRASE]
    for texto, _ in todas:
        neg_id = f"neg_{datetime.now().strftime('%H%M%S%f')}"
        operaciones.append({
            "campaignCriterionOperation": {
                "create": {
                    "resourceName": f"customers/{ads.customer_id}/campaignCriteria/{neg_id}",
                    "campaign": f"customers/{ads.customer_id}/campaigns/0",
                    "negative": True,
                    "keyword": {
                        "text": texto,
                        "matchType": "PHRASE",
                    },
                }
            }
        })

    # Ejecutar todas las mutaciones
    log("")
    log(f"Ejecutando {len(operaciones)} mutaciones...")
    resp = ads.mutate(operaciones)

    # Verificar resultados
    resultados = resp.get("mutate_operation_responses", [])
    log(f"  Respuestas recibidas: {len(resultados)}")

    # Contar éxitos y errores
    exitos = 0
    errores = 0
    for r in resultados:
        # Cada respuesta tiene un campo según el tipo de operación
        if "campaignBudgetResult" in r:
            exitos += 1
        elif "campaignResult" in r:
            exitos += 1
        elif "adGroupResult" in r:
            exitos += 1
        elif "adGroupAdResult" in r:
            exitos += 1
        elif "adGroupCriterionResult" in r:
            exitos += 1
        elif "campaignCriterionResult" in r:
            exitos += 1
        else:
            errores += 1
            log(f"  ⚠️  Respuesta inesperada: {list(r.keys())}")

    log("")
    log("=" * 60)
    log("CAMPAÑA CREADA")
    log(f"  Presupuesto: 5.000 COP/día")
    log(f"  Puja: CPC manual 1.500 COP")
    log(f"  Estado: PAUSED")
    log(f"  Grupos: 3 | RSAs: 6 | Palabras clave: 14 | Negativas: {len(todas)}")
    log(f"  Operaciones exitosas: {exitos} | Errores: {errores}")
    log("=" * 60)
    log("")
    log("PRÓXIMOS PASOS (manual, en Google Ads UI):")
    log("  1. Revisar la campaña en ads.google.com")
    log("  2. Cambiar estado de PAUSED a ENABLED")
    log("  3. Configurar fireAdsConversion('pisos') en /espacios/pisos-de-madera")


if __name__ == "__main__":
    main()
