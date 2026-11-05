import React from 'react';
import { cx } from '../../lib/cx';

interface Props {
  className?: string;
  /** Alto en px cuando no se pasa className con altura. */
  height?: number;
}

/** Sustituye los `<div>Cargando vacantes...</div>`. El pulso respeta reduced-motion vía index.css. */
export const Skeleton: React.FC<Props> = ({ className, height }) => (
  <div
    aria-hidden="true"
    style={height ? { height } : undefined}
    className={cx('animate-pulse rounded-ui bg-white/[0.06]', !height && 'h-4', className)}
  />
);

/** Placeholder con la silueta de una card de vacante. */
export const SkeletonCard: React.FC = () => (
  <div className="rounded-card border border-hairline p-6">
    <Skeleton className="h-6 w-1/2" />
    <Skeleton className="mt-3 h-4 w-1/4" />
    <Skeleton className="mt-5 h-4 w-full" />
    <Skeleton className="mt-2 h-4 w-4/5" />
    <div className="mt-6 flex items-center justify-between">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-9 w-28 rounded-pill" />
    </div>
  </div>
);

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div role="status" aria-live="polite" aria-busy="true" className="flex flex-col gap-3.5">
    <span className="sr-only">Cargando…</span>
    {Array.from({ length: count }, (_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export default Skeleton;
