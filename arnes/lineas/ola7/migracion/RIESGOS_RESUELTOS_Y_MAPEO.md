# Resolución de Riesgos y Mapeo Resuelto: Legacy → V3 (F10)

**Status:** Resuelto y documentado
**Fecha:** 2026-08-12
**Autor:** Opencode (Ejecutante Fase 0)

## Resumen Ejecutivo

Las decisiones de mitigación de riesgos A/B/C han sido resolubilizadas para avanzar con la migración de datos V3, manteniendo los principios de seguridad, viabilidad técnica y completitud del sistema.

### 📋 Resumen de Deciones Resueltas

| Riesgo | Decisión | Impacto | Próximos Pasos |
|--------|----------|---------|-------------|
| **A** - Implementar `drizzle-impl.ts` | **Implementar** | Permite preview con datos reales, cumple con pruebas E/E | Implementar stub → migrar → probar en preview |
| **B** - Alcance de migración | **Limitar a 21 tablas físicas** por ahora, plan de roadmap para canon-only | Endeudamiento técnico reducido, velocidad de entrega ↑ | Migrar solo tables físicas V3 existentes, mantener canon-only pendientes |
| **C** - Política PII | **Enmascarar** en origen con preservación cifrada | Conforma con GDPR, evita exposición accidental en dev | Scripts de migración con ofuscación PII |