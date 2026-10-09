/* ===== v10 — performance ✦ : modo leve automático =====
   Mede o FPS logo depois do carregamento; se estiver abaixo de ~45 liga o "modo leve" (body.lite).
   Celular já começa leve. Tecla Q liga/desliga na mão (fica salvo). */
(function () {
  const B = document.body, KEY = 'tutuLite', mobile = matchMedia('(max-width: 760px)').matches;
  let pref = null; try { pref = localStorage.getItem(KEY); } catch (e) {}
  const set = (on, save) => { B.classList.toggle('lite', on); if (save) try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {} };
  if (pref === '1' || (pref === null && mobile)) set(true);
  if (pref === null && !mobile && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // espera o loading sumir, e mede 2,5s de frames
    setTimeout(function () {
      let n = 0, t0 = 0, last = 0, slow = 0;
      (function f(t) {
        if (!t0) t0 = t; n++; if (last && t - last > 40) slow++; last = t;
        if (document.hidden) { t0 = 0; n = 0; return requestAnimationFrame(f); }
        if (t - t0 < 2500) return requestAnimationFrame(f);
        const fps = n / ((t - t0) / 1000);
        if (fps < 45) set(true);
      })(performance.now());
    }, 5200);
  }
  addEventListener('keydown', function (e) {
    if (e.key && e.key.toLowerCase() === 'q' && !e.ctrlKey && !e.metaKey && !e.altKey && !/input|textarea/i.test((e.target || {}).tagName || '')) set(!B.classList.contains('lite'), true);
  });
})();
