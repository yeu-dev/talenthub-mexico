/**
 * Los mismos limites que AspiranteSerializer.validate_cv / validate_foto en el
 * backend. Revisarlos al elegir el archivo evita esperar la subida completa
 * para enterarse de que Django lo rechaza.
 */
const MAX_CV = 5 * 1024 * 1024;
const MAX_FOTO = 2 * 1024 * 1024;

/** El lado mayor de la foto. Para un avatar de 80px sobra; para el peso, es lo que manda. */
const LADO_FOTO = 1024;

const megas = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const extension = (nombre: string) => nombre.slice(nombre.lastIndexOf('.')).toLowerCase();

/** null si el CV sirve; si no, el mensaje para el usuario. */
export const validarCv = (archivo: File): string | null => {
  // Django decide por la extension; algunos sistemas mandan type vacio.
  if (extension(archivo.name) !== '.pdf') return 'El CV tiene que ser un PDF.';
  if (archivo.size > MAX_CV) return `Tu CV pesa ${megas(archivo.size)}. El máximo es 5 MB.`;
  return null;
};

const cargarImagen = (archivo: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(archivo);
    const imagen = new Image();
    imagen.onload = () => {
      URL.revokeObjectURL(url);
      resolve(imagen);
    };
    imagen.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No pudimos leer la imagen.'));
    };
    imagen.src = url;
  });

/**
 * Una foto de celular pesa 3–8 MB y el limite es 2: se reduce a 1024px en
 * JPEG antes de subirla. Solo se toca si hace falta, porque un PNG chico con
 * transparencia perderia el fondo al pasar a JPEG.
 */
const comprimir = async (archivo: File): Promise<File> => {
  const imagen = await cargarImagen(archivo);
  const escala = Math.min(1, LADO_FOTO / Math.max(imagen.width, imagen.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(imagen.width * escala);
  canvas.height = Math.round(imagen.height * escala);

  const contexto = canvas.getContext('2d');
  if (!contexto) return archivo;
  // JPEG no tiene transparencia: sin fondo, lo transparente sale negro.
  contexto.fillStyle = '#ffffff';
  contexto.fillRect(0, 0, canvas.width, canvas.height);
  contexto.drawImage(imagen, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
  if (!blob) return archivo;

  const nombre = `${archivo.name.replace(/\.[^.]+$/, '') || 'foto'}.jpg`;
  return new File([blob], nombre, { type: 'image/jpeg' });
};

/** La foto lista para subir, o el mensaje de por que no se puede. */
export const prepararFoto = async (archivo: File): Promise<{ foto: File } | { error: string }> => {
  if (!['.jpg', '.jpeg', '.png'].includes(extension(archivo.name))) {
    return { error: 'La foto tiene que ser JPG o PNG.' };
  }
  if (archivo.size <= MAX_FOTO) return { foto: archivo };

  try {
    const reducida = await comprimir(archivo);
    if (reducida.size <= MAX_FOTO) return { foto: reducida };
  } catch {
    // Si el navegador no la puede leer, cae al mensaje de abajo.
  }
  return { error: `Tu foto pesa ${megas(archivo.size)} y no pudimos reducirla a menos de 2 MB.` };
};
