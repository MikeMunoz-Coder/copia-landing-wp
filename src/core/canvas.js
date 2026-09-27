/* ==========================================================================
   Wifi Prado — Procedural Background Engine
   Ruta: src/core/canvas.js
   Micropaso 1.4: Optimización en memoria fuera de pantalla (Offscreen Canvas).
   ========================================================================== */

(function () {
  'use strict';

  // 1. Referencias al Canvas visible
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

  // 2. Variables de dimensiones y estado
  let width = 0;
  let height = 0;
  let dpr = 1;
  let nodes = [];

  // Paleta corporativa: [r, g, b, alpha]
  const COLOR_DEFS = [
    { r: 105, g: 185, b: 240, a: 0.8 }, // Cyan base brillante
    { r: 105, g: 185, b: 240, a: 0.4 }, // Cyan atenuado
    { r: 228, g: 40,  b: 114, a: 0.8 }, // Magenta base brillante
    { r: 210, g: 234, b: 250, a: 0.5 }  // Cyan 300
  ];

  // Almacén de estampas pre-renderizadas en memoria
  let offscreenSprites = [];

  // 3. Pre-renderizado en lienzos fuera de pantalla (In-Memory Canvas)
  function buildOffscreenSprites() {
    offscreenSprites = [];
    const spriteSize = 32; // Tamaño de la estampa fija (ancho y alto)
    const center = spriteSize / 2;

    COLOR_DEFS.forEach(c => {
      const offCanvas = document.createElement('canvas');
      offCanvas.width = spriteSize;
      offCanvas.height = spriteSize;
      const offCtx = offCanvas.getContext('2d');

      // Halo luminoso con degradado radial en memoria
      const gradient = offCtx.createRadialGradient(
        center, center, 0,
        center, center, center
      );
      gradient.addColorStop(0, `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})`);
      gradient.addColorStop(0.35, `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a * 0.5})`);
      gradient.addColorStop(1, `rgba(${c.r}, ${c.g}, ${c.b}, 0)`);

      offCtx.fillStyle = gradient;
      offCtx.fillRect(0, 0, spriteSize, spriteSize);

      // Núcleo sólido brillante en el centro
      offCtx.beginPath();
      offCtx.arc(center, center, 2, 0, Math.PI * 2);
      offCtx.fillStyle = `rgba(255, 255, 255, ${c.a})`;
      offCtx.fill();

      offscreenSprites.push({
        canvas: offCanvas,
        size: spriteSize,
        halfSize: center
      });
    });
  }

  // 4. Estructura del Nodo Sinusoidal optimizado
  class SinusoidalNode {
    constructor(w, h) {
      this.init(w, h, true);
    }

    init(w, h, randomX = false) {
      this.x = randomX ? Math.random() * w : -20;
      this.baseY = Math.random() * h;
      this.speedX = 0.35 + Math.random() * 0.65;
      this.amplitude = 15 + Math.random() * 35;
      this.frequency = 0.003 + Math.random() * 0.004;
      this.phase = Math.random() * Math.PI * 2;
      
      // Escala individual para dar sensación de profundidad espacial
      this.scale = 0.6 + Math.random() * 0.8;

      // Asignación de estampa pre-renderizada
      this.sprite = offscreenSprites[Math.floor(Math.random() * offscreenSprites.length)];
    }

    update(w, h) {
      this.x += this.speedX;
      this.phase += 0.012;

      // Trayectoria sinusoidal suave
      this.y = this.baseY + Math.sin(this.x * this.frequency + this.phase) * this.amplitude;

      // Reciclaje al salir de la pantalla
      if (this.x > w + 30) {
        this.init(w, h, false);
      }
    }

    draw(context) {
      const renderSize = this.sprite.size * this.scale;
      // Transferencia ultra-rápida de píxeles vía drawImage (GPU-friendly)
      context.drawImage(
        this.sprite.canvas,
        this.x - renderSize / 2,
        this.y - renderSize / 2,
        renderSize,
        renderSize
      );
    }
  }

  // 5. Configuración de nodos
  function setupNodes() {
    nodes = [];
    const count = Math.max(30, Math.floor(width / 30));
    for (let i = 0; i < count; i++) {
      nodes.push(new SinusoidalNode(width, height));
    }
  }

  // 6. Redimensionamiento y adaptación HiDPI
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);

    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    ctx.scale(dpr, dpr);

    // Reconstruir estampas y recolocar nodos
    buildOffscreenSprites();
    setupNodes();
  }

  // 7. Bucle continuo de renderizado
  function animate() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < nodes.length; i++) {
      nodes[i].update(width, height);
      nodes[i].draw(ctx);
    }

    requestAnimationFrame(animate);
  }

  // 8. Eventos de inicialización
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