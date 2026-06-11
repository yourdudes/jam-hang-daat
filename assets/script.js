/* =========================================================
   Jam Hang Daat — shared script
   - mobile nav toggle
   - EN / 中文 language switch (localStorage + <html lang>)
   - scroll reveal (IntersectionObserver)
   - contact form validation
   - current year
   ========================================================= */
(function () {
  "use strict";

  /* ---------- Current year ---------- */
  function setYear() {
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  /* ---------- Mobile nav ---------- */
  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("primary-nav");
    if (!toggle || !nav) return;

    function close() {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }

    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", close);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 860) close();
    });
  }

  /* ---------- Language switch ---------- */
  var LANG_KEY = "jhd-lang";

  function applyLang(lang) {
    var isZh = lang === "zh";
    document.documentElement.setAttribute("lang", isZh ? "zh-Hans" : "en");

    // text nodes
    document.querySelectorAll("[data-en]").forEach(function (el) {
      var val = isZh ? el.getAttribute("data-zh") : el.getAttribute("data-en");
      if (val !== null) el.textContent = val;
    });

    // placeholders
    document.querySelectorAll("[data-en-ph]").forEach(function (el) {
      var val = isZh ? el.getAttribute("data-zh-ph") : el.getAttribute("data-en-ph");
      if (val !== null) el.setAttribute("placeholder", val);
    });

    // option labels
    document.querySelectorAll("option[data-en]").forEach(function (el) {
      var val = isZh ? el.getAttribute("data-zh") : el.getAttribute("data-en");
      if (val !== null) el.textContent = val;
    });

    // aria-labels
    document.querySelectorAll("[data-en-aria]").forEach(function (el) {
      var val = isZh ? el.getAttribute("data-zh-aria") : el.getAttribute("data-en-aria");
      if (val !== null) el.setAttribute("aria-label", val);
    });

    // document title (browser tab) — swaps with the language too
    var titleEl = document.querySelector("title[data-en-title]");
    if (titleEl) {
      var t = isZh ? titleEl.getAttribute("data-zh-title") : titleEl.getAttribute("data-en-title");
      if (t !== null) document.title = t;
    }

    // toggle button state
    document.querySelectorAll("[data-lang-btn]").forEach(function (btn) {
      var pressed = btn.getAttribute("data-lang-btn") === lang;
      btn.setAttribute("aria-pressed", pressed ? "true" : "false");
    });

    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
  }

  function initLang() {
    var stored = "en";
    try { stored = localStorage.getItem(LANG_KEY) || "en"; } catch (e) {}

    document.querySelectorAll("[data-lang-btn]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        applyLang(btn.getAttribute("data-lang-btn"));
      });
    });

    applyLang(stored);
  }

  /* ---------- Remote image fallback ----------
     Every remote <img> sits inside a container that paints a plain,
     neutral background (.feature-media / .split-media / .hero-bg /
     .page-hero-bg). If a remote image fails to load, hide the broken
     <img> so the neutral host shows through and the layout still reads
     intentionally. */
  function initImageFallback() {
    document.querySelectorAll('img[src^="http"]').forEach(function (img) {
      function fail() {
        img.style.opacity = "0";
        img.style.visibility = "hidden";
        var host = img.closest(".feature-media, .split-media");
        if (host) host.classList.add("img-failed");
      }
      if (img.complete && img.naturalWidth === 0) fail();
      img.addEventListener("error", fail);
    });
  }

  /* ---------- Scroll reveal ---------- */
  function initReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!els.length) return;

    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Contact form ---------- */
  function initForm() {
    var form = document.getElementById("inquiry-form");
    if (!form) return;

    var success = document.getElementById("form-success");
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function getLang() {
      try { return localStorage.getItem(LANG_KEY) || "en"; } catch (e) { return "en"; }
    }

    function showError(field, on) {
      field.classList.toggle("invalid", on);
    }

    function validateField(field) {
      var input = field.querySelector("input, select, textarea");
      if (!input) return true;
      var val = (input.value || "").trim();
      var ok = true;

      if (input.hasAttribute("required") && val === "") ok = false;
      if (ok && input.type === "email" && val !== "" && !emailRe.test(val)) ok = false;
      if (ok && input.tagName === "SELECT" && input.hasAttribute("required") && val === "") ok = false;

      showError(field, !ok);
      return ok;
    }

    // live re-validate once touched
    form.querySelectorAll(".field").forEach(function (field) {
      var input = field.querySelector("input, select, textarea");
      if (!input) return;
      input.addEventListener("blur", function () {
        if (field.classList.contains("invalid")) validateField(field);
      });
      input.addEventListener("input", function () {
        if (field.classList.contains("invalid")) validateField(field);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fields = form.querySelectorAll(".field");
      var allOk = true;
      var firstBad = null;

      fields.forEach(function (field) {
        var ok = validateField(field);
        if (!ok && !firstBad) firstBad = field;
        if (!ok) allOk = false;
      });

      if (!allOk) {
        if (firstBad) {
          var inp = firstBad.querySelector("input, select, textarea");
          if (inp) inp.focus();
        }
        return;
      }

      // fake submit success
      if (success) {
        success.classList.add("show");
        success.setAttribute("role", "status");
        success.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      form.reset();
    });
  }

  /* ---------- Init ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    setYear();
    initNav();
    initLang();
    initImageFallback();
    initReveal();
    initForm();
  });
})();
