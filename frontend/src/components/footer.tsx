import React, { useEffect, useState } from 'react';
import Brand from './Brand';
import { Link, useLocation } from 'react-router-dom';
import { cx } from '../lib/cx';
import { RESPONSABLE, hayContacto } from '../lib/responsable';
import { useCambiosDeSesion } from '../lib/sesion';
import { rutaBusqueda, stackPresente, vacantesPorCiudad } from '../lib/vacantes';
import { vacantesPublicas } from '../lib/vacantesPublicas';

/**
 * "Empleos por": búsquedas sacadas de las vacantes publicadas, las tres
 * tecnologías y las tres ciudades con más vacantes. Como los chips de la
 * portada, nunca una escrita a mano: si la API no responde, la columna no sale.
 */
const useEmpleosPor = () => {
  const [enlaces, setEnlaces] = useState<{ etiqueta: string; ruta: string }[]>([]);
  useEffect(() => {
    let vivo = true;
    vacantesPublicas()
      .then((vacantes) => {
        if (!vivo) return;
        setEnlaces([
          ...stackPresente(vacantes, 3).map((t) => ({ etiqueta: `Empleos de ${t}`, ruta: rutaBusqueda({ q: t }) })),
          ...vacantesPorCiudad(vacantes, 3).map((c) => ({ etiqueta: `Empleos en ${c.etiqueta}`, ruta: rutaBusqueda({ lugar: c.etiqueta }) })),
        ]);
      })
      .catch(() => undefined);
    return () => {
      vivo = false;
    };
  }, []);
  return enlaces;
};

/**
 * Cierre del sitio, en registro oscuro.
 *
 * No existía. Cada página terminaba en seco — se acababa el contenido y el
 * documento se cortaba — y eso es lo que hacía sentir al Home "incompleto"
 * aunque la composición estuviera bien: no tenía dónde aterrizar.
 *
 * Solo enlaza rutas que existen en `App.tsx`. Un footer con secciones vacías
 * o redes inventadas se nota más que no tenerlo.
 */

const enlace = 'text-[0.9375rem] text-muted-d transition-colors duration-200 hover:text-ink-d';

const Columna: React.FC<{ titulo: string; children: React.ReactNode }> = ({ titulo, children }) => (
  <div>
    <p className="mb-4 text-caption uppercase tracking-[0.06em] text-ink-2d">{titulo}</p>
    <ul className="flex list-none flex-col gap-3 p-0">{children}</ul>
  </div>
);

const Footer: React.FC = () => {
  const { pathname } = useLocation();
  // Los enlaces dependen de la sesión: si vence, el pie vuelve a los de visitante.
  useCambiosDeSesion();
  const empleosPor = useEmpleosPor();

  // Las pantallas de sesión y el checkout son superficies cerradas: entras,
  // resuelves una cosa y sales. Un footer ahí solo ofrece salidas.
  const cerrada =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/olvide-password' ||
    pathname.startsWith('/restablecer-password') ||
    pathname.startsWith('/checkout');

  if (cerrada) return null;

  const token = localStorage.getItem('token');
  const tipo = localStorage.getItem('user_tipo');

  return (
    <footer className="border-t border-hairline-d bg-night text-ink-d">
      <div className="mx-auto max-w-page px-6 py-16 md:px-7">
        <div
          className={cx(
            'grid grid-cols-2 gap-x-8 gap-y-12',
            empleosPor.length > 0 ? 'md:grid-cols-4 lg:grid-cols-[1.5fr_1fr_1.2fr_1fr_1fr]' : 'lg:grid-cols-[1.5fr_1fr_1fr_1fr]'
          )}
        >
          <div className="col-span-2 lg:col-span-1">
            <Brand />
            <p className="mt-3 max-w-[34ch] text-[0.9375rem] leading-relaxed text-muted-d">
              Vacantes de TI en México con el rango salarial a la vista desde el primer día.
            </p>
          </div>

          <Columna titulo="Explorar">
            <li>
              <Link to="/vacantes" className={enlace}>
                Vacantes
              </Link>
            </li>
            <li>
              <Link to="/planes" className={enlace}>
                Planes
              </Link>
            </li>
            {!token && (
              <li>
                <Link to="/empresas" className={enlace}>
                  Para empresas
                </Link>
              </li>
            )}
          </Columna>

          {empleosPor.length > 0 && (
            <Columna titulo="Empleos por">
              {empleosPor.map(({ etiqueta, ruta }) => (
                <li key={ruta}>
                  <Link to={ruta} className={enlace}>
                    {etiqueta}
                  </Link>
                </li>
              ))}
            </Columna>
          )}

          <Columna titulo="Cuenta">
            {!token && (
              <>
                <li>
                  <Link to="/login" className={enlace}>
                    Iniciar sesión
                  </Link>
                </li>
                <li>
                  <Link to="/register" className={enlace}>
                    Crear cuenta
                  </Link>
                </li>
              </>
            )}
            {token && tipo === 'aspirante' && (
              <>
                <li>
                  <Link to="/mi-perfil" className={enlace}>
                    Mi perfil
                  </Link>
                </li>
                <li>
                  <Link to="/mis-aplicaciones" className={enlace}>
                    Mis postulaciones
                  </Link>
                </li>
              </>
            )}
            {token && tipo === 'empresa' && (
              <>
                <li>
                  <Link to="/dashboard" className={enlace}>
                    Mis vacantes
                  </Link>
                </li>
                <li>
                  <Link to="/aplicaciones-empresa" className={enlace}>
                    Postulaciones recibidas
                  </Link>
                </li>
              </>
            )}
            {token && tipo === 'validador' && (
              <li>
                <Link to="/validador" className={enlace}>
                  Centro de validación
                </Link>
              </li>
            )}
          </Columna>

          <Columna titulo="Legal">
            <li>
              <Link to="/politicas" className={enlace}>
                Aviso de privacidad
              </Link>
            </li>
            {/* El aviso designa este correo como canal para ejercer derechos
                ARCO, asi que tiene que existir en la interfaz: un aviso que
                remite a un contacto invisible concede un derecho que nadie
                puede ejercer. Aparece solo cuando el buzon esta configurado
                — un mailto vacio seria peor que no tenerlo. */}
            {hayContacto() && (
              <li>
                <a href={`mailto:${RESPONSABLE.correo}`} className={enlace}>
                  Contacto
                </a>
              </li>
            )}
          </Columna>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-hairline-d pt-7">
          <p className={cx('tabular text-[0.875rem] text-muted-d')}>
            © {new Date().getFullYear()} TalentHub México
          </p>
          <p className="text-[0.875rem] text-muted-d">
            Cada vacante pasa por revisión antes de publicarse.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
