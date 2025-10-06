// search.ts
var searched = new Map;
function twodp(num) {
  return (num * 100 | 0) / 100;
}
function shortTowerName(tower_name) {
  return tower_name.split(/[\s-]/gm).map((word) => word.toLowerCase()).map((word) => word == "of" || word == "and" ? word[0] : word[0].toUpperCase()).join("");
}
function improvedAcronymQuery(query, acros) {
  if (query.length > 6)
    return 0;
  for (let acro of acros) {
    if (acro.startsWith(query))
      return 1;
    if (acro.startsWith(query, 2))
      return 2;
  }
  return 0;
}
function levenshtein(a, b) {
  const A = a.toLowerCase();
  const B = b.toLowerCase();
  const m = A.length;
  const n = B.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0;i <= m; i++)
    dp[i][0] = i;
  for (let j = 0;j <= n; j++)
    dp[0][j] = j;
  for (let i = 1;i <= m; i++) {
    for (let j = 1;j <= n; j++) {
      const cost = A[i - 1] === B[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}
function fuzzyScore(a, b) {
  const distance = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length, 1);
  return twodp(1 - distance / maxLen);
}
function searchTowers(query, names, opts) {
  opts = opts || {};
  const MIN_SCORE = typeof opts.minScore === "number" ? opts.minScore : 30;
  const q = query.trim().toLowerCase();
  if (q.length == 0)
    return names.map(({ name, short }) => {
      return { name, score: 100, reasons: ["empty query"] };
    });
  const qHasAcr = improvedAcronymQuery(q, names.map((v) => v.short));
  const scored = names.map(({ name, short }) => {
    let score = 100;
    const reasons = [];
    if (qHasAcr) {
      if (q == short) {
        score *= 3;
        reasons.push("Acro exact");
        return { name, score: Math.floor(score), reasons };
      }
      if (short.startsWith(q)) {
        score *= 1.4;
        reasons.push("Acro startswith");
      }
      const fs = fuzzyScore(q, short);
      if (fs > 0.6) {
        score *= fs / 0.6 * 0.9;
        reasons.push(`acro fuzzy: ${fs}`);
      }
    }
    if (q == name) {
      score *= 3;
      reasons.push("Name exact");
      return { name, score: Math.floor(score), reasons };
    }
    if (name.split(" ")[0] == q.split(" ")[0]) {
      score *= 1.05;
      reasons.push("name is type");
    }
    let start = false;
    if (name.startsWith(q)) {
      score *= 2;
      reasons.push("name start");
      start = true;
    }
    if (name.includes(q, start ? q.length : 0)) {
      score *= 1.15;
      reasons.push("name includes");
    }
    if (reasons.length == 0) {
      score *= 0.4;
      reasons.push("No reason, hence bad score");
    }
    let name_boost = twodp(1 / name.length + 1);
    score *= name_boost;
    reasons.push(`Name boost: ${name_boost}`);
    return { name, score: Math.floor(score), reasons };
  });
  return scored.filter((r) => r.score >= MIN_SCORE).sort((a, b) => {
    const byScore = b.score - a.score;
    return byScore !== 0 ? byScore : a.name.localeCompare(b.name);
  });
}
var data = [
  "Tower of Overcoming Hatred",
  "Tower of Inner and Outer Scaling",
  "This Is A Tower",
  "Wow! It's A Tower!",
  "Do Dat Look Like A Tower",
  "Tower of Modernistic Design Choices",
  "Tower of Genesis",
  "Tower of Buttons",
  "Tower of Motion Evolution",
  "Tower of Critical Damage",
  "Tower of Kinetic Potential",
  "Tower of No Strings Attached",
  "Tower of Keys To Success",
  "Citadel of Victory",
  "Tower of Dancing All Night",
  "Not Even A Tower",
  "Tower of A Simple Time",
  "Tower of Anger",
  "Tower of Madness",
  "Tower of Noticeable Infuriation",
  "Tower of Hecc",
  "Tower of Killjoys",
  "Tower of Keyboard Yeeting",
  "Tower of Stress",
  "Tower of Screen Punching",
  "Tower of Rage",
  "Tower of Impossible Expectations",
  "Citadel of Laptop Splitting",
  "Tower of True Skill",
  "Tower of Thanos Tower",
  "Maybe A Tower",
  "Tower of Phone Snapping",
  "Tower of Big Hole",
  "Tower of Cold Hands",
  "Tower of Falling and Failing",
  "Tower of Traps",
  "Tower of Deep Darkness",
  "Tower of Shattered Dreams",
  "Tower of Table Flipping",
  "Tower of Eternal Suffering",
  "Citadel of Wacky Strategy",
  "Tower of Difficulty Chart",
  "Tower of Funny Thoughts",
  "Tower of Inverted Colors",
  "Tower of Ancient Trickery",
  "Tower of Deep Sighing",
  "Tower of Fatness",
  "Tower of Winning Every Run",
  "Tower of Slight Inconvenience",
  "Tower of Wall Hugging",
  "Tower of Lotsa Damage",
  "Tower of Despair",
  "Citadel of Heights and Depths",
  "Tower of Confusion",
  "Tower of Spiralling Heights",
  "Tower of Getting Gnomed",
  "Tower of Terrible Mondays",
  "Tower of Elysium",
  "Tower of Linonophobia",
  "Tower of Leaning Ledges",
  "Tower of Dust and Decay",
  "Tower of Holy Flip",
  "Citadel of Uneasiness",
  "Tower of Oblivion",
  "Tower of Nonsensical Platforms",
  "Tower of Corrupted Nightmares",
  "Tower of Vivid Sections",
  "Tower of Inception",
  "Tower of Nice Views",
  "Tower of Trivial Resentment",
  "Tower of Rigid Success",
  "Tower of Downward Mobility",
  "Tower of Obvious Chaos",
  "Tower of Floral Fury",
  "Tower of Extraordinary Adventures",
  "Tower of Tokyo Heights",
  "Tower of Glitching and Healing",
  "Tower of Fractured Obstacles",
  "Citadel of Contrasting Regions",
  "Tower of Icy Blizzards",
  "Tower of Frightening Nightmares",
  "Tower of Friendly Jumps",
  "Tower of Environmental Pain",
  "Tower of Radiant Realms",
  "Tower of Twisted Inquisition",
  "Tower of A Depressing Future",
  "Tower of Intense Solar Chaos",
  "Tower of Dispersed Rooms",
  "Tower of Flustering Sections",
  "Tower of Niflheim",
  "Citadel of Scythe Recognition",
  "Tower of Strategic Mechanics",
  "Tower of Impossible Movement",
  "Tower of Rushed Building",
  "Tower of Collective Collaboration",
  "Tower of Feeling Lazy",
  "Tower of Distorted Aerodynamics",
  "Tower of Orientating Oscillating Opinions",
  "Tower of Never Giving Up, Ever",
  "Tower of Never Ending Dizziness",
  "Tower of Ultraviolet",
  "Citadel of True Exasperation",
  "Tower of Yearning Victory",
  "Tower of Extreme Hell",
  "Tower of Terrifying Beauty",
  "Tower of Elongated Runs",
  "Tower of Somewhat Simple Scaling",
  "Tower of Needing Basic Aptitude",
  "Tower of Voluminous Framework",
  "Tower of Vibrant Adventures",
  "Tower of Aamos' Anger",
  "Citadel of Constant Heart Stopping",
  "Tower of Uneasy Scaling",
  "Tower of Insanely Innovative Ideas",
  "Tower of Verdant Entropy",
  "Tower of Mean Tasks",
  "Tower of Suffering Outside",
  "Tower of Externalizing Insanity",
  "Tower of Generation Failure",
  "Tower of Great Overcomings",
  "Tower of Beat Block Berserk",
  "Tower of Questionable Trials",
  "Citadel of Lethargy",
  "Tower of Pastel Pillars",
  "Tower of High Adrenaline",
  "Tower of Bent Trauma",
  "Tower of Curved Ascent",
  "Tower of Frightening and Confusing Trials",
  "Tower of Bloodthirsty Kenos",
  "Tower of Journey's End",
  "Tower of Nervous Sweating",
  "Tower of Augmented Misery",
  "Tower of Champion's Road",
  "Tower of Cruel Punishment",
  "Steeple of Meaningless Decisions",
  "Tower of Jolly Good Fun",
  "Steeple of Low Woe",
  "Steeple of Pursuit",
  "This Is Probably A Tower",
  "Steeple of Uninstalling Roblox",
  "Tower of Immense Ire",
  "Steeple of Wall Punching",
  "Tower of Versatility",
  "Tower of Triangular Covering",
  "Steeple of Climbing",
  "Steeple of Huge Pain",
  "Tower of Increasing Stress",
  "Tower of Dangerous Expeditions",
  "Citadel of Weird Nostalgia",
  "Steeple of Towering Pillars",
  "Tower of Mind Breaking",
  "Steeple of Beginner's Journey",
  "Steeple of Devil's Snare",
  "Steeple of Infectious Foliage",
  "Steeple of Overgrowth",
  "Steeple of Nightfall",
  "Steeple of Overgrown Ascension",
  "Steeple of Greenhouse Placidity",
  "Steeple of Feudal Foliage",
  "Steeple of Lost In Quiescence",
  "Citadel of Biotech Genesis",
  "Steeple of Various Vivariums",
  "Steeple of Flourishing Wastelands",
  "Not Even A Flower",
  "Tower of Perilous Antipode",
  "Steeple of Buoyant Automations",
  "Steeple of Resort In Stasis",
  "Steeple of Ruinous Abate",
  "Tower of Ancestral Interference",
  "Steeple of Descendance",
  "Tower of There Is No Tower",
  "Steeple of Guiding Lights",
  "Steeple of Xenial Abyss",
  "Steeple of Wicked Grotto",
  "Tower of Shallow Waters",
  "Steeple of Involuntary Isolation",
  "Tower of Tenebrous Depths",
  "Steeple of Midnight Acropolis",
  "Steeple of Malignant Blight",
  "Tower of Excessive Weirdness",
  "Tower of Two Sided Troubles",
  "Citadel of Inside Situations",
  "Tower of Losing Our Zeal",
  "Tower of Diverging Layers",
  "Tower of Odd Odyssey",
  "Tower of Witchcraft and Wizardry",
  "Tower of Compact Spaces",
  "Tower of Tallying Every Mistake",
  "Tower of Triple Jeopardy",
  "Tower of Unsettling Heights",
  "Tower of Fruity Zeal",
  "Tower of Viaduct Traversing",
  "Tower of Corner Wedge Climbing",
  "Tower of Wanting More Time",
  "Tower of Shadowy Radiance",
  "Tower of Whisking It All",
  "Tower of Whirl of Winds",
  "Tower of Largely Limited Luminance",
  "Tower of Climactic Beats",
  "Tower of Rhythm Heaven",
  "Tower of Mechanical Disarray",
  "Tower of Wicked Fortress",
  "Tower of Lethean Recollection",
  "Tower of You're Late For Work",
  "Tower of Pursuit Led Astray",
  "Steeple of After-Life Detention",
  "Steeple of Balloon Commune",
  "Steeple of Two Minute Noodles",
  "Steeple of The Manufactured Monstrosity",
  "Tower of The Umbrella, The User",
  "Tower of Infiltrated Ruins",
  "Steeple of Itsy Bitsy",
  "Tower of A Disillusioned Existence",
  "Tower of Warranted Retribution",
  "Tower of Fleeing From Everything Ending",
  "Tower of House Without Home",
  "Steeple of Forlorn Blizzard",
  "Steeple of Cheesy Vengeance",
  "Tower of Zero Disturbances",
  "Tower of Peaceful Happiness and Tranquility",
  "Tower of Atlantic Depths",
  "Tower of Peace",
  "Tower of Hands Sweating",
  "Tower of Mirrored Hecc",
  "Tower of Contractual Obligations",
  "Tower of Yearning Success",
  "Tower of Absolute Vexation",
  "Tower of Wanting Extra Levels",
  "Tower of Ultimately Terrifying",
  "Tower of Extreme Dystopia",
  "Tower of Really Nasty Ideas",
  "Citadel of Peril",
  "Tower of Zespluz",
  "Tower of Thinning Layers",
  "Tower of Venomous Resonance",
  "Tower of Slanted Anticipation",
  "Tower of Ground Level Ascension",
  "Tower of Troublesome Adventures",
  "Tower of Unearthed Discoveries",
  "Tower of Dreams and Caverns",
  "Tower of Pleasant Fantasies",
  "Tower of Slipping and Sliding",
  "Citadel of Green Stuff",
  "Tower of Extraterrestrial Enchantment",
  "Tower of Arcanium Zenturing",
  "Tower of Triangular Terror",
  "Tower of Great Displeasure",
  "Tower of Chaotic Moments",
  "Tower of Double Trouble",
  "Tower of Six Feet Under",
  "Tower of Overestimating Difficulty",
  "Tower of Broken Bricks",
  "Tower of Client Object Frenzy",
  "Tower of Cracked, Crushed Cubes",
  "Tower of Xanthophobia",
  "Tower of Dimensional Hopping",
  "Tower of Mild Agitation",
  "Tower of Cogs and Steam",
  "Tower of Requiring Critical Help",
  "Citadel of Tricky Situations",
  "Tower of Menacing Creations",
  "Tower of Quirky Contraptions",
  "Tower of Infuriating Obstacles",
  "Tower of Cruel and Unusual Punishment",
  "Tower of Hopeless Hell",
  "Tower of Fairly Simple Challenges",
  "Tower of Aquatic Contemplation",
  "Tower of Fun and Simple Trials",
  "Tower of Up Is Down",
  "Tower of Wicked Wedges",
  "Tower of Elevator Travelling",
  "Tower of Pure Chroma",
  "Tower of Mechanically Induced Mayhem",
  "Tower of Shifting Slopes",
  "Tower of Dance Dance Destruction",
  "Tower of Funky Grooves",
  "Citadel of Quadrilaterals",
  "Tower of Tornado Vehemence",
  "Tower of Inevitable Failure",
  "Tower of Sovereign Traveling",
  "Tower of Super Stupid Security Systems",
  "Tower of Fractal Volution",
  "Tower of Bright Serenity",
  "Tower of Stairs To Spare",
  "Tower of Unhealthy Escalation",
  "Tower of Heiwana Kaze",
  "Tower of Horrifying Experiences",
  "Tower of Guided Trials",
  "Citadel of Corporate Enterprise",
  "Tower of Anticlimactic Outcomes",
  "Tower of Brutal and Bizarre Torment",
  "Tower of Zany Architecture",
  "Tower of Polychromatic Zero",
  "Tower of Alien Radiance",
  "Tower of Foreign Domains",
  "Tower of Rock Climbing",
  "Tower of Conflicting Frontiers",
  "Tower of Break It, Buy It",
  "Tower of Angled Scenery",
  "Tower of Hefty Magnitude",
  "Citadel of Twists and Weirdness",
  "Tower of Hazardous Laddering",
  "Tower of Watts",
  "Tower of Astral Fusion",
  "Tower of Massive Overheating",
  "Tower of Brief Challenges",
  "Tower of The Dripping Amalgam",
  "Tower of Micro Management",
  "Tower of Jazz",
  "Tower of Rough Waters",
  "Tower of Sweet Victory",
  "Tower of Bygone Relic",
  "Tower of Destructive Fever",
  "Tower of Growing Madness",
  "Tower of Cylindrical Extensions",
  "Tower of White Space",
  "Tower of Yore",
  "Tower of Cone Mesh Climbing",
  "Tower of Swift and Precise Sections",
  "Tower of Uncontrollable Ire",
  "Citadel of A Cruel Tale",
  "Tower of Fractured Memories",
  "Tower of Uncanny Agony",
  "Tower of Melons In Time",
  "Tower of Cosmic Tides",
  "Tower of A Tetromino Disaster",
  "Tower of X Madness",
  "Tower of Galactic Voyage",
  "Tower of Flame Restoration",
  "Tower of One Nine",
  "Tower of Never Ending Fun",
  "Tower of Manic Lows",
  "Tower of Overbearing Vertigo",
  "Citadel of Pyramid Escapades",
  "Tower of Time and Space Manipulation",
  "Tower of No Return",
  "Tower of Rough Endoplasmic Reticulum",
  "Tower of Astral Eclipse",
  "Tower of Descent Into Exile",
  "Tower of Arrantly Bodeful Cavern Depths",
  "Tower of Dusk To Dawn",
  "Tower of Latest Sensation",
  "Tower of Bonus Level",
  "Tower of Sugar Rush Deluxe",
  "Tower of Nothing New",
  "Tower of Furious Chicken Brawl",
  "Tower of Falling Up",
  "Tower of Eye Candy",
  "Tower of Big Blocky Beefy Buttons",
  "Tower of Minus Facility",
  "Citadel of Increasing Claustrophobia",
  "Tower of Voyaging Into The Earth",
  "Tower of Hollow Reformations",
  "Tower of Panelling Barricades",
  "Tower of Wildly Wacky Wonders",
  "Tower of Empty Meaningless Patterns",
  "Tower of Clandestine Zones",
  "Tower of Resonant Landscapes",
  "Tower of Interstellar Terrarium",
  "Tower of Valiant Verges",
  "Tower of Expecting The Unexpected",
  "Tower of Mach Nine",
  "Tower of One Two Three Four",
  "Tower of The Despondent Fortress",
  "Tower of Prismatic Instability",
  "Tower of Power Laws",
  "Tower of Rain on My World",
  "Tower of Tee Hee Time",
  "Tower of Blast Power",
  "Tower of Complexity and Volatility",
  "Tower of Raging Tempest",
  "Steeple of Biome Traversing",
  "Steeple of Astounding Sorcery",
  "Steeple of Realm Odyssey",
  "Steeple of Atmospheric Powers",
  "Steeple of Twisted Crystals",
  "Steeple of Magical Elements",
  "Steeple of Crystal Ascension",
  "Steeple of Witch Calamity",
  "Steeple of Magical Collaborations",
  "Tower of Icy Adventures",
  "Possibly A Tower",
  "Steeple of Mystical Marine",
  "Steeple of Abyssal Upturn",
  "Steeple of Sunny Island Shenanigans",
  "Steeple of Aquatic Rallies",
  "Steeple of Hallucinatory Spectacles",
  "Steeple of Desolate Isles",
  "Tower of Cyclonic Isles",
  "Steeple of Upright Cliffs",
  "Steeple of Cliffside Falls",
  "Tower of Traversing The Tropics",
  "Steeple of Underlying Breezes",
  "Steeple of Dusty Dunes",
  "Tower of Annoyingly Simple Trials",
  "Tower of Vesi Leikki",
  "Tower of Another Beginning",
  "Tower of Autumn Harvest",
  "Tower of Insult To Injury",
  "Tower of Generation Retro",
  "Tower of Quick, Brown Fox!",
  "Tower of Sparkling Rainbow Water",
  "Tower of One Equals Zero"
];

// usage.ts
var names = data.map((d) => ({ name: d.toLowerCase(), short: shortTowerName(d).toLowerCase() }));
var spans = new Map;
function createSpan(span_name) {
  const span = document.createElement("span");
  const score = document.createElement("span");
  score.innerText = "";
  const name = document.createElement("span");
  name.innerText = span_name;
  const reason = document.createElement("span");
  reason.innerText = "";
  span.appendChild(score);
  span.appendChild(name);
  span.appendChild(reason);
  spans.set(span_name, span);
  results.appendChild(span);
  return span;
}
function highlight_span(span, text, selected) {
  const selectedClass = selected ? " selected" : "";
  const escapeForCharClass = (s) => s.replace(/[-\\\]^]/g, (m) => `\\${m}`);
  if (!text)
    return;
  const chars = escapeForCharClass(text);
  const regex = new RegExp("[" + chars + "]+", "gi");
  const children = Array.from(span.childNodes);
  for (const node of children) {
    if (node.nodeType !== Node.TEXT_NODE)
      continue;
    const txt = node.textContent ?? "";
    if (!txt)
      continue;
    let lastIndex = 0;
    const frag = document.createDocumentFragment();
    let m;
    regex.lastIndex = 0;
    while (m = regex.exec(txt)) {
      const start = m.index;
      const matchText = m[0];
      if (start > lastIndex) {
        frag.appendChild(document.createTextNode(txt.slice(lastIndex, start)));
      }
      const hl = document.createElement("span");
      hl.className = "highlight" + selectedClass;
      hl.textContent = matchText;
      frag.appendChild(hl);
      lastIndex = start + matchText.length;
    }
    if (lastIndex < txt.length) {
      frag.appendChild(document.createTextNode(txt.slice(lastIndex)));
    }
    if (frag.childNodes.length === 0)
      continue;
    span.replaceChild(frag, node);
  }
}
function update_ui() {
  spans.forEach((span) => span.style.order = "10000");
  let results = searchTowers(query.value, names, { minScore: min.valueAsNumber });
  results.forEach((result, index) => {
    let span = spans.get(result.name);
    if (span == undefined)
      span = createSpan(result.name);
    span.firstElementChild.innerText = result.score.toString();
    highlight_span(span.children[1], query.value.trim(), false);
    span.lastElementChild.innerText = result.reasons.join(", ");
    span.style.order = index.toString();
  });
  count.innerText = `Result count: ${results.length}`;
}
var query;
var min;
var results;
var count;
globalThis.initialise = () => {
  query = document.getElementById("query");
  min = document.getElementById("minScore");
  results = document.getElementById("results");
  count = document.getElementById("count");
  query.addEventListener("input", (ev) => update_ui());
  min.addEventListener("input", (ev) => {
    update_ui();
  });
  update_ui();
};
document.addEventListener("DOMContentLoaded", globalThis.initialise);
globalThis.debug = {
  searched,
  improvedAcronymQuery,
  levenshtein
};
