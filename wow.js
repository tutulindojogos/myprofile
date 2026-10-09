/* ===== v12 — wow ✦ ===== (veja o comentário no começo do wow.css) */
(() => {
  'use strict';
  const $ = s => document.querySelector(s), B = document.body;
  const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rand = (a, b) => a + Math.random() * (b - a);
  const lite = () => B.classList.contains('lite');
  const fx = () => !REDUCE && !lite();
  const mk = (cls, txt) => { const e = document.createElement('div'); e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const home = $('#home'), menu = $('.menu'), vol = $('#vol');

  /* ---------- sons bem baixinhos (só com a música ligada, no volume do site) ---------- */
  let actx = null;
  function tone(freqs, o = {}) {
    const v = (o.gain || .04) * ((vol ? +vol.value : 60) / 100);
    if (!B.classList.contains('playing') || v <= 0) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      actx = actx || new AC(); if (actx.state === 'suspended') actx.resume();
      freqs.forEach((f, i) => {
        const osc = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + i * (o.step || .06);
        osc.type = o.type || 'sine'; osc.frequency.value = f; osc.connect(g); g.connect(actx.destination);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + (o.dur || .12));
        osc.start(t); osc.stop(t + (o.dur || .12) + .03);
      });
    } catch (e) {}
  }

  /* faíscas pequenas saindo de um ponto */
  function sparks(x, y, n, dmin, dmax, life) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 6.283 + rand(-.25, .25), d = rand(dmin, dmax);
      const s = document.createElement('i'); s.className = 'wow-spk'; s.textContent = ['✦', '✧', '·', '✦'][i % 4];
      s.style.cssText = `left:${x}px;top:${y}px;--dx:${Math.cos(a) * d | 0}px;--dy:${Math.sin(a) * d | 0}px;--r:${rand(-160, 160) | 0}deg;--t:${(life || 1) + rand(0, .4)}s;animation-delay:${rand(0, .1).toFixed(2)}s`;
      B.appendChild(s); setTimeout(() => s.remove(), 2000);
    }
  }

  /* ---------- 1) troca de aba ---------- */
  const G = 'ABCDEFGHJKLMNPQRSTUVWXYZ01#';
  function decode(el) {
    const n = [...el.childNodes].find(x => x.nodeType === 3 && x.nodeValue.trim()); if (!n) return;
    const full = n.nodeValue, F = 10; let f = 0; clearInterval(el._d);
    el._d = setInterval(() => {
      f++; const k = Math.floor(full.length * f / F);
      n.nodeValue = full.slice(0, k) + [...full.slice(k)].map(c => /[A-Z0-9]/.test(c) ? G[Math.random() * G.length | 0] : c).join('');
      if (f >= F) { clearInterval(el._d); n.nodeValue = full; }
    }, 45);
  }
  function onTab(item) {
    if (!home || home.classList.contains('hidden')) return;
    tone([988, 1480], {dur: .09, gain: .05, step: .05});
    const p = document.getElementById(item.dataset.panel);
    if (p) { const t = p.querySelector('.panel-title'); if (t && !REDUCE) decode(t); }
    if (!fx()) return;
    const r = item.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    const ring = mk('wow-ring'); ring.style.left = x + 'px'; ring.style.top = y + 'px'; B.appendChild(ring); setTimeout(() => ring.remove(), 750);
    sparks(x, y, 8, 36, 100, .8);
    if (p) { p.classList.remove('wow-scan'); void p.offsetWidth; p.classList.add('wow-scan'); setTimeout(() => p.classList.remove('wow-scan'), 700); }
  }
  if (menu) new MutationObserver(recs => {
    recs.forEach(m => {
      const el = m.target;
      if (el.classList && el.classList.contains('menu-item') && el.classList.contains('active') && !(m.oldValue || '').split(/\s+/).includes('active')) onTab(el);
    });
  }).observe(menu, {attributes: true, attributeFilter: ['class'], attributeOldValue: true, subtree: true});

  /* ---------- 2) inclinação 3D dos cards e clips ---------- */
  const TILT = '.link-card,.clip';
  let cur = null, raf = 0, px = 0, py = 0;
  const reset = el => { if (el) el.style.transform = ''; };
  document.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch' || !fx()) return;
    const el = e.target.closest ? e.target.closest(TILT) : null;
    if (el !== cur) { reset(cur); cur = el; }
    if (!el) return;
    px = e.clientX; py = e.clientY;
    if (!raf) raf = requestAnimationFrame(() => {
      raf = 0; if (!cur) return;
      const r = cur.getBoundingClientRect(), dx = (px - r.left) / r.width - .5, dy = (py - r.top) / r.height - .5;
      cur.style.transform = `perspective(700px) rotateX(${(-dy * 9).toFixed(2)}deg) rotateY(${(dx * 11).toFixed(2)}deg) translateZ(0)`;
    });
  }, {passive: true});
  addEventListener('blur', () => { reset(cur); cur = null; });
  document.addEventListener('pointerleave', () => { reset(cur); cur = null; });

  /* ---------- 3) moodboard arrastável ---------- */
  const items = [...document.querySelectorAll('.moodboard .pol, .moodboard .stk')];
  const BKEY = 'tutu.board.v1';
  let saved = {}; try { saved = JSON.parse(localStorage.getItem(BKEY) || '{}'); } catch (e) {}
  const persist = () => { try { localStorage.setItem(BKEY, JSON.stringify(saved)); } catch (e) {} };
  const baseT = new Map(), pos = new Map(); let z = 5;
  items.forEach((el, i) => {
    el._id = (el.className.match(/\b[ps]\d\b/) || ['i' + i])[0];
    const t = getComputedStyle(el).transform; baseT.set(el, t === 'none' ? '' : t);
    pos.set(el, saved[el._id] ? {x: +saved[el._id].x || 0, y: +saved[el._id].y || 0} : {x: 0, y: 0});
  });
  const place = el => { const p = pos.get(el); el.style.transform = `translate(${(p.x * innerWidth).toFixed(1)}px,${(p.y * innerHeight).toFixed(1)}px) ${baseT.get(el)}`; };
  const boardOn = () => items.length && matchMedia('(min-width: 901px)').matches && matchMedia('(pointer: fine)').matches;
  if (boardOn()) items.forEach(el => { const p = pos.get(el); if (p.x || p.y) place(el); });
  addEventListener('resize', () => { if (boardOn()) items.forEach(place); });

  const BLOCK = 'button,a,input,select,textarea,.guide,.vol-hud,.lyw,.lyw-tab,.ly-pill,#home,#boot,.toasts,.wish,.lightbox';
  const hit = (x, y) => {
    for (let i = items.length - 1; i >= 0; i--) {
      const r = items[i].getBoundingClientRect();
      if (r.width && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        // com várias sobrepostas, vence a que está por cima
        let best = items[i];
        items.forEach(o => { const q = o.getBoundingClientRect(); if (q.width && x >= q.left && x <= q.right && y >= q.top && y <= q.bottom && (+o.style.zIndex || 0) > (+best.style.zIndex || 0)) best = o; });
        return best;
      }
    }
    return null;
  };
  const free = (x, y) => { const t = document.elementFromPoint(x, y); return !(t && t.closest && t.closest(BLOCK)); };

  let drag = null, lastTap = {el: null, t: 0}, hoverRaf = 0, hx = 0, hy = 0;
  addEventListener('pointerdown', e => {
    if (e.button !== 0 || e.pointerType === 'touch' || !boardOn() || !free(e.clientX, e.clientY)) return;
    const el = hit(e.clientX, e.clientY); if (!el) return;
    e.stopPropagation(); e.preventDefault();
    const now = performance.now();
    if (lastTap.el === el && now - lastTap.t < 380) { // duplo clique: volta pro lugar
      lastTap = {el: null, t: 0}; pos.set(el, {x: 0, y: 0}); delete saved[el._id]; persist();
      el.style.transition = 'transform .55s cubic-bezier(.2,.8,.2,1)'; place(el); setTimeout(() => { el.style.transition = ''; }, 600);
      tone([520, 660], {dur: .09, type: 'triangle', gain: .04}); return;
    }
    lastTap = {el, t: now};
    const p = pos.get(el);
    drag = {el, sx: e.clientX, sy: e.clientY, ox: p.x, oy: p.y, r: el.getBoundingClientRect()};
    el.style.zIndex = ++z; el.classList.add('lifted'); B.classList.add('pol-drag');
    tone([660], {dur: .08, type: 'triangle', gain: .045});
  }, true);
  addEventListener('pointermove', e => {
    if (drag) {
      let dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      const cx = drag.r.left + drag.r.width / 2 + dx, cy = drag.r.top + drag.r.height / 2 + dy; // mantém dentro da tela
      dx += Math.min(Math.max(cx, 24), innerWidth - 24) - cx; dy += Math.min(Math.max(cy, 24), innerHeight - 24) - cy;
      pos.set(drag.el, {x: drag.ox + dx / innerWidth, y: drag.oy + dy / innerHeight}); place(drag.el); return;
    }
    if (!boardOn() || e.pointerType === 'touch') return;
    hx = e.clientX; hy = e.clientY;
    if (!hoverRaf) hoverRaf = requestAnimationFrame(() => { hoverRaf = 0; B.classList.toggle('pol-hover', free(hx, hy) && !!hit(hx, hy)); });
  }, true);
  const drop = () => {
    if (!drag) return; const el = drag.el, p = pos.get(el); drag = null;
    el.classList.remove('lifted'); B.classList.remove('pol-drag');
    saved[el._id] = {x: +p.x.toFixed(4), y: +p.y.toFixed(4)}; persist();
    if (!REDUCE) el.animate([{rotate: '0deg'}, {rotate: '4deg'}, {rotate: '-3deg'}, {rotate: '1.5deg'}, {rotate: '0deg'}], {duration: 620, easing: 'ease-out'});
    tone([440, 330], {dur: .1, type: 'triangle', gain: .045, step: .05});
  };
  addEventListener('pointerup', drop, true); addEventListener('pointercancel', drop, true);
  // Shift+R devolve tudo pro lugar de origem (caso uma polaroid fique escondida atrás do Vita)
  addEventListener('keydown', e => {
    if (e.key !== 'R' || !e.shiftKey || e.ctrlKey || e.metaKey || e.altKey || /input|textarea/i.test((e.target || {}).tagName || '')) return;
    saved = {}; persist();
    items.forEach(el => { pos.set(el, {x: 0, y: 0}); el.style.transition = 'transform .55s cubic-bezier(.2,.8,.2,1)'; place(el); setTimeout(() => { el.style.transition = ''; }, 600); });
  });

  /* ---------- 4) palavras secretas ---------- */
  const WORDS = {
    psp: {g: ['△', '○', '✕', '□'], msg: '△ ○ ✕ □'},
    y2k: {g: ['✧', '♡', '✦', '☆'], msg: 'y2k forever ✧'},
    xoxo: {g: ['♡', '♥', '✧'], msg: 'xoxo ♡'}
  };
  let buf = '';
  function rain(w) {
    const chip = mk('wow-chip', w.msg); B.appendChild(chip); setTimeout(() => chip.remove(), 2500);
    tone([1318, 1760, 2093], {dur: .5, gain: .04, step: .09});
    if (REDUCE) return;
    const n = lite() ? 12 : 30;
    for (let i = 0; i < n; i++) {
      const s = document.createElement('i'); s.className = 'wow-fall'; s.textContent = w.g[i % w.g.length];
      s.style.cssText = `left:${rand(2, 98).toFixed(1)}vw;--s:${rand(14, 28) | 0}px;--t:${rand(2.4, 4).toFixed(2)}s;--d:${rand(0, 1).toFixed(2)}s;--sx:${rand(-60, 60) | 0}px;--r:${rand(-240, 240) | 0}deg`;
      B.appendChild(s); setTimeout(() => s.remove(), 5400);
    }
  }
  addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey || !e.key || e.key.length !== 1 || /input|textarea/i.test((e.target || {}).tagName || '')) return;
    buf = (buf + e.key.toLowerCase()).slice(-6);
    for (const w in WORDS) if (buf.endsWith(w)) { buf = ''; rain(WORDS[w]); break; }
  });

  /* ---------- 5) título da aba chama você de volta ---------- */
  const T0 = document.title, away = ['✧ come back ✧', 'angel.exe is waiting ✦']; let ti = 0, tt = 0;
  document.addEventListener('visibilitychange', () => {
    clearInterval(tt);
    if (document.hidden) { ti = 0; document.title = away[0]; tt = setInterval(() => { ti = (ti + 1) % away.length; document.title = away[ti]; }, 1800); }
    else document.title = T0;
  });
})();
