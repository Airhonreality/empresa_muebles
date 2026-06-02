'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import type {
  OrdenesTrabajoRecord,
  EspacioVariantesRecord,
  ItemsVarianteRecord,
  TareasProduccionRecord,
  ImagenesEspacioRecord,
  ProductosCatalogoRecord,
} from '@/generated/agnostic-schemas'
import { useRelationData } from '@/lib/agnostic/hooks/useRelationData'
import { useMemo, useRef, useEffect, useState } from 'react'
import * as THREE from 'three'

function ThreeScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const rafRef = useRef<number>(0)
  const sceneRef = useRef(new THREE.Scene())
  const cameraRef = useRef(new THREE.PerspectiveCamera(75, 16 / 9, 0.1, 1000))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    rendererRef.current = renderer
    cameraRef.current.position.z = 5
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    sceneRef.current.add(ambientLight)
    const pointLight = new THREE.PointLight(0xffffff, 0.8)
    pointLight.position.set(2, 3, 4)
    sceneRef.current.add(pointLight)
    const geometry = new THREE.BoxGeometry()
    const material = new THREE.MeshStandardMaterial({ color: 0x8b6914 })
    const cube = new THREE.Mesh(geometry, material)
    sceneRef.current.add(cube)
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate)
      cube.rotation.x += 0.005
      cube.rotation.y += 0.008
      renderer.render(sceneRef.current, cameraRef.current)
    }
    animate()
    return () => {
      cancelAnimationFrame(rafRef.current)
      renderer.dispose()
      rendererRef.current = null
    }
  }, [])

  return <canvas ref={canvasRef} className="w-full h-64 rounded-md" />
}

function ItemsTab({ spaceId, allItems, allCatalog }: {
  spaceId: string
  allItems: ItemsVarianteRecord[]
  allCatalog: ProductosCatalogoRecord[]
}) {
  const items = useMemo(
    () => allItems.filter(i => i.data.variante_id === spaceId),
    [allItems, spaceId]
  )
  if (!items.length) return <p className="text-sm text-muted-foreground p-4">Sin ítems registrados en este espacio.</p>
  return (
    <ul className="divide-y text-sm">
      {items.map(item => {
        const product = allCatalog.find(p => p.id === item.data.catalogo_id)
        return (
          <li key={item.id} className="flex justify-between items-center py-2 px-3">
            <span className="font-medium">{product?.data?.descripcion ?? item.data.catalogo_id}</span>
            <span className="text-muted-foreground">{item.data.cantidad} {item.data.unidad_medida}</span>
          </li>
        )
      })}
    </ul>
  )
}

function TasksTab({ spaceId, allTasks }: {
  spaceId: string
  allTasks: TareasProduccionRecord[]
}) {
  const tasks = useMemo(
    () => allTasks.filter(t => t.data.espacio_variante_id === spaceId),
    [allTasks, spaceId]
  )
  if (!tasks.length) return <p className="text-sm text-muted-foreground p-4">Sin tareas asignadas a este espacio.</p>
  return (
    <ul className="divide-y text-sm">
      {tasks.map(task => (
        <li key={task.id} className="flex justify-between items-center py-2 px-3">
          <span>{task.data.nombre_tarea}</span>
          <Badge variant={task.data.estado === 'completada' ? 'default' : 'secondary'}>
            {task.data.estado}
          </Badge>
        </li>
      ))}
    </ul>
  )
}

function MediaTab({ spaceId, allImages }: {
  spaceId: string
  allImages: ImagenesEspacioRecord[]
}) {
  const images = useMemo(
    () => allImages.filter(img => img.data.espacio_variante_id === spaceId),
    [allImages, spaceId]
  )
  if (!images.length) return <p className="text-sm text-muted-foreground p-4">Sin imágenes de referencia para este espacio.</p>
  return (
    <div className="grid grid-cols-2 gap-2 p-3">
      {images.map(img => (
        <img
          key={img.id}
          src={img.data.imagen_url}
          alt={img.data.descripcion ?? 'Imagen de referencia'}
          className="rounded-md object-cover w-full h-28"
        />
      ))}
    </div>
  )
}

export default function Viewer3DModal({ isOpen, onClose, order }: {
  isOpen: boolean
  onClose: () => void
  order: OrdenesTrabajoRecord
}) {
  const { data: allSpaces } = useRelationData('espacio_variantes')
  const { data: allItems } = useRelationData('items_variante')
  const { data: allCatalog } = useRelationData('productos_catalogo')
  const { data: allTasks } = useRelationData('tareas_produccion')
  const { data: allImages } = useRelationData('imagenes_espacio')

  const activeSpaces = useMemo(
    () => (allSpaces as EspacioVariantesRecord[]).filter(
      s => s.data.cotizacion_id === order.data.cotizacion_id && s.data.activa
    ),
    [allSpaces, order.data.cotizacion_id]
  )

  // Un solo tab activo → un solo WebGL context activo
  const [activeTab, setActiveTab] = useState<string | undefined>(undefined)
  const defaultTab = activeSpaces[0]?.id
  const currentTab = activeTab ?? defaultTab

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Visualizador 3D — {order.data.codigo_orden}</DialogTitle>
        </DialogHeader>

        {activeSpaces.length === 0 ? (
          <p className="text-muted-foreground text-sm p-4">
            No hay espacios activos en la cotización de esta orden.
          </p>
        ) : (
          <Tabs
            value={currentTab}
            onValueChange={setActiveTab}
            className="flex-grow flex flex-col overflow-hidden"
          >
            <TabsList className="shrink-0">
              {activeSpaces.map(space => (
                <TabsTrigger key={space.id} value={space.id}>
                  {space.data.nombre_espacio}
                  {space.data.nombre_variante !== space.data.nombre_espacio && (
                    <span className="ml-1 text-xs opacity-60">({space.data.nombre_variante})</span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {activeSpaces.map(space => (
              <TabsContent key={space.id} value={space.id} className="flex-grow overflow-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg bg-muted flex items-center justify-center min-h-64">
                    {/* Solo monta ThreeScene en el tab activo → 1 WebGL context máximo */}
                    {currentTab === space.id && <ThreeScene />}
                  </div>
                  <div>
                    <Tabs defaultValue="items" className="w-full">
                      <TabsList className="w-full">
                        <TabsTrigger value="items" className="flex-1">Ítems Cotizados</TabsTrigger>
                        <TabsTrigger value="tasks" className="flex-1">Pendientes</TabsTrigger>
                        <TabsTrigger value="media" className="flex-1">Multimedia</TabsTrigger>
                      </TabsList>
                      <TabsContent value="items">
                        <ItemsTab
                          spaceId={space.id}
                          allItems={allItems as ItemsVarianteRecord[]}
                          allCatalog={allCatalog as ProductosCatalogoRecord[]}
                        />
                      </TabsContent>
                      <TabsContent value="tasks">
                        <TasksTab
                          spaceId={space.id}
                          allTasks={allTasks as TareasProduccionRecord[]}
                        />
                      </TabsContent>
                      <TabsContent value="media">
                        <MediaTab
                          spaceId={space.id}
                          allImages={allImages as ImagenesEspacioRecord[]}
                        />
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
