import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sileo';
import Navbar from './components/navbar';
import Footer from './components/footer';
import AppPromo from './components/AppPromo';
import { PromoAppProvider, usePromoApp } from './components/PromoApp';
import { cx } from './lib/cx';
import { ConfirmHost } from './components/ui';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Vacantes from './pages/Vacantes';
import VacanteDetalle from './pages/VacanteDetalle';
import Dashboard from './pages/Dashboard';
import MisAplicaciones from './pages/MisAplicaciones';
import AplicacionesEmpresa from './pages/AplicacionesEmpresa';
import Perfil from './pages/PerfilAspirante';
import Planes from './pages/planes';
import Checkout from './pages/Checkout';
import DashboardValidador from './pages/DashboardValidador';
import PerfilAspirante from './pages/PerfilAspirante';
import SolicitarRecuperacion from './pages/auth/SolicitarRecuperacion';
import RestablecerPassword from './pages/auth/RestablecerPassword';
import PoliticasPrivacidad from './pages/PoliticasPrivacidad';

/**
 * El contenido de cada página. Mientras la tarjeta de la app está abierta, en
 * escritorio deja libre la columna derecha donde flota; al minimizarla, la
 * página se estira con una transición del padding.
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

function App() {
  return (
    <Router>
      <PromoAppProvider>
      <Navbar />
      <Pagina>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/vacantes" element={<Vacantes />} />
        <Route path="/vacantes/:id" element={<VacanteDetalle />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/mis-aplicaciones" element={<MisAplicaciones />} />
        <Route path="/aplicaciones-empresa" element={<AplicacionesEmpresa />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/planes" element={<Planes />} />
        <Route path="/checkout/:planId" element={<Checkout />} />
        <Route path="/validador" element={<DashboardValidador />} />
        <Route path="/mi-perfil" element={<PerfilAspirante />} />
        <Route path="/olvide-password" element={<SolicitarRecuperacion />} />
        {/* El :uid y :token son vitales para que useParams funcione */}
        <Route path="/restablecer-password/:uid/:token" element={<RestablecerPassword />} />
        <Route path="/politicas" element={<PoliticasPrivacidad />} />
      </Routes>

      <Footer />
      </Pagina>

      {/* Aviso de la app: en todas las páginas públicas hasta que se inicia sesión. */}
      <AppPromo />

      {/*
        Notificaciones. OJO con `theme`: sileo lo nombra por el color del TEXTO,
        no de la superficie. "light" = texto claro = burbuja oscura, que es justo
        lo que queremos — chrome oscuro flotando sobre contenido claro, igual que
        el nav.
      */}
      <Toaster theme="light" position="bottom-center" options={{ roundness: 18 }} />

      {/* Resuelve las promesas de showConfirm(); sileo no hace confirmaciones */}
      <ConfirmHost />
      </PromoAppProvider>
    </Router>
  );
}

export default App;
