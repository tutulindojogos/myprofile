const $ = s => document.querySelector(s);

/* ---------- tela de carregamento ----------
   A barra anda de verdade: cada coisa pesada (fontes, vídeo, modelo 3D, texturas) registra uma tarefa com LD.add()
   e a barra avança conforme elas terminam. Tem um tempo mínimo pra não piscar e um limite máximo pra nunca travar. */
const LD = (() => {
  const el = $('#loader'), fill = $('#ldFill'), star = $('#ldStar'), pct = $('#ldPct'), msg = $('#ldMsg');
  const MIN = 2400, MAX = 6000, t0 = performance.now();
  const MSG = [[0, 'waking up the vita'], [30, 'polishing the chrome'], [60, 'teaching the angel to float'], [88, 'almost there']];
  let total = 0, done = 0, shown = 0, forced = false, over = false, last = '';
  const add = () => { total++; let ok = false; return () => { if (!ok) { ok = true; done++; } }; };
  const force = () => { forced = true; };
  function finish() {
    el.classList.add('out'); document.body.classList.add('ready');
    document.querySelectorAll('.boot-title').forEach(t => t.classList.add('go'));
    setTimeout(() => el.remove(), 1100);
  }
  let prev = t0;
  function frame(now) {
    const dt = Math.min(250, Math.max(0, now - prev)); prev = now; // suavização por tempo, não por frame
    const real = forced || !total ? 1 : done / total;
    const target = Math.min(real, (now - t0) / MIN);
    shown += (target - shown) * (1 - Math.exp(-dt / 140));
    if (target >= 1 && shown > .99) shown = 1;
    const p = Math.round(shown * 100);
    fill.style.width = star.style.left = (shown * 100) + '%';
    pct.textContent = p + '%'; el.setAttribute('aria-valuenow', p);
    const m = MSG.filter(x => p >= x[0]).pop()[1]; if (m !== last) { last = m; msg.textContent = m; }
    if (shown >= 1) { if (!over) { over = true; setTimeout(finish, 500); } return; }
    requestAnimationFrame(frame);
  }
  setTimeout(force, MAX);
  requestAnimationFrame(frame);
  return {add, force};
})();
if (document.fonts && document.fonts.ready) { const d = LD.add(); document.fonts.ready.then(d, d); }
// celular (tela estreita): versão adaptada, sem 3D, com botões de toque
const MQ = matchMedia('(max-width: 760px)'), MOBILE = MQ.matches;
document.body.classList.toggle('mobile', MOBILE);
(MQ.addEventListener ? MQ.addEventListener.bind(MQ, 'change') : MQ.addListener.bind(MQ))(() => location.reload());
const boot = $('#boot'), home = $('#home'), vs = $('#vscreen'), gl = $('#gl');
const items = [...document.querySelectorAll('.menu-item')];
const panels = [...document.querySelectorAll('.panel')];
const bgm = $('#bgm'), musicBtn = $('#musicBtn'), vol = $('#vol'), musicState = $('#musicState');

/* ---------- navegação ---------- */
let busy = false, closeClip = () => {}, lbIsOpen = () => false;
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const homeShown = () => !home.classList.contains('hidden');
const inHome = () => !busy && homeShown();
const activeMenu = () => document.querySelector('.menu-item.active');
let lastFocus = null;
home.addEventListener('focusin', e => { lastFocus = e.target; });
const bgv = $('#bgv');
if (bgv) { const d = LD.add(); if (bgv.readyState >= 2) d(); else { ['loadeddata', 'error', 'abort'].forEach(ev => bgv.addEventListener(ev, d, {once: true})); setTimeout(d, 3500); } }
if (bgv && matchMedia('(prefers-reduced-motion: reduce)').matches) bgv.pause();
// PRESS START: a tela de bloqueio sobe e some, a home abre de dentro pra fora
function enterSite() {
  if (busy || homeShown()) return;
  bgv && !calm() && bgv.play().catch(() => {});
  busy = true; vs.classList.add('t-unlock');
  home.classList.remove('hidden'); home.classList.add('entering'); boot.classList.add('leaving');
  items[0].focus({preventScroll: true}); playMusic(); unlock('boot');
  setTimeout(() => { boot.classList.add('hidden'); boot.classList.remove('leaving'); home.classList.remove('entering'); vs.classList.remove('t-unlock'); busy = false; }, calm() ? 0 : 900);
}
// botão PS: a home encolhe e some, um anel de vidro pulsa e a tela de bloqueio entra
function backToBoot() {
  if (busy || !homeShown()) return;
  busy = true; closeClip(true);
  const bt = boot.querySelector('.boot-title'), pp = $('#psPulse');
  if (bt) { bt.classList.remove('go'); void bt.offsetWidth; bt.classList.add('go'); }
  pp.classList.remove('on'); void pp.offsetWidth; pp.classList.add('on');
  vs.classList.add('t-lock'); boot.classList.remove('hidden'); boot.classList.add('entering'); home.classList.add('leaving');
  setTimeout(() => { home.classList.add('hidden'); home.classList.remove('leaving'); boot.classList.remove('entering'); vs.classList.remove('t-lock'); busy = false; }, calm() ? 0 : 1000);
}
function go(step) {
  const next = items[(items.indexOf(activeMenu()) + step + items.length) % items.length];
  next.click(); next.focus({preventScroll: true});
}
function vertical(dir) { // ▲▼ andam dentro da aba atual
  const list = [...document.querySelector('.panel.active-panel').querySelectorAll('a[href],button,input')];
  if (!list.length) return home.scrollBy({top: dir * 60, behavior: 'smooth'});
  const cur = home.contains(document.activeElement) ? document.activeElement : lastFocus, i = list.indexOf(cur);
  if (dir > 0) list[Math.min(list.length - 1, i + 1)].focus();
  else if (i <= 0) activeMenu().focus({preventScroll: true});
  else list[i - 1].focus();
}
function setVol(d) { vol.value = Math.max(0, Math.min(100, +vol.value + d)); vol.dispatchEvent(new Event('input')); }
$('#startBtn').addEventListener('click', enterSite);
items.forEach(item => item.addEventListener('click', () => {
  items.forEach(x => x.classList.remove('active')); panels.forEach(x => x.classList.remove('active-panel'));
  item.classList.add('active'); document.getElementById(item.dataset.panel).classList.add('active-panel');
}));
let glowKey = () => {}, resetView = () => {}; // viram reais quando o 3D carrega
const vstatus = $('#vstatus');
function fitFlat() { document.documentElement.style.setProperty('--fs', Math.min(1, (innerWidth - 24) / 720, (innerHeight - 24) / 405)); }
addEventListener('resize', () => document.body.classList.contains('flat') && fitFlat());
function fail(err) { // se o 3D não funcionar, o site continua utilizável (tela plana) e mostra o motivo
  console.error(err); LD.force(); document.body.classList.add('flat'); fitFlat();
  vstatus.textContent = '3D indisponível: ' + ((err && err.message) || err); vstatus.hidden = false;
}
function legendFlash(k) { // acende a linha do guia de botões
  document.querySelectorAll('#guide li[data-lk]').forEach(li => { // (a linha da dica secreta não tem data-lk: antes isso dava erro aqui e a ação do botão nunca rodava)
    if (li.dataset.lk.split(' ').includes(k)) { li.classList.add('hot'); clearTimeout(li._t); li._t = setTimeout(() => li.classList.remove('hot'), 450); }
  });
}
const actions = {
  left: () => inHome() && go(-1), right: () => inHome() && go(1),
  up: () => inHome() && vertical(-1), down: () => inHome() && vertical(1),
  l: () => inHome() && go(-1), r: () => inHome() && go(1),
  x: () => (inHome() ? (home.contains(lastFocus) ? lastFocus : activeMenu()).click() : enterSite()),
  cir: () => inHome() && backToBoot(), tri: () => toggleMusic(), sq: () => resetView(),
  start: () => { if (!inHome()) return enterSite(); items[0].click(); items[0].focus({preventScroll: true}); },
  select: () => $('#guide').classList.toggle('off'), ps: () => inHome() && backToBoot()
};
/* Tudo que aperta um botão (teclado, clique no Vita 3D, botões de toque) passa por aqui,
   então o código secreto enxerga todas as entradas. Os dois últimos passos (○ e ×) são
   "engolidos" pra não voltarem pra tela de bloqueio nem apertarem nada sem querer. */
const SEQ = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'cir', 'x']; let ki = 0;
function konamiFeed(k) {
  ki = k === SEQ[ki] ? ki + 1 : (k === SEQ[0] ? 1 : 0);
  if (ki === SEQ.length) { ki = 0; unlock('konami'); konamiFx(); return true; }
  return ki === SEQ.length - 1 && k === 'cir';
}
function konamiFx() {
  if (calm()) return;
  const f = document.createElement('div'); f.className = 'kfx';
  f.innerHTML = Array.from({length: 28}, (_, i) => { const a = i / 28 * 6.283 + Math.random() * .3, d = 150 + Math.random() * 280;
    return `<i style=\"--dx:${Math.cos(a) * d | 0}px;--dy:${Math.sin(a) * d | 0}px;--s:${(.7 + Math.random() * 1.3).toFixed(2)};--r:${Math.random() * 360 | 0}deg;animation-delay:${(Math.random() * .15).toFixed(2)}s\">${['✦', '✧', '✦', '·'][i % 4]}</i>`; }).join('') + '<b>old school ✦</b>';
  document.body.appendChild(f); setTimeout(() => f.remove(), 2400);
}
function press(k) { legendFlash(k); if (konamiFeed(k)) return; actions[k]?.(); }
const keymap = {ArrowLeft:'left', ArrowRight:'right', ArrowUp:'up', ArrowDown:'down', Enter:'x', ' ':'x', Escape:'cir', m:'tri', M:'tri', h:'select', H:'select'};
const secretKeys = {b: 'cir', B: 'cir', a: 'x', A: 'x'}; // no teclado: ↑↑↓↓←→←→ B A
document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === '+' || e.key === '=') return setVol(5);
  if (e.key === '-') return setVol(-5);
  const k = keymap[e.key];
  if (!k) { if (secretKeys[e.key] && !e.repeat && !e.target.matches?.('input[type=text],textarea')) konamiFeed(secretKeys[e.key]); return; }
  const swallowed = !e.repeat && konamiFeed(k);
  glowKey(k); legendFlash(k);
  if (swallowed) { e.preventDefault(); return; }
  if (e.target.matches?.('input[type=range]') && (k === 'left' || k === 'right')) return;
  if (k === 'x' && !lbIsOpen() && e.target.closest?.('button,a')) return;
  if (e.key === ' ' || e.key.startsWith('Arrow') || (k === 'x' && lbIsOpen())) e.preventDefault();
  actions[k]?.();
});

/* ---------- música de fundo ----------
   Usa assets/music.mp3 se existir. Se não existir, toca um ambiente suave gerado no navegador. */
// Se você usar assets/music.mp3, edite aqui o nome da sua música:
const TRACK = {title: "Why'd You Only Call Me When You're High?", artist: 'Arctic Monkeys', url: 'https://open.spotify.com/search/Arctic%20Monkeys%20Why%27d%20You%20Only%20Call%20Me%20When%20You%27re%20High'};
let fileOk = true, playing = false, synth = null;
function showTrack(file) {
  $('#trackArtist').textContent = file ? TRACK.artist.toUpperCase() : 'AMBIENTE';
  $('#hudTrack').textContent = file ? TRACK.artist + ' — ' + TRACK.title : 'ambient loop';
  const tt = $('#trackTitle'); tt.textContent = file ? TRACK.title : 'ambient loop'; tt.dataset.text = tt.textContent;
  $('#trackNote').textContent = file ? 'música de fundo' : 'som gerado no navegador';
  const l = $('#trackLink'); l.classList.toggle('hidden', !file); if (file) l.href = TRACK.url;
}
bgm.addEventListener('loadedmetadata', () => { fileOk = true; showTrack(true); });
bgm.addEventListener('error', () => { fileOk = false; showTrack(false); });
// o navegador pode ter carregado o arquivo antes deste código rodar: confere o estado atual também
if (bgm.error) { fileOk = false; showTrack(false); } else if (bgm.readyState >= 1) showTrack(true);
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
  musicBtn.textContent = on ? '❚❚' : '▶'; document.body.classList.toggle('playing', on);
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
const volPct = $('#volPct'), volTip = $('#volTip'), volIcon = $('#volIcon'); let lastVol = 60;
const paintVol = () => {
  const v = +vol.value;
  vol.style.setProperty('--v', v + '%'); vol.parentNode.style.setProperty('--p', v / 100); // --p alimenta a conta que alinha a estrela com a ponta da barra (a dica flutuante usa a mesma)
  volPct.textContent = volTip.textContent = v; volIcon.dataset.lv = v === 0 ? 0 : v < 45 ? 1 : 2;
  vol.parentNode.classList.toggle('max', v === 100); // em 100% a barra preenche até o fim (a estrela fica por cima da ponta)
  vol.setAttribute('aria-valuetext', v + '%');
};
vol.addEventListener('input', paintVol); paintVol();
volIcon.addEventListener('click', () => { if (+vol.value > 0) { lastVol = +vol.value; vol.value = 0; } else vol.value = lastVol || 60; vol.dispatchEvent(new Event('input')); });

/* ---------- efeitos nos nomes: texto espelhado (brilho/glitch) e estrelinhas ---------- */
document.querySelectorAll('.fx').forEach(el => {
  el.dataset.text = el.textContent;
  if (el.classList.contains('boot-title')) el.innerHTML = [...el.textContent].map((c, i) => `<span style="--i:${i}">${c}</span>`).join('');
  if (el.id === 'trackTitle') return; // o título da música é trocado por script; fica só com brilho
  el.insertAdjacentHTML('beforeend', '<i class="tw a">✦</i><i class="tw b">✧</i>');
});

/* ---------- fundo: pétalas caindo e brilhos suaves (por cima da foto) ---------- */
(function () {
  const cv = $('#sky'), cx = cv.getContext('2d'), still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w, h, d, P = [], S = [];
  const mk = init => ({x: Math.random() * w, y: init ? Math.random() * h : -20 * d, r: (Math.random() * 7 + 5) * d, a: Math.random() * 6.3,
    va: (Math.random() - .5) * .03, vy: (Math.random() * .5 + .35) * d, sw: Math.random() * 6.3, o: Math.random() * .4 + .35});
  function size() {
    d = Math.min(devicePixelRatio || 1, 1.5); w = cv.width = innerWidth * d; h = cv.height = innerHeight * d;
    P = Array.from({length: Math.round(w * h / 90000)}, () => mk(true));
    S = Array.from({length: Math.round(w * h / 60000)}, () => ({x: Math.random() * w, y: Math.random() * h, r: (Math.random() * 3 + 1.5) * d, s: Math.random() * 6.3}));
  }
  function frame(t) {
    if (document.body.classList.contains('moving')) return requestAnimationFrame(frame); // pausa enquanto gira
    cx.clearRect(0, 0, w, h); cx.fillStyle = '#fff';
    S.forEach(s => { const r = s.r * 2.2; cx.globalAlpha = .15 + .6 * Math.abs(Math.sin(t / 1100 + s.s)); cx.beginPath(); cx.moveTo(s.x, s.y - r); cx.quadraticCurveTo(s.x, s.y, s.x + r, s.y); cx.quadraticCurveTo(s.x, s.y, s.x, s.y + r); cx.quadraticCurveTo(s.x, s.y, s.x - r, s.y); cx.quadraticCurveTo(s.x, s.y, s.x, s.y - r); cx.fill(); });
    P.forEach((p, i) => {
      p.y += p.vy; p.a += p.va; p.x += Math.sin(t / 1500 + p.sw) * .5 * d;
      if (p.y > h + 20) P[i] = mk(false);
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.a); cx.scale(1, .55 + .45 * Math.abs(Math.sin(t / 900 + p.sw)));
      cx.globalAlpha = p.o; cx.fillStyle = ['#ffffff', '#f4f7ff', '#ebebeb', '#fafafa'][i % 4]; cx.beginPath(); cx.ellipse(0, 0, p.r, p.r * .55, 0, 0, 6.283); cx.fill(); cx.restore();
    });
    if (!still) requestAnimationFrame(frame);
  }
  addEventListener('resize', () => { size(); if (still) frame(0); });
  size(); requestAnimationFrame(frame);
})();


if (!MOBILE) try {
/* ---------- Vita 3D (three.js) ---------- */
const T = THREE;
const renderer = new T.WebGLRenderer({canvas: gl, antialias: devicePixelRatio < 1.5, alpha: true, powerPreference: 'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
const scene = new T.Scene(), cam = new T.PerspectiveCamera(28, 1, .01, 10);
const pivot = new T.Group(); pivot.rotation.order = 'YXZ'; scene.add(pivot);
let obj = null, dirty = true, ry = 0, rx = 0;

// iluminação: ambiente com softboxes (reflexos reais) + luz principal + luz de contorno
(function () {
  const s = new T.Scene();
  s.add(new T.Mesh(new T.SphereGeometry(5, 32, 16), new T.MeshBasicMaterial({color: 0x17181d, side: T.BackSide})));
  const box = (c, i, x, y, z, w, h) => {
    const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({color: new T.Color(c).multiplyScalar(i), side: T.DoubleSide}));
    m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m);
  };
  box(0xfff1e4, 7, -3, 3, 3, 3, 2); box(0xcfe0ff, 3, 3.5, 1, 2, 2, 3); box(0xffffff, 4, 0, 4, -2, 5, 1.5); box(0xe8f0ff, 2, 0, -3, 3, 4, 1);
  const pm = new T.PMREMGenerator(renderer); scene.environment = pm.fromScene(s, .02).texture; pm.dispose();
})();
const key = new T.DirectionalLight(0xfff0e0, 1.5); key.position.set(-.3, .4, .5); scene.add(key);
const rim = new T.DirectionalLight(0xbcd4ff, 1.2); rim.position.set(.5, .2, -.5); scene.add(rim);
scene.add(new T.AmbientLight(0xffffff, .12));
// holofote: luz de cima que ilumina o Vita (o feixe visível é o .spot no CSS)
const spotL = new T.SpotLight(0xfff3e6, 2.4, 0, .5, .75, 1); spotL.position.set(0, .5, .3); spotL.target.position.set(0, 0, 0); scene.add(spotL, spotL.target);

const tl = new T.TextureLoader();
const tx = (f, srgb) => { const d = LD.add(); const t = tl.load('assets/vita/' + f, () => { dirty = true; d(); }, undefined, d); t.anisotropy = 8; if (srgb) t.encoding = T.sRGBEncoding; return t; };
const std = (p, extra) => new T.MeshStandardMaterial(Object.assign({map: tx(p + '_color.jpg', 1), normalMap: tx(p + '_normal.jpg'), roughnessMap: tx(p + '_rough.jpg'), metalnessMap: tx(p + '_metal.jpg'), roughness: 1, metalness: 1}, extra || {}));
const MATS = {
  'PS-Vita_Body': std('body'),
  'Bumpers_and_Buttons': std('btn', {emissiveMap: tx('btn_emis.jpg', 1), emissive: 0xffffff, emissiveIntensity: .6}),
  'Screen': new T.MeshPhysicalMaterial({color: 0x040405, roughness: .1, metalness: 0, clearcoat: 1, clearcoatRoughness: .05}),
  'See_Through_Buttons': new T.MeshPhysicalMaterial({color: 0x1a1b20, roughness: .15, transparent: true, opacity: .5})
};
function parseOBJ(txt) {
  const V = [], N = [], U = [], groups = new Map(); let g = 'g', m = '';
  for (const line of txt.split('\n')) {
    const p = line.trim().split(/\s+/), c = p[0];
    if (c === 'v') V.push(+p[1], +p[2], +p[3]);
    else if (c === 'vn') N.push(+p[1], +p[2], +p[3]);
    else if (c === 'vt') U.push(+p[1], +p[2]);
    else if (c === 'o' || c === 'g') g = p.slice(1).join(' ');
    else if (c === 'usemtl') m = p[1];
    else if (c === 'f') {
      const key = g + '|' + m; let G = groups.get(key);
      if (!G) groups.set(key, G = {name: g, mat: m, pos: [], nor: [], uv: []});
      const ids = p.slice(1).map(t => t.split('/').map(x => x ? parseInt(x) : 0));
      for (let i = 1; i < ids.length - 1; i++) for (const f of [ids[0], ids[i], ids[i + 1]]) {
        const vi = (f[0] < 0 ? V.length / 3 + f[0] : f[0] - 1) * 3; G.pos.push(V[vi], V[vi + 1], V[vi + 2]);
        if (f[1]) { const ti = (f[1] < 0 ? U.length / 2 + f[1] : f[1] - 1) * 2; G.uv.push(U[ti], U[ti + 1]); } else G.uv.push(0, 0);
        if (f[2]) { const ni = (f[2] < 0 ? N.length / 3 + f[2] : f[2] - 1) * 3; G.nor.push(N[ni], N[ni + 1], N[ni + 2]); }
      }
    }
  }
  const out = new T.Group();
  groups.forEach(G => {
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(G.pos, 3));
    geo.setAttribute('uv', new T.Float32BufferAttribute(G.uv, 2));
    if (G.nor.length === G.pos.length) geo.setAttribute('normal', new T.Float32BufferAttribute(G.nor, 3)); else geo.computeVertexNormals();
    const mesh = new T.Mesh(geo, MATS[G.mat] || new T.MeshStandardMaterial()); mesh.name = G.name; out.add(mesh);
  });
  return out;
}
let maxX = 0;
const dObj = LD.add();
fetch('assets/vita/vita.obj').then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); }).then(txt => {
  const o = parseOBJ(txt);
  const bb = new T.Box3().setFromObject(o), c = bb.getCenter(new T.Vector3()); maxX = bb.max.x;
  o.position.copy(c).negate();
  const model = new T.Group(); model.add(o); model.rotation.y = -Math.PI / 2; // frente do Vita virada para a câmera
  pivot.add(model); obj = o; dirty = true; dObj();
}).catch(e => fail(new Error('não consegui carregar assets/vita/vita.obj (' + e.message + '). Suba a pasta assets inteira; abrindo o arquivo direto do computador o navegador bloqueia — use o GitHub Pages.')));

function fit() {
  const w = innerWidth, h = innerHeight, a = w / h;
  renderer.setSize(w, h, false); cam.aspect = a;
  const vis = Math.max(.1824 / .84, (.095 / .62) * a), d = vis / (2 * Math.tan(cam.fov * Math.PI / 360) * a);
  cam.position.set(0, .004, d); cam.lookAt(0, 0, 0); cam.updateProjectionMatrix(); dirty = true;
}
addEventListener('resize', fit); fit();

/* tela do site colada na tela do Vita (deformação em perspectiva) */
const X0 = -.0056, SC = [[.0315, .0558], [.0315, -.0558], [-.0315, -.0558], [-.0315, .0558]].map(([y, z]) => new T.Vector3(X0, y, z));
function homography(p) {
  const [x0, y0] = p[0], [x1, y1] = p[1], [x2, y2] = p[2], [x3, y3] = p[3];
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1, g = (dx3 * dy2 - dx2 * dy3) / den, h = (dx1 * dy3 - dx3 * dy1) / den;
  const a = x1 - x0 + g * x1, b = x3 - x0 + h * x3, d = y1 - y0 + g * y1, e = y3 - y0 + h * y3, W = 720, H = 405;
  return `matrix3d(${a / W},${d / W},0,${g / W},${b / H},${e / H},0,${h / H},0,0,1,0,${x0},${y0},0,1)`;
}
function overlay() {
  if (!obj) return;
  pivot.updateMatrixWorld(true); cam.updateMatrixWorld();
  const pts = SC.map(c => { const v = c.clone(); obj.localToWorld(v); v.project(cam); return [(v.x * .5 + .5) * innerWidth, (-v.y * .5 + .5) * innerHeight]; });
  const n = new T.Vector3(1, 0, 0).transformDirection(obj.matrixWorld), c0 = new T.Vector3(X0, 0, 0); obj.localToWorld(c0);
  const dot = n.dot(cam.position.clone().sub(c0).normalize());
  vs.style.opacity = dot > .1 ? Math.min(1, (dot - .1) * 4) : 0;
  vs.classList.toggle('on', dot > .3);
  vs.style.transform = homography(pts);
}

/* brilho dos botões (halos aditivos nas posições reais dos botões do modelo) */
const FC = {z: -.0744, y: .0131}, DC = {z: .0741, y: .0133}, K = .0072, D = .0068;
const SPOT = {up: [DC.z, DC.y + D, '#b3b3b3'], down: [DC.z, DC.y - D, '#b3b3b3'], left: [DC.z + D, DC.y, '#b3b3b3'], right: [DC.z - D, DC.y, '#b3b3b3'],
  tri: [FC.z, FC.y + K, '#a5a5a5'], x: [FC.z, FC.y - K, '#797979'], sq: [FC.z + K, FC.y, '#9c9c9c'], cir: [FC.z - K, FC.y, '#818181'],
  l: [.056, .0412, '#ffffff'], r: [-.056, .0412, '#ffffff'],
  start: [-.0753, -.0233, '#ffffff'], select: [-.0669, -.0233, '#ffffff'], ps: [.0709, -.0225, '#dedede']};
const gtex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.35, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new T.CanvasTexture(c); })();
const glows = [];
function glowKeyImpl(k) {
  const s = SPOT[k]; if (!s || !obj) return;
  const m = new T.SpriteMaterial({map: gtex, color: '#ffffff', blending: T.AdditiveBlending, transparent: true, depthWrite: false}), sp = new T.Sprite(m);
  sp.userData.b = /^(start|select|ps)$/.test(k) ? .016 : .024; sp.scale.setScalar(sp.userData.b); sp.position.set(k === 'l' || k === 'r' ? -.0095 : -.0028, s[1], s[0]); sp.userData.t0 = performance.now();
  obj.add(sp); glows.push(sp); dirty = true;
}
function updateGlows() {
  const n = performance.now();
  for (let i = glows.length - 1; i >= 0; i--) {
    const s = glows[i], p = (n - s.userData.t0) / 450;
    if (p >= 1) { obj.remove(s); s.material.dispose(); glows.splice(i, 1); } else { s.material.opacity = 1 - p; s.scale.setScalar(s.userData.b * (1 + .5 * p)); }
  }
}
function pick(part, p) { // qual botão do modelo foi clicado
  if (p.y < -.016 && p.y > -.031) { // START, SELECT e PS ficam no corpo do modelo: achados pela posição
    if (p.z < -.0633 && p.z >= -.0711) return 'select';
    if (p.z < -.0711 && p.z > -.0805) return 'start';
    if (p.z > .0645 && p.z < .0775) return 'ps';
  }
  if (/D-Pad|Cube\.001/.test(part)) { const ux = -(p.z - DC.z), uy = p.y - DC.y; return Math.abs(ux) > Math.abs(uy) ? (ux < 0 ? 'left' : 'right') : (uy > 0 ? 'up' : 'down'); }
  if (/Buttons_(Inner|Outer)/.test(part)) { const ux = -(p.z - FC.z), uy = p.y - FC.y; return Math.abs(ux) > Math.abs(uy) ? (ux < 0 ? 'sq' : 'cir') : (uy > 0 ? 'tri' : 'x'); }
  if (/Bumpers|Top_Buttons|PS_Vita\.00[34]/.test(part)) return p.z > 0 ? 'l' : 'r';
  return null;
}
const ray = new T.Raycaster();
// plano B: se o clique cair numa peça que o pick() não conhece, usa o botão mais perto do ponto clicado
const SPOT_R = {up: .0056, down: .0056, left: .0056, right: .0056, tri: .0056, x: .0056, sq: .0056, cir: .0056, start: .0044, select: .0044, ps: .005};
function nearestKey(p) {
  if (p.x < maxX - .0075) return null; // só a frente do Vita
  let best = null, bd = 1e9;
  for (const k in SPOT_R) { const s = SPOT[k], d = Math.hypot(p.z - s[0], p.y - s[1]); if (d < SPOT_R[k] && d < bd) { bd = d; best = k; } }
  return best;
}
function keyAt(e) { // qual botão do modelo está embaixo do mouse (ou null)
  if (!obj) return null;
  ray.setFromCamera(new T.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), cam);
  const hits = ray.intersectObject(obj, true); if (!hits.length) return null;
  for (const h of hits.slice(0, 4)) { const k = pick(h.object.name, obj.worldToLocal(h.point.clone())); if (k) return k; }
  return nearestKey(obj.worldToLocal(hits[0].point.clone()));
}
function clickModel(e) {
  const k = keyAt(e);
  if (k) { glowKey(k); press(k); gl.classList.add('tap'); setTimeout(() => gl.classList.remove('tap'), 140); }
}
let hoverT = 0;
addEventListener('pointermove', e => {
  if (drag || e.pointerType !== 'mouse' || e.target !== gl) { gl.classList.remove('btn'); return; }
  const n = performance.now(); if (n - hoverT < 70) return; hoverT = n;
  gl.classList.toggle('btn', !!keyAt(e));
}, {passive: true});

/* ---------- girar só quando você arrasta ---------- */
const apply = () => { pivot.rotation.set(rx * Math.PI / 180, ry * Math.PI / 180, 0); dirty = true; };
let drag = null, anim = null, pend = false;
const queue = () => { if (pend) return; pend = true; requestAnimationFrame(() => { pend = false; apply(); }); };
function resetViewImpl() {
  cancelAnimationFrame(anim);
  const sy = ry, sx = rx, t0 = performance.now(), target = Math.round(sy / 360) * 360;
  (function step(t) {
    const p = Math.min(1, (t - t0) / 600), e = 1 - Math.pow(1 - p, 3);
    ry = sy + (target - sy) * e; rx = sx * (1 - e); apply();
    if (p < 1) anim = requestAnimationFrame(step);
  })(t0);
}
document.addEventListener('pointerdown', e => {
  if (!e.target.closest('#gl,#vscreen') || e.target.closest('a,button,input,.menu,.panel,.lightbox')) return;
  // só vira arrasto depois de mexer o mouse de verdade (limiar): um clique parado nunca gira o modelo
  drag = {x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, onGl: e.target === gl, moved: false, touch: e.pointerType === 'touch'};
});
document.addEventListener('pointermove', e => {
  if (!drag) return;
  if (e.pointerType === 'mouse' && e.buttons === 0) return stop(e, true); // soltou fora da janela: não fica "preso" ao mouse
  if (!drag.moved) {
    if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < (drag.touch ? 10 : 6)) return;
    drag.moved = true; drag.x = e.clientX; drag.y = e.clientY; cancelAnimationFrame(anim);
    gl.classList.add('dragging'); document.body.classList.add('moving'); bgv && bgv.pause(); $('#dragHint').classList.add('gone');
    return;
  }
  ry += (e.clientX - drag.x) * .45; rx = Math.max(-35, Math.min(35, rx - (e.clientY - drag.y) * .3));
  drag.x = e.clientX; drag.y = e.clientY; queue();
});
const stop = (e, noClick) => {
  if (drag && !noClick && e.type === 'pointerup' && drag.onGl && !drag.moved) clickModel(e);
  drag = null; gl.classList.remove('dragging'); document.body.classList.remove('moving'); bgv && !matchMedia('(prefers-reduced-motion: reduce)').matches && inHome() && bgv.play().catch(() => {});
};
document.addEventListener('pointerup', stop); document.addEventListener('pointercancel', stop);
document.addEventListener('dblclick', e => { if (!e.target.closest('a,button,input')) resetView(); });

(function tick() {
  if (dirty || glows.length) { updateGlows(); renderer.render(scene, cam); overlay(); dirty = false; }
  requestAnimationFrame(tick);
})();


glowKey = glowKeyImpl; resetView = resetViewImpl;
} catch (err) { fail(err); }

/* ---------- botões de toque (celular) ---------- */
document.querySelectorAll('#pad [data-p]').forEach(b => {
  b.addEventListener('mousedown', e => e.preventDefault()); // não rouba o foco da tela
  b.addEventListener('click', () => {
    const k = b.dataset.p; b.classList.add('hot'); setTimeout(() => b.classList.remove('hot'), 380);
    if (navigator.vibrate) navigator.vibrate(8);
    press(k);
  });
});
if (MOBILE) $('#guide').classList.add('off');

/* ---------- volume fora do Vita: roda do mouse + barras do equalizador ---------- */
$('#volHud').addEventListener('wheel', e => { e.preventDefault(); setVol(e.deltaY < 0 ? 5 : -5); }, {passive: false});
document.querySelector('.eq').innerHTML = Array.from({length: 18}, () => `<i style="--d:-${(Math.random() * 1.2).toFixed(2)}s"></i>`).join('');

/* ---------- rastro de brilhos no mouse + explosão de brilhos e onda de vidro no clique ---------- */
(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cv = $('#trail'), cx = cv.getContext('2d'), G = ['✦', '✧', '·', '˚'], C = ['#fff', '#fff', '#e7e7e7', '#cccccc', '#f5f5f5'];
  let P = [], run = false, lx = 0, ly = 0, d = 1;
  const size = () => { d = Math.min(devicePixelRatio || 1, 1.5); cv.width = innerWidth * d; cv.height = innerHeight * d; };
  size(); addEventListener('resize', size);
  function step() {
    cx.clearRect(0, 0, cv.width, cv.height); P = P.filter(p => p.l > 0);
    P.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .04 * d; p.l -= .035; cx.globalAlpha = Math.max(0, p.l); cx.fillStyle = p.c; cx.shadowColor = '#a6a6a6'; cx.shadowBlur = 8 * d; cx.font = p.s + 'px sans-serif'; cx.fillText(p.g, p.x, p.y); });
    if (P.length) requestAnimationFrame(step); else run = false;
  }
  const add = (x, y, n) => {
    for (let i = 0; i < n; i++) P.push({x: x * d, y: y * d, vx: (Math.random() - .5) * 2.6 * d, vy: (Math.random() * -1.6 - .2) * d, l: 1, s: (Math.random() * 9 + 9) * d, g: G[Math.random() * 4 | 0], c: C[Math.random() * 5 | 0]});
    if (!run) { run = true; requestAnimationFrame(step); }
  };
  addEventListener('pointermove', e => { if (e.pointerType === 'touch' || Math.hypot(e.clientX - lx, e.clientY - ly) < 22) return; lx = e.clientX; ly = e.clientY; add(lx, ly, 1); });
  addEventListener('pointerdown', e => {
    add(e.clientX, e.clientY, 6);
    const r = document.createElement('i'); r.className = 'rip'; r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px';
    document.body.appendChild(r); setTimeout(() => r.remove(), 600);
  });
})();

/* ---------- relógio e bateria na tela do Vita ---------- */
(function () {
  const a = $('#sbTime'), b = $('#lkTime'), c = $('#lkDate'); let last = '';
  function tick() {
    const n = new Date(), t = n.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
    if (t === last) return; last = t; a.textContent = b.textContent = t;
    c.textContent = n.toLocaleDateString('pt-BR', {weekday: 'long', day: 'numeric', month: 'long'});
  }
  tick(); setInterval(tick, 5000);
  navigator.getBattery && navigator.getBattery().then(bt => {
    const u = () => { $('#sbBat').textContent = Math.round(bt.level * 100) + '%'; $('.bat b').style.width = bt.level * 100 + '%'; };
    u(); bt.addEventListener('levelchange', u);
  }).catch(() => {});
})();

/* ---------- v6: Discord copia o usuário, troféus (estilo PS Vita) e digitação no About ---------- */
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Discord: botão normal, então funciona com mouse, toque, teclado e com o × do Vita (igual aos outros cartões)
const copyBtn = $('#copyDiscord'), copyChip = $('#copyChip');
async function copyText(t) {
  try { await navigator.clipboard.writeText(t); return true; } catch (e) {}
  try { // reserva para navegadores/contextos sem a API de área de transferência
    const ta = document.createElement('textarea'); ta.value = t; ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0'; document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy'); ta.remove(); copyBtn.focus({preventScroll: true}); return ok;
  } catch (e) { return false; }
}
copyBtn.addEventListener('click', async () => {
  const ok = await copyText(copyBtn.dataset.copy);
  copyChip.textContent = ok ? 'copied' : 'failed';
  copyBtn.classList.add('copied'); clearTimeout(copyBtn._t);
  copyBtn._t = setTimeout(() => { copyBtn.classList.remove('copied'); copyChip.textContent = 'copy'; }, 1800);
  if (ok) unlock('copy');
});

// troféus: salvos no navegador de quem visita
const TROPHIES = [
  {id: 'boot', name: 'first boot', desc: 'press start'},
  {id: 'social', name: 'say hi', desc: 'open social'},
  {id: 'copy', name: 'copy that', desc: 'copy my discord'},
  {id: 'about', name: 'read the file', desc: 'open about'},
  {id: 'music', name: 'on repeat', desc: 'open music'},
  {id: 'konami', name: 'old school', desc: '↑ ↑ ↓ ↓ ◀ ▶ ◀ ▶ ○ ×', hint: 'a classic cheat code', secret: true},
  {id: 'plat', name: 'angel.exe', desc: 'get them all', plat: true}
];
const TKEY = 'tutu.trophies.v1', trGrid = $('#trGrid'), trCount = $('#trCount');
let got = {};
try { got = JSON.parse(localStorage.getItem(TKEY) || '{}') || {}; } catch (e) {}
const saveTrophies = () => { try { localStorage.setItem(TKEY, JSON.stringify(got)); } catch (e) {} };
function drawTrophies() {
  trGrid.innerHTML = TROPHIES.map(t => {
    const on = !!got[t.id];
    return `<div class="tr ${on ? 'got' : 'locked'}${t.plat ? ' plat' : ''}"><span class="ic">${on ? (t.plat ? '✪' : '✦') : '?'}</span>` +
      `<div><strong>${on || !(t.plat || t.secret) ? t.name : '???'}</strong><small>${on || !t.secret ? t.desc : t.hint}</small></div></div>`;
  }).join('');
  trCount.textContent = Object.keys(got).length + '/' + TROPHIES.length;
}
drawTrophies();
$('#trReset').addEventListener('click', () => { got = {}; saveTrophies(); drawTrophies(); });

let chimeCtx = null;
function chime(big) { // "plim" bem baixinho, só se o som do site já estiver ligado
  const v = .05 * (vol.value / 100); if (!playing || v <= 0) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    chimeCtx = chimeCtx || new AC(); if (chimeCtx.state === 'suspended') chimeCtx.resume();
    (big ? [1318.5, 1975.5, 2637] : [1318.5, 1975.5]).forEach((f, i) => {
      const o = chimeCtx.createOscillator(), g = chimeCtx.createGain(), t = chimeCtx.currentTime + i * .11;
      o.type = 'sine'; o.frequency.value = f; o.connect(g); g.connect(chimeCtx.destination);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + 1.1);
      o.start(t); o.stop(t + 1.2);
    });
  } catch (e) {}
}
const toastQ = []; let toasting = false;
function toast(t) { toastQ.push(t); if (!toasting) { toasting = true; setTimeout(nextToast, 900); } }
function nextToast() {
  const t = toastQ.shift(); if (!t) { toasting = false; return; }
  const el = document.createElement('div'); el.className = 'toast' + (t.plat ? ' plat' : '');
  el.innerHTML = `<span class="ic">${t.plat ? '✪' : '✦'}</span><div><small>${t.plat ? 'platinum trophy' : 'trophy earned'}</small><b>${t.name}</b><em>${t.desc}</em></div>`;
  $('#toasts').appendChild(el); chime(t.plat);
  setTimeout(() => el.classList.add('out'), t.plat ? 4600 : 3400);
  setTimeout(() => { el.remove(); setTimeout(nextToast, 150); }, t.plat ? 5050 : 3850);
}
function unlock(id) {
  if (got[id]) return; const t = TROPHIES.find(x => x.id === id); if (!t) return;
  got[id] = Date.now(); saveTrophies(); drawTrophies(); toast(t);
  if (!got.plat && TROPHIES.filter(x => !x.plat).every(x => got[x.id])) {
    got.plat = Date.now(); saveTrophies(); drawTrophies(); toast(TROPHIES[TROPHIES.length - 1]);
  }
}

// About: as linhas são digitadas quando a aba abre
function typeAbout() {
  if (REDUCED) return;
  const box = $('#about'); box.classList.remove('typing'); void box.offsetWidth;
  let t = .15;
  box.querySelectorAll('.code-line').forEach(l => {
    const n = l.textContent.length - 2, dur = Math.max(.35, n * .032);
    l.style.setProperty('--n', n); l.style.setProperty('--dur', dur + 's'); l.style.setProperty('--dl', t + 's'); t += dur + .12;
  });
  box.classList.add('typing');
}
items.forEach(item => item.addEventListener('click', () => {
  const id = item.dataset.panel;
  if (id === 'social' || id === 'about' || id === 'music') unlock(id);
  if (id === 'about') typeAbout();
}));


/* ---------- v7: Discord ao vivo (Lanyard), parallax, saudação e troféu secreto ---------- */
// Para ligar a atividade do Discord: 1) entre no servidor https://discord.gg/lanyard (é ele que lê seu status)
// 2) copie o seu ID numérico do Discord (Configurações > Avançado > Modo desenvolvedor > botão direito no seu perfil > Copiar ID)
// 3) cole aqui embaixo. Enquanto estiver vazio, o site mostra "online / somewhere" como antes.
const DISCORD_ID = '';

(function presence() {
  const box = $('#presence'), txt = $('#presText'), act = $('#presAct'), tags = $('#tagRow');
  if (!DISCORD_ID || !box) return;
  const LABEL = {online: 'online', idle: 'idle', dnd: 'do not disturb', offline: 'offline'};
  function render(d) {
    const st = LABEL[d.discord_status] ? d.discord_status : 'offline';
    box.dataset.st = st; txt.textContent = LABEL[st] + ' / discord';
    const acts = d.activities || [];
    const game = acts.find(a => a.type === 0), custom = acts.find(a => a.type === 4);
    let kind = '', name = '', ic = '✦';
    if (d.listening_to_spotify && d.spotify) { kind = 'listening to'; name = d.spotify.song + ' — ' + d.spotify.artist; ic = '♪'; }
    else if (game) { kind = 'playing'; name = game.name + (game.details ? ' · ' + game.details : ''); ic = '◈'; }
    else if (custom && custom.state) { kind = 'status'; name = custom.state; ic = '✧'; }
    if (name && st !== 'offline') {
      $('#presKind').textContent = kind; $('#presName').textContent = name; $('#presIc').textContent = ic;
      act.hidden = false; tags.hidden = true;
    } else { act.hidden = true; tags.hidden = false; }
  }
  async function poll() {
    try {
      const r = await fetch('https://api.lanyard.rest/v1/users/' + DISCORD_ID, {cache: 'no-store'});
      const j = await r.json(); if (j.success) render(j.data);
    } catch (e) {}
  }
  poll(); setInterval(() => !document.hidden && poll(), 20000);
})();

(function greeting() {
  const el = $('#greet'); if (!el) return; const h = new Date().getHours();
  el.textContent = h < 5 ? 'STILL UP?' : h < 12 ? 'GOOD MORNING' : h < 18 ? 'GOOD AFTERNOON' : 'GOOD EVENING';
})();

// parallax leve: polaroids e adesivos acompanham o mouse em profundidades diferentes (só em computador)
(function parallax() {
  if (REDUCED || MOBILE || !matchMedia('(pointer: fine)').matches) return;
  const L = [...document.querySelectorAll('.pol, .stk')].map((el, i) => ({el, k: [14, -20, 9, -26, 18][i % 5]}));
  let tx = 0, ty = 0, x = 0, y = 0, run = false;
  function loop() {
    x += (tx - x) * .07; y += (ty - y) * .07;
    L.forEach(o => o.el.style.translate = (x * o.k) + 'px ' + (y * o.k * .7) + 'px');
    if (Math.abs(tx - x) + Math.abs(ty - y) > .002) requestAnimationFrame(loop); else run = false;
  }
  addEventListener('pointermove', e => { tx = e.clientX / innerWidth - .5; ty = e.clientY / innerHeight - .5; if (!run) { run = true; requestAnimationFrame(loop); } });
})();

// (o código secreto agora vive no despacho central de botões, lá em cima: press / konamiFeed)


/* ---------- v7.2: galeria de edits e clipes ----------
   Cada clipe: {title, tag, src, poster}  -> vídeo seu em assets/clips/ (abre no player dentro da tela do Vita)
           ou {title, tag, url, thumb}    -> link externo (Medal, YouTube...) que abre em outra aba
   Enquanto a lista estiver vazia, a aba CLIPS fica escondida. */
const CLIPS = [
  {title: 'clipe 1', tag: 'clip', src: 'assets/clips/clipe_1.mp4', poster: 'assets/clips/clipe_1.jpg', dur: 22.6},
  {title: 'clipe 2', tag: 'clip', src: 'assets/clips/clipe_2.mp4', poster: 'assets/clips/clipe_2.jpg', dur: 13.8},
  {title: 'clipe 3', tag: 'clip', src: 'assets/clips/clipe_3.mp4', poster: 'assets/clips/clipe_3.jpg', dur: 30.2},
  {title: 'clipe 4', tag: 'clip', src: 'assets/clips/clipe_4.mp4', poster: 'assets/clips/clipe_4.jpg', dur: 5},
  // outro exemplo (link externo, ex.: Medal): {title: 'clutch 1v3', tag: 'medal', url: 'https://medal.tv/clips/xxxxx', thumb: 'https://...'},
  // "dur" (em segundos) é opcional: só enfeita o cartão e a barra antes do vídeo carregar.
];
(function clips() {
  const tab = $('#clipsTab'), panel = $('#clips');
  if (!CLIPS.length) { tab.remove(); panel.remove(); const i = items.indexOf(tab); if (i > -1) items.splice(i, 1); const p = panels.indexOf(panel); if (p > -1) panels.splice(p, 1); return; }
  const grid = $('#clipGrid'), lb = $('#lightbox'), lv = $('#lbVideo'), stage = $('#lbStage');
  const tTitle = $('#lbTitle'), tIdx = $('#lbIdx'), cap = $('#lbCap'), cur = $('#lbCur'), dur = $('#lbDur');
  const seek = $('#lbSeek'), fill = $('#lbFill'), star = $('#lbStar'), play = $('#lbPlay');
  const local = CLIPS.map((c, n) => Object.assign({n}, c)).filter(c => c.src);
  let opener = null, at = 0, raf = 0, scrub = false, closing = 0;
  const fmt = s => { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  $('#clipCount').textContent = CLIPS.length;
  lv.muted = true; lv.loop = true; lv.controls = false;

  /* ----- grade de cartões ----- */
  CLIPS.forEach((c, n) => {
    const isLocal = !!c.src, el = document.createElement(isLocal ? 'button' : 'a');
    el.className = 'clip'; el.style.setProperty('--i', n);
    if (isLocal) el.type = 'button'; else { el.href = c.url; el.target = '_blank'; el.rel = 'noopener'; }
    const th = document.createElement('div'); th.className = 'clip-th';
    const img = c.poster || c.thumb; if (img) th.style.backgroundImage = `url("${img}")`;
    const pl = document.createElement('i'); pl.className = 'clip-pl'; pl.textContent = isLocal ? '▶' : '↗'; th.appendChild(pl);
    const num = document.createElement('em'); num.className = 'clip-n'; num.textContent = String(n + 1).padStart(2, '0'); th.appendChild(num);
    if (c.dur) { const d = document.createElement('em'); d.className = 'clip-d'; d.textContent = fmt(c.dur); th.appendChild(d); }
    const b = document.createElement('b'); b.textContent = c.title || ('clip ' + (n + 1));
    const t = document.createElement('small'); t.textContent = c.tag || '';
    el.append(th, b, t); grid.appendChild(el);
    if (isLocal) el.addEventListener('click', () => open(local.findIndex(x => x.n === n), el));
  });

  /* ----- player próprio (sem os controles do navegador) ----- */
  function paint() {
    const d = isFinite(lv.duration) && lv.duration > 0 ? lv.duration : (local[at] && local[at].dur) || 0;
    const p = d ? Math.min(1, lv.currentTime / d) : 0;
    fill.style.width = star.style.left = (p * 100) + '%'; cur.textContent = fmt(lv.currentTime);
    seek.setAttribute('aria-valuenow', Math.round(p * 100));
  }
  function tick() { cancelAnimationFrame(raf); const f = () => { if (lb.hidden) return; paint(); raf = requestAnimationFrame(f); }; f(); }
  function load(i) {
    at = (i + local.length) % local.length; const c = local[at];
    tTitle.textContent = c.title || ('clip ' + (c.n + 1)); tIdx.textContent = (at + 1) + ' / ' + local.length;
    cap.textContent = (c.tag || 'clip') + (c.dur ? '  ·  ' + fmt(c.dur) : '');
    stage.classList.add('loading', 'paused'); play.textContent = '▶';
    lv.poster = c.poster || ''; lv.src = c.src; cur.textContent = '0:00'; dur.textContent = c.dur ? fmt(c.dur) : '0:00'; paint();
    lv.play().catch(() => {});
  }
  function open(i, from) {
    opener = from || opener; clearTimeout(closing);
    lb.hidden = false; lb.classList.remove('out', 'in'); void lb.offsetWidth; lb.classList.add('in');
    load(i); play.focus({preventScroll: true}); tick();
  }
  function close(instant) {
    if (lb.hidden) return;
    cancelAnimationFrame(raf); lv.pause();
    const done = () => { lv.removeAttribute('src'); lv.load(); lb.hidden = true; lb.classList.remove('in', 'out'); };
    if (instant === true || calm()) done(); else { lb.classList.add('out'); closing = setTimeout(done, 240); }
    if (instant !== true && opener) opener.focus({preventScroll: true});
  }
  const toggle = () => { lv.paused ? lv.play().catch(() => {}) : lv.pause(); };
  const seekBy = d => { if (isFinite(lv.duration)) { lv.currentTime = Math.max(0, Math.min(lv.duration - .05, lv.currentTime + d)); paint(); } };
  const setFrac = f => { if (isFinite(lv.duration)) { lv.currentTime = Math.max(0, Math.min(1, f)) * lv.duration; paint(); } };

  lv.addEventListener('play', () => { stage.classList.remove('paused'); play.textContent = '❚❚'; tick(); });
  lv.addEventListener('pause', () => { stage.classList.add('paused'); play.textContent = '▶'; cancelAnimationFrame(raf); paint(); });
  lv.addEventListener('loadedmetadata', () => { dur.textContent = fmt(lv.duration); paint(); });
  ['canplay', 'playing', 'seeked'].forEach(ev => lv.addEventListener(ev, () => stage.classList.remove('loading')));
  ['waiting', 'loadstart'].forEach(ev => lv.addEventListener(ev, () => lb.hidden || stage.classList.add('loading')));
  lv.addEventListener('error', () => { stage.classList.remove('loading'); cap.textContent = 'não consegui carregar esse clipe'; });
  $('#lbBig').addEventListener('click', toggle); play.addEventListener('click', toggle);
  $('#lbPrev').addEventListener('click', () => load(at - 1)); $('#lbNext').addEventListener('click', () => load(at + 1));
  $('#lbClose').addEventListener('click', () => close());
  $('#lbPrev').hidden = $('#lbNext').hidden = local.length < 2;
  // barra de progresso: arraste ou clique (offsetX já vem na escala certa mesmo com a tela do Vita inclinada em 3D)
  seek.addEventListener('pointerdown', e => { e.preventDefault(); seek.focus({preventScroll: true}); seek.setPointerCapture(e.pointerId); scrub = true; setFrac(e.offsetX / seek.offsetWidth); });
  seek.addEventListener('pointermove', e => { if (scrub) setFrac(e.offsetX / seek.offsetWidth); });
  const endScrub = e => { scrub = false; try { seek.releasePointerCapture(e.pointerId); } catch (_) {} };
  seek.addEventListener('pointerup', endScrub); seek.addEventListener('pointercancel', endScrub);

  // botões do Vita enquanto o player está aberto: ◀ ▶ pulam 5s, L R trocam de clipe, × toca/pausa, ○ fecha
  const LBK = {left: () => seekBy(-5), right: () => seekBy(5), l: () => load(at - 1), r: () => load(at + 1), x: toggle, cir: () => close(), up: () => {}, down: () => {}};
  Object.keys(LBK).forEach(k => { const o = actions[k]; actions[k] = () => lb.hidden ? o() : LBK[k](); });
  closeClip = close; lbIsOpen = () => !lb.hidden;
})();
