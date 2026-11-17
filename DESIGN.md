# Design system — Gia Huy portfolio

Single source of truth: the `:root` tokens at the top of `styles.css`. Change a value there, never inline.

## Colour
| Token | Value | Use |
|---|---|---|
| `--paper` | `#fffff0` | page background |
| `--ink` | `#3b3835` | text, dark sections |
| `--muted` | `#757167` | secondary text |
| `--line` | `#d9d7c9` | hairlines, borders |
| `--blue` | `#0a3d91` | the one accent: labels, italic words, links, highlights |
| `--blue-soft` | 8% blue | hover washes |

| `--blue-light` | `#9db8ea` | the accent on dark surfaces (hero before power-on, contact) |
| `--night` | `#171614` | hero background before the output stage, chip bodies |

Rule: blue is an accent, not a fill. At most one blue italic phrase per heading.

## Type
- `--sans` Be Vietnam Pro (400/500/600): body, nav, labels.
- `--serif` Gelasio (Georgia's metric twin, chosen because Georgia breaks Vietnamese diacritics), Georgia as fallback, weight 400, tight tracking: every heading. Emphasis = *italic + blue*.
- Label style (`.label`): 11px, uppercase, 0.12em tracking, blue. Format `NN / SECTION`.

## Layout
- Each section: 220px sticky label column + content column, hairline on top, max width 1200px.
- Lists are hairline-separated rows (`.row`: date column + content), not cards.
- Placeholders use `.placeholder` (dashed border, muted text) so they are easy to find and replace.

## Motion
- `--mono` (system monospace): machine voice only — HUD readouts, hints, silk-screen text, footer bar.
- Motif: the chip. Logo (`assets/logo.svg`), hero board and the 3D board in the footer all use it.
- Hero: scroll-driven SVG "boot sequence" in five chapters (Power, Clock, Route, Compute, Output); dark until Output, then it flips to paper (`script.js`).
- Footer: CSS 3D board with an SVG copper layer; drag to spin (with inertia). The four LEDs are a 4-bit number shown on the OLED, SW1 counts up, U1 reboots.
- News: grouped under sticky year markers (`.year`). Scrollbars are thin and blue.
- Everything else: `.reveal` (fade + 24px rise, once) via IntersectionObserver.
- Easing `--ease`; durations 0.6–0.8s. `prefers-reduced-motion` disables time-based motion.

## Adding content
- News / awards / education: copy a `.row`.
- Project: copy an `<article class="project">`.
- Award: copy a `.row.award`; add `data-photo="assets/archive/x.jpg"` to give it a static thumbnail.
- Reader (`#reader`): a two-page spread, photo plate left, article right. Posts may add `"caption"`, `"gallery": [{src, cap}]`, and `"content"` items as text, `{"h": …}` or `{"li": […]}`.
- Paper: copy a `.pub` and remove the `placeholder` class.
- Blog post: add an entry to `posts.json` (`python tools/fetch_posts.py URL` adds a link preview; your own text goes in `"content"`).
- Portrait: `assets/portrait.jpg`. Links still to fill: search `href="#"`.
