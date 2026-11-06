import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Navigate, Routes, Route, useLocation, useNavigationType } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { Toaster } from 'sileo';
import Navbar from './components/navbar';
import Footer from './components/footer';
import AppPromo from './components/AppPromo';
import { PromoAppProvider, usePromoApp } from './components/PromoApp';
import { cx } from './lib/cx';
import { ConfirmHost } from './components/ui';
import api from './services/api';
import Home from './pages/Home';
import FondoVivo from './components/fondos/FondoVivo';
import { diferida, EsperaPagina } from './lib/cargaDiferida';

/*
 * La portada va en el archivo principal porque es la primera que se abre. Las
 * demás se descargan aparte, al visitarlas. `webpackPrefetch` las precarga en
 * segundo plano cuando la primera página ya terminó: así la siguiente abre al
 * instante, y el service worker las guarda para usarlas sin conexión.
 */
const Login = diferida(() => import(/* webpackPrefetch: true */ './pages/Login'));
const Register = diferida(() => import(/* webpackPrefetch: true */ './pages/Register'));
const Vacantes = diferida(() => import(/* webpackPrefetch: true */ './pages/Vacantes'));
const VacanteDetalle = diferida(() => import(/* webpackPrefetch: true */ './pages/VacanteDetalle'));
const Dashboard = diferida(() => import(/* webpackPrefetch: true */ './pages/Dashboard'));
const MisAplicaciones = diferida(() => import(/* webpackPrefetch: true */ './pages/MisAplicaciones'));
const AplicacionesEmpresa = diferida(() => import(/* webpackPrefetch: true */ './pages/AplicacionesEmpresa'));
const Planes = diferida(() => import(/* webpackPrefetch: true */ './pages/planes'));
const Checkout = diferida(() => import(/* webpackPrefetch: true */ './pages/Checkout'));
const DashboardValidador = diferida(() => import(/* webpackPrefetch: true */ './pages/DashboardValidador'));
const PerfilAspirante = diferida(() => import(/* webpackPrefetch: true */ './pages/PerfilAspirante'));
const SolicitarRecuperacion = diferida(() => import(/* webpackPrefetch: true */ './pages/auth/SolicitarRecuperacion'));
const RestablecerPassword = diferida(() => import(/* webpackPrefetch: true */ './pages/auth/RestablecerPassword'));
const PoliticasPrivacidad = diferida(() => import(/* webpackPrefetch: true */ './pages/PoliticasPrivacidad'));
const NoEncontrada = diferida(() => import(/* webpackPrefetch: true */ './pages/NoEncontrada'));
const Empresas = diferida(() => import(/* webpackPrefetch: true */ './pages/Empresas'));

/**
 * El contenido de cada página. Mientras la tarjeta de la app está abierta, en
 * escritorio deja libre la columna derecha donde flota; al minimizarla, la
 * página se estira con una transición del padding. La franja de `PageHeader`
 * se mete debajo de esa columna con la misma transición, para que su orilla
 * siga pegada al borde mientras la página se estira.
 */
const Pagina: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { mostrar, mini } = usePromoApp();
  return (
    <div
      className={cx(
        'transition-[padding] duration-500 ease-base motion-reduce:transition-none',
        mostrar && !mini && 'lg:pr-[340px]'
      )}
    >
      {children}
    </div>
  );
};

/**
 * El velo vivo de la portada, a todo el ancho de la ventana. Vive aquí y no en
 * `Home` porque `Pagina` reserva la columna del aviso de la app: dentro de ella
 * el velo se cortaba en seco a la altura de esa columna.
 */
const FondoPortada: React.FC = () => {
  const { pathname } = useLocation();
  return pathname === '/' ? <FondoVivo /> : null;
};

/**
 * Cada navegación arranca arriba de la página nueva.
 *
 * `BrowserRouter` no restaura el scroll por su cuenta: antes, al seguir un
 * enlace desde el pie se llegaba a la otra página ya hasta abajo. Ahora:
 * - un enlace (PUSH) sube hasta arriba, incluso de `/vacantes` a
 *   `/vacantes?q=Python`, porque es otra búsqueda;
 * - "atrás" (POP) también sube;
 * - los filtros de `/vacantes` escriben la URL con `replace` mientras se
 *   teclea: ahí NO se sube, o la página brincaría a cada tecla.
 *
 * El salto es instantáneo: con el scroll suave del sitio se vería pasar la
 * página de antes. `scrollRestoration = 'manual'` evita que el navegador
 * intente poner su propia posición encima de esta.
 */
export const AlInicio: React.FC = () => {
  const { key } = useLocation();
  const tipo = useNavigationType();

  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
  }, []);

  useEffect(() => {
    if (tipo === 'REPLACE') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [key, tipo]);

  return null;
};

/**
 * Despierta al servidor de Render en cuanto se abre la app, sin esperar la
 * respuesta. El plan gratis lo duerme cuando nadie lo usa y la primera
 * petición tarda hasta un minuto; así, mientras alguien lee la portada o
 * escribe su usuario en el login, el servidor ya va despertando. Es
 * `silencioso`: no enciende la barra de carga, porque nadie lo está esperando.
 */
const useDespertarServidor = () => {
  useEffect(() => {
    api.get('/planes/', { silencioso: true }).catch(() => {});
  }, []);
};

function App() {
  useDespertarServidor();
  // `reducedMotion="user"`: framer-motion lee la preferencia del sistema. Si
  // está activa, apaga desplazamientos, escalas y `layoutId` (las líneas que
  // se deslizan) y deja los cambios de opacidad y color. Si no, todo se ve
  // igual que siempre. Sin esto, la regla de index.css solo cubría el CSS.
  return (
    <MotionConfig reducedMotion="user">
    <Router>
      <PromoAppProvider>
      <AlInicio />
      <FondoPortada />
      <Navbar />
      <Pagina>
      <Suspense fallback={<EsperaPagina />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/vacantes" element={<Vacantes />} />
        <Route path="/vacantes/:id" element={<VacanteDetalle />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/mis-aplicaciones" element={<MisAplicaciones />} />
        <Route path="/aplicaciones-empresa" element={<AplicacionesEmpresa />} />
        {/* `/perfil` era la misma página que `/mi-perfil` con otro import; se
            queda solo como redirección para los enlaces viejos. */}
        <Route path="/perfil" element={<Navigate to="/mi-perfil" replace />} />
        <Route path="/planes" element={<Planes />} />
        <Route path="/empresas" element={<Empresas />} />
        <Route path="/checkout/:planId" element={<Checkout />} />
        <Route path="/validador" element={<DashboardValidador />} />
        <Route path="/mi-perfil" element={<PerfilAspirante />} />
        <Route path="/olvide-password" element={<SolicitarRecuperacion />} />
        {/* El :uid y :token son vitales para que useParams funcione */}
        <Route path="/restablecer-password/:uid/:token" element={<RestablecerPassword />} />
        <Route path="/politicas" element={<PoliticasPrivacidad />} />
        {/* Cualquier otra ruta: la página de "no encontrada", no un hueco. */}
        <Route path="*" element={<NoEncontrada />} />
      </Routes>
      </Suspense>

      <Footer />
      </Pagina>

      {/* Aviso de la app: en todas las páginas públicas hasta que se inicia sesión. */}
      <AppPromo />

      {/*
        Notificaciones. OJO con `theme`: sileo lo nombra por el color del TEXTO,
        no de la superficie. "light" = texto claro = burbuja oscura, que es la
        que va con el sitio, todo en oscuro.
      */}
      <Toaster theme="light" position="bottom-center" options={{ roundness: 18 }} />

      {/* Resuelve las promesas de showConfirm(); sileo no hace confirmaciones */}
      <ConfirmHost />
      </PromoAppProvider>
    </Router>
    </MotionConfig>
  );
}

export default App;
