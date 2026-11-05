import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ArrowRight, CreditCard, RotateCcw, Unlock, X, Zap } from "../components/icons";
import api from "../services/api";
import { showSuccess, showError, showConfirm } from "../utils/alerts";
import { Button, Card, EmptyState, SkeletonList } from "../components/ui";
import { cx } from "../lib/cx";
import { rise, stagger, revealViewport } from "../lib/motion";
import PageHeader from "../components/PageHeader";
import { useTitulo } from "../hooks/useTitulo";

interface Plan {
  id: number;
  nombre: string;
  precio: number;
  tipo_usuario: string;
  max_postulaciones_dia?: number;
  max_candidatos?: number;
}

interface MiSuscripcion {
  plan: string;
  fecha_fin: string | null;
}

/** Los planes destacados invierten a superficie oscura sobre la banda clara. */
const DESTACADOS = ["PREMIUM", "PRO"];

const DESCRIPCIONES: Record<string, string> = {
  GRATIS: "Empieza a explorar oportunidades tecnológicas",
  PREMIUM: "Maximiza tus oportunidades laborales",
  PRO: "Encuentra talento más rápido",
  ENTERPRISE: "La solución completa para reclutamiento",
};

/** Lo que ya promete la página, dicho donde se toma la decisión. */
const GARANTIAS = [
  { titulo: "Sin permanencia", Icono: Unlock },
  { titulo: "Cambio al momento", Icono: Zap },
  { titulo: "Pago con PayPal", Icono: CreditCard },
];

const Planes: React.FC = () => {
  useTitulo("Planes");
  const navigate = useNavigate();
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [miSuscripcion, setMiSuscripcion] = useState<MiSuscripcion | null>(null);
  const [estado, setEstado] = useState<"cargando" | "listo" | "error">("cargando");

  const userType = localStorage.getItem("user_tipo");
  const token = localStorage.getItem("token");

  const cargarMiSuscripcion = useCallback(async () => {
    try {
      const res = await api.get("/suscripcion/actual/");
      setMiSuscripcion(res.data);
    } catch (error) {
      console.error("Error al cargar la suscripción", error);
    }
  }, []);

  const cargarPlanes = useCallback(async () => {
    setEstado("cargando");
    try {
      const res = await api.get("/planes/");
      setPlanes(res.data);
      setEstado("listo");
    } catch (error) {
      // Antes esto solo hacía console.error y la página quedaba en blanco
      // sin explicar nada. Ahora el estado llega a la interfaz.
      console.error(error);
      setEstado("error");
    }
  }, []);

  useEffect(() => {
    cargarPlanes();
    if (token) cargarMiSuscripcion();
  }, [token, cargarPlanes, cargarMiSuscripcion]);

  const comprarPlan = (planId: number) => {
    if (!token) {
      showError("Para comprar un plan, primero inicia sesión o regístrate", "Falta un paso");
      return;
    }
    navigate(`/checkout/${planId}`);
  };

  const handleCancelarSuscripcion = async () => {
    const confirmado = await showConfirm(
      "Perderás los beneficios Premium y volverás al plan gratuito de inmediato.",
      "¿Cancelar tu suscripción?",
      { confirmLabel: "Sí, cancelar", cancelLabel: "Conservar plan", destructive: true }
    );
    if (!confirmado) return;

    try {
      await api.post("/suscripcion/cancelar/");
      showSuccess("Volviste al plan gratuito.", "Suscripción cancelada");
      cargarMiSuscripcion();
    } catch (error) {
      showError("No se pudo cancelar la suscripción. Inténtalo de nuevo.");
    }
  };

  const planesEmpresa = planes.filter((p) => p.tipo_usuario === "empresa");
  const planesAspirante = planes.filter((p) => p.tipo_usuario === "aspirante");

  /** Los beneficios salen de los datos del plan, no de una lista de emoji. */
  const beneficios = (plan: Plan): string[] => {
    const items: string[] = [];
    if (plan.nombre.toUpperCase() === "PREMIUM" && plan.tipo_usuario === "aspirante") {
      items.push("Postulaciones ilimitadas");
    }
    if (plan.max_postulaciones_dia) items.push(`${plan.max_postulaciones_dia} postulaciones por día`);
    if (plan.max_candidatos) items.push(`Hasta ${plan.max_candidatos} candidatos por vacante`);
    items.push("Acceso completo al catálogo de TI");
    return items;
  };

  const renderTarjetas = (lista: Plan[]) => (
    <motion.div
      variants={stagger(0.09)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3"
    >
      {lista.map((plan) => {
        const nombre = plan.nombre.toUpperCase();
        const destacado = DESTACADOS.includes(nombre);
        const gratuito = parseFloat(plan.precio.toString()) === 0;
        const esPlanActual =
          miSuscripcion?.plan.toLowerCase() === plan.nombre.toLowerCase() &&
          Boolean(token) &&
          userType === plan.tipo_usuario;
        const tone = destacado ? "dark" : "light";

        return (
          <motion.div key={plan.id} variants={rise} className="h-full">
            <Card tone={tone} interactive className="flex h-full flex-col">
              <div className="flex-1">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <h3 className={cx("text-h3 font-demi", destacado ? "text-ink-d" : "text-ink")}>
                    {plan.nombre}
                  </h3>
                  {esPlanActual && (
                    <span
                      className={cx(
                        "whitespace-nowrap rounded-pill border px-2.5 py-1 text-[0.6875rem] uppercase tracking-[0.06em]",
                        // Etiqueta, no botón: tinta plena y borde reforzado, sin azul.
                        destacado ? "border-hairline-d-strong text-ink-d" : "border-hairline-strong text-ink"
                      )}
                    >
                      Tu plan
                    </span>
                  )}
                </div>

                <p className={cx("text-[0.90625rem]", destacado ? "text-ink-2d" : "text-ink-2")}>
                  {DESCRIPCIONES[nombre] ?? "Plan ideal para comenzar"}
                </p>

                <p className="mt-6 flex items-baseline gap-2">
                  <span
                    className={cx(
                      "tabular text-[2.25rem] font-mid leading-none tracking-[-0.03em]",
                      destacado ? "text-ink-d" : "text-ink"
                    )}
                  >
                    ${plan.precio}
                  </span>
                  <span className={cx("text-[0.875rem]", destacado ? "text-muted-d" : "text-muted")}>
                    MXN / mes
                  </span>
                </p>

                <ul
                  className={cx(
                    "mt-7 flex flex-col gap-3 border-t pt-6",
                    destacado ? "border-hairline-d" : "border-hairline"
                  )}
                >
                  {beneficios(plan).map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check
                        size={15}
                        strokeWidth={2}
                        className={cx("mt-[3px] flex-none", destacado ? "text-accent-on-dark" : "text-accent-on-dark")}
                      />
                      <span className={cx("text-[0.875rem]", destacado ? "text-ink-2d" : "text-ink-2")}>
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                {esPlanActual ? (
                  <Button variant="ghost" tone={tone} className="w-full" disabled>
                    <Check size={15} strokeWidth={2} />
                    Plan activo
                  </Button>
                ) : gratuito ? (
                  <Button
                    variant="ghost"
                    tone={tone}
                    className="w-full"
                    onClick={() => {
                      if (!token) showError("Regístrate para activar el plan gratuito.", "Casi listo");
                    }}
                  >
                    Plan gratuito
                  </Button>
                ) : (
                  <Button
                    variant={destacado ? "primary" : "accent"}
                    tone={tone}
                    className="w-full"
                    onClick={() => comprarPlan(plan.id)}
                  >
                    <ArrowRight size={15} strokeWidth={1.8} />
                    Contratar {plan.nombre}
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );

  const seccion = (titulo: string, lista: Plan[]) =>
    lista.length > 0 ? (
      <div className="mt-16 first:mt-0">
        <motion.h2 {...revealViewport} className="mb-8 font-heading text-h2 font-demi tracking-[-0.015em] text-ink">
          {titulo}
        </motion.h2>
        {renderTarjetas(lista)}
      </div>
    ) : null;

  return (
    <div className="mesh-page">
      <PageHeader
        tono="oscuro"
        titulo="Planes"
        detalle="Elige el plan de tu cuenta. Puedes cambiarlo después."
      />

      {/* ── Banda clara con los planes ── */}
      <section className="mesh-light flow-root bg-surface pb-20 md:pb-[88px]">
        <div className="relative mx-auto max-w-page px-6 md:px-7">
          {/* Panel a caballo del filo: refracta la banda oscura arriba y la
              página clara abajo. Ese degradado no está pintado. */}
          <dl className="glass-panel glass-panel-overlap-sm edge-l mb-14 grid grid-cols-1 gap-7 p-7 sm:grid-cols-3">
            {/* Íconos con una etiqueta corta: la explicación larga sobraba. */}
            {GARANTIAS.map(({ titulo, Icono }) => (
              <div key={titulo} className="flex items-center gap-3">
                <dt className="sr-only">{titulo}</dt>
                {/* Contenedor neutro, como en el login: el ícono azul es marca,
                    pero un fondo azul se leería como botón. */}
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-pill border border-hairline-d bg-white/[0.04]">
                  <Icono size={18} strokeWidth={1.7} className="text-accent-on-dark" aria-hidden="true" />
                </span>
                <dd className="font-mid text-[0.9375rem] text-ink">{titulo}</dd>
              </div>
            ))}
          </dl>

          {token && miSuscripcion && (
            <Card className="mb-14 flex flex-wrap items-center justify-between gap-5">
              <div>
                <p className="text-[0.8125rem] uppercase tracking-[0.06em] text-muted">Tu plan actual</p>
                <p className="mt-1.5 text-h3 font-demi text-ink">{miSuscripcion.plan}</p>
                {miSuscripcion.fecha_fin && (
                  <p className="tabular mt-1 text-[0.875rem] text-muted">
                    Válido hasta el{" "}
                    {new Date(miSuscripcion.fecha_fin).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
              {miSuscripcion.plan.toUpperCase() !== "GRATIS" && (
                <Button variant="ghost" onClick={handleCancelarSuscripcion}>
                  <X size={14} strokeWidth={1.8} />
                  Cancelar suscripción
                </Button>
              )}
            </Card>
          )}

          {estado === "cargando" && <SkeletonList count={3} />}

          {estado === "error" && (
            <EmptyState
              title="No pudimos cargar los planes"
              description="El servidor no respondió. Puede ser una caída momentánea o tu conexión."
              action={
                <Button variant="ghost" onClick={cargarPlanes}>
                  <RotateCcw size={14} strokeWidth={1.8} />
                  Reintentar
                </Button>
              }
            />
          )}

          {estado === "listo" && planes.length === 0 && (
            <EmptyState
              title="Todavía no hay planes publicados"
              description="En cuanto haya planes disponibles aparecerán aquí."
            />
          )}

          {estado === "listo" && planes.length > 0 && (
            <>
              {!userType ? (
                <>
                  {seccion("Para empresas", planesEmpresa)}
                  {seccion("Para aspirantes", planesAspirante)}
                </>
              ) : (
                renderTarjetas(userType === "empresa" ? planesEmpresa : planesAspirante)
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Planes;
