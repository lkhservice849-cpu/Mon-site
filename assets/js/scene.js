/* LKH Service — scène 3D « avant / après » (canvas 2D, sans bibliothèque).
   Rendu : perspective, éclairage par facette, ombres portées au sol.
   Glisser pour tourner, curseur pour dérouler le chantier. */
(function () {
  "use strict";
  var canvas = document.getElementById("scene");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var shade = document.createElement("canvas"), sctx = shade.getContext("2d");
  var slider = document.getElementById("scene-t");
  var chips = Array.prototype.slice.call(document.querySelectorAll(".legend a"));
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var PITCH = 0.54, cP = Math.cos(PITCH), sP = Math.sin(PITCH), DIST = 36;
  var LIGHT = (function () { var v = [-0.52, 0.8, 0.3], l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]); return [v[0] / l, v[1] / l, v[2] / l]; })();
  var yaw = -0.6, yawBase = -0.6, t = 0, active = null, faces2d = [];
  var W = 0, H = 0, S = 1, dpr = 1, dirty = true, visible = true, dragging = false, played = false;

  function rnd(s) { var x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(k, a, b) { return Math.max(0, Math.min(1, (k - a) / (b - a))); }
  function smooth(k) { return k * k * (3 - 2 * k); }
  function hex(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  function mix(a, b, k) { return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)]; }
  var CLAY = hex("#2f5d46");

  /* ---------- maillages ---------- */
  var meshes, cur, lawnTop;
  function add(c, f, col, zone) { meshes.push({ c: c, f: f, col: typeof col === "string" ? hex(col) : col, zone: zone || null, layer: cur.layer, cast: cur.cast }); }

  function box(cx, y0, cz, w, h, d, col, zone) {
    if (h <= 0.002 || w <= 0.01 || d <= 0.01) return null;
    var x0 = cx - w / 2, x1 = cx + w / 2, y1 = y0 + h, z0 = cz - d / 2, z1 = cz + d / 2;
    var v = [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]];
    var top = [v[4], v[5], v[6], v[7]];
    add([cx, y0 + h / 2, cz], [top, [v[0], v[1], v[5], v[4]], [v[1], v[2], v[6], v[5]], [v[2], v[3], v[7], v[6]], [v[3], v[0], v[4], v[7]]], col, zone);
    return top;
  }
  // surface plate posée au sol (une seule face)
  function flat(cx, cz, w, d, y, col) {
    var x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2;
    add([cx, y - 1, cz], [[[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]]], col);
  }
  function cone(cx, y0, cz, r0, r1, h, n, col, zone, twist) {
    if (h <= 0.01 || r0 <= 0.01) return;
    var f = [], top = [], i, tw = twist || 0;
    for (i = 0; i < n; i++) {
      var a0 = tw + (i / n) * 6.2832, a1 = tw + ((i + 1) / n) * 6.2832;
      var b0 = [cx + Math.cos(a0) * r0, y0, cz + Math.sin(a0) * r0], b1 = [cx + Math.cos(a1) * r0, y0, cz + Math.sin(a1) * r0];
      if (r1 > 0.01) {
        var t0 = [cx + Math.cos(a0) * r1, y0 + h, cz + Math.sin(a0) * r1], t1 = [cx + Math.cos(a1) * r1, y0 + h, cz + Math.sin(a1) * r1];
        f.push([b0, b1, t1, t0]); top.push(t0);
      } else f.push([b0, b1, [cx, y0 + h, cz]]);
    }
    if (top.length) f.push(top);
    add([cx, y0 + h / 2, cz], f, col, zone);
  }
  // rondin couché le long de l'axe x
  function logX(cx, cy, cz, r, len, col, capCol, zone) {
    if (len <= 0.03 || r <= 0.02) return;
    var n = 6, f = [], c0 = [], c1 = [], i, x0 = cx - len / 2, x1 = cx + len / 2;
    for (i = 0; i < n; i++) {
      var a0 = (i / n) * 6.2832, a1 = ((i + 1) / n) * 6.2832;
      var p0 = [x0, cy + Math.sin(a0) * r, cz + Math.cos(a0) * r], p1 = [x0, cy + Math.sin(a1) * r, cz + Math.cos(a1) * r];
      var q0 = [x1, p0[1], p0[2]], q1 = [x1, p1[1], p1[2]];
      f.push([p0, p1, q1, q0]); c0.push(p0); c1.push(q0);
    }
    add([cx, cy, cz], f, col, zone);
    add([cx + 0.01, cy, cz], [c1], capCol, zone);
    add([cx - 0.01, cy, cz], [c0], capCol, zone);
  }
  function roof(cx, y0, cz, w, h, d, col) {
    var x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2, y1 = y0 + h;
    var a = [x0, y0, z0], b = [x1, y0, z0], c = [x1, y0, z1], e = [x0, y0, z1], r0 = [x0, y1, cz], r1 = [x1, y1, cz];
    add([cx, y0 + h / 3, cz], [[a, b, r1, r0], [e, c, r1, r0], [a, e, r0], [b, c, r1]], col);
  }
  var G = 1.618, ICO_V = [[-1, G, 0], [1, G, 0], [-1, -G, 0], [1, -G, 0], [0, -1, G], [0, 1, G], [0, -1, -G], [0, 1, -G], [G, 0, -1], [G, 0, 1], [-G, 0, -1], [-G, 0, 1]];
  var ICO_F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  function blob(cx, cy, cz, r, col, zone, seed, sy) {
    if (r <= 0.04) return;
    var k = r / 1.902, v = ICO_V.map(function (p, i) {
      var j = 0.8 + rnd(seed + i * 3.1) * 0.4;
      return [cx + p[0] * k * j, cy + p[1] * k * j * (sy || 1), cz + p[2] * k * j];
    });
    add([cx, cy, cz], ICO_F.map(function (f) { return [v[f[0]], v[f[1]], v[f[2]]]; }), col, zone);
  }
  // transforme tous les points des maillages ajoutés depuis l'indice i0
  function xform(i0, fn) {
    for (var i = i0; i < meshes.length; i++) {
      var m = meshes[i];
      m.c = fn(m.c);
      m.f = m.f.map(function (face) { return face.map(fn); });
    }
  }

  /* ---------- la scène, selon k (0 = avant, 1 = après) ---------- */
  function build(k) {
    meshes = []; var i, p;
    // --- sol (sans ombre portée)
    cur = { layer: 0, cast: false };
    box(0, -0.95, 0, 10.8, 0.7, 8.8, "#a88a64");
    lawnTop = box(0, -0.25, 0, 10.8, 0.25, 8.8, "#bcd0a5");
    for (i = 0; i < 7; i++) flat(-4.64 + i * 1.545, 0, 0.772, 8.8, 0.002, "#c4d6ae");
    flat(-3.1, 2.4, 3.7, 3.3, 0.004, mix(hex("#a3b383"), hex("#c0d3a9"), smooth(seg(k, 0.1, 0.75))));
    flat(3.15, 3.75, 0.6, 1.3, 0.006, "#dccfb3");

    cur = { layer: 1, cast: true };
    // --- clôture
    for (i = 0; i < 9; i++) box(-5.1, 0, -3.9 + i * 0.975, 0.11, 0.62, 0.11, "#a98c67");
    box(-5.1, 0.24, 0, 0.05, 0.08, 7.9, "#b79a74");
    box(-5.1, 0.46, 0, 0.05, 0.08, 7.9, "#b79a74");

    // --- maison
    box(3.6, 0, 2.2, 2.3, 1.45, 1.9, "#efe6d2");
    roof(3.6, 1.45, 2.2, 2.62, 0.95, 2.24, "#b4512c");
    box(3.02, 1.75, 1.72, 0.3, 0.78, 0.3, "#d2c7b0");
    cur.cast = false;
    box(3.15, 0, 3.165, 0.46, 0.95, 0.04, "#5c4636");
    box(3.15, 0, 3.3, 0.7, 0.07, 0.26, "#cfc4ad");
    box(4.1, 0.55, 3.165, 0.56, 0.5, 0.04, "#8fb0c0");
    box(4.765, 0.55, 2.2, 0.04, 0.5, 0.62, "#8fb0c0");
    cur.cast = true;

    // --- haie du fond : taillée segment après segment
    var N = 14;
    for (i = 0; i < N; i++) {
      p = smooth(seg(k, 0.04 + (i / N) * 0.5, 0.2 + (i / N) * 0.5));
      var hx = -4.42 + i * 0.47, h0 = 1.05 + rnd(i + 1) * 0.95, d0 = 0.74 + rnd(i + 20) * 0.5, off = (rnd(i + 40) - 0.5) * 0.3 * (1 - p);
      var hc = ["#3d6f4b", "#447a52", "#3a6946"][i % 3];
      box(hx, 0, -3.5 + off, 0.48, lerp(h0, 1.2, p), lerp(d0, 0.72, p), hc, "haies");
      blob(hx + off, h0 + 0.12, -3.5 + off * 2, (0.3 + rnd(i + 55) * 0.28) * (1 - p), "#4c8558", "haies", i + 5);
    }

    // --- broussailles : nettoyées de gauche à droite
    var NB = 24;
    for (i = 0; i < NB; i++) {
      p = smooth(seg(k, 0.08 + (i / NB) * 0.52, 0.24 + (i / NB) * 0.52));
      var s = 1 - p, bx = -4.7 + (i / NB) * 3.2 + rnd(i + 60) * 0.3, bz = 0.95 + rnd(i + 80) * 2.9;
      if (i % 4 === 0) blob(bx, 0.42 * s, bz, (0.5 + rnd(i + 90) * 0.3) * s, "#6c7c43", "debroussaillage", i + 7, 0.75);
      else if (i % 4 === 3) { cone(bx, 0, bz, 0.05 * s, 0.03 * s, (1.1 + rnd(i) * 0.6) * s, 4, "#6f5b45", "debroussaillage"); blob(bx, (1.2 + rnd(i) * 0.6) * s, bz, 0.36 * s, "#7f8f4e", "debroussaillage", i + 3); }
      else cone(bx, 0, bz, (0.26 + rnd(i + 120) * 0.26) * s, 0, (0.5 + rnd(i + 100) * 0.9) * s, 5, i % 2 ? "#5d7440" : "#7b8a4c", "debroussaillage", rnd(i) * 3);
    }

    // --- grand arbre : élagué branche après branche
    var crown = smooth(seg(k, 0.62, 0.8));
    cone(2.6, 0, -0.5, 0.32, 0.19, 2.6, 7, "#7b5d43", "elagage");
    blob(2.6, 3.75, -0.5, lerp(1.5, 1.38, crown), "#4c8050", "elagage", 3, 1.05);
    blob(2.0, 3.35, -1.0, 0.98, "#447648", "elagage", 51);
    blob(3.25, 3.45, -0.85, 0.92, "#528a56", "elagage", 53);
    blob(2.55, 3.3, 0.25, lerp(0.95, 0.8, crown), "#467a4b", "elagage", 57);
    blob(2.65, 4.6, -0.55, 0.82, "#5a9460", "elagage", 59);
    blob(1.55, 2.15, -0.3, 0.82 * (1 - smooth(seg(k, 0.3, 0.44))), "#447648", "elagage", 11);
    blob(3.45, 2.05, 0.75, 0.9 * (1 - smooth(seg(k, 0.4, 0.54))), "#3f6f45", "elagage", 17);
    blob(2.8, 1.65, 0.6, 0.6 * (1 - smooth(seg(k, 0.5, 0.62))), "#447648", "elagage", 23);
    blob(2.15, 2.35, -1.5, 0.72 * (1 - smooth(seg(k, 0.56, 0.7))), "#3f6f45", "elagage", 29);

    // --- arbre mort : il tombe, puis devient un tas de bois
    var px = -0.4, pz = 0.3, fall = seg(k, 0.34, 0.6), ang = fall * fall * 1.5708, gone = smooth(seg(k, 0.64, 0.82)), pile = smooth(seg(k, 0.64, 0.9));
    cone(px, 0, pz, 0.27, 0.23, 0.2, 6, "#8f7b64", "abattage");
    var i0 = meshes.length;
    cone(px, 0.2, pz, 0.23, 0.11, 3.1, 6, "#85735f", "abattage");
    cone(px + 0.1, 2.2, pz, 0.06, 0, 0.9, 4, "#85735f", "abattage");
    blob(px - 0.4, 2.75, pz + 0.1, 0.5, "#9a8f62", "abattage", 31);
    blob(px + 0.4, 3.3, pz - 0.1, 0.6, "#a2966a", "abattage", 37);
    blob(px - 0.05, 3.85, pz + 0.15, 0.42, "#948a5c", "abattage", 41);
    var ca = Math.cos(ang), sa = Math.sin(ang), sc = 1 - gone, tx = px - 1.6, ty = 0.2;
    xform(i0, function (q) {
      var dx = q[0] - px, dy = q[1] - 0.2;
      var x = px + dx * ca - dy * sa, y = 0.2 + dx * sa + dy * ca;
      return [tx + (x - tx) * sc, ty + (y - ty) * sc, pz + (q[2] - pz) * sc];
    });
    var lr = 0.17 * pile, ll = 1.05 * pile, lx = -2.0;
    [[0.17, -0.36], [0.17, 0], [0.17, 0.36], [0.47, -0.18], [0.47, 0.18], [0.77, 0]].forEach(function (o, n) {
      logX(lx, o[0] * pile, pz + o[1] * pile, lr, ll, n % 2 ? "#a98761" : "#b3906a", "#d8bd94", "abattage");
    });

    // --- sapins du décor
    [[4.45, -3.3, 1], [-4.2, -1.9, 0.78]].forEach(function (c, n) {
      var z = c[2];
      cone(c[0], 0, c[1], 0.14 * z, 0.1 * z, 0.55 * z, 5, "#6b5340");
      cone(c[0], 0.45 * z, c[1], 1.0 * z, 0, 1.25 * z, 8, "#2c583f", null, n);
      cone(c[0], 1.1 * z, c[1], 0.8 * z, 0, 1.15 * z, 8, "#316245", null, n + 0.4);
      cone(c[0], 1.75 * z, c[1], 0.6 * z, 0, 1.05 * z, 8, "#376b4b", null, n + 0.8);
      cone(c[0], 2.35 * z, c[1], 0.4 * z, 0, 0.95 * z, 8, "#3d7552", null, n + 1.2);
    });
  }

  /* ---------- rendu ---------- */
  function render() {
    build(t);
    var cY = Math.cos(yaw), sY = Math.sin(yaw), cx0 = W / 2, cy0 = H * 0.61;
    // monde -> vue (x droite, y haut, z vers la caméra)
    function view(q) {
      var xr = q[0] * cY + q[2] * sY, zr = -q[0] * sY + q[2] * cY;
      return [xr, q[1] * cP - zr * sP, zr * cP + q[1] * sP];
    }
    function screen(v) { var f = DIST / (DIST - v[2]); return [cx0 + v[0] * f * S, cy0 - v[1] * f * S]; }
    function path(c, pts) { c.beginPath(); pts.forEach(function (q, i) { if (i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }); c.closePath(); }

    var ground = [], solid = [];
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0); sctx.clearRect(0, 0, W, H); sctx.fillStyle = "#000";
    meshes.forEach(function (m) {
      var col = m.zone && m.zone === active ? mix(m.col, CLAY, 0.5) : m.col;
      m.f.forEach(function (face) {
        var a = face[0], b = face[1], c = face[2];
        var ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
        var nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
        nx /= len; ny /= len; nz /= len;
        var gx = 0, gy = 0, gz = 0;
        face.forEach(function (q) { gx += q[0]; gy += q[1]; gz += q[2]; });
        gx /= face.length; gy /= face.length; gz /= face.length;
        if (nx * (gx - m.c[0]) + ny * (gy - m.c[1]) + nz * (gz - m.c[2]) < 0) { nx = -nx; ny = -ny; nz = -nz; }
        // ombre portée sur le sol
        if (m.cast) {
          path(sctx, face.map(function (q) { var d = Math.max(q[1], 0) / LIGHT[1]; return screen(view([q[0] - LIGHT[0] * d, 0.01, q[2] - LIGHT[2] * d])); }));
          sctx.fill();
        }
        var gv = view([gx, gy, gz]), nv = view([nx, ny, nz]);
        if (nv[0] * (0 - gv[0]) + nv[1] * (0 - gv[1]) + nv[2] * (DIST - gv[2]) <= 0) return; // face cachée
        var li = 0.58 + 0.42 * Math.max(0, nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]);
        (m.layer ? solid : ground).push({
          d: gv[2], pts: face.map(function (q) { return screen(view(q)); }), zone: m.zone,
          col: "rgb(" + Math.round(col[0] * li) + "," + Math.round(col[1] * li) + "," + Math.round(col[2] * li) + ")"
        });
      });
    });
    solid.sort(function (a, b) { return a.d - b.d; });

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.lineJoin = "round"; ctx.lineWidth = 0.8;
    // ombre du socle
    var g = ctx.createRadialGradient(cx0, 0, S * 1.5, cx0, 0, S * 7.4);
    g.addColorStop(0, "rgba(24,38,29,.22)"); g.addColorStop(1, "rgba(24,38,29,0)");
    ctx.save(); ctx.translate(0, cy0 + S * 1.7); ctx.scale(1, 0.42); ctx.fillStyle = g; ctx.fillRect(0, -S * 8, W, S * 16); ctx.restore();
    function draw(f) { path(ctx, f.pts); ctx.fillStyle = f.col; ctx.strokeStyle = f.col; ctx.fill(); ctx.stroke(); }
    ground.forEach(draw);
    // ombres, limitées au dessus de la pelouse
    ctx.save();
    path(ctx, lawnTop.map(function (q) { return screen(view(q)); })); ctx.clip();
    ctx.globalAlpha = 0.17; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(shade, 0, 0);
    ctx.restore(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    solid.forEach(draw);
    faces2d = solid;
  }

  function resize() {
    var r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height; S = Math.min(W / 15.6, H / 12.2);
    canvas.width = shade.width = Math.round(W * dpr); canvas.height = shade.height = Math.round(H * dpr);
    dirty = true;
  }

  function zoneAt(x, y) {
    for (var i = faces2d.length - 1; i >= 0; i--) {
      var p = faces2d[i].pts, inside = false;
      for (var a = 0, b = p.length - 1; a < p.length; b = a++) {
        if ((p[a][1] > y) !== (p[b][1] > y) && x < (p[b][0] - p[a][0]) * (y - p[a][1]) / (p[b][1] - p[a][1]) + p[a][0]) inside = !inside;
      }
      if (inside) return faces2d[i].zone;
    }
    return null;
  }
  function setActive(z) {
    if (z === active) return;
    active = z; dirty = true;
    chips.forEach(function (c) { c.classList.toggle("is-on", c.getAttribute("data-zone") === z); });
  }

  /* ---------- boucle ---------- */
  var t0 = null, tweenFrom = 0, tweenTo = 0, tweenStart = 0, tweenDur = 1, tweening = false;
  function tween(to) { tweenFrom = t; tweenTo = to; tweenStart = performance.now(); tweenDur = Math.max(900, Math.abs(to - t) * 5200); tweening = true; }
  function frame(now) {
    if (t0 === null) t0 = now;
    if (visible) {
      if (!dragging && !reduce) { var y = yawBase + Math.sin((now - t0) / 5200) * 0.18; if (Math.abs(y - yaw) > 0.0005) { yaw = y; dirty = true; } }
      if (tweening) {
        var k = Math.min((now - tweenStart) / tweenDur, 1);
        t = lerp(tweenFrom, tweenTo, k); dirty = true;
        if (slider) slider.value = Math.round(t * 100);
        if (k >= 1) tweening = false;
      }
      if (dirty) { dirty = false; render(); }
    }
    requestAnimationFrame(frame);
  }

  /* ---------- interactions ---------- */
  var lastX = 0, moved = 0;
  canvas.addEventListener("pointerdown", function (e) { dragging = true; moved = 0; lastX = e.clientX; canvas.setPointerCapture(e.pointerId); canvas.classList.add("is-drag"); });
  canvas.addEventListener("pointermove", function (e) {
    var r = canvas.getBoundingClientRect();
    if (dragging) {
      var dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx);
      yaw += dx * 0.008; yawBase = yaw; t0 = null; dirty = true;
    } else if (e.pointerType === "mouse") {
      var z = zoneAt(e.clientX - r.left, e.clientY - r.top);
      setActive(z); canvas.style.cursor = z ? "pointer" : "grab";
    }
  });
  canvas.addEventListener("pointerup", function (e) {
    if (!dragging) return;
    dragging = false; canvas.classList.remove("is-drag");
    if (moved < 6) {
      var r = canvas.getBoundingClientRect(), z = zoneAt(e.clientX - r.left, e.clientY - r.top);
      if (z) window.location.href = "service-" + z + ".html";
    }
  });
  canvas.addEventListener("pointercancel", function () { dragging = false; canvas.classList.remove("is-drag"); });
  canvas.addEventListener("pointerleave", function () { if (!dragging) setActive(null); });
  canvas.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") { yaw += e.key === "ArrowLeft" ? -0.15 : 0.15; yawBase = yaw; t0 = null; dirty = true; e.preventDefault(); }
  });
  if (slider) slider.addEventListener("input", function () { tweening = false; played = true; t = slider.value / 100; dirty = true; });
  chips.forEach(function (c) {
    var z = c.getAttribute("data-zone");
    ["mouseenter", "focus"].forEach(function (ev) { c.addEventListener(ev, function () { setActive(z); }); });
    ["mouseleave", "blur"].forEach(function (ev) { c.addEventListener(ev, function () { setActive(null); }); });
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-scene-go]"), function (b) {
    b.addEventListener("click", function () { played = true; tween(Number(b.getAttribute("data-scene-go"))); });
  });

  window.addEventListener("resize", resize);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      if (visible && !played) { played = true; if (!reduce) setTimeout(function () { tween(1); }, 1300); }
    }, { threshold: 0.35 }).observe(canvas);
  }
  resize();
  requestAnimationFrame(frame);
})();
