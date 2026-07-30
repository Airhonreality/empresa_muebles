/**
 * Tipos compartidos para páginas de espacios high-design
 */

export interface SeoImageData {
  imagen_filename: string;
  imagen_url: string;
  alt_text: string;
  image_title: string;
  keywords: string[];
  descripcion: string;
  structured_data?: Record<string, any>;
}

export interface TestimonialItem {
  nombre_cliente: string;
  barrio: string;
  texto_resena: string;
  calificacion: number;
  proyecto_relacionado: string;
}

export interface CTAConfig {
  whatsappLink: string;
  calendarLink: string;
  primaryLabel: string;
  secondaryLabel: string;
}

export interface SocialProofStats {
  projectsCompleted?: number;
  clientsSatisfied?: number;
  yearsExperience?: number;
}

/**
 * Props base para todas las páginas de espacios
 */
export interface SpacePageBaseProps {
  title: string;
  description: string;
  images: SeoImageData[];
  testimonials: TestimonialItem[];
  ctaConfig: CTAConfig;
  socialProofStats?: SocialProofStats;
}

/**
 * Props específicas para cada tipo de página
 */
export interface CochinasPageProps extends SpacePageBaseProps {
  descriptionExtended?: string;
  benefits?: string[];
  processNote?: string;
}

export interface ClosetsPageProps extends SpacePageBaseProps {
  descriptionExtended?: string;
  benefits?: string[];
  processNote?: string;
}

export interface CavasPageProps extends SpacePageBaseProps {
  descriptionExtended?: string;
  benefits?: string[];
  processNote?: string;
}

export interface RecibidoresPageProps extends SpacePageBaseProps {
  descriptionExtended?: string;
  benefits?: string[];
  processNote?: string;
}

export interface EntretenimientoPageProps extends SpacePageBaseProps {
  descriptionExtended?: string;
  benefits?: string[];
  processNote?: string;
}

export interface EstudiosPageProps extends SpacePageBaseProps {
  descriptionExtended?: string;
  benefits?: string[];
  processNote?: string;
}
