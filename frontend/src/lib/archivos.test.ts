import { prepararFoto, validarCv } from './archivos';
import { mensajeDeError } from './errores';

const archivo = (nombre: string, bytes: number, type = '') => new File([new Uint8Array(bytes)], nombre, { type });

describe('validarCv', () => {
  it('acepta un PDF dentro del limite aunque el sistema no mande type', () => {
    expect(validarCv(archivo('cv.PDF', 1024))).toBeNull();
  });

  it('rechaza lo que no es PDF y lo que pasa de 5 MB', () => {
    expect(validarCv(archivo('cv.docx', 1024))).toBe('El CV tiene que ser un PDF.');
    expect(validarCv(archivo('cv.pdf', 6 * 1024 * 1024))).toMatch(/6\.0 MB.*5 MB/);
  });
});

describe('prepararFoto', () => {
  it('deja intacta una foto que ya cabe', async () => {
    const foto = archivo('yo.png', 1024, 'image/png');
    expect(await prepararFoto(foto)).toEqual({ foto });
  });

  it('rechaza formatos que Django no acepta', async () => {
    expect(await prepararFoto(archivo('yo.heic', 1024))).toEqual({ error: 'La foto tiene que ser JPG o PNG.' });
  });
});

describe('mensajeDeError', () => {
  const conRespuesta = (data: unknown) => ({ response: { data } });

  it('toma el mensaje de campo que manda DRF', () => {
    const error = conRespuesta({ foto: ['La imagen excede el límite permitido de 2MB.'] });
    expect(mensajeDeError(error, 'respaldo')).toBe('La imagen excede el límite permitido de 2MB.');
  });

  it('prefiere detail sobre el codigo en error', () => {
    const error = conRespuesta({ error: 'CV_MISSING', detail: 'Debes subir tu CV.' });
    expect(mensajeDeError(error, 'respaldo')).toBe('Debes subir tu CV.');
  });

  it('no muestra una pagina HTML de error', () => {
    expect(mensajeDeError(conRespuesta('<!doctype html><h1>Server Error</h1>'), 'respaldo')).toBe('respaldo');
  });

  it('distingue la red caida de un rechazo', () => {
    expect(mensajeDeError(new Error('Network Error'), 'respaldo')).toMatch(/No pudimos conectar/);
  });
});
