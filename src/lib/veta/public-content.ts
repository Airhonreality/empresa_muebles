/**
 * Shapes that may cross from the public server boundary to browser UI.
 * They deliberately do not contain storage identifiers or source relations.
 */
export type PublicCommercialRecord = {
  data: {
    llave: string;
    valor: string;
  };
};

export type PublicTestimonial = {
  data: {
    nombre_cliente: string;
    barrio?: string;
    texto_resena: string;
    calificacion?: number;
  };
};

export type PublicHomeSpace = {
  nombre_espacio: string;
  categoria_espacio?: string;
  descripcion: string;
  materiales: string[];
  imagen_url?: string;
};

export type PublicHomeContent = {
  commercial_config: PublicCommercialRecord[];
  testimonials: PublicTestimonial[];
  spaces: PublicHomeSpace[];
};
