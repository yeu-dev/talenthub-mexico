import React, { useCallback, useEffect, useRef, useState } from 'react';
import Button from './Button';
import { cx } from '../../lib/cx';
import { subscribeConfirm, ConfirmRequest } from '../../lib/confirm';

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

interface DialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Panel glass sobre overlay difuminado. El glass funciona aquí porque siempre tiene contenido real debajo. */
export const Dialog: React.FC<DialogProps> = ({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  onConfirm,
  onCancel,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    // El foco arranca en Cancelar: la salida segura, no la destructiva.
    const id = window.setTimeout(() => cancelRef.current?.focus(), 20);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.clearTimeout(id);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      restoreRef.current?.focus?.();
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dlg-title"
      aria-describedby={description ? 'dlg-desc' : undefined}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      className="fixed inset-0 z-[300] flex items-center justify-center bg-night/40 p-6 backdrop-blur-[6px]"
    >
      <div
        ref={panelRef}
        className={cx(
          'w-full max-w-[430px] rounded-card p-7',
          'edge-l bg-elevated/[0.92]',
          'backdrop-blur-overlay'
        )}
      >
        <h2 id="dlg-title" className="text-h3 font-demi text-ink">
          {title}
        </h2>
        {description && (
          <p id="dlg-desc" className="mt-2.5 text-body text-ink-2">
            {description}
          </p>
        )}
        <div className="mt-7 flex justify-end gap-2.5">
          <Button ref={cancelRef} variant="ghost" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={destructive ? 'danger' : 'primary'} size="sm" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

/** Se monta una vez en App.tsx. Traduce `requestConfirm()` en un Dialog real. */
export const ConfirmHost: React.FC = () => {
  const [req, setReq] = useState<ConfirmRequest | null>(null);

  useEffect(() => subscribeConfirm((r) => setReq(r)), []);

  const settle = useCallback(
    (value: boolean) => {
      setReq((current) => {
        current?.resolve(value);
        return null;
      });
    },
    []
  );

  return (
    <Dialog
      open={req !== null}
      title={req?.title ?? ''}
      description={req?.description}
      confirmLabel={req?.confirmLabel}
      cancelLabel={req?.cancelLabel}
      destructive={req?.destructive}
      onConfirm={() => settle(true)}
      onCancel={() => settle(false)}
    />
  );
};

export default Dialog;
