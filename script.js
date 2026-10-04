const $ = s => document.querySelector(s);
const boot = $('#boot'), home = $('#home'), rig = $('#rig'), scene = $('#scene');
const items = [...document.querySelectorAll('.menu-item')];
const panels = [...document.querySelectorAll('.panel')];
const bgm = $('#bgm'), musicBtn = $('#musicBtn'), vol = $('#vol'), musicState = $('#musicState');

/* ---------- navegação ---------- */
const inHome = () => !home.classList.contains('hidden');
function enterSite() {
  boot.classList.add('hidden'); home.classList.remove('hidden');
  items[0].focus({preventScroll: true});
  playMusic();
}
function backToBoot() { home.classList.add('hidden'); boot.classList.remove('hidden'); }
const activeMenu = () => document.querySelector('.menu-item.active');
let lastFocus = null;
home.addEventListener('focusin', e => { lastFocus = e.target; });
function go(step) {
  const next = items[(items.indexOf(activeMenu()) + step + items.length) % items.length];
  next.click(); next.focus({preventScroll: true});
}
function vertical(dir) { // setas ▲▼ andam dentro da aba atual
  const list = [...document.querySelector('.panel.active-panel').querySelectorAll('a[href],button,input')];
  if (!list.length) return home.scrollBy({top: dir * 60, behavior: 'smooth'});
  const i = list.indexOf(document.activeElement);
  if (dir > 0) list[Math.min(list.length - 1, i + 1)].focus();
  else if (i <= 0) activeMenu().focus({preventScroll: true});
  else list[i - 1].focus();
}
$('#startBtn').addEventListener('click', enterSite);
items.forEach(item => item.addEventListener('click', () => {
  items.forEach(x => x.classList.remove('active'));
  panels.forEach(x => x.classList.remove('active-panel'));
  item.classList.add('active');
  document.getElementById(item.dataset.panel).classList.add('active-panel');
}));

function setVol(d) {
  vol.value = Math.max(0, Math.min(100, +vol.value + d));
  vol.dispatchEvent(new Event('input'));
}

/* ---------- brilho nos botões ---------- */
function flash(el) {
  if (!el) return;
  el.classList.remove('glow'); void el.offsetWidth; el.classList.add('glow');
  clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('glow'), 800);
}
const btn = k => document.querySelector(`[data-k="${k}"]`);
const actions = {
  left: () => inHome() && go(-1), up: () => inHome() && vertical(-1),
  right: () => inHome() && go(1), down: () => inHome() && vertical(1),
  x: () => (inHome() ? (home.contains(lastFocus) ? lastFocus : activeMenu()).click() : enterSite()),
  start: () => !inHome() && enterSite(),
  cir: () => inHome() && backToBoot(),
  tri: () => toggleMusic(), note: () => toggleMusic(),
  voldn: () => setVol(-10), volup: () => setVol(10),
  sq: () => resetView(), L: () => inHome() && go(-1), R: () => inHome() && go(1),
  home: () => resetView(), select: () => {}, hold: () => {}, wlan: () => {}
};
document.querySelectorAll('[data-k]').forEach(b => b.addEventListener('mousedown', e => e.preventDefault())); // não rouba o foco da tela
document.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => {
  flash(b); actions[b.dataset.k]?.();
}));
const keymap = {ArrowLeft:'left', ArrowRight:'right', ArrowUp:'up', ArrowDown:'down', Enter:'x', ' ':'x', Escape:'cir', m:'tri', M:'tri', q:'L', Q:'L', e:'R', E:'R'};
document.addEventListener('keydown', e => {
  const k = keymap[e.key]; if (!k) return;
  if (e.target.matches?.('input[type=range]') && (k === 'left' || k === 'right')) return;
  flash(btn(k));
  if (k === 'x' && e.target.closest?.('button,a')) return; // deixa o item focado agir
  if (e.key === ' ' || e.key.startsWith('Arrow')) e.preventDefault();
  actions[k]?.();
});

/* ---------- giro 3D (só quando você arrasta; suavizado e leve) ---------- */
const glare = $('#glare'), mobile = () => matchMedia('(max-width:899px)').matches;
let ry = 0, rx = 0, tY = 0, tX = 0, drag = null, raf = 0;
function render() {
  ry += (tY - ry) * .22; rx += (tX - rx) * .22;
  if (!drag && Math.abs(tY - ry) < .05) ry = tY; if (!drag && Math.abs(tX - rx) < .05) rx = tX;
  rig.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
  const n = ((ry % 360) + 540) % 360 - 180, c = Math.cos(n * Math.PI / 180); // luz fixa no ambiente: o brilho desliza ao girar
  glare.style.transform = `translate(${(-n * .9).toFixed(1)}%,${(rx * 2.2).toFixed(1)}%)`; glare.style.opacity = Math.max(.12, c).toFixed(2);
  raf = (drag || ry !== tY || rx !== tX) ? requestAnimationFrame(render) : 0;
}
const kick = () => { if (!raf) raf = requestAnimationFrame(render); };
function resetView() { tY = Math.round(ry / 360) * 360; tX = 0; kick(); }
scene.addEventListener('pointerdown', e => {
  if (mobile() || e.target.closest('button,a,input')) return;
  drag = {x: e.clientX, y: e.clientY}; scene.classList.add('dragging'); scene.setPointerCapture(e.pointerId);
  $('#dragHint').classList.add('gone'); kick();
});
scene.addEventListener('pointermove', e => {
  if (!drag) return;
  tY += (e.clientX - drag.x) * .45; tX = Math.max(-30, Math.min(30, tX - (e.clientY - drag.y) * .3));
  drag = {x: e.clientX, y: e.clientY}; kick();
});
const stop = () => { drag = null; scene.classList.remove('dragging'); kick(); };
scene.addEventListener('pointerup', stop); scene.addEventListener('pointercancel', stop);
scene.addEventListener('dblclick', e => { if (!e.target.closest('button,a,input')) resetView(); });
render();

/* ---------- música de fundo ----------
   Usa assets/music.mp3 se existir. Se não existir, toca um ambiente suave gerado no navegador. */
// Se você usar assets/music.mp3, edite aqui o nome da sua música:
const TRACK = {title: 'unrequited', artist: 'Midrift', url: 'https://open.spotify.com/track/1v4jO5ca9OVgii1glFjz3h'};
let fileOk = true, playing = false, synth = null;
function showTrack(file) {
  $('#trackArtist').textContent = file ? TRACK.artist.toUpperCase() : 'AMBIENTE';
  $('#trackTitle').textContent = file ? TRACK.title : 'ambient loop';
  $('#trackNote').textContent = file ? 'música de fundo' : 'som gerado no navegador';
  const l = $('#trackLink'); l.classList.toggle('hidden', !file); if (file) l.href = TRACK.url;
}
bgm.addEventListener('loadedmetadata', () => { fileOk = true; showTrack(true); });
bgm.addEventListener('error', () => { fileOk = false; showTrack(false); });
bgm.volume = vol.value / 100;

function makeSynth() {
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
  const ctx = new AC(), master = ctx.createGain(), lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 900; master.gain.value = 0;
  lp.connect(master); master.connect(ctx.destination);
  const lfo = ctx.createOscillator(), lg = ctx.createGain();
  lfo.frequency.value = .08; lg.gain.value = 350; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
  const chords = [[220, 261.6, 329.6, 392], [174.6, 220, 261.6, 329.6], [196, 246.9, 293.7, 392], [164.8, 207.7, 246.9, 311.1]];
  let i = 0, oscs = [];
  function chord() {
    oscs.forEach(o => { o.g.gain.setTargetAtTime(0, ctx.currentTime, 1.5); o.o.stop(ctx.currentTime + 6); });
    oscs = chords[i++ % chords.length].flatMap(f => [-4, 4].map(d => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = f; o.detune.value = d; g.gain.value = 0;
      o.connect(g); g.connect(lp); o.start(); g.gain.setTargetAtTime(.07, ctx.currentTime, 1.5);
      return {o, g};
    }));
  }
  chord(); const timer = setInterval(chord, 7000);
  return {ctx, master, timer};
}
function setState(on) {
  playing = on;
  musicBtn.textContent = on ? '❚❚ PAUSE' : '▶ PLAY';
  musicState.textContent = on ? (fileOk ? 'tocando' : 'tocando (ambiente)') : 'pausado';
}
async function playMusic() {
  if (fileOk) {
    try { await bgm.play(); setState(true); return; }
    catch (err) { if (err.name === 'NotAllowedError') return setState(false); fileOk = false; }
  }
  if (!synth) synth = makeSynth();
  if (!synth) return setState(false);
  await synth.ctx.resume();
  synth.master.gain.setTargetAtTime(vol.value / 100, synth.ctx.currentTime, .3);
  setState(true);
}
function pauseMusic() {
  bgm.pause();
  if (synth) synth.master.gain.setTargetAtTime(0, synth.ctx.currentTime, .2);
  setState(false);
}
function toggleMusic() { playing ? pauseMusic() : playMusic(); }
musicBtn.addEventListener('click', toggleMusic);
vol.addEventListener('input', () => {
  bgm.volume = vol.value / 100;
  if (synth && playing) synth.master.gain.value = vol.value / 100;
});
setState(false);

/* ---------- espessura do PSP: fatias (preto brilhante + filete prateado) e gatilhos ---------- */
(function () {
  const N = 30, D = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--d')) || 100;
  for (let k = 0; k < N; k++) {
    const u = (k / (N - 1)) * 2 - 1, t = Math.abs(u), s = document.createElement('i'), band = Math.abs(u) < .07;
    const L = band ? 58 : 9 + 6 * (1 - t);
    s.className = 'slice';
    s.style.cssText = `inset:${Math.round(9 * Math.pow(t, 5))}px;transform:translateZ(${(u * D / 2 * .98).toFixed(1)}px);` +
      `background:linear-gradient(180deg,hsl(230,5%,${L + 16}%),hsl(230,4%,${L}%) 40%,hsl(230,5%,${Math.max(3, L - 6)}%))`;
    rig.insertBefore(s, rig.querySelector('.face.back'));
  }
  document.querySelectorAll('.trig').forEach(t => { for (let k = 1; k <= 10; k++) {
    const e = document.createElement('i'); e.className = 'tz'; e.style.transform = `translateZ(${-k * 6.5}px)`; t.insertBefore(e, t.firstChild); } });
})();

/* ---------- fundo: pétalas caindo e brilhos suaves (por cima da foto) ---------- */
(function () {
  const cv = $('#sky'), cx = cv.getContext('2d'), still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w, h, d, P = [], S = [];
  const mk = init => ({x: Math.random() * w, y: init ? Math.random() * h : -20 * d, r: (Math.random() * 7 + 5) * d, a: Math.random() * 6.3,
    va: (Math.random() - .5) * .03, vy: (Math.random() * .5 + .35) * d, sw: Math.random() * 6.3, o: Math.random() * .4 + .35});
  function size() {
    d = 1; w = cv.width = innerWidth * d; h = cv.height = innerHeight * d;
    P = Array.from({length: Math.round(w * h / 90000)}, () => mk(true));
    S = Array.from({length: Math.round(w * h / 60000)}, () => ({x: Math.random() * w, y: Math.random() * h, r: (Math.random() * 3 + 1.5) * d, s: Math.random() * 6.3}));
  }
  function frame(t) {
    if (document.hidden) { if (!still) requestAnimationFrame(frame); return; }
    cx.clearRect(0, 0, w, h); cx.fillStyle = '#fff';
    S.forEach(s => { cx.globalAlpha = .1 + .4 * Math.abs(Math.sin(t / 1100 + s.s)); cx.beginPath(); cx.arc(s.x, s.y, s.r * .5, 0, 6.283); cx.fill(); });
    P.forEach((p, i) => {
      p.y += p.vy; p.a += p.va; p.x += Math.sin(t / 1500 + p.sw) * .5 * d;
      if (p.y > h + 20) P[i] = mk(false);
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.a); cx.scale(1, .55 + .45 * Math.abs(Math.sin(t / 900 + p.sw)));
      cx.globalAlpha = p.o; cx.fillStyle = '#f1f1f4'; cx.beginPath(); cx.ellipse(0, 0, p.r, p.r * .55, 0, 0, 6.283); cx.fill(); cx.restore();
    });
    if (!still) requestAnimationFrame(frame);
  }
  addEventListener('resize', () => { size(); if (still) frame(0); });
  size(); requestAnimationFrame(frame);
})();

/* vídeo de fundo: garante o play (autoplay pode ser bloqueado) */
(function () { const v = $('.bgvid'); if (!v) return; v.muted = true; const go = () => v.play().catch(() => {});
  go(); v.addEventListener('canplay', go); addEventListener('pointerdown', go, {once: true}); })();
