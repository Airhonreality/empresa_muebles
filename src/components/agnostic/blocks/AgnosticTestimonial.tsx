import { cn } from '@/lib/utils';

interface Props {
  visual?: {
    quote?: string;
    author?: string;
    role?: string;
    avatar?: string;
    variant?: 'card' | 'minimal';
  };
}

export function AgnosticTestimonial({ visual }: Props) {
  const { quote = '', author = '', role = '', avatar, variant = 'card' } = visual || {};
  const initials = avatar || author.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  if (variant === 'minimal') {
    return (
      <blockquote className="border-l-4 border-primary pl-6 space-y-3">
        <p className="text-lg italic text-muted-foreground leading-relaxed">"{quote}"</p>
        <footer className="text-sm font-bold uppercase tracking-wider">
          {author}{role && <span className="font-normal opacity-60 ml-2">— {role}</span>}
        </footer>
      </blockquote>
    );
  }

  return (
    <div className="bg-muted/20 border border-border/50 rounded-2xl p-8 space-y-4">
      <p className="text-base leading-relaxed text-foreground/80 italic">"{quote}"</p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-black text-sm flex items-center justify-center shrink-0">
          {initials}
        </div>
        <div>
          <div className="text-sm font-bold">{author}</div>
          {role && <div className="text-xs text-muted-foreground">{role}</div>}
        </div>
      </div>
    </div>
  );
}
