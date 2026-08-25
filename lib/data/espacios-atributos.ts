import { HOME_IMAGES_SEO } from '@/lib/seo/home-images';

export interface AtributoTecnico {
  id: string;
  numero: string; // ej: "01", "02"
  titulo: string;
  subtitulo?: string;
  cuerpo: string;
  badge?: string;
  imageKey?: keyof typeof HOME_IMAGES_SEO;
  imageUrl?: string;
  destacado?: boolean;
}

export interface FrameAtributos {
  id: string;
  nombreFrame: string;
  layout: 'grid4' | 'hero2' | 'triptico3';
  atributos: AtributoTecnico[];
}

export const ATRIBUTOS_ESPACIOS: Record<string, FrameAtributos[]> = {
  'closets-vestidores-bogota': [
    {
      id: 'frame-1',
      nombreFrame: 'Ergonomía & Estructura',
      layout: 'grid4',
      atributos: [
        {
          id: 'cl-1',
          numero: '01',
          titulo: 'Modulación Ergonomizada',
          cuerpo: 'Espacios optimizados con zonas específicas para vestidos largos, sacos, calzado y accesorios de uso diario.',
          badge: 'Ergonomía',
          imageKey: 'espaciosClosets',
        },
        {
          id: 'cl-2',
          numero: '02',
          titulo: 'Iluminación Térmica LED',
          cuerpo: 'Perfilería de iluminación continua con sensores de presencia invisibles que cuidan la tonalidad real de la ropa.',
          badge: 'Iluminación',
          imageKey: 'validacionTaller',
        },
        {
          id: 'cl-3',
          numero: '03',
          titulo: 'Interiores Madecor RH',
          cuerpo: 'Estructuras internas antihumedad de 18mm con melamina textil de tacto suave y traseras herméticas de 9mm.',
          badge: 'Materiales',
          imageKey: 'validacionTaller',
        },
      ],
    },
    {
      id: 'frame-2',
      nombreFrame: 'Detalles de Alta Gama',
      layout: 'hero2',
      atributos: [
        {
          id: 'cl-5',
          numero: '05',
          titulo: 'Cajonería Aterciopelada & Cierre Lento',
          subtitulo: 'Organización para joyería y relojería',
          cuerpo: 'Cajones con separadores tapizados a medida y guías ocultas tipo Blum/Hettich con amortiguación hidráulica de cierre suave.',
          badge: 'Acabados VIP',
          imageKey: 'espaciosClosets',
          destacado: true,
        },
        {
          id: 'cl-6',
          numero: '06',
          titulo: 'Islas de Vestidor & Espejos Pivotantes',
          subtitulo: 'Centros de vestir contemporáneos',
          cuerpo: 'Módulos centrales con cubiertas de cristal templado, zapateras giratorias integradas y espejos de cuerpo entero con marco de madera maciza.',
          badge: 'Diseño Arquitectónico',
          imageKey: 'hero',
          destacado: true,
        },
      ],
    },
    {
      id: 'frame-3',
      nombreFrame: 'Durabilidad & Cuidado',
      layout: 'triptico3',
      atributos: [
        {
          id: 'cl-7',
          numero: '07',
          titulo: 'Puertas Batientes y Rieles de Techo',
          cuerpo: 'Sistemas correderos suspendidos de aluminio pesado que eliminan el riel de piso para facilitar la limpieza.',
          badge: 'Mecanismos',
          imageKey: 'espaciosClosets',
        },
        {
          id: 'cl-8',
          numero: '08',
          titulo: 'Herrajes de Pantalonero Extensible',
          cuerpo: 'Estructura lateral en cromo pulido para colgar pantalones de forma individual sin arrugas.',
          badge: 'Funcionalidad',
          imageKey: 'validacionTaller',
        },
        {
          id: 'cl-9',
          numero: '09',
          titulo: 'Garantía Estructural Directa',
          cuerpo: 'Ensambles mecánicos y minifix de máxima solidez respaldados directamente por el taller Veta Dorada.',
          badge: 'Respaldo',
          imageKey: 'validacionDiseñador',
        },
      ],
    },
  ],

  'cavas-y-bares': [
    {
      id: 'frame-1',
      nombreFrame: 'Preservación & Estilo',
      layout: 'grid4',
      atributos: [
        {
          id: 'cb-1',
          numero: '01',
          titulo: 'Nichos para Cava Térmica',
          cuerpo: 'Aislamiento y flujo de aire posterior diseñado para integrar enfriadores de vino de precisión.',
          badge: 'Climatización',
          imageKey: 'espaciosCavas',
        },
        {
          id: 'cb-2',
          numero: '02',
          titulo: 'Luz Escénica Regulable',
          cuerpo: 'Tiras LED cálidas de 2700K con control regulable (dimmer) para no alterar las propiedades del vino.',
          badge: 'Iluminación',
          imageKey: 'hero',
        },
        {
          id: 'cb-3',
          numero: '03',
          titulo: 'Cunas de Madera Maciza',
          cuerpo: 'Soportes angulados y torneados a medida en Roble o Nogal para almacenar botellas de guarda.',
          badge: 'Ebanistería',
          imageKey: 'validacionTaller',
        },
        {
          id: 'cb-4',
          numero: '04',
          titulo: 'Mesones Inmunes a Acidez',
          cuerpo: 'Cubiertas en Piedra Sinterizada (Dekton/Neolith) o Cuarzo resistentes a derrames de licores y cítricos.',
          badge: 'Superficies',
          imageKey: 'espaciosCavas',
        },
      ],
    },
    {
      id: 'frame-2',
      nombreFrame: 'Exhibición y Hospitalidad',
      layout: 'hero2',
      atributos: [
        {
          id: 'cb-5',
          numero: '05',
          titulo: 'Copateros Flotantes & Cristalería',
          subtitulo: 'Soporte suspendido con fondo reflejante',
          cuerpo: 'Ranuras invisibles de acrílico o bronce para colgar cristalería fina sobre fondos en espejo ahumado o panelería alistonada.',
          badge: 'Arquitectura de Interior',
          imageKey: 'espaciosCavas',
          destacado: true,
        },
        {
          id: 'cb-6',
          numero: '06',
          titulo: 'Barras Integradas con Cajonero Barman',
          subtitulo: 'Servicio y preparación sin salir de casa',
          cuerpo: 'Módulos traseros con dispensadores, posavasos ocultos y cajones con aislamiento para utensilios de coctelería.',
          badge: 'Hospitalidad VIP',
          imageKey: 'validacionDiseñador',
          destacado: true,
        },
      ],
    },
  ],

  'centros-de-entretenimiento': [
    {
      id: 'frame-1',
      nombreFrame: 'Integración Técnica & Audio',
      layout: 'grid4',
      atributos: [
        {
          id: 'ce-1',
          numero: '01',
          titulo: 'Pasacables Invisible',
          cuerpo: 'Ductos traseros integrados en la estructura alistonada para canalizar alimentación y cables HDMI sin contaminación visual.',
          badge: 'Conectividad',
          imageKey: 'espaciosCentrosEnt',
        },
        {
          id: 'ce-2',
          numero: '02',
          titulo: 'Ventilación de Consolas',
          cuerpo: 'Rejillas de disipación y perforaciones traseras calculadas para evitar calentamiento de Apple TV, PS5 o amplificadores.',
          badge: 'Climatización',
          imageKey: 'espaciosCentrosEnt',
        },
        {
          id: 'ce-3',
          numero: '03',
          titulo: 'Anclaje Pesado Muro',
          cuerpo: 'Estructuras internas reforzadas para drywall o concreto diseñadas para soportar pantallas de 75" a 98".',
          badge: 'Estructura',
          imageKey: 'validacionDiseñador',
        },
        {
          id: 'ce-4',
          numero: '04',
          titulo: 'Puertas Microperforadas',
          cuerpo: 'Frentes en madera alistonada o malla metálica que permiten el paso del control remoto infrarrojo y el sonido.',
          badge: 'Frente Técnico',
          imageKey: 'espaciosCentrosEnt',
        },
      ],
    },
    {
      id: 'frame-2',
      nombreFrame: 'Estética Flotante',
      layout: 'hero2',
      atributos: [
        {
          id: 'ce-5',
          numero: '05',
          titulo: 'Muebles Suspendidos con Luz Rasante',
          subtitulo: 'Sensación de ligereza y espacio amplio',
          cuerpo: 'Módulos inferiores flotantes con iluminación LED inferior que acentúa la textura del piso y oculta las tomas de pared.',
          badge: 'Diseño Flotante',
          imageKey: 'espaciosCentrosEnt',
          destacado: true,
        },
        {
          id: 'ce-6',
          numero: '06',
          titulo: 'Panelería Alistonada a Medida',
          subtitulo: 'Respaldo continuo de cielo a piso',
          cuerpo: 'Listones en chapilla natural de Flor Morado o Nogal montados sobre bastidores oscuros que mejoran la acústica de la sala.',
          badge: 'Acústica & Madera',
          imageKey: 'hero',
          destacado: true,
        },
      ],
    },
  ],

  'estudios-home-office': [
    {
      id: 'frame-1',
      nombreFrame: 'Productividad & Orden',
      layout: 'grid4',
      atributos: [
        {
          id: 'eo-1',
          numero: '01',
          titulo: 'Torretas Pop-Up de Energía',
          cuerpo: 'Puntos emergentes en el escritorio con tomas de 110V, USB-C de alta velocidad y carga inalámbrica.',
          badge: 'Tecnología',
          imageKey: 'espaciosEstudios',
        },
        {
          id: 'eo-2',
          numero: '02',
          titulo: 'Libreros Anti-Pandeo',
          cuerpo: 'Repisas con refuerzo interior o mayor calibre de 36mm preparadas para sostener bibliotecas y carpetas pesadas.',
          badge: 'Resistencia',
          imageKey: 'validacionTaller',
        },
        {
          id: 'eo-3',
          numero: '03',
          titulo: 'Confort Acústico',
          cuerpo: 'Revestimientos posteriores en paneles absorbedores que reducen el eco para videollamadas y grabaciones.',
          badge: 'Acústica',
          imageKey: 'espaciosEstudios',
        },
        {
          id: 'eo-4',
          numero: '04',
          titulo: 'Cajones de Seguridad',
          cuerpo: 'Cajoneras con cerradura centralizada y rieles de alta carga para documentos confidenciales y equipos.',
          badge: 'Seguridad',
          imageKey: 'espaciosEstudios',
        },
      ],
    },
    {
      id: 'frame-2',
      nombreFrame: 'Ergonomía de Trabajo',
      layout: 'hero2',
      atributos: [
        {
          id: 'eo-5',
          numero: '05',
          titulo: 'Escritorios Ejecutivos en Chapilla Natural',
          subtitulo: 'Superficies de contacto de tacto cálido',
          cuerpo: 'Escritorios a medida con bordes boleados en madera maciza, canaleta abatible para adaptadores y pasacables alineados.',
          badge: 'Ebanistería Ejecutiva',
          imageKey: 'espaciosEstudios',
          destacado: true,
        },
        {
          id: 'eo-6',
          numero: '06',
          titulo: 'Sistemas de Estantería Integrada',
          subtitulo: 'Almacenamiento oculto + nichos de exhibición',
          cuerpo: 'Combinación de puertas abatibles inferiores para impresoras y papelería con vitrinas superiores iluminadas por luz cálida.',
          badge: 'Organización Total',
          imageKey: 'hero',
          destacado: true,
        },
      ],
    },
  ],

  'consolas-recibidores': [
    {
      id: 'frame-1',
      nombreFrame: 'Primera Impresión del Hogar',
      layout: 'grid4',
      atributos: [
        {
          id: 'cr-1',
          numero: '01',
          titulo: 'Volumen Suspendido',
          cuerpo: 'Diseño flotante de profundidad reducida que despeja el suelo facilitando el paso en pasillos y accesos.',
          badge: 'Optimización',
          imageKey: 'espaciosConsolas',
        },
        {
          id: 'cr-2',
          numero: '02',
          titulo: 'Composición con Espejos',
          cuerpo: 'Paneles de madera noble emparejados con espejos biselados o flotantes para multiplicar la luz natural.',
          badge: 'Luminosidad',
          imageKey: 'hero',
        },
        {
          id: 'cr-3',
          numero: '03',
          titulo: 'Tapa de Tráfico Intenso',
          cuerpo: 'Superficies tratadas en poliuretano alto impacto o mármol sintético que soportan el roce constante de llaves.',
          badge: 'Durabilidad',
          imageKey: 'validacionTaller',
        },
        {
          id: 'cr-4',
          numero: '04',
          titulo: 'Almacenamiento Oculto',
          cuerpo: 'Cajones disimulados en la moldura inferior para correspondencia, calzador y objetos personales de entrada.',
          badge: 'Funcionalidad',
          imageKey: 'espaciosConsolas',
        },
      ],
    },
  ],

  'pisos-de-madera': [
    {
      id: 'frame-1',
      nombreFrame: 'Restauración & Pulido Técnico',
      layout: 'grid4',
      atributos: [
        {
          id: 'pm-1',
          numero: '01',
          titulo: 'Pulido Ciclónico sin Polvo',
          cuerpo: 'Maquinaria industrial alemana equipada con aspiración directa que atrapa el 99.8% del aserrín durante el lijado.',
          badge: 'Tecnología',
          imageKey: 'espaciosPisos',
        },
        {
          id: 'pm-2',
          numero: '02',
          titulo: 'Barnices Ecológicos Bona',
          cuerpo: 'Sellado al agua poliuretánico no tóxico que no amarillea la madera y conserva su veta natural con secado rápido.',
          badge: 'Protección',
          imageKey: 'validacionTaller',
        },
        {
          id: 'pm-3',
          numero: '03',
          titulo: 'Injertos Históricos a Medida',
          cuerpo: 'Reposición de tablones o parques dañados buscando listones de la misma especie y tono para igualar el patrón original.',
          badge: 'Restauración',
          imageKey: 'validacionDiseñador',
        },
        {
          id: 'pm-4',
          numero: '04',
          titulo: 'Resistencia a Tráfico Pesado',
          cuerpo: 'Tratamiento multicapa diseñado para resistir mascotas, tacones y tráfico constante en áreas residenciales o comerciales.',
          badge: 'Resistencia',
          imageKey: 'espaciosPisos',
        },
      ],
    },
  ],

  'cocinas-integrales-bogota': [
    {
      id: 'frame-1',
      nombreFrame: 'Materiales & Durabilidad',
      layout: 'grid4',
      atributos: [
        {
          id: 'ci-1',
          numero: '01',
          titulo: 'Estructura Madecor RH',
          cuerpo: 'Tableros Resistentes a la Humedad de 15mm y 18mm que mantienen su estructura intacta frente a vapores y temperatura.',
          badge: 'Durabilidad',
          imageKey: 'espaciosCocinas',
        },
        {
          id: 'ci-2',
          numero: '02',
          titulo: 'Herrajes de Alto Tráfico',
          cuerpo: 'Sistemas de cierre lento y rieles de extracción total. Soportan hasta 35kg por módulo para almacenamiento pesado.',
          badge: 'Mecanismos',
          imageKey: 'validacionTaller',
        },
        {
          id: 'ci-3',
          numero: '03',
          titulo: 'Mesones Inalterables',
          cuerpo: 'Piedra Sinterizada y Cuarzo de alta pureza. No absorben manchas de vino o limón y resisten altas temperaturas sin mantenimiento.',
          badge: 'Superficies',
          imageKey: 'hero',
        },
        {
          id: 'ci-4',
          numero: '04',
          titulo: 'Diseño Ergonomizado',
          cuerpo: 'Triángulo de trabajo optimizado (cocción, lavado, almacenaje) adaptado milimétricamente al flujo de tu espacio.',
          badge: 'Diseño Funcional',
          imageKey: 'validacionDiseñador',
        },
      ],
    },
  ],
};
