/* ==========================================================================
   Wifi Prado — Orquestador Maestro de Scripts (src/main.js)
   Punto de entrada modular de la aplicación.
   ========================================================================== */

import { mountHeroLogo } from './components/hero-logo/hero-logo.js';

// Inicialización de componentes al cargar la estructura del DOM
document.addEventListener('DOMContentLoaded', () => {
  mountHeroLogo();
});

// Fallback directo por si el evento DOMContentLoaded ya se disparó
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  mountHeroLogo();
}