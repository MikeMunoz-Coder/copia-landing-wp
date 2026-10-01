/* ==========================================================================
   Hero — Inyección Dinámica de Copys y Acciones
   ========================================================================== */

import { byId } from '../../core/dom.js?v=20260926l';

export function renderHero(hero) {
  if (!hero) return;

  const eyebrowText = byId('wp-eyebrow-text');
  const title = byId('wp-title');
  const sub = byId('wp-sub');
  const primary = byId('wp-cta-primary');
  const secondary = byId('wp-cta-secondary');

  if (hero.eyebrow && eyebrowText) eyebrowText.textContent = hero.eyebrow;
  if (hero.title && title) title.textContent = hero.title;
  if (hero.subtitle && sub) sub.textContent = hero.subtitle;

  if (hero.primaryCta && primary) {
    if (primary.firstChild && primary.firstChild.nodeType === Node.TEXT_NODE) {
      primary.firstChild.nodeValue = hero.primaryCta.label || 'Contratar ahora';
    }
    primary.href = hero.primaryCta.href || '#contacto';
  }

  if (hero.secondaryCta && secondary) {
    secondary.textContent = hero.secondaryCta.label || 'Ver planes';
    secondary.href = hero.secondaryCta.href || '#plans';
  }
}