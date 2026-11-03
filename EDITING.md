# Editing the website

This is a plain static website. There is no framework, database, package manager, or build step. Every visible page can be edited as ordinary text, including directly in GitHub's web editor.

## The shortest editing workflow

1. Open the repository on GitHub.
2. Select the file you want to change.
3. Click the pencil icon (**Edit this file**).
4. Change the text between the `EDIT:` comments.
5. Click **Commit changes**. GitHub Pages republishes the site automatically.

## Where to make each change

| Change | File | What to search for |
| --- | --- | --- |
| Homepage introduction | `index.html` | `EDIT: Homepage introduction` |
| Ongoing research list | `index.html` | `EDIT: Published fallback records and manually maintained ongoing research` |
| Peer-review activity | `index.html` | `EDIT: Public peer-review activity` |
| Profile, research areas, methods, and links | `index.html` | `EDIT: Short academic profile` |
| Web CV | `cv.html` | `EDIT: Web CV sections` |
| Downloadable CV | `assets/julian-ockelmann-cv.pdf` | Replace the file but keep this exact filename |
| Blog index | `writing.html` | `EDIT: Blog cards` |
| Full project summaries | `papers/` | One HTML file per project |
| Full research notes | `posts/` | One HTML file per note |
| Main colors and width | `assets/styles.css` | `EDIT: Core colors` |
| EEG colors and wave speeds | `assets/site.js` | `EDIT: EEG banner colors` |
| Brain logo | `assets/logo-brain.svg` | SVG vector file |

## Add a project summary

1. Duplicate an existing file in `papers/`.
2. Rename it with a short lowercase filename, for example `neural-alpha.html`.
3. Update its title, summary, citation, and links.
4. Add a corresponding project row to `index.html`.

Use relative links (`papers/example.html`, not `/papers/example.html`) so the site works both at `username.github.io` and inside a project repository.

## Add a research note

1. Duplicate `posts/speech-in-noise.html`.
2. Edit the title, description, date, and article text.
3. Add a card to `writing.html`.
4. The Blog link in the main navigation already points to `writing.html`.

## Replace the CV

Export the new CV as PDF and replace `assets/julian-ockelmann-cv.pdf`. Keeping the filename unchanged means the download button does not need to be edited.

The web CV in `cv.html` is separate and should be updated when publication or employment details change. Personal address, birth date, and telephone number are intentionally omitted from the public page.

## Add an inline manuscript

The readers stream remote PDFs from the publisher or preprint server; the manuscript files are not stored in this repository.

1. Confirm that the manuscript is openly licensed and that the publisher PDF loads inside an iframe.
2. On a project page, copy an existing `manuscript-reader` block and replace both the PDF source and publisher link.
3. In `cv.html`, copy a `Read inline` button and update `data-manuscript-url`, `data-publisher-url`, and `data-manuscript-title`.
4. Always retain the normal publisher link as a fallback because publishers can change their framing policy or PDF address.

Do not treat public web access alone as permission to label a manuscript open access. The SSRN record currently remains link-only for this reason, and ScienceDirect currently prevents its PDF from being framed by another site.

## Published, ongoing, and reviewer activity

The homepage separates research into two sources:

- **Published** refreshes automatically from the public ORCID works record. Only journal articles appear here. The saved rows in `index.html` are fallbacks for visitors whose browser blocks the live request.
- **Ongoing** is maintained manually in `index.html`, so submitted and in-preparation projects remain visible without being treated as publications.

Public Web of Science review records appear after they have been synced to ORCID. Each review row names the journal as well as the record source. The two saved review rows in `index.html` are fallbacks for visitors whose browser blocks the live request. The sync logic and journal-name lookup are in `assets/site.js`.

## Preview before publishing

Opening `index.html` directly is sufficient for most edits. For a closer preview of the published behavior, run this command from the website folder:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Recommended hosting: GitHub Pages

GitHub Pages is the best fit for the current site because every feature is static:

- HTML pages
- CSS layout and dark color palette
- JavaScript EEG animation
- SVG logo
- Downloadable PDF
- Remote publisher manuscript readers

No server-side code is required. For the cleanest address, publish from a repository named `julian-ockelmann.github.io`. A custom domain can be added later without changing the site.

If you later need a contact form, private content, a database, or a browser-based content-management system, consider moving to a platform with server-side functions or adding a dedicated service. None of those are needed for the current version.
