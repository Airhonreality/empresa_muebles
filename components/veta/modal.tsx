'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/veta/button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-modal bg-overlay-backdrop data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed left-[50%] top-[50%] z-modal grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border-subtle bg-bg-raised p-6 shadow-xl duration-200 ease-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-bottom-2 sm:max-w-lg"
        >
          <Dialog.Title className="font-display text-xl font-semibold text-text-heading">
            {title}
          </Dialog.Title>
          <Dialog.Description asChild>
            <div className="text-sm text-text-muted">{children}</div>
          </Dialog.Description>
          <Dialog.Close asChild>
            <Button
              variant="icon"
              size="md"
              className="absolute right-4 top-4 rounded-sm text-text-muted hover:text-text-heading"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </Button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}