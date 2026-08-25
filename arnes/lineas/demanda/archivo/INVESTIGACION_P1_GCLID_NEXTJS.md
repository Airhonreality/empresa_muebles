# 🔬 Deep Research — Pregunta 1: Atribución y Persistencia en Next.js App Router
**Fecha:** 21 de Agosto de 2026  
**Línea:** Demanda / Arnés de Medición V3  
**Estado:** ✅ Investigación Completada  

---

## 🎯 RESUMEN DE HALLAZGOS Y ESTADO DEL ARTE (2026)

### 1. La realidad de iOS 17+ y Safari ITP: No basta solo con `gclid`
En las versiones recientes de iOS y Safari (Apple Link Tracking Protection), Apple elimina agresivamente el parámetro `gclid` de las URLs en navegación privada, correos o ciertos enlaces. Para contrarrestar esto sin violar la privacidad del usuario, Google Ads utiliza **tres identificadores complementarios**:

| Identificador | Nombre | Caso de Uso Principal | Tipo de Atribución |
|---|---|---|---|
| **`gclid`** | Google Click ID | Tráfico en Android, Windows, Mac (Chrome/Edge/Firefox) | Determinista (Nivel Usuario) |
| **`wbraid`** | Web/Browser Ad ID | Tráfico web en iOS / Safari (Búsquedas y Display) | Agregada (Nivel Cohorte / Colectiva) |
| **`gbraid`** | Google/Browser Ad ID | Tráfico App-to-Web o Apps de Google en iOS | Agregada (Nivel Cohorte / Colectiva) |

> ⚠️ **REGLA TÉCNICA OBLIGATORIA:** Toda arquitectura de captura en 2026 **DEBE** interceptar y persistir el trío completo (`gclid`, `wbraid`, `gbraid`) junto con los parámetros UTM estándar (`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`).

---

## 🏗️ ARQUITECTURA TÉCNICA EN NEXT.JS (APP ROUTER)

Para lograr una captura transparente sin causar retrasos en la carga ni problemas de **CLS (Cumulative Layout Shift)**, se aplica un patrón híbrido (`sessionStorage` + Cookie First-Party).

### A. El Componente Headless: `AttributionTracker.tsx`

En Next.js App Router, el hook `useSearchParams()` exige estar envuelto en una frontera `<Suspense>` para evitar deshabilitar la optimización estática de las páginas indexables.

```tsx
// components/analytics/AttributionTracker.tsx
'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export function AttributionTrackerInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Lista de parámetros de atribución a capturar
    const trackingKeys = [
      'gclid',
      'wbraid',
      'gbraid',
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content'
    ];

    trackingKeys.forEach((key) => {
      const value = searchParams.get(key);
      if (value) {
        // 1. Guardar en sessionStorage (Válido para la pestaña actual, 100% inmune a adblockers de cookies)
        sessionStorage.setItem(`veta_${key}`, value);

        // 2. Guardar en Cookie First-Party (Válido por 90 días, accesible desde Server Actions)
        document.cookie = `veta_${key}=${encodeURIComponent(value)}; path=/; max-age=7776000; SameSite=Lax; ${
          window.location.protocol === 'https:' ? 'Secure' : ''
        }`;
      }
    });
  }, [searchParams]);

  return null; // Componente invisible (Headless)
}
```

### B. Inyección Global en `app/layout.tsx`

```tsx
// app/layout.tsx
import { Suspense } from 'react';
import { AttributionTrackerInner } from '@/components/analytics/AttributionTracker';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Suspense fallback={null}>
          <AttributionTrackerInner />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
```

---

## 🔄 RECUPERACIÓN DE DATOS AL CONVERTIR (MODAL DE 2 PASOS)

Cuando el lead llena el formulario en el modal pre-contacto:

1. **Lectura Client-Side:** El formulario lee los valores de `sessionStorage` (fallback a `document.cookie`).
2. **Payload hacia la BD (PostgreSQL):**
   ```json
   {
     "nombre": "Carlos Mendoza",
     "telefono": "+573001234567",
     "tipo_proyecto": "cocina",
     "ubicacion": "Bogotá Norte",
     "gclid": "Cj0KCQjw...",
     "wbraid": "CjkKEQi...",
     "gbraid": null,
     "utm_source": "google",
     "utm_campaign": "cocinas_nov_2023"
   }
   ```
3. **Servidor (Server Action / Drizzle ORM):** Almacena el registro en la tabla `leads`, dejando la semilla intacta para la importación offline de conversiones cuando el vendedor cierre el contrato en el ERP.

---

## ✅ BENEFICIOS CLAVE
- **CLS 0.00:** No afecta el layout ni degrada las métricas Core Web Vitals.
- **Resistencia a ITP (Safari/iOS):** Al usar cookies First-Party con `SameSite=Lax` y capturar `wbraid/gbraid`, la atribución no se rompe en iPhones.
- **Persistencia Multi-Página:** Si el usuario entra por el Home, navega a `/cocinas`, luego a `/portafolio` y convierte 10 minutos después, los parámetros originales de Google Ads se preservan intactos.
