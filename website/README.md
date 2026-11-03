# PrimeSim — project page

Static project page for **PrimeSim: Generalist World Model for Long-Horizon Robot Simulation**.
Astro 6, no client-side framework, no runtime JS beyond the two small inline scripts
(robot tabs, BibTeX copy).

Layout is an editorial dark theme. Design lineage: [Roman Hauksson's academic Astro
template](https://github.com/RomanHauksson/academic-project-astro-template) (CC BY-SA 4.0)
for the build pipeline and GitHub Pages workflow; the page layout itself is custom,
inspired by [Clarity](https://shikun.io/projects/clarity) by Shikun Liu.

## Quick start

Requires Node.js 24+.

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # static output in dist/
npm run preview    # serve dist/ locally
npm run check      # astro check (types + templates)
```

## Structure

```
website/
├── src/pages/index.astro          # the whole page: copy, authors, tables, sections
├── src/components/
│   ├── ResearchFigure.astro       # <Image> → WebP, click-through to original PNG
│   └── ResearchTable.astro        # scrollable table with row/column semantics
├── src/styles/primesim.css        # all layout and responsive rules
├── src/assets/research/           # source figures from the paper
├── public/figures/                # original RL PDFs for the inline chart previews
├── public/favicon.svg
└── ../.github/workflows/astro.yml # GitHub Pages build + deploy
```

Images are imported through `astro:assets`, so the build emits WebP at ≤1800 px wide.
Source PNGs are the full-resolution paper figures and are what the "Open full size"
link points at — that is why `dist/` is ~60 MB while the first paint is ~1 MB.

## Editing

Everything visible on the page lives in `src/pages/index.astro`, top to bottom in the
same order as the rendered sections:

| Section | Anchor | What to edit |
|---|---|---|
| Header | — | wordmark, nav |
| Hero | `#main` | title, authors, affiliations, resource buttons |
| Zero-shot preview | — | hero figure + caption |
| Key metrics | — | three `<div>` blocks (30,110 h / 10 Hz / 100–200 steps) |
| Showcase | `#showcase` | video grid and hover previews, followed by few-shot and zero-shot transfer videos |
| Few-shot adaptation (within Showcase) | `#showcase` → `#transfer` | robot tab array, adaptation table |
| Zero-shot transfer (within Showcase) | `#showcase` → `#zero-shot` | always-visible before/after scene-transfer videos |
| Method | `#method` | three-stage curriculum, architecture, posttrain chain |
| Results | `#results` | WorldSimProbe, EWMBench, throughput, long-horizon and distillation metrics |
| Policy simulation (within Results) | `#results` → `#policy` | policy-evaluation and RL post-training tables, inline correlation / success-rate plots, original PDFs, five counterfactual clips |
| Cite | `#citation` | BibTeX string (currently provisional) |

Adding a figure: drop the PNG in `src/assets/research/` and use
`<Figure file="name.png" alt="…" caption="…" />`. Missing files render a visible
placeholder instead of failing the build. For PDF-derived figures, pass the
original PDF URL through the `pdf` prop to keep its link in the caption;
`wm_rl_*.png` are 2400px-wide previews rendered from the matching source PDFs.
The two RL figures share a `.policy-figures` grid after the policy tables:
correlation on the left, success rates on the right.
Screens up to 760px use one column. Both keep full-size and original PDF access.

Color modes: the header toggle switches between light and dark. The first visit
defaults to light regardless of the system preference; manual choices persist under `primesim-theme` in
localStorage. The inline head script applies the palette before the first paint,
and `src/styles/theme.css` holds the toggle styling and light palette overrides.
If storage is blocked, switching still works for the current page.

Motion preview: `src/styles/showcase-motion.css` and `src/scripts/showcase-motion.ts`
implement the masked wordmark entrance, three-view hero preview, and animated
robot tabs/panel heights. Showcase videos stay in the grid with hover enlargement;
clicking them does not open a player or fullscreen overlay. The hero clip is a
horizontal montage generated from `refine_demo/31.mp4` (also copied unchanged
as `public/videos/refined/demo-32.mp4`). Its three 256×192 crops are arranged
left to right as HEAD / LEFT HAND / RIGHT HAND in
`public/videos/hero-three-views-31.mp4`, with the original 10 FPS and 81 frames.
Media only autoplays
while visible and stays still under reduced motion unless a preview or scene-transfer
video is explicitly played. Poster images and the first robot comparison provide
a fallback without JavaScript. The hero poster lives in `public/videos/posters/`.

The main gallery uses all 45 videos from `refine_demo`, copied unchanged into
`public/videos/refined/` alongside WebP posters. Display order uses a fixed shuffle
in `index.astro`; Rollout 01–45 follow that order and stay stable across reloads. `src/data/refined-clips.json`
records the display order (numeric names first, then the
remaining filenames). The gallery has one layout without view-count categories.
Scene/camera transfer uses the four `zero-shot-*.mp4` clips, stored in
`public/videos/zero-shot/` with matching WebP posters; each shows the ground-truth
trajectory on the left and the generated rollout on the right. They appear under an
always-visible Zero-shot transfer heading, at the same level as Few-shot adaptation.
Each has its own play/pause button and pauses when it leaves the viewport.

Counterfactual action-control clips live in `public/videos/counterfactual/` as
`cf-01.mp4` … `cf-05.mp4` (256×256, 10 FPS, 5.8–10.5 s), copied from
`counterfactual/` in filename order with WebP posters. They sit in a
`.counterfactual-block` inside `#policy-figures`: five squares on one row, three per
row up to 1100px, two on phones. Clips autoplay only while visible, share one
"Pause all / Play all" control, and stay paused under reduced motion.

Few-shot comparison videos live in `public/videos/few-shot/{xarm,viper,umi}/`.
They are copied from `few-shot/few_shot_split{1,2,3}` respectively: each has
`ground_truth.mp4`, `primesim.mp4`, and `wan.mp4`, plus matching WebP posters.
`src/scripts/fewshot-videos.ts` starts the three videos together, corrects drift
against the ground-truth clock, and pauses hidden/offscreen panels. Each robot
has a shared play/pause control. On phones the three columns scroll horizontally;
these videos have no fullscreen or popup behavior.

## Deploy to GitHub Pages

1. Push the repository with `website/` and the root `.github/workflows/astro.yml`
   (do not commit `node_modules/`, `dist/`, `.astro/`, `.npm-cache/`).
2. Settings → Pages → Source: **GitHub Actions**.
3. Push to `main`, or run the workflow manually.

The workflow passes `--site` and `--base` from the Pages settings, so both
`https://user.github.io/repo/` and a root domain work. To rehearse a sub-path build
locally:

```sh
BASE_PATH=/primesim/ SITE_URL=https://example.github.io npm run build
npm run preview   # then open http://localhost:4321/primesim/
```

## Content provenance

Every number on the page comes from the paper source in `../paper/`. Verification
notes, wording boundaries, and the list of claims deliberately *not* made are in
[`NOTES.md`](NOTES.md).

## Not done yet

- arXiv, Code and Weights are marked pending until release URLs are confirmed.
- BibTeX is a provisional `@misc` entry with no year, venue, or DOI.
- No video or GIF exists in the project, so every result is shown as a static frame
  strip. Adding short clips would be the single biggest upgrade to this page.
- Canonical, Open Graph and Scholar URLs derive from Astro's configured site and base.
