/* ==========================================================================
   LKH Service — scripts (vanilla JS, aucune dépendance, aucun cookie)
   ========================================================================== */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(s, ctx) { return (ctx || document).querySelector(s); }
  function $$(s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); }

  /* ---------- Année du footer ---------- */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Header au scroll, bouton haut de page, barre mobile ---------- */
  var header = $(".site-header");
  var toTop = $(".to-top");
  var mobileCta = $(".mobile-cta");
  var ticking = false;
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle("is-scrolled", y > 24);
    if (toTop) toTop.classList.toggle("is-visible", y > 700);
    if (mobileCta) mobileCta.classList.toggle("is-visible", y > 420);
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });

  /* ---------- Menu mobile ---------- */
  var toggle = $(".nav-toggle");
  var nav = $("#main-nav");
  if (toggle && nav) {
    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
      nav.classList.toggle("is-open", open);
      document.body.classList.toggle("nav-open", open);
      if (open) { var first = $("a", nav); if (first) first.focus(); }
    };
    toggle.addEventListener("click", function () { setOpen(toggle.getAttribute("aria-expanded") !== "true"); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) { setOpen(false); toggle.focus(); }
      if (e.key === "Tab" && nav.classList.contains("is-open")) {
        var focusables = [toggle].concat($$("a", nav));
        var i = focusables.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); focusables[focusables.length - 1].focus(); }
        else if (!e.shiftKey && i === focusables.length - 1) { e.preventDefault(); focusables[0].focus(); }
      }
    });
    $$("a", nav).forEach(function (a) { a.addEventListener("click", function () { setOpen(false); }); });
    window.matchMedia("(min-width: 1200px)").addEventListener("change", function (m) { if (m.matches) setOpen(false); });
  }

  /* ---------- Apparitions au scroll ---------- */
  var reveals = $$(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Compteurs ---------- */
  function formatNum(n) { return n.toLocaleString("fr-FR"); }
  function runCounter(el) {
    var target = parseFloat(el.getAttribute("data-count")) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    var prefix = el.getAttribute("data-prefix") || "";
    if (reduceMotion) { el.textContent = prefix + formatNum(target) + suffix; return; }
    var start = null, dur = 1800;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + formatNum(Math.round(target * eased)) + suffix;
      if (p < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }
  var counters = $$("[data-count]");
  if ("IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { runCounter(en.target); cio.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { cio.observe(c); });
  } else { counters.forEach(runCounter); }

  /* ---------- Comparateur avant / après ---------- */
  $$(".ba").forEach(function (ba) {
    var range = $(".ba__range", ba);
    if (!range) return;
    var update = function () { ba.style.setProperty("--pos", range.value + "%"); };
    range.addEventListener("input", update);
    update();
  });

  /* ---------- Carrousel ---------- */
  $$("[data-carousel]").forEach(function (car) {
    var track = $(".carousel__track", car);
    var slides = $$(".carousel__slide", car);
    var prev = $("[data-prev]", car), next = $("[data-next]", car);
    var dotsWrap = $(".carousel__dots", car);
    var live = $(".carousel__live", car);
    var index = 0;
    var dots = slides.map(function (s, i) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "carousel__dot";
      b.setAttribute("aria-label", "Afficher la réalisation " + (i + 1));
      b.addEventListener("click", function () { go(i); });
      dotsWrap.appendChild(b);
      return b;
    });
    function go(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = "translateX(" + (-100 * index) + "%)";
      slides.forEach(function (s, k) {
        var active = k === index;
        s.setAttribute("aria-hidden", String(!active));
        $$("input, a, button", s).forEach(function (f) { f.tabIndex = active ? 0 : -1; });
      });
      dots.forEach(function (d, k) { d.setAttribute("aria-current", String(k === index)); });
      if (live) live.textContent = "Réalisation " + (index + 1) + " sur " + slides.length;
    }
    prev.addEventListener("click", function () { go(index - 1); });
    next.addEventListener("click", function () { go(index + 1); });
    car.addEventListener("keydown", function (e) {
      if (e.target.classList.contains("ba__range")) return;
      if (e.key === "ArrowLeft") go(index - 1);
      if (e.key === "ArrowRight") go(index + 1);
    });
    // Glissement tactile sur les bords (le centre sert au comparateur)
    var sx = null;
    track.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    track.addEventListener("touchend", function (e) {
      if (sx === null || e.target.classList.contains("ba__range")) { sx = null; return; }
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 60) go(index + (dx < 0 ? 1 : -1));
      sx = null;
    });
    go(0);
  });

  /* ---------- Filtres de galerie ---------- */
  var filterBtns = $$(".filter-btn");
  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var f = btn.getAttribute("data-filter");
      filterBtns.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
      $$(".gallery-item").forEach(function (item) {
        item.hidden = !(f === "all" || (item.getAttribute("data-cat") || "").split(" ").indexOf(f) > -1);
      });
    });
  });

  /* ---------- Vérification du code postal (zone) ---------- */
  var cpForm = $("#cp-check");
  if (cpForm) {
    cpForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = ($("#cp-input").value || "").trim();
      var out = $("#cp-result");
      if (!/^\d{5}$/.test(v)) { out.textContent = "Merci d'indiquer un code postal à 5 chiffres."; return; }
      var dep = v.slice(0, 2);
      var main = ["38"], near = ["42", "69", "07", "26", "73", "01"];
      if (main.indexOf(dep) > -1) out.textContent = "✅ Bonne nouvelle : nous intervenons en Isère. Demandez votre devis gratuit !";
      else if (near.indexOf(dep) > -1) out.textContent = "👍 Votre commune fait partie des alentours de notre secteur : contactez-nous pour vérifier ensemble.";
      else out.textContent = "Votre commune semble hors de notre zone habituelle, mais n'hésitez pas à nous appeler pour en parler.";
    });
  }

  /* ---------- Formulaire de devis (sans serveur : ouverture du logiciel de messagerie) ---------- */
  var form = $("#devis-form");
  if (form) {
    var status = $("#form-status");
    var params = new URLSearchParams(window.location.search);
    var pre = params.get("service");
    if (pre) {
      var opt = form.querySelector('input[name="service"][value="' + pre.replace(/"/g, "") + '"]');
      if (opt) opt.checked = true;
    }
    function setError(field, msg) {
      var wrap = field.closest(".field") || field.parentElement;
      var err = wrap.querySelector(".field__error");
      wrap.classList.toggle("has-error", !!msg);
      field.setAttribute("aria-invalid", msg ? "true" : "false");
      if (err) err.textContent = msg || "";
    }
    function validate() {
      var ok = true, firstBad = null;
      $$("[required]", form).forEach(function (f) {
        var msg = "";
        if (f.type === "checkbox" && !f.checked) msg = "Votre accord est nécessaire pour traiter la demande.";
        else if (f.type === "radio") return;
        else if (!f.value.trim()) msg = "Ce champ est obligatoire.";
        else if (f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value)) msg = "Adresse e-mail invalide.";
        else if (f.name === "cp" && !/^\d{5}$/.test(f.value.trim())) msg = "Code postal à 5 chiffres.";
        else if (f.type === "tel" && f.value.replace(/[^\d]/g, "").length < 10) msg = "Numéro de téléphone incomplet.";
        if (f.type !== "checkbox") setError(f, msg);
        else { var e = f.closest(".field").querySelector(".field__error"); if (e) e.textContent = msg; }
        if (msg) { ok = false; if (!firstBad) firstBad = f; }
      });
      var svc = form.querySelectorAll('input[name="service"]:checked');
      var svcErr = $("#service-error");
      if (!svc.length) { ok = false; svcErr.textContent = "Choisissez au moins un service."; if (!firstBad) firstBad = form.querySelector('input[name="service"]'); }
      else svcErr.textContent = "";
      if (firstBad) firstBad.focus();
      return ok;
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.querySelector(".hp input").value) return; // anti-spam
      status.hidden = true;
      if (!validate()) {
        status.className = "form-status form-status--err"; status.hidden = false;
        status.textContent = "Certains champs sont à corriger, merci de vérifier le formulaire.";
        return;
      }
      var fd = new FormData(form);
      var services = fd.getAll("service").join(", ");
      var lines = [
        "Bonjour LKH Service,", "", "Je souhaite recevoir un devis gratuit.", "",
        "Service(s) : " + services,
        "Surface approximative : " + (fd.get("surface") || "non précisée"),
        "Code postal : " + fd.get("cp"),
        "Fréquence souhaitée : " + fd.get("frequence"),
        "Je suis : " + fd.get("profil"), "",
        "Nom : " + fd.get("nom"),
        "Téléphone : " + fd.get("tel"),
        "E-mail : " + fd.get("email"),
        "Préférence de rappel : " + (fd.get("rappel") || "indifférent"), "",
        "Message :", fd.get("message") || "-", "",
        "(J'accepte que mes données soient utilisées pour traiter ma demande de devis.)"
      ];
      var subject = "Demande de devis – " + services + " – " + fd.get("cp");
      var href = "mailto:" + form.getAttribute("data-mailto") +
        "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(lines.join("\n"));
      window.location.href = href;
      status.className = "form-status form-status--ok"; status.hidden = false;
      status.innerHTML = "Merci ! Votre logiciel de messagerie s'ouvre avec votre demande pré-remplie : il ne vous reste qu'à l'envoyer. " +
        "Rien ne s'ouvre ? Écrivez-nous à <a href=\"mailto:" + form.getAttribute("data-mailto") + "\">" + form.getAttribute("data-mailto") +
        "</a> ou appelez le <a href=\"tel:+33750068656\">07 50 06 86 56</a>.";
      status.focus();
    });
    $$("input, select, textarea", form).forEach(function (f) {
      f.addEventListener("blur", function () { if (f.getAttribute("aria-invalid") === "true") validate(); });
    });
  }
})();
