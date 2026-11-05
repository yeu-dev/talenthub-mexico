import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import { showSuccess, showError } from '../utils/alerts';
import { rise, stagger } from '../lib/motion';
import { useTitulo } from '../hooks/useTitulo';

const Checkout: React.FC = () => {
  useTitulo('Pago');
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const initialOptions = {
    // TODO: mover a REACT_APP_PAYPAL_CLIENT_ID. Hoy es la llave de sandbox y
    // no cobra dinero real, pero al pasar a producción la llave viva no puede
    // quedar en el bundle: cualquiera la lee con ver-código-fuente.
    clientId: 'AekJ2ycu6mOuqPUg8IG97Z7KVb_tawnIH2V6gX6qzSPRh1ilpvFlgwFwVdrPzE_R3e6atC-jqbS49bvX',
    currency: 'MXN',
    intent: 'capture',
  };

  /** Django crea la orden y devuelve el id que PayPal generó. */
  const crearOrden = async () => {
    try {
      const response = await api.post('/pago/crear/', { plan_id: planId });
      return response.data.id;
    } catch (error) {
      showError('No pudimos conectar con el servidor de pagos.');
      throw error;
    }
  };

  /** PayPal ya cobró; le avisamos a Django para que active el plan. */
  const capturarOrden = async (data: any) => {
    setLoading(true);
    try {
      await api.post('/pago/capturar/', { order_id: data.orderID, plan_id: planId });

      showSuccess('Tu plan quedó activo.', 'Pago procesado');
      navigate(localStorage.getItem('user_tipo') === 'empresa' ? '/dashboard' : '/vacantes');
    } catch (error) {
      showError('El cobro se hizo pero no pudimos validarlo. Escríbenos antes de reintentar.', 'Revisa tu pago');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-var(--nav-flow))] items-center justify-center bg-night px-6 py-16 text-ink-d">

      <motion.div variants={stagger(0.09)} initial="hidden" animate="show" className="w-full max-w-[440px]">
        <motion.div variants={rise} className="mb-8 text-center">
          <Link
            to="/planes"
            className="inline-flex items-center gap-2 text-[0.875rem] text-muted-d transition-colors hover:text-ink-d"
          >
            <ArrowLeft size={14} strokeWidth={1.8} />
            Volver a planes
          </Link>
        </motion.div>

        <motion.div
          variants={rise}
          className="rounded-card border border-hairline-d bg-elevated p-8 sm:p-9"
        >
          <h1 className="text-h3 font-demi text-ink-d">Completar pago</h1>
          <p className="mt-1.5 text-[0.9375rem] text-muted-d">
            El cobro lo procesa PayPal. TalentHub nunca ve los datos de tu tarjeta.
          </p>

          {/* Los botones de PayPal viven en un iframe con fondo blanco que no
              podemos tematizar. En vez de pelearnos con él, le damos una placa
              clara propia: se lee como una superficie deliberada del sistema y
              no como un parche pegado sobre la tarjeta oscura. */}
          <div className="mt-7 rounded-ui bg-canvas p-4">
            <PayPalScriptProvider options={initialOptions}>
              <PayPalButtons
                createOrder={crearOrden}
                onApprove={capturarOrden}
                // `pill` es la silueta del sistema; `rect` chocaba con todo lo demás.
                style={{ layout: 'vertical', shape: 'pill', color: 'black' }}
                onError={() => showError('PayPal canceló la operación o falló el cobro.')}
              />
            </PayPalScriptProvider>
          </div>

          {loading && (
            <p role="status" className="mt-5 flex items-center justify-center gap-2.5 text-[0.875rem] text-ink-2d">
              <Loader2 size={15} strokeWidth={1.8} className="animate-spin" />
              Validando el pago con el servidor…
            </p>
          )}

          <p className="mt-6 flex items-start gap-2.5 border-t border-hairline-d pt-5 text-[0.8125rem] leading-relaxed text-muted-d">
            <ShieldCheck size={15} strokeWidth={1.7} className="mt-px flex-none" />
            Estás en el entorno de pruebas de PayPal: no se cobra dinero real.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Checkout;
