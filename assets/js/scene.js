/* LKH Service — scène 3D « avant / après » (canvas 2D, sans bibliothèque).
   Un terrain en volume : haie, broussailles, arbre à élaguer, arbre à abattre.
   Glisser pour tourner, curseur pour passer d'avant à après. */
(function () {
  "use strict";
  var canvas = document.getElementById("scene");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var slider = document.getElementById("scene-t");
  var chips = Array.prototype.slice.call(document.querySelectorAll(".legend a"));
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var PITCH = 0.56, cP = Math.cos(PITCH), sP = Math.sin(PITCH);
  var yaw = -0.62, yawBase = -0.62, t = 0, active = null, faces2d = [];
  var W = 0, H = 0, S = 1, dpr = 1, dirty = true, visible = true, dragging = false, played = false;

  /* ---------- petits outils ---------- */
  function rnd(seed) { var x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function ease(k) { return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }
  function hex(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  function mix(a, b, k) { return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)]; }
  var CLAY = hex("#b4512c");

  /* ---------- maillages ---------- */
  // chaque maillage : {c:[x,y,z] centre, f:[[p,p,p..],..], col:"#hex", zone}
  var meshes;
  function add(c, f, col, zone) { meshes.push({ c: c, f: f, col: hex(col), zone: zone || null }); }

  function box(cx, y0, cz, w, h, d, col, zone) {
    if (h <= 0.01 || w <= 0.01) return;
    var x0 = cx - w / 2, x1 = cx + w / 2, y1 = y0 + h, z0 = cz - d / 2, z1 = cz + d / 2;
    var v = [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]];
    add([cx, y0 + h / 2, cz], [[v[4], v[5], v[6], v[7]], [v[0], v[1], v[5], v[4]], [v[1], v[2], v[6], v[5]], [v[2], v[3], v[7], v[6]], [v[3], v[0], v[4], v[7]]], col, zone);
  }
  // tronc de cône à n côtés (r1 = 0 : cône)
  function cone(cx, y0, cz, r0, r1, h, n, col, zone, twist) {
    if (h <= 0.01 || r0 <= 0.01) return;
    var f = [], top = [], i, a0, a1, tw = twist || 0;
    for (i = 0; i < n; i++) {
      a0 = tw + (i / n) * 6.2832; a1 = tw + ((i + 1) / n) * 6.2832;
      var b0 = [cx + Math.cos(a0) * r0, y0, cz + Math.sin(a0) * r0], b1 = [cx + Math.cos(a1) * r0, y0, cz + Math.sin(a1) * r0];
      if (r1 > 0.01) {
        var t0 = [cx + Math.cos(a0) * r1, y0 + h, cz + Math.sin(a0) * r1], t1 = [cx + Math.cos(a1) * r1, y0 + h, cz + Math.sin(a1) * r1];
        f.push([b0, b1, t1, t0]); top.push(t0);
      } else f.push([b0, b1, [cx, y0 + h, cz]]);
    }
    if (top.length) f.push(top);
    add([cx, y0 + h / 2, cz], f, col, zone);
  }
  // toit à deux pans
  function roof(cx, y0, cz, w, h, d, col) {
    var x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2, y1 = y0 + h;
    var a = [x0, y0, z0], b = [x1, y0, z0], c = [x1, y0, z1], e = [x0, y0, z1], r0 = [x0, y1, cz], r1 = [x1, y1, cz];
    add([cx, y0 + h / 3, cz], [[a, b, r1, r0], [e, c, r1, r0], [a, e, r0], [b, c, r1]], col);
  }
  // ombre portée : disque plat au sol
  function shadow(cx, cz, r) { if (r > 0.05) cone(cx + r * 0.25, 0.012, cz + r * 0.18, r, r, 0.012, 12, "#bccca6"); }
  // boule facettée (icosaèdre irrégulier)
  var G = 1.618, ICO_V = [[-1, G, 0], [1, G, 0], [-1, -G, 0], [1, -G, 0], [0, -1, G], [0, 1, G], [0, -1, -G], [0, 1, -G], [G, 0, -1], [G, 0, 1], [-G, 0, -1], [-G, 0, 1]];
  var ICO_F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  function blob(cx, cy, cz, r, col, zone, seed, sy) {
    if (r <= 0.03) return;
    var k = r / 1.902, v = ICO_V.map(function (p, i) {
      var j = 0.82 + rnd(seed + i * 3.1) * 0.36;
      return [cx + p[0] * k * j, cy + p[1] * k * j * (sy || 1), cz + p[2] * k * j];
    });
    add([cx, cy, cz], ICO_F.map(function (f) { return [v[f[0]], v[f[1]], v[f[2]]]; }), col, zone);
  }

  /* ---------- la scène, selon t (0 = avant, 1 = après) ---------- */
  function build(k) {
    meshes = [];
    var i, inv = 1 - k;
    // socle
    box(0, -0.45, 0, 10.4, 0.45, 8.2, "#c9d9b4");
    box(0, -0.75, 0, 10.4, 0.3, 8.2, "#b79a72");
    // zone débroussaillée : la terre apparaît propre
    box(-3.05, 0, 2.3, 3.5, 0.02, 3.0, k > 0.5 ? "#cfdcba" : "#bfcf9f");

    // maison, pour l'échelle
    box(3.6, 0, 2.2, 2.3, 1.35, 1.9, "#efe6d2");
    box(3.6, 1.35, 2.2, 2.3, 0.06, 1.9, "#d9cfb8");
    roof(3.6, 1.41, 2.2, 2.5, 0.85, 2.1, "#b4512c");
    box(3.2, 0, 3.16, 0.42, 0.85, 0.04, "#6b5340");
    box(4.05, 0.55, 3.16, 0.5, 0.42, 0.04, "#9db7c4");
    box(3.0, 2.0, 1.75, 0.26, 0.5, 0.26, "#d9cfb8");

    // haie du fond : irrégulière avant, nette après
    for (i = 0; i < 9; i++) {
      var h0 = 1.05 + rnd(i + 1) * 1.0, d0 = 0.75 + rnd(i + 20) * 0.5, off = (rnd(i + 40) - 0.5) * 0.3;
      box(-4.5 + i * 0.78, 0, -3.35 + off * inv, 0.8, lerp(h0, 1.15, k), lerp(d0, 0.72, k), i % 2 ? "#3d6f4b" : "#447a52", "haies");
    }

    // broussailles et ronces, à l'avant gauche
    for (i = 0; i < 16; i++) {
      var bx = -4.5 + rnd(i + 60) * 3.0, bz = 1.0 + rnd(i + 80) * 2.6, bh = (0.45 + rnd(i + 100) * 0.95) * inv, br = (0.28 + rnd(i + 120) * 0.3) * (0.4 + 0.6 * inv);
      if (i % 3 === 0) blob(bx, bh * 0.55, bz, bh * 0.75, "#6f7f45", "debroussaillage", i + 7, 0.8);
      else cone(bx, 0, bz, br, 0, bh, 5, i % 2 ? "#5d7440" : "#7b8a4c", "debroussaillage", rnd(i) * 3);
    }

    // arbre à élaguer : branches basses et houppier trop large avant
    shadow(2.7, -1.0, lerp(1.35, 1.0, k));
    cone(2.7, 0, -1.0, 0.26, 0.17, 2.3, 6, "#7b5d43", "elagage");
    blob(2.7, lerp(3.3, 3.45, k), -1.0, lerp(1.55, 1.3, k), "#4c8050", "elagage", 3, 1.05);
    blob(1.75, 2.05, -0.75, 0.82 * inv, "#447648", "elagage", 11);
    blob(3.55, 1.85, -0.55, 0.74 * inv, "#447648", "elagage", 17);
    blob(3.0, 1.75, 0.15, 0.7 * inv, "#3f6f45", "elagage", 23);
    blob(2.3, 2.45, -1.9, 0.66 * inv, "#447648", "elagage", 29);

    // arbre mort à abattre : il laisse une souche et du bois rangé
    shadow(-0.2, 0.4, lerp(0.8, 0.3, k));
    cone(-0.2, 0, 0.4, 0.24, lerp(0.13, 0.22, k), lerp(3.1, 0.22, k), 6, "#85735f", "abattage");
    blob(-0.55, 2.6, 0.5, 0.5 * inv, "#9a8f62", "abattage", 31);
    blob(0.2, 3.15, 0.3, 0.58 * inv, "#a2966a", "abattage", 37);
    blob(-0.25, 3.7, 0.55, 0.4 * inv, "#948a5c", "abattage", 41);
    var lg = 0.3 * k;
    box(1.25, 0, 1.45, 1.1 * k, lg, 0.3, "#b89468", "abattage");
    box(1.25, 0, 1.8, 1.1 * k, lg, 0.3, "#c19d70", "abattage");
    box(1.25, lg, 1.62, 1.1 * k, lg, 0.3, "#ad8a5f", "abattage");

    // sapins du décor
    [[4.3, -3.0, 1], [-1.6, -1.6, 0.78], [-4.3, -1.3, 0.7]].forEach(function (p, n) {
      var s = p[2];
      shadow(p[0], p[1], 0.8 * s);
      cone(p[0], 0, p[1], 0.13 * s, 0.1 * s, 0.5 * s, 5, "#6b5340");
      cone(p[0], 0.45 * s, p[1], 0.95 * s, 0, 1.3 * s, 7, "#2f5d43", null, n);
      cone(p[0], 1.2 * s, p[1], 0.72 * s, 0, 1.15 * s, 7, "#356749", null, n + 0.4);
      cone(p[0], 1.9 * s, p[1], 0.48 * s, 0, 1.0 * s, 7, "#3b7050", null, n + 0.8);
    });
  }

  /* ---------- rendu ---------- */
  function render() {
    build(ease(t));
    var cY = Math.cos(yaw), sY = Math.sin(yaw), out = [], L = [-0.42, 0.78, 0.46];
    function rot(p) { return [p[0] * cY + p[2] * sY, p[1], -p[0] * sY + p[2] * cY]; }
    meshes.forEach(function (m) {
      var mc = rot(m.c), col = m.zone && m.zone === active ? mix(m.col, CLAY, 0.55) : m.col;
      m.f.forEach(function (face) {
        var p = face.map(rot), a = p[0], b = p[1], c = p[2];
        var ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
        var nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
        nx /= len; ny /= len; nz /= len;
        var gx = 0, gy = 0, gz = 0;
        p.forEach(function (q) { gx += q[0]; gy += q[1]; gz += q[2]; });
        gx /= p.length; gy /= p.length; gz /= p.length;
        if (nx * (gx - mc[0]) + ny * (gy - mc[1]) + nz * (gz - mc[2]) < 0) { nx = -nx; ny = -ny; nz = -nz; }
        if (ny * sP + nz * cP <= 0) return; // face cachée
        var li = 0.6 + 0.4 * Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
        out.push({
          d: gz * cP + gy * sP,
          pts: p.map(function (q) { return [W / 2 + q[0] * S, H * 0.62 + (q[2] * sP - q[1] * cP) * S]; }),
          col: "rgb(" + Math.round(col[0] * li) + "," + Math.round(col[1] * li) + "," + Math.round(col[2] * li) + ")",
          zone: m.zone
        });
      });
    });
    out.sort(function (a, b) { return a.d - b.d; });
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.lineJoin = "round";
    out.forEach(function (f) {
      ctx.beginPath();
      f.pts.forEach(function (q, i) { if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); });
      ctx.closePath();
      ctx.fillStyle = f.col; ctx.strokeStyle = f.col; ctx.lineWidth = 0.8;
      ctx.fill(); ctx.stroke();
    });
    faces2d = out;
  }

  function resize() {
    var r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height; S = Math.min(W / 14.2, H / 10.2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
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
  var t0 = null, tweenFrom = 0, tweenTo = 0, tweenStart = 0, tweening = false;
  function tween(to) { tweenFrom = t; tweenTo = to; tweenStart = performance.now(); tweening = true; }
  function frame(now) {
    if (t0 === null) t0 = now;
    if (visible) {
      if (!dragging && !reduce) { var y = yawBase + Math.sin((now - t0) / 5200) * 0.16; if (Math.abs(y - yaw) > 0.0005) { yaw = y; dirty = true; } }
      if (tweening) {
        var k = Math.min((now - tweenStart) / 2600, 1);
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
  function end(e) {
    if (!dragging) return;
    dragging = false; canvas.classList.remove("is-drag");
    if (moved < 6) {
      var r = canvas.getBoundingClientRect(), z = zoneAt(e.clientX - r.left, e.clientY - r.top);
      if (z) window.location.href = "service-" + z + ".html";
    }
  }
  canvas.addEventListener("pointerup", end);
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
      if (visible && !played) { played = true; if (reduce) { t = 0; } else setTimeout(function () { tween(1); }, 1400); }
    }, { threshold: 0.35 }).observe(canvas);
  }
  resize();
  requestAnimationFrame(frame);
})();
