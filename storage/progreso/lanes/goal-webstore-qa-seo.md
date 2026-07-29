# Lane: QA SEO

## Objetivo

Documentar la verificación de calidad SEO de la mejora comercial para revisar consistencia de metadatos, estructura pública y señales de indexación sin tocar código ni datos.

## Contrato de contenido y publicación

- El contenido estratégico de las páginas de espacios queda curado en código.
- Los casos del portafolio se administran desde `/app/erp/portfolio`.
- Las imágenes del portafolio se suben por `/api/upload`.
- Cuando Cloudflare R2 está configurado, la subida usa R2 como destino y no depende de almacenamiento local improvisado.
- La QA SEO valida que esa separación de responsabilidades no rompa metadatos, indexación ni recorrido público.

## Archivos permitidos

- `storage/progreso/lanes/goal-webstore-qa-seo.md`

## Archivos prohibidos

- Cualquier archivo fuera de `storage/progreso/lanes/`
- `storage/db/**`
- `src/**`
- `packages/**`
- `agnostic.config.ts`

## Criterios de aceptación

- La lane se limita a documentación de QA SEO.
- Quedan fuera navegación, páginas de espacios y conexión con portafolio.
- El documento define una superficie de revisión trazable y no ambigua.
- El estado inicial se consigna como documentación pendiente.
- La revisión deja claro qué vive en código, qué vive en `/app/erp/portfolio` y qué se entrega vía `/api/upload`.

## Checklist de operación

- [ ] Verificar que los metadatos públicos reflejan el contenido curado en código.
- [ ] Confirmar que los casos del portafolio visibles en público provienen de `/app/erp/portfolio`.
- [ ] Revisar que las rutas públicas no exponen credenciales ni detalles internos de la subida de imágenes.
- [ ] Validar que el flujo de `/api/upload` permanece compatible con Cloudflare R2 cuando esté configurado.
- [ ] Comprobar que las URLs públicas de imágenes son estables y aptas para indexación.
- [ ] Revisar que no exista dependencia del editor SEO sobre `storage/db` para la gestión editorial del portafolio.

## Variables R2

- `CLOUDFLARE_R2_ACCOUNT_ID`
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- `CLOUDFLARE_R2_BUCKET`
- `CLOUDFLARE_R2_PUBLIC_URL`
- `CLOUDFLARE_R2_ENDPOINT`

## Observaciones de seguridad

- No publicar secretos de R2 en snippets, capturas ni mensajes de QA.
- Verificar que el flujo público no filtre rutas internas de carga.
- Mantener revisión humana sobre los assets del portafolio antes de su exposición pública.
- Evitar que la documentación de SEO se convierta en un canal de descubrimiento de infraestructura.
- Si R2 no está activo, no asumir compatibilidad implícita: dejar constancia operativa del estado real.

## Estado

`implementado_verificado_con_observacion`

## Evidencia

- `npm run validate:encoding` y `npm run validate:storage` pasan.
- `npm run build` pasa y genera las rutas públicas nuevas.
- Sitemap ampliado con las rutas de espacios y proceso.
- Observación preexistente: el build advierte que falta `chartjs-node-canvas` en `src/app/api/pdf/chart/route.ts`; no pertenece a esta lane.
- La separación entre contenido curado en código, gestión en ERP y subida de imágenes ya está documentada como parte del control SEO.
