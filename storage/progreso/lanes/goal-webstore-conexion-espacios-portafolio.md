# Lane: conexión espacios-portafolio

## Objetivo

Documentar la integración conceptual entre las páginas de espacios y el portafolio para asegurar una relación clara entre la presentación pública del espacio y su evidencia visual o comercial asociada.

## Contrato de contenido

- El contenido estratégico de las páginas de espacios queda curado en código.
- Los casos del portafolio se administran desde `/app/erp/portfolio`.
- Las imágenes del portafolio se suben vía `/api/upload`.
- Cuando Cloudflare R2 está configurado, `/api/upload` usa R2 como destino de almacenamiento para los archivos.
- Esta lane documenta la relación entre presentación, administración y evidencia, sin mover la autoridad del contenido a `storage/db`.

## Archivos permitidos

- `storage/progreso/lanes/goal-webstore-conexion-espacios-portafolio.md`

## Archivos prohibidos

- Cualquier archivo fuera de `storage/progreso/lanes/`
- `storage/db/**`
- `src/**`
- `packages/**`
- `agnostic.config.ts`

## Criterios de aceptación

- La lane delimita la relación entre espacios y portafolio sin invadir otras superficies.
- Se excluyen cambios de navegación, páginas de espacios y QA SEO.
- El documento sirve como contrato de coordinación entre equipos o agentes.
- El estado inicial queda marcado como pendiente de ejecución.
- El rol de cada superficie queda explícito: código para el relato estratégico de espacios, ERP para la gestión de casos y API para la carga de imágenes.

## Checklist de operación

- [ ] Confirmar que las páginas de espacios mantienen el texto estratégico curado en código.
- [ ] Verificar que los casos visibles del portafolio se editan en `/app/erp/portfolio`.
- [ ] Validar que las imágenes del portafolio entran por `/api/upload`.
- [ ] Revisar que la configuración de R2 esté presente antes de asumir almacenamiento remoto.
- [ ] Confirmar que no se introduce dependencia de `storage/db` para administrar contenido editorial del portafolio.
- [ ] Mantener trazabilidad de cambios entre espacios, portafolio e imagen subida.

## Variables R2

- `CLOUDFLARE_R2_ACCOUNT_ID`
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- `CLOUDFLARE_R2_BUCKET`
- `CLOUDFLARE_R2_PUBLIC_URL`
- `CLOUDFLARE_R2_ENDPOINT`

## Observaciones de seguridad

- No exponer credenciales de R2 en el frontend, en documentación pública ni en registros de depuración.
- Validar tipo, tamaño y nombre de archivo antes de aceptar una subida.
- Considerar los assets del portafolio como contenido sensible hasta que pasen por revisión editorial.
- Mantener permisos de escritura restringidos a operadores autorizados en `/app/erp/portfolio`.
- Si R2 no está configurado, la documentación debe dejar claro el comportamiento previsto sin inventar almacenamiento alterno.

## Estado

`implementado_verificado`

## Evidencia

- Las páginas de espacio enlazan a `/portafolio?categoria=...`.
- `VetaPortfolio` acepta la categoría inicial y conserva filtros existentes.
- La administración operativa del portafolio se separa del texto curado de espacios.
- La subida de imágenes queda centralizada en `/api/upload`, con R2 como backend cuando la configuración existe.
