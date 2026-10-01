/*
 * Renders every page from window.SITE (data/site.config.js).
 * Each page sets <body data-page="home|research|projects|about">;
 * the layout (masthead, nav, footer) is shared, the sections are not.
 */
(function () {
  "use strict";

  const S = window.SITE || {};
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const fmtInt = (n) => Math.round(n).toLocaleString("en-US");
  const ext = (url) => (/^https?:/.test(url) ? ' target="_blank" rel="noopener"' : "");
  const taka = (n) => "৳" + fmtInt(n);
  const page = document.body.dataset.page || "home";

  const PAGES = [
    { page: "home", href: "index.html", label: "Dashboard" },
    { page: "research", href: "research.html", label: "Research" },
    { page: "projects", href: "projects.html", label: "Projects" },
    { page: "about", href: "about.html", label: "About" },
  ];
  const LINK_DEFS = [
    ["email", "Email", (v) => "mailto:" + v],
    ["github", "GitHub"], ["orcid", "ORCID"], ["linkedin", "LinkedIn"], ["cv", "CV"],
  ];
  const STATUS_LABEL = { live: "Live", building: "Building", exited: "Exited", paused: "Paused", "in progress": "In progress" };
  const statusChip = (s) => `<span class="chip" data-status="${esc(s)}"><i aria-hidden="true"></i>${STATUS_LABEL[s] || esc(s)}</span>`;

  // ── Shared layout ────────────────────────────────────────────
  function profileLinks() {
    const L = S.links || {};
    return LINK_DEFS.filter(([k]) => L[k])
      .map(([k, label, fn]) => { const href = fn ? fn(L[k]) : L[k]; return `<li><a href="${esc(href)}"${ext(href)}>${label}</a></li>`; })
      .join("");
  }

  function renderLayout() {
    if (S.name) document.title = page === "home" ? `${S.name} · Research & ventures` : `${PAGES.find((p) => p.page === page).label} · ${S.name}`;
    const initials = S.initials || String(S.name || "").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    const roles = (S.roles || []).map(esc).join('<span aria-hidden="true"> / </span>');
    const home = page === "home";
    const mast = $("masthead");
    if (mast) {
      mast.className = "masthead" + (home ? "" : " compact");
      mast.innerHTML = `
        <div class="mast-main">
          <div class="id">
            <a class="shield" href="index.html" aria-label="${esc(S.name || "Home")}">${esc(initials)}</a>
            <div>
              <${home ? "h1" : "p"} id="id-name">${esc(S.name || "")}</${home ? "h1" : "p"}>
              <p class="roles">${roles}</p>
            </div>
          </div>
          ${home && S.tagline ? `<p class="tagline">${esc(S.tagline)}</p>` : ""}
        </div>
        <div class="mast-side">
          ${S.status && S.status.label ? `<p class="status" data-state="${esc(S.status.state || "good")}"><span class="status-dot" aria-hidden="true"></span>${esc(S.status.label)}</p>` : ""}
          <nav aria-label="Profiles"><ul class="links">${profileLinks()}</ul></nav>
        </div>`;
    }
    const nav = $("nav");
    if (nav) {
      nav.innerHTML = `<ul>${PAGES.map((p) =>
        `<li><a href="${p.href}"${p.page === page ? ' aria-current="page"' : ""}>${p.label}</a></li>`).join("")}</ul>`;
    }
    const foot = $("foot");
    if (foot) {
      foot.innerHTML =
        `<span>© ${new Date().getFullYear()} ${esc(S.name || "")} · ${esc(S.location || "")}</span>` +
        `<span>Static site on GitHub Pages · content lives in <code>data/site.config.js</code></span>`;
    }
  }

  // ── Publications ─────────────────────────────────────────────
  function bibtex(p) {
    const clean = (s) => String(s || "").replace(/[^A-Za-z]/g, "").toLowerCase();
    const first = (p.authors && p.authors[0]) || "anon";
    const word = (p.title || "").split(/\s+/).find((w) => clean(w).length > 3) || "paper";
    const key = clean(first.split(/\s+/).pop()) + p.year + clean(word);
    const kind = { journal: "article", conference: "inproceedings", preprint: "misc", thesis: "mastersthesis" }[String(p.type || "").toLowerCase()] || "misc";
    const venueField = { article: "journal", inproceedings: "booktitle", misc: "howpublished", mastersthesis: "school" }[kind];
    const fields = [
      ["title", `{${p.title}}`],
      ["author", (p.authors || []).join(" and ")],
      [venueField, p.venue],
      ["address", (p.event || {}).place],
      ["year", p.year],
      ["doi", p.doi],
      ["url", p.url],
    ].filter(([, v]) => v);
    return `@${kind}{${key},\n${fields.map(([k, v]) => `  ${k.padEnd(10)}= {${v}}`).join(",\n")}\n}`;
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (_) { /* fall through */ }
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (_) { ok = false; }
    ta.remove();
    return ok;
  }

  function pubCard(p, i) {
    const me = S.me || "";
    const ev = p.event || {};
    const authors = (p.authors || []).map((a) => (a === me ? `<span class="me">${esc(a)}</span>` : esc(a))).join(", ");
    const href = p.url || (p.doi ? "https://doi.org/" + p.doi : "");
    const title = href ? `<a href="${esc(href)}"${ext(href)}>${esc(p.title)}</a>` : esc(p.title);
    return `<article class="pub-full">
      <div class="pub-top">
        <span class="pub-year">${esc(p.year)}</span>
        ${p.status ? `<span class="type-badge">${esc(p.status)}</span>` : ""}
      </div>
      <h3 class="pub-title">${title}</h3>
      <p class="pub-authors">${authors}</p>
      <p class="pub-venue"><em>${esc(p.venue)}</em></p>
      ${ev.date || ev.place || ev.session ? `<dl class="pub-event">
        ${ev.date ? `<div><dt>Date</dt><dd>${esc(ev.date)}</dd></div>` : ""}
        ${ev.place ? `<div><dt>Venue</dt><dd>${esc(ev.place)}</dd></div>` : ""}
        ${ev.session ? `<div><dt>Session</dt><dd>${esc(ev.session)}</dd></div>` : ""}
      </dl>` : ""}
      <div class="pub-actions">
        <button type="button" class="btn" id="bib-${i}" data-bib="${i}">Copy BibTeX</button>
        ${ev.url ? `<a class="btn" href="${esc(ev.url)}"${ext(ev.url)}>Conference programme</a>` : ""}
      </div>
    </article>`;
  }

  function wirePublications(host) {
    const pubs = S.publications || [];
    host.innerHTML = pubs.map(pubCard).join("");
    host.addEventListener("click", async (e) => {
      const t = e.target.closest("[data-bib]");
      if (!t) return;
      const ok = await copyText(bibtex(pubs[Number(t.dataset.bib)]));
      t.textContent = ok ? "Copied" : "Copy failed";
      if (ok) t.setAttribute("data-copied", "");
      const st = $("copy-status");
      if (st) st.textContent = ok ? "BibTeX copied to clipboard" : "Could not copy; your browser blocked clipboard access.";
      setTimeout(() => { t.textContent = "Copy BibTeX"; t.removeAttribute("data-copied"); }, 1600);
    });
  }

  // ── Venture spotlight (Thread Co.) ───────────────────────────
  function ventureSpotlight(v) {
    const t = v.theme || {};
    const vars = [["--tc-deep", t.deep], ["--tc-mid", t.mid], ["--tc-accent", t.accent], ["--tc-ice", t.ice]]
      .filter(([, x]) => x).map(([k, x]) => `${k}:${esc(x)}`).join(";");
    const links = (v.links || []).map((l, i) =>
      `<a class="${i ? "tc-link" : "tc-shop"}" href="${esc(l.url)}"${ext(l.url)}>${esc(l.label)}${i ? "" : " ↗"}</a>`).join("");
    const cats = (v.categories || []).map((c) => `<a href="${esc(c.url)}"${ext(c.url)}>${esc(c.label)}</a>`).join("");
    const products = (v.products || []).map((p) => {
      const href = p.url || v.url || "";
      return `<li class="tc-item"><a href="${esc(href)}"${ext(href)}>
        <span class="tc-img">${p.badge ? `<span class="tc-badge">${esc(p.badge)}</span>` : ""}<img src="${esc(p.img)}" alt="${esc(p.name)}" width="300" height="400" loading="lazy"></span>
        <span class="tc-pname">${esc(p.name)}</span>
        <span class="tc-meta"><span>${esc(p.category)}</span><span class="tc-price">${p.was ? `<s>${taka(p.was)}</s> ` : ""}${taka(p.price)}</span></span>
      </a></li>`;
    }).join("");
    const facts = (v.facts || []).map(([k, val]) => `<div><dt>${esc(k)}</dt><dd>${esc(val)}</dd></div>`).join("");
    const name = v.url ? `<a href="${esc(v.url)}"${ext(v.url)}>${esc(v.name)}</a>` : esc(v.name);
    return `<article class="tc" style="${vars}">
      <div class="tc-head">
        <div class="tc-brand">
          <div class="tc-kicker">${statusChip(v.status)}<span>${esc(v.kind || "")}${v.since ? " · since " + esc(v.since) : ""}</span></div>
          <h3 class="tc-name">${name}</h3>
          ${v.tagline ? `<p class="tc-tagline">${esc(v.tagline)}</p>` : ""}
        </div>
        <div class="tc-actions">${links}</div>
      </div>
      <div class="tc-intro">
        ${v.blurb ? `<p class="tc-blurb">${esc(v.blurb)}</p>` : ""}
        ${v.role ? `<p class="tc-role">${esc(v.role)}</p>` : ""}
      </div>
      ${products ? `<div class="tc-shelf">
        <div class="tc-shelf-head"><h4 class="sub">${esc(v.shelfTitle || "From the shop")}</h4>${cats ? `<nav class="tc-cats" aria-label="${esc(v.name)} categories">${cats}</nav>` : ""}</div>
        <ul class="tc-grid">${products}</ul>
        ${v.pricesAsOf ? `<p class="tc-note">Prices as listed on the shop in ${esc(v.pricesAsOf)}; see the shop for current prices and stock.</p>` : ""}
      </div>` : ""}
      ${facts || v.quote ? `<div class="tc-foot">
        ${facts ? `<dl class="tc-facts">${facts}</dl>` : ""}
        ${v.quote ? `<blockquote class="tc-quote">${esc(v.quote)}</blockquote>` : ""}
      </div>` : ""}
    </article>`;
  }

  // ── GitHub (public API, no token, cached 1h) ────────────────
  const TTL = 3600 * 1000;
  function relTime(iso) {
    const d = (Date.now() - new Date(iso).getTime()) / 86400000;
    if (d < 1) return "today";
    if (d < 30) return Math.floor(d) + "d ago";
    if (d < 365) return Math.floor(d / 30) + "mo ago";
    return Math.floor(d / 365) + "y ago";
  }
  const clock = (ms) => new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  async function ghFetch(url) {
    const r = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
    if (!r.ok) {
      throw new Error(r.status === 403 || r.status === 429 ? "rate limit reached (60 requests/hour without sign-in)"
        : r.status === 404 ? "that username doesn't exist" : "HTTP " + r.status);
    }
    return r.json();
  }

  const repoItem = (r) => `<li>
    <a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.name)}</a>
    ${r.desc ? `<p>${esc(r.desc)}</p>` : ""}
    <div class="repo-meta">${r.lang ? `<span>${esc(r.lang)}</span>` : ""}<span>updated ${relTime(r.pushed)}</span>${r.stars ? `<span>★ ${fmtInt(r.stars)}</span>` : ""}</div>
  </li>`;

  function renderGitHubPanel(data, note) {
    const host = $("gh-body");
    if (!host) return;
    const g = S.github || {};
    const exclude = new Set((g.exclude || []).map((x) => x.toLowerCase()));
    const own = data.repos.filter((r) => !r.fork && !exclude.has(r.name.toLowerCase()));
    const u = data.user;
    const langs = {};
    own.forEach((r) => { if (r.lang) langs[r.lang] = (langs[r.lang] || 0) + 1; });
    const rows = Object.entries(langs).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const max = Math.max(1, ...rows.map(([, n]) => n));
    const top = own.slice().sort((a, b) => new Date(b.pushed) - new Date(a.pushed)).slice(0, g.maxRepos || 6);

    host.innerHTML = `<div class="gh">
      <div class="gh-left">
      <div class="gh-profile">
        <img src="${esc(u.avatar)}" alt="" width="40" height="40" loading="lazy">
        <div><a href="${esc(u.url)}" target="_blank" rel="noopener">${esc(u.name || u.login)}</a><span>@${esc(u.login)}</span></div>
      </div>
      <dl class="gh-stats">
        <div><dt>Repos</dt><dd>${fmtInt(u.public_repos)}</dd></div>
        <div><dt>Own</dt><dd>${fmtInt(own.length)}</dd></div>
        <div><dt>Forks</dt><dd>${fmtInt(data.repos.length - own.length)}</dd></div>
      </dl>
      ${rows.length ? `<div>
        <h3 class="sub">Languages · repos</h3>
        <ul class="bars" aria-label="Repositories by primary language">
          ${rows.map(([name, n]) => `<li title="${esc(name)}: ${n} repositories"><span class="lb">${esc(name)}</span><span class="tr"><i style="width:${(n / max) * 100}%"></i></span><span class="ct">${n}</span></li>`).join("")}
        </ul></div>` : ""}
      </div>
      <div class="gh-right">
        <div><h3 class="sub">Recently updated</h3><ul class="repos">${top.map(repoItem).join("")}</ul></div>
        <p class="gh-note">${note}</p>
      </div>
    </div>`;
  }

  function renderRepoLists(data) {
    const own = $("repo-list");
    if (own) {
      const hidden = new Set(((S.github || {}).exclude || []).map((x) => x.toLowerCase()));
      const list = data.repos.filter((r) => !r.fork && !hidden.has(r.name.toLowerCase()))
        .sort((a, b) => new Date(b.pushed) - new Date(a.pushed));
      own.innerHTML = list.length ? list.map(repoItem).join("") : `<li class="muted">No public repositories found.</li>`;
    }
    const tool = $("toolchain");
    if (tool) {
      const names = new Set(((S.github || {}).toolchain || []).map((n) => n.toLowerCase()));
      const list = data.repos.filter((r) => names.has(r.name.toLowerCase()));
      tool.innerHTML = list.map(repoItem).join("");
    }
  }

  async function initGitHub() {
    const targets = $("gh-body") || $("repo-list") || $("toolchain");
    if (!targets) return;
    const user = ((S.github || {}).username || "").trim();
    const meta = $("gh-meta");
    if (meta) meta.textContent = user ? "@" + user : "";
    if (!user) return;
    const key = "gh:" + user.toLowerCase();
    let cached = null;
    try { cached = JSON.parse(localStorage.getItem(key) || "null"); } catch (_) { cached = null; }
    const paint = (d, note) => { renderGitHubPanel(d, note); renderRepoLists(d); };
    if (cached && Date.now() - cached.at < TTL) { paint(cached, `From api.github.com · fetched ${clock(cached.at)}, refreshes hourly`); return; }
    if (cached) paint(cached, `Refreshing… showing data from ${clock(cached.at)}`);
    try {
      const base = "https://api.github.com/users/" + encodeURIComponent(user);
      const [u, repos] = await Promise.all([ghFetch(base), ghFetch(base + "/repos?per_page=100&sort=pushed")]);
      const data = {
        at: Date.now(),
        user: { login: u.login, name: u.name, avatar: u.avatar_url, url: u.html_url, public_repos: u.public_repos, followers: u.followers },
        repos: repos.map((r) => ({ name: r.name, desc: r.description, url: r.html_url, stars: r.stargazers_count, lang: r.language, fork: r.fork, pushed: r.pushed_at })),
      };
      try { localStorage.setItem(key, JSON.stringify(data)); } catch (_) { /* storage unavailable */ }
      paint(data, `Live from api.github.com · fetched ${clock(data.at)}`);
    } catch (err) {
      if (cached) paint(cached, `GitHub didn't respond (${esc(err.message)}). Showing data from ${clock(cached.at)}.`);
      else if ($("gh-body")) $("gh-body").innerHTML = `<p class="gh-error">Couldn't load <code>@${esc(user)}</code> from GitHub: ${esc(err.message)}.</p>`;
    }
  }

  // ── Page: home ───────────────────────────────────────────────
  function renderHome() {
    const R = S.research || {};
    $("now-loc").textContent = S.location || "";
    $("now-list").innerHTML = (S.now || []).map((t) => `<li>${esc(t)}</li>`).join("");

    $("snap-title").textContent = R.title || "Research";
    $("snap-status").innerHTML = R.status ? statusChip(R.status.toLowerCase()) : "";
    $("snap-summary").textContent = R.summary || "";
    $("snap-built").innerHTML = (R.built || []).map((t) => `<li>${esc(t)}</li>`).join("");
    $("snap-next").innerHTML = (R.next || []).map((t) => `<li>${esc(t)}</li>`).join("");
    const p = (S.publications || [])[0];
    $("snap-paper").innerHTML = p
      ? `<a href="research.html">${esc(p.title)}</a><span>${esc(p.venue)}${p.event && p.event.date ? " · " + esc(p.event.date) : ""}</span>`
      : "";

    const v = S.ventures || [];
    const active = v.filter((x) => x.status === "live" || x.status === "building").length;
    $("ventures-meta").textContent = v.length === 1 ? (active ? "1 active" : "1 venture") : `${active} active · ${v.length} total`;
    $("ventures").innerHTML = v.map((x) => (x.products && x.products.length) ? ventureSpotlight(x) : "").join("");

    if (window.MobsimToy) window.MobsimToy.mount(S.sim || {});
  }

  // ── Page: research ───────────────────────────────────────────
  function renderResearch() {
    const R = S.research || {};
    $("research-lede").textContent = R.lede || "";
    $("scenario-title").textContent = R.title || "";
    $("scenario-status").innerHTML = R.status ? statusChip(R.status.toLowerCase()) : "";
    $("scenario-summary").textContent = R.summary || "";
    $("pipeline").innerHTML = (R.pipeline || []).map((s) => `<li${s.pending ? ' class="pending"' : ""}>
      <span class="pipe-in">${esc(s.in)}</span>
      <span class="pipe-arrow" aria-hidden="true">→</span>
      <span class="pipe-tool">${esc(s.tool)}</span>
      <span class="pipe-arrow" aria-hidden="true">→</span>
      <span class="pipe-out">${esc(s.out)}</span>
      ${s.pending ? '<span class="pipe-flag">not done yet</span>' : ""}
    </li>`).join("");
    $("built").innerHTML = (R.built || []).map((t) => `<li>${esc(t)}</li>`).join("");
    $("next").innerHTML = (R.next || []).map((t) => `<li>${esc(t)}</li>`).join("");
    $("collab").textContent = R.collaboration || "";
    $("tools-table").innerHTML = (R.tools || []).map((t) => `<tr>
      <td>${t.url ? `<a href="${esc(t.url)}"${ext(t.url)}>${esc(t.name)}</a>` : esc(t.name)}</td>
      <td>${esc(t.use)}</td></tr>`).join("");
    const ref = $("reference");
    if (ref) ref.innerHTML = (R.reference || []).map((t) => `<li>${esc(t)}</li>`).join("");
    wirePublications($("pubs"));
  }

  // ── Page: projects ───────────────────────────────────────────
  function renderProjects() {
    $("project-list").innerHTML = (S.projects || []).map((p) => `<article class="proj">
      <div class="proj-top">
        <h2 class="proj-name">${esc(p.name)}</h2>
        ${p.status ? statusChip(p.status) : ""}
      </div>
      <p class="proj-blurb">${esc(p.blurb)}</p>
      <ul class="stack">${(p.tech || []).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
      <div class="proj-links">${(p.links || []).map((l) => `<a class="btn" href="${esc(l.url)}"${ext(l.url)}>${esc(l.label)}</a>`).join("")}</div>
    </article>`).join("");
    const note = $("confidential-note");
    if (note) note.textContent = S.confidentialNote || "";
  }

  // ── Page: about ──────────────────────────────────────────────
  function renderAbout() {
    $("about-lede").textContent = S.tagline || "";
    $("experience").innerHTML = (S.experience || []).map((x) => `<li>
      <div class="xp-head">
        <h3 class="xp-title">${esc(x.title)}</h3>
        <span class="xp-period">${esc(x.period)}</span>
      </div>
      <p class="xp-org">${esc(x.org)}</p>
      <ul class="xp-bullets">${(x.bullets || []).map((b) => `<li>${esc(b)}</li>`).join("")}</ul>
    </li>`).join("");
    $("education").innerHTML = (S.education || []).map((e) => `<li>
      <div class="edu-top"><h3 class="edu-qual">${esc(e.qualification)}</h3>${e.detail ? `<span class="edu-detail">${esc(e.detail)}</span>` : ""}</div>
      <p class="edu-inst">${esc(e.institution)}${e.place ? ` · ${esc(e.place)}` : ""}</p>
    </li>`).join("");
    const L = S.links || {};
    $("contact-list").innerHTML = LINK_DEFS.filter(([k]) => L[k]).map(([k, label, fn]) => {
      const href = fn ? fn(L[k]) : L[k];
      return `<li><span class="c-label">${label}</span><a href="${esc(href)}"${ext(href)}>${esc(L[k].replace(/^https?:\/\//, ""))}</a></li>`;
    }).join("") + (S.location ? `<li><span class="c-label">Based in</span><span>${esc(S.location)}</span></li>` : "");
  }

  // ── Boot ─────────────────────────────────────────────────────
  function boot() {
    renderLayout();
    if (page === "home") renderHome();
    else if (page === "research") renderResearch();
    else if (page === "projects") renderProjects();
    else if (page === "about") renderAbout();
    initGitHub();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
