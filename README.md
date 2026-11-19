# Vice Sunset Cover Studio

[![make.fun entry](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![make.fun rank](https://make.fun/badge/gta6-cover-art-01/rohanajesika/gta6-cover-art-01/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![make.fun reward](https://make.fun/badge/gta6-cover-art-01/rohanajesika/gta6-cover-art-01/reward.svg)](https://make.fun/c/gta6-cover-art-01)

An offline web app that turns your own photo and caption into cover art in
the style of a GTA 6 poster: a multi-panel layout, bold sunset lettering and
a Vice City sunset or neon grade — exported as a PNG to share. Everything is
the app's own art and lettering; no Rockstar logo, artwork or font is used.
The fonts are Anton and Bebas Neue, both under the SIL Open Font License
(their licence texts sit beside them in `app/fonts/`).

## How to run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. No build step, no
network request: every file the page loads lives under `app/`, and your
photos are read on your own machine and never uploaded.

## How to use it

1. **Photos** — choose up to three photos from your machine, or press
   *Load sample photos* to try the app in one click.
2. **Panels & crop** — pick a panel, choose which photo fills it, drag the
   photo inside its panel to position it, use the zoom slider, *Fit* or
   *Fill*.
3. **Layout** — Hero Split, Triptych, or Tilted Snapshots.
4. **Grade** — Vice Sunset, Neon Nights, or Palm Noir.
5. **Caption** — write the title and subtitle; the lettering is drawn in
   Anton and Bebas Neue with a sunset title band, a low sun and palm
   silhouettes.
6. **Export** — pick Square 1080 x 1080, Portrait 1080 x 1350 or Wide
   1920 x 1080, then *Export PNG*. The preview shows exactly the PNG you
   get.

## Files

- `app/index.html`, `app/style.css` — the editor page and its styling.
- `app/src/main.js` — editor wiring: photos, crop, caption, export.
- `app/src/cover.js` — draws the cover: panels, grade, title block, grain.
- `app/src/panels.js` — the three panel layouts.
- `app/src/grades.js` — the three colour grades.
- `app/src/export.js` — renders and downloads the PNG at an exact size.
- `app/src/shots.js` — the `?shot=` scenes used for the entry screenshots.
- `app/samples/` — two sample photos made for make.fun, free to use.
- `main.ts` — the entry program: copies `app/` and `screenshots/` to the
  output directory and writes `dossier.json` (Node 22, standard library).
- `screenshots/` — the entry's screenshots, taken with the app itself.

## Licence

MIT — see `LICENSE`. The fonts in `app/fonts/` are under the SIL Open Font
License 1.1 (see `OFL-Anton.txt` and `OFL-BebasNeue.txt`).
