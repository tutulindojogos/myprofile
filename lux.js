/* v19 lux */
(()=>{
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
/* bolhas estilo Vita: ícone + legenda (os botões continuam os mesmos) */
document.querySelectorAll('.menu-item').forEach((b,i)=>{const t=b.textContent.trim(),l=t.slice(1).trim().toLowerCase();
b.innerHTML='<i class="bi">'+t.slice(0,1)+'</i><span>'+l+'</span>';b.setAttribute('aria-label',l);b.style.setProperty('--d',(-i*.8)+'s')});
/* games: lê games.json (gerado pelo GitHub Action da Steam); sem ele mostra exemplo */
const DEMO={demo:true,games:[[730,'Counter-Strike 2',820],[1091500,'Cyberpunk 2077',140],[271590,'Grand Theft Auto V',210],[252490,'Rust',96],[413150,'Stardew Valley',64],[105600,'Terraria',58],[440,'Team Fortress 2',120],[570,'Dota 2',75]].map(a=>({appid:a[0],name:a[1],hours:a[2]}))};
const IMG=id=>'https://cdn.cloudflare.steamstatic.com/steam/apps/'+id+'/';
/* ✦ JOGO DA SEMANA */
/* deixe null = automático (o jogo que você mais jogou nas últimas 2 semanas, vindo da Steam).
   Pra escolher na mão: const SEMANA={appid:730,name:'Counter-Strike 2',nota:'o vício da vez'}; */
const SEMANA=null;
const fmt=n=>n>=1000?(n/1000).toFixed(1).replace('.0','')+'k':String(n);
function render(d){
 const all=d.games||[],rc=(d.recent||[])[0],
  wk=d.week||SEMANA||(rc&&{appid:rc.appid,name:rc.name,nota:rc.hours2w+'h nas últimas 2 semanas'})||null,wg=wk&&all.find(x=>x.appid==wk.appid),
  top=all[0],rest=all.filter(x=>x!==top&&!(wk&&x.appid==wk.appid)).slice(0,12),mx=Math.max(1,...all.map(x=>x.hours)),
  grid=$('#gmGrid'),now=$('#gmNow'),tot=all.reduce((s,x)=>s+x.hours,0);
 $('#gmCount').textContent=(d.total||all.length)+' games';
 let h=wk?'<a class="gw" href="https://store.steampowered.com/app/'+wk.appid+'" target="_blank" rel="noopener"><i class="gw-bg" style="--bg:url('+IMG(wk.appid)+'header.jpg)"></i><img class="gw-c" alt="" src="'+IMG(wk.appid)+'library_600x900.jpg" onerror="this.src=\''+IMG(wk.appid)+'header.jpg\'"><span class="gw-i"><span class="gw-b">★ JOGO DA SEMANA</span><span class="gw-n">'+esc(wk.name)+'</span>'+(wg?'<span class="gw-h"><em>'+wg.hours+'</em><small>HRS JOGADAS</small></span>':'')+'<span class="gw-l">'+esc(wk.nota||'')+'</span></span></a>':'';
 if(top)h+='<a class="gm-hero" href="https://store.steampowered.com/app/'+top.appid+'" target="_blank" rel="noopener"><img alt="" loading="lazy" src="'+IMG(top.appid)+'header.jpg"><div><small>MAIS JOGADO</small><b>'+esc(top.name)+'</b><em>'+top.hours+'h</em></div></a>';
 h+='<div class="stats"><div class="st"><b>'+(d.total||all.length)+'</b>games</div><div class="st"><b>'+fmt(tot)+'</b>horas</div><div class="st"><b>'+(top?top.hours+'h':'-')+'</b>no top 1</div></div>';
 $('#gmHead')||grid.insertAdjacentHTML('beforebegin','<div id="gmHead"></div>');
 $('#gmHead').innerHTML=h;
 grid.innerHTML=rest.map((x,i)=>'<a class="gm" style="--n:'+i+'" href="https://store.steampowered.com/app/'+x.appid+'" target="_blank" rel="noopener"><img loading="lazy" alt="" src="'+IMG(x.appid)+'library_600x900.jpg"><span class="gi"><b>'+esc(x.name)+'</b>'+x.hours+'h<span class="bar" style="--w:'+Math.max(6,x.hours/mx*100)+'%"><i></i></span></span></a>').join('');
 grid.addEventListener('error',e=>{const im=e.target;if(im.src.includes('library_600x900')&&im.closest('.gm'))im.src=IMG(im.closest('.gm').href.split('/app/')[1])+'header.jpg';else if(im.closest('.gm'))im.style.display='none'},true);
 const r=(d.recent||[])[0];
 if(d.now){now.innerHTML='<i></i>playing now · <b>'+esc(d.now)+'</b>';now.classList.add('on')}
 else if(r){now.innerHTML='<i style="background:#bbb;box-shadow:none;animation:none"></i>last played · <b>'+esc(r.name)+'</b><em>'+r.hours2w+'h / 2 weeks</em>';now.classList.add('on')}
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
(()=>{const P={profile:'<circle cx="12" cy="8" r="3.6"/><path d="M5 20c.8-4 3.6-6 7-6s6.2 2 7 6"/>',social:'<circle cx="12" cy="12" r="3.4"/><path d="M15.4 12v1.3a2.4 2.4 0 0 0 4.8 0V12a8.2 8.2 0 1 0-3.2 6.5"/>',games:'<rect x="2.5" y="7" width="19" height="10.5" rx="5"/><path d="M8 10.2v4.2M5.9 12.3h4.2"/><circle cx="15.5" cy="11.4" r=".9"/><circle cx="18" cy="13.4" r=".9"/>',about:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5.2M12 7.8v.1"/>',music:'<path d="M9 17.5V5.5l10-2v12"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="15.5" r="2.5"/>',clips:'<rect x="3" y="5" width="18" height="14" rx="3.5"/><path d="M10.2 9.4v5.2l4.4-2.6z"/>',setup:'<rect x="2.5" y="8.5" width="19" height="9" rx="2.5"/><path d="M6 12h.01M9 12h.01M12 12h.01M15 12h.01M18 12h.01M8 15h8"/><path d="M5 8.5V6.5"/>',trophies:'<path d="M7.5 4h9v5a4.5 4.5 0 0 1-9 0z"/><path d="M7.5 6H4.5c0 3 1.2 4.4 3.3 4.7M16.5 6h3c0 3-1.2 4.4-3.3 4.7M12 13.5V17M8.5 20h7M9.5 17h5"/>'};
document.querySelectorAll('.menu-item').forEach(b=>{const i=b.querySelector('.bi');if(i&&P[b.dataset.panel])i.innerHTML='<svg viewBox="0 0 24 24" width="27" height="27" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+P[b.dataset.panel]+'</svg>'})})();

/* tema (bolinhas no about) */
(()=>{const b=document.body,t=$('#thm');if(!t)return;let v='';try{v=localStorage.getItem('tutu.th')||''}catch(e){}
function set(x){x?b.dataset.th=x:b.removeAttribute('data-th');t.querySelectorAll('i').forEach(i=>i.classList.toggle('on',i.dataset.th===x));try{localStorage.setItem('tutu.th',x)}catch(e){}}
t.addEventListener('click',e=>{const i=e.target.closest('i');if(i)set(i.dataset.th)});set(v)})();
/* ✧ mini-jogo escondido: "angel catcher". 30s pegando estrelas: combo, douradas (+5) e bombas glitch (-3) */
(()=>{const st=$('#secStar'),sg=$('#sg'),f=$('#sgF'),sS=$('#sgS'),sT=$('#sgT'),e=$('#sgE');if(!st||!sg)return;
const RANK=[[0,'rookie'],[12,'stargazer'],[30,'angel'],[55,'legendary ✦']],DUR=30;
let endAt=0,sc=0,left=0,combo=0,mx=1,run=0,raf=0,last=0,acc=0,el=0,ents=[],best=0,found=0;
try{best=+localStorage.getItem('tutu.sg')||0;found=localStorage.getItem('tutu.sgf')}catch(_){}
if(!$('#sgC')){sS.parentNode.insertAdjacentHTML('afterend','<span id="sgC" class="sg-c"></span>');sg.insertAdjacentHTML('beforeend','<i class="sg-bar"><b id="sgBar"></b></i>')}
const sC=$('#sgC'),bar=$('#sgBar');
const mult=()=>Math.min(5,1+Math.floor(combo/5));
function fx(x,y,t,c){const p=document.createElement('span');p.className='sg-p';p.textContent=t;p.style.cssText='left:'+x+'px;top:'+y+'px;color:'+(c||'#fff');f.appendChild(p);setTimeout(()=>p.remove(),700)}
function hud(){sS.textContent=sc;sT.textContent=Math.max(0,Math.ceil(left));bar.style.width=(left/DUR*100)+'%';sC.textContent=combo>=5?'combo x'+mult():'';sC.classList.toggle('on',combo>=5)}
function spawn(){const r=Math.random(),t=el>3&&r>.9?'b':r>.8?'g':'n',d=document.createElement('b'),w=f.clientWidth,s=t==='g'?30:t==='b'?34:26+Math.random()*18;
d.className='s '+t;d.textContent=t==='b'?'✕':t==='g'?'★':(Math.random()<.5?'✦':'✧');d.style.fontSize=s+'px';
const o={d,t,x:12+Math.random()*(w-s-24),y:-50,v:(120+el*4.5+Math.random()*50)*(t==='g'?1.45:1),s,dead:0};d.style.left=o.x+'px';
d.addEventListener('pointerdown',ev=>{ev.preventDefault();ev.stopPropagation();hit(o)});f.appendChild(d);ents.push(o)}
function hit(o){if(!run||o.dead)return;o.dead=1;const cx=o.x+o.s/2,cy=o.y;o.d.classList.add('pop');setTimeout(()=>o.d.remove(),220);
if(o.t==='b'){sc=Math.max(0,sc-3);combo=0;fx(cx,cy,'-3','#ff6b8a');f.classList.remove('shake');void f.offsetWidth;f.classList.add('shake');if(navigator.vibrate)try{navigator.vibrate(60)}catch(_){}}
else{combo++;const m=mult(),p=(o.t==='g'?5:1)*m;sc+=p;if(o.t==='g')endAt=Math.min(endAt+1500,performance.now()+DUR*1000);fx(cx,cy,'+'+p,o.t==='g'?'#ffd98a':'#fff');if(combo>mx)mx=combo}hud()}
function loop(t){if(!run)return;const dt=Math.min(.05,(t-last)/1000||0);last=t;el+=dt;left=(endAt-performance.now())/1000;acc+=dt;
const gap=Math.max(.26,.72-el*.016);while(acc>=gap){acc-=gap;spawn()}
const H=f.clientHeight+20;for(let i=ents.length-1;i>=0;i--){const o=ents[i];if(o.dead){ents.splice(i,1);continue}o.y+=o.v*dt;o.d.style.transform='translateY('+o.y+'px)';
if(o.y>H){o.dead=1;o.d.remove();ents.splice(i,1);if(o.t!=='b'&&combo){combo=0}}}
hud();if(left<=0)return end();raf=requestAnimationFrame(loop)}
function stop(){run=0;cancelAnimationFrame(raf)}
function end(){stop();f.innerHTML='';ents=[];const nb=sc>best;if(nb){best=sc;try{localStorage.setItem('tutu.sg',best)}catch(_){}}
const rk=RANK.filter(r=>sc>=r[0]).pop()[1];$('#sgB').textContent=sc;$('#sgM').innerHTML='rank: <u>'+rk+'</u><br>'+(nb&&sc?'novo recorde ✦ ':'')+'recorde '+best+' · melhor combo '+mx;e.hidden=false;sC.classList.remove('on');if(sc>=10&&window.tutuUnlock)window.tutuUnlock('star')}
function start(){stop();sc=0;combo=0;mx=1;el=0;acc=0;left=DUR;endAt=performance.now()+DUR*1000;ents=[];f.innerHTML='';e.hidden=true;hud();run=1;last=performance.now();raf=requestAnimationFrame(loop)}
function open(){sg.hidden=false;found=1;try{localStorage.setItem('tutu.sgf','1')}catch(_){}const h=$('#secHint');if(h)h.remove();start()}
function close(){stop();sg.hidden=true;f.innerHTML='';ents=[]}
st.addEventListener('click',ev=>{ev.stopPropagation();open()});
$('#sgX').addEventListener('click',close);$('#sgR').addEventListener('click',start);
/* enquanto o jogo está aberto, o teclado não mexe nas abas de trás */
const block=ev=>{if(sg.hidden)return;if(ev.type==='keydown'&&ev.key==='Escape')close();ev.stopImmediatePropagation();ev.preventDefault()};
window.addEventListener('keydown',block,true);window.addEventListener('keyup',block,true);
document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);if(run&&!document.hidden){endAt+=performance.now()-last;last=performance.now();raf=requestAnimationFrame(loop)}});
/* dica: se ficar um tempo no perfil sem achar, uma bolinha aparece apontando a estrela */
let n=0;if(!found)setInterval(()=>{if(found||$('#secHint'))return;const hm=$('#home'),pf=$('#profile');if(hm&&!hm.classList.contains('hidden')&&pf&&pf.classList.contains('active-panel')&&sg.hidden)n++;
if(n>=5){const c=st.parentNode,h=document.createElement('span');h.id='secHint';h.className='sec-hint';h.textContent='psst ✧ toca na estrela';c.appendChild(h);setTimeout(()=>h.remove(),9000);n=-30}},1000)})();
/* arrastar com o mouse não seleciona nem "arrasta" texto/imagem; só bloqueia a seleção, os eventos de ponteiro (giro do Vita) ficam intactos */
(()=>{const inp=t=>t&&t.closest&&t.closest('input,textarea');
document.addEventListener('selectstart',e=>{if(!inp(e.target))e.preventDefault()});
document.addEventListener('dragstart',e=>{if(!inp(e.target))e.preventDefault()});
document.addEventListener('pointerdown',e=>{if(!inp(e.target)&&getSelection&&getSelection().rangeCount)getSelection().removeAllRanges()},true)})();
