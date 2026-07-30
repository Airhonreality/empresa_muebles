/**
 * tipos para páginas de espacios con enfoque de conversión
 */

export type SpaceCategory = 'cocinas' | 'closets' | 'cavas' | 'recibidores' | 'entretenimiento' | 'estudios';

/**
 * metadatos SEO generados por LLM para cada imagen
 */
export interface SeoImageData {
  imagen_filename: string;
  imagen_url: string;
  alt_text: string;
  image_title: string;
  keywords: string[];
  descripcion: string;
  structured_data?: {
    '@context'?: string;
    '@type'?: string;
    [key: string]: unknown;
  };
}

/**
 * testimonios estáticos para la página
 */
export interface TestimonialItem {
  id?: string;
  nombre_cliente: string;
  barrio: string;
  texto_resena: string;
  calificacion: number;
  proyecto_relacionado?: string;
}

/**
 * configuración de CTAs conversión-focused
 */
export interface SpaceShowcaseCtaConfig {
  whatsappLink?: string;
  calendarLink?: string;
  emailLink?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  tertiaryLabel?: string;
}

/**
 * props del componente principal
 */
export interface SpaceShowcaseProps {
  categoryId: SpaceCategory;
  title: string;
  subtitle?: string;
  description: string;
  descriptionExtended?: string;
  images: SeoImageData[];
  benefits?: string[];
  testimonials?: TestimonialItem[];
  ctaConfig?: SpaceShowcaseCtaConfig;
  processNote?: string;
  socialProofStats?: {
    projectsCompleted?: number;
    clientsSatisfied?: number;
    yearsExperience?: number;
  };
}

/**
 * props del hero component
 */
export interface SpaceShowcaseHeroProps {
  title: string;
  subtitle?: string;
  description: string;
  images: SeoImageData[];
  ctaConfig?: SpaceShowcaseCtaConfig;
  breadcrumbs?: Array<{ label: string; path?: string }>;
}

/**
 * props de la galería
 */
export interface SpaceGalleryProps {
  images: SeoImageData[];
  columns?: 2 | 3;
  showCaptions?: boolean;
  onImageClick?: (image: SeoImageData, index: number) => void;
}

/**
 * sección de descripción
 */
export interface SpaceDescriptionProps {
  title: string;
  description: string;
  benefits?: string[];
  ctaLabel?: string;
  onCtaClick?: () => void;
}

/**
 * datos completos de página (generados por script de build)
 */
export interface SpacePageData {
  categoryId: SpaceCategory;
  title: string;
  subtitle?: string;
  description: string;
  descriptionExtended?: string;
  slug: string;
  route: string;
  ogImage?: string;
  benefits?: string[];
  socialProofStats?: {
    projectsCompleted?: number;
    satisfiedClients?: number;
    yearsExperience?: number;
  };
  processNote?: string;
  ctaConfig?: SpaceShowcaseCtaConfig;
  testimonials?: TestimonialItem[];
  images: SeoImageData[];
}

/**
 * sección de testimonios
 */
export interface SpaceTestimonialsProps {
  testimonials: TestimonialItem[];
  categoryLabel?: string;
}

/**
 * social proof stats
 */
export interface SocialProofProps {
  projectsCompleted?: number;
  clientsSatisfied?: number;
  yearsExperience?: number;
}
