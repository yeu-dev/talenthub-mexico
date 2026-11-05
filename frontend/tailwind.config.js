/** @type {import('tailwindcss').Config} */
// Sistema de diseño TalentHub — ver DESIGN.md en la raíz del proyecto.
// Claro por defecto, bandas oscuras donde la página lo pide, vidrio como firma.
// El azul es la marca y la acción.
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Registro claro (por defecto) ──
        canvas: '#ffffff',
        surface: '#f5f6f8',
        ink: '#161616',          // 18.1:1 sobre canvas · AAA
        'ink-2': '#3f4045',
        muted: '#6b6b6b',        // 5.33:1 · AA

        // ── Registro oscuro (hero, cierre, nav, footer) ──
        night: '#0a0a0a',
        elevated: '#161616',
        'ink-d': '#ededed',      // 16.9:1 sobre night · AAA
        'ink-2d': '#c2c2c2',
        'muted-d': '#8a8a8a',    // 5.4:1 · AA — corregido desde #686868 (3.55:1, reprobaba)

        // ── Acento de INTERACCIÓN: azul ultramar, y solo él ──
        // Regla del sistema: el azul es lo único que marca "esto se puede
        // tocar" — botones, links, foco. Los colores de estado (teal, ámbar,
        // rojo) nunca visten un control clicable. Así el usuario nunca tiene
        // que preguntarse qué color significa presionable.
        // No es el azul de Tailwind. `#2563EB` (blue-600) está en 221° con 83%
        // de saturación: es el azul por defecto de medio internet, y es
        // exactamente el que quitamos al inicio del rediseño. Este está en
        // 230° al 100% — ultramar, no hipervínculo. Lee como pigmento.
        //
        // Elegido además con la MISMA luminancia relativa que el violeta al
        // que sustituye (0.1442 vs 0.1438): todos los pares de contraste del
        // sistema siguen valiendo sin volver a medirlos.
        accent: '#3355ff',           // 5.41:1 con blanco encima · AA
        'accent-hover': '#2544e6',   // 6.89:1 · AA
        'accent-on-dark': '#9db0ff', // 9.51:1 sobre night · AAA

        // ── Hairlines: sustituyen a toda sombra de elevación ──
        hairline: 'rgba(0,0,0,0.10)',
        'hairline-strong': 'rgba(0,0,0,0.20)',
        'hairline-d': 'rgba(255,255,255,0.10)',
        'hairline-d-strong': 'rgba(255,255,255,0.18)',

        // ── Colores de ESTADO ──
        // Nunca visten un control clicable: solo informan. Los tres pasan AA
        // sobre blanco (verificado: 5.47 / 5.18 / 5.94).
        // Solo hay DOS colores de estado, y marcan resolución:
        // teal = resuelto a favor, rojo = resuelto en contra. Lo que está en
        // curso no lleva color, lleva tinta plena.
        // Ámbar quedó fuera a propósito: a 19° de matiz del rojo, es
        // indistinguible con daltonismo rojo-verde, y aquí significaban lo
        // contrario. La posición en el track comunica el avance mejor que un tono.
        ok: '#0f766e',       // teal — aceptada, publicada, remoto
        'ok-d': '#5eead4',
        danger: '#dc2626',   // rojo — rechazada, error, destructivo
        'danger-d': '#f87171',
        warn: '#a16207',     // ocre — reservado a avisos de formulario, nunca a estados
        'warn-d': '#fcd34d',
      },

      // `heading` es la cara de DISPLAY, no la de todo titulo: h1 y h2 de
      // pagina y de seccion, y nada mas. Los anchos irregulares de Bricolage
      // son la gracia en un titular y ruido en un encabezado de tabla; de h3
      // hacia abajo se hereda `sans` (DM Sans).
      //
      // Tampoco entra en cifras: sus anchos irregulares pelean con
      // `tabular-nums`, que existe justo para que los digitos se alineen.
      fontFamily: {
        sans: ['"DM Sans"', '"DM Sans Fallback"', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['"Bricolage Grotesque"', '"Bricolage Fallback"', '"DM Sans"', '"DM Sans Fallback"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', '"SF Mono"', 'Menlo', 'Consolas', 'monospace'],
      },

      // Escala propia; no pisa las de Tailwind
      fontSize: {
        // El display bajó de 72 a 52: el titular gigante con tracking muy
        // cerrado era uno de los rasgos de landing generada.
        display:  ['3.25rem',  { lineHeight: '1.05', letterSpacing: '-0.02em'  }], // 52
        'h1':     ['3rem',     { lineHeight: '1',    letterSpacing: '-0.02em'  }], // 48
        'h2':     ['2.25rem',  { lineHeight: '1.11', letterSpacing: '-0.015em' }], // 36
        'h3':     ['1.5rem',   { lineHeight: '1.33', letterSpacing: '-0.01em'  }], // 24
        sub:      ['1.125rem', { lineHeight: '1.5'   }],                           // 18
        body:     ['1rem',     { lineHeight: '1.5'   }],                           // 16
        caption:  ['0.8125rem',{ lineHeight: '1.5',  letterSpacing: '0.025em'  }], // 13
      },

      // Pesos sub-default: la síntesis Dimension (500 máx) + Superhuman (460/540).
      // Requieren las fuentes variables cargadas en public/index.html.
      fontWeight: {
        book: '460',
        mid: '500',
        demi: '540',
      },

      borderRadius: {
        ui: '10px',
        card: '24px',
        cardlg: '40px',
        panel: '42px',
        nav: '19px',
        icon: '4px',
        pill: '9999px',
      },

      // Sin sombras de elevación. Las únicas: el filo inset del vidrio y el
      // halo de foco.
      boxShadow: {
        'glass-edge': 'inset 0 1px 0 rgba(255,255,255,0.85)',
        'glass-edge-d': 'inset 0 1px 0 rgba(255,255,255,0.14)',
        'focus-accent': '0 0 0 3px rgba(51,85,255,0.22)',
        // El halo de foco necesita su versión clara: el azul pleno
        // desaparece contra una superficie oscura.
        'focus-accent-d': '0 0 0 3px rgba(157,176,255,0.24)',
      },

      backdropBlur: {
        card: '22px',
        nav: '16px',
        overlay: '28px',
      },

      // Una sola curva en CSS: desaceleración limpia, sin sobrepaso.
      // Había un `spring: cubic-bezier(0.34,1.56,0.64,1)` y se fue: un
      // rebote en CSS solo puede aplicarse a la lista entera de propiedades,
      // así que terminaba sobrepasando también los colores. El resorte de
      // verdad —con masa y amortiguación— vive en `lib/motion.ts` (SPRING),
      // donde framer-motion lo aplica solo a lo que tiene física.
      transitionTimingFunction: {
        base: 'cubic-bezier(0.22,0.61,0.36,1)',
      },

      maxWidth: {
        page: '1200px',
      },
    },
  },
  plugins: [],
}
