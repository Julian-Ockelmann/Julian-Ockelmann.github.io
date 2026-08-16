document.querySelector('[data-print]')?.addEventListener('click', () => window.print());

document.querySelectorAll('[data-year]').forEach((node) => {
  node.textContent = new Date().getFullYear();
});

const manuscriptReader = document.querySelector('[data-manuscript-reader]');

if (manuscriptReader) {
  const manuscriptFrame = manuscriptReader.querySelector('[data-manuscript-frame]');
  const manuscriptTitle = manuscriptReader.querySelector('[data-manuscript-title]');
  const manuscriptSource = manuscriptReader.querySelector('[data-manuscript-source]');

  document.querySelectorAll('[data-manuscript-url]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const sourceUrl = trigger.dataset.manuscriptUrl;
      manuscriptFrame.src = sourceUrl;
      manuscriptFrame.title = `${trigger.dataset.manuscriptTitle} — publisher manuscript`;
      manuscriptTitle.textContent = trigger.dataset.manuscriptTitle;
      manuscriptSource.href = trigger.dataset.publisherUrl || sourceUrl;
      manuscriptReader.hidden = false;
      manuscriptReader.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  manuscriptReader.querySelector('[data-manuscript-close]')?.addEventListener('click', () => {
    manuscriptFrame.removeAttribute('src');
    manuscriptReader.hidden = true;
  });
}

const eegCanvas = document.querySelector('[data-eeg-canvas]');

if (eegCanvas) {
  const context = eegCanvas.getContext('2d');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // EDIT: EEG banner colors and relative waveform frequencies.
  const bands = [
    { cycles: 1.4, color: '#7f8cff', speed: 0.45, phase: 0.2 },
    { cycles: 3.2, color: '#aa7fe8', speed: 0.58, phase: 1.1 },
    { cycles: 6.4, color: '#e87568', speed: 0.72, phase: 2.2 },
    { cycles: 12.5, color: '#e7b454', speed: 0.88, phase: 0.7 },
    { cycles: 24, color: '#69bfa8', speed: 1.05, phase: 1.8 }
  ];
  let width = 0;
  let height = 0;
  let pointerX = 0.5;
  let targetX = 0.5;
  let isOnScreen = true;
  let animationFrame = 0;
  let lastFrame = 0;
  const frameInterval = 1000 / 30;

  const resizeCanvas = () => {
    const rect = eegCanvas.getBoundingClientRect();
    const nextWidth = Math.round(rect.width);
    const nextHeight = Math.round(rect.height);
    if (nextWidth === width && nextHeight === height) return;

    const ratio = Math.min(window.devicePixelRatio || 1, 1.75);
    width = nextWidth;
    height = nextHeight;
    eegCanvas.width = Math.round(width * ratio);
    eegCanvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const tracePath = (band, baseline, amplitude, time) => {
    const path = new Path2D();
    const pointStep = Math.max(2.5, width / 520);
    for (let x = -pointStep; x <= width + pointStep; x += pointStep) {
      const progress = x / Math.max(width, 1);
      const distance = progress - pointerX;
      const interaction = Math.exp(-(distance * distance) * 34);
      const phase = time * band.speed + band.phase;
      const primary = Math.sin(progress * Math.PI * 2 * band.cycles + phase);
      const secondary = Math.sin(progress * Math.PI * 2 * band.cycles * 0.43 - phase * 0.7) * 0.22;
      const y = baseline + (primary + secondary) * amplitude * (1 + interaction * 0.28);
      if (x === -pointStep) path.moveTo(x, y); else path.lineTo(x, y);
    }
    return path;
  };

  const drawEEG = (milliseconds = 0) => {
    const time = reducedMotion ? 0 : milliseconds * 0.001;
    pointerX += (targetX - pointerX) * 0.04;

    context.clearRect(0, 0, width, height);

    const top = height * 0.06;
    const usableHeight = height * 0.86;
    const rowHeight = usableHeight / bands.length;

    bands.forEach((band, index) => {
      const baseline = top + rowHeight * (index + 0.5);
      const amplitude = rowHeight * (index < 2 ? 0.23 : 0.2);

      const trace = tracePath(band, baseline, amplitude, time);
      context.strokeStyle = `${band.color}12`;
      context.lineWidth = 4;
      context.stroke(trace);

      context.strokeStyle = band.color;
      context.lineWidth = 1.6;
      context.stroke(trace);
    });
  };

  const animateEEG = (milliseconds) => {
    if (!isOnScreen || document.hidden || reducedMotion) {
      animationFrame = 0;
      return;
    }

    if (milliseconds - lastFrame >= frameInterval) {
      drawEEG(milliseconds);
      lastFrame = milliseconds;
    }
    animationFrame = requestAnimationFrame(animateEEG);
  };

  const startAnimation = () => {
    if (!animationFrame && isOnScreen && !document.hidden && !reducedMotion) {
      animationFrame = requestAnimationFrame(animateEEG);
    }
  };

  eegCanvas.addEventListener('pointermove', (event) => {
    const rect = eegCanvas.getBoundingClientRect();
    targetX = (event.clientX - rect.left) / rect.width;
  });

  eegCanvas.addEventListener('pointerleave', () => {
    targetX = 0.5;
  });

  new IntersectionObserver(([entry]) => {
    isOnScreen = entry.isIntersecting;
    if (isOnScreen) startAnimation();
  }, { rootMargin: '80px 0px' }).observe(eegCanvas);

  document.addEventListener('visibilitychange', startAnimation);

  new ResizeObserver(() => {
    resizeCanvas();
    if (reducedMotion || !isOnScreen) drawEEG();
  }).observe(eegCanvas);

  resizeCanvas();
  drawEEG();
  startAnimation();
}
