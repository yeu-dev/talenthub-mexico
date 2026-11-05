import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from './icons';
import { Card, Tag, TONO_MODALIDAD } from './ui';
import Iniciales from './Iniciales';
import { haceCuanto, partesSalario, tecnologias, VacantePublica } from '../lib/vacantes';

interface Props {
  vacante: VacantePublica;
  /** El listado muestra un extracto de la descripción; la portada no. */
  conDescripcion?: boolean;
}

const capital = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

/**
 * La tarjeta de una vacante, igual en la portada y en el listado.
 *
 * El salario es el dato principal, no una línea más: es lo que distingue a
 * TalentHub y lo que la gente busca primero. Toda la tarjeta lleva al
 * detalle: el título es el enlace y su `after` cubre la tarjeta, así el
 * lector de pantalla anuncia un solo enlace con el nombre del puesto.
 */
const VacanteCard: React.FC<Props> = ({ vacante, conDescripcion = false }) => {
  const techs = tecnologias(vacante).slice(0, 3);
  const fecha = haceCuanto(vacante.fecha_publicacion);
  const tono = TONO_MODALIDAD[vacante.modalidad] ?? 'neutro';
  const modalidad = capital(vacante.modalidad);
  const salario = partesSalario(vacante.salario_min, vacante.salario_max);

  return (
    // `reflejo`: una franja de luz cruza la tarjeta al pasar el cursor (index.css).
    <Card as="article" glass interactive className="reflejo relative flex h-full flex-col gap-4 p-6">
      <div className="flex items-start justify-between gap-4">
        <Iniciales nombre={vacante.empresa_nombre} />
        <div className="min-w-0 flex-1">
          <h3 className="text-[1.1875rem] font-demi leading-snug tracking-[-0.01em] text-ink">
            <Link
              to={`/vacantes/${vacante.id}`}
              // El foco se dibuja en el `after`, que cubre la tarjeta: el
              // anillo rodea toda la tarjeta y no solo el título.
              className="after:absolute after:inset-0 after:rounded-card after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-accent-on-dark"
            >
              {vacante.titulo}
            </Link>
          </h3>
          <p className="mt-1 text-[0.875rem] text-muted">{vacante.empresa_nombre}</p>
        </div>
        {/* En celular la etiqueta baja junto a la ubicación: arriba le quitaba
            tanto ancho al título que "Full Stack" y el "MXN" del sueldo
            brincaban de renglón. */}
        <span className="hidden flex-none sm:block">
          <Tag tono={tono}>{modalidad}</Tag>
        </span>
      </div>

      <p className="tabular text-[1.25rem] font-demi tracking-[-0.01em] text-ink">
        {/* La moneda va con "mensual", en chico y sin partirse: así la cifra
            cabe en un renglón en celular, igual que en la lista de la portada. */}
        {/* La cifra no se parte en el guion: si no cabe, baja entera la moneda. */}
        <span className="whitespace-nowrap">{salario.cifra}</span>
        {salario.conMoneda && (
          <span className="ml-1.5 whitespace-nowrap text-[0.8125rem] font-book text-muted">MXN mensual</span>
        )}
      </p>

      {conDescripcion && vacante.descripcion && (
        <p className="max-w-[66ch] text-[0.9375rem] leading-relaxed text-ink-2">
          {vacante.descripcion.length > 180 ? `${vacante.descripcion.slice(0, 180).trimEnd()}…` : vacante.descripcion}
        </p>
      )}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-hairline pt-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {techs.map((tech) => (
            <span key={tech} className="rounded-pill bg-white/[0.06] px-2.5 py-1 text-[0.8125rem] text-ink-2">
              {tech}
            </span>
          ))}
        </div>
        <p className="flex flex-wrap items-center gap-3 text-[0.8125rem] text-muted">
          <span className="sm:hidden">
            <Tag tono={tono}>{modalidad}</Tag>
          </span>
          <span className="flex items-center gap-1">
            <MapPin size={13} strokeWidth={1.7} aria-hidden="true" />
            {vacante.ubicacion}
          </span>
          {fecha && <span>{fecha}</span>}
        </p>
      </div>
    </Card>
  );
};

export default VacanteCard;
