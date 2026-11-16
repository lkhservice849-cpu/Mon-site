/* LKH Service — scripts (sans dépendance, sans cookie) */
(function () {
  "use strict";
  document.documentElement.classList.add("js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  var NOW = new Date().getMonth() + 1;

  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* En-tête et barre d'appel au défilement */
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
      toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
      nav.classList.toggle("is-open", open);
      document.body.classList.toggle("nav-open", open);
    };
    toggle.addEventListener("click", function () { setOpen(toggle.getAttribute("aria-expanded") !== "true"); });
    document.addEventListener("keydown", function (e) {
      if (!nav.classList.contains("is-open")) return;
      if (e.key === "Escape") { setOpen(false); toggle.focus(); }
      if (e.key === "Tab") {
        var f = [toggle].concat($$("a", nav)), i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
    window.matchMedia("(min-width: 1100px)").addEventListener("change", function (m) { if (m.matches) setOpen(false); });
  }

  /* Apparitions au défilement */
  $$(".rows, .steps, .pledges").forEach(function (list) {
    $$(".reveal", list).forEach(function (el, i) { el.style.setProperty("--n", i % 4); });
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

  /* Calendrier de l'accueil (onglets par mois) */
  var tabs = $$(".cal__tabs [role=tab]");
  if (tabs.length) {
    var select = function (m, focus) {
      tabs.forEach(function (t) {
        var on = Number(t.getAttribute("data-m")) === m;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        if (on && focus) t.focus();
      });
      $$(".cal__pan").forEach(function (p) { p.hidden = Number(p.getAttribute("data-m")) !== m; });
    };
    tabs.forEach(function (t) {
      var m = Number(t.getAttribute("data-m"));
      if (m === NOW) t.classList.add("is-now");
      t.addEventListener("click", function () { select(m); });
      t.addEventListener("keydown", function (e) {
        var d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (d) { e.preventDefault(); select(((m - 1 + d + 12) % 12) + 1, true); }
      });
    });
    select(NOW);
  }

  /* Mois en cours : frises des pages service et page calendrier */
  $$(".months li").forEach(function (li) { if (Number(li.getAttribute("data-m")) === NOW) li.classList.add("is-now"); });
  $$("[data-month-note]").forEach(function (p) {
    var bar = p.parentElement.querySelector('.months li[data-m="' + NOW + '"]');
    if (bar) p.textContent = p.getAttribute(bar.classList.contains("on") ? "data-on" : "data-off");
  });
  var card = $('.month[data-m="' + NOW + '"]');
  if (card) card.classList.add("is-now");
  var jump = $("[data-current-month-link]");
  if (jump) jump.setAttribute("href", "#mois-" + NOW);

  /* Code postal */
  var cpForm = $("#cp-check");
  if (cpForm) {
    cpForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = ($("#cp-input").value || "").trim(), out = $("#cp-result");
      if (!/^\d{5}$/.test(v)) { out.textContent = "Indiquez un code postal à 5 chiffres."; return; }
      var dep = v.slice(0, 2);
      if (dep === "38") out.textContent = "Oui, j'interviens en Isère. Demandez votre devis gratuit.";
      else if (["42", "69", "07", "26", "73", "01"].indexOf(dep) > -1) out.textContent = "Votre commune fait partie des alentours : appelez-moi pour vérifier ensemble.";
      else out.textContent = "C'est en dehors de mon secteur habituel, mais appelez-moi pour en parler.";
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
