/* ═══════════════════════════════════════════════════════════════════
   HESEI SUSHI — main.js
   ═══════════════════════════════════════════════════════════════════ */

/* ── LOADER ─────────────────────────────────────────────────────── */
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('loader').classList.add('hidden');
    document.getElementById('heroBg').classList.add('loaded');
  }, 1800);
});

/* ── MOBILE MENU ─────────────────────────────────────────────────── */
function toggleMenu() {
  document.getElementById('mobileMenu').classList.toggle('open');
}

/* ── LANGUAGE ────────────────────────────────────────────────────── */
function setLang(lang) {
  document.body.setAttribute('data-lang', lang);
  document.querySelectorAll('.lang-btn').forEach(b => {
    b.classList.toggle('active', b.textContent.trim().toLowerCase() === lang);
  });
}

/* ═══════════════════════════════════════════════════════════════════
   SCROLL SCENE — dos fases
   ───────────────────────────────────────────────────────────────────
   FASE 1 (0 → PHASE1_VH de scroll):
     La crema sube desde abajo. El nombre cambia de color.

   FASE 2 (PHASE1_VH → PHASE1_VH + (SLIDES-1)*SLIDE_VH):
     La crema está fija arriba. Cada SLIDE_VH de scroll adicional
     avanza una imagen del carrusel.
   ═══════════════════════════════════════════════════════════════════ */

const nav            = document.getElementById('mainNav');
const scrollScene    = document.getElementById('scroll-scene');
const creamPanel     = document.getElementById('creamPanel');
const heroNameCrimson = document.getElementById('heroNameCrimson');
const creamLeftEmpty = document.getElementById('creamLeftEmpty');
const creamRight     = document.getElementById('creamRight');

function lerp(a, b, t) { return a + (b - a) * t; }
function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

let lastSlide = -1;

function updateScene() {
  const vh        = window.innerHeight;
  const PHASE1_PX = vh * 1.2;
  const SLIDE_PX  = vh * 1.0;
  const scrolled  = -scrollScene.getBoundingClientRect().top;

  /* ══ FASE 1 — crema sube ══ */
  const t1Raw = clamp(scrolled / PHASE1_PX, 0, 1);

  // Crema sube: translateY 100% → 0%
  const creamTranslateY = (1 - t1Raw) * 100; // en %
  creamPanel.style.transform = `translateY(${creamTranslateY}%)`;

  /* ══ SPLIT COLOR en el nombre ══
     La crema sube desde abajo. Su borde superior en viewport (px):
       creamTopPx = vh * creamTranslateY / 100

     El nombre (.hero-name--crimson) tiene su propio bounding rect.
     Queremos mostrar solo la parte del nombre que está POR DEBAJO
     del borde superior de la crema → clip-path: inset(clipTop 0 0 0)

     clipTop (relativo al elemento) =
       max(0, creamTopPx - nameRect.top)

     Si clipTop >= nameRect.height → nada visible (todo blanco)
     Si clipTop <= 0              → todo visible (todo burdeos)
  */
  const creamTopPx = vh * creamTranslateY / 100;
  const nameRect   = heroNameCrimson.getBoundingClientRect();
  const clipTop    = clamp(creamTopPx - nameRect.top, 0, nameRect.height);
  heroNameCrimson.style.clipPath = `inset(${clipTop}px 0 0 0)`;

  // Carrusel y CTA aparecen gradualmente
  const contentT = clamp((t1Raw - 0.6) / 0.3, 0, 1);
  creamRight.style.opacity         = contentT.toFixed(3);
  creamRight.style.transform       = `translateY(${lerp(24, 0, contentT)}px)`;
  creamLeftEmpty.style.opacity     = clamp((t1Raw - 0.75) / 0.2, 0, 1).toFixed(3);

  // Nav: el fondo sólido sube siguiendo exactamente el borde de la crema.
  // clip-path inset(Xpx 0 0 0) — X = qué parte del nav aún no está cubierta.
  // creamTopPx es la posición del borde superior de la crema en el viewport.
  // El nav ocupa de 0 a NAV_H px. La crema entra por abajo del nav.
  const NAV_H = nav.offsetHeight;
  const navClipTop = clamp(creamTopPx, 0, NAV_H);
  nav.style.setProperty('--nav-clip-top', `${navClipTop}px`);

  /* ══ FASE 2 — scroll avanza carrusel ══ */
  if (t1Raw >= 1) {
    const phase2Scrolled = scrolled - PHASE1_PX;
    const slideIndex = clamp(Math.floor(phase2Scrolled / SLIDE_PX), 0, SLIDES - 1);
    if (slideIndex !== lastSlide) {
      lastSlide = slideIndex;
      goToSlide(slideIndex, false);
    }
  }
}

window.addEventListener('scroll', updateScene, { passive: true });
updateScene();

/* ── SCROLL REVEAL (secciones inferiores) ────────────────────────── */
// Primero añadir la clase que pone opacity:0 via JS (si JS falla, el contenido es visible)
document.querySelectorAll('.reveal').forEach(el => {
  const panel = el.closest('.menu-panel');
  // No ocultar elementos dentro de paneles display:none (el observer no los ve)
  if (!panel || panel.classList.contains('active')) {
    el.classList.add('will-reveal');
  }
});

const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0, rootMargin: '0px 0px 60px 0px' });

function observeReveal() {
  document.querySelectorAll('.will-reveal:not(.visible)').forEach(el => {
    revealObs.observe(el);
  });
}
observeReveal();

/* ── MENU TABS ───────────────────────────────────────────────────── */
function switchTab(id, btn) {
  document.querySelectorAll('.menu-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.menu-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + id).classList.add('active');
  btn.classList.add('active');
  // Revelar items del nuevo panel (estaban en display:none, el observer no los vio)
  document.querySelectorAll('#tab-' + id + ' .reveal').forEach(el => {
    el.classList.add('will-reveal');
    revealObs.observe(el);
  });
}

/* ── CARRUSEL ────────────────────────────────────────────────────── */
const SLIDES = 5;
let currentSlide = 0;
let autoTimer;

const carouselTrack = document.getElementById('carouselTrack');
const dotsWrap      = document.getElementById('carouselDots');

for (let i = 0; i < SLIDES; i++) {
  const d = document.createElement('div');
  d.className = 'carousel-dot' + (i === 0 ? ' active' : '');
  d.onclick = () => goToSlide(i);
  dotsWrap.appendChild(d);
}

const slides = carouselTrack.querySelectorAll('.carousel-slide');

function goToSlide(n, resetAuto = true) {
  const prev = currentSlide;
  currentSlide = (n + SLIDES) % SLIDES;
  slides.forEach((s, i) => {
    s.classList.remove('active', 'prev');
    if (i === currentSlide) s.classList.add('active');
    else if (i === prev)    s.classList.add('prev');
  });
  dotsWrap.querySelectorAll('.carousel-dot').forEach((d, i) => {
    d.classList.toggle('active', i === currentSlide);
  });
  if (resetAuto) resetTimer();
}
// Activar el primer slide al cargar
slides[0].classList.add('active');
function carouselMove(dir) { goToSlide(currentSlide + dir); }
function resetTimer() {
  clearInterval(autoTimer);
  // Auto-play solo cuando NO estamos en la zona de scroll-driven (fase 2)
  autoTimer = setInterval(() => {
    const vh = window.innerHeight;
    const scrolled = -scrollScene.getBoundingClientRect().top;
    const PHASE1_PX = vh * 1.2;
    // Solo auto-avanzar si el usuario NO está en fase 2
    if (scrolled < PHASE1_PX) carouselMove(1);
  }, 4500);
}
resetTimer();

// Swipe móvil
let touchStartX = 0;
const carouselEl = document.getElementById('carousel');
if (carouselEl) {
  carouselEl.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  carouselEl.addEventListener('touchend',   e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) carouselMove(dx < 0 ? 1 : -1);
  });
}

/* ── SMOOTH ANCHOR ───────────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
  });
});

/* ── FORM ────────────────────────────────────────────────────────── */
function handleForm(e) {
  e.preventDefault();
  const btn = e.target.querySelector('.form-submit');
  btn.textContent = '✓ Gesendet / Envoyé / Sent';
  btn.style.background = '#2d6a4f';
  setTimeout(() => {
    btn.innerHTML = '<span class="lang-de">Senden</span><span class="lang-fr">Envoyer</span><span class="lang-en">Send</span>';
    btn.style.background = '';
    e.target.reset();
  }, 3000);
}
