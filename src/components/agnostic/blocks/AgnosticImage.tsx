import { cn } from '@/lib/utils';

interface Props {
  visual?: {
    src?: string;
    alt?: string;
    caption?: string;
    fit?: 'cover' | 'contain' | 'fill';
    aspect?: 'video' | 'square' | 'portrait' | 'auto';
    rounded?: boolean;
    className?: string;
  };
  src?: string;
}

const ASPECT: Record<string, string> = {
  video:    'aspect-video',
  square:   'aspect-square',
  portrait: 'aspect-[3/4]',
  auto:     '',
};

const FIT: Record<string, string> = {
  cover:   'object-cover',
  contain: 'object-contain',
  fill:    'object-fill',
};

export function AgnosticImage({ visual, src: propSrc }: Props) {
  const { src, alt = '', caption, fit = 'cover', aspect = 'video', rounded = false, className } = visual || {};
  const effectiveSrc = propSrc || src;

  if (!effectiveSrc) return (
    <div className="w-full aspect-video bg-muted/20 rounded-xl flex items-center justify-center text-muted-foreground/30 text-xs font-bold uppercase tracking-widest">
      Sin imagen configurada
    </div>
  );

  return (
    <figure className="w-full space-y-2">
      <div className={cn("w-full overflow-hidden", ASPECT[aspect], rounded && "rounded-xl")}>
        <img
          src={effectiveSrc}
          alt={alt}
          className={cn("w-full h-full", FIT[fit] || 'object-cover', className)}
          loading="lazy"
        />
      </div>
      {caption && (
        <figcaption className="text-center text-xs text-muted-foreground/60 font-medium italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
