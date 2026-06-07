/* =========================================
   FRAU WONG HAUS — Main Script
   ========================================= */

// ============ CURSOR ============
const cursor = document.getElementById('cursor');
const follower = document.getElementById('cursor-follower');
let mouseX = 0, mouseY = 0;
let followerX = 0, followerY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  cursor.style.left = mouseX + 'px';
  cursor.style.top = mouseY + 'px';
});

function animateFollower() {
  followerX += (mouseX - followerX) * 0.12;
  followerY += (mouseY - followerY) * 0.12;
  follower.style.left = followerX + 'px';
  follower.style.top = followerY + 'px';
  requestAnimationFrame(animateFollower);
}
animateFollower();

document.querySelectorAll('a, button, .session-card, .offering-item, .retreat-card, .subscribe__input').forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
});

// ============ NAV SCROLL ============
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// ============ MOBILE MENU ============
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

hamburger.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  hamburger.classList.toggle('active', open);
  document.body.style.overflow = open ? 'hidden' : '';
});

mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    hamburger.classList.remove('active');
    document.body.style.overflow = '';
  });
});

// ============ INTERSECTION OBSERVER ============
const observerOpts = { threshold: 0.12, rootMargin: '0px 0px -60px 0px' };

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, observerOpts);

document.querySelectorAll('.reveal-up, .reveal-fade').forEach(el => observer.observe(el));

// Staggered reveal for reveal-line elements
const lineObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const lines = entry.target.querySelectorAll('.reveal-line');
      lines.forEach((line, i) => {
        setTimeout(() => line.classList.add('visible'), i * 100);
      });
      lineObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });

document.querySelectorAll('.sound__headline, .sessions__title, .subscribe__title').forEach(el => lineObserver.observe(el));

// ============ COUNTER ANIMATION ============
const counterObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseInt(el.dataset.target);
      animateCounter(el, target);
      counterObs.unobserve(el);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-num[data-target]').forEach(el => counterObs.observe(el));

function animateCounter(el, target) {
  const duration = 1800;
  const start = performance.now();
  const startVal = 0;

  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(startVal + (target - startVal) * eased);
    el.textContent = String(current).padStart(String(target).length, '0');
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ============ PARALLAX ============
const parallaxItems = [];

document.querySelectorAll('.parallax-img').forEach(el => {
  parallaxItems.push({ el, speed: 0.3, type: 'img' });
});
document.querySelectorAll('.parallax-slow').forEach(el => {
  parallaxItems.push({ el, speed: 0.15, type: 'slow' });
});

let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(updateParallax);
    ticking = true;
  }
}, { passive: true });

function updateParallax() {
  const scrollY = window.scrollY;
  parallaxItems.forEach(({ el, speed }) => {
    const rect = el.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    const offset = (window.innerHeight / 2 - center) * speed;
    el.style.transform = `translateY(${offset}px)`;
  });
  ticking = false;
}

// ============ FORM SUBMIT ============
const form = document.getElementById('subscribeForm');
const toast = document.getElementById('toast');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const btn = form.querySelector('.subscribe__submit span');
  btn.textContent = 'You\'re in...';

  setTimeout(() => {
    form.reset();
    btn.textContent = 'Get Early Access';
    showToast();
  }, 1000);
});

function showToast() {
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4000);
}

// ============ SMOOTH ANCHOR SCROLL ============
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'));
      const top = target.getBoundingClientRect().top + window.scrollY - navH;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

// ============ TEXT GLITCH ON HOVER ============
const glitchChars = '!<>-_\\/[]{}—=+*^?#_';

document.querySelectorAll('.hero__title .line').forEach(el => {
  const original = el.textContent;
  let interval = null;
  let iteration = 0;

  el.addEventListener('mouseenter', () => {
    clearInterval(interval);
    iteration = 0;
    interval = setInterval(() => {
      el.textContent = original.split('').map((char, i) => {
        if (i < iteration) return original[i];
        if (char === ' ') return ' ';
        return glitchChars[Math.floor(Math.random() * glitchChars.length)];
      }).join('');
      if (iteration >= original.length) clearInterval(interval);
      iteration += 1 / 2;
    }, 35);
  });

  el.addEventListener('mouseleave', () => {
    clearInterval(interval);
    el.textContent = original;
  });
});

// ============ SECTION ENTER HIGHLIGHT ============
const sectionObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.setProperty('--section-visible', '1');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('section').forEach(s => sectionObs.observe(s));

// ============ SPEAKER BEAT ANIMATION ============
function triggerBeat() {
  document.querySelectorAll('.speaker').forEach(s => {
    s.style.transform = s.classList.contains('speaker-left')
      ? 'translateY(-50%) scale(1.15)'
      : 'translateY(-50%) scale(1.15)';
    setTimeout(() => {
      s.style.transform = s.classList.contains('speaker-left')
        ? 'translateY(-50%) scale(1)'
        : 'translateY(-50%) scale(1)';
    }, 120);
  });
}
setInterval(triggerBeat, 800);
setInterval(triggerBeat, 1600);

// ============ WAVE AUDIO VISUALIZER ============
const waveEls = document.querySelectorAll('.wave');
function animateWaves() {
  const t = Date.now() / 1000;
  waveEls.forEach((w, i) => {
    const scale = 1 + Math.sin(t * 1.2 + i * 1.2) * 0.04;
    w.style.transform = `scale(${scale})`;
  });
  requestAnimationFrame(animateWaves);
}
if (waveEls.length) animateWaves();

// ============ MARQUEE SPEED ON SCROLL ============
const marquee = document.querySelector('.marquee-track');
let lastScroll = 0;
window.addEventListener('scroll', () => {
  const delta = Math.abs(window.scrollY - lastScroll);
  lastScroll = window.scrollY;
  if (marquee) {
    const speed = Math.max(20, 20 - delta * 0.5);
    marquee.style.animationDuration = speed + 's';
    setTimeout(() => { if (marquee) marquee.style.animationDuration = '20s'; }, 400);
  }
}, { passive: true });

// ============ INIT ============
document.addEventListener('DOMContentLoaded', () => {
  // Trigger visible for elements already in view
  document.querySelectorAll('.reveal-up, .reveal-fade').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9) el.classList.add('visible');
  });
});
