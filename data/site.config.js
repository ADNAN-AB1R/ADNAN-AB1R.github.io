/*
 * ─────────────────────────────────────────────────────────────
 *  SITE CONFIG — the only file you need to edit.
 *  Every page is rendered from this object.
 *
 *  Rule of thumb for this site: if a claim can't be checked by a
 *  visitor (a link, a program listing, a repo, a live shop), it
 *  doesn't belong here.
 * ─────────────────────────────────────────────────────────────
 */
window.SITE = {
  sample: false,

  // ── Identity ────────────────────────────────────────────────
  name: "Adnan Abir",
  initials: "AA",
  roles: ["Civil Engineering · BUET", "Transport modelling · MATSim", "Founder, Thread Co."],
  tagline:
    "Civil engineering undergraduate at BUET. I'm building an agent-based MATSim model of Dhaka with a researcher at ETH Zurich, and I run Thread Co., a clothing brand whose storefront I built.",
  location: "Dhaka, Bangladesh",
  status: { label: "Open to research collaborations", state: "good" },

  now: [
    "Building the MATSim scenario for Dhaka: network, transit schedule and population are in place",
    "Calibration against observed data is the next step",
    "Running Thread Co.; the Summer Collection 2026 is live",
  ],

  links: {
    email: "adnan26abir@gmail.com",
    github: "https://github.com/ADNAN-AB1R",
    orcid: "https://orcid.org/0009-0002-0297-5322",
    linkedin: "https://linkedin.com/in/adnan-abir-33a1a8336",
    cv: "",
  },

  github: {
    username: "ADNAN-AB1R",
    maxRepos: 6,
    exclude: [],
    // Forks that are part of the MATSim toolchain, shown on the research page.
    toolchain: [
      "pt2matsim",
      "GTFS2MATSim_Dhaka",
      "sutLab_dhaka",
      "matsim-kelheim_Adnan_Abir_01",
      "matsim-serengeti-park-hodenhagen",
      "matsim-sao-paulo",
      "choice-model_france",
    ],
  },

  // ── Research ────────────────────────────────────────────────
  research: {
    lede: "Agent-based transport simulation for a city with very little open data.",
    title: "A MATSim scenario for Dhaka",
    status: "In progress",
    summary:
      "Dhaka is a megacity with almost no open, model-ready transport data. The scenario assembles one from what does exist: an OpenStreetMap extract for the road and transit network, GTFS for public transport, and census and survey sources for the population. Everything below is built; calibration against observed data is what comes next.",
    // The build pipeline, drawn on the research page.
    pipeline: [
      { in: "OpenStreetMap extract", tool: "pt2matsim", out: "Multimodal network" },
      { in: "Public transport GTFS", tool: "GTFS2MATSim", out: "Transit schedule & vehicles" },
      { in: "Census & survey data", tool: "Population synthesis", out: "Agents with daily plans" },
      { in: "Plans & alternatives", tool: "Mode choice model", out: "Choice sets for scoring" },
      { in: "Network + schedule + plans", tool: "MATSim mobsim · iterations", out: "Link flows, mode shares, travel times" },
      { in: "Observed counts & surveys", tool: "Calibration", out: "Validated scenario", pending: true },
    ],
    built: [
      "Multimodal network built from an OpenStreetMap extract",
      "Public transport schedule and vehicles converted from GTFS",
      "Synthetic population with home, work and education activities",
      "Mode choice adapted from an existing open model",
      "Scenario runs end to end through the MATSim mobsim",
    ],
    next: [
      "Calibration against observed counts and survey data",
      "Validation of mode shares and travel times",
    ],
    collaboration:
      "The scenario is built in collaboration with a senior researcher at ETH Zurich, starting from their Dhaka base repository.",
    tools: [
      { name: "MATSim", use: "Agent-based transport simulation framework", url: "https://matsim.org" },
      { name: "pt2matsim", use: "Builds the multimodal network from OpenStreetMap", url: "https://github.com/ADNAN-AB1R/pt2matsim" },
      { name: "GTFS2MATSim", use: "Converts the Dhaka GTFS feed into a MATSim transit schedule", url: "https://github.com/ADNAN-AB1R/GTFS2MATSim_Dhaka" },
      { name: "sutLab_dhaka", use: "Base repository for the Dhaka model, by a co-author at ETH Zurich", url: "https://github.com/ADNAN-AB1R/sutLab_dhaka" },
      { name: "Mode choice model", use: "Open choice model used as a reference for Dhaka", url: "https://github.com/ADNAN-AB1R/choice-model_france" },
      { name: "QGIS", use: "Spatial preparation and inspection of network and zones", url: "https://qgis.org" },
      { name: "Java · Python", use: "Running MATSim and preparing input data", url: "" },
    ],
    // Reference scenarios studied while learning the framework
    reference: ["matsim-kelheim", "matsim-serengeti-park-hodenhagen", "matsim-sao-paulo"],
  },

  // ── Publications ────────────────────────────────────────────
  me: "Adnan Abir",
  publications: [
    {
      year: 2026,
      type: "conference",
      title: "Towards a MATSim Scenario for a Data-Scarce Megacity: Dhaka, Bangladesh",
      authors: ["Adnan Abir", "Grace O. Kagho", "Tasnia Tabassum Prima", "Sk. Md. Mashrur"],
      venue: "MATSim User Meeting 2026",
      topics: ["MATSim", "data-scarce cities"],
      status: "Accepted & presented",
      event: {
        date: "28 September 2026",
        place: "Sorbonne University, Pierre et Marie Curie campus, Paris",
        session: "Session 4 · Salle 105 — City-scale scenarios · 16:18",
        url: "https://matsim.org/conferences/mum2026/program/",
      },
      doi: "",
      url: "https://matsim.org/conferences/mum2026/program/",
    },
  ],

  // ── Projects ────────────────────────────────────────────────
  projects: [
    {
      name: "MATSim scenario for Dhaka",
      status: "in progress",
      blurb:
        "An agent-based model of travel in Dhaka, assembled from open data: network from OpenStreetMap, transit from GTFS, a synthetic population, and mode choice adapted from an open model. Presented at the MATSim User Meeting 2026.",
      tech: ["MATSim", "Java", "Python", "pt2matsim", "GTFS", "OpenStreetMap", "QGIS"],
      links: [
        { label: "How it's built", url: "research.html" },
        { label: "Base repository", url: "https://github.com/ADNAN-AB1R/sutLab_dhaka" },
      ],
    },
    {
      name: "Thread Co. storefront",
      status: "live",
      blurb:
        "The online shop for Thread Co.: catalogue, category pages, price filters, wishlist, cart and a cash-on-delivery checkout flow. Hand-built, with no shop platform behind it.",
      tech: ["HTML", "CSS", "JavaScript"],
      links: [{ label: "threadcoofficial.com", url: "https://www.threadcoofficial.com" }],
    },
    {
      name: "This dashboard",
      status: "live",
      blurb:
        "The site you're reading: plain HTML, CSS and JavaScript with no build step, including a traffic simulation written from scratch on a canvas.",
      tech: ["HTML", "CSS", "JavaScript", "Canvas"],
      links: [
        { label: "Repository", url: "https://github.com/ADNAN-AB1R/ADNAN-AB1R.github.io" },
      ],
    },
  ],
  // Shown as a plain note on the projects page; no details.
  confidentialNote:
    "One ongoing project isn't listed here: it holds confidential information, so the repository is private.",

  // ── Experience ──────────────────────────────────────────────
  experience: [
    {
      title: "Transport modelling · Dhaka MATSim scenario",
      org: "In collaboration with a senior researcher at ETH Zurich",
      period: "2026 — present",
      bullets: [
        "Built the multimodal network for Dhaka from an OpenStreetMap extract using pt2matsim",
        "Converted the Dhaka GTFS feed into a MATSim transit schedule and vehicle set",
        "Generated the synthetic population and its daily activity plans",
        "Adapted an open mode choice model as the reference for Dhaka",
        "First author of the scenario paper accepted at the MATSim User Meeting 2026",
      ],
    },
    {
      title: "Founder",
      org: "Thread Co.",
      period: "2026 — present",
      bullets: [
        "Designed and built the storefront at threadcoofficial.com",
        "Runs a catalogue of 16 designs with nationwide cash-on-delivery across all 8 divisions",
      ],
    },
  ],

  // ── Education ───────────────────────────────────────────────
  education: [
    {
      institution: "Bangladesh University of Engineering and Technology (BUET)",
      qualification: "BSc in Civil Engineering",
      detail: "Currently Level 3, Term 1",
      place: "Dhaka",
    },
    { institution: "Notre Dame College", qualification: "Higher Secondary Certificate", detail: "", place: "Dhaka" },
    { institution: "Jashore Zilla School", qualification: "Secondary School Certificate", detail: "", place: "Jashore" },
  ],

  // ── Ventures ────────────────────────────────────────────────
  // A venture with `products` is shown as a full spotlight.
  ventures: [
    {
      name: "Thread Co.",
      kind: "Clothing brand · Bangladesh",
      role: "Founder · designed & built the storefront",
      status: "live",
      since: 2026,
      url: "https://www.threadcoofficial.com",
      tagline: "Where Elegance Meets Connection",
      blurb:
        "A youth-centric label of kurtis and three-piece sets, delivered nationwide with cash on delivery. The Summer Collection 2026 is out now.",
      quote:
        "Every Thread Co. piece is chosen for the woman who wants quiet, considered style: fabrics that feel as good as they look, and details that hold up past the first wear.",
      theme: { deep: "#14232b", mid: "#3c7689", accent: "#8abac8", ice: "#eef3f5" },
      links: [
        { label: "Visit the shop", url: "https://www.threadcoofficial.com" },
        { label: "Instagram", url: "https://www.instagram.com/threadco.official/" },
        { label: "Messenger", url: "https://m.me/61557321654412" },
      ],
      categories: [
        { label: "New arrivals", url: "https://www.threadcoofficial.com/new-arrivals/" },
        { label: "Kurtis", url: "https://www.threadcoofficial.com/kurtis/" },
        { label: "Three-piece sets", url: "https://www.threadcoofficial.com/three-piece/" },
        { label: "Restocked", url: "https://www.threadcoofficial.com/restocked/" },
      ],
      facts: [
        ["Catalogue", "16 designs"],
        ["Price range", "From ৳950"],
        ["Delivery", "All 8 divisions"],
        ["Payment", "Cash on delivery"],
      ],
      pricesAsOf: "September 2026",
      shelfTitle: "Summer Collection 2026",
      products: [
        { name: "Cherry Cola", category: "Kurti", price: 1200, was: 1500, badge: "20% off", img: "https://www.threadcoofficial.com/Cherry_Cola/main.jpeg", url: "https://www.threadcoofficial.com/product/cherry-cola/" },
        { name: "Cinnamon Charm", category: "Three-piece", price: 1750, badge: "Pre-order", img: "https://www.threadcoofficial.com/Cinnamon_Charm/main.jpg", url: "https://www.threadcoofficial.com/product/cinnamon-charm/" },
        { name: "Mystic Teal", category: "Kurti", price: 1200, img: "https://www.threadcoofficial.com/Mystic_Teal/main.jpeg", url: "https://www.threadcoofficial.com/product/mystic-teal/" },
        { name: "Rose & Coal", category: "Kurti", price: 1200, was: 1500, badge: "20% off", img: "https://www.threadcoofficial.com/Rose%26Coal/main.jpeg", url: "https://www.threadcoofficial.com/product/rose-and-coal/" },
        { name: "Pink Flora", category: "Kurti", price: 950, badge: "Pre-order", img: "https://www.threadcoofficial.com/Pink_Flora/main.jpeg", url: "https://www.threadcoofficial.com/product/pink-flora/" },
        { name: "Royal Tulip", category: "Kurti", price: 950, badge: "Pre-order", img: "https://www.threadcoofficial.com/Royal_Tulip/main.jpg", url: "https://www.threadcoofficial.com/product/royal-tulip/" },
      ],
    },
  ],

  // ── The toy simulation on the home page ─────────────────────
  // Deliberately labelled as a demo: it is NOT the Dhaka scenario.
  sim: {
    agents: 2400,
    modeShare: { car: 0.46, pt: 0.28, bike: 0.14, walk: 0.12 },
    peak: "07:45",
  },
};
