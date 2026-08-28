# Nomenclatura y Privacidad de Proyectos (Veta Dorada)

## Regla Canónica de Privacidad Pública (Portafolio Web)
Para proteger la privacidad de los clientes y mantener el estatus de marca *High-Ticket*, **nunca se debe exponer el nombre o apellido completo del cliente en espacios públicos.** 

Se utilizará una nomenclatura mixta basada en los estándares de los estudios de arquitectura de lujo:
**Fórmula Aprobada:** `[Tipo de Espacio / Concepto] [Inicial del Apellido]. — [Barrio / Ubicación]`

*Ejemplos Públicos:*
- `Cocina Residencia G. — Rosales`
- `Cocina Compacta D. — Chicó`
- `Proyecto Nogal B. — Cabrera`

*Justificación:* El estatus del proyecto se comunica a través de la zona geográfica y el diseño, no a través del nombre del cliente. La inicial del apellido aporta un toque de "encargo familiar" elegante.

---

## Taxonomía Interna (Google Drive y ERP)
Para el almacenamiento interno (G:Drive) y el pipeline de IA que procesará los modelos 3D, la nomenclatura debe ser estricta para permitir el filtrado y ordenamiento cronológico.

**Fórmula de Carpetas (El Proyecto):**
`[AÑO]-[MES]_[APELLIDO-O-ENTIDAD]_[BARRIO-O-EDIFICIO]`
*Ejemplo:* `2025-08_FamiliaGomez_ChicoNavarra`

**Fórmula de Archivos (El Modelo .skp):**
`[Espacio]_[Variante]`
*Ejemplo:* `CocinaPrincipal_Propuesta1.skp`

*Justificación:* Permite que cualquier script de automatización (`Agentic_Toolbox`) lea la carpeta y extraiga inmediatamente la fecha, el sujeto y la ubicación sin necesidad de una base de datos adicional.
