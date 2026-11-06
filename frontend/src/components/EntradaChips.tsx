import React, { useState } from 'react';
import { X } from './icons';
import { cx } from '../lib/cx';

/**
 * Una lista de etiquetas que se escribe: Enter o coma agrega, la X quita y
 * Retroceso con el campo vacío quita la última. Antes las habilidades eran un
 * texto con comas que el backend guardaba como un solo elemento.
 *
 * Al perder el foco, lo que quedó escrito también se agrega: así no se pierde
 * "Docker" si alguien escribe y luego da clic en Guardar.
 */
interface Props {
  id: string;
  valores: string[];
  onChange: (valores: string[]) => void;
  placeholder?: string;
  /** Para `aria-describedby`: la ayuda o el error del Field. */
  descritoPor?: string;
}

const EntradaChips: React.FC<Props> = ({ id, valores, onChange, placeholder, descritoPor }) => {
  const [texto, setTexto] = useState('');

  const agregar = (crudo: string) => {
    const nuevos = crudo
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
      .filter((v) => !valores.some((ya) => ya.toLowerCase() === v.toLowerCase()));
    if (nuevos.length) onChange([...valores, ...nuevos]);
    setTexto('');
  };

  const quitar = (indice: number) => onChange(valores.filter((_, i) => i !== indice));

  return (
    <div
      className={cx(
        'flex min-h-[46px] flex-wrap items-center gap-2 rounded-ui border border-hairline bg-white/[0.03] px-3 py-2',
        'transition-colors focus-within:border-accent focus-within:shadow-focus-accent'
      )}
    >
      {valores.map((valor, i) => (
        <span
          key={valor}
          className="inline-flex items-center gap-1 rounded-pill bg-white/[0.08] py-1 pl-3 pr-1 text-[0.875rem] text-ink"
        >
          {valor}
          <button
            type="button"
            onClick={() => quitar(i)}
            aria-label={`Quitar ${valor}`}
            className="flex h-6 w-6 items-center justify-center rounded-pill text-muted hover:bg-white/[0.08] hover:text-ink"
          >
            <X size={13} strokeWidth={2} />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={texto}
        aria-describedby={descritoPor}
        placeholder={valores.length ? '' : placeholder}
        onChange={(e) => {
          const v = e.target.value;
          if (v.includes(',')) agregar(v);
          else setTexto(v);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            agregar(texto);
          } else if (e.key === 'Backspace' && !texto && valores.length) {
            quitar(valores.length - 1);
          }
        }}
        onBlur={() => texto.trim() && agregar(texto)}
        className="min-w-[8rem] flex-1 bg-transparent py-1 text-body text-ink placeholder:text-muted focus:outline-none"
      />
    </div>
  );
};

export default EntradaChips;
