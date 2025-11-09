(function(){
  // Candidate selectors for the header band used by various Yat/minima forks
  const selectors = [
    '.page-cover', '.page-header', '.banner', '.post-cover',
    '.home-cover', '.cover', '.page-banner', '.site-cover', '.page-hero'
  ];
  let header = null;
  for (const s of selectors) { header = document.querySelector(s); if (header) break; }

  // Heuristic fallback: pick the first large element near top that contains an H1
  if (!header) {
    const h1 = document.querySelector('main h1, .page h1, h1');
    if (h1) {
      let el = h1.parentElement;
      while (el && el.getBoundingClientRect && el.getBoundingClientRect().top > 120) el = el.parentElement;
      header = el || null;
    }
  }

  // Ultimate fallback: create a header band after the site header/nav
  if (!header) {
    const after = document.querySelector('.site-header, header') || document.body.firstElementChild;
    const fake = document.createElement('section');
    fake.className = 'page-header';
    after && after.parentNode && after.parentNode.insertBefore(fake, after.nextSibling);
    header = fake;
  }
  if (!header) return;

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
  header.prepend(fx);

  // Assign backgrounds to layers
  fx.querySelectorAll('.fx-hero__layer')
    .forEach(el => el.style.backgroundImage = `url('${img}')`);

  // Respect reduced motion
  const pr = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = pr.matches;
  pr.addEventListener?.('change', e => reduced = e.matches);

  // Parallax variables live on the header node
  function setVars(x, y){
    header.style.setProperty('--mx', x);
    header.style.setProperty('--my', y);
    const dx = (x - 0.5), dy = (y - 0.5);
    const base = 10; // mirrors --fx-rgb-shift
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

  // Random glitch tick after load
  function tick(){
    if(reduced) return;
    fx.classList.add('is-glitching');
    setTimeout(() => fx.classList.remove('is-glitching'), 140);
    setTimeout(tick, 1200 + Math.random()*2600);
  }
  window.addEventListener('load', () => setTimeout(tick, 1600));
})();