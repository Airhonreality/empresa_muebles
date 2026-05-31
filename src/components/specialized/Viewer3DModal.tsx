'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { OrdenesTrabajoRecord, EspacioVariantesRecord, ItemsVarianteRecord, TareasProduccionRecord } from '@/generated/agnostic-schemas'
import { useRelationData } from '@/lib/agnostic/hooks/useRelationData'
import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'

function ThreeScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const rafRef = useRef<number>(0)
  const sceneRef = useRef(new THREE.Scene())
  const cameraRef = useRef(new THREE.PerspectiveCamera(75, 16/9, 0.1, 1000))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    rendererRef.current = renderer
    cameraRef.current.position.z = 5
    sceneRef.current.background = null

    // Añadir una luz
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    sceneRef.current.add(ambientLight)
    const pointLight = new THREE.PointLight(0xffffff, 0.5)
    pointLight.position.set(2, 3, 4)
    sceneRef.current.add(pointLight)

    // Añadir un cubo de ejemplo
    const geometry = new THREE.BoxGeometry()
    const material = new THREE.MeshStandardMaterial({ color: 0x0077ff })
    const cube = new THREE.Mesh(geometry, material)
    sceneRef.current.add(cube)

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate)
      cube.rotation.x += 0.01
      cube.rotation.y += 0.01
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


export default function Viewer3DModal({ isOpen, onClose, order }: { isOpen: boolean, onClose: () => void, order: OrdenesTrabajoRecord }) {
  const { data: allSpaces } = useRelationData('espacio_variantes')

  const activeSpaces = useMemo(() => {
    return (allSpaces as EspacioVariantesRecord[] || [])
      .filter(s => s.data.cotizacion_id === order.data.cotizacion_id && s.data.activa)
  }, [allSpaces, order.data.cotizacion_id])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-4/5 flex flex-col">
        <DialogHeader>
          <DialogTitle>Visualizador 3D - {order.data.codigo_orden}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue={activeSpaces[0]?.id} className="flex-grow flex flex-col">
          <TabsList>
            {activeSpaces.map(space => (
              <TabsTrigger key={space.id} value={space.id}>{space.data.nombre_espacio}</TabsTrigger>
            ))}
          </TabsList>
          {activeSpaces.map(space => (
            <TabsContent key={space.id} value={space.id} className="flex-grow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                <div className="rounded-lg bg-muted flex items-center justify-center">
                  <ThreeScene />
                </div>
                <div>
                  <Tabs defaultValue="items" className="w-full">
                    <TabsList>
                      <TabsTrigger value="items">Ítems Cotizados</TabsTrigger>
                      <TabsTrigger value="tasks">Pendientes</TabsTrigger>
                      <TabsTrigger value="media">Multimedia</TabsTrigger>
                    </TabsList>
                    <TabsContent value="items">
                      <p className="text-sm text-muted-foreground p-4">Lista de ítems para {space.data.nombre_espacio}.</p>
                    </TabsContent>
                    <TabsContent value="tasks">
                      <p className="text-sm text-muted-foreground p-4">Lista de tareas para {space.data.nombre_espacio}.</p>
                    </TabsContent>
                     <TabsContent value="media">
                      <p className="text-sm text-muted-foreground p-4">Archivos multimedia para {space.data.nombre_espacio}.</p>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
