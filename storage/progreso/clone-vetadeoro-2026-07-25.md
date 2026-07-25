# Clone Veta de Oro - Home + Cocinas + Portfolio
**Fecha:** 2026-07-25T02:01:41.622Z
**Fuentes:** https://vetadeoro.co (home, cocinas, portafolio)
**Destino:** storage/assets/ + storage/db/

## Resumen de Operación

## Fase 1: Home Images

- Hero Cocina Moderna: /api/assets/vetadeoro/vetadeoro-home-hero-cocina.jpg
- Hero Principal Christian Mackie: /api/assets/vetadeoro/vetadeoro-home-hero-principal.jpg
- Diseño de Espacios: /api/assets/vetadeoro/vetadeoro-home-diseno-espacios.jpg
- Cocina Moderna - Detalles: /api/assets/vetadeoro/vetadeoro-home-cocina-detalles.jpg

## Fase 2: Portfolio Images

### Proyecto 1: Dormitorio moderno con cama flotante
- **ID:** vetadeoro-dormitorios-dormitorio-moderno-con-cama-flotante
- **Categoría:** dormitorios
- **Ubicación:** Bogotá

  - Imagen 1: /api/assets/vetadeoro/vetadeoro-dormitorios-dormitorio-moderno-con-cama-flotante-img-1.jpg
  - Imagen 2: /api/assets/vetadeoro/vetadeoro-dormitorios-dormitorio-moderno-con-cama-flotante-img-2.jpg

### Proyecto 2: Cocina de superficies continuas
- **ID:** vetadeoro-cocinas-cocina-de-superficies-continuas
- **Categoría:** cocinas
- **Ubicación:** Bogotá

  - Imagen 1: /api/assets/vetadeoro/vetadeoro-cocinas-cocina-de-superficies-continuas-img-1.jpg
  - Imagen 2: /api/assets/vetadeoro/vetadeoro-cocinas-cocina-de-superficies-continuas-img-2.jpg

### Proyecto 3: Barra de bar con sinterizado y flor morado
- **ID:** vetadeoro-cavas_bares-barra-de-bar-con-sinterizado-y-flor-morado
- **Categoría:** cavas_bares
- **Ubicación:** Bogotá

  - Imagen 1: /api/assets/vetadeoro/vetadeoro-cavas_bares-barra-de-bar-con-sinterizado-y-flor-morado-img-1.jpg
  - Imagen 2: ERROR - Failed to download: HTTP 403

### Proyecto 4: Vestidor modular con vidrio templado
- **ID:** vetadeoro-dormitorios_closets-vestidor-modular-con-vidrio-templado
- **Categoría:** dormitorios_closets
- **Ubicación:** Bogotá

  - Imagen 1: /api/assets/vetadeoro/vetadeoro-dormitorios_closets-vestidor-modular-con-vidrio-templado-img-1.jpg
  - Imagen 2: /api/assets/vetadeoro/vetadeoro-dormitorios_closets-vestidor-modular-con-vidrio-templado-img-2.jpg

### Proyecto 5: Cocina integral con vidrio blanco templado
- **ID:** vetadeoro-cocinas-cocina-integral-con-vidrio-blanco-templado
- **Categoría:** cocinas
- **Ubicación:** Bogotá

  - Imagen 1: /api/assets/vetadeoro/vetadeoro-cocinas-cocina-integral-con-vidrio-blanco-templado-img-1.jpg
  - Imagen 2: /api/assets/vetadeoro/vetadeoro-cocinas-cocina-integral-con-vidrio-blanco-templado-img-2.jpg


## Configuración para el nuevo Home
- **Hero principal:** /api/assets/vetadeoro/vetadeoro-home-hero-cocina.jpg
- **Guardado en:** configuracion_comercial (llave: home_hero_url)
- **Próximo paso:** Actualizar VetaHome.tsx para usar esta URL
## Estadísticas
- **Proyectos procesados:** 5
- **Imágenes exitosas:** 13
- **Imágenes fallidas:** 1
- **Total imágenes:** 14

## Almacenamiento
- **Local (Desarrollo):** `storage/assets/vetadeoro/`
- **URLs generadas:** `/api/assets/vetadeoro/{filename}`
- **Producción:** Para producción, estas URLs deben migrarse a R2 o servirse desde CDN

## Archivos Modificados
- `storage/db/portfolio_publico.json` (+5 registros)
- `storage/db/imagenes_portfolio.json` (+9 registros)
- `storage/db/configuracion_comercial.json` (+2 registros)
- `storage/assets/vetadeoro/` (+13 imágenes)

---
*Generado automáticamente por scripts/clone-vetadeoro.ts*