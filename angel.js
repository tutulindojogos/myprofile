/* ===== v9 — angel lyrics ✦ =====
   1) letras animadas sincronizadas com a música (janela lyrics.exe + letras gigantes atrás do Vita + linha na aba MUSIC)
   2) halo e brilho que pulsam com a batida
   3) estrelas cadentes: clique pra fazer um pedido (ganha troféu)

   ┌─ COMO COLOCAR A LETRA DA SUA MÚSICA ─────────────────────────────────────────────┐
   │ Troque o texto de LRC logo abaixo. Formato: [minuto:segundo.centésimo] linha       │
   │ Exemplo:  [00:12.50] texto da linha                                                │
   │ Dica: sites como lrclib.net entregam a letra já sincronizada nesse formato.        │
   │ Linha vazia ( [01:10.00] ) = tela em branco (parte instrumental).                  │
   └────────────────────────────────────────────────────────────────────────────────────┘
   As linhas que vêm aqui são só um exemplo (texto original, não é a letra da música). */

const LRC = `
[00:06.00]
[00:08.00] signal low, halo high
[00:15.00] tuning into a softer sky
[00:22.00] chrome heart, pearl static
[00:29.00] everything glitters when it's late
[00:36.00] i left my wings on airplane mode
[00:44.00] stay online, stay angel
[00:52.00] glass rain on the screen
[01:00.00] nobody sees me buffering
[01:08.00] still loading, still bright
[01:16.00] burn me a cd of this feeling
[01:24.00] 2000s ghost in a white room
[01:32.00] press start on the sky
[01:40.00] low battery, high hopes
[01:48.00] we were never offline
[01:56.00] pixel prayers, silver stars
[02:04.00] fall slow, shine louder
[02:12.00] angel.exe is still running
[02:20.00] save point: here
[02:28.00] see you in the static
[02:36.00] ✦
`;

// batidas por minuto da música (só é usado quando o navegador não deixa "ouvir" o áudio, tipo abrindo o arquivo direto no PC)
const BPM = 92;

(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MOBILE = matchMedia('(max-width: 760px)').matches;
  const bgm = $('#bgm'); if (!bgm) return;
  const KEY = 'tutu.lyrics.v1';
  const rand = (a, b) => a + Math.random() * (b - a);
  const mmss = s => { s = Math.max(0, s | 0); return (s / 60 | 0) + ':' + String(s % 60).padStart(2, '0'); };

  /* ---------- letra (LRC) ---------- */
  const L = [];
  LRC.split('\n').forEach(raw => {
    const m = raw.match(/^\s*\[(\d+):(\d+(?:\.\d+)?)\]\s*(.*)$/);
    if (m) L.push({t: +m[1] * 60 + parseFloat(m[2]), text: m[3].trim()});
  });
  L.sort((a, b) => a.t - b.t);
  if (!L.length) return;

  /* preferências salvas (janela aberta/fechada, posição) */
  let pref = {open: true, min: false, x: null, y: null};
  try { Object.assign(pref, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(pref)); } catch (e) {} };

  /* ---------- elementos ---------- */
  const mk = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const halo = $('.halo');

  let ghost = null, win = null, tab = null;
  if (!MOBILE) {
    ghost = mk('div', 'ly-ghost'); ghost.setAttribute('aria-hidden', 'true');
    (halo || $('.moodboard') || document.body.firstChild).before(ghost);

    win = mk('section', 'lyw', `
      <header class="lyw-bar" id="lywBar">
        <span class="lyw-dots" aria-hidden="true"><i></i><i></i><i></i></span>
        <b>lyrics.exe</b>
        <button class="lyw-b" id="lywMin" type="button" aria-label="Minimizar letras">–</button>
        <button class="lyw-b" id="lywX" type="button" aria-label="Fechar letras">×</button>
      </header>
      <div class="lyw-body" aria-live="off">
        <div class="ly-row ly-prev" id="lyPrev"></div>
        <div class="ly-row ly-cur" id="lyCur"></div>
        <div class="ly-row ly-next" id="lyNext"></div>
      </div>
      <footer class="lyw-foot"><i class="lyw-prog" id="lywProg"><b></b><img src="assets/angel-star.svg" alt=""></i><span id="lywTime">0:00</span></footer>`);
    win.setAttribute('aria-label', 'Letra da música');
    document.body.appendChild(win);

    tab = mk('button', 'lyw-tab', '<span aria-hidden="true">♪</span> lyrics');
    tab.type = 'button'; tab.setAttribute('aria-label', 'Abrir letras da música');
    document.body.appendChild(tab);
  }
  const mini = mk('div', 'ly-mini'); mini.id = 'lyMini'; mini.setAttribute('aria-hidden', 'true');
  const note = $('#music .music-note'); if (note) note.before(mini);

  const rowPrev = win && $('#lyPrev'), rowCur = win && $('#lyCur'), rowNext = win && $('#lyNext');
  const prog = win && $('#lywProg'), timeEl = win && $('#lywTime');

  /* ---------- troféus novos (ficam no script.js) ---------- */
  const unlockSafe = id => { try { if (typeof unlock === 'function') unlock(id); } catch (e) {} };

  /* ---------- estado ---------- */
  let started = false, raf = 0, idx = -2, lit = -1, firstShow = true, sang = false;
  const isOn = () => pref.open;

  function setWords(row, text) {
    row.textContent = '';
    const words = text ? text.split(/\s+/) : [];
    words.forEach(w => { const s = mk('span', 'w'); s.textContent = w; row.appendChild(s); });
    return words.length;
  }
  function retrigger(el, cls) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

  function setGhost(text) {
    if (!ghost) return;
    ghost.querySelectorAll('b:not(.out)').forEach(o => { o.classList.add('out'); setTimeout(() => o.remove(), 950); });
    if (!text) return;
    const b = mk('b'); b.textContent = text; ghost.appendChild(b);
  }
  function setMini(text) {
    mini.textContent = '';
    text.split(/\s+/).filter(Boolean).forEach((w, i) => { const s = mk('span'); s.textContent = w; s.style.setProperty('--i', i); mini.appendChild(s); });
  }

  function lineChanged(i) {
    idx = i; lit = -1;
    const cur = i >= 0 ? L[i].text : '';
    if (win) {
      const prev = i > 0 ? L[i - 1].text : '', next = i + 1 < L.length ? L[i + 1].text : '';
      rowPrev.textContent = prev; rowNext.textContent = next;
      rowPrev.dataset.go = i > 0 ? i - 1 : ''; rowNext.dataset.go = i + 1 < L.length ? i + 1 : '';
      if (prev) retrigger(rowPrev, 'fresh');
      if (next) retrigger(rowNext, 'fresh');
      setWords(rowCur, cur); retrigger(rowCur, 'fresh');
    }
    setGhost(cur); setMini(cur);
    if (i >= 1 && !sang && win && win.classList.contains('show')) { sang = true; unlockSafe('sing'); }
  }

  /* ---------- batida (analisador de áudio ou pulso falso) ---------- */
  let actx = null, an = null, bins = null, slow = 0, beat = 0, hasSignal = 0;
  function wireAudio() { // precisa rodar dentro de um clique/tecla (política de autoplay) e só funciona em http(s)
    if (actx || location.protocol === 'file:') return;
    try {
      if (new URL(bgm.src, location.href).origin !== location.origin) return; // áudio de outro site ficaria mudo no analisador
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      const ctx = new AC();
      const src = ctx.createMediaElementSource(bgm), a = ctx.createAnalyser();
      a.fftSize = 256; a.smoothingTimeConstant = .6;
      src.connect(a); a.connect(ctx.destination);
      ctx.resume && ctx.resume();
      actx = ctx; an = a; bins = new Uint8Array(a.frequencyBinCount);
    } catch (e) { actx = null; an = null; }
  }
  ['pointerdown', 'keydown'].forEach(ev => addEventListener(ev, function once() {
    wireAudio(); if (actx) removeEventListener(ev, once, true);
  }, true));
  ['play', 'playing'].forEach(ev => bgm.addEventListener(ev, () => { if (actx && actx.state === 'suspended') actx.resume(); }));

  function readBeat(t, playing) {
    if (!playing) { beat *= .9; return beat; }
    if (an) {
      an.getByteFrequencyData(bins);
      let s = 0; for (let i = 1; i <= 6; i++) s += bins[i];
      const bass = s / 6 / 255;
      hasSignal = bass > .01 ? 30 : Math.max(0, hasSignal - 1); // sem sinal por um tempo → usa o pulso falso
      slow = slow * .96 + bass * .04;
      const kick = Math.min(1, Math.max(0, bass - slow * 1.02) * 4.2);
      if (hasSignal) { beat = Math.max(kick, beat * .87); return beat; }
    }
    const ph = (t * BPM / 60) % 1; // pulso suave no tempo da música
    beat = Math.pow(Math.max(0, Math.cos(ph * Math.PI * 2)), 5) * .7;
    return beat;
  }
  let lastB = -1;
  function paintBeat(b) {
    const v = Math.round(b * 100) / 100; if (v === lastB) return; lastB = v;
    if (halo) halo.style.setProperty('--beat', v);
    if (ghost) ghost.style.setProperty('--beat', v);
    if (win) win.style.setProperty('--beat', v);
  }

  /* ---------- loop principal ---------- */
  function frame() {
    raf = requestAnimationFrame(frame);
    const t = bgm.currentTime, playing = !bgm.paused && !bgm.ended && !bgm.error;
    paintBeat(readBeat(t, playing));

    let i = idx;
    if (i < -1 || (i >= 0 && t < L[i].t) || (i + 1 < L.length && t >= L[i + 1].t) || (i === -1 && L[0].t <= t)) {
      i = -1; for (let k = 0; k < L.length; k++) { if (L[k].t <= t) i = k; else break; }
    }
    if (i !== idx) lineChanged(i);

    if (win) {
      win.classList.toggle('paused', !playing);
      ghost.classList.toggle('paused', !playing);
      if (win.classList.contains('show') && !win.classList.contains('min')) {
        // karaokê: acende as palavras ao longo da linha
        if (idx >= 0) {
          const ws = rowCur.children, n = ws.length;
          if (n) {
            const next = idx + 1 < L.length ? L[idx + 1].t : L[idx].t + 6;
            const dur = Math.max(1.2, Math.min(next - L[idx].t, 8)) * .8;
            const want = Math.min(n, Math.floor(((t - L[idx].t) / dur) * n) + 1);
            if (want !== lit) {
              const from = Math.max(lit, 0);
              for (let k = 0; k < n; k++) {
                const on = k < want; ws[k].classList.toggle('on', on);
                if (on && k >= from && !REDUCE) retrigger(ws[k], 'pop');
              }
              lit = want;
            }
          }
        }
        const d = isFinite(bgm.duration) && bgm.duration > 0 ? bgm.duration : 161;
        prog.style.setProperty('--p', Math.min(1, t / d).toFixed(4));
        timeEl.textContent = mmss(t) + ' / ' + mmss(d);
      }
    }
  }

  function start() {
    if (started) return; started = true;
    updateVisibility();
    if (!raf) frame();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (!raf) frame();
    });
  }
  bgm.addEventListener('play', start);
  if (!bgm.paused) start();

  /* ---------- janela: abrir, fechar, minimizar, arrastar ---------- */
  function updateVisibility() {
    if (!win) return;
    const show = started && isOn();
    if (show && firstShow) { win.classList.add('first'); setTimeout(() => win.classList.remove('first'), 1700); firstShow = false; }
    win.classList.toggle('show', show);
    tab.classList.toggle('show', started && !isOn());
    if (ghost) ghost.classList.toggle('on', started && isOn());
    win.classList.toggle('min', !!pref.min);
    if (show) lineChanged(idx < -1 ? -1 : idx); // reconstrói as linhas ao reabrir
  }
  function placeSaved() {
    if (!win || pref.x == null || pref.y == null) return;
    win.classList.add('moved');
    win.style.left = Math.min(Math.max(0, pref.x), innerWidth - 120) + 'px';
    win.style.top = Math.min(Math.max(0, pref.y), innerHeight - 60) + 'px';
  }
  if (win) {
    placeSaved();
    $('#lywX').addEventListener('click', () => { pref.open = false; save(); updateVisibility(); });
    tab.addEventListener('click', () => { pref.open = true; save(); updateVisibility(); });
    $('#lywMin').addEventListener('click', () => { pref.min = !pref.min; save(); win.classList.toggle('min', pref.min); });
    [rowPrev, rowNext].forEach(r => r.addEventListener('click', () => {
      const g = r.dataset.go; if (g === '' || g == null) return;
      bgm.currentTime = L[+g].t + .01;
    }));

    // arrastar pela barra de título
    const bar = $('#lywBar'); let drag = null;
    bar.addEventListener('pointerdown', e => {
      if (e.target.closest('button')) return;
      const r = win.getBoundingClientRect();
      drag = {dx: e.clientX - r.left, dy: e.clientY - r.top};
      win.classList.add('dragging', 'moved'); win.style.left = r.left + 'px'; win.style.top = r.top + 'px';
      bar.setPointerCapture(e.pointerId); e.preventDefault();
    });
    bar.addEventListener('pointermove', e => {
      if (!drag) return;
      const r = win.getBoundingClientRect();
      const x = Math.min(Math.max(0, e.clientX - drag.dx), innerWidth - r.width), y = Math.min(Math.max(0, e.clientY - drag.dy), innerHeight - 40);
      win.style.left = x + 'px'; win.style.top = y + 'px';
    });
    const endDrag = () => {
      if (!drag) return; drag = null; win.classList.remove('dragging');
      pref.x = parseFloat(win.style.left); pref.y = parseFloat(win.style.top); save();
    };
    bar.addEventListener('pointerup', endDrag); bar.addEventListener('pointercancel', endDrag);
    bar.addEventListener('dblclick', e => { if (!e.target.closest('button')) $('#lywMin').click(); });

    // brilho cromado seguindo o mouse
    win.addEventListener('pointermove', e => {
      const r = win.getBoundingClientRect();
      win.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(0) + '%');
      win.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(0) + '%');
    });
    addEventListener('resize', () => { if (pref.x != null) placeSaved(); });

    // tecla L liga/desliga as letras
    addEventListener('keydown', e => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      if ((e.key === 'l' || e.key === 'L') && !e.target.matches?.('input[type=text],textarea')) {
        pref.open = !pref.open; save(); updateVisibility();
        const li = document.querySelector('#guide li[data-lk~="lyrics"]');
        if (li) { li.classList.add('hot'); setTimeout(() => li.classList.remove('hot'), 450); }
      }
    });
  }

  /* ---------- estrelas cadentes ---------- */
  const homeEl = $('#home');
  const homeOpen = () => homeEl && !homeEl.classList.contains('hidden');
  const WISHES = ['wish received ✧', 'make it count ✦', 'granted, probably ✧', 'stay online ✦', 'angel heard you ✧'];
  function burst(x, y) {
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * 6.283 + rand(-.2, .2), d = rand(60, 150);
      const s = mk('i', 'wish-spk', ['✦', '✧', '·', '✦'][i % 4]);
      s.style.cssText = `left:${x}px;top:${y}px;--dx:${Math.cos(a) * d | 0}px;--dy:${Math.sin(a) * d | 0}px;--r:${rand(-120, 120) | 0}deg;animation-delay:${(Math.random() * .08).toFixed(2)}s`;
      document.body.appendChild(s); setTimeout(() => s.remove(), 1200);
    }
    const m = mk('div', 'wish-msg'); m.textContent = WISHES[Math.random() * WISHES.length | 0];
    m.style.left = Math.min(Math.max(110, x), innerWidth - 110) + 'px'; m.style.top = Math.max(40, y - 48) + 'px';
    document.body.appendChild(m); setTimeout(() => m.remove(), 2300);
  }
  function spawnStar() {
    if (REDUCE || document.hidden || !homeOpen()) return;
    if (document.querySelector('.wish')) return;
    const W = innerWidth, H = innerHeight;
    const fromRight = Math.random() < .7;
    const ang = fromRight ? rand(148, 162) : rand(18, 32);             // rumo: baixo-esquerda ou baixo-direita
    const x0 = fromRight ? rand(W * .55, W * .95) : rand(W * .05, W * .45), y0 = rand(H * .04, H * .3);
    const len = Math.min(W * .62, 760), dur = rand(2.6, 3.4);
    const b = mk('button', 'wish', '<i class="wish-tail"></i><i class="wish-head">✦</i>');
    b.type = 'button'; b.setAttribute('aria-label', 'Estrela cadente: clique para fazer um pedido');
    b.style.cssText = `--x0:${x0 | 0}px;--y0:${y0 | 0}px;--ang:${ang | 0}deg;--len:${len | 0}px;--dur:${dur.toFixed(2)}s`;
    const catchIt = () => {
      if (b.classList.contains('caught')) return;
      const r = b.querySelector('.wish-head').getBoundingClientRect();
      b.classList.add('caught'); burst(r.left + r.width / 2, r.top + r.height / 2);
      try { if (typeof chime === 'function') chime(true); } catch (e) {}
      unlockSafe('wish'); setTimeout(() => b.remove(), 700);
    };
    b.addEventListener('click', catchIt);
    b.addEventListener('animationend', () => { if (!b.classList.contains('caught')) b.remove(); });
    document.body.appendChild(b);
  }
  addEventListener('keydown', e => {
    if ((e.key === 'w' || e.key === 'W') && !e.ctrlKey && !e.metaKey && !e.altKey && !e.target.matches?.('input[type=text],textarea')) document.querySelector('.wish')?.click();
  });
  (function schedule(first) {
    setTimeout(() => { spawnStar(); schedule(false); }, first ? rand(9000, 14000) : rand(24000, 42000));
  })(true);
})();
