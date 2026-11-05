import React from "react";
import { motion } from "framer-motion";
import { revealViewport } from "../lib/motion";
import { RESPONSABLE, correoTexto, domicilioTexto } from "../lib/responsable";
import PageHeader from "../components/PageHeader";
import { useTitulo } from "../hooks/useTitulo";

interface Seccion {
  n: string;
  titulo: string;
  contenido: string[];
}

/**
 * El número no es decoración: el aviso es un documento ordenado y las
 * secciones se citan por número. Por eso vive separado del título, como
 * marca editorial, y alimenta el índice lateral.
 */
const SECCIONES: Seccion[] = [
  {
    n: "01",
    titulo: "Responsable del tratamiento de datos",
    contenido: [
      `${RESPONSABLE.nombre}, con domicilio en ${domicilioTexto()}, es responsable del tratamiento de los datos personales que se recaban a través de esta plataforma digital. Este aviso aplica a aspirantes, empresas, validadores y cualquier persona que utilice nuestros servicios web.`,
      `Para cualquier asunto relacionado con tus datos personales, incluido el ejercicio de los derechos descritos en la sección 12, el canal oficial es ${correoTexto()}.`,
      "La plataforma tiene como finalidad conectar talento tecnológico con empresas que publican oportunidades laborales verificadas en México.",
    ],
  },
  {
    n: "02",
    titulo: "Datos personales que recopilamos",
    contenido: [
      "Podemos recopilar datos de identificación y contacto como nombre de usuario, correo electrónico, teléfono, contraseña cifrada y tipo de cuenta.",
      "En el caso de aspirantes, podemos tratar información profesional como currículum vitae, fotografía de perfil, experiencia laboral, tecnologías, postulaciones realizadas y estado de sus procesos.",
      "En el caso de empresas, podemos tratar datos relacionados con el nombre de la empresa, vacantes publicadas, descripciones de puestos, rangos salariales, planes contratados e historial de postulaciones recibidas.",
    ],
  },
  {
    n: "03",
    titulo: "Datos sensibles y currículums",
    contenido: [
      "TalentHub México no solicita datos personales sensibles y ningún campo del registro, del perfil o de una postulación los pide. No necesitamos conocer tu estado de salud, origen étnico, creencias religiosas, afiliación sindical, opiniones políticas ni preferencia sexual para operar el servicio.",
      "El currículum es la excepción práctica: al ser un archivo que tú redactas, puede contener ese tipo de información sin que la plataforma la haya pedido. Te recomendamos no incluir datos sensibles en tu CV, ya que no aportan nada al proceso dentro de TalentHub México.",
      "Si decides incluirlos, la carga voluntaria del archivo se entiende como tu consentimiento expreso para que esa información sea tratada únicamente con la finalidad de que las empresas evalúen tu candidatura, y por el tiempo que tu cuenta permanezca activa. Puedes reemplazar o eliminar tu currículum en cualquier momento desde tu perfil.",
    ],
  },
  {
    n: "04",
    titulo: "Finalidades del tratamiento",
    contenido: [
      "Las finalidades primarias —las que dan origen y son necesarias para la relación con la plataforma— son: crear y administrar cuentas, permitir el inicio de sesión, publicar y consultar vacantes, gestionar postulaciones, validar ofertas laborales, mostrar perfiles profesionales y facilitar la comunicación entre aspirantes y empresas cuando el flujo de la plataforma lo permita.",
      "También son finalidades primarias operar funciones de seguridad, recuperación de contraseña, notificaciones del proceso, validación de vacantes, control de acceso por tipo de usuario y prevención de uso indebido de la plataforma.",
      "TalentHub México no realiza actualmente tratamientos con finalidades secundarias: no enviamos publicidad, no elaboramos perfiles comerciales ni compartimos datos con fines de mercadotecnia. Si eso cambiara, se actualizaría este aviso y se te ofrecería un medio para negar tu consentimiento antes de aplicarlo.",
    ],
  },
  {
    n: "05",
    titulo: "Visibilidad de tus datos dentro de la plataforma",
    contenido: [
      "TalentHub México limita la exposición de datos de contacto durante las etapas iniciales de evaluación: una empresa solo puede ver tu correo y teléfono a partir de que marca tu postulación como «en revisión». Antes de eso ve tu perfil profesional y tu currículum, pero no tus datos de contacto directo.",
      "La información visible para empresas y aspirantes depende del tipo de cuenta, de los permisos internos y del estado del proceso dentro de la plataforma. Los validadores acceden a datos de cuenta con el único fin de revisar vacantes y atender reportes de uso indebido.",
    ],
  },
  {
    n: "06",
    titulo: "Pagos, planes y proveedores externos",
    contenido: [
      "Cuando una empresa contrata planes o servicios de publicación, el procesamiento de pagos puede realizarse mediante proveedores externos como PayPal. TalentHub México no almacena datos completos de tarjetas bancarias dentro de la aplicación.",
      "La plataforma puede operar sobre infraestructura tecnológica de terceros, incluyendo servicios de alojamiento, despliegue, almacenamiento y monitoreo como Render y Vercel. Estos proveedores pueden procesar información técnica necesaria para mantener el servicio disponible y seguro.",
    ],
  },
  {
    n: "07",
    titulo: "Transferencias y acceso por terceros",
    contenido: [
      "No vendemos datos personales ni los transferimos a terceros con fines comerciales.",
      "Existen transferencias que la ley permite sin requerir tu consentimiento: las necesarias para cumplir obligaciones derivadas de la relación con la plataforma, las exigidas por una obligación legal, las solicitadas por autoridad competente y las indispensables para atender una emergencia que pueda dañar a una persona.",
      "Fuera de esos supuestos, no realizamos transferencias. Si en el futuro alguna requiriera tu consentimiento, se te solicitaría de forma expresa antes de llevarla a cabo.",
      "Los proveedores tecnológicos y de pago actúan como encargados bajo sus propios términos y políticas, por lo que recomendamos revisar sus avisos de privacidad cuando se interactúe directamente con sus servicios.",
    ],
  },
  {
    n: "08",
    titulo: "Cookies, almacenamiento local y datos técnicos",
    contenido: [
      "La aplicación utiliza el almacenamiento local del navegador para conservar información de sesión y tipo de usuario, que es lo que te mantiene dentro de tu cuenta entre visitas. No usamos cookies de publicidad ni de seguimiento de terceros.",
      "También pueden registrarse datos técnicos como dirección IP, navegador, dispositivo, fecha de acceso y eventos de seguridad, que ayudan a proteger cuentas, diagnosticar fallos y prevenir accesos no autorizados.",
      "Puedes borrar el almacenamiento local desde la configuración de tu navegador en cualquier momento; hacerlo cierra tu sesión y no afecta los datos guardados en tu cuenta.",
    ],
  },
  {
    n: "09",
    titulo: "Seguridad y conservación de la información",
    contenido: [
      "Aplicamos medidas razonables de seguridad administrativa, técnica y operativa para proteger la información contra pérdida, uso indebido, acceso no autorizado, alteración o divulgación indebida. Las contraseñas se almacenan cifradas y nunca en texto legible.",
      "Conservamos los datos durante el tiempo necesario para cumplir las finalidades descritas en este aviso, mantener registros operativos, atender responsabilidades legales y resolver incidencias relacionadas con la plataforma.",
    ],
  },
  {
    n: "10",
    titulo: "Menores de edad",
    contenido: [
      "TalentHub México no está dirigida a menores de 18 años y no recabamos deliberadamente sus datos personales.",
      "Si detectamos o se nos notifica que una cuenta pertenece a una persona menor de edad sin el consentimiento de quien ejerce la patria potestad o tutela, procederemos a eliminarla junto con los datos asociados.",
    ],
  },
  {
    n: "11",
    titulo: "Derechos ARCO, plazos y revocación del consentimiento",
    contenido: [
      "Como titular de datos personales puedes solicitar el Acceso a tus datos, su Rectificación cuando sean inexactos, su Cancelación cuando consideres que no se requieren, y Oponerte a su tratamiento para fines específicos. También puedes revocar tu consentimiento cuando legalmente proceda.",
      `Para ejercerlos, escribe a ${correoTexto()}. Tu solicitud debe incluir tu nombre y un medio para responderte, documentos que acrediten tu identidad, una descripción clara de los datos y del derecho que deseas ejercer y, cuando aplique, la documentación que sustente tu petición.`,
      "Responderemos tu solicitud en un plazo máximo de veinte días hábiles a partir de que la recibamos, y si resulta procedente la haremos efectiva dentro de los quince días hábiles siguientes a esa respuesta.",
      "Si consideras que tu derecho no fue atendido debidamente, puedes presentar una solicitud de protección de datos ante el Instituto Nacional de Transparencia, Acceso a la Información y Protección de Datos Personales (INAI).",
    ],
  },
  {
    n: "12",
    titulo: "Cambios al aviso de privacidad",
    contenido: [
      "TalentHub México puede actualizar este aviso para reflejar cambios legales, técnicos, operativos o de negocio. Las modificaciones estarán disponibles en esta misma página y se indicará la fecha de última actualización.",
      "El uso continuo de la plataforma después de publicada una actualización implica el conocimiento de la versión vigente del aviso.",
    ],
  },
];

const META = [
  { label: "Última actualización", value: "6 de julio de 2026" },
  { label: "Servicio", value: "TalentHub México" },
  { label: "Aplicación", value: "Plataforma web de empleo" },
];

const slug = (n: string) => `seccion-${n}`;

const PoliticasPrivacidad: React.FC = () => {
  useTitulo('Aviso de privacidad');
  return (
  <div className="bg-surface">
    <PageHeader
      migas={[{ etiqueta: 'Inicio', to: '/' }, { etiqueta: 'Aviso de privacidad' }]}
      titulo="Cómo tratamos tus datos"
      detalle="Cómo TalentHub México recopila, utiliza y protege los datos personales dentro de su plataforma de empleo tecnológico."
    />

    {/* ── Metadatos, a caballo del filo ──
         El panel monta 96px sobre la banda oscura: el degradado que se ve es
         el vidrio refractando negro arriba y página clara abajo. ── */}
    <div className="mx-auto max-w-page px-6 md:px-7">
      <dl className="mt-6 rounded-card border border-hairline bg-canvas grid grid-cols-1 gap-6 p-7 sm:grid-cols-3">
        {META.map(({ label, value }) => (
          <div key={label}>
            <dt className="text-[0.8125rem] uppercase tracking-[0.06em] text-ink-2">{label}</dt>
            <dd className="mt-1.5 text-body text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </div>

    {/* ── Cuerpo editorial ── */}
    <main className="mx-auto max-w-page px-6 py-16 md:px-7 md:py-20">
      <div className="grid grid-cols-1 gap-14 lg:grid-cols-[minmax(0,1fr)_230px] lg:gap-16">
        <div>
          <p className="mb-14 max-w-[68ch] border-l-2 border-accent pl-5 text-[1.0625rem] leading-relaxed text-ink-2">
            Este documento es un aviso informativo para usuarios de TalentHub México. Si una operación
            específica requiere consentimiento adicional o términos particulares, se mostrará dentro del
            flujo correspondiente de la plataforma.
          </p>

          <div className="flex flex-col">
            {SECCIONES.map((seccion) => (
              <motion.section
                key={seccion.n}
                id={slug(seccion.n)}
                {...revealViewport}
                className="scroll-mt-28 border-b border-hairline py-9 first:pt-0 last:border-b-0 last:pb-0"
              >
                <div className="mb-4 flex items-baseline gap-4">
                  <span className="tabular flex-none text-[0.8125rem] text-muted">{seccion.n}</span>
                  <h2 className="text-h3 font-demi text-ink">{seccion.titulo}</h2>
                </div>
                <div className="flex flex-col gap-4 pl-[calc(0.8125rem+1rem)]">
                  {seccion.contenido.map((parrafo) => (
                    <p key={parrafo} className="max-w-[68ch] text-[1.0625rem] leading-relaxed text-ink-2">
                      {parrafo}
                    </p>
                  ))}
                </div>
              </motion.section>
            ))}
          </div>

          <p className="mt-14 rounded-card border border-hairline bg-surface p-6 text-[0.9375rem] leading-relaxed text-muted">
            Al utilizar TalentHub México, reconoces haber leído este aviso de privacidad y aceptas el
            tratamiento de tus datos personales conforme a las finalidades descritas.
          </p>
        </div>

        {/* Índice: doce secciones legales sin navegación son hostiles */}
        <nav aria-label="Índice del aviso" className="hidden lg:block">
          <div className="sticky top-28">
            <p className="mb-4 text-[0.8125rem] uppercase tracking-[0.06em] text-muted">Contenido</p>
            <ol className="flex flex-col gap-2.5">
              {SECCIONES.map((seccion) => (
                <li key={seccion.n}>
                  <a
                    href={`#${slug(seccion.n)}`}
                    className="flex gap-3 text-[0.875rem] text-muted transition-colors hover:text-ink"
                  >
                    <span className="tabular flex-none">{seccion.n}</span>
                    <span>{seccion.titulo}</span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </nav>
      </div>
    </main>
  </div>
);
};

export default PoliticasPrivacidad;
