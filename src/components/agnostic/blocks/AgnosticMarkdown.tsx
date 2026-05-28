'use client';
import { cn } from '@/lib/utils';

interface Props {
  visual?: { content?: string; align?: string };
  content?: string;
}

// Produces clean semantic HTML. Styling is handled by .agnostic-md in globals.css.
// NOTE: href values are whitelisted to https?://, /, #, mailto: to block javascript: XSS.
function renderMarkdown(raw: string): string {
  return raw
    .replace(/^#{3}\s+(.+)$/gm, '<h3>$1</h3>')
    .replace(/^#{2}\s+(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#{1}\s+(.+)$/gm,  '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g,   '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,       '<em>$1</em>')
    .replace(/`(.+?)`/g,         '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, (_, text, url) => {
      const safe = /^(https?:\/\/|\/|#|mailto:)/.test(url) ? url : '#';
      const rel  = /^https?:\/\//.test(safe) ? ' rel="noopener noreferrer" target="_blank"' : '';
      return `<a href="${safe}"${rel}>${text}</a>`;
    })
    .replace(/^-\s+(.+)$/gm,    '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\n\n(.+)/g,       '\n\n<p>$1</p>');
}

export function AgnosticMarkdown({ visual, content: propContent }: Props) {
  const raw   = propContent ?? visual?.content ?? '';
  const align = visual?.align ?? 'left';

  return (
    <div
      className={cn(
        'agnostic-md w-full',
        align === 'center' && 'text-center',
        align === 'right'  && 'text-right'
      )}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(raw) }}
    />
  );
}
