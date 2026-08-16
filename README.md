# Julian Ockelmann — academic portfolio

A zero-dependency static portfolio and blog starter. It works on GitHub Pages without a theme, package manager, or build step.

For day-to-day changes, see [`EDITING.md`](EDITING.md). It maps every visible section to the exact file and edit marker.

## Publish on GitHub Pages

1. Create a repository named `julian-ockelmann.github.io` (or use the existing repository).
2. Copy the contents of this folder into the repository root.
3. In GitHub, open **Settings → Pages**.
4. Set **Source** to **Deploy from a branch**, choose `main` and `/ (root)`, then save.

The site works both at a user URL (`username.github.io`) and in a project repository (`username.github.io/repository-name`) because all internal links are relative.

## Update content

- Homepage and project cards: `index.html`
- CV: `cv.html`
- Downloadable CV: `assets/julian-ockelmann-cv.pdf`
- Blog index: `writing.html`
- Full articles: `posts/`
- Project summaries: `papers/`
- Colors, type, and layout: `assets/styles.css`

To add a post, duplicate `posts/speech-in-noise.html`, change the title and article content, then add a matching card in `writing.html` and (optionally) a row on `index.html`.

## Before publishing

- Verify publication statuses and dates imported from the current public CV.
- Change or remove the sample blog date if needed.
- Add links to current code or datasets for WOMBAT when available.
- Test email and external profile links.

## Logo and banner

- `assets/logo-brain.svg` is the centered vector brain mark used in the header and favicon.
- The full-width homepage banner is drawn by JavaScript in `assets/site.js`. It shows the classic delta, theta, alpha, beta, and gamma EEG bands, reacts gently to the pointer, respects reduced-motion preferences, and has no external image path that can break.

## Local preview

Run a small local server from this folder:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Performance

The site intentionally has no framework or external runtime dependencies. The EEG banner:

- renders at a maximum of 30 frames per second;
- pauses when it leaves the viewport or the browser tab is hidden;
- calculates each waveform once per frame and reuses it for the glow and primary stroke;
- caps high-density canvas scaling to avoid unnecessary GPU work;
- respects the operating system's reduced-motion preference.

Below-the-fold homepage sections use `content-visibility` so the browser can defer their initial rendering. Keep source files readable rather than manually minifying them; GitHub Pages handles normal HTTP compression.
