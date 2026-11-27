# 🔬 Deep Research — Pregunta 2: Enhanced Conversions for Leads y Normalización SHA-256
**Fecha:** 21 de Agosto de 2026  
**Línea:** Demanda / Arnés de Medición V3  
**Estado:** ✅ Investigación Completada  

---

## 🎯 RESUMEN DE HALLAZGOS Y ESTADO DEL ARTE (2026)

### 1. La Evolución de OCI (Offline Conversion Import) a Enhanced Conversions for Leads
Anteriormente (OCI Tradicional), si un usuario en iPhone entraba a la web y Safari eliminaba el `gclid`, la conversión offline se perdía para siempre.

En el estándar unificado de Google Ads (vía **Google Data Manager API**), la conversión offline **combina dos capas de matching**:

```
           ┌──────────────────────────────────────────┐
           │     DATOS DE CONVERSIÓN ENVIADOS          │
           │  (GCLID + Teléfono/Email Hasheado SHA-256)│
           └────────────────────┬─────────────────────┘
                                │
               ┌────────────────┴────────────────┐
               ▼                                 ▼
      ¿Tiene GCLID válido?             ¿GCLID fue bloqueado/borrado?
               │                                 │
               ▼                                 ▼
      [Matching Determinista]            [Matching por Identidad]
   Match exacto con el clic original    Match con la cuenta de Google
   (Puntuación de calidad 100%)         asociada a ese número/email
```

> 💡 **RESULTADO:** Esta combinación permite recuperar entre el **25% y 40% de las conversiones perdidas en usuarios de Apple/Safari**.

---

## 🔐 REQUISITOS TÉCNICOS DE ESTANDARIZACIÓN Y HASHING (E.164 + SHA-256)

Para que Google Ads pueda hacer "match" entre el número de teléfono que el cliente ingresa en el modal y la base de datos de usuarios de Google, los datos deben cumplir estándares estrictos **ANTES** de ser procesados por SHA-256.

### Reglas de Formato para Teléfonos:
1. **Formato E.164 estricto:** Debe incluir código de país, seguido del número local, **sin espacios, sin guiones, sin paréntesis**.
   - ❌ Incorrecto: `(302) 592-2101`, `3025922101`, `302 592 2101`
   - ✅ Correcto: `+573025922101`
2. **Minúsculas y Trim:** Eliminar cualquier espacio al inicio o final.
3. **Algoritmo de Hashing:** Digest SHA-256 en formato Hexadecimal.

---

## 💻 IMPLEMENTACIÓN TÉCNICA EN NODE.JS / NEXT.JS BACKEND

Utilizamos la librería ligera `libphonenumber-js` para validar y transformar el teléfono en Colombia antes de hashearlo.

```typescript
// lib/security/user-hashing.ts
import { createHash } from 'crypto';
import { parsePhoneNumberWithError } from 'libphonenumber-js';

export interface UserUserData {
  hashedPhone?: string;
  hashedEmail?: string;
  rawE164Phone?: string;
}

/**
 * Normaliza y hashea un número telefónico de Colombia al estándar E.164 SHA-256
 */
export function normalizeAndHashPhone(rawPhone: string, countryCode = 'CO'): UserUserData {
  try {
    // 1. Limpiar espacios iniciales/finales
    const cleaned = rawPhone.trim();

    // 2. Parsear a formato E.164 (+57XXXXXXXXXX)
    const phoneNumber = parsePhoneNumberWithError(cleaned, countryCode as any);

    if (!phoneNumber.isValid()) {
      throw new Error(`Número de teléfono inválido: ${rawPhone}`);
    }

    const e164Phone = phoneNumber.format('E.164'); // Resultado: "+573025922101"

    // 3. Hashear en SHA-256 (Hexadecimal)
    const hashedPhone = createHash('sha256')
      .update(e164Phone)
      .digest('hex');

    return {
      hashedPhone,
      rawE164Phone: e164Phone
    };
  } catch (error) {
    console.error('Error al normalizar teléfono para Enhanced Conversions:', error);
    return {};
  }
}
```

---

## 🚀 FLUJO DE INTEGRACIÓN CON EL EMBUDO HÍBRIDO

1. **Cliente ingresa teléfono en el Modal:** `"302 592 2101"`
2. **Frontend / API Route V3:**
   - Guarda el teléfono limpio en la BD `leads` (para WhatsApp).
   - Genera el `hashedPhone` en SHA-256: `a4b7f9...`
   - Almacena en la BD `leads` tanto el `gclid` (si existe) como el `hashedPhone`.
3. **Disparo de la Conversión (Frontend o Server-Side API):**
   - Se envía a Google Ads el paquete doble: `{ gclid: "Cj0K...", user_data: { sha256_phone_number: "a4b7f9..." } }`.
4. **Cierre de Venta en el ERP (Offline Import):**
   - Cuando el vendedor marca el proyecto como "Contrato Firmado", el ERP dispara la conversión offline a Google Data Manager pasando ambos identificadores.
