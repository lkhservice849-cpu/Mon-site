/* LKH Service — scripts (sans dépendance, sans cookie) */
(function () {
  "use strict";
  document.documentElement.classList.add("js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* Menu pilule : ombre au défilement, barre d'appel mobile */
  var header = $(".site-header"), callbar = $(".callbar"), ticking = false;
  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle("is-scrolled", y > 10);
    if (callbar) callbar.classList.toggle("is-visible", y > 480);
    ticking = false;
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* Menu mobile */
  var toggle = $(".nav-toggle"), nav = $("#nav");
  if (toggle && nav) {
    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.querySelector("span").textContent = open ? "Fermer" : "Menu";
      nav.classList.toggle("is-open", open);
    };
    toggle.addEventListener("click", function () { setOpen(toggle.getAttribute("aria-expanded") !== "true"); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && nav.classList.contains("is-open")) { setOpen(false); toggle.focus(); } });
    document.addEventListener("click", function (e) { if (nav.classList.contains("is-open") && !e.target.closest(".pill")) setOpen(false); });
    window.matchMedia("(min-width: 1060px)").addEventListener("change", function (m) { if (m.matches) setOpen(false); });
  }

  /* Apparitions au défilement (décalées dans un même groupe) */
  $$(".cards, .steps, .pledges, .gallery").forEach(function (g) {
    $$(".reveal", g).forEach(function (el, i) { el.style.setProperty("--n", i % 4); });
  });
  var reveals = $$(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* Compteurs */
  function show(el, v) { el.innerHTML = (el.getAttribute("data-prefix") || "") + v.toLocaleString("fr-FR") + (el.getAttribute("data-suffix") || ""); }
  function run(el) {
    var target = Number(el.getAttribute("data-count"));
    if (reduce || target === 0) { show(el, target); return; }
    var t0 = null;
    requestAnimationFrame(function step(ts) {
      if (t0 === null) t0 = ts;
      var k = Math.min((ts - t0) / 1400, 1);
      show(el, Math.round(target * (1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(step);
    });
  }
  var counters = $$("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { run(en.target); cio.unobserve(en.target); } });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  /* Comparateurs avant / après */
  $$(".ba").forEach(function (ba) {
    var r = $(".ba__range", ba);
    if (!r) return;
    var upd = function () { ba.style.setProperty("--pos", r.value + "%"); };
    r.addEventListener("input", upd);
    upd();
  });

  /* Carrousel */
  $$("[data-carousel]").forEach(function (car) {
    var track = $(".carousel__track", car), slides = $$(".carousel__slide", car), dotsWrap = $(".carousel__dots", car), live = $(".carousel__live", car), idx = 0;
    var dots = slides.map(function (s, i) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "carousel__dot"; b.setAttribute("aria-label", "Afficher l'exemple " + (i + 1));
      b.addEventListener("click", function () { go(i); });
      dotsWrap.appendChild(b);
      return b;
    });
    function go(i) {
      idx = (i + slides.length) % slides.length;
      track.style.transform = "translateX(" + (-100 * idx) + "%)";
      slides.forEach(function (s, k) {
        s.setAttribute("aria-hidden", String(k !== idx));
        $$("input", s).forEach(function (f) { f.tabIndex = k === idx ? 0 : -1; });
      });
      dots.forEach(function (d, k) { d.setAttribute("aria-current", String(k === idx)); });
      if (live) live.textContent = "Exemple " + (idx + 1) + " sur " + slides.length;
    }
    $("[data-prev]", car).addEventListener("click", function () { go(idx - 1); });
    $("[data-next]", car).addEventListener("click", function () { go(idx + 1); });
    go(0);
  });

  /* Code postal */
  var cpForm = $("#cp-check");
  if (cpForm) {
    cpForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = ($("#cp-input").value || "").trim(), out = $("#cp-result");
      if (!/^\d{5}$/.test(v)) { out.textContent = "Indiquez un code postal à 5 chiffres."; return; }
      var dep = v.slice(0, 2);
      if (dep === "38") out.textContent = "Oui, nous intervenons en Isère. Demandez votre devis gratuit.";
      else if (["42", "69", "07", "26", "73", "01"].indexOf(dep) > -1) out.textContent = "Votre commune fait partie des alentours : appelez-nous pour vérifier ensemble.";
      else out.textContent = "C'est en dehors de notre secteur habituel, mais appelez-nous pour en parler.";
    });
  }

  /* Formulaire de devis : ouvre la messagerie du visiteur avec la demande rédigée */
  var form = $("#devis-form");
  if (form) {
    var status = $("#form-status");
    var pre = new URLSearchParams(window.location.search).get("service");
    if (pre) {
      var opt = form.querySelector('input[name="service"][value="' + pre.replace(/[^a-z]/g, "") + '"]');
      if (opt) opt.checked = true;
    }
    var setError = function (field, msg) {
      var wrap = field.closest(".field"), err = wrap.querySelector(".field__error");
      wrap.classList.toggle("has-error", !!msg);
      field.setAttribute("aria-invalid", msg ? "true" : "false");
      if (err) err.textContent = msg || "";
    };
    var validate = function () {
      var ok = true, first = null;
      $$("[required]", form).forEach(function (f) {
        var msg = "";
        if (f.type === "checkbox") { if (!f.checked) msg = "Votre accord est nécessaire pour traiter la demande."; }
        else if (!f.value.trim()) msg = "Ce champ est obligatoire.";
        else if (f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value)) msg = "Adresse e-mail invalide.";
        else if (f.name === "cp" && !/^\d{5}$/.test(f.value.trim())) msg = "Code postal à 5 chiffres.";
        else if (f.type === "tel" && f.value.replace(/\D/g, "").length < 10) msg = "Numéro de téléphone incomplet.";
        setError(f, msg);
        if (msg) { ok = false; first = first || f; }
      });
      var svcErr = $("#service-error");
      if (!form.querySelectorAll('input[name="service"]:checked').length) {
        ok = false; svcErr.textContent = "Choisissez au moins une prestation."; first = first || form.querySelector('input[name="service"]');
      } else svcErr.textContent = "";
      if (first) first.focus();
      return ok;
    };
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.querySelector(".hp input").value) return;
      status.hidden = true;
      if (!validate()) {
        status.className = "form-status form-status--err"; status.hidden = false;
        status.textContent = "Certains champs sont à corriger.";
        return;
      }
      var fd = new FormData(form), to = form.getAttribute("data-mailto");
      var labels = fd.getAll("service").map(function (v) {
        var i = form.querySelector('input[name="service"][value="' + v + '"]');
        return i ? i.nextElementSibling.textContent : v;
      }).join(", ");
      var lines = ["Bonjour,", "", "Je souhaite recevoir un devis gratuit.", "",
        "Prestation(s) : " + labels,
        "Ampleur du chantier : " + (fd.get("surface") || "non précisée"),
        "Code postal : " + fd.get("cp"),
        "Délai : " + fd.get("frequence"),
        "Je suis : " + fd.get("profil"), "",
        "Nom : " + fd.get("nom"), "Téléphone : " + fd.get("tel"), "E-mail : " + fd.get("email"),
        "Me rappeler : " + (fd.get("rappel") || "peu importe"), "",
        "Message :", fd.get("message") || "-"];
      window.location.href = "mailto:" + to + "?subject=" + encodeURIComponent("Demande de devis – " + labels + " – " + fd.get("cp")) +
        "&body=" + encodeURIComponent(lines.join("\n"));
      status.className = "form-status"; status.hidden = false;
      status.innerHTML = "Merci. Votre messagerie s'ouvre avec la demande rédigée : il ne reste qu'à l'envoyer. Rien ne s'ouvre ? Écrivez à <a href=\"mailto:" + to + "\">" + to + "</a> ou appelez le <a href=\"tel:+33750068656\">07 50 06 86 56</a>.";
      status.focus();
    });
  }
})();
