/* ==========================================================================
   SECTOR: Componente Navbar (src/components/navbar/navbar.js)
   ACCIÓN: Reducción de dimensión espacial y densificación al scroll
   DESCRIPCIÓN: Escucha el desplazamiento vertical de forma pasiva; si supera
   los 24px de scroll, conmuta la clase 'is-scrolled' en la cápsula superior
   para reducir su altura de 78px a 62px y aumentar el desenfoque de fondo.
   ========================================================================== */
function bindScrollState(header) {
  const sync = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  sync();
  window.addEventListener('scroll', sync, { passive: true });
}

/* ==========================================================================
   SECTOR: Navegación Móvil (src/components/navbar/navbar.js)
   ACCIÓN: Control de apertura, cierre accesible y bloqueo de scroll
   DESCRIPCIÓN: Gestiona el estado visual del menú en pantalla completa,
   actualiza los atributos ARIA ('aria-expanded', 'aria-label'), inhabilita
   el desplazamiento en el <body> y escucha la tecla Escape para su cierre.
   ========================================================================== */
function bindMobileMenu(burger, menu) {
  const setMenu = (open) => {
    menu.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    document.body.style.overflow = open ? 'hidden' : '';
    document.body.classList.toggle('wp-menu-abierto', open);
  };

  burger.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a') || e.target.closest('[data-close]')) {
      setMenu(false);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) {
      setMenu(false);
    }
  });
}

/* ==========================================================================
   SECTOR: Enlaces de Navegación (src/components/navbar/navbar.js)
   ACCIÓN: Detección y marcado semántico de la página activa
   DESCRIPCIÓN: Evalúa la URL actual del navegador frente a los atributos
   'data-route' de cada enlace píldora para asignar 'aria-current="page"',
   activando el anillo de acento y resplandor HUD en la vista vigente.
   ========================================================================== */
function markActiveRoute() {
  const file = (window.location.pathname.split('/').pop() || 'index')
    .replace(/\.html$/, '');
  document.querySelectorAll('.wp-nav__link[data-route]').forEach((a) => {
    if (a.getAttribute('data-route').replace(/\.html$/, '') === file) {
      a.setAttribute('aria-current', 'page');
    }
  });
}

/* ==========================================================================
   SECTOR: Módulo Exportable Navbar (src/components/navbar/navbar.js)
   ACCIÓN: Inicializador maestro del ciclo de vida del componente
   DESCRIPCIÓN: Punto de entrada público que resuelve las referencias del DOM
   y ejecuta el enlazado de scroll, menú responsivo y marcado de rutas.
   ========================================================================== */
export function mountNavbar() {
  const header = document.getElementById('wp-header');
  const burger = document.getElementById('wp-burger');
  const menu = document.getElementById('wp-mobile-menu');

  if (header) bindScrollState(header);
  if (burger && menu) bindMobileMenu(burger, menu);
  markActiveRoute();
}

/* Autoejecución defensiva si se consume directamente en entornos clásicos */
if (typeof window !== 'undefined' && !window.__WP_MODULES_ACTIVE__) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountNavbar);
  } else {
    mountNavbar();
  }
}