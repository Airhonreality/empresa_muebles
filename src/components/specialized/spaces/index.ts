/**
 * Exporta todos los componentes de espacios high-design
 */

// Componentes de página únicos
export { default as CochinasPage } from './CochinasPage';
export { default as ClosetsPage } from './ClosetsPage';
export { default as CavasPage } from './CavasPage';
export { default as RecibidoresPage } from './RecibidoresPage';
export { default as EntretenimientoPage } from './EntretenimientoPage';
export { default as EstudiosPage } from './EstudiosPage';

// Componentes compartidos
export { default as ImageGallery } from './shared/ImageGallery';
export { default as BeforeAfterSlider } from './shared/BeforeAfterSlider';
export { default as CTAButton, WhatsAppCTA } from './shared/CTAButton';

// Hooks reutilizables
export {
  useScrollAnimation,
  useCountUp,
} from './shared/useScrollAnimation';
export {
  useParallax,
  useScrollReveal,
} from './shared/useParallax';

// Tipos
export type {
  SeoImageData,
  TestimonialItem,
  CTAConfig,
  SocialProofStats,
  SpacePageBaseProps,
  CochinasPageProps,
  ClosetsPageProps,
  CavasPageProps,
  RecibidoresPageProps,
  EntretenimientoPageProps,
  EstudiosPageProps,
} from './types';
