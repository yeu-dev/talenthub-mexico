/**
 * El mensaje que de verdad mando el backend.
 *
 * DRF responde los errores en varias formas: {detail}, {message}, {error} o
 * {campo: ['mensaje']}. Mostrar un texto fijo en su lugar hizo que una foto de
 * mas de 2 MB se anunciara como "el nombre de usuario ya está tomado".
 */
const primerTexto = (valor: unknown): string | null => {
  if (!valor) return null;
  if (typeof valor === 'string') return valor.trim().startsWith('<') ? null : valor;
  if (Array.isArray(valor)) return primerTexto(valor[0]);
  if (typeof valor === 'object') {
    const datos = valor as Record<string, unknown>;
    for (const llave of ['detail', 'message', 'error']) {
      if (typeof datos[llave] === 'string' && datos[llave]) return datos[llave] as string;
    }
    for (const anidado of Object.values(datos)) {
      const texto = primerTexto(anidado);
      if (texto) return texto;
    }
  }
  return null;
};

export const mensajeDeError = (error: unknown, respaldo: string): string => {
  const respuesta = (error as { response?: { data?: unknown } } | null)?.response;
  // Sin respuesta es red caida o Render todavia despertando, no un rechazo.
  if (!respuesta) return 'No pudimos conectar con TalentHub. Revisa tu conexión e intenta de nuevo.';
  return primerTexto(respuesta.data) || respaldo;
};
