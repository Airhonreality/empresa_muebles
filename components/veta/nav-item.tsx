'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/veta/button';

interface NavItemProps {
  href: string;
  label: string;
  desc: string;
}

export function NavItem({ href, label, desc }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <Link href={href} className="flex-1 sm:flex-none">
      <Button
        variant={isActive ? 'primary' : 'ghost'}
        size="md"
        className="w-full justify-start gap-2 px-3 py-2"
        aria-current={isActive ? 'page' : undefined}
      >
        <span className="font-medium">{label}</span>
        <span className="hidden sm:inline text-xs font-normal text-text-muted">{desc}</span>
        {isActive && <span aria-hidden className="ml-auto h-1.5 w-1.5 rounded-full bg-brand" />}
      </Button>
    </Link>
  );
}