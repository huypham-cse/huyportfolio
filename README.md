# Pham Huynh Gia Huy — portfolio

Personal research portfolio. Plain HTML, CSS and JavaScript, no build step.

- `index.html`, `styles.css`, `script.js`: the site
- `posts.json`: Notes & press entries (shown in the reader dialog)
- `DESIGN.md`: the design system (colours, type, layout, motion)
- `tools/fetch_posts.py`: adds a link preview to `posts.json`

After changing `styles.css` or `script.js`, bump the `?v=` date on them in `index.html` so browsers fetch the new files.

Run locally: `python -m http.server` and open http://localhost:8000 (posts need a server, not `file://`).
