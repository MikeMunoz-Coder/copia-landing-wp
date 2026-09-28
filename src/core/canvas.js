/* ==========================================================================
   Lienzo animado de fondo — Wifi Prado
   Ruta: src/core/canvas.js
   Tres capas: degradado (CSS), malla de constelación + ondas de fibra (este
   canvas) y viñeta (CSS). Queda fijo al viewport; el contenido pasa encima.
   ========================================================================== */

(function () {
  'use strict';

  var cv = document.getElementById('wp-canvas');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  if (!ctx) return;

  var CYAN = '#69B9F0';
  var MESH_DENSITY = 1;
  var PULSE_RATE = 1;

  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = motionQuery.matches;
  var W = 0, H = 0, dpr = 1;
  var nodes = [], edges = [], dots = [], curves = [], curvePts = [];
  var pulses = [], sparks = [], baseCv = null, glow = null;
  var raf = 0, last = 0, spawn = 0, sparkIn = 0;

  /* Sprite del halo de los nodos: se dibuja una vez y se reusa */
  function makeGlow(color) {
    var s = 64, c = document.createElement('canvas');
    c.width = c.height = s;
    var g = c.getContext('2d');
    var grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grd.addColorStop(0, 'rgba(255,255,255,.95)');
    grd.addColorStop(0.22, color);
    grd.addColorStop(0.55, 'rgba(105,185,240,.28)');
    grd.addColorStop(1, 'rgba(105,185,240,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, s, s);
    return c;
  }

  var sizeWatcher = null;

  function buildScene() {
    W = window.innerWidth || document.documentElement.clientWidth;
    H = window.innerHeight || document.documentElement.clientHeight;

    if (!W || !H) {
      if (!sizeWatcher && typeof ResizeObserver === 'function') {
        sizeWatcher = new ResizeObserver(function () {
          if (window.innerWidth && window.innerHeight) {
            sizeWatcher.disconnect();
            sizeWatcher = null;
            buildScene();
          }
        });
        sizeWatcher.observe(document.documentElement);
      }
      return;
    }

    dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    /* --- Malla: nodos repartidos en el tercio superior --- */
    var base = W < 760 ? 16 : W < 1200 ? 26 : 36;
    var count = Math.max(8, Math.round(base * MESH_DENSITY));
    var cols = Math.ceil(Math.sqrt(count * (W / (H * 0.42))));
    var rows = Math.ceil(count / cols);

    nodes = [];
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols && nodes.length < count; c++) {
        var gx = (c + 0.5) / cols, gy = (r + 0.5) / rows;
        nodes.push({
          bx: (gx + (Math.random() - 0.5) * 0.85 / cols * 1.6) * W * 1.1 - W * 0.05,
          by: (gy + (Math.random() - 0.5) * 0.9 / rows) * H * 0.40 - H * 0.03,
          ax: 4 + Math.random() * 5, ay: 4 + Math.random() * 5,
          px: 6 + Math.random() * 8, py: 6 + Math.random() * 8, // <--- Periodo en X y Y: ciclo de 6 a 14 segundos
          ph: Math.random() * 100,
          r: 1.6 + Math.random() * 1.4,
          bp: 7 + Math.random() * 9, bph: Math.random() * 100
        });
      }
    }

    var link = W < 760 ? W * 0.34 : W * 0.19;
    edges = [];
    for (var i = 0; i < nodes.length; i++) {
      for (var j = i + 1; j < nodes.length; j++) {
        var dx = nodes[i].bx - nodes[j].bx, dy = nodes[i].by - nodes[j].by;
        var d = Math.hypot(dx, dy);
        if (d < link) edges.push([i, j, 1 - d / link]);
      }
    }

    /* --- Puntos sueltos apagados (titilado) --- */
    dots = [];
    var dn = W < 760 ? 8 : 16;
    for (var k = 0; k < dn; k++) {
      dots.push({
        x: Math.random() * W, y: Math.random() * H * 0.52,
        r: 1.5 + Math.random() * 1.2, a: 0.25 + Math.random() * 0.45,
        tp: 2.4 + Math.random() * 3.6, tph: Math.random() * 100
      });
    }

    /* --- Ondas del tercio inferior --- */
    var curveCount = W < 760 ? 6 : 9;
    curves = [];
    for (var q = 0; q < curveCount; q++) {
      var t = q / (curveCount - 1);
      var heroCurve = q % 3 === 1;
      curves.push({
        y: H * (0.74 + t * 0.30),
        a1: H * (0.070 + Math.random() * 0.075),
        a2: H * (0.018 + Math.random() * 0.030),
        f1: (0.55 + Math.random() * 0.45) * Math.PI * 2 / W,
        f2: (1.5 + Math.random() * 1.1) * Math.PI * 2 / W,
        p1: 2.2 + t * 1.5 + Math.random() * 0.5,
        p2: Math.random() * 6.28,
        lw: heroCurve ? 2 + Math.random() * 1 : 1.1 + Math.random() * 1, // <--heroCurve ? 0.45 + Math.random() * 0.10 : 0.20 + Math.random() * 0.15)
        // al controla la luminosidad general de la curva (0.0 a 1.0)
        al: heroCurve ? 0.85 + Math.random() * 0.15 : 0.45 + Math.random() * 0.35
      });
    }
    curvePts = curves.map(function (c) {
      var pts = [];
      for (var x = -20; x <= W + 20; x += 7) {
        pts.push([x, c.y + c.a1 * Math.sin(x * c.f1 + c.p1) + c.a2 * Math.sin(x * c.f2 + c.p2)]);
      }
      return pts;
    });

    /* --- Capa estática: curvas con glow + gotas --- */
    baseCv = document.createElement('canvas');
    baseCv.width = cv.width;
    baseCv.height = cv.height;
    var b = baseCv.getContext('2d');
    b.setTransform(dpr, 0, 0, dpr, 0, 0);

    b.lineCap = 'round';
    b.globalCompositeOperation = 'lighter';
    curvePts.forEach(function (pts, i) {
      var c = curves[i];
      var path = new Path2D();
      path.moveTo(pts[0][0], pts[0][1]);
      for (var m = 1; m < pts.length; m++) path.lineTo(pts[m][0], pts[m][1]);

      // Capa 1: Halo exterior amplio (22x grosor) -> Alfa actual: c.al * 0.05
      b.strokeStyle = 'rgba(255,196,224,' + (c.al * 0.02) + ')'; b.lineWidth = c.lw * 22; b.stroke(path);

      // Capa 2: Resplandor medio (11x grosor) -> Alfa actual: c.al * 0.09
      b.strokeStyle = 'rgba(255,214,236,' + (c.al * 0.04) + ')'; b.lineWidth = c.lw * 11; b.stroke(path);

      // Capa 3: Brillo cercano (4.5x grosor) -> Alfa actual: c.al * 0.20
      b.strokeStyle = 'rgba(255,255,255,' + (c.al * 0.10) + ')'; b.lineWidth = c.lw * 4.5; b.stroke(path);

      // Capa 4: Contorno luminoso (1.9x grosor) -> Alfa actual: c.al * 0.55
      b.strokeStyle = 'rgba(255,255,255,' + (c.al * 0.25) + ')'; b.lineWidth = c.lw * 1.9; b.stroke(path);

      // Capa 5: Núcleo físico (1x grosor) -> Alfa actual: c.al * 1.05
      b.strokeStyle = 'rgba(255,255,255,' + Math.min(1, c.al * 0.50) + ')'; b.lineWidth = c.lw; b.stroke(path);
    });

    var drops = W < 760 ? 10 : 20;
    for (var p = 0; p < drops; p++) {
      var src = curvePts[Math.floor(Math.random() * curvePts.length)];
      var pt = src[Math.floor(Math.random() * src.length)];
      var rr = 1.2 + Math.random() * 2.6;
      b.beginPath();
      b.arc(pt[0] + (Math.random() - 0.5) * 90, pt[1] + (Math.random() - 0.5) * H * 0.14, rr, 0, 6.2832);
      b.fillStyle = 'rgba(255,255,255,' + (0.35 + Math.random() * 0.5) + ')';
      b.fill();
    }
    b.globalCompositeOperation = 'source-over';

    if (reduced) draw(0);
  }

  function step(dt) {
    var mobile = W < 760;
    spawn -= dt;
    var maxP = mobile ? 6 : 14;
    if (spawn <= 0 && pulses.length < maxP && PULSE_RATE > 0) {
      spawn = (mobile ? 0.55 : 0.26) / PULSE_RATE * (0.6 + Math.random() * 0.8);
      pulses.push({
        c: Math.floor(Math.random() * curves.length),
        pos: -0.16,
        dir: Math.random() < 0.5 ? 1 : -1,
        sp: 0.42 + Math.random() * 0.48,
        len: 0.08 + Math.random() * 0.10
      });
    }
    pulses.forEach(function (p) { p.pos += p.sp * dt; });
    pulses = pulses.filter(function (p) { return p.pos < 1.2; });

    sparkIn -= dt;
    if (sparkIn <= 0 && nodes.length) {
      sparkIn = (mobile ? 1.8 : 0.9) + Math.random() * 1.4;
      if (sparks.length < (mobile ? 2 : 4)) {
        sparks.push({
          i: Math.floor(Math.random() * nodes.length),
          t: 0,
          dur: 0.85 + Math.random() * 0.75
        });
      }
    }
    sparks.forEach(function (sk) { sk.t += dt; });
    sparks = sparks.filter(function (sk) { return sk.t < sk.dur; });
  }

  function draw(time) {
    ctx.clearRect(0, 0, W, H);
    if (baseCv && baseCv.width && baseCv.height) ctx.drawImage(baseCv, 0, 0, W, H);

    var pos = nodes.map(function (n) {
      return [
        n.bx + n.ax * Math.sin((time / n.px) * 6.2832 + n.ph),
        n.by + n.ay * Math.cos((time / n.py) * 6.2832 + n.ph * 1.3)
      ];
    });

    /* Puntos sueltos titilantes */
    dots.forEach(function (d) {
      var tw = 0.55 + 0.45 * Math.sin((time / d.tp) * 6.2832 + d.tph);
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r * (0.85 + tw * 0.3), 0, 6.2832);
      ctx.fillStyle = 'rgba(158,148,205,' + (d.a * tw).toFixed(3) + ')';
      ctx.fill();
    });

    ctx.lineCap = 'round';
    edges.forEach(function (e) {
      var i = e[0], j = e[1], s = e[2];
      ctx.beginPath();
      ctx.moveTo(pos[i][0], pos[i][1]);
      ctx.lineTo(pos[j][0], pos[j][1]);
      ctx.strokeStyle = 'rgba(105,185,240,' + (0.10 + s * 0.34) + ')';
      ctx.lineWidth = 1 + s * 0.5;
      ctx.stroke();
    });

    ctx.globalCompositeOperation = 'lighter';
    nodes.forEach(function (n, i) {
      var b = 0.6 + 0.4 * (0.5 + 0.5 * Math.sin((time / n.bp) * 6.2832 + n.bph));
      var g = n.r * 9;
      ctx.globalAlpha = b * 0.85;
      if (glow) ctx.drawImage(glow, pos[i][0] - g, pos[i][1] - g, g * 2, g * 2);
      ctx.globalAlpha = b;
      ctx.beginPath();
      ctx.arc(pos[i][0], pos[i][1], n.r, 0, 6.2832);
      ctx.fillStyle = CYAN;
      ctx.fill();
    });

    /* Destellos con 4 rayos */
    sparks.forEach(function (sk) {
      var n = nodes[sk.i], p = pos[sk.i];
      if (!n || !p) return;
      var e = sk.t / sk.dur;
      var f = Math.sin(Math.PI * e);
      var g = n.r * (7.5 + 10 * f);
      ctx.globalAlpha = f * 0.38;
      if (glow) ctx.drawImage(glow, p[0] - g, p[1] - g, g * 2, g * 2);

      var ray = n.r * (4 + 6.5 * f);
      ctx.globalAlpha = f * 0.42;
      ctx.strokeStyle = 'rgba(255,255,255,.8)';
      ctx.lineWidth = Math.max(0.6, n.r * 0.3 * f);
      ctx.beginPath();
      ctx.moveTo(p[0] - ray, p[1]); ctx.lineTo(p[0] + ray, p[1]);
      ctx.moveTo(p[0], p[1] - ray * 0.7); ctx.lineTo(p[0], p[1] + ray * 0.7);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;

    /* Pulsos de fibra óptica */
    pulses.forEach(function (p) {
      var pts = curvePts[p.c];
      if (!pts) return;
      var n = pts.length;
      var head = p.dir === 1 ? p.pos : 1 - p.pos;
      var steps = 26;
      for (var k = 0; k < steps; k++) {
        var u = k / steps;
        var t0 = head - p.dir * p.len * u;
        var t1 = head - p.dir * p.len * (u + 1 / steps);
        var i0 = Math.round(t0 * (n - 1)), i1 = Math.round(t1 * (n - 1));
        if (i0 < 0 || i1 < 0 || i0 >= n || i1 >= n) continue;
        var edge = Math.min(1, Math.min(p.pos + 0.15, 1.05 - p.pos) * 4);
        var a = (1 - u) * (1 - u) * 0.25 * Math.max(0, edge);  // Reduce el brillo máximo a menos de la mitad
        ctx.beginPath();
        ctx.moveTo(pts[i0][0], pts[i0][1]);
        ctx.lineTo(pts[i1][0], pts[i1][1]);
        var lw = (curves[p.c] && curves[p.c].lw) || 1.4;
        ctx.strokeStyle = 'rgba(255,255,255,' + a.toFixed(3) + ')';
        ctx.lineWidth = Math.max(2.4, lw * 2.2) * (1 - u * 0.55);
        ctx.stroke();
      }
    });
    ctx.globalCompositeOperation = 'source-over';
  }

  function frame(t) {
    var dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    step(dt);
    draw(t / 1000); // <--- 'time' entra en segundos (t / 1000)
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (raf || reduced) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  // Inicialización de recursos gráficos
  glow = makeGlow(CYAN);
  buildScene();

  // Control de visibilidad
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });

  // Redimensionamiento con debounce
  var resizeTimer = 0;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(buildScene, 150);
  }, { passive: true });

  // Manejo reactivo de accesibilidad
  if (typeof motionQuery.addEventListener === 'function') {
    motionQuery.addEventListener('change', function () {
      reduced = motionQuery.matches;
      if (reduced) {
        stop();
        draw(0);
      } else {
        start();
      }
    });
  }

  // Arranque del ciclo
  if (reduced) {
    draw(0);
  } else {
    start();
  }
})();