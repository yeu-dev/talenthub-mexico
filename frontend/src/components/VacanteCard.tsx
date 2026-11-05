import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { Card, Tag, TONO_MODALIDAD } from './ui';
import { formatoSalario, haceCuanto, tecnologias, VacantePublica } from '../lib/vacantes';

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

  return (
    <Card as="article" interactive className="relative flex h-full flex-col gap-4 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-[1.1875rem] font-demi leading-snug tracking-[-0.01em] text-ink">
            <Link
              to={`/vacantes/${vacante.id}`}
              className="after:absolute after:inset-0 after:rounded-card after:content-[''] focus-visible:outline-none"
            >
              {vacante.titulo}
            </Link>
          </h3>
          <p className="mt-1 text-[0.875rem] text-muted">{vacante.empresa_nombre}</p>
        </div>
        <Tag tono={TONO_MODALIDAD[vacante.modalidad] ?? 'neutro'}>{capital(vacante.modalidad)}</Tag>
      </div>

      <p className="tabular text-[1.25rem] font-demi tracking-[-0.01em] text-ink">
        {formatoSalario(vacante.salario_min, vacante.salario_max)}
        <span className="ml-1.5 text-[0.8125rem] font-book text-muted">mensual</span>
      </p>

      {conDescripcion && vacante.descripcion && (
        <p className="max-w-[66ch] text-[0.9375rem] leading-relaxed text-ink-2">
          {vacante.descripcion.length > 180 ? `${vacante.descripcion.slice(0, 180).trimEnd()}…` : vacante.descripcion}
        </p>
      )}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-hairline pt-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {techs.map((tech) => (
            <span key={tech} className="rounded-pill bg-surface px-2.5 py-1 text-[0.8125rem] text-ink-2">
              {tech}
            </span>
          ))}
        </div>
        <p className="flex items-center gap-3 text-[0.8125rem] text-muted">
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
