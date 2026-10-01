# adnan-ab1r.github.io

A personal research-and-ventures site for Adnan Abir: civil engineering undergraduate at BUET, transport modelling with MATSim, founder of Thread Co.

Plain HTML, CSS and JavaScript. No build step, no framework, no dependencies — it runs on GitHub Pages exactly as it sits in this folder.

**Ground rule for the content:** every claim on the site should be checkable by a visitor — a conference programme, a repository, a live shop. Nothing that can't be verified goes in.

## Pages

| Page | What's on it |
|---|---|
| `index.html` | Dashboard: the simulation demo, a research snapshot, what I'm doing now, the Thread Co. spotlight, and live GitHub stats |
| `research.html` | The Dhaka MATSim scenario: how it's assembled, what's built, what's next, tools, and the MUM 2026 paper with BibTeX |
| `projects.html` | Projects I'm responsible for, plus every public repository, live from GitHub |
| `about.html` | Experience, education and contact |

**The simulation on the home page is a demo, not the Dhaka model.** It's a toy mobsim written from scratch for the page, on a synthetic grid city: agents hold a home → work plan, cars slow down as links fill (BPR), and after each simulated morning 15% of drivers re-route on the travel times they experienced. It's labelled as such on the page.

## Editing

Everything is rendered from one file: [`data/site.config.js`](data/site.config.js) — identity, now-list, research pipeline, publications, projects, experience, education, and the Thread Co. venture. Change that file and every page follows.

A few things worth knowing:

- `research.pipeline` draws the "how it's assembled" figure. An entry with `pending: true` renders dashed and marked *not done yet*.
- `github.toolchain` lists the forked repositories shown on the research page.
- `publications[].event` holds the conference date, venue and session; BibTeX is generated from these fields.
- Thread Co. product photos load directly from threadcoofficial.com, so renaming image folders there breaks them here.

## Preview locally

Open `index.html` in a browser. Everything works from `file://`, including the GitHub panel.

## Publish

The repo is `ADNAN-AB1R.github.io`, so pushing to `main` publishes to <https://adnan-ab1r.github.io>:

```bash
git add .
git commit -m "Update site"
git push
```

Then **Settings → Pages → Deploy from a branch**, `main`, `/ (root)` — set once. The live site refreshes about a minute after each push.

## Files

```
index.html  research.html  projects.html  about.html
assets/css/style.css     design tokens, layout, components
assets/js/app.js         shared layout + per-page rendering
assets/js/sim.js         the simulation demo (network, routing, BPR, iterations)
data/site.config.js      ← all content
```
