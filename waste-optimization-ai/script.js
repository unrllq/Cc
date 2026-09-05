(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------------
     NAV: scrolled state + mobile menu
  --------------------------------------------------------------------- */
  var nav = document.getElementById("nav");
  var burger = document.getElementById("burger");
  var mobileMenu = document.getElementById("mobileMenu");

  function onScroll() {
    if (window.scrollY > 12) nav.classList.add("is-scrolled");
    else nav.classList.remove("is-scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  function closeMenu() {
    mobileMenu.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
  }
  burger.addEventListener("click", function () {
    var open = mobileMenu.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", String(open));
  });
  mobileMenu.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", closeMenu);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMenu();
  });

  /* ---------------------------------------------------------------------
     REVEAL ON SCROLL
  --------------------------------------------------------------------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------------------------------------------------------------------
     ANIMATED COUNTERS (data bar + financial impact)
  --------------------------------------------------------------------- */
  var counters = document.querySelectorAll("[data-count]");
  function animateCounter(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduceMotion || !target) {
      el.textContent = prefix + target + suffix;
      return;
    }
    var duration = 1200;
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = Math.round(target * eased);
      el.textContent = prefix + value.toLocaleString("en-US") + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (counters.length) {
    if ("IntersectionObserver" in window) {
      var counterIO = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              animateCounter(entry.target);
              counterIO.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.4 }
      );
      counters.forEach(function (el) { counterIO.observe(el); });
    } else {
      counters.forEach(animateCounter);
    }
  }

  /* ---------------------------------------------------------------------
     AI ACTIVITY FEED — staggered entrance (re-triggerable on view)
  --------------------------------------------------------------------- */
  var feed = document.querySelector(".feed");
  if (feed && "IntersectionObserver" in window) {
    var feedIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll(".feed__item").forEach(function (item) {
              item.style.animationPlayState = "running";
            });
            feedIO.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    feed.querySelectorAll(".feed__item").forEach(function (item) {
      item.style.animationPlayState = "paused";
    });
    feedIO.observe(feed);
  }

  /* ---------------------------------------------------------------------
     FAQ ACCORDION
  --------------------------------------------------------------------- */
  document.querySelectorAll(".faq-item__q").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.closest(".faq-item");
      var answer = item.querySelector(".faq-item__a");
      var isOpen = item.classList.contains("is-open");

      document.querySelectorAll(".faq-item.is-open").forEach(function (openItem) {
        if (openItem !== item) {
          openItem.classList.remove("is-open");
          openItem.querySelector(".faq-item__q").setAttribute("aria-expanded", "false");
          openItem.querySelector(".faq-item__a").style.maxHeight = null;
        }
      });

      if (isOpen) {
        item.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
        answer.style.maxHeight = null;
      } else {
        item.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
        answer.style.maxHeight = answer.scrollHeight + "px";
      }
    });
  });

  /* ---------------------------------------------------------------------
     ROI CALCULATOR
  --------------------------------------------------------------------- */
  var roiForm = document.getElementById("roiForm");
  if (roiForm) {
    var fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
    roiForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var revenue = parseFloat(document.getElementById("revenue").value) || 0;
      var locations = parseFloat(document.getElementById("locations").value) || 1;
      var customers = parseFloat(document.getElementById("customers").value) || 0;
      var foodCostPct = parseFloat(document.getElementById("foodcost").value) || 0;

      // Industry benchmark: ~4-10% of food cost is avoidable waste; we use 6% as a
      // conservative, explainable default, scaled by locations and customer volume signal.
      var monthlyFoodCost = revenue * (foodCostPct / 100) * locations;
      var wasteRate = 0.06;
      var monthlyWaste = monthlyFoodCost * wasteRate;
      var annualLoss = monthlyWaste * 12;
      var recoverableShare = 0.45; // share of waste realistically recoverable with AI
      var potentialSaving = annualLoss * recoverableShare;

      document.getElementById("roiWaste").textContent = fmt.format(monthlyWaste);
      document.getElementById("roiLoss").textContent = fmt.format(annualLoss);
      document.getElementById("roiSaving").textContent = fmt.format(potentialSaving);
    });
  }

  /* ---------------------------------------------------------------------
     HERO AMBIENT DUST — vanilla canvas 2D adaptation of the supplied
     three.js ParticleWave concept: slow brass-lit motes drifting over the
     hero's textured backdrop, like dust suspended in raking light.
     Respects prefers-reduced-motion, pauses when tab/section is hidden.
  --------------------------------------------------------------------- */
  var canvas = document.getElementById("waveCanvas");
  if (canvas && !reduceMotion) {
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var width, height, motes = [];
    var time = 0;
    var raf = null;
    var running = true;
    var MOTE_COUNT = 70;

    function resize() {
      width = canvas.parentElement.clientWidth;
      height = canvas.parentElement.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildMotes();
    }

    function buildMotes() {
      motes = [];
      for (var i = 0; i < MOTE_COUNT; i++) {
        motes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: 0.6 + Math.random() * 1.6,
          drift: 0.15 + Math.random() * 0.35,
          phase: Math.random() * Math.PI * 2,
          warm: Math.random() > 0.5
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      for (var i = 0; i < motes.length; i++) {
        var m = motes[i];
        var y = (m.y - time * m.drift * 12) % (height + 20);
        if (y < -20) y += height + 20;
        var x = m.x + Math.sin(time * 0.4 + m.phase) * 14;
        var alpha = 0.12 + (Math.sin(time * 0.6 + m.phase) + 1) * 0.14;
        ctx.fillStyle = m.warm ? "rgba(217,182,114," + alpha + ")" : "rgba(30,25,18," + (alpha * 0.7) + ")";
        ctx.beginPath();
        ctx.arc(x, y, m.r, 0, Math.PI * 2);
        ctx.fill();
      }
      time += 0.012;
    }

    function loop() {
      if (!running) { raf = null; return; }
      draw();
      raf = requestAnimationFrame(loop);
    }

    function setRunning(next) {
      running = next;
      if (running && !raf) loop();
    }

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    });

    document.addEventListener("visibilitychange", function () {
      setRunning(!document.hidden);
    });

    if ("IntersectionObserver" in window) {
      var heroIO = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            setRunning(entry.isIntersecting && !document.hidden);
          });
        },
        { threshold: 0 }
      );
      heroIO.observe(canvas.closest(".hero"));
    }

    resize();
    loop();
  }
})();
