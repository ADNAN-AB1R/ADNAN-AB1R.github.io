/*
 * Renders the dashboard from window.SITE (data/site.config.js):
 * identity, now, ventures, research, publications explorer, GitHub panel.
 */
(function () {
  "use strict";

  const S = window.SITE || {};
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const fmtInt = (n) => Math.round(n).toLocaleString("en-US");
  const ext = (url) => (/^https?:/.test(url) ? ' target="_blank" rel="noopener"' : "");

  // ── Identity ─────────────────────────────────────────────────
  function renderIdentity() {
    if (S.name) document.title = `${S.name} · Research & ventures`;
    $("sample-banner").hidden = !S.sample;
    const initials = S.initials || String(S.name || "").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    $("id-initials").textContent = initials;
    $("id-name").textContent = S.name || "";
    $("id-roles").innerHTML = (S.roles || []).map(esc).join('<span aria-hidden="true"> / </span>');
    $("id-tagline").textContent = S.tagline || "";

    const status = $("id-status");
    if (S.status && S.status.label) {
      status.dataset.state = S.status.state || "good";
      $("id-status-label").textContent = S.status.label;
    } else status.hidden = true;

    const L = S.links || {};
    const defs = [
      ["email", "Email", (v) => "mailto:" + v],
      ["github", "GitHub"], ["scholar", "Scholar"], ["orcid", "ORCID"], ["linkedin", "LinkedIn"], ["cv", "CV"],
    ];
    $("id-links").innerHTML = defs
      .filter(([k]) => L[k])
      .map(([k, label, fn]) => { const href = fn ? fn(L[k]) : L[k]; return `<li><a href="${esc(href)}"${ext(href)}>${label}</a></li>`; })
      .join("");

    $("foot").innerHTML =
      `<span>© ${new Date().getFullYear()} ${esc(S.name || "")}</span>` +
      `<span>Static site on GitHub Pages · content lives in <code>data/site.config.js</code></span>`;
  }

  // ── Now, ventures, research ─────────────────────────────────
  function renderNow() {
    $("now-loc").textContent = S.location || "";
    $("now-list").innerHTML = (S.now || []).map((t) => `<li>${esc(t)}</li>`).join("");
  }

  const STATUS_LABEL = { live: "Live", building: "Building", exited: "Exited", paused: "Paused" };
  const statusChip = (s) => `<span class="chip" data-status="${esc(s)}"><i aria-hidden="true"></i>${STATUS_LABEL[s] || esc(s)}</span>`;
  const taka = (n) => "৳" + fmtInt(n);

  // A venture with products gets the full spotlight, in its own brand colours.
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

  function ventureRow(x) {
    const name = x.url ? `<a class="v-name" href="${esc(x.url)}"${ext(x.url)}>${esc(x.name)}</a>` : `<span class="v-name">${esc(x.name)}</span>`;
    return `<li>
      <div class="v-top">${name}${statusChip(x.status)}</div>
      <div class="v-role">${esc(x.role)}${x.since ? " · since " + esc(x.since) : ""}</div>
      <p class="v-blurb">${esc(x.blurb)}</p>
    </li>`;
  }

  function renderVentures() {
    const v = S.ventures || [];
    const active = v.filter((x) => x.status === "live" || x.status === "building").length;
    $("ventures-meta").textContent = v.length === 1 ? `${active ? "1 active" : "1 venture"}` : `${active} active · ${v.length} total`;
    const spot = v.filter((x) => x.products && x.products.length);
    const rows = v.filter((x) => !(x.products && x.products.length));
    $("ventures").innerHTML =
      spot.map(ventureSpotlight).join("") +
      (rows.length ? `<ul class="ventures panel-body">${rows.map(ventureRow).join("")}</ul>` : "");
  }

  function renderResearch() {
    const r = S.research || {};
    $("focus").innerHTML = (r.focus || []).map((t) => `<li>${esc(t)}</li>`).join("");
    $("stack").innerHTML = (r.stack || []).map((t) => `<li>${esc(t)}</li>`).join("");
    document.querySelector(".scen").closest(".table-wrap").hidden = !(r.scenarios || []).length;
    $("scenarios").innerHTML = (r.scenarios || []).map((s) => `<tr>
      <td>${esc(s.name)}</td>
      <td class="num">${esc(s.sample)}</td>
      <td class="num">${s.agents != null ? fmtInt(s.agents) : ""}</td>
      <td class="num">${s.links != null ? fmtInt(s.links) : ""}</td>
      <td class="num">${s.iterations != null ? fmtInt(s.iterations) : ""}</td>
    </tr>`).join("");
  }

  // ── Publications explorer ───────────────────────────────────
  function bibtex(p) {
    const clean = (s) => String(s || "").replace(/[^A-Za-z]/g, "").toLowerCase();
    const first = (p.authors && p.authors[0]) || "anon";
    const word = (p.title || "").split(/\s+/).find((w) => clean(w).length > 3) || "paper";
    const key = clean(first.split(/\s+/).pop()) + p.year + clean(word);
    const kind = { journal: "article", conference: "inproceedings", preprint: "misc", thesis: "mastersthesis" }[p.type] || "misc";
    const venueField = { article: "journal", inproceedings: "booktitle", misc: "howpublished", mastersthesis: "school" }[kind];
    const fields = [
      ["title", `{${p.title}}`],
      ["author", (p.authors || []).join(" and ")],
      [venueField, p.venue],
      ["year", p.year],
      ["doi", p.doi],
      ["url", p.url],
    ].filter(([, v]) => v);
    return `@${kind}{${key},\n${fields.map(([k, v]) => `  ${k.padEnd(12)}= {${v}}`).join(",\n")}\n}`;
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

  function initPublications() {
    const pubs = (S.publications || [])
      .map((p) => Object.assign({}, p, { type: String(p.type || "").toLowerCase() }))
      .sort((a, b) => b.year - a.year);
    const me = S.me || "";
    const state = { q: "", year: "all", topic: "all" };

    const years = [...new Set(pubs.map((p) => p.year))].sort((a, b) => b - a);
    const topicCount = {};
    pubs.forEach((p) => (p.topics || []).forEach((t) => { topicCount[t] = (topicCount[t] || 0) + 1; }));
    const topics = Object.keys(topicCount).sort((a, b) => topicCount[b] - topicCount[a] || a.localeCompare(b));

    function chips() {
      const yc = (y) => pubs.filter((p) => p.year === y).length;
      $("pub-years").innerHTML =
        `<button type="button" id="year-all" data-year="all" aria-pressed="${state.year === "all"}">All years</button>` +
        years.map((y) => `<button type="button" id="year-${y}" data-year="${y}" aria-pressed="${String(state.year) === String(y)}">${y}<small>${yc(y)}</small></button>`).join("");
      $("pub-topics").innerHTML =
        `<button type="button" id="topic-all" data-topic="all" aria-pressed="${state.topic === "all"}">All topics</button>` +
        topics.map((t, i) => `<button type="button" id="topic-${i}" data-topic="${esc(t)}" aria-pressed="${state.topic === t}">${esc(t)}<small>${topicCount[t]}</small></button>`).join("");
    }

    function list() {
      const q = state.q.trim().toLowerCase();
      const shown = pubs.filter((p) =>
        (state.year === "all" || String(p.year) === String(state.year)) &&
        (state.topic === "all" || (p.topics || []).includes(state.topic)) &&
        (!q || [p.title, p.venue, p.type, (p.authors || []).join(" "), (p.topics || []).join(" ")].join(" ").toLowerCase().includes(q)));
      const papers = (n) => `${n} paper${n === 1 ? "" : "s"}`;
      $("pub-count").textContent = shown.length === pubs.length ? papers(pubs.length) : `${shown.length} of ${papers(pubs.length)}`;
      if (!shown.length) {
        $("pubs").innerHTML = `<li class="pub-empty">No papers match these filters. <button type="button" data-clear>Clear filters</button></li>`;
        return;
      }
      let prevYear = null;
      $("pubs").innerHTML = shown.map((p) => {
        const idx = pubs.indexOf(p);
        const firstOfYear = p.year !== prevYear;
        prevYear = p.year;
        const href = p.url || (p.doi ? "https://doi.org/" + p.doi : "");
        const title = href ? `<a href="${esc(href)}"${ext(href)}>${esc(p.title)}</a>` : esc(p.title);
        const authors = (p.authors || []).map((a) => (a === me ? `<span class="me">${esc(a)}</span>` : esc(a))).join(", ");
        const topicsHtml = (p.topics || []).map((t) => `<button type="button" class="topic-link" data-topic="${esc(t)}">#${esc(t)}</button>`).join("");
        const doi = p.doi ? `<a class="btn" href="https://doi.org/${esc(p.doi)}" target="_blank" rel="noopener">DOI</a>` : "";
        return `<li class="pub${firstOfYear ? " first-of-year" : ""}">
          <span class="pub-year">${firstOfYear ? p.year : ""}</span>
          <div>
            <h3 class="pub-title">${title}</h3>
            <p class="pub-authors">${authors}</p>
            <div class="pub-venue"><em>${esc(p.venue)}</em><span class="type-badge">${esc(p.type)}</span>${topicsHtml}</div>
          </div>
          <div class="pub-actions">
            <button type="button" class="btn" id="bib-${idx}" data-bib="${idx}">Copy BibTeX</button>${doi}
          </div>
        </li>`;
      }).join("");
    }

    function apply() { chips(); list(); }
    // Filters only earn their space once there is something to filter.
    const few = pubs.length < 4;
    document.querySelector(".col-pubs .filters").hidden = few;
    $("pub-topics").hidden = few;
    $("pub-search").addEventListener("input", (e) => { state.q = e.target.value; list(); });
    document.querySelector(".col-pubs").addEventListener("click", async (e) => {
      const t = e.target.closest("button");
      if (!t) return;
      if (t.dataset.year) { state.year = t.dataset.year; apply(); }
      else if (t.dataset.topic) { state.topic = state.topic === t.dataset.topic && t.classList.contains("topic-link") ? "all" : t.dataset.topic; apply(); }
      else if (t.hasAttribute("data-clear")) { state.q = ""; state.year = "all"; state.topic = "all"; $("pub-search").value = ""; apply(); }
      else if (t.dataset.bib) {
        const ok = await copyText(bibtex(pubs[Number(t.dataset.bib)]));
        t.textContent = ok ? "Copied" : "Copy failed";
        if (ok) t.setAttribute("data-copied", "");
        $("copy-status").textContent = ok ? "BibTeX copied to clipboard" : "Could not copy. Your browser blocked clipboard access.";
        setTimeout(() => { t.textContent = "Copy BibTeX"; t.removeAttribute("data-copied"); }, 1600);
      }
    });
    apply();
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
      const reason = r.status === 403 || r.status === 429 ? "rate limit reached (60 requests/hour without sign-in)"
        : r.status === 404 ? "that username doesn't exist" : "HTTP " + r.status;
      throw new Error(reason);
    }
    return r.json();
  }

  function renderGitHub(data, note) {
    const g = S.github || {};
    const exclude = new Set((g.exclude || []).map((x) => x.toLowerCase()));
    const own = data.repos.filter((r) => !r.fork && !exclude.has(r.name.toLowerCase()));
    const stars = own.reduce((s, r) => s + r.stars, 0);
    const u = data.user;

    const langs = {};
    own.forEach((r) => { if (r.lang) langs[r.lang] = (langs[r.lang] || 0) + 1; });
    let rows = Object.entries(langs).sort((a, b) => b[1] - a[1]);
    if (rows.length > 6) {
      const other = rows.slice(5).reduce((s, [, n]) => s + n, 0);
      rows = rows.slice(0, 5).concat([["Other", other]]);
    }
    const max = Math.max(1, ...rows.map(([, n]) => n));

    const top = own.slice().sort((a, b) => b.stars - a.stars || new Date(b.pushed) - new Date(a.pushed)).slice(0, g.maxRepos || 6);
    const partial = data.repos.length < u.public_repos;

    $("gh-body").innerHTML = `<div class="gh">
      <div class="gh-left">
      <div class="gh-profile">
        <img src="${esc(u.avatar)}" alt="" width="40" height="40" loading="lazy">
        <div><a href="${esc(u.url)}" target="_blank" rel="noopener">${esc(u.name || u.login)}</a><span>@${esc(u.login)}${u.type === "Organization" ? " · organisation" : ""}</span></div>
      </div>
      <dl class="gh-stats">
        <div><dt>Repos</dt><dd>${fmtInt(u.public_repos)}</dd></div>
        <div><dt>Stars</dt><dd>${fmtInt(stars)}${partial ? "+" : ""}</dd></div>
        <div><dt>Followers</dt><dd>${fmtInt(u.followers)}</dd></div>
      </dl>
      ${rows.length ? `<div>
        <h3 class="sub">Languages · repos</h3>
        <ul class="bars" aria-label="Repositories by primary language">
          ${rows.map(([name, n]) => `<li title="${esc(name)}: ${n} repositories"><span class="lb">${esc(name)}</span><span class="tr"><i style="width:${(n / max) * 100}%"></i></span><span class="ct">${n}</span></li>`).join("")}
        </ul>
      </div>` : ""}
      </div>
      <div class="gh-right">
      <div>
        <h3 class="sub">Top repositories</h3>
        <ul class="repos">
          ${top.map((r) => `<li>
            <a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.name)}</a>
            ${r.desc ? `<p>${esc(r.desc)}</p>` : ""}
            <div class="repo-meta"><span>★ ${fmtInt(r.stars)}</span>${r.lang ? `<span>${esc(r.lang)}</span>` : ""}<span>updated ${relTime(r.pushed)}</span></div>
          </li>`).join("")}
        </ul>
      </div>
      <p class="gh-note">${note}</p>
      </div>
    </div>`;
  }

  async function initGitHub() {
    const user = ((S.github || {}).username || "").trim();
    $("gh-meta").textContent = user ? "@" + user : "";
    if (!user) {
      $("gh-body").innerHTML = `<p class="gh-error">Set <code>github.username</code> in <code>data/site.config.js</code> to show your repositories.</p>`;
      return;
    }
    const key = "gh:" + user.toLowerCase();
    let cached = null;
    try { cached = JSON.parse(localStorage.getItem(key) || "null"); } catch (_) { cached = null; }
    if (cached && Date.now() - cached.at < TTL) { renderGitHub(cached, `From api.github.com · fetched ${clock(cached.at)}, refreshes hourly`); return; }
    if (cached) renderGitHub(cached, `Refreshing… showing data from ${clock(cached.at)}`);

    try {
      const base = "https://api.github.com/users/" + encodeURIComponent(user);
      const [u, repos] = await Promise.all([ghFetch(base), ghFetch(base + "/repos?per_page=100&sort=pushed")]);
      const data = {
        at: Date.now(),
        user: { login: u.login, name: u.name, avatar: u.avatar_url, url: u.html_url, type: u.type, public_repos: u.public_repos, followers: u.followers },
        repos: repos.map((r) => ({ name: r.name, desc: r.description, url: r.html_url, stars: r.stargazers_count, lang: r.language, fork: r.fork, pushed: r.pushed_at })),
      };
      try { localStorage.setItem(key, JSON.stringify(data)); } catch (_) { /* storage unavailable */ }
      renderGitHub(data, `Live from api.github.com · fetched ${clock(data.at)}`);
    } catch (err) {
      if (cached) renderGitHub(cached, `GitHub didn't respond (${esc(err.message)}). Showing data from ${clock(cached.at)}.`);
      else $("gh-body").innerHTML = `<p class="gh-error">Couldn't load <code>@${esc(user)}</code> from GitHub: ${esc(err.message)}. Check <code>github.username</code> in <code>data/site.config.js</code>, or try again later.</p>`;
    }
  }

  // ── Boot ─────────────────────────────────────────────────────
  function boot() {
    renderIdentity();
    renderNow();
    renderVentures();
    renderResearch();
    initPublications();
    initGitHub();
    if (window.MobsimToy) window.MobsimToy.mount(S.sim || {});
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
