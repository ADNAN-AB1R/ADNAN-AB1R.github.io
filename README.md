# Personal dashboard

A mission-control-style personal site for a transport modeller, MATSim researcher, and founder. It is plain HTML, CSS, and JS with no build step, so it runs on GitHub Pages as is.

**Panels**

- **Live simulation**: a toy MATSim-style morning peak. Agents route across a road network, cars load the links (colored by volume/capacity), and a telemetry rail tracks the clock, agents en route, car speed, and modal split. Hover over any agent or link to inspect it.
- **Ventures**: a venture with `products` (like Thread Co.) gets a full spotlight in its own brand colors and serif, with a product shelf, facts, and shop links. Other ventures show as compact rows.
- **Research**: focus areas, tool stack, and the MATSim scenarios you maintain.
- **Publications explorer**: search, year and topic filters, and one-click BibTeX, generated from your data.
- **GitHub**: repos, stars, and languages pulled live from the public GitHub API, cached for an hour.

## Make it yours

Everything is rendered from **one file**: [`data/site.config.js`](data/site.config.js).

1. Replace the sample name, links, ventures, scenarios, and publications.
2. Set `github.username` to your GitHub username. It is set to `matsim-org` for now so the panel shows live data.
3. Set `sample: false` to remove the "sample content" banner.

## Preview locally

Open `index.html` in a browser. Everything works from `file://`.

## Publish on GitHub Pages

**As your main site (`https://<username>.github.io`)**

1. Create a public repo named exactly `<username>.github.io`.
2. Push these files to its `main` branch:
   ```bash
   git init
   git add .
   git commit -m "Personal dashboard"
   git branch -M main
   git remote add origin https://github.com/<username>/<username>.github.io.git
   git push -u origin main
   ```
3. In the repo, open **Settings → Pages**. Set the source to *Deploy from a branch* with `main` and `/ (root)`.
4. Your site is live at `https://<username>.github.io` within a minute or two.

**As a project site (`https://<username>.github.io/<repo>`)**: follow the same steps with any repo name.

## Files

```
index.html               page structure
assets/css/style.css     design tokens + layout
assets/js/sim.js         the agent-based simulation (network, routing, BPR congestion)
assets/js/app.js         renders config, publications explorer, GitHub panel
data/site.config.js      ← your content
```
