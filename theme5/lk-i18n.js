/* LK Fashion — language and currency pickers.
   - Submit on change.
   - Country and language stay coherent: picking a country keeps the current language if it suits that
     country, otherwise switches to the country's main language (France -> French, Brazil -> Portuguese).
     Picking a language never changes the country (a Spanish speaker in Canada still pays in CAD).
   - First visit: switch to the visitor's country (and its currency) and a matching language. */
(() => {
  /* Languages that suit each country, best first. Only languages the store publishes are used;
     anything else falls back to English. Countries not listed: English. */
  const FIT = {
    CA: ['en', 'fr'],
    US: ['en', 'es'], GB: ['en'], IE: ['en'], AU: ['en'], NZ: ['en'], ZA: ['en'], NG: ['en'], SG: ['en', 'zh-CN'],
    FR: ['fr'], BE: ['fr', 'en'], LU: ['fr', 'en'], CH: ['fr', 'en'], HT: ['fr'], SN: ['fr'], CI: ['fr'],
    MA: ['fr', 'ar'], DZ: ['fr', 'ar'], TN: ['fr', 'ar'], LB: ['ar', 'fr', 'en'],
    ES: ['es'], MX: ['es'], AR: ['es'], CO: ['es'], CL: ['es'], PE: ['es'],
    BR: ['pt-BR'], PT: ['pt-BR'],
    CN: ['zh-CN'], TW: ['zh-CN', 'en'], HK: ['en', 'zh-CN'],
    AE: ['ar', 'en'], SA: ['ar', 'en'], QA: ['ar', 'en'], KW: ['ar', 'en'], BH: ['ar', 'en'], OM: ['ar', 'en'],
    EG: ['ar', 'en'], JO: ['ar', 'en'],
    IN: ['en', 'hi'], PK: ['en', 'ur'], BD: ['bn', 'en']
  };

  const base = (l) => (l || '').toLowerCase().split('-')[0];
  const has = (list, l) => list.find((x) => x.toLowerCase() === (l || '').toLowerCase()) || list.find((x) => base(x) === base(l));

  /* Best language for a country: keep `cur` if it suits, else the country's first available language, else English */
  const pick = (country, cur, avail) => {
    const fit = (FIT[country] || ['en']).map((l) => has(avail, l)).filter(Boolean);
    if (!fit.length) return has(avail, 'en') || cur;
    return fit.find((l) => base(l) === base(cur)) || fit[0];
  };

  const avail = (form) => (form.dataset.locales || '').split(',').filter(Boolean);

  /* EN / FR links keep the current query string (search terms, filters) */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-lk-langlink]');
    if (!a || !location.search) return;
    const u = new URL(a.href, location.href);
    if (!u.search) { u.search = location.search; a.href = u.toString(); }
  });

  document.addEventListener('change', (e) => {
    const s = e.target.closest('[data-lk-autosubmit]');
    if (!s || !s.value || !s.form) return;
    const loc = s.name === 'country_code' && s.form.querySelector('[data-lk-locale]');
    if (loc) loc.value = pick(s.value, loc.value, avail(s.form));
    s.form.submit();
  });

  /* First visit: detected country + a language that suits both the visitor and that country */
  const form = document.querySelector('[data-lk-cur]');
  const sel = form && form.querySelector('select[name="country_code"]');
  if (!sel || window.Shopify?.designMode || /bot|crawl|spider|lighthouse/i.test(navigator.userAgent)) return;
  let seen = null;
  try { seen = localStorage.getItem('lk-geo'); } catch (e) {}
  if (seen) return;
  let acted = false;
  const mark = () => { try { localStorage.setItem('lk-geo', '1'); } catch (e) {} };
  const manual = () => { acted = true; mark(); };
  /* Manual choice wins, immediately: any language link, language/country picker or localization form */
  document.addEventListener('change', (e) => { if (e.target.closest('[data-lk-autosubmit]')) manual(); }, true);
  document.addEventListener('click', (e) => { if (e.target.closest('[data-lk-langlink], .lk-lang, .lk-cur')) manual(); }, true);
  document.addEventListener('submit', (e) => { if (e.target.closest('.lk-lang, .lk-cur')) manual(); }, true);
  fetch('/browsing_context_suggestions.json?country[enabled]=true&currency[enabled]=true', { headers: { Accept: 'application/json' } })
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => {
      if (acted) return;
      mark();
      const c = j?.detected_values?.country?.handle;
      const country = c && sel.querySelector(`option[value="${c}"]`) ? c : sel.value;
      const loc = form.querySelector('[data-lk-locale]');
      const list = avail(form);
      const curLoc = loc ? loc.value : '';
      const primary = form.dataset.primary || 'en';
      /* The visitor's own browser languages win when the store has them; otherwise the country's main language */
      const browser = (navigator.languages || [navigator.language]).map((l) => has(list, l)).filter(Boolean);
      const fit = (FIT[country] || ['en']).map((l) => has(list, l)).filter(Boolean);
      /* Already on a translated URL (e.g. /fr): keep that language, only adjust the country */
      const want = curLoc && base(curLoc) !== base(primary) ? curLoc
        : browser.find((l) => fit.some((f) => base(f) === base(l))) || browser[0] || pick(country, curLoc, list) || curLoc;
      if (country === sel.value && (!loc || want === curLoc)) return;
      sel.value = country;
      if (loc) loc.value = want;
      form.submit();
    })
    .catch(mark);
})();