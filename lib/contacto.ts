export interface ContactoCanal {
  clave: 'general' | 'pisos';
  telefono: string; // E.164 para tel:
  whatsapp: string; // dígitos para wa.me
  nombreExperto?: string;
}

export const WHATSAPP_CANALES: Record<string, ContactoCanal> = {
  general: {
    clave: 'general',
    telefono: '+573025922101',
    whatsapp: '573025922101',
  },
  pisos: {
    clave: 'pisos',
    telefono: '+573227008706',
    whatsapp: '573227008706',
    nombreExperto: 'Jair Daza',
  },
} as const;

export function obtenerCanal(clave?: string | null): ContactoCanal {
  if (clave && (clave === 'general' || clave === 'pisos') && WHATSAPP_CANALES[clave]) {
    return WHATSAPP_CANALES[clave];
  }
  return WHATSAPP_CANALES.general;
}

export function telUrl(telefono: string): string {
  return `tel:${telefono}`;
}

export function waUrl(whatsapp: string, texto: string): string {
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(texto)}`;
}
