#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Crear Conversion Action "Contacto Pisos" en Google Ads.
Ejecución: .venv/bin/python crear_conversion_action.py
"""

import os
from datetime import datetime
from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException

CUENTA_PISOS_MADERA = "975-949-1517"
CUSTOMER_ID_CLEAN = CUENTA_PISOS_MADERA.replace("-", "")
LOGIN_CUSTOMER_ID = os.environ.get("GOOGLE_ADS_LOGIN_CUSTOMER_ID", "8554149890").replace("-", "")


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

    # Verificar si ya existe una Conversion Action llamada "Contacto Pisos"
    ga_service = client.get_service("GoogleAdsService")
    query = """
        SELECT conversion_action.id, conversion_action.name, conversion_action.status
        FROM conversion_action
        WHERE conversion_action.name = 'Contacto Pisos'
    """
    response = ga_service.search(customer_id=customer_id, query=query)
    filas = list(response)
    if filas:
        fila = filas[0]
        log(f"Ya existe Conversion Action 'Contacto Pisos' (ID: {fila.conversion_action.id})")
        conversion_action_id = fila.conversion_action.id
    else:
        # Crear nueva Conversion Action
        log("Creando Conversion Action 'Contacto Pisos'...")
        op = client.get_type("ConversionActionOperation")
        ca = op.create
        ca.name = "Contacto Pisos"
        ca.type_ = client.enums.ConversionActionTypeEnum.WEBPAGE
        ca.category = client.enums.ConversionActionCategoryEnum.CONTACT
        ca.status = client.enums.ConversionActionStatusEnum.ENABLED

        service = client.get_service("ConversionActionService")
        resp = service.mutate_conversion_actions(customer_id=customer_id, operations=[op])
        conversion_action_id = resp.results[0].resource_name.split("/")[-1]
        log(f"Conversion Action creada: ID {conversion_action_id}")

    # Obtener el conversion_label para el código del sitio
    log("Obteniendo conversion_label...")
    query2 = f"""
        SELECT conversion_action.id, conversion_action.name, conversion_action.status,
               conversion_action.attribution_model, conversion_action.category,
               conversion_action.type_
        FROM conversion_action
        WHERE conversion_action.id = {conversion_action_id}
    """
    response2 = ga_service.search(customer_id=customer_id, query=query2)
    filas2 = list(response2)
    if filas2:
        fila = filas2[0]
        log("")
        log("=" * 60)
        log("CONVERSION ACTION 'Contacto Pisos'")
        log(f"  Conversion ID: {conversion_action_id}")
        log(f"  Nombre: {fila.conversion_action.name}")
        log(f"  Estado: {fila.conversion_action.status}")
        log(f"  Tipo: {fila.conversion_action.type_}")
        log(f"  Categoría: {fila.conversion_action.category}")
        log(f"  Atribución: {fila.conversion_action.attribution_model}")
        log("=" * 60)
        log("")
        log("PARA AGREGAR AL SITIO (/espacios/pisos-de-madera):")
        log("")
        log("  gtag('event', 'conversion', {")
        log(f"    'send_to': 'AW-{conversion_action_id}/<CONVERSION_LABEL>',")
        log("    'value': 0,")
        log("    'currency': 'COP',")
        log("  });")
        log("")
        log("O si usas el snippet de Google Ads directamente:")
        log(f"  gtag('config', 'AW-{conversion_action_id}');")
        log("")
        log("IMPORTANTE: El conversion_label es generado por Google Ads")
        log("en la UI cuando creas la etiqueta de conversión. Necesitas")
        log("obtenerlo de la consola de Google Ads UI (Medición > Conversiones).")
        log("")
        log("El Conversion ID es: AW-{}".format(conversion_action_id))


if __name__ == "__main__":
    main()
