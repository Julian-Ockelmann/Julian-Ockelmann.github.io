---
---
(function(){
  // Find the theme's header band container
  const header = document.querySelector('.page-cover, .page-header, .banner, .post-cover');
  if(!header) return;

  // Path to your banner image
  const img = '/assets/images/banners/moon_banner.png';

  // Build the FX DOM
  const fx = document.createElement('div');
  fx.className = 'fx-hero fx-hero--mounted';
  fx.innerHTML = `
    <div class="fx-hero__layer fx-hero__base"></div>
    <div class="fx-hero__layer fx-hero__r" aria-hidden="true"></div>
    <div class="fx-hero__layer fx-hero__g" aria-hidden="true"></div>
    <div class="fx-hero__layer fx-hero__b" aria-hidden="true"></div>
    <svg class="fx-hero__grain" aria-hidden="true" focusable="false">
      <filter id="fx-noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="2">
          <animate attributeName="seed" from="0" to="100" dur="8s" repeatCount="indefinite"></animate>
        </feTurbulence>
        <feColorMatrix type="saturate" values="0"></feColorMatrix>
      </filter>
      <rect width="100%" height="100%" filter="url(#fx-noise)" opacity="0.08"></rect>
    </svg>
  `;

  // Insert behind the header text
  header.prepend(fx);

  // Assign backgrounds to layers
  fx.querySelectorAll('.fx-hero__layer').forEach(el => el.style.backgroundImage = `url('${img}')`);

  // Motion controls
  const pr = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = pr.matches;
  pr.addEventListener?.('change', e => reduced = e.matches);

  function setVars(x, y){
    header.style.setProperty('--mx', x);
    header.style.setProperty('--my', y);
    const dx = (x - 0.5), dy = (y - 0.5);
    const base = 10; // matches --fx-rgb-shift
    header.style.setProperty('--rgb-x', (dx * base * 2).toFixed(2) + 'px');
    header.style.setProperty('--rgb-y', (dy * base * 2).toFixed(2) + 'px');
  }

  let rect;
  function onMove(e){
    if(reduced) return;
    rect = rect || header.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setVars(Math.max(0, Math.min(1, x)), Math.max(0, Math.min(1, y)));
  }

  header.addEventListener('mousemove', onMove);
  header.addEventListener('mouseleave', () => setVars(0.5, 0.5));
  setVars(0.5, 0.5);

  // Random glitch tick
  function tick(){
    if(reduced) return;
    fx.classList.add('is-glitching');
    setTimeout(() => fx.classList.remove('is-glitching'), 140);
    setTimeout(tick, 1200 + Math.random()*2600);
  }
  setTimeout(tick, 1600);
})();