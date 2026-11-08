# Teardown drawings

How the home page uses the drawing (layout, loop, colour schemes, callouts,
what to edit for what) is in [`docs/home.md`](../../docs/home.md). This README
covers the model and the renderer.

The home page's animated console teardown is drawn from a 3D model with the
[teardown skill](https://github.com/jakubkrehel/skills) by Jakub Krehel
(MIT, see `LICENSE`). Its assets and scripts are vendored here.

| Path | What it is |
| --- | --- |
| `assets/`, `scripts/` | The skill: geometry helpers, the hidden-line renderer and its viewer. |
| `handheld/model.js` | The console: every part as a mesh, plus its printed marks (silkscreen, labels, the screen). |
| `handheld/drawing.json` | The model's entry for the skill's viewer. |
| `handheld/evidence.md` | Where the design comes from and what is invented. |

## Regenerate

```sh
pnpm generate:teardown
```

`scripts/generate-teardown.mjs` loads the model, renders each part alone with
the skill's renderer and writes, to `app/assets/teardown/`:

- `handheld.svg`: the drawing, one layer per part, with every colour scheme.
  It is fetched after hydration.
- `handheld.json`: the spread layout, the timeline, the callouts and the tag
  colours. It is imported by `app/components/home/Teardown.vue`.
- `handheld-placeholder.svg`: the assembled silhouette that SSR inlines.

The choreography (what moves when, and the paint order) lives in
`app/utils/teardownMotion.ts`. The component and the generator's proofs both
use it.

## Colour schemes

`PALETTES` in the generator holds four schemes (indigo, retro, graphite,
clear), all shipped in the one drawing. What each field means, how the page
picks one and how to add another: [`docs/home.md`](../../docs/home.md#colour-schemes).

## Check a change

```sh
# Layered drawing beside the true render, every 250 ms of the loop
node scripts/generate-teardown.mjs --proof /tmp/proof

# Stills as the page shows them at 2× (one per palette; PALETTE=<name> for one)
PROOF_WIDTH=900 node scripts/generate-teardown.mjs --proof /tmp/stills --moments 0,8500 --still

# Also outline the room each callout tag needs on a narrow screen
TAG_ROOM=1 PROOF_WIDTH=900 node scripts/generate-teardown.mjs --proof /tmp/stills --moments 8500 --still

# Every palette side by side (the sheet in docs/home.md)
node scripts/generate-teardown.mjs --sheet /tmp/home-palettes.png
```

The generator stops with an error when:

- two callout tags would overlap at their largest size (`TAG_ROOM`), or
- the timeline disagrees with `teardownMotion.ts`.

To turn and explode the model in the skill's interactive viewer, build it
and open the page it writes. The viewer embeds packages this project does
not depend on, so install them without saving first:

```sh
pnpm add --no-save @fontsource-variable/inter jspdf svg2pdf.js
node tools/teardown/scripts/build-viewer.cjs tools/teardown/handheld/drawing.json /tmp/handheld/index.html
```
