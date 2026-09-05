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
     HERO PARTICLE WAVE — vanilla canvas 2D adaptation of the supplied
     three.js ParticleWave concept, sized to this static site's stack.
     Respects prefers-reduced-motion, pauses when tab/section is hidden.
  --------------------------------------------------------------------- */
  var canvas = document.getElementById("waveCanvas");
  if (canvas && !reduceMotion) {
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var width, height, cols, rows, points = [];
    var time = 0;
    var raf = null;
    var running = true;
    var GAP = 34;

    function resize() {
      width = canvas.parentElement.clientWidth;
      height = canvas.parentElement.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildGrid();
    }

    function buildGrid() {
      cols = Math.ceil(width / GAP) + 2;
      rows = Math.ceil(height / GAP) + 2;
      points = [];
      for (var y = 0; y < rows; y++) {
        for (var x = 0; x < cols; x++) {
          points.push({ x: x * GAP, y: y * GAP });
        }
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(200,255,92,0.55)";
      for (var i = 0; i < points.length; i++) {
        var p = points[i];
        var wave = Math.sin(p.x * 0.012 + time) * 10 + Math.cos(p.y * 0.012 + time) * 6;
        var alpha = 0.15 + (Math.sin(p.x * 0.02 + p.y * 0.02 + time) + 1) * 0.18;
        ctx.globalAlpha = Math.max(0.04, Math.min(alpha, 0.5));
        ctx.beginPath();
        ctx.arc(p.x, p.y + wave, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
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
