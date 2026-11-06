// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// React Router 7 usa TextEncoder, que el jsdom de Jest 27 no trae.
import { TextDecoder, TextEncoder } from 'util';

Object.assign(global, { TextEncoder, TextDecoder });

// jsdom no trae IntersectionObserver, y framer-motion lo usa para `whileInView`.
// Este reporta todo como visible de inmediato, que es lo que importa en pruebas.
class IntersectionObserverFalso {
  private cb: IntersectionObserverCallback;
  constructor(cb: IntersectionObserverCallback) {
    this.cb = cb;
  }
  observe(el: Element) {
    this.cb([{ isIntersecting: true, target: el, intersectionRatio: 1 } as IntersectionObserverEntry], this as never);
  }
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

Object.assign(global, { IntersectionObserver: IntersectionObserverFalso });

// jsdom no dibuja en canvas y avisa "Not implemented" cada vez que alguien
// pide un contexto (el fondo de la 404, las chispas). Sin contexto, esos
// componentes no dibujan nada, que es lo que importa en pruebas.
HTMLCanvasElement.prototype.getContext = (() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext;
