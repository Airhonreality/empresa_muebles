'use client';

import React, { useState } from 'react';
import { ChevronDown, Minus, Plus, Trash2, X } from 'lucide-react';
import { useCart } from './CartContext';
import { useAppState } from '@/context/AppContext';
import { getCommercialValue } from '@/lib/veta/config';
import { COP } from '@/components/specialized/cotizador/utils';

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const { items, updateQuantity, removeItem, subtotal } = useCart();
  const { data } = useAppState();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const configRecords = data['configuracion_comercial'] || [];
  const whatsappNum = getCommercialValue(configRecords, 'whatsapp_number', '+57 300 123 4567');
  const whatsappLink = getCommercialValue(configRecords, 'whatsapp_link', 'https://wa.me/573001234567');

  if (!open) return null;

  const waMessage = encodeURIComponent(
    `Hola! Me interesa cotizar los siguientes productos:\n\n${items
      .map((item) => `${item.nombre} x${item.cantidad}`)
      .join('\n')}\n\nSubtotal: ${COP.format(subtotal)}`
  );

  const waLink = `${whatsappLink}?text=${waMessage}`;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => onOpenChange(false)}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-screen w-full flex-col bg-white transition-transform duration-300 ease-in-out sm:w-96 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--veta-glass-light-border))] px-4 py-4">
          <h2 className="veta-heading text-lg font-semibold text-[hsl(var(--veta-text-carbon))]">
            Carrito ({items.length})
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[hsl(var(--veta-text-carbon))] hover:bg-[hsl(var(--veta-bg-linen))]"
            aria-label="Cerrar carrito"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {items.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center">
              <p className="text-sm text-[hsl(var(--veta-text-stone))]">Tu carrito está vacío</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.ref_id}
                  className="flex gap-3 rounded-xl border border-[hsl(var(--veta-glass-light-border))] bg-[hsl(var(--veta-bg-linen))] p-3"
                >
                  {item.imagen_url && (
                    <img
                      src={item.imagen_url}
                      alt={item.nombre}
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-[hsl(var(--veta-text-carbon))]">
                        {item.nombre}
                      </h3>
                      <p className="text-xs text-[hsl(var(--veta-text-stone))]">
                        {COP.format(item.precio_unitario)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 rounded-full border border-[hsl(var(--veta-glass-light-border))] bg-white">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.ref_id, item.cantidad - 1)}
                          className="p-1 text-[hsl(var(--veta-text-stone))] hover:text-[hsl(var(--veta-text-carbon))]"
                          aria-label="Reducir cantidad"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-medium">
                          {item.cantidad}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.ref_id, item.cantidad + 1)}
                          className="p-1 text-[hsl(var(--veta-text-stone))] hover:text-[hsl(var(--veta-text-carbon))]"
                          aria-label="Aumentar cantidad"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.ref_id)}
                        className="p-1 text-[hsl(var(--veta-text-stone))] hover:text-red-600"
                        aria-label="Quitar del carrito"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-[hsl(var(--veta-glass-light-border))] px-4 py-4">
            {/* Subtotal */}
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-[hsl(var(--veta-text-carbon))]">
                Subtotal
              </span>
              <span className="text-lg font-semibold text-[hsl(var(--veta-text-carbon))]">
                {COP.format(subtotal)}
              </span>
            </div>

            {/* Checkout Section (collapsed by default) */}
            <div className="mb-3 overflow-hidden rounded-xl border border-[hsl(var(--veta-glass-light-border))]">
              <button
                type="button"
                onClick={() => setCheckoutOpen(!checkoutOpen)}
                className="flex w-full items-center justify-between bg-[hsl(var(--veta-bg-linen))] px-4 py-3 transition-colors hover:bg-[hsl(var(--veta-gold-muted))]/10"
              >
                <span className="text-sm font-medium text-[hsl(var(--veta-text-carbon))]">
                  Finalizar compra
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    checkoutOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {checkoutOpen && (
                <div className="space-y-2 border-t border-[hsl(var(--veta-glass-light-border))] px-4 py-3">
                  {/* WhatsApp CTA */}
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full rounded-lg bg-[#25D366] px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-[#22BA5C]"
                  >
                    Cotizar por WhatsApp
                  </a>

                  {/* Payment Placeholder */}
                  <button
                    type="button"
                    disabled
                    className="block w-full rounded-lg border border-[hsl(var(--veta-glass-light-border))] bg-gray-50 px-4 py-2 text-center text-sm font-semibold text-[hsl(var(--veta-text-stone))] cursor-not-allowed opacity-60"
                    data-checkout-slot="payment-online"
                  >
                    Pago en línea (próximamente)
                  </button>
                </div>
              )}
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-full rounded-lg border border-[hsl(var(--veta-glass-light-border))] px-4 py-2 text-center text-sm font-medium text-[hsl(var(--veta-text-carbon))] transition-colors hover:bg-[hsl(var(--veta-bg-linen))]"
            >
              Seguir comprando
            </button>
          </div>
        )}
      </div>
    </>
  );
}
