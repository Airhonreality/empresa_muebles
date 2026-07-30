'use client';

import Link from 'next/link';
import { ArrowRight, MessageCircle } from 'lucide-react';

interface CTAButtonProps {
  href: string;
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  external?: boolean;
}

export default function CTAButton({
  href,
  label,
  variant = 'primary',
  icon,
  onClick,
  className = '',
  external = false,
}: CTAButtonProps) {
  const baseClasses =
    'inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantClasses = {
    primary:
      'bg-[hsl(var(--veta-gold-hover))] text-white hover:shadow-lg hover:scale-105 active:scale-95',
    secondary:
      'border-2 border-[hsl(var(--veta-gold-hover))] text-[hsl(var(--veta-gold-hover))] hover:bg-[hsl(var(--veta-gold-muted))]/10 hover:scale-105 active:scale-95',
    ghost:
      'text-[hsl(var(--veta-text-carbon))] hover:bg-[hsl(var(--veta-bg-linen))] hover:scale-105 active:scale-95',
  };

  const finalClasses = `${baseClasses} ${variantClasses[variant]} ${className}`;

  const content = (
    <>
      {icon}
      <span>{label}</span>
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
    </>
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`group ${finalClasses}`}
        onClick={onClick}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={`group ${finalClasses}`} onClick={onClick}>
      {content}
    </Link>
  );
}

interface WhatsAppCTAProps {
  phoneNumber: string;
  message: string;
  label?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
}

export function WhatsAppCTA({
  phoneNumber,
  message,
  label = 'Escribir por WhatsApp',
  variant = 'secondary',
  className = '',
}: WhatsAppCTAProps) {
  const encodedMessage = encodeURIComponent(message);
  const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

  return (
    <CTAButton
      href={whatsappLink}
      label={label}
      variant={variant}
      icon={<MessageCircle className="h-4 w-4" />}
      external
      className={className}
    />
  );
}
