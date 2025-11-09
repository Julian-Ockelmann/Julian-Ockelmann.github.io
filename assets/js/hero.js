(function(){
  const hero = document.querySelector('.fx-hero');
  if(!hero) return;

  const src = hero.dataset.img;
  hero.querySelectorAll('.fx-hero__layer').forEach(el => el.style.backgroundImage = `url('${src}')`);

  const pr = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = pr.matches;
  pr.addEventListener?.('change', e => reduced = e.matches);

  function setVars(x, y){
    hero.style.setProperty('--mx', x);
    hero.style.setProperty('--my', y);
    const dx = (x - 0.5), dy = (y - 0.5);
    const base = parseFloat(getComputedStyle(hero).getPropertyValue('--fx-rgb-shift')) || 10;
    hero.style.setProperty('--rgb-x', (dx * base * 2).toFixed(2) + 'px');
    hero.style.setProperty('--rgb-y', (dy * base * 2).toFixed(2) + 'px');
  }

  let rect;
  function onMove(e){
    if(reduced) return;
    rect = rect || hero.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setVars(Math.max(0, Math.min(1, x)), Math.max(0, Math.min(1, y)));
  }
  hero.addEventListener('mousemove', onMove);
  hero.addEventListener('mouseleave', () => setVars(0.5, 0.5));
  setVars(0.5, 0.5);

  function tick(){
    if(reduced) return;
    hero.classList.add('is-glitching');
    setTimeout(() => hero.classList.remove('is-glitching'), 140);
    setTimeout(tick, 1200 + Math.random()*2600);
  }
  setTimeout(tick, 1600);
})();