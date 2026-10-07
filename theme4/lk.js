/* LK Fashion — storefront behaviour: header, menu, search, cursors, hero, catalogue, scroll effects. Shopping (product form, cart) is in lk-shop.js. */
(() => {
  document.documentElement.classList.remove('no-js');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const S = (window.lk && window.lk.strings) || {};

  /* Header scrolled state */
  const hdr = $('[data-hdr]');
  if (hdr) {
    let st = null, hq = 0;
    const on = () => { hq = 0; const v = scrollY > 40; if (v !== st) { st = v; hdr.toggleAttribute('data-scrolled', v); } };
    on(); addEventListener('scroll', () => { if (!hq) hq = requestAnimationFrame(on); }, { passive: true });
  }

  /* Overlays: menu, search, cart drawer share one lock */
  let lastFocus = null;
  const lock = (v) => { document.documentElement.style.overflow = v ? 'hidden' : ''; };
  const openLayer = (el, focusSel) => {
    if (!el) return;
    lastFocus = document.activeElement;
    el.setAttribute('aria-hidden', 'false'); lock(true);
    setTimeout(() => $(focusSel, el)?.focus(), 60);
  };
  const closeLayer = (el) => {
    if (!el || el.getAttribute('aria-hidden') !== 'false') return;
    el.setAttribute('aria-hidden', 'true'); lock(false);
    lastFocus?.focus?.();
  };
  const menu = $('[data-menu]'), search = $('[data-search]');
  const menuBtn = $('[data-menu-open]');
  menuBtn?.addEventListener('click', () => { openLayer(menu, '[data-menu-close]'); menuBtn.setAttribute('aria-expanded', 'true'); });
  $('[data-menu-close]')?.addEventListener('click', () => { closeLayer(menu); menuBtn?.setAttribute('aria-expanded', 'false'); });
  $('[data-search-open]')?.addEventListener('click', () => openLayer(search, 'input[type=search]'));
  $('[data-search-close]')?.addEventListener('click', () => closeLayer(search));
  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    closeLayer(menu); menuBtn?.setAttribute('aria-expanded', 'false'); closeLayer(search);
  });

  /* Menu: hovering a link swaps the preview image */
  if (menu) {
    const img = $('.menu__img', menu), defSrc = img?.getAttribute('src'), defSet = img?.getAttribute('srcset') || '';
    $$('[data-preview]', menu).forEach((a) => {
      a.addEventListener('mouseenter', () => { if (img) { img.srcset = ''; img.src = a.dataset.preview; } });
    });
    $('.menu__nav', menu)?.addEventListener('mouseleave', () => { if (img && defSrc) { img.srcset = defSet; img.src = defSrc; } });
    /* Warm the menu photos once the page has settled, so nothing pops in when the menu opens */
    const warm = () => {
      if (img) img.loading = 'eager';
      if (fine) $$('[data-preview]', menu).forEach((a) => { const i = new Image(); i.decoding = 'async'; i.src = a.dataset.preview; });
    };
    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 1200));
    if (document.readyState === 'complete') idle(warm); else addEventListener('load', () => idle(warm), { once: true });
    menuBtn?.addEventListener('pointerenter', warm, { once: true });
  }

  /* Cursor bubble ("[ DRAG ]") */
  const cursor = $('.lk-cursor'), bubble = cursor?.firstElementChild;
  let cx = 0, cy = 0, tx = 0, ty = 0, raf = 0;
  const loop = () => { cx += (tx - cx) * 0.25; cy += (ty - cy) * 0.25; cursor.style.transform = `translate(${cx}px,${cy}px)`; raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.3 ? requestAnimationFrame(loop) : 0; };
  const moveCursor = (x, y) => { tx = x; ty = y; if (!raf) raf = requestAnimationFrame(loop); };
  const showCursor = (label) => { if (!cursor) return; bubble.textContent = label; cursor.classList.add('is-on'); };
  const hideCursor = () => cursor?.classList.remove('is-on');

  /* Rails: drag to scroll, progress bar, cursor */
  $$('[data-rail]').forEach((rail) => {
    const bar = rail.parentElement.querySelector('[data-rail-progress]');
    const prog = () => {
      if (!bar) return;
      const max = rail.scrollWidth - rail.clientWidth;
      bar.style.setProperty('--p', `${Math.max(12, max > 0 ? ((rail.scrollLeft + rail.clientWidth) / rail.scrollWidth) * 100 : 100)}%`);
    };
    prog(); rail.addEventListener('scroll', prog, { passive: true }); addEventListener('resize', prog);
    if (!fine) return;
    let down = false, sx = 0, sl = 0, moved = 0;
    rail.addEventListener('pointerenter', () => showCursor(rail.dataset.cursorLabel || '[ DRAG ]'));
    rail.addEventListener('pointerleave', () => { hideCursor(); down = false; rail.classList.remove('is-dragging'); });
    rail.addEventListener('pointermove', (e) => {
      moveCursor(e.clientX, e.clientY);
      if (!down) return;
      const dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx));
      if (moved > 4) rail.classList.add('is-dragging');
      rail.scrollLeft = sl - dx;
    });
    rail.addEventListener('pointerdown', (e) => { if (e.button !== 0) return; down = true; moved = 0; sx = e.clientX; sl = rail.scrollLeft; });
    addEventListener('pointerup', () => { if (!down) return; down = false; setTimeout(() => rail.classList.remove('is-dragging'), 0); });
    rail.addEventListener('click', (e) => { if (moved > 4) { e.preventDefault(); e.stopPropagation(); } }, true);
    rail.addEventListener('dragstart', (e) => e.preventDefault());
  });

  /* Floating preview follows the pointer over rows with data-preview (categories) */
  $$('[data-cats], [data-float-root]').forEach((root) => {
    const float = $('.cats__float, .float', root), img = $('[data-cats-img], [data-float-img]', root);
    if (!float || !img || !fine) return;
    let x = 0, y = 0, fx = 0, fy = 0, r = 0;
    const step = () => { fx += (x - fx) * 0.18; fy += (y - fy) * 0.18; float.style.left = fx + 'px'; float.style.top = fy + 'px'; r = Math.abs(x - fx) + Math.abs(y - fy) > 0.3 ? requestAnimationFrame(step) : 0; };
    $$('[data-preview]', root).forEach((row) => {
      row.addEventListener('mouseenter', (e) => { img.src = row.dataset.preview; fx = x = e.clientX; fy = y = e.clientY; float.style.left = fx + 'px'; float.style.top = fy + 'px'; float.classList.add('is-on'); });
      row.addEventListener('mousemove', (e) => { x = e.clientX; y = e.clientY; if (!r) r = requestAnimationFrame(step); });
      row.addEventListener('mouseleave', () => float.classList.remove('is-on'));
    });
  });

  /* Colour reveal starts where the pointer/finger lands */
  const aimAt = (el, e) => {
    const r = el.getBoundingClientRect();
    const px = e && e.clientX !== undefined ? ((e.clientX - r.left) / r.width) * 100 : 50;
    const py = e && e.clientY !== undefined ? ((e.clientY - r.top) / r.height) * 100 : 40;
    el.style.setProperty('--mx', px.toFixed(1) + '%'); el.style.setProperty('--my', py.toFixed(1) + '%');
  };

  /* Lace-mask cursor (desktop): follows the pointer over [data-mcur-zone], tilts with speed */
  const mc = $('[data-mcur]');
  if (mc && fine) {
    let mx = -200, my = -200, px = -200, py = -200, rot = 0, run = 0;
    const tick = () => {
      px += (mx - px) * 0.22; py += (my - py) * 0.22;
      rot += (Math.max(-16, Math.min(16, (mx - px) * 0.35)) - rot) * 0.2;
      mc.style.transform = `translate3d(${px.toFixed(1)}px,${py.toFixed(1)}px,0)`;
      mc.style.setProperty('--rot', rot.toFixed(2) + 'deg');
      run = Math.abs(mx - px) + Math.abs(my - py) + Math.abs(rot) > 0.2 ? requestAnimationFrame(tick) : 0;
    };
    addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const zone = e.target.closest && e.target.closest('[data-mcur-zone]');
      if (zone && !mc.classList.contains('is-on')) { px = mx = e.clientX; py = my = e.clientY; }
      mc.classList.toggle('is-on', !!zone);
      mc.classList.toggle('is-link', !!(zone && e.target.closest('a')));
      mx = e.clientX; my = e.clientY;
      if (!run) run = requestAnimationFrame(tick);
    }, { passive: true });
    document.addEventListener('pointerleave', () => mc.classList.remove('is-on'));
    addEventListener('pointerdown', () => mc.classList.add('is-down'));
    addEventListener('pointerup', () => mc.classList.remove('is-down'));
  }

  /* Catalogue (index): filters, grid/list view, colour on hover (desktop) or as cards come into view (touch) */
  $$('[data-cat]').forEach((root) => {
    const btns = $$('[data-filter]', root), items = $$('.cat__item', root);
    btns.forEach((b) => b.addEventListener('click', () => {
      const f = b.dataset.filter;
      btns.forEach((x) => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', x === b); });
      items.forEach((li) => { li.hidden = f !== '*' && li.dataset.type !== f; });
      clamp();
    }));
    /* Phones: show the first 8 pieces, then a "View all" button (keeps the home page short) */
    const more = $('[data-cat-more]', root), phone = matchMedia('(max-width: 749px)');
    function clamp() {
      let n = 0; const on = phone.matches && !root.classList.contains('is-all');
      items.forEach((li) => li.classList.toggle('is-capped', on && !li.hidden && ++n > 8));
      if (more) more.hidden = !items.some((li) => li.classList.contains('is-capped'));
    }
    more?.addEventListener('click', () => { root.classList.add('is-all'); clamp(); });
    phone.addEventListener?.('change', clamp); clamp();
    const views = $$('[data-view]', root);
    const setView = (v) => {
      root.classList.toggle('cat--list', v === 'list');
      views.forEach((x) => { x.classList.toggle('is-on', x.dataset.view === v); x.setAttribute('aria-pressed', x.dataset.view === v); });
      try { sessionStorage.setItem('lk-view', v); } catch (e) {}
    };
    views.forEach((x) => x.addEventListener('click', () => setView(x.dataset.view)));
    try { if (sessionStorage.getItem('lk-view') === 'list') setView('list'); } catch (e) {}
    const cards = $$('[data-cc]', root);
    if (fine) {
      cards.forEach((c) => {
        const m = $('.cc__media', c);
        c.addEventListener('pointerenter', (e) => { aimAt(m, e); c.classList.add('is-on'); });
        c.addEventListener('pointerleave', () => c.classList.remove('is-on'));
      });
    } else if ('IntersectionObserver' in window) {
      const o = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-on'); o.unobserve(en.target); } }), { threshold: 0.55 });
      cards.forEach((c) => o.observe(c));
    } else cards.forEach((c) => c.classList.add('is-on'));
  });

  /* Preloader: counts to 100 while the hero images load, once per visit */
  const pre = $('[data-pre]'), heroEl = $('[data-hero]');
  const reveal = () => heroEl?.classList.add('is-in');
  if (heroEl) {
    const panels = $$('[data-hp]', heroEl);
    let closeT = 0;
    /* At rest the three slices form one face: each face image is as wide as the hero and shifted by a third per slice */
    const size = () => heroEl.style.setProperty('--hw', heroEl.clientWidth + 'px');
    size(); addEventListener('resize', size);
    const setOn = (p, e) => {
      panels.forEach((x) => x.classList.toggle('is-on', x === p));
      heroEl.classList.toggle('is-active', !!p);
      if (p) aimAt($('.hp__media', p) || p, e);
    };
    panels.forEach((p) => {
      p.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') setOn(p, e); });
      p.addEventListener('focus', () => { if (p.matches(':focus-visible')) setOn(p); });
      p.addEventListener('click', (e) => {
        if (p.classList.contains('is-on')) return; /* second tap / click opens the product */
        e.preventDefault(); setOn(p, e);
        clearTimeout(closeT); closeT = setTimeout(() => setOn(null), 7000);
      });
    });
    $('.hero__panels', heroEl)?.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') setOn(null); });
    $('.hero__panels', heroEl)?.addEventListener('focusout', (e) => { if (!heroEl.contains(e.relatedTarget)) setOn(null); });
  }
  if (pre) {
    let seen = false;
    try { seen = sessionStorage.getItem('lk-pre') === '1'; sessionStorage.setItem('lk-pre', '1'); } catch (e) {}
    if (seen || reduce) { pre.classList.add('is-gone'); reveal(); }
    else {
      const imgs = $$('[data-hero-img]'), fill = $('[data-pre-fill]', pre), pct = $('[data-pre-pct]', pre);
      const t0 = performance.now(), MIN = 1200;
      const loaded = () => imgs.length ? imgs.filter((i) => i.complete && i.naturalWidth).length / imgs.length : 1;
      let shown = 0;
      const tick = () => {
        const target = Math.min(loaded(), (performance.now() - t0) / MIN) * 100;
        shown += (target - shown) * 0.12 + 0.2;
        if (shown > target) shown = target;
        const v = Math.round(shown);
        fill.style.setProperty('--pp', v + '%'); pct.textContent = String(v).padStart(3, '0') + '%';
        if (v >= 100 || performance.now() - t0 > 4500) {
          fill.style.setProperty('--pp', '100%'); pct.textContent = '100%';
          setTimeout(() => { pre.classList.add('is-done'); reveal(); setTimeout(() => pre.classList.add('is-gone'), 1100); }, 250);
          return;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  } else reveal();

  /* Pinned masquerade: progress drives the split */
  const pins = $$('[data-pin]');
  /* Film loop runs only while on screen (saves battery and keeps scrolling smooth) */
  if (pins.length && 'IntersectionObserver' in window) {
    const po = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle('is-live', e.isIntersecting)), { rootMargin: '200px 0px' });
    pins.forEach((el) => po.observe(el));
  } else pins.forEach((el) => el.classList.add('is-live'));
  if (pins.length && !reduce) {
    const smooth = (a, b, v) => { const k = Math.min(1, Math.max(0, (v - a) / (b - a))); return k * k * (3 - 2 * k); };
    const run = () => pins.forEach((el) => {
      const r = el.getBoundingClientRect(), total = el.offsetHeight - innerHeight;
      if (r.bottom < 0 || r.top > innerHeight) return;
      const p = Math.min(1, Math.max(0, -r.top / total));
      el.style.setProperty('--p', p.toFixed(4));
      el.style.setProperty('--a', smooth(0.08, 0.68, p).toFixed(4));
      el.style.setProperty('--b', smooth(0.72, 0.94, p).toFixed(4));
    });
    let q = 0;
    run(); addEventListener('scroll', () => { if (!q) q = requestAnimationFrame(() => { q = 0; run(); }); }, { passive: true }); addEventListener('resize', run);
  }

  /* Campaign parallax */
  /* Desktop only: on touch screens parallax fights native scrolling and feels jittery */
  const par = fine ? $$('[data-parallax]') : [];
  if (par.length && !reduce) {
    const run = () => par.forEach((img) => {
      const b = img.parentElement.getBoundingClientRect();
      if (b.bottom < 0 || b.top > innerHeight) return;
      const t = (b.top + b.height / 2 - innerHeight / 2) / (innerHeight + b.height);
      img.style.setProperty('--py', `${(-6 + t * 12).toFixed(2)}%`);
    });
    let pq = 0;
    run(); addEventListener('scroll', () => { if (!pq) pq = requestAnimationFrame(() => { pq = 0; run(); }); }, { passive: true });
  }

  /* Reveal on scroll */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' }) : null;
  $$('[data-reveal]').forEach((el) => (io ? io.observe(el) : el.classList.add('is-in')));

  /* Collection sort */
  $$('[data-sort]').forEach((sel) => sel.addEventListener('change', () => {
    const u = new URL(location.href); u.searchParams.set('sort_by', sel.value); u.searchParams.delete('page'); location.href = u.toString();
  }));

})();
