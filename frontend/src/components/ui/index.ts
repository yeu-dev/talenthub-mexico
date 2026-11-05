/** Capa de UI del sistema de diseño. Ver DESIGN.md en la raíz. */
export { default as Button } from './Button';
export type { ButtonProps } from './Button';

export { default as Card } from './Card';
export { default as Tag, TONO_MODALIDAD } from './Tag';
export type { TagTono } from './Tag';

export { Field, Input, Select, Textarea } from './Field';
export { default as ChoiceCards } from './ChoiceCards';
export { default as Tabs } from './Tabs';
export type { TabItem } from './Tabs';
export type { Choice } from './ChoiceCards';

export { default as ProcessTrack } from './ProcessTrack';
export type { EstadoPostulacion } from './ProcessTrack';

export { default as AuthShell } from './AuthShell';
export { default as EmptyState } from './EmptyState';
export { Skeleton, SkeletonCard, SkeletonList } from './Skeleton';
export { Dialog, ConfirmHost } from './Dialog';
