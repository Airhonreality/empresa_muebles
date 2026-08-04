# Auditoría Neon (producción) — tarea t-001

Fecha: 2026-07-31T16:44:49.698Z
Fuente: https://empresa-muebles-vl37.vercel.app/api/vault (canal HTTP gobernado, x-api-secret, solo lectura)

## 1. Conteo de registros por namespace

| Namespace | Registros | Notas |
|---|---|---|
| proyectos | 48 | |
| contratos | 7 | |
| clientes | 32 | |
| espacio_variantes | 123 | |
| items_variante | 628 | |
| productos_catalogo | 276 | |
| abonos_contrato | 0 | |
| ordenes_trabajo | 5 | |
| tareas_produccion | 0 | |
| movimientos_financieros | 0 | |
| obligaciones_pendientes | 4 | |
| cuentas_financieras | 6 | |
| compras_materiales | 0 | |
| proveedores | 3 | |
| usuarios_equipo | 5 | |
| leads | 1 | |
| testimonios | 0 | |
| imagenes_espacio | 2 | |
| items_obra_civil | 8 | |
| portfolio_publico | 0 | |
| imagenes_portfolio | 0 | |
| seed_registros | 0 | |
| system_groups | 0 | |
| scripts | 26 | |
| page_routes | 25 | |
| schema_definitions | 30 | |
| configuracion_comercial | 8 | |

## 2. Contratos — integridad referencial

- Total contratos: 7
- proyecto_id con MÁS DE UN contrato (duplicados reales): 0
- Contratos con proyecto_id que YA NO EXISTE en proyectos (huérfanos): 0
- Contratos SIN proyecto_id: 0
- Contratos SIN campo hitos_pago (generados antes del fix, o nunca regenerados): 6
  - contrato id=da87530b-9d31-4c5a-87c7-3b7b57a6a6aa codigo=CT-2026-001 estado=firmado
  - contrato id=6ebc1955-7e22-4b09-af93-afb50daaeef4 codigo=CT-2026-002 estado=firmado
  - contrato id=aaf7acc2-2425-4fb8-9751-69217a67bb1b codigo=CT-2026-003 estado=borrador
  - contrato id=con_1784056986000 codigo=CT-2026-004 estado=firmado
  - contrato id=con_1784672906177 codigo=CT-2026-005 estado=firmado
  - contrato id=con_1785336264401 codigo=CT-2026-007 estado=borrador

## 3. Borradores / registros estancados (posible basura)

- contratos: 0 registros en estado borrador/activa sin tocar hace más de 90 días
- proyectos: 0 registros en estado borrador/activa sin tocar hace más de 90 días

## 4. Campos de texto anómalamente grandes (posible HTML/snapshot embebido)

- scripts.code en registro id=c38b9416-84ed-47eb-bf02-9e12cc5c510b: 20681 caracteres (parece HTML embebido)
- scripts.code en registro id=c84473b4-c62f-45bb-8d92-e32c6e5353ca: 24152 caracteres (parece HTML embebido)
- scripts.code en registro id=bf2444b5-76a7-43ac-af53-c17ed47f62c9: 18663 caracteres
- scripts.code en registro id=b1c2d3e4-f5a6-7890-bcde-f12345678901: 7570 caracteres

## 5. Clientes potencialmente duplicados

