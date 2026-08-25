# 🔬 Deep Research — Pregunta 3: Analítica de Comportamiento (Microsoft Clarity, Web Vitals & Mascaramiento HTML)
**Fecha:** 21 de Agosto de 2026  
**Línea:** Demanda / Arnés de Medición V3  
**Estado:** ✅ Investigación Completada  

---

## 🎯 RESUMEN DE HALLAZGOS Y SELECCIÓN DE HERRAMIENTA

### 1. Cuadro Comparativo de Estado del Arte

| Criterio | **Microsoft Clarity** | Hotjar | PostHog |
|---|---|---|---|
| **Costo** | **100% Gratis Ilimitado** | Gratuito limitado (pagos costosos) | Tier gratuito amplio (luego por evento) |
| **Sesiones / Grabaciones** | Sin límite de volumen | Límite estricto mensual | Límite por plan |
| **Detección de Frustración** | ✅ Rage Clicks, Dead Clicks, Excessive Scroll | ✅ Básico | ⚠️ Requiere setup avanzado |
| **Impacto en Web Vitals** | 🟢 Mínimo (Asíncrono total) | 🟡 Medio | 🟡 Medio |
| **Recomendado para Veta de Oro** | 🏆 **SELECCIONADO** | ❌ Descartado por costo | ❌ Descartado por complejidad |

---

## ⚡ 2. CERO DEGRADACIÓN DE RENDIMIENTO (WEB VITALS) EN NEXT.JS

Para garantizar que el script de analítica no bloquee el renderizado de imágenes de cocinas (LCP) ni genere retrasos en la respuesta al toque del cliente (INP), se utiliza el componente oficial `next/script` con la estrategia `afterInteractive`.

```tsx
// components/analytics/ClarityAnalytics.tsx
'use client';

import Script from 'next/script';

export function ClarityAnalytics() {
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

  if (!clarityId) return null;

  return (
    <Script id="microsoft-clarity-init" strategy="afterInteractive">
      {`
        (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${clarityId}");
      `}
    </Script>
  );
}
```

---

## 🛡️ 3. MASCARAMIENTO DE DATOS PRIVADOS (HABEAS DATA / LEY 1581 COLOMBIA)

Para cumplir con las leyes de protección de datos personales sin perder la visibilidad del comportamiento de navegación, aplicamos **Mascaramiento por Atributo HTML (`data-clarity-mask="true"`)** en el modal de calificación.

### Ejemplo de Implementación en los Formulario V3:

```tsx
// components/veta/AsesoriaModal.tsx (Paso 2)
<form className="space-y-4">
  {/* Campo sensible: Nombre del cliente (Se oculta en el video) */}
  <div data-clarity-mask="true">
    <label htmlFor="nombre">Nombre completo</label>
    <input id="nombre" type="text" placeholder="Ej: Carlos Mendoza" />
  </div>

  {/* Campo sensible: Teléfono WhatsApp (Se oculta en el video) */}
  <div data-clarity-mask="true">
    <label htmlFor="telefono">WhatsApp de contacto</label>
    <input id="telefono" type="tel" placeholder="300 123 4567" />
  </div>

  {/* Campo visible: Tipo de proyecto (Útil para analizar preferencias en el video) */}
  <div data-clarity-unmask="true">
    <select>
      <option>Cocina Integral Premium</option>
      <option>Amoblamiento Completo</option>
    </select>
  </div>

  <button type="submit">Contactar por WhatsApp</button>
</form>
```

### Resultado en las Grabaciones de Video:
- **Lo que ves en Clarity:** El recorrido visual exacto del usuario en la web, en qué imágenes hizo zoom, cómo llenó el modal y si se trabó.
- **Lo que se oculta:** Los datos personales (Nombre y Teléfono) se registran como asteriscos `••••••••`, protegiendo la privacidad de los clientes de Veta de Oro.
