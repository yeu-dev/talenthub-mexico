import React, { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Menu, X, LogOut } from "lucide-react";
import api from "../services/api";
import { Button } from "./ui";
import { cx } from "../lib/cx";
import { EASE, DUR } from "../lib/motion";
import Brand from "./Brand";

/**
 * Barra de vidrio oscuro de ancho completo, pegada arriba, con el logo.
 *
 * Translúcida con desenfoque: sobre las bandas oscuras se funde, y sobre el
 * contenido claro se ve pasar la página por debajo. La sección actual se
 * marca con una línea azul en el borde inferior de la barra.
 */
const Navbar: React.FC = () => {
  const location = useLocation();
  // Las pantallas de acceso usan AuthShell, que trae su propio logo y ocupa
  // toda la pantalla: ahi la barra sobra.
  const isAuthPage = ["/login", "/register", "/olvide-password", "/restablecer-password"].some(
    (ruta) => location.pathname === ruta || location.pathname.startsWith(`${ruta}/`)
  );

  const token = localStorage.getItem("token");
  const username = localStorage.getItem("user_username");
  const tipo = localStorage.getItem("user_tipo");

  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!token) return;
    const fetchNotifications = async () => {
      try {
        const response = await api.get("/notificaciones/");
        setUnreadCount(response.data.filter((n: any) => !n.leido).length);
      } catch (error) {
        console.error("Error cargando notificaciones");
      }
    };
    fetchNotifications();
  }, [token, location.pathname]);

  // Cerrar el menú al cambiar de ruta: si no, queda abierto sobre la página nueva.
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const logout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  if (isAuthPage) return null;

  let rutaLogo = "/";
  if (token) {
    rutaLogo = tipo === "empresa" ? "/dashboard" : "/vacantes";
  }

  // La sección actual se marca: texto blanco y una línea azul debajo. Antes
  // todos los links se veían igual y no se sabía en qué página se estaba.
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cx(
      "relative text-[0.9375rem] transition-colors duration-200 hover:text-white",
      isActive
        ? "text-white after:absolute after:-bottom-[22px] after:left-0 after:right-0 after:h-[2px] after:rounded-pill after:bg-accent-on-dark max-lg:after:hidden"
        : "text-white/90"
    );
  const linkPlano = "text-[0.9375rem] text-white/90 transition-colors duration-200 hover:text-white";

  const navLinks = (
    <>
      {tipo !== "empresa" && tipo !== "validador" && (
        <NavLink to="/vacantes" className={linkClass}>
          Vacantes
        </NavLink>
      )}

      {tipo === "aspirante" && (
        <>
          <NavLink to="/mi-perfil" className={linkClass}>
            Mi perfil
          </NavLink>
          <NavLink to="/mis-aplicaciones" className={linkClass}>
            Mis postulaciones
          </NavLink>
        </>
      )}

      {tipo === "empresa" && (
        <>
          <NavLink to="/dashboard" className={linkClass}>
            Mis vacantes
          </NavLink>
          <NavLink to="/aplicaciones-empresa" className={linkClass}>
            Postulaciones
          </NavLink>
        </>
      )}

      {tipo === "validador" && (
        <NavLink to="/validador" className={(estado) => cx(linkClass(estado), "text-accent-on-dark hover:text-accent-on-dark")}>
          Panel de auditoría
        </NavLink>
      )}

      {tipo !== "validador" && (
        <NavLink to="/planes" className={linkClass}>
          Planes
        </NavLink>
      )}

      <NavLink to="/politicas" className={linkClass}>
        Privacidad
      </NavLink>
    </>
  );

  const sessionControls = !token ? (
    <>
      <Link to="/login" className={linkPlano}>
        Iniciar sesión
      </Link>
      <Link to="/register">
        <Button variant="primary" tone="dark" size="sm">
          Registrarse
        </Button>
      </Link>
    </>
  ) : (
    <>
      <Link
        to="/mis-aplicaciones"
        aria-label={unreadCount > 0 ? `Notificaciones: ${unreadCount} sin leer` : "Notificaciones"}
        className="relative text-white/90 transition-colors duration-200 hover:text-white"
      >
        <Bell size={20} strokeWidth={1.6} />
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-pill bg-accent px-1 text-[0.6875rem] font-mid text-white">
            {unreadCount}
          </span>
        )}
      </Link>

      <span className="text-[0.9375rem] text-white/90">
        Hola, <span className="text-white">{username}</span>
      </span>

      <Button variant="ghost" tone="dark" size="sm" onClick={logout}>
        <LogOut size={14} strokeWidth={1.8} />
        Cerrar sesión
      </Button>
    </>
  );

  // 60% de negro, no menos: con el texto al 90% es lo mínimo que pasa AA
  // (4.62:1) incluso cuando lo que pasa por debajo es blanco puro.
  return (
    <div className="sticky top-0 z-50 border-b border-hairline-d bg-night/60 shadow-glass-edge-d backdrop-blur-overlay backdrop-saturate-150">
      <nav className="mx-auto max-w-page px-6 md:px-7">
        <div className="flex h-16 items-center justify-between gap-6">
          <Brand to={rutaLogo} />

          <div className="hidden items-center gap-6 lg:flex">{navLinks}</div>
          <div className="hidden items-center gap-5 lg:flex">{sessionControls}</div>

          <button
            type="button"
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            className="text-white/90 transition-colors hover:text-white lg:hidden"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {isMobileMenuOpen && (
            <motion.div
              key="mobile"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: DUR.base, ease: EASE }}
              className="overflow-hidden lg:hidden"
            >
              <div className="flex flex-col gap-5 border-t border-hairline-d py-5">
                {navLinks}
                <div className="flex flex-wrap items-center gap-4 border-t border-hairline-d pt-5">
                  {sessionControls}
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
