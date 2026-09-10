/*
 * mobsim-toy: a tiny MATSim-flavoured simulation for the dashboard hero.
 *
 *   network  grid + ring road + one arterial cross, bidirectional links
 *   plans    one home→work trip per agent, departures around a morning peak
 *   mobsim   cars slow down with link load (BPR: t = t0·(1 + 0.15·(v/c)^4));
 *            pt, bike and walk move at fixed speeds and do not load roads
 *   replan   at the end of each day 15% of car agents re-route on the
 *            travel times experienced that day, so the system relaxes
 *
 * Deterministic (seeded) and dependency-free. Colors come from CSS tokens.
 */
(function () {
  "use strict";

  const DAY_START = 5 * 3600;
  const DAY_END = 11 * 3600;
  const TAU = 900; // s, window of the link-flow estimate
  const REPLAN_SHARE = 0.15;
  const WARM_ITERATIONS = 4;
  const SPEED = { pt: 7.5, bike: 4.5, walk: 1.35 }; // m/s
  const MODES = ["car", "pt", "bike", "walk"];
  const MODE_LABEL = { car: "Car", pt: "PT", bike: "Bike", walk: "Walk" };
  const MODE_LONG = { car: "car", pt: "public transport", bike: "bike", walk: "walk" };
  const TYPES = {
    ring: { fs: 70 / 3.6, cap: 3600, w: 2.4 },
    arterial: { fs: 50 / 3.6, cap: 1800, w: 1.8 },
    local: { fs: 30 / 3.6, cap: 800, w: 1.1 },
  };

  // ── helpers ──────────────────────────────────────────────────
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(rnd) {
    let u = 0;
    while (!u) u = rnd();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd());
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pad2 = (n) => String(n).padStart(2, "0");
  const hhmm = (s) => { const m = Math.floor(s / 60); return pad2(Math.floor(m / 60)) + ":" + pad2(m % 60); };
  const parseHHMM = (str) => { const [h, m] = String(str || "07:45").split(":").map(Number); return h * 3600 + (m || 0) * 60; };
  const fmtInt = (n) => Math.round(n).toLocaleString("en-US");
  function pickWeighted(rnd, idx, w) {
    let sum = 0;
    for (const i of idx) sum += w[i];
    let x = rnd() * sum;
    for (const i of idx) { x -= w[i]; if (x <= 0) return i; }
    return idx[idx.length - 1];
  }

  // ── network ──────────────────────────────────────────────────
  function buildNetwork(rnd) {
    const COLS = 13, ROWS = 8, SP = 520;
    const nodes = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const onRing = r === 0 || c === 0 || r === ROWS - 1 || c === COLS - 1;
        const j = onRing ? 30 : 95;
        nodes.push({ x: c * SP + (rnd() - 0.5) * 2 * j, y: r * SP + (rnd() - 0.5) * 2 * j });
      }
    }
    const id = (c, r) => r * COLS + c;
    const midR = Math.floor(ROWS / 2), midC = Math.floor(COLS / 2);
    const edges = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (c < COLS - 1) edges.push({ a: id(c, r), b: id(c + 1, r), type: r === 0 || r === ROWS - 1 ? "ring" : r === midR ? "arterial" : "local" });
        if (r < ROWS - 1) edges.push({ a: id(c, r), b: id(c, r + 1), type: c === 0 || c === COLS - 1 ? "ring" : c === midC ? "arterial" : "local" });
      }
    }

    // Thin out ~12% of local streets, keeping every node at degree ≥ 2 and the graph connected.
    const keep = edges.map(() => true);
    const degree = new Array(nodes.length).fill(0);
    edges.forEach((e) => { degree[e.a]++; degree[e.b]++; });
    const locals = edges.map((_, i) => i).filter((i) => edges[i].type === "local");
    for (let i = locals.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [locals[i], locals[j]] = [locals[j], locals[i]]; }
    let removed = 0;
    const target = Math.round(locals.length * 0.12);
    for (const i of locals) {
      if (removed >= target) break;
      const e = edges[i];
      if (degree[e.a] <= 2 || degree[e.b] <= 2) continue;
      keep[i] = false;
      if (isConnected(nodes.length, edges, keep)) { removed++; degree[e.a]--; degree[e.b]--; }
      else keep[i] = true;
    }

    const links = [], out = nodes.map(() => []);
    edges.forEach((e, i) => {
      if (!keep[i]) return;
      for (const [f, t] of [[e.a, e.b], [e.b, e.a]]) {
        const A = nodes[f], B = nodes[t], len = Math.hypot(B.x - A.x, B.y - A.y), T = TYPES[e.type];
        const L = {
          id: links.length, from: f, to: t, type: e.type, len, fs: T.fs, cap: T.cap, w: T.w,
          ux: (B.x - A.x) / len, uy: (B.y - A.y) / len, freeTT: len / T.fs,
          flow: 0, cars: 0, sumTT: 0, cntTT: 0, sx1: 0, sy1: 0, sx2: 0, sy2: 0,
        };
        out[f].push(L.id);
        links.push(L);
      }
    });
    return { nodes, links, out, COLS, ROWS, SP };
  }

  function isConnected(n, edges, keep) {
    const adj = Array.from({ length: n }, () => []);
    edges.forEach((e, i) => { if (keep[i]) { adj[e.a].push(e.b); adj[e.b].push(e.a); } });
    const seen = new Uint8Array(n), stack = [0];
    seen[0] = 1;
    let count = 1;
    while (stack.length) for (const v of adj[stack.pop()]) if (!seen[v]) { seen[v] = 1; count++; stack.push(v); }
    return count === n;
  }

  function dijkstra(net, src, dst, cost) {
    const n = net.nodes.length;
    const dist = new Float64Array(n).fill(Infinity), prev = new Int32Array(n).fill(-1), done = new Uint8Array(n);
    dist[src] = 0;
    for (;;) {
      let u = -1, best = Infinity;
      for (let i = 0; i < n; i++) if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }
      if (u === -1 || u === dst) break;
      done[u] = 1;
      for (const li of net.out[u]) {
        const L = net.links[li], d = best + cost[li];
        if (d < dist[L.to]) { dist[L.to] = d; prev[L.to] = li; }
      }
    }
    const route = [];
    for (let v = dst; v !== src; ) {
      const li = prev[v];
      if (li < 0) return [];
      route.push(li);
      v = net.links[li].from;
    }
    return route.reverse();
  }

  // ── population & plans ───────────────────────────────────────
  function buildPopulation(net, rnd, cfg) {
    const { nodes } = net;
    const N = clamp(Math.round(cfg.agents || 900), 50, 5000);
    const cbd = { x: (net.COLS - 1) * net.SP * 0.55, y: (net.ROWS - 1) * net.SP * 0.45 };
    const d = nodes.map((p) => Math.hypot(p.x - cbd.x, p.y - cbd.y));
    const maxD = Math.max(...d);
    const homeW = d.map((v) => 0.15 + Math.pow(v / maxD, 1.3));
    const workW = d.map((v) => Math.exp(-(v * v) / (2 * 1300 * 1300)) + 0.04);
    const all = nodes.map((_, i) => i);

    const share = Object.assign({ car: 0.46, pt: 0.28, bike: 0.14, walk: 0.12 }, cfg.modeShare || {});
    const total = MODES.reduce((s, m) => s + share[m], 0);
    const peak = parseHHMM(cfg.peak);

    const agents = [];
    for (let i = 0; i < N; i++) {
      let x = rnd() * total, mode = "car";
      for (const m of MODES) { x -= share[m]; if (x <= 0) { mode = m; break; } }
      const home = pickWeighted(rnd, all, homeW);
      // Walkers and cyclists make short trips; everyone else heads for the centre.
      const reach = mode === "walk" ? 1600 : mode === "bike" ? 4500 : Infinity;
      const H = nodes[home];
      const cands = all.filter((j) => j !== home && Math.hypot(nodes[j].x - H.x, nodes[j].y - H.y) <= reach);
      if (!cands.length) mode = "car";
      const work = pickWeighted(rnd, cands.length ? cands : all.filter((j) => j !== home), workW);
      const dep = clamp(peak + gauss(rnd) * 2400, DAY_START + 900, DAY_END - 2700);
      agents.push({ id: i, mode, home, work, dep, route: null, li: 0, pos: 0, state: 0, v: 0, tEnter: 0, tArr: 0, sx: -99, sy: -99 });
    }
    return agents;
  }

  // ── model ────────────────────────────────────────────────────
  function createModel(cfg) {
    const rnd = mulberry32(cfg.seed || 11);
    const net = buildNetwork(rnd);
    const agents = buildPopulation(net, rnd, cfg);
    const costFree = net.links.map((L) => L.freeTT);
    const costDist = net.links.map((L) => L.len);
    for (const a of agents) a.route = dijkstra(net, a.home, a.work, a.mode === "car" ? costFree : costDist);
    const m = {
      net, agents, rnd, t: DAY_START, iteration: 0, nextSample: DAY_START,
      flowFactor: cfg.flowCapFactor || 0.04, series: [], history: [], peakEnroute: 0,
    };
    resetDay(m);
    return m;
  }

  function resetDay(m) {
    m.t = DAY_START;
    m.series = [];
    m.nextSample = DAY_START;
    for (const L of m.net.links) { L.flow = 0; L.cars = 0; L.sumTT = 0; L.cntTT = 0; }
    for (const a of m.agents) { a.state = 0; a.li = 0; a.pos = 0; a.v = 0; a.tArr = 0; }
  }

  const vcOf = (m, L) => (L.flow * 3600) / TAU / (L.cap * m.flowFactor);
  const flowOf = (m, L) => (L.flow * 3600) / TAU / m.flowFactor; // veh/h, scaled to the full population

  function enter(m, a, L) { if (a.mode !== "car") return; L.flow += 1; L.cars++; a.tEnter = m.t; }
  function leave(m, a, L) { if (a.mode !== "car") return; L.cars--; L.sumTT += m.t - a.tEnter; L.cntTT++; }

  function step(m, dt) {
    const links = m.net.links, decay = Math.exp(-dt / TAU);
    m.t += dt;
    for (const L of links) L.flow *= decay;
    for (const a of m.agents) {
      if (a.state === 2) continue;
      if (a.state === 0) {
        if (m.t < a.dep) continue;
        if (!a.route.length) { a.state = 2; a.tArr = m.t; continue; }
        a.state = 1; a.li = 0; a.pos = 0;
        enter(m, a, links[a.route[0]]);
      }
      let L = links[a.route[a.li]];
      a.v = a.mode === "car" ? L.fs / (1 + 0.15 * Math.pow(vcOf(m, L), 4)) : SPEED[a.mode];
      a.pos += a.v * dt;
      while (a.pos >= L.len) {
        a.pos -= L.len;
        leave(m, a, L);
        if (++a.li >= a.route.length) { a.state = 2; a.tArr = m.t; a.pos = 0; break; }
        L = links[a.route[a.li]];
        enter(m, a, L);
      }
    }
    if (m.t >= m.nextSample) {
      let n = 0;
      for (const a of m.agents) if (a.state === 1) n++;
      m.series.push([m.t, n]);
      if (n > m.peakEnroute) m.peakEnroute = n;
      m.nextSample += 120;
    }
  }

  function advanceTo(m, until, dt) { while (m.t < until) step(m, Math.min(dt, until - m.t)); }

  // Finish the day, score it, re-route a share of drivers, start the next iteration.
  function finishDay(m) {
    advanceTo(m, DAY_END, 10);
    const cars = m.agents.filter((a) => a.mode === "car");
    const arrived = cars.filter((a) => a.state === 2);
    const avg = arrived.reduce((s, a) => s + (a.tArr - a.dep), 0) / Math.max(1, arrived.length);
    m.history.push({ iteration: m.iteration, avgCarTT: avg / 60, stuck: cars.length - arrived.length });
    const cost = m.net.links.map((L) => (L.cntTT ? Math.max(L.freeTT, L.sumTT / L.cntTT) : L.freeTT));
    for (const a of cars) if (m.rnd() < REPLAN_SHARE) a.route = dijkstra(m.net, a.home, a.work, cost);
    m.iteration++;
    resetDay(m);
  }

  // ── small SVG line chart (shared by the rail charts) ─────────
  function lineChart(host, o) {
    if (!host._init) {
      host._init = true;
      host.innerHTML = '<div class="chart-svg"></div><div class="chart-tip" hidden></div>';
      host.addEventListener("pointermove", (e) => {
        const d = host._o && host._o.data;
        if (!d || !d.length) return;
        const r = host.getBoundingClientRect(), px = e.clientX - r.left;
        let bi = 0, bd = Infinity;
        d.forEach((p, i) => { const dd = Math.abs(host._X(p[0]) - px); if (dd < bd) { bd = dd; bi = i; } });
        host._hi = bi;
        lineChart(host, host._o);
      });
      host.addEventListener("pointerleave", () => { host._hi = null; lineChart(host, host._o); });
    }
    host._o = o;
    const w = Math.max(160, host.clientWidth), h = o.height || 72;
    const padL = 2, padR = o.padR ?? 44, padT = 12, padB = 18;
    const X = (x) => padL + ((x - o.x0) / (o.x1 - o.x0 || 1)) * (w - padL - padR);
    const Y = (y) => padT + (1 - (y - o.y0) / (o.y1 - o.y0 || 1)) * (h - padT - padB);
    host._X = X;
    const d = o.data;
    let s = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${o.label}">`;
    for (const gy of o.yTicks || []) {
      s += `<line class="c-grid" x1="${padL}" x2="${w - padR}" y1="${Y(gy)}" y2="${Y(gy)}"/>`;
      s += `<text class="c-tick" x="${padL}" y="${Y(gy) - 4}">${o.fmtY(gy)}</text>`;
    }
    s += `<line class="c-axis" x1="${padL}" x2="${w - padR}" y1="${Y(o.y0)}" y2="${Y(o.y0)}"/>`;
    (o.xTicks || []).forEach(([x, label], i, arr) => {
      const anchor = i === 0 ? "start" : i === arr.length - 1 && X(x) > w - padR - 12 ? "end" : "middle";
      s += `<text class="c-tick" x="${X(x)}" y="${h - 3}" text-anchor="${anchor}">${label}</text>`;
    });
    if (d.length) {
      const path = d.map((p, i) => (i ? "L" : "M") + X(p[0]).toFixed(1) + "," + Y(p[1]).toFixed(1)).join("");
      if (o.area) s += `<path d="${path}L${X(d[d.length - 1][0]).toFixed(1)},${Y(o.y0)}L${X(d[0][0]).toFixed(1)},${Y(o.y0)}Z" fill="${o.color}" fill-opacity="0.14"/>`;
      s += `<path d="${path}" fill="none" stroke="${o.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
      if (o.dots) for (const p of d) s += `<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="3.5" fill="${o.color}" stroke="var(--panel)" stroke-width="2"/>`;
      const last = d[d.length - 1];
      s += `<circle cx="${X(last[0])}" cy="${Y(last[1])}" r="4" fill="${o.color}" stroke="var(--panel)" stroke-width="2"/>`;
      s += `<text class="c-end" x="${X(last[0]) + 8}" y="${Y(last[1])}" dominant-baseline="middle">${o.fmtEnd(last)}</text>`;
      const tip = host.querySelector(".chart-tip");
      if (host._hi != null && d[host._hi]) {
        const p = d[host._hi], hx = X(p[0]), hy = Y(p[1]);
        s += `<line class="c-cross" x1="${hx}" x2="${hx}" y1="${padT - 4}" y2="${Y(o.y0)}"/>`;
        s += `<circle cx="${hx}" cy="${hy}" r="4.5" fill="${o.color}" stroke="var(--ink)" stroke-width="1.5"/>`;
        tip.innerHTML = o.fmtTip(p);
        tip.hidden = false;
        tip.style.left = clamp(hx - tip.offsetWidth / 2, 0, w - tip.offsetWidth) + "px";
        tip.style.top = Math.max(0, hy - tip.offsetHeight - 10) + "px";
      } else tip.hidden = true;
    }
    s += "</svg>";
    host.querySelector(".chart-svg").innerHTML = s;
  }

  function glyph(mode) {
    const p = {
      car: '<circle cx="6" cy="6" r="4"/>',
      pt: '<rect x="2" y="2" width="8" height="8"/>',
      bike: '<path d="M6 1.4 10.6 9.6H1.4Z"/>',
      walk: '<path d="M6 1 10 6 6 11 2 6Z"/>',
    }[mode];
    return `<svg class="glyph" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" style="fill:var(--mode-${mode})">${p}</svg>`;
  }

  // ── mount: view, interaction, telemetry ──────────────────────
  function mount(cfg) {
    const $ = (id) => document.getElementById(id);
    const canvas = $("sim-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const stage = canvas.parentElement, tip = $("sim-tip");
    const css = getComputedStyle(document.documentElement);
    const tok = (k) => css.getPropertyValue("--" + k).trim();
    const C = {
      ground: tok("ground"), road: tok("road"), ring: tok("road-ring"),
      ink: tok("ink"), ink3: tok("ink-3"), accent: tok("accent"),
    };
    for (const md of MODES) C[md] = tok("mode-" + md);
    const ramp = buildRamp([tok("load-0"), tok("load-1"), tok("load-2")], [0, 0.6, 1]);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const model = createModel(cfg);
    for (let k = 0; k < WARM_ITERATIONS; k++) finishDay(model);
    advanceTo(model, 7 * 3600 + 20 * 60, 5);
    const { net, agents } = model;
    const byMode = {};
    for (const md of MODES) byMode[md] = agents.filter((a) => a.mode === md);

    // view transform
    let W = 0, H = 0, dpr = 1, s = 1, R = 2.6, dirty = true;
    const b = net.nodes.reduce((acc, p) => ({
      minX: Math.min(acc.minX, p.x), maxX: Math.max(acc.maxX, p.x), minY: Math.min(acc.minY, p.y), maxY: Math.max(acc.maxY, p.y),
    }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
    function resize() {
      const r = stage.getBoundingClientRect();
      W = r.width; H = r.height;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      const pad = 24, bottom = 30;
      s = Math.min((W - 2 * pad) / (b.maxX - b.minX), (H - pad - bottom) / (b.maxY - b.minY));
      const ox = (W - s * (b.maxX - b.minX)) / 2 - s * b.minX;
      const oy = pad + (H - pad - bottom - s * (b.maxY - b.minY)) / 2 - s * b.minY;
      R = s > 0.08 ? 2.7 : 2.1;
      const off = 1.8; // lane offset: each direction drawn on its own side
      for (const L of net.links) {
        const A = net.nodes[L.from], B = net.nodes[L.to], nx = -L.uy * off, ny = L.ux * off;
        L.sx1 = ox + A.x * s + nx; L.sy1 = oy + A.y * s + ny;
        L.sx2 = ox + B.x * s + nx; L.sy2 = oy + B.y * s + ny;
      }
      for (const n of net.nodes) { n.sx = ox + n.x * s; n.sy = oy + n.y * s; }
      dirty = true;
    }
    new ResizeObserver(resize).observe(stage);
    resize();

    function seg(L) { ctx.beginPath(); ctx.moveTo(L.sx1, L.sy1); ctx.lineTo(L.sx2, L.sy2); ctx.stroke(); }
    function shape(mode, x, y, r) {
      ctx.beginPath();
      if (mode === "car") ctx.arc(x, y, r, 0, Math.PI * 2);
      else if (mode === "pt") ctx.rect(x - r * 1.05, y - r * 1.05, r * 2.1, r * 2.1);
      else if (mode === "bike") { ctx.moveTo(x, y - r * 1.35); ctx.lineTo(x + r * 1.25, y + r * 0.95); ctx.lineTo(x - r * 1.25, y + r * 0.95); ctx.closePath(); }
      else { ctx.moveTo(x, y - r * 1.25); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r * 1.25); ctx.lineTo(x - r, y); ctx.closePath(); }
    }

    let hover = null;
    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = C.ground;
      ctx.fillRect(0, 0, W, H);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (const L of net.links) { ctx.strokeStyle = L.type === "ring" ? C.ring : C.road; ctx.lineWidth = L.w; seg(L); }
      for (const L of net.links) {
        const vc = vcOf(model, L);
        if (vc < 0.05) continue;
        ctx.strokeStyle = ramp[Math.round(clamp(vc / 1.2, 0, 1) * (ramp.length - 1))];
        ctx.lineWidth = L.w + Math.min(vc, 1.2) * 1.6;
        seg(L);
      }
      if (hover && hover.kind === "link") { ctx.strokeStyle = C.ink; ctx.lineWidth = hover.L.w + 2.5; seg(hover.L); }
      if (hover && hover.kind === "agent") {
        const a = hover.a;
        ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.globalAlpha = 0.9;
        for (const li of a.route) seg(net.links[li]);
        ctx.globalAlpha = 1;
        const Hn = net.nodes[a.home], Wn = net.nodes[a.work];
        ctx.lineWidth = 2; ctx.fillStyle = C.ground;
        ctx.beginPath(); ctx.arc(Hn.sx, Hn.sy, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = C.ink; ctx.fillRect(Wn.sx - 4.5, Wn.sy - 4.5, 9, 9);
      }
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = C.ground;
      for (const md of ["walk", "bike", "pt", "car"]) {
        ctx.fillStyle = C[md];
        for (const a of byMode[md]) {
          if (a.state !== 1) { a.sx = a.sy = -99; continue; }
          const L = net.links[a.route[a.li]], f = a.pos / L.len;
          a.sx = L.sx1 + (L.sx2 - L.sx1) * f;
          a.sy = L.sy1 + (L.sy2 - L.sy1) * f;
          shape(md, a.sx, a.sy, R);
          ctx.stroke();
          ctx.fill();
        }
      }
      if (hover && hover.kind === "agent" && hover.a.state === 1) {
        const a = hover.a;
        ctx.fillStyle = C[a.mode]; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.8;
        shape(a.mode, a.sx, a.sy, R + 2.2); ctx.fill(); ctx.stroke();
      }
      // scale bar, in real units
      const px = 1000 * s, x0 = 16, y0 = H - 13;
      ctx.strokeStyle = C.ink3; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x0, y0 - 4); ctx.lineTo(x0, y0); ctx.lineTo(x0 + px, y0); ctx.lineTo(x0 + px, y0 - 4); ctx.stroke();
      ctx.fillStyle = C.ink3; ctx.font = "11px 'JetBrains Mono', ui-monospace, monospace"; ctx.textBaseline = "middle";
      ctx.fillText("1 km", x0 + px + 6, y0 - 1);
    }

    // hover: nearest agent first, else nearest link
    let px = -1, py = -1;
    function segDist(L) {
      const dx = L.sx2 - L.sx1, dy = L.sy2 - L.sy1, l2 = dx * dx + dy * dy;
      const t = clamp(((px - L.sx1) * dx + (py - L.sy1) * dy) / l2, 0, 1);
      return Math.hypot(px - (L.sx1 + t * dx), py - (L.sy1 + t * dy));
    }
    function pick() {
      let best = null, bd = 12 * 12;
      for (const a of agents) {
        if (a.state !== 1) continue;
        const dx = a.sx - px, dy = a.sy - py, dd = dx * dx + dy * dy;
        if (dd < bd) { bd = dd; best = a; }
      }
      if (best) hover = { kind: "agent", a: best };
      else {
        let bl = null, bld = 7;
        for (const L of net.links) { const dd = segDist(L); if (dd < bld) { bld = dd; bl = L; } }
        hover = bl ? { kind: "link", L: bl } : null;
      }
      renderTip();
      dirty = true;
    }
    function renderTip() {
      if (!hover || (hover.kind === "agent" && hover.a.state !== 1)) { tip.hidden = true; return; }
      if (hover.kind === "agent") {
        const a = hover.a, L = net.links[a.route[a.li]];
        tip.innerHTML =
          `<div class="tip-h">${glyph(a.mode)}<b>Person ${pad2(a.id).padStart(4, "0")}</b><span>${MODE_LONG[a.mode]}</span></div>` +
          `<div>home → work · departed ${hhmm(a.dep)}</div>` +
          `<div>link ${L.id} (${L.type}) · ${fmtInt(a.v * 3.6)} km/h</div>` +
          `<div class="tip-m">leg ${a.li + 1} of ${a.route.length} links</div>`;
      } else {
        const L = hover.L, vc = vcOf(model, L);
        tip.innerHTML =
          `<div class="tip-h"><b>Link ${L.id}</b><span>${L.type}</span></div>` +
          `<div>freespeed ${fmtInt(L.fs * 3.6)} km/h · capacity ${fmtInt(L.cap)} veh/h</div>` +
          `<div>flow ${fmtInt(flowOf(model, L))} veh/h · v/c ${vc.toFixed(2)}</div>` +
          `<div class="tip-m">${fmtInt(L.len)} m · ${L.cars} sampled cars on link</div>`;
      }
      tip.hidden = false;
      const tw = tip.offsetWidth, th = tip.offsetHeight;
      tip.style.left = (px + 16 + tw > W ? px - tw - 16 : px + 16) + "px";
      tip.style.top = clamp(py + 16, 4, H - th - 4) + "px";
    }
    canvas.addEventListener("pointermove", (e) => {
      const r = canvas.getBoundingClientRect();
      px = e.clientX - r.left; py = e.clientY - r.top;
      pick();
    });
    canvas.addEventListener("pointerleave", () => { hover = null; tip.hidden = true; dirty = true; });

    // controls
    let playing = !reduceMotion, speed = 60;
    const playBtn = $("sim-play");
    function setPlaying(p) {
      playing = p;
      playBtn.textContent = p ? "Pause" : "Play";
      playBtn.setAttribute("aria-label", p ? "Pause simulation" : "Play simulation");
      document.getElementById("sim")?.classList.toggle("is-paused", !p);
    }
    setPlaying(playing);
    playBtn.addEventListener("click", () => setPlaying(!playing));
    canvas.addEventListener("keydown", (e) => { if (e.key === " ") { e.preventDefault(); setPlaying(!playing); } });
    document.querySelectorAll("[data-speed]").forEach((btn) => {
      btn.addEventListener("click", () => {
        speed = Number(btn.dataset.speed);
        document.querySelectorAll("[data-speed]").forEach((x) => x.setAttribute("aria-pressed", String(x === btn)));
      });
    });
    $("sim-next").addEventListener("click", () => {
      finishDay(model);
      advanceTo(model, 7 * 3600, 5);
      hover = null; tip.hidden = true;
      renderConvergence();
      updateStats();
      dirty = true;
    });

    // telemetry
    const N = agents.length;
    const counts = {};
    for (const md of MODES) counts[md] = byMode[md].length;
    $("modal-split").innerHTML =
      `<div class="split-bar" role="img" aria-label="Modal split: ${MODES.map((md) => `${MODE_LONG[md]} ${Math.round((counts[md] / N) * 100)}%`).join(", ")}">` +
      MODES.map((md) => `<span style="flex:${counts[md]} 1 0;background:var(--mode-${md})"></span>`).join("") +
      "</div><ul class=\"legend\">" +
      MODES.map((md) => `<li>${glyph(md)}<span>${MODE_LABEL[md]}</span><b>${Math.round((counts[md] / N) * 100)}%</b></li>`).join("") +
      "</ul>";
    $("sim-meta").textContent = `${fmtInt(N)} agents · ${Math.round(model.flowFactor * 100)}% sample`;

    function niceMax(v) {
      for (const n of [50, 100, 150, 200, 250, 300, 400, 500, 600, 800, 1000, 1500, 2000, 3000, 5000]) if (v <= n) return n;
      return Math.ceil(v / 1000) * 1000;
    }
    const chEnroute = $("ch-enroute"), chConv = $("ch-conv");
    function renderEnroute() {
      const ymax = niceMax(Math.max(10, model.peakEnroute));
      lineChart(chEnroute, {
        label: "Agents en route over the simulated morning",
        data: model.series, x0: DAY_START, x1: DAY_END, y0: 0, y1: ymax, height: 78, area: true, color: C.accent,
        yTicks: [ymax], fmtY: (v) => fmtInt(v),
        xTicks: [[5 * 3600, "05:00"], [7 * 3600, "07:00"], [9 * 3600, "09:00"], [11 * 3600, "11:00"]],
        fmtEnd: (p) => fmtInt(p[1]), fmtTip: (p) => `<b>${fmtInt(p[1])}</b> en route · ${hhmm(p[0])}`,
      });
    }
    function renderConvergence() {
      const d = model.history.map((h) => [h.iteration, h.avgCarTT]);
      const ys = d.map((p) => p[1]);
      const lo = Math.floor(Math.min(...ys) - 0.5), hi = Math.ceil(Math.max(...ys) + 0.5);
      const last = d[d.length - 1][0];
      lineChart(chConv, {
        label: "Average car travel time per iteration",
        data: d, x0: 0, x1: Math.max(1, last), y0: lo, y1: hi, height: 78, dots: true, color: C.car, padR: 64,
        yTicks: [hi], fmtY: (v) => v + " min",
        xTicks: [[0, "it.0"], [last, "it." + last]],
        fmtEnd: (p) => p[1].toFixed(1) + " min", fmtTip: (p) => `it.${p[0]} · <b>${p[1].toFixed(2)} min</b>`,
      });
      $("sim-iter").textContent = "iteration " + model.iteration;
    }

    const el = {
      clock: $("sim-clock"), enroute: $("st-enroute"), arrived: $("st-arrived"), speed: $("st-speed"), vc: $("st-vc"),
    };
    function updateStats() {
      let enr = 0, arr = 0, vs = 0, nc = 0;
      for (const a of agents) {
        if (a.state === 1) { enr++; if (a.mode === "car") { vs += a.v; nc++; } }
        else if (a.state === 2) arr++;
      }
      let maxVc = 0, maxL = null;
      for (const L of net.links) { const vc = vcOf(model, L); if (vc > maxVc) { maxVc = vc; maxL = L; } }
      el.clock.textContent = hhmm(model.t);
      el.enroute.textContent = fmtInt(enr);
      el.arrived.innerHTML = `${fmtInt(arr)}<small> of ${fmtInt(N)}</small>`;
      el.speed.innerHTML = nc ? `${fmtInt((vs / nc) * 3.6)}<small> km/h</small>` : "–";
      el.vc.innerHTML = maxL && maxVc >= 0.01 ? `${maxVc.toFixed(2)}<small> v/c · link ${maxL.id}</small>` : "–";
      renderEnroute();
      if (hover) renderTip();
    }
    renderConvergence();
    updateStats();

    // loop: only step and paint while the panel is on screen
    let visible = true, last = 0, lastStats = 0, lastIter = model.iteration;
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(stage);
    function frame(ts) {
      const dtReal = last ? Math.min(0.1, (ts - last) / 1000) : 0;
      last = ts;
      if (visible && !document.hidden) {
        if (playing) {
          let simDt = dtReal * speed;
          while (simDt > 0) { const d = Math.min(5, simDt); step(model, d); simDt -= d; }
          if (model.t >= DAY_END) finishDay(model);
          dirty = true;
        }
        if (model.iteration !== lastIter) { lastIter = model.iteration; renderConvergence(); }
        if (dirty) { draw(); dirty = false; }
        if (ts - lastStats > 250 && playing) { lastStats = ts; updateStats(); }
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    window.addEventListener("resize", () => { renderEnroute(); renderConvergence(); });
  }

  function buildRamp(hexes, at) {
    const rgb = hexes.map((h) => { const n = parseInt(h.replace("#", ""), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; });
    const out = [];
    for (let i = 0; i < 64; i++) {
      const t = i / 63;
      let k = 0;
      while (k < at.length - 2 && t > at[k + 1]) k++;
      const f = (t - at[k]) / (at[k + 1] - at[k]);
      const c = rgb[k].map((v, j) => Math.round(v + (rgb[k + 1][j] - v) * f));
      out.push(`rgb(${c[0]},${c[1]},${c[2]})`);
    }
    return out;
  }

  window.MobsimToy = { mount, glyph };
})();
