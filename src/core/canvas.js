/* ==========================================================================
   Wifi Prado — Procedural Background Engine
   Ruta: src/core/canvas.js
   Micropaso 1.3: Algoritmo de nodos y trayectorias sinusoidales.
   ========================================================================== */

(function () {
  'use strict';

  // 1. Obtención y validación de referencias del DOM
  const canvas = document.getElementById('wp-canvas');
  if (!canvas) {
    console.warn('[Wifi Prado Canvas]: No se encontró el elemento #wp-canvas.');
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.warn('[Wifi Prado Canvas]: El contexto 2D no es soportado.');
    return;
  }

  // 2. Parámetros de entorno y estado
  let width = 0;
  let height = 0;
  let dpr = 1;
  let nodes = [];

  // Paleta de partículas corporativas (Cian / Magenta con opacidades controladas)
  const PALETTE = [
    'rgba(105, 185, 240, 0.45)', // Cyan base
    'rgba(105, 185, 240, 0.25)', // Cyan atenuado
    'rgba(228, 40, 114, 0.40)', // Magenta base
    'rgba(210, 234, 250, 0.30)'  // Cyan 300
  ];

  // 3. Estructura del Nodo Sinusoidal
  class SinusoidalNode {
    constructor(canvasWidth, canvasHeight) {
      this.init(canvasWidth, canvasHeight, true);
    }

    init(w, h, randomX = false) {
      this.x = randomX ? Math.random() * w : -10;
      this.baseY = Math.random() * h;
      this.radius = 1.0 + Math.random() * 1.8;
      this.speedX = 0.4 + Math.random() * 0.8;
      this.amplitude = 15 + Math.random() * 35;   // Variación de altura de la onda
      this.frequency = 0.003 + Math.random() * 0.005; // Densidad del ciclo senoidal
      this.phase = Math.random() * Math.PI * 2;   // Desfase angular
      this.color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    }

    update(w, h) {
      this.x += this.speedX;
      this.phase += 0.015;

      // Cálculo de trayectoria sinusoidal: Y = Base + A * sin(wx + fase)
      this.y = this.baseY + Math.sin(this.x * this.frequency + this.phase) * this.amplitude;

      // Reciclaje de nodos fuera de los límites de pantalla
      if (this.x > w + 20) {
        this.init(w, h, false);
      }
    }

    draw(context) {
      context.beginPath();
      context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      context.fillStyle = this.color;
      context.fill();
    }
  }

  // 4. Inicializador de población de nodos
  function setupNodes() {
    nodes = [];
    // Densidad proporcional al ancho de pantalla
    const count = Math.max(25, Math.floor(width / 35));
    for (let i = 0; i < count; i++) {
      nodes.push(new SinusoidalNode(width, height));
    }
  }

  // 5. Redimensionamiento y calibración HiDPI
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);

    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    ctx.scale(dpr, dpr);
    setupNodes();
  }

  // 6. Ciclo de animación
  function animate() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < nodes.length; i++) {
      nodes[i].update(width, height);
      nodes[i].draw(ctx);
    }

    requestAnimationFrame(animate);
  }

  // 7. Eventos de inicialización
  window.addEventListener('resize', resize);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      resize();
      requestAnimationFrame(animate);
    });
  } else {
    resize();
    requestAnimationFrame(animate);
  }
})();