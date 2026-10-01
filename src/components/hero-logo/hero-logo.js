/* ==========================================================================
   Logo Animado del Hero — Generador de Trayectoria Paramétrica
   ========================================================================== */

var IMG_W = 3956, IMG_H = 2963;
var CX = 0.5, CY = 0.37599;
var RX = 0.386, RY = 0.18437;
var TILT = -17.85 * Math.PI / 180;
var STEPS = 96;

function drawPath(el) {
  var w = el.clientWidth;
  if (!w) return false;
  var h = w * IMG_H / IMG_W;

  var cx = CX * w, cy = CY * h;
  var rx = RX * w, ry = RY * h;
  var cos = Math.cos(TILT), sin = Math.sin(TILT);

  var d = '';
  for (var i = 0; i <= STEPS; i++) {
    var a = Math.PI - (i / STEPS) * Math.PI * 2;
    var x = rx * Math.cos(a), y = ry * Math.sin(a);
    d += (i ? 'L ' : 'M ') +
      (cx + x * cos - y * sin).toFixed(1) + ',' +
      (cy + x * sin + y * cos).toFixed(1) + ' ';
  }

  el.style.setProperty('--wp-path', 'path("' + d.trim() + ' Z")');
  el.style.setProperty('--wp-s', 'calc(var(--wp-star) * ' + (w / 800).toFixed(4) + ')');
  return true;
}

export function mountHeroLogo() {
  var logos = document.querySelectorAll('.wp-logo');

  Array.prototype.forEach.call(logos, function (el) {
    // Si el elemento no tiene ancho inicial, reintentar en el siguiente frame
    if (!drawPath(el)) {
      requestAnimationFrame(function () {
        drawPath(el);
      });
    }

    if (typeof ResizeObserver === 'function') {
      new ResizeObserver(function () { 
        drawPath(el); 
      }).observe(el);
    } else {
      window.addEventListener('resize', function () { 
        drawPath(el); 
      }, { passive: true });
    }
  });
}