'use client'
import React, { useState, useEffect } from 'react'
import type { BlockProps } from 'packages/core/src/types'
import { useAppState, useAppDispatch } from '@/context/AppContext'
import VetaHeader from './VetaHeader'
import VetaFooter from './VetaFooter'
import { Calendar, Phone, CheckCircle2, ShieldAlert, ArrowRight, Loader2, Sparkles } from 'lucide-react'

export default function VetaAgendar({ block = {}, records, api }: Partial<BlockProps>) {
  const { saveItem } = useAppDispatch()
  const { system: { schemas } } = useAppState()

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Retrieve lead schemas definition dynamically to prevent tight coupling of fields in src/
  const leadsSchema = schemas.find(s => s.data?.name === 'leads')
  const schemaFields = leadsSchema?.data?.fields || []

  // Hydration fallback fields mapping to secure layout during initial client rendering
  const fallbackFields = [
    { key: 'nombre_completo', label: 'Nombre Completo', type: 'text', required: true },
    { key: 'telefono_whatsapp', label: 'Teléfono / WhatsApp', type: 'text', required: true },
    { key: 'email', label: 'Correo Electrónico', type: 'text', required: true },
    { key: 'barrio_zona', label: 'Barrio / Zona de Residencia', type: 'text', required: true },
    { 
      key: 'tipo_espacio', 
      label: 'Tipo de Espacio', 
      type: 'select', 
      required: true,
      options: [
        { label: 'Cocina Integral', value: 'Cocina' },
        { label: 'Cava de Vinos / Bar', value: 'Cava' },
        { label: 'Dormitorio / Closet', value: 'Dormitorio' },
        { label: 'Mesa de Comedor', value: 'Comedor' },
        { label: 'Consola / Recibidor', value: 'Consola' },
        { label: 'Otro Proyecto a Medida', value: 'Otro' }
      ]
    },
    { key: 'mensaje', label: 'Mensaje o Notas adicionales', type: 'textarea', required: false }
  ]

  const activeFields = schemaFields.length > 0 ? schemaFields : fallbackFields

  // Dynamic state values dictionary indexed by field keys
  const [form, setForm] = useState<Record<string, any>>({})

  // Initialize form default options
  useEffect(() => {
    const initialValues: Record<string, any> = {}
    activeFields.forEach(f => {
      initialValues[f.key] = f.type === 'select' && f.options?.[0] ? f.options[0].value : ''
    })
    setForm(initialValues)
  }, [leadsSchema])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic verification of required fields loaded dynamically
    const missingFields = activeFields.filter(f => f.required && !form[f.key])
    if (missingFields.length > 0) {
      setError(`Por favor completa los campos requeridos: ${missingFields.map(f => f.label).join(', ')}`)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Safe ID generation compliant with Anti-pattern 4
      const id = typeof window !== 'undefined' && window.crypto?.randomUUID ? window.crypto.randomUUID() : undefined
      
      // Save item using the Agnostic system central state manager without field leak
      await saveItem('leads', {
        id,
        data: form
      })
      
      setSuccess(true)
    } catch (err: any) {
      console.error(err)
      setError('Hubo un error al registrar tu solicitud. Por favor intenta de nuevo o contáctanos por WhatsApp.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] font-sans flex flex-col selection:bg-[#D4C5A1]/30 selection:text-[#F5F5F5]">
      <VetaHeader />

      {/* Main Container */}
      <section className="flex-grow py-20 px-6 relative overflow-hidden flex items-center justify-center">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#D4C5A1]/5 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
          {/* Left Column: Info pitch */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-2 text-xs font-semibold text-[#D4C5A1] uppercase tracking-[0.2em]">
                <Calendar className="w-4 h-4 shrink-0" />
                <span>Asesoría Personalizada</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold font-outfit uppercase tracking-tight text-[#F5F5F5] leading-tight">
                Diseñemos tu Espacio
              </h1>
              <p className="text-sm text-[#8E8A80] font-light leading-relaxed">
                Agenda tu visita presencial sin compromiso alguno. Nuestros diseñadores y arquitectos se encargarán de materializar tu visión.
              </p>
            </div>

            <div className="space-y-6 pt-4 border-t border-[#D4C5A1]/10">
              <div className="flex items-start space-x-3.5">
                <CheckCircle2 className="w-5 h-5 text-[#D4C5A1] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#F5F5F5]">Visita & Medidas Gratis</h4>
                  <p className="text-xs text-[#8E8A80] leading-relaxed mt-1">
                    Nos trasladamos a tu obra u hogar para tomar medidas físicas precisas sin costo de traslado.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3.5">
                <CheckCircle2 className="w-5 h-5 text-[#D4C5A1] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#F5F5F5]">Render Descontable</h4>
                  <p className="text-xs text-[#8E8A80] leading-relaxed mt-1">
                    Solo pagas el valor del render fotorrealista. Si decides mandar a fabricar con nosotros, ese valor se resta de tu cotización.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3.5">
                <Phone className="w-5 h-5 text-[#D4C5A1] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#F5F5F5]">Contacto Veloz</h4>
                  <p className="text-xs text-[#8E8A80] leading-relaxed mt-1">
                    Te contactaremos en un lapso de 2 horas hábiles para acordar la hora y fecha de la visita.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="lg:col-span-7">
            {success ? (
              <div className="veta-glass-card p-10 text-center space-y-6 border-[#D4C5A1]/30 bg-[#D4C5A1]/5 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-[#D4C5A1]/10 border border-[#D4C5A1]/20 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 text-[#D4C5A1]" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold font-outfit uppercase tracking-wider text-[#F5F5F5]">
                    ¡Solicitud Recibida!
                  </h2>
                  <p className="text-sm text-[#D4C5A1] font-semibold">
                    Un asesor se contactará contigo en breve.
                  </p>
                </div>
                <p className="text-xs text-[#8E8A80] leading-relaxed max-w-sm mx-auto">
                  Hemos registrado tus datos. En menos de 2 horas hábiles, un arquitecto de Veta Dorada te enviará un mensaje de WhatsApp o te llamará para confirmar tu visita gratuita.
                </p>
                <div className="pt-4">
                  <button
                    onClick={() => {
                      setSuccess(false)
                      const initialValues: Record<string, any> = {}
                      activeFields.forEach(f => {
                        initialValues[f.key] = f.type === 'select' && f.options?.[0] ? f.options[0].value : ''
                      })
                      setForm(initialValues)
                    }}
                    className="w-full py-3 rounded-sm border border-[#D4C5A1]/20 text-xs font-bold uppercase tracking-wider text-[#F5F5F5] hover:bg-white/5 transition-colors"
                  >
                    Enviar otra Solicitud
                  </button>
                </div>
              </div>
            ) : (
              <form 
                onSubmit={handleSubmit}
                className="veta-glass-card p-8 md:p-10 space-y-6 bg-white/2"
              >
                <h3 className="text-lg font-bold font-outfit uppercase tracking-wider text-[#F5F5F5] border-b border-[#D4C5A1]/10 pb-4">
                  Formulario de Agendamiento
                </h3>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-sm text-xs text-red-400 flex items-center space-x-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Form fields rendered dynamically via leads Schema Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeFields.map((field) => {
                    // Custom layout width spans mapping dynamically
                    const isFullWidth = field.key === 'nombre_completo' || field.type === 'textarea'
                    const wrapperClass = isFullWidth ? 'col-span-1 md:col-span-2' : 'col-span-1'
                    
                    return (
                      <div key={field.key} className={`${wrapperClass} space-y-1.5`}>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#8E8A80]" htmlFor={field.key}>
                          {field.label} {field.required ? '*' : ''}
                        </label>
                        
                        {field.type === 'select' ? (
                          <select
                            id={field.key}
                            name={field.key}
                            value={form[field.key] || ''}
                            onChange={handleChange}
                            className="w-full bg-[#0A0A0A] border border-[#D4C5A1]/20 focus:border-[#D4C5A1]/60 focus:ring-0 text-[#F5F5F5] px-4 py-3 rounded-sm text-sm transition-colors duration-300"
                            required={field.required}
                          >
                            {field.options?.map((opt: any) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : field.type === 'textarea' ? (
                          <textarea
                            id={field.key}
                            name={field.key}
                            value={form[field.key] || ''}
                            onChange={handleChange}
                            placeholder="Cuéntanos un poco más sobre las ideas o estilo que te gustaría para tu espacio..."
                            className="w-full h-32 bg-[#0A0A0A] border border-[#D4C5A1]/20 focus:border-[#D4C5A1]/60 focus:ring-0 text-[#F5F5F5] px-4 py-3 rounded-sm text-sm transition-colors duration-300 placeholder:text-[#8E8A80]/40 resize-none"
                            required={field.required}
                          />
                        ) : (
                          <input
                            type="text"
                            id={field.key}
                            name={field.key}
                            value={form[field.key] || ''}
                            onChange={handleChange}
                            placeholder={`Ej. ${field.label}`}
                            className="w-full bg-[#0A0A0A] border border-[#D4C5A1]/20 focus:border-[#D4C5A1]/60 focus:ring-0 text-[#F5F5F5] px-4 py-3 rounded-sm text-sm transition-colors duration-300 placeholder:text-[#8E8A80]/40"
                            required={field.required}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="pt-2 text-[10px] text-[#8E8A80] leading-relaxed flex items-start space-x-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#D4C5A1] shrink-0 mt-0.5" />
                  <span>Al hacer clic en enviar aceptas nuestras políticas de privacidad. Tu información se encuentra protegida bajo estricta confidencialidad por Hermanos García González SAS.</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full veta-btn-gold py-4 rounded-sm text-xs font-bold uppercase tracking-widest flex items-center justify-center space-x-2 transition-all duration-300 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#0A0A0A]" />
                      <span>Registrando Solicitud...</span>
                    </>
                  ) : (
                    <>
                      <span>Solicitar Visita Presencial Sin Costo</span>
                      <ArrowRight className="w-4 h-4 text-[#0A0A0A]" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <VetaFooter />
    </div>
  )
}
