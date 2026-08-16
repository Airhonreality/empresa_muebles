-- t-139 (2026-08-15): galería multi-imagen del catálogo para el slider de la ficha de presentación.
-- Patrón de galeria_portafolio_url / fotos_espacio. La portada sigue siendo imagen_url.
ALTER TABLE "productos_catalogo" ADD COLUMN "galeria_imagenes_url" jsonb DEFAULT '[]' NOT NULL;
