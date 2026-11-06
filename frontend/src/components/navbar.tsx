import React, { useState, useEffect } from "react";
import BarraCarga from './BarraCarga';
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "./icons";
import { clasesBoton } from "./ui";
import { cx } from "../lib/cx";
import { EASE, DUR, SPRING } from "../lib/motion";
import Brand from "./Brand";
import Campana from "./Campana";
import MenuCuenta from "./MenuCuenta";
import { useCambiosDeSesion } from "../lib/sesion";
import { olvidarFotoCuenta, useFotoCuenta } from "../lib/fotoCuenta";
import { useChispas } from "../hooks/useChispas";

// La sección actual: texto blanco y una línea azul en el borde de la barra
// que se DESLIZA de un link al otro al cambiar de página (layoutId), en vez
// de apagarse en uno y prenderse en otro.
const linkClass = ({ isActive }: { isActive: boolean }) =>
  cx(
    "relative text-[0.9375rem] transition-colors duration-200 hover:text-white",
    isActive ? "text-white" : "text-white/90"
  );

const Enlace: React.FC<{ to: string; enMenu: boolean; className?: string; children: React.ReactNode }> = ({
  to,
  enMenu,
  className,
  children,
}) => (
  <NavLink to={to} className={(estado) => cx(linkClass(estado), className)}>
    {({ isActive }) => (
      <>
        {children}
        {isActive && !enMenu && (
          <motion.span
            layoutId="nav-activo"
            transition={SPRING}
            className="absolute -bottom-[22px] left-0 right-0 h-[2px] rounded-pill bg-accent-on-dark"
          />
        )}
      </>
    )}
  </NavLink>
);

/**
 * Barra de vidrio oscuro de ancho completo, pegada arriba, con el logo.
 *
 * Translúcida con desenfoque: sobre las bandas oscuras se funde, y sobre el
 * contenido claro se ve pasar la página por debajo. La sección actual se
 * marca con una línea azul en el borde inferior de la barra.
 */
/**
 * "Registrarse", la llamada a la acción de la barra: es un enlace con forma de
 * botón destacado (borde de luz al pasar el cursor y chispas al hacer clic,
 * ver `Button`). Componente propio porque la barra lo pinta dos veces, en
 * escritorio y en el menú del celular, y cada una necesita su propio lienzo.
 */
const EnlaceRegistro: React.FC = () => {
  const { lienzo, disparar } = useChispas();
  return (
    <Link
      to="/register"
      onClick={disparar}
      className={clasesBoton({ variant: 'primary', tone: 'dark', size: 'sm', destacado: true })}
    >
      Registrarse
      {lienzo}
    </Link>
  );
};

const Navbar: React.FC = () => {
  const location = useLocation();
  // Las pantallas de acceso usan AuthShell, que trae su propio logo y ocupa
  // toda la pantalla: ahi la barra sobra.
  const isAuthPage = ["/login", "/register", "/olvide-password", "/restablecer-password"].some(
    (ruta) => location.pathname === ruta || location.pathname.startsWith(`${ruta}/`)
  );

  // Si la sesión vence en una página pública, la barra pasa a "Iniciar sesión"
  // sin recargar: el interceptor de la API avisa con `cerrarSesionLocal`.
  useCambiosDeSesion();
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("user_username");
  const tipo = localStorage.getItem("user_tipo");

  const foto = useFotoCuenta(tipo, Boolean(token));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Cerrar el menú al cambiar de ruta: si no, queda abierto sobre la página nueva.
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const logout = () => {
    olvidarFotoCuenta();
    localStorage.clear();
    window.location.href = "/";
  };

  if (isAuthPage) return null;

  // El logo es el "inicio" de cada rol: con sesión la barra no lleva enlaces.
  let rutaLogo = "/";
  if (token) {
    rutaLogo = tipo === "empresa" ? "/dashboard" : tipo === "validador" ? "/validador" : "/vacantes";
  }

  // La sección actual se marca: texto blanco y una línea azul debajo. Antes
  // todos los links se veían igual y no se sabía en qué página se estaba.
  const linkPlano = "text-[0.9375rem] text-white/90 transition-colors duration-200 hover:text-white";

  /**
   * Los enlaces de la barra, solo para visitantes. Con sesión la barra lleva
   * logo, campana y avatar, y todas las secciones viven en el menú de cuenta:
   * antes salían en la barra, en el menú y en las pestañas de la página.
   */
  const navLinks = (enMenu: boolean) => (
    <>
      <Enlace to="/vacantes" enMenu={enMenu}>
        Vacantes
      </Enlace>
      <Enlace to="/planes" enMenu={enMenu}>
        Planes
      </Enlace>
      {/* La portada para quien contrata. */}
      <Enlace to="/empresas" enMenu={enMenu}>
        Para empresas
      </Enlace>
      <Enlace to="/politicas" enMenu={enMenu}>
        Privacidad
      </Enlace>
    </>
  );

  // 60% de negro, no menos: con el texto al 90% es lo mínimo que pasa AA
  // (4.62:1) incluso cuando lo que pasa por debajo es blanco puro.
  return (
    <div className="sticky top-0 z-50 border-b border-hairline-d bg-night/60 shadow-glass-edge-d backdrop-blur-overlay backdrop-saturate-150">
      <BarraCarga />
      <nav className="mx-auto max-w-page px-6 md:px-7">
        <div className="flex h-16 items-center justify-between gap-6">
          <Brand to={rutaLogo} />

          {token ? (
            // Con sesión, en todos los anchos: campana y avatar. El menú de
            // cuenta es el mismo en celular, así que las tres líneas sobran.
            <div className="flex items-center gap-5">
              <Campana tipo={tipo} />
              <MenuCuenta username={username ?? "Mi cuenta"} tipo={tipo} foto={foto} alCerrarSesion={logout} />
            </div>
          ) : (
            <>
              <div className="hidden items-center gap-6 lg:flex">{navLinks(false)}</div>

              <div className="flex items-center gap-5">
                <div className="hidden items-center gap-5 lg:flex">
                  <Link to="/login" className={linkPlano}>
                    Iniciar sesión
                  </Link>
                  <EnlaceRegistro />
                </div>

                <button
                  type="button"
                  aria-expanded={isMobileMenuOpen}
                  aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
                  // 44×44 de área de toque; el margen negativo deja el ícono donde estaba.
                  className="-mr-2.5 flex h-11 w-11 items-center justify-center rounded-pill text-white/90 transition-colors hover:bg-white/[0.06] hover:text-white lg:hidden"
                  onClick={() => setIsMobileMenuOpen((open) => !open)}
                >
                  {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
              </div>
            </>
          )}
        </div>

        <AnimatePresence initial={false}>
          {!token && isMobileMenuOpen && (
            <motion.div
              key="mobile"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: DUR.base, ease: EASE }}
              className="overflow-hidden lg:hidden"
            >
              <div className="flex flex-col gap-5 border-t border-hairline-d py-5">
                {navLinks(true)}
                <div className="flex flex-wrap items-center gap-4 border-t border-hairline-d pt-5">
                  <Link to="/login" className={linkPlano}>
                    Iniciar sesión
                  </Link>
                  <EnlaceRegistro />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </div>
  );
};

export default Navbar;
