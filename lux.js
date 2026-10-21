/* v13 lux */
(()=>{
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
/* bolhas estilo Vita: ícone + legenda (os botões continuam os mesmos) */
document.querySelectorAll('.menu-item').forEach((b,i)=>{const t=b.textContent.trim(),l=t.slice(1).trim().toLowerCase();
b.innerHTML='<i class="bi">'+t.slice(0,1)+'</i><span>'+l+'</span>';b.setAttribute('aria-label',l);b.style.setProperty('--d',(-i*.8)+'s')});
/* games: lê games.json (gerado pelo GitHub Action da Steam); sem ele mostra exemplo */
const DEMO={demo:true,games:[[730,'Counter-Strike 2',820],[1091500,'Cyberpunk 2077',140],[271590,'Grand Theft Auto V',210],[252490,'Rust',96],[413150,'Stardew Valley',64],[105600,'Terraria',58],[440,'Team Fortress 2',120],[570,'Dota 2',75]].map(a=>({appid:a[0],name:a[1],hours:a[2]}))};
const ago=t=>{const m=(Date.now()/1e3-t)/60,h=m/60,d=h/24;return m<60?Math.max(1,Math.round(m))+'min ago':h<24?Math.round(h)+'h ago':d<14?Math.round(d)+'d ago':Math.round(d/7)+'w ago'};
const IMG=id=>'https://cdn.cloudflare.steamstatic.com/steam/apps/'+id+'/';
function render(d){
 const g=(d.games||[]).slice(0,12),mx=Math.max(1,...g.map(x=>x.hours)),grid=$('#gmGrid'),now=$('#gmNow');
 $('#gmCount').textContent=(d.total||g.length)+' games';
 grid.innerHTML=g.map((x,i)=>'<a class="gm" style="--n:'+i+'" href="https://store.steampowered.com/app/'+x.appid+'" target="_blank" rel="noopener"><img loading="lazy" decoding="async" alt="" src="'+IMG(x.appid)+'library_600x900.jpg"><span class="gi"><b>'+esc(x.name)+'</b>'+x.hours+'h<span class="bar" style="--w:'+Math.max(6,x.hours/mx*100)+'%"><i></i></span></span></a>').join('');
 grid.addEventListener('error',e=>{const im=e.target;if(im.src.includes('library_600x900'))im.src=IMG(im.closest('.gm').href.split('/app/')[1])+'header.jpg';else im.style.display='none'},true);
 const r=(d.recent||[])[0];
 if(d.now){now.innerHTML='<i></i>playing now · <b>'+esc(d.now)+'</b>';now.classList.add('on')}
 else if(r){now.innerHTML='<i style="background:#bbb;box-shadow:none;animation:none"></i>last played · <b>'+esc(r.name)+'</b><em>'+(r.last?ago(r.last):r.hours2w+'h recently')+'</em>';now.classList.add('on')}
 window.luxPending=d;window.luxGames&&window.luxGames(d);
 if(d.demo)grid.insertAdjacentHTML('afterend','<p class="gm-note">✧ exemplo · conecte sua Steam (veja README) ✧</p>');
}
fetch('games.json?'+Date.now()).then(r=>r.ok?r.json():Promise.reject()).catch(()=>DEMO).then(render);
/* contador de visitas (counterapi.dev v1, público); se falhar, conta só neste navegador */
const vb=$('#vis b'),pad=n=>String(n).padStart(6,'0');
function roll(n){const t0=performance.now();(function f(t){const k=Math.min(1,(t-t0)/1400),e=1-Math.pow(1-k,3);vb.textContent=pad(Math.round(n*e));if(k<1)requestAnimationFrame(f)})(t0)}
let seen=0;try{seen=sessionStorage.getItem('lxv')}catch(e){}
const base='https://api.counterapi.dev/v1/tutulindojogos-site/visits';
fetch(base+(seen?'':'/up')).then(r=>r.json()).then(j=>{const n=j.count??j.value??(j.data&&j.data.up_count);if(n==null)throw 0;try{sessionStorage.setItem('lxv','1')}catch(e){}roll(n)})
.catch(()=>{let n=1;try{n=(+localStorage.getItem('lxn')||0)+(seen?0:1);localStorage.setItem('lxn',n)}catch(e){}roll(n)});
})();
/* ícones das bolhas (SVG) */
(()=>{const P={profile:'<circle cx="12" cy="8" r="3.6"/><path d="M5 20c.8-4 3.6-6 7-6s6.2 2 7 6"/>',social:'<circle cx="12" cy="12" r="3.4"/><path d="M15.4 12v1.3a2.4 2.4 0 0 0 4.8 0V12a8.2 8.2 0 1 0-3.2 6.5"/>',games:'<rect x="2.5" y="7" width="19" height="10.5" rx="5"/><path d="M8 10.2v4.2M5.9 12.3h4.2"/><circle cx="15.5" cy="11.4" r=".9"/><circle cx="18" cy="13.4" r=".9"/>',about:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5.2M12 7.8v.1"/>',music:'<path d="M9 17.5V5.5l10-2v12"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="15.5" r="2.5"/>',clips:'<rect x="3" y="5" width="18" height="14" rx="3.5"/><path d="M10.2 9.4v5.2l4.4-2.6z"/>',trophies:'<path d="M7.5 4h9v5a4.5 4.5 0 0 1-9 0z"/><path d="M7.5 6H4.5c0 3 1.2 4.4 3.3 4.7M16.5 6h3c0 3-1.2 4.4-3.3 4.7M12 13.5V17M8.5 20h7M9.5 17h5"/>'};
document.querySelectorAll('.menu-item').forEach(b=>{const i=b.querySelector('.bi');if(i&&P[b.dataset.panel])i.innerHTML='<svg viewBox="0 0 24 24" width="27" height="27" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+P[b.dataset.panel]+'</svg>'})})();
/* hint de rolagem + bolha ativa centralizada */
(()=>{const home=$('#home'),scr=$('#vscreen'),menu=document.querySelector('.menu');if(!home||!scr||!menu)return;
const m=document.createElement('div');m.className='more';m.innerHTML='<button type="button" aria-label="rolar para baixo"><i>▾</i>mais</button>';scr.appendChild(m);
const ft=document.querySelector('.screen-footer'),chk=()=>m.classList.toggle('on',!home.classList.contains('hidden')&&!!ft&&ft.getBoundingClientRect().bottom>home.getBoundingClientRect().bottom-6);
home.addEventListener('scroll',chk,{passive:true});setInterval(chk,500);
m.querySelector('button').onclick=()=>home.scrollBy({top:home.clientHeight*.7,behavior:'smooth'});
new MutationObserver(()=>{const a=menu.querySelector('.active');if(a&&menu.scrollWidth>menu.clientWidth)menu.scrollTo({left:a.offsetLeft-(menu.clientWidth-a.offsetWidth)/2,behavior:'smooth'});home.scrollTo({top:0,behavior:'smooth'})}).observe(menu,{subtree:true,attributes:true,attributeFilter:['class']});
})();
/* v15 */
(()=>{
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ago=t=>{const m=(Date.now()/1e3-t)/60,h=m/60,d=h/24;return m<60?Math.max(1,Math.round(m))+'min ago':h<24?Math.round(h)+'h ago':d<14?Math.round(d)+'d ago':Math.round(d/7)+'w ago'};
const cu=(e,n,d=1300)=>{const t0=performance.now();(function f(t){const k=Math.min(1,(t-t0)/d);e.textContent=Math.round(n*(1-Math.pow(1-k,3))).toLocaleString('pt-BR');if(k<1)requestAnimationFrame(f)})(t0)};
const run=()=>document.querySelectorAll('[data-n]').forEach(e=>cu(e,+e.dataset.n));
/* chips do perfil + temas */
$('#tagRow').insertAdjacentHTML('afterend','<div class="pstats"><div class="st"><b id="psG" data-n="0">–</b>games</div><div class="st"><b id="psH" data-n="0">–</b>hours</div><div class="st"><b id="psV">–</b>visits</div></div><div class="thm" id="thm"></div>');
const vb=$('#vis b'),pv=$('#psV');
new MutationObserver(()=>{pv.textContent=(+vb.textContent.replace(/\D/g,'')||0).toLocaleString('pt-BR')}).observe(vb,{childList:true,characterData:true,subtree:true});
const T={pearl:['#fff','#c9cde8'],ice:['#8fd3ff','#5b86b8'],lilac:['#e0b8ff','#8b6cc4'],mint:['#b8ffe0','#5fae92']},th=$('#thm');
th.innerHTML=Object.keys(T).map(k=>'<i data-t="'+k+'" title="'+k+'" style="background:radial-gradient(circle at 35% 30%,#fff,'+T[k][0]+' 55%,'+T[k][1]+')"></i>').join('');
const set=k=>{k==='pearl'?document.body.removeAttribute('data-th'):document.body.dataset.th=k;th.querySelectorAll('i').forEach(i=>i.classList.toggle('on',i.dataset.t===k));try{localStorage.setItem('lxt',k)}catch(e){}};
th.onclick=e=>{const k=e.target.dataset&&e.target.dataset.t;if(k)set(k)};
let s='pearl';try{s=localStorage.getItem('lxt')||s}catch(e){}set(T[s]?s:'pearl');
/* hero de games + stats */
window.luxGames=d=>{const g=d.games||[];if(!g.length)return;const t=g[0],sum=g.reduce((a,x)=>a+x.hours,0),r=(d.recent||[])[0],gr=$('#gmGrid'),n=d.total||g.length;
 gr.firstElementChild&&gr.firstElementChild.remove();
 gr.insertAdjacentHTML('beforebegin','<a class="gm-hero" href="https://store.steampowered.com/app/'+t.appid+'" target="_blank" rel="noopener"><img alt="" decoding="async" src="https://cdn.cloudflare.steamstatic.com/steam/apps/'+t.appid+'/header.jpg"><div><small>✦ MOST PLAYED</small><b>'+esc(t.name)+'</b><span><em data-n="'+t.hours+'">0</em>h on record</span></div></a><div class="stats"><div class="st"><b data-n="'+n+'">0</b>games</div><div class="st"><b data-n="'+sum+'">0</b>top hours</div><div class="st"><b>'+(r&&r.last?ago(r.last):'—')+'</b>last played</div></div>');
 [['psG',n],['psH',sum]].forEach(a=>{const e=$('#'+a[0]);e.dataset.n=a[1]});
 run();new MutationObserver(()=>$('#games').classList.contains('active-panel')&&run()).observe($('#games'),{attributes:true,attributeFilter:['class']})};
if(window.luxPending)window.luxGames(window.luxPending);
})();
