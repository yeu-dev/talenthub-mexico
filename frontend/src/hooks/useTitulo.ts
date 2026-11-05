import { useEffect } from 'react';

const MARCA = 'TalentHub';

/**
 * El título de la pestaña del navegador. Antes todas decían "TalentHub
 * México" y con dos pestañas abiertas no se sabía cuál era cuál.
 * Sin `titulo` (mientras carga) se queda solo la marca.
 */
export function useTitulo(titulo?: string) {
  useEffect(() => {
    document.title = titulo ? `${titulo} · ${MARCA}` : MARCA;
  }, [titulo]);
}
