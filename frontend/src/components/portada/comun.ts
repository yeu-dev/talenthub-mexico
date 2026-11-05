/** Lo que comparten las secciones de la portada: el contenedor, el h2 y el aire. */
export const CONTENEDOR = 'mx-auto max-w-page px-6 md:px-7';

export const TITULO_SECCION =
  'font-heading text-[clamp(1.5rem,2.6vw,2rem)] font-demi leading-[1.1] tracking-[-0.015em] text-ink-d';

/**
 * El aire de arriba y abajo de cada sección, fluido: unos 56px en celular y
 * hasta 104px en pantalla grande. Antes eran medidas fijas (`py-20`, `py-28`)
 * pensadas para un solo ancho: en pantalla grande quedaban bandas vacías y en
 * celular, demasiado scroll.
 */
export const AIRE_SECCION = 'py-[clamp(3.5rem,7vw,6.5rem)]';

/** El cierre lleva menos: son tres líneas y un botón. */
export const AIRE_CIERRE = 'py-[clamp(3rem,5.5vw,5rem)]';

/**
 * Las secciones partidas (texto | pieza visual): apiladas hasta `lg` y en dos
 * columnas desde ahí, alineadas arriba para que la pieza arranque a la altura
 * del título y no flote centrada en el hueco. Entre 768 y 1024px las dos
 * columnas quedaban apretadas.
 */
export const PARTIDA = 'grid items-start gap-12 lg:grid-cols-2 lg:gap-16';

/** "1 vacante" / "4 vacantes". */
export const vacantesTexto = (n: number) => `${n} ${n === 1 ? 'vacante' : 'vacantes'}`;
