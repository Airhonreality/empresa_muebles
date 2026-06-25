'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Camera, Image as ImageIcon, Save, Plus, Loader2, X, AlertTriangle } from 'lucide-react'
import { useRelationData } from '@/lib/agnostic/hooks/useRelationData'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Props {
  varianteId: string
}

export function RegistrosTecnicosFeed({ varianteId }: Props) {
  const { data: registros, mutate } = useRelationData('registros_tecnicos')
  
  const [isAdding, setIsAdding] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  
  // Local form state
  const [etiqueta, setEtiqueta] = useState('Levantamiento de medidas')
  const [registradoPor, setRegistradoPor] = useState('')
  const [urls, setUrls] = useState<string[]>([])
  const [notas, setNotas] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Initialize userName from local storage
  useEffect(() => {
    const savedName = localStorage.getItem('veta_user_name')
    if (savedName) setRegistradoPor(savedName)
  }, [])

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [notas])

  const myRegistros = registros.filter(r => r.data.variante_id === varianteId)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    const newUrls: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fd = new FormData()
      fd.append('file', file)
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const json = await res.json()
        if (json.url) {
          newUrls.push(json.url)
        } else {
          toast.error(`Error subiendo ${file.name}: ${json.error}`)
        }
      } catch (err) {
        toast.error(`Error de red al subir ${file.name}`)
      }
    }

    if (newUrls.length > 0) {
      setUrls(prev => [...prev, ...newUrls])
      toast.success(`${newUrls.length} archivo(s) subido(s)`)
    }
    setIsUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeUrl = (index: number) => {
    setUrls(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!etiqueta || !registradoPor) {
      toast.error('Falta la etiqueta o el nombre del registrador')
      return
    }

    setIsSaving(true)
    
    // Save the user's name for next time
    localStorage.setItem('veta_user_name', registradoPor)

    const payload = {
      id: crypto.randomUUID(),
      data: {
        variante_id: varianteId,
        etiqueta_evento: etiqueta,
        registrado_por: registradoPor,
        urls_multimedia: urls.join(','),
        notas_descriptivas: notas,
      }
    }

    try {
      await fetch('/api/vault?namespace=registros_tecnicos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      toast.success('Levantamiento guardado')
      setIsAdding(false)
      setUrls([])
      setNotas('')
      mutate()
    } catch {
      toast.error('Error al guardar el levantamiento')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-white border border-stone-200 rounded-3xl shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-stone-100 flex items-center justify-center border border-stone-200">
            <Camera size={14} className="text-stone-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-800">Levantamiento y Multimedia</h3>
            <p className="text-[10px] text-stone-500 font-medium">Fotos, videos y diagramas del espacio</p>
          </div>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-full border border-amber-200/50 transition-colors flex items-center gap-1"
          >
            <Plus size={12} /> Añadir
          </button>
        )}
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        {isAdding && (
          <div className="mb-6 p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-stone-200">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Nuevo Registro</span>
              <button onClick={() => setIsAdding(false)} className="text-stone-400 hover:text-stone-600">
                <X size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-stone-500 uppercase tracking-wider">Etiqueta del evento *</label>
                <input 
                  type="text" 
                  value={etiqueta} 
                  onChange={e => setEtiqueta(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-stone-200 bg-white"
                  placeholder="Ej. Primera visita"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-stone-500 uppercase tracking-wider">Archivos Multimedia</label>
              
              <div className="flex gap-2 mb-2 flex-wrap">
                {urls.map((url, i) => (
                  <div key={i} className="relative group rounded-xl overflow-hidden border border-stone-200 h-16 w-16 bg-stone-100 flex-shrink-0">
                    {url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                      <img src={url} className="w-full h-full object-cover" alt="upload" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-[8px] text-stone-500 break-all p-1 text-center">
                        <ImageIcon size={12} className="mb-1" />
                        Archivo
                      </div>
                    )}
                    <button 
                      onClick={() => removeUrl(i)}
                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="text-xs font-bold bg-white border border-stone-200 text-stone-600 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-stone-50 transition-colors disabled:opacity-50"
                >
                  {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                  {isUploading ? 'Subiendo...' : 'Tomar Foto o Subir Archivos'}
                </button>
                <input 
                  type="file" 
                  multiple
                  accept="image/*,video/*"
                  capture="environment"
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-stone-500 uppercase tracking-wider">Notas Descriptivas</label>
              <textarea 
                ref={textareaRef}
                value={notas} 
                onChange={e => setNotas(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-stone-200 bg-white resize-none overflow-hidden min-h-[44px] max-h-[150px]"
                style={{ overflowY: notas.split('\n').length > 5 ? 'auto' : 'hidden' }}
                placeholder="Añade notas, medidas o condiciones estructurales del espacio..."
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button 
                onClick={handleSave}
                disabled={isSaving || isUploading}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-5 py-2 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Guardar Levantamiento
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {myRegistros.length === 0 && !isAdding ? (
            <div className="text-center py-8">
              <Camera size={24} className="mx-auto text-stone-300 mb-2" />
              <p className="text-xs text-stone-400 italic">Aún no hay levantamientos registrados para este espacio.</p>
            </div>
          ) : (
            myRegistros.map((reg) => (
              <div key={reg.id} className="bg-white border border-stone-200 p-4 rounded-2xl space-y-3 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-600 px-2 py-0.5 rounded border border-stone-200">
                      {reg.data.etiqueta_evento}
                    </span>
                    <p className="text-[10px] text-stone-400 mt-1">Registrado por: <span className="font-bold text-stone-600">{reg.data.registrado_por}</span></p>
                  </div>
                </div>
                
                {reg.data.notas_descriptivas && (
                  <p className="text-xs text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-100 whitespace-pre-wrap">
                    {reg.data.notas_descriptivas}
                  </p>
                )}

                {reg.data.urls_multimedia && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {reg.data.urls_multimedia.split(',').filter(Boolean).map((url: string, i: number) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer" className="block w-20 h-20 rounded-xl overflow-hidden border border-stone-200 hover:opacity-80 transition-opacity">
                        {url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                          <img src={url} alt="Evidencia" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-stone-50 text-[9px] text-stone-500">
                            <ImageIcon size={14} className="mb-1 text-stone-400" />
                            Archivo
                          </div>
                        )}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
