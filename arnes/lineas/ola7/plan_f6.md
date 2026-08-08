# Plan F6 — Finanzas Unificadas (P-21..P-23)

**Fecha:** 2026-08-07 · **Zona:** datos · **Tipo:** datos_contrato · **Riesgo:** alto
**Estado:** DISEÑO COMPLETO (3 pantallas)

---

## 1. Decisiones cerradas

| # | Materia | Decisión |
|---|---|---|
| D1 | Gate E-20 | Cola de aprobación FIFO con reorden manual. Gerente + finanzas interoperables. Cada movimiento logueado en `eventos` |
| D2 | Notificación vencimientos | Sistema alerta a finanzas/gerente. NO al cliente sin permiso del comercial (E-27 manual) |
| D3 | Comisiones | Parametrización total (fijo/porcentaje) en `parametros_compensacion`. Liquidación: doble checkpoint gerente + finanzas |
| D4 | Cuentas cobro proveedor | Pantalla P-23. Factura electrónica externa (Aliado/correo), sistema solo registra URL |
| D5 | Panel caja | Libro completo + historial ergonómico |

---

## 2. Modelo unificado

`obligaciones_pendientes` absorbe `comisiones`, `liquidaciones_compensacion` y `comisiones_proyecto`. Una sola tabla para toda deuda del negocio:

```
origen = 'contrato_hito'  → cobro a cliente
origen = 'proveedor'      → pago a proveedor
origen = 'diseno_3d'      → pago al diseñador
origen = 'nomina'         → salario/compensación
origen = 'comision'       → comisión a socio
origen = 'arriendo'       → pago de arriendo
```

Columnas de cálculo (`base_calculo`, `porcentaje`, `tipo_comision`, `cantidad_modulos`, `desfase_id`) son nullable — solo para `origen='comision'`.

---

## 3. Alcance por pantalla

| Pantalla | Ruta | Función | Archivo |
|---|---|---|---|
| **P-21** | `/app/erp/caja` | Caja: saldo, cola de pagos FIFO, autorización E-20, libro mayor, registros de bloqueo | `disenio_P21_caja.md` |
| **P-22** | `/app/erp/obligaciones` | Obligaciones unificadas: cobros, pagos, comisiones, nómina. Registrar pago, notificar vencimiento, aprobar liquidación | `disenio_P22_obligaciones.md` |
| **P-23** | `/app/erp/cuentas-cobro` | Cuentas de cobro a proveedores: crear, vincular OC, adjuntar factura Aliado | `disenio_P23_cuentas_cobro.md` |

---

## 4. Corrección de naming (check_15_dias → check_produccion)

El control de producción NO es quincenal — es por proyecto, disparado por su cronograma. Renombrado en REGISTRO DE ENTIDADES §5. Documentos históricos conservan el nombre original con nota.

---

## 5. Verificación mecánica (al codificar)

- `npx tsc --noEmit` · `npx eslint .` · test E-20 (bloqueo/desbloqueo atómico) · test E-29 (alerta sin notificar cliente) · test doble checkpoint liquidación · round-trip `obligaciones_pendientes` unificada
