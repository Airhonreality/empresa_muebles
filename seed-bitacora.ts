import { db } from './lib/db/client'
import { bitacoraArticulos } from './lib/db/schema'

async function seed() {
  console.log('Seeding Bitácora...')
  
  await db.insert(bitacoraArticulos).values([
    {
      slug: 'guia-materiales-carpinteria-bogota',
      titulo: 'Guía de materiales para muebles a la medida: Tableros, Maderas y Acabados',
      extracto: 'Depende del uso. Para cocinas y closets, los tableros melamínicos RH de 15mm o 18mm son el estándar de durabilidad. Para mobiliario de autor, maderas naturales...',
      contenidoLargo: `## 1. Tableros Melamínicos (La base contemporánea)
* **Mates vs. Alto Brillo:** Acabados mates antihuella para elegancia sobria; alto brillo (PET) para reflejar luz.
* **Calibre 15mm vs 18mm:** 15mm para estructuras ligeras; **18mm** (el estándar Veta Dorada) para puertas, frentes y máxima resistencia estructural.

## 2. Maderas Naturales (El alma del oficio)
* **Flor Morado:** Estándar intermedio. Vetas marcadas, excelente comportamiento frente a la humedad.
* **Zapan:** Alta densidad para tráfico extremo (escalones).
* **Teca:** Resistencia natural e indeclinable para exteriores.

## 3. Tipos de Acabados (El tacto final)
* **Poro Abierto:** Sella la madera pero respeta su relieve natural al tacto. Orgánico y contemporáneo.
* **Poro Lleno:** Sellado total con laca de poliuretano. Superficie lisa y uniforme.`,
      categoria: 'materiales_tecnica',
      imagenPortada: '/images/portafolio/reales/hero_piso_madera_1786816269387.png', // Fallback temporal para la demo
      fechaPublicacion: new Date().toISOString(),
      publicado: true,
    },
    {
      slug: 'como-tomar-medidas-espacio-muebles',
      titulo: 'Cómo tomar medidas de tu espacio para cotizar un mueble a la medida',
      extracto: 'Utiliza la nomenclatura X, Y, Z (Ancho, Profundo, Alto). Mide muros de piso a techo. Para cocinas, no midas áreas cuadradas, sino los metros lineales de mueble...',
      contenidoLargo: `## 1. El lenguaje universal: X, Y, Z
X (Ancho: Izquierda a derecha), Y (Profundo: Pared a frente), Z (Alto: Piso a techo).

## 2. Cocinas: El concepto de "Metro Lineal"
En carpintería no usamos metros cuadrados para cocinas. Mides el ancho de la pared (X) para definir tus **metros lineales** de mueble inferior y superior.

## 3. Closets y Vestidores: Modulación básica
Se mide el nicho total. La modulación básica incluye: Maletero superior, área de colgar larga y corta, y cajoneras/zapateras (donde se concentra la inversión en herrajes).`,
      categoria: 'diseno_arquitectura',
      imagenPortada: null,
      fechaPublicacion: new Date().toISOString(),
      publicado: true,
    },
    {
      slug: '3-senales-restauracion-pisos-madera',
      titulo: '3 señales de que el piso de madera de su casa necesita restauración urgente',
      extracto: 'Un piso original de granadillo o guayacán en una casona bogotana no es un elemento decorativo más: es patrimonio arquitectónico.',
      contenidoLargo: `**El valor de lo auténtico**
Un piso original en una casona bogotana es patrimonio arquitectónico. No se reemplaza por piso laminado; se le devuelve la vida a la madera maciza.

**Las 3 alertas:**
1. **Pérdida del sellador:** El piso luce opaco y el agua penetra manchando la madera.
2. **Rayones que cruzan la veta:** Daños por mascotas o muebles arrastrados.
3. **Tablillas sueltas (Dilataciones):** Ranuras que acumulan cera o tablillas que suenan.

> **CTA Puente:** Un piso de madera antigua no se reemplaza, se restaura con el trato de un maestro carpintero. **👉 [Conozca nuestro servicio especializado de Restauración de Pisos y agende un diagnóstico técnico aquí](/espacios/pisos-de-madera)**.`,
      categoria: 'mantenimiento',
      imagenPortada: '/images/portafolio/reales/piso_madera_antes_1786816277765.png',
      fechaPublicacion: new Date().toISOString(),
      publicado: true,
    }
  ]).onConflictDoNothing({ target: bitacoraArticulos.slug })
  
  console.log('Seed completo!')
}

seed().catch(console.error).finally(() => process.exit(0))
