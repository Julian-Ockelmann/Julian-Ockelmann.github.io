document.querySelector('[data-print]')?.addEventListener('click', () => window.print());

document.querySelectorAll('[data-year]').forEach((node) => {
  node.textContent = new Date().getFullYear();
});

const ORCID_ID = '0000-0002-4780-8993';
const ORCID_API = `https://pub.orcid.org/v3.0/${ORCID_ID}`;
const ORCID_HEADERS = { Accept: 'application/json' };

const decodeOrcidText = (value = '') => {
  const documentFragment = new DOMParser().parseFromString(value, 'text/html');
  return documentFragment.body.textContent.trim();
};

const normalizeTitle = (value = '') => decodeOrcidText(value)
  .toLocaleLowerCase('en')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const externalId = (record, type) => record?.['external-ids']?.['external-id']
  ?.find((entry) => entry['external-id-type'] === type)?.['external-id-value'] || '';

const publicationYear = (record) => record?.['publication-date']?.year?.value || '';
const publicationMonth = (record) => record?.['publication-date']?.month?.value || '';
const publicationDay = (record) => record?.['publication-date']?.day?.value || '';

const publicationDateKey = (record) => [
  publicationYear(record),
  publicationMonth(record).padStart(2, '0'),
  publicationDay(record).padStart(2, '0')
].join('-');

const workPriority = (work) => work.type === 'journal-article' ? 2 : 1;

const extractOrcidWorks = (payload) => {
  const uniqueWorks = new Map();

  (payload?.group || []).forEach((group) => {
    (group['work-summary'] || []).forEach((summary) => {
      if (!['journal-article', 'preprint'].includes(summary.type)) return;

      const title = decodeOrcidText(summary.title?.title?.value || '');
      const key = normalizeTitle(title);
      if (!key) return;

      const doi = externalId(summary, 'doi');
      const work = {
        title,
        key,
        type: summary.type,
        year: publicationYear(summary),
        date: publicationDateKey(summary),
        journal: summary['journal-title']?.value || '',
        url: doi ? `https://doi.org/${doi}` : summary.url?.value || '',
        doi
      };

      const current = uniqueWorks.get(key);
      if (!current || workPriority(work) > workPriority(current) ||
          (workPriority(work) === workPriority(current) && work.date > current.date)) {
        uniqueWorks.set(key, work);
      }
    });
  });

  return [...uniqueWorks.values()];
};

const workMeta = (work) => {
  if (work.type === 'journal-article') {
    return ['Published', work.journal, work.year].filter(Boolean).join(' · ');
  }
  return ['Preprint', work.year].filter(Boolean).join(' · ');
};

const createProjectCard = (work) => {
  const article = document.createElement('article');
  article.className = 'project-card';

  const meta = document.createElement('p');
  meta.className = 'meta';
  meta.textContent = workMeta(work);

  const title = document.createElement('h3');
  title.textContent = work.title;

  const link = document.createElement('a');
  link.className = 'card-link';
  link.href = work.url;
  link.textContent = work.type === 'journal-article' ? 'DOI' : 'Preprint';

  article.append(meta, title, link);
  return article;
};

const syncOrcidWorks = async () => {
  const container = document.querySelector('[data-orcid-works]');
  if (!container) return;

  const status = document.querySelector('[data-orcid-works-status]');

  try {
    const response = await fetch(`${ORCID_API}/works`, { headers: ORCID_HEADERS });
    if (!response.ok) throw new Error(`ORCID works request failed: ${response.status}`);

    const works = extractOrcidWorks(await response.json());
    const cards = [...container.querySelectorAll('.project-card')];
    const cardsByTitle = new Map(cards.map((card) => [
      normalizeTitle(card.querySelector('h3')?.textContent),
      card
    ]));

    works
      .sort((a, b) => b.date.localeCompare(a.date))
      .forEach((work) => {
        const card = cardsByTitle.get(work.key);

        if (!card) {
          container.append(createProjectCard(work));
          return;
        }

        if (work.type !== 'journal-article') return;

        const meta = card.querySelector('.meta');
        if (meta) meta.textContent = workMeta(work);

        const link = card.querySelector('.card-link');
        const localDetails = link?.getAttribute('href')?.startsWith('papers/');
        if (link && !localDetails && work.url) {
          link.href = work.url;
          link.textContent = 'DOI';
        }
      });

    if (status) {
      status.textContent = 'ORCID synced ↗';
      status.title = `${works.length} public paper projects synchronized from ORCID`;
    }
  } catch (error) {
    console.info('ORCID works sync unavailable; using the saved publication list.', error);
  }
};

const knownJournals = new Map([
  ['2399-3642', 'Communications Biology'],
  ['1748-3107', 'Disability and Rehabilitation: Assistive Technology']
]);

const resolveJournalTitle = async (issn) => {
  if (knownJournals.has(issn)) return knownJournals.get(issn);

  try {
    const response = await fetch(`https://api.crossref.org/journals/${encodeURIComponent(issn)}`);
    if (!response.ok) throw new Error(`Crossref journal request failed: ${response.status}`);
    const payload = await response.json();
    return payload?.message?.title || `Journal · ISSN ${issn}`;
  } catch {
    return `Journal · ISSN ${issn}`;
  }
};

const cleanReviewSource = (value = '') => {
  if (/web of science/i.test(value)) return 'Web of Science';
  if (/nature publishing group/i.test(value)) return 'Springer Nature';
  return value || 'ORCID';
};

const extractPeerReviews = async (payload) => {
  const reviews = [];

  for (const group of payload?.group || []) {
    const groupId = group?.['external-ids']?.['external-id']?.[0]?.['external-id-value'] || '';
    const issn = groupId.replace(/^issn:/i, '');
    const journal = await resolveJournalTitle(issn);

    (group['peer-review-group'] || []).forEach((peerGroup) => {
      (peerGroup['peer-review-summary'] || []).forEach((summary) => {
        reviews.push({
          id: summary['put-code'],
          year: summary['completion-date']?.year?.value || '',
          journal,
          source: cleanReviewSource(summary.source?.['source-name']?.value),
          url: summary['review-url']?.value || ''
        });
      });
    });
  }

  return reviews.sort((a, b) => b.year.localeCompare(a.year) || a.journal.localeCompare(b.journal));
};

const createServiceCard = (review) => {
  const article = document.createElement('article');
  article.className = 'service-card';

  const meta = document.createElement('p');
  meta.className = 'meta';
  meta.textContent = ['Peer review', review.year].filter(Boolean).join(' · ');

  const title = document.createElement('h3');
  title.textContent = review.journal;

  const source = review.url ? document.createElement('a') : document.createElement('span');
  source.className = 'service-source';
  source.textContent = review.url ? `${review.source} ↗` : review.source;
  if (review.url) source.href = review.url;

  article.append(meta, title, source);
  return article;
};

const syncOrcidReviews = async () => {
  const container = document.querySelector('[data-orcid-reviews]');
  if (!container) return;

  const status = document.querySelector('[data-orcid-reviews-status]');

  try {
    const response = await fetch(`${ORCID_API}/peer-reviews`, { headers: ORCID_HEADERS });
    if (!response.ok) throw new Error(`ORCID peer-review request failed: ${response.status}`);

    const reviews = await extractPeerReviews(await response.json());
    if (reviews.length) container.replaceChildren(...reviews.map(createServiceCard));

    if (status) {
      status.textContent = 'ORCID / WoS synced ↗';
      status.title = `${reviews.length} public peer-review activities synchronized from ORCID`;
    }
  } catch (error) {
    console.info('ORCID peer-review sync unavailable; using the saved activity list.', error);
  }
};

syncOrcidWorks();
syncOrcidReviews();

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
