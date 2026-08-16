export type HomeImageSeoFlow = {
  src: string;
  alt: string;
  title: string;
  keywords: string[];
  caption?: string;
  section: string;
};

export const HOME_IMAGES_SEO: Record<string, HomeImageSeoFlow> = {
  hero: {
    section: 'Hero',
    src: '/images/home/cocina-integral-madera-bogota-1.webp',
    alt: 'Cocina integral en madera diseñada y fabricada por Veta Dorada en Bogotá',
    title: 'Cocina integral instalada en Bogotá — Veta Dorada',
    caption: 'Cocina integral instalada en Bogotá',
    keywords: ['cocina integral', 'carpinteria arquitectonica', 'muebles madera bogota']
  },
  validacion3d: {
    section: 'ValidacionTecnica_1',
    src: '/images/home/diseno-3d-visualizacion-previa-bogota-1.webp',
    alt: 'Visualización de diseño 3D previa a fabricación — Veta Dorada',
    title: 'Visualización de diseño 3D para proyecto a medida',
    keywords: ['diseño 3d muebles', 'previsualizacion carpinteria']
  },
  validacionTaller: {
    section: 'ValidacionTecnica_2',
    src: '/images/home/taller-fabricacion-muebles-madera-bogota-1.webp',
    alt: 'Taller de fabricación de muebles en madera — Veta Dorada, Bogotá',
    title: 'Taller propio de fabricación de muebles en Bogotá',
    keywords: ['fabrica muebles bogota', 'taller carpinteria']
  },
  validacionDiseñador: {
    section: 'ValidacionTecnica_3',
    src: '/images/home/disenador-industrial-midiendo-espacio-bogota-1.webp',
    alt: 'Diseñador industrial de Veta Dorada midiendo espacio en Bogotá',
    title: 'Visita y medición técnica en espacio',
    keywords: ['medicion muebles medida', 'asesoría diseño bogota']
  },
  espaciosCocinas: {
    section: 'GridCategorias',
    src: '/images/home/cocinas-integrales-diseno-fabricacion-bogota-1.webp',
    alt: 'Cocina integral diseñada y fabricada a la medida en Bogotá por Veta Dorada',
    title: 'Cocina integral a la medida en Bogotá',
    caption: 'Cocina integral instalada en Bogotá',
    keywords: ['cocinas integrales', 'cocinas a medida']
  },
  espaciosClosets: {
    section: 'GridCategorias',
    src: '/images/home/closets-vestidores-madera-amedida-bogota-1.webp',
    alt: 'Closet vestidor en madera diseñado a la medida, interior visible — Veta Dorada',
    title: 'Closet y vestidor en madera a la medida',
    caption: 'Closet vestidor con diseño interior a medida',
    keywords: ['closets medida', 'vestidores madera', 'armarios bogota']
  },
  espaciosCentrosEnt: {
    section: 'GridCategorias',
    src: '/images/home/centros-entretenimiento-mueble-tv-iluminacion-bogota-1.webp',
    alt: 'Centro de entretenimiento y mueble de TV en madera con iluminación integrada',
    title: 'Mueble de TV y centro de entretenimiento con iluminación',
    caption: 'Mueble de TV con diseño de iluminación integrada',
    keywords: ['centro entretenimiento', 'mueble tv madera']
  },
  espaciosEstudios: {
    section: 'GridCategorias',
    src: '/images/home/estudios-home-office-escritorio-amedida-bogota-1.webp',
    alt: 'Estudio y home office con escritorio y estantería a la medida — Veta Dorada',
    title: 'Estudio y home office con mobiliario a la medida',
    caption: 'Escritorio y estantería de home office a medida',
    keywords: ['muebles estudio', 'escritorios medida', 'home office bogota']
  },
  espaciosCavas: {
    section: 'GridCategorias',
    src: '/images/home/cavas-bares-madera-iluminacion-bogota-1.webp',
    alt: 'Cava bar en madera diseñada a la medida con iluminación detallada',
    title: 'Cava bar en madera para residencia',
    caption: 'Cava y bar en madera con luz perimetral',
    keywords: ['cava madera', 'bares para casa']
  },
  espaciosConsolas: {
    section: 'GridCategorias',
    src: '/images/home/consolas-recibidores-madera-entrada-bogota-1.webp',
    alt: 'Consola de madera para recibidor en espacio residencial — Veta Dorada',
    title: 'Consola y recibidor en madera para hogar',
    caption: 'Consola recibidor en madera para residencia',
    keywords: ['consolas madera', 'muebles recibidor']
  },
  espaciosPisos: {
    section: 'GridCategorias',
    src: '/images/home/pisos-madera-restauracion-bogota-1.webp',
    alt: 'Restauración de piso de madera maciza en residencia de Bogotá',
    title: 'Restauración de piso de madera maciza',
    caption: 'Restauración de pisos en madera',
    keywords: ['restauracion pisos madera', 'pisos madera bogota']
  }
};
