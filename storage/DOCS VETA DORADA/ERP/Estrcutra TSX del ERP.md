El flujo coherente cotización → producción (según blueprint)

/app/quoting                     ← lista de cotizaciones
  └─ /app/quoting/:id            ← editor de propuesta
       ├─ Ficha del proyecto
       ├─ Espacios + materiales
       ├─ Cierre técnico
       ├─ [Exportar PDF]
       └─ [Enviar a Producción]  ← botón nuevo, llama zap crear_orden_trabajo
            │
            ▼  (zap en servidor)
       ordenes_trabajo.json      ← crea OT-2026-001 con estado: pendiente
            │
            ▼
/app/production                  ← directorio de proyectos en taller
  ├─ Tab "En Curso"
  │    └─ ProjectNode: OT-2026-001 - Cliente X
  │         ├─ Barra de progreso (tareas completadas / total)
  │         ├─ Columna: Pendientes (tareas_produccion)
  │         └─ Columna: Dirección + [Ver Modelo 3D]
  │                              └─ Modal: tabs por espacio
  │                                   ├─ Ítems Cotizados
  │                                   ├─ Pendientes del espacio
  │                                   └─ Multimedia
  └─ Tab "Garantía / Post-Venta"
El flujo paso a paso:

Abrir /app/quoting → seleccionar o crear cotización
Editar espacios, materiales, jornadas → cerrar técnicamente
Click "Enviar a Producción" → el zap crear_orden_trabajo genera la OT en el servidor con código OT-2026-NNN y la persiste en ordenes_trabajo.json
Navegar a /app/production → la OT aparece en "En Curso"
Los carpinteros crean tareas_produccion vinculadas a esa OT (por ahora manual via DataBrowser; próximo paso: zap generar_tareas_desde_ot que las crea automáticamente desde los espacios)

Plan técnico completo — ordenado por impacto
Bloque 1 — Arquitectura del shell (prerequisito para todo lo demás)

#	Tarea	Archivo
1.1	app/app/page.tsx — sirve ruta /app/dashboard via engine (no redirect)	nuevo
1.2	Agregar ruta /app/dashboard a page_routes.json con bloques de bienvenida	page_routes.json
1.3	layout.tsx resuelve navId dinámico desde useAuth().user.role	src/app/app/layout.tsx
1.4	Crear registros nav_admin, nav_produccion, nav_cliente en app_navbars.json	app_navbars.json
Bloque 2 — Corrección de arquitectura del módulo de producción

#	Tarea	Archivo
2.1	Hoist de datos: ProductionDirectory carga tareas_produccion, cotizaciones, clientes una vez y pasa slices como props a ProjectNode	ProductionDirectory.tsx, ProjectNode.tsx
2.2	ProjectNode deja de llamar useRelationData — recibe todo por props	ProjectNode.tsx
2.3	Lazy mount del contenido del Accordion — hooks solo cuando está expandido	ProjectNode.tsx
2.4	Mostrar direccion_obra como texto visible + botón copiar	ProjectDetails.tsx
2.5	Corregir filtro de estado: 'garantia' no 'terminada'	ProductionDirectory.tsx
Bloque 3 — Mutación reactiva (los botones que hacen nada)

#	Tarea	Archivo
3.1	Crear zap pausar_tarea — cambia estado a 'pausada'	scripts.json
3.2	Crear zap finalizar_tarea — cambia estado a 'completada'	scripts.json
3.3	Después del fetch en handleAction, invalidar store: useMateriaStore.getState().setMateria('tareas_produccion', []) para forzar re-fetch	ProjectDetails.tsx
3.4	Agregar feedback visual: spinner en botones durante el fetch, toast en éxito/error	ProjectDetails.tsx
Bloque 4 — Estabilidad del visualizador 3D

#	Tarea	Archivo
4.1	ThreeScene solo monta en el tab activo — usar activeTab state para renderizar condicionalmente	Viewer3DModal.tsx
4.2	ThreeScene recibe glbUrl?: string prop — carga el modelo real si existe, cubo placeholder si no	Viewer3DModal.tsx
Bloque 5 — Loading states (UX mínima para campo)

#	Tarea	Archivo
5.1	ProductionDirectory muestra skeleton mientras carga — usar isLoading del primer useRelationData	ProductionDirectory.tsx
5.2	ItemsTab, TasksTab, MediaTab muestran spinner si el padre aún está cargando