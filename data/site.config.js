/*
 * ─────────────────────────────────────────────────────────────
 *  SITE CONFIG — the only file you need to edit.
 *  Everything on the dashboard is rendered from this object.
 *  Set `sample: true` to show a "sample content" banner while
 *  you're still filling things in.
 * ─────────────────────────────────────────────────────────────
 */
window.SITE = {
  sample: false,

  // ── Identity ────────────────────────────────────────────────
  name: "Adnan Abir",
  initials: "AA",
  roles: ["Civil Engineering · BUET", "MATSim researcher", "Founder, Thread Co."],
  tagline:
    "Civil engineering undergrad at BUET building agent-based simulations of how Dhaka moves, and founder of Thread Co., a youth-centric clothing brand.",
  location: "Dhaka, Bangladesh",
  // state: "good" | "busy" | "away"
  status: { label: "Open to research collaborations", state: "good" },

  // What you're doing right now (3–4 short lines work best)
  now: [
    "Building a MATSim scenario for Dhaka, a data-scarce megacity",
    "Presenting the Dhaka scenario at the MATSim User Meeting 2026",
    "Running Thread Co.: the Summer Collection 2026 is live",
  ],

  // Leave any link as "" to hide it
  links: {
    email: "2204153@ce.buet.ac.bd",
    github: "https://github.com/ADNAN-AB1R",
    orcid: "https://orcid.org/0009-0002-0297-5322",
    linkedin: "https://linkedin.com/in/adnan-abir-33a1a8336",
    cv: "",
  },

  // ── GitHub (live, pulled from the public API) ───────────────
  github: {
    username: "ADNAN-AB1R",
    maxRepos: 6,
    exclude: [], // repo names to hide, e.g. ["old-fork"]
  },

  // ── Research ────────────────────────────────────────────────
  research: {
    focus: [
      "Agent-based transport simulation with MATSim",
      "Scenario building for data-scarce megacities",
      "Synthetic populations and networks from open data",
    ],
    stack: ["MATSim", "Java", "Python", "OpenStreetMap", "QGIS"],
    // MATSim scenarios you maintain; the table stays hidden while this is empty.
    // Example: { name: "Dhaka baseline", sample: "10%", agents: 2100000, links: 180000, iterations: 300 }
    scenarios: [],
  },

  // ── Ventures ────────────────────────────────────────────────
  // status: "live" | "building" | "exited" | "paused"
  // A venture with `products` is shown as a full spotlight; others as a compact row.
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
      // Brand colours from threadcoofficial.com
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

  // ── Publications ────────────────────────────────────────────
  // type: "journal" | "conference" | "preprint" | "thesis"
  // BibTeX is generated automatically from these fields.
  // `me` must match how your name is written in `authors` so it gets highlighted.
  // Search and filters appear once you have 4 or more entries.
  me: "Adnan Abir",
  publications: [
    {
      year: 2026,
      type: "conference",
      title: "Towards a MATSim Scenario for a Data-Scarce Megacity: Dhaka, Bangladesh",
      authors: ["Adnan Abir", "Grace O. Kagho", "Tasnia Tabassum Prima", "Sk. Md. Mashrur"],
      venue: "MATSim User Meeting 2026",
      topics: ["MATSim", "data-scarce cities"],
      doi: "",
      url: "",
    },
  ],

  // ── Live simulation (the hero panel) ────────────────────────
  // A toy MATSim-style morning peak. Only cars load the roads.
  sim: {
    agents: 2400,
    modeShare: { car: 0.46, pt: 0.28, bike: 0.14, walk: 0.12 },
    peak: "07:45", // centre of the departure wave
  },
};
