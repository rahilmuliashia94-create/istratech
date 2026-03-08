/* script.js — compact, namespaced, Why-Us tilt disabled
   - Features: smooth scroll, counters, circuit canvas, tilt (excluded inside .why-us),
     product slider + popup, gallery popup, FAQ accordion, demo buttons, why-us enhancer
   - Idempotent: safe to load multiple times
*/
(function () {
  if (window.__everestScriptInit) return;
  window.__everestScriptInit = true;

  /* helpers */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);
  const create = (t, a = {}) => {
    const e = document.createElement(t);
    Object.entries(a).forEach(([k, v]) => {
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else e.setAttribute(k, v);
    });
    return e;
  };

  document.addEventListener('DOMContentLoaded', () => {

    /* ---------------- smooth anchor scroll ---------------- */
    (function smooth() {
      document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', (ev) => {
          const href = a.getAttribute('href') || '';
          if (!href.startsWith('#')) return;
          ev.preventDefault();
          const target = document.querySelector(href);
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          else window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      });
    })();

    /* ---------------- counters (single observer) ---------------- */
    (function counters() {
      const roots = $$('.why-stats, .expanded-stats, .stats');
      const allTargets = [];
      roots.forEach(root => {
        const items = root.querySelectorAll('h2[data-target]');
        items.forEach(i => { i.textContent = '0'; allTargets.push(i); });
      });
      if (!allTargets.length) return;

      const run = (el, target, duration = 1400) => {
        let start = null;
        function step(ts) {
          if (!start) start = ts;
          const prog = Math.min((ts - start) / duration, 1);
          el.textContent = Math.floor(prog * target);
          if (prog < 1) requestAnimationFrame(step);
          else el.textContent = target;
        }
        requestAnimationFrame(step);
      };

      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const items = entry.target.querySelectorAll('h2[data-target]');
          items.forEach(it => {
            if (it.dataset._done) return;
            it.dataset._done = '1';
            const t = Math.max(0, parseInt(it.getAttribute('data-target')) || 0);
            const dur = Math.min(Math.max(800, t * 3), 2200);
            run(it, t, dur);
          });
          obs.unobserve(entry.target);
        });
      }, { threshold: 0.35 });

      roots.forEach(r => io.observe(r));
    })();

    /* ---------------- circuit canvas (kept simple) ---------------- */
    (function circuit() {
      const canvas = $('#circuit');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      let lines = [], raf = null;
      const dpr = Math.max(1, window.devicePixelRatio || 1);

      function makeLines(w, h) {
        const count = 24 + Math.round(w / 300);
        lines = Array.from({ length: count }, () => ({
          x: Math.random() * w,
          y: Math.random() * h,
          len: 40 + Math.random() * 120,
          speed: 0.2 + Math.random() * 1.1,
          a: 0.12 + Math.random() * 0.45
        }));
      }

      function resize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        makeLines(w, h);
      }

      function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const w = window.innerWidth, h = window.innerHeight;
        ctx.lineWidth = 1;
        lines.forEach(L => {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(0,119,255,${L.a})`;
          ctx.moveTo(L.x, L.y);
          ctx.lineTo(L.x + L.len, L.y);
          ctx.stroke();

          ctx.beginPath();
          ctx.strokeStyle = `rgba(0,119,255,${L.a * 0.6})`;
          ctx.moveTo(L.x + L.len / 3, L.y - 3);
          ctx.lineTo(L.x + L.len / 3, L.y + 3);
          ctx.stroke();

          L.x += L.speed;
          if (L.x - L.len > w) {
            L.x = -L.len;
            L.y = Math.random() * h;
          }
        });
        raf = requestAnimationFrame(draw);
      }

      let tO;
      window.addEventListener('resize', () => {
        cancelAnimationFrame(raf);
        clearTimeout(tO);
        tO = setTimeout(() => { resize(); draw(); }, 120);
      });

      resize();
      draw();
    })();

    /* ---------------- tilt (disabled for .why-us) ---------------- */
    (function tilt() {
      // select cards that are NOT inside .why-us
      const cards = $$('.card').filter(c => !c.closest('.why-us'));
      if (!cards.length) return;
      cards.forEach(card => {
        let rafId = null;
        function onMove(e) {
          const r = card.getBoundingClientRect();
          const x = e.clientX - r.left;
          const y = e.clientY - r.top;
          const cx = r.width / 2, cy = r.height / 2;
          const rx = - (y - cy) / 12;
          const ry = (x - cx) / 12;
          if (rafId) cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(() => {
            card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.02)`;
            card.style.transition = 'transform 120ms linear';
          });
        }
        function onLeave() {
          if (rafId) cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(() => {
            card.style.transform = '';
            card.style.transition = 'transform 300ms ease';
          });
        }
        on(card, 'mousemove', onMove);
        on(card, 'mouseleave', onLeave);
        on(card, 'focus', () => card.style.transform = 'scale(1.02)');
        on(card, 'blur', () => card.style.transform = '');
      });
    })();

    /* ---------------- product slider + popup (concise) ---------------- */
    (function products() {
      const section = $('#products');
      if (!section) return;
      const track = section.querySelector('.track');
      if (!track) return;

      if (!track.dataset.duplicated) {
        Array.from(track.children).forEach(i => track.appendChild(i.cloneNode(true)));
        track.dataset.duplicated = '1';
      }
      track.addEventListener('mouseenter', () => track.style.animationPlayState = 'paused');
      track.addEventListener('mouseleave', () => track.style.animationPlayState = '');

      // ensure popup exists (single shared popup)
      let popup = $('#popup');
      if (!popup) {
        popup = create('div', { class: 'product-popup', id: 'popup' });
        popup.innerHTML = `
          <div class="popup-content" role="dialog" aria-modal="true" aria-labelledby="popup-title">
            <div class="popup-close" id="popup-close" title="Close">✕</div>
            <img id="popup-img" src="" alt="">
            <h3 id="popup-title"></h3>
            <p id="popup-text"></p>
          </div>
        `;
        document.body.appendChild(popup);
      }
      const popupContent = popup.querySelector('.popup-content');
      const popupImg = popup.querySelector('#popup-img');
      const popupTitle = popup.querySelector('#popup-title');
      const popupText = popup.querySelector('#popup-text');
      const popupClose = popup.querySelector('#popup-close');

      function openPopup(src, title, text) {
        popupImg.src = src || '';
        popupImg.alt = title || 'Item';
        popupTitle.textContent = title || '';
        popupText.textContent = text || '';
        popup.classList.add('active');
        track.style.animationPlayState = 'paused';
        if (popupClose) popupClose.focus();
      }
      function closePopup() {
        popup.classList.remove('active');
        track.style.animationPlayState = '';
      }

      function attach() {
        track.querySelectorAll('.product-card').forEach(card => {
          if (card.dataset.attached) return;
          card.addEventListener('click', () => {
            const img = card.querySelector('img');
            const title = (card.querySelector('h3') || {}).innerText || '';
            const text = (card.querySelector('p') || {}).innerText || '';
            openPopup((img && (img.getAttribute('data-full') || img.src)) || '', title, text);
          });
          card.dataset.attached = '1';
        });
      }
      attach();
      new MutationObserver(attach).observe(track, { childList: true, subtree: true });

      on(popupClose, 'click', (e) => { e.stopPropagation(); closePopup(); });
      popup.addEventListener('click', e => { if (!popupContent.contains(e.target)) closePopup(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && popup.classList.contains('active')) closePopup(); });
    })();

    /* ---------------- gallery popup (reuse #popup) ---------------- */
    (function gallery() {
      const grid = $$('.gallery-item');
      if (!grid.length) return;
      let popup = $('#popup');
      if (!popup) {
        popup = create('div', { class: 'product-popup', id: 'popup' });
        popup.innerHTML = `
          <div class="popup-content" role="dialog" aria-modal="true" aria-labelledby="popup-title">
            <div class="popup-close" id="popup-close" title="Close">✕</div>
            <img id="popup-img" src="" alt="">
            <h3 id="popup-title"></h3>
            <p id="popup-text"></p>
          </div>
        `;
        document.body.appendChild(popup);
      }
      function open(src, title) {
        const img = popup.querySelector('#popup-img');
        const h = popup.querySelector('#popup-title');
        const p = popup.querySelector('#popup-text');
        img.src = src || '';
        h.textContent = title || '';
        p.textContent = title || '';
        popup.style.display = 'block';
        popup.setAttribute('aria-hidden', 'false');
      }
      function close() { popup.style.display = 'none'; popup.setAttribute('aria-hidden', 'true'); }

      document.addEventListener('click', e => {
        const g = e.target.closest('.gallery-item');
        if (g) {
          const src = g.dataset.img || g.querySelector('img')?.src || '';
          const caption = g.querySelector('.caption')?.textContent || '';
          open(src, caption);
        }
        if (e.target.closest('#popup .popup-close') || e.target.id === 'popup-close') close();
      });
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') close();
        if (e.key === 'Enter') {
          const f = document.activeElement;
          if (f && f.classList && f.classList.contains('gallery-item')) {
            const s = f.dataset.img || f.querySelector('img')?.src || '';
            const c = f.querySelector('.caption')?.textContent || '';
            open(s, c);
          }
        }
      });
      const popupRoot = $('#popup');
      if (popupRoot) popupRoot.addEventListener('click', ev => { if (ev.target === popupRoot) close(); });
      grid.forEach(g => { if (!g.hasAttribute('tabindex')) g.tabIndex = 0; g.setAttribute('role', 'button'); });
    })();

    /* ---------------- FAQ accordion ---------------- */
    (function faq() {
      const items = $$('.faq-q');
      if (!items.length) return;
      items.forEach(btn => {
        const panel = btn.nextElementSibling;
        if (!panel) return;
        panel.style.display = 'none';
        btn.setAttribute('aria-expanded', 'false');
        btn.addEventListener('click', () => {
          const open = btn.getAttribute('aria-expanded') === 'true';
          btn.setAttribute('aria-expanded', open ? 'false' : 'true');
          panel.style.display = open ? 'none' : 'block';
        });
      });
    })();

    /* ---------------- demo buttons ---------------- */
    (function demos() {
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('.demo-btn');
        if (!btn) return;
        const popup = $('#popup');
        if (!popup) return;
        const img = popup.querySelector('#popup-img');
        const h = popup.querySelector('#popup-title');
        const p = popup.querySelector('#popup-text');
        img.src = 'EVEREST-PLATINUM.jpg';
        img.alt = 'Everest Monitoring Demo';
        h.textContent = 'Everest Monitoring — Demo';
        p.textContent = 'Demo: Operator verifies events using short camera clips and sensor correlation, then escalates to responders when required.';
        popup.style.display = 'block';
        popup.setAttribute('aria-hidden', 'false');
      });
    })();

    /* ---------------- Why-Us enhancer (compact) ---------------- */
    (function whyEnhance() {
      const root = document.querySelector('.why-us, .full-why');
      if (!root) return;

      // Normalize images inside why-us
      $$('img', root).forEach(img => {
        if (img.closest('.product-card')) return;
        img.style.width = '100%';
        img.style.objectFit = 'cover';
        if (!img.style.height) img.style.height = img.dataset.fixHeight || '220px';
        img.style.borderRadius = img.style.borderRadius || '8px';
        img.style.display = 'block';
      });

      // Convert feature-deep cards to media/content if not yet converted
      $$('.feature-deep .card', root).forEach(card => {
        if (card.dataset._conv) return;
        const img = card.querySelector('img');
        const media = create('div', { class: 'card-media' });
        const content = create('div', { class: 'card-content' });
        if (img) media.appendChild(img);
        Array.from(card.children).forEach(ch => { if (ch.tagName.toLowerCase() !== 'img') content.appendChild(ch); });
        card.innerHTML = '';
        card.appendChild(media);
        card.appendChild(content);
        media.classList.add('animate-media');
        content.classList.add('animate-text');
        card.dataset._conv = '1';
      });

      // Convert case cards
      $$('.case-cards .case', root).forEach(card => {
        if (card.dataset._conv) return;
        const img = card.querySelector('img');
        const media = create('div', { class: 'case-media' });
        const content = create('div', { class: 'case-content' });
        if (img) media.appendChild(img);
        Array.from(card.children).forEach(ch => { if (ch.tagName.toLowerCase() !== 'img') content.appendChild(ch); });
        card.innerHTML = '';
        card.appendChild(media);
        card.appendChild(content);
        media.classList.add('animate-media');
        content.classList.add('animate-text');
        card.dataset._conv = '1';
      });

      // convert hero media
      const heroCard = $('.hero-card', root);
      if (heroCard) {
        const img = heroCard.querySelector('img');
        if (img) {
          img.style.height = '320px';
          img.classList.add('animate-media');
        }
        const text = heroCard.querySelector('.hero-card-text');
        if (text) text.classList.add('animate-text');
      }

      // compact gallery images
      $$('.why-gallery .gallery-grid img', root).forEach(img => {
        img.style.height = '140px';
      });

      // reveal animation via IntersectionObserver
      const toObserve = [
        ...$$('.feature-deep .card', root),
        ...$$('.hero-card', root),
        ...$$('.case-cards .case', root),
        ...$$('.why-team .card', root)
      ];
      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach(en => {
          if (!en.isIntersecting) return;
          const media = en.target.querySelector('.animate-media');
          const text = en.target.querySelector('.animate-text');
          if (media && !media.dataset._seen) {
            media.style.transition = 'transform .7s cubic-bezier(.2,.9,.2,1), opacity .7s ease';
            media.style.transform = 'translateX(0)';
            media.style.opacity = '1';
            media.dataset._seen = '1';
          }
          if (text && !text.dataset._seen) {
            text.style.transition = 'transform .7s cubic-bezier(.2,.9,.2,1) .12s, opacity .7s ease .12s';
            text.style.transform = 'translateY(0)';
            text.style.opacity = '1';
            text.dataset._seen = '1';
          }
          obs.unobserve(en.target);
        });
      }, { threshold: 0.18 });

      toObserve.forEach(t => {
        const m = t.querySelector('.animate-media');
        const tx = t.querySelector('.animate-text');
        if (m) { m.style.opacity = '0'; m.style.transform = 'translateX(-18px)'; }
        if (tx) { tx.style.opacity = '0'; tx.style.transform = 'translateY(14px)'; }
        io.observe(t);
      });

      // accessibility touches
      $$('.card', root).forEach(c => { if (!c.hasAttribute('tabindex')) c.tabIndex = 0; });

      // responsive: ensure media/content full width on small screens
      const mq = window.matchMedia('(max-width:800px)');
      function adapt() {
        const stacked = mq.matches;
        $$('.card-media, .case-media', root).forEach(m => { m.style.width = stacked ? '100%' : ''; m.style.display = stacked ? 'block' : ''; });
        $$('.card-content, .case-content', root).forEach(c => { c.style.width = stacked ? '100%' : ''; });
      }
      if (mq.addEventListener) mq.addEventListener('change', adapt); else mq.addListener(adapt);
      adapt();
    })();

    // ensure buttons default to type=button to avoid accidental form submits
    document.querySelectorAll('button').forEach(b => { if (!b.hasAttribute('type')) b.setAttribute('type', 'button'); });

  }); // DOMContentLoaded

})(); // IIFE end
