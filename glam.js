/* ===== v10 — glam ✦ : desenha tudo uma vez (canvas/SVG estáticos) ===== */
(function () {
  const root = document.getElementById('glam'); if (!root) return;
  const mobile = matchMedia('(max-width: 760px)').matches;
  function star(x, cx, cy, R, k) { // estrela de 4 pontas
    x.beginPath(); x.moveTo(cx, cy - R);
    x.quadraticCurveTo(cx + R * k, cy - R * k, cx + R, cy); x.quadraticCurveTo(cx + R * k, cy + R * k, cx, cy + R);
    x.quadraticCurveTo(cx - R * k, cy + R * k, cx - R, cy); x.quadraticCurveTo(cx - R * k, cy - R * k, cx, cy - R); x.closePath();
  }
  function halftone(size, step, k, rings) {
    const m = document.createElement('canvas'); m.width = m.height = size; const x = m.getContext('2d'), c = size / 2, R = size * .47;
    star(x, c, c, R, k); x.fillStyle = '#fff'; x.fill();
    if (rings) { x.globalCompositeOperation = 'destination-out'; star(x, c, c, R * .76, k); x.fill(); x.globalCompositeOperation = 'source-over'; star(x, c, c, R * .5, k); x.fill(); }
    x.globalCompositeOperation = 'destination-in';
    const g = x.createRadialGradient(c, c, 0, c, c, R); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.55, 'rgba(255,255,255,.85)'); g.addColorStop(1, 'rgba(255,255,255,.4)');
    x.fillStyle = g; x.fillRect(0, 0, size, size);
    const d = x.getImageData(0, 0, size, size).data, o = document.createElement('canvas'); o.width = o.height = size; const ox = o.getContext('2d'); ox.fillStyle = '#fff';
    const rowH = step * .866;
    for (let r = 0, y = step / 2; y < size; r++, y += rowH) for (let xx = (r % 2 ? step : step / 2); xx < size; xx += step) {
      const a = d[(Math.min(size - 1, y | 0) * size + Math.min(size - 1, xx | 0)) * 4 + 3] / 255;
      if (a < .08) continue; ox.beginPath(); ox.arc(xx, y, step * .56 * Math.pow(a, .75), 0, 7); ox.fill();
    }
    return o;
  }
  const add = (cls, node) => { const w = document.createElement('div'); w.className = 'gs ' + cls; w.appendChild(node); root.appendChild(w); };
  const sz = mobile ? .6 : 1; // menos pixels no celular
  if (!mobile) { add('g0', halftone(800, 10, .13, true)); add('g3', halftone(160, 7, .17, false)); add('g4', halftone(160, 7, .17, false)); }
  add('g1', halftone(Math.round(800 * sz), Math.round(9 * sz), .15, true)); add('g2', halftone(Math.round(900 * sz), Math.round(10 * sz), .14, true));
  if (mobile) return;
  for (const c of ['irid', 'streak']) { const i = document.createElement('i'); i.className = c; root.insertBefore(i, root.firstChild); }

  // ---- adesivos ----
  let uid = 0;
  const chrome = () => { const id = 'cs' + (uid++); return `<svg viewBox="-50 -50 100 100"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".42" stop-color="#9fa9bf"/><stop offset=".55" stop-color="#f4f7ff"/><stop offset="1" stop-color="#7d869b"/></linearGradient></defs>
    <path d="M0-48Q6-6 48 0Q6 6 0 48Q-6 6-48 0Q-6-6 0-48Z" fill="url(#${id})" stroke="#fff" stroke-width="2.2" stroke-linejoin="round"/><path d="M0-40Q3-8 -2-3Q-10-2-40 0Q-8-6 0-40Z" fill="#fff" opacity=".7"/></svg>`; };
  const sticker = (cls, html, css) => { const s = document.createElement('i'); s.className = 'st ' + cls; s.innerHTML = html; if (css) s.style.cssText = css; root.appendChild(s); return s; };
  [['12vw', '31vh', '6.5vmin', -12], ['31vw', '9vh', '4.4vmin', 10], ['69vw', '17vh', '5.5vmin', 6], ['89vw', '60vh', '4vmin', -8], ['21vw', '74vh', '4.8vmin', 14], ['80vw', '82vh', '3.4vmin', 0]]
    .forEach(([l, t, w, r]) => sticker('sp', chrome(), `left:${l};top:${t};width:${w};transform:rotate(${r}deg)`));
  sticker('cd', '');
  const txt = 'stay online ✦ y2k forever ✦ angel.exe ✦ ';
  sticker('gring', `<svg viewBox="0 0 120 120"><defs><path id="rp" d="M60 60m-46 0a46 46 0 1 1 92 0a46 46 0 1 1-92 0"/></defs><circle cx="60" cy="60" r="57" fill="rgba(255,255,255,.06)" stroke="rgba(255,255,255,.55)" stroke-width="1"/><text font-family="DM Mono,monospace" font-size="9.4" letter-spacing="2.6" fill="#fff"><textPath href="#rp">${txt}${txt}</textPath></text><path d="M60 40Q63 57 80 60Q63 63 60 80Q57 63 40 60Q57 57 60 40Z" fill="#fff"/></svg>`);
  const b1 = document.createElement('span'); b1.className = 'st bar'; b1.textContent = '✦ tutulindojogos — angel system — est. 2026 ✦'; root.appendChild(b1);
  const b2 = document.createElement('span'); b2.className = 'st bar2'; b2.textContent = 'stay online ✧ stay pretty ✧ stay online'; root.appendChild(b2);
  const bc = document.createElement('span'); bc.className = 'st code'; root.appendChild(bc);
})();
