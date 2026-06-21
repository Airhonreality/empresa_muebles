'use client'

import React, { useState } from 'react'
import { Loader2, X, Mail, Copy, Check, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { vWrite } from './utils'

interface ContratoEmailModalProps {
  isOpen: boolean
  onClose: () => void
  contratoId: string
  emailData: {
    email: string
    subject: string
    body: string
  } | null
  onSuccess: () => void
}

export function ContratoEmailModal({
  isOpen,
  onClose,
  contratoId,
  emailData,
  onSuccess
}: ContratoEmailModalProps) {
  const [isCopied, setIsCopied] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen || !emailData) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(emailData.body)
      setIsCopied(true)
      toast.success('Cuerpo del correo copiado al portapapeles.')
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      toast.error('No se pudo copiar el texto.')
    }
  }

  const handleMarkAsSent = async () => {
    setIsSubmitting(true)
    const toastId = toast.loading('Actualizando estado del contrato a "enviado"...')
    try {
      // 1. Obtener contrato actual
      const res = await fetch('/api/vault?namespace=contratos')
      const json = await res.json()
      const contrato = (json.records || []).find((c: any) => c.id === contratoId)

      if (!contrato) {
        throw new Error('Contrato no encontrado en el sistema.')
      }

      // 2. Actualizar estado del contrato a 'enviado'
      const updatedContrato = {
        ...(contrato.data || contrato),
        estado: 'enviado'
      }
      await vWrite('contratos', contratoId, updatedContrato)

      toast.success('Contrato marcado como enviado. Cotización movida a Pre-Producción.', { id: toastId })
      onSuccess()
    } catch (err: any) {
      console.error(err)
      toast.error('Error al actualizar el contrato: ' + err.message, { id: toastId })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Generar mailto link
  const mailtoUrl = `mailto:${encodeURIComponent(emailData.email)}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-150 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <Mail size={18} />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm">
                Enviar Contrato al Cliente
              </h3>
              <p className="text-[10px] text-stone-500 font-medium">
                Copie el mensaje o use su cliente de correo predeterminado.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs text-stone-700">
          
          <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 flex flex-col gap-1">
            <span className="font-bold text-[10px] uppercase tracking-widest text-emerald-700">✓ Contrato Compilado</span>
            <p className="margin-0 leading-relaxed font-medium">
              El documento del contrato ha sido generado e impreso correctamente en formato PDF. Ahora puede notificar al cliente vía correo electrónico.
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Destinatario</label>
            <input
              type="text"
              readOnly
              value={emailData.email}
              className="w-full border border-stone-200 rounded-lg px-2.5 py-2 bg-stone-50 text-stone-600 font-semibold cursor-default"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Asunto del Correo</label>
            <input
              type="text"
              readOnly
              value={emailData.subject}
              className="w-full border border-stone-200 rounded-lg px-2.5 py-2 bg-stone-50 text-stone-600 font-semibold cursor-default"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center mb-0.5">
              <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Mensaje (Editable al enviar)</label>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 text-[10px] text-amber-700 hover:text-amber-800 font-bold transition-colors"
              >
                {isCopied ? <Check size={12} /> : <Copy size={12} />}
                {isCopied ? 'Copiado' : 'Copiar Texto'}
              </button>
            </div>
            <textarea
              readOnly
              value={emailData.body}
              rows={10}
              className="w-full border border-stone-200 rounded-lg px-2.5 py-2 bg-stone-50 font-mono text-[10px] text-stone-600 resize-none cursor-default"
            />
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-150 flex items-center justify-between gap-3">
          <a
            href={mailtoUrl}
            className="flex items-center gap-2 px-4 py-2 border border-stone-250 hover:bg-white text-stone-750 font-semibold rounded-xl transition-all shadow-sm"
          >
            <ExternalLink size={14} />
            Abrir en Cliente de Correo
          </a>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-white border border-stone-250 hover:bg-stone-50 font-semibold text-stone-600 rounded-xl transition-all disabled:opacity-50"
            >
              Cerrar
            </button>
            <button
              onClick={handleMarkAsSent}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Mail size={14} />
                  Marcar como Enviado
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
