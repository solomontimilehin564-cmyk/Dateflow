const { CUISINES, ACTIVITIES } = require("./prefs");

const BASE = "https://api.geoapify.com";

const geoCache = new Map();

// Turn a typed location into coordinates. Returns null if nothing matches.
async function geocode(text) {
  const cacheKey = text.trim().toLowerCase();
  if (geoCache.has(cacheKey)) return geoCache.get(cacheKey);

  const url =
    BASE +
    "/v1/geocode/search?text=" +
    encodeURIComponent(text) +
    "&limit=1&format=json&apiKey=" +
    process.env.GEOAPIFY_KEY;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Geocoding failed with status " + res.status);

  const data = await res.json();
  const first = data.results && data.results[0];
  const point = first ? { lat: first.lat, lon: first.lon } : null;
  geoCache.set(cacheKey, point);
  return point;
}

function baseCategories(vibe, type, free) {
  if (free) {
    const freeMap = {
      "Warm-up": "leisure.park",
      Picnic: "leisure.park",
      Activity: "tourism.sights,tourism.attraction",
      Finale: "tourism.attraction.viewpoint,beach,leisure.park",
    };
    return freeMap[type] || null;
  }
  if (type === "Warm-up" && vibe === "Fancy") return "catering.bar";
  const map = {
    "Warm-up": "leisure.park,tourism.attraction",
    "Fuel up": "catering.fast_food,catering.restaurant",
    Dinner: "catering.restaurant",
    Activity:
      "entertainment.culture,entertainment.cinema,entertainment.museum,entertainment.escape_game,entertainment.bowling_alley,tourism.attraction",
    Dessert: "catering.cafe,catering.ice_cream",
    Finale: "tourism.attraction,leisure.park",
  };
  return map[type] || "catering.restaurant";
}

// The searches to try for one stop, most specific first.
function attemptsFor(vibe, type, free, prefs) {
  const p = prefs || {};
  const attempts = [];
  const diet = (p.diet || []).join(",");
  const isFood = type === "Dinner" || type === "Fuel up";

  if (isFood) {
    const cats = (p.cuisines || []).map((id) => CUISINES[id].category);
    if (cats.length > 0) {
      if (diet) attempts.push({ categories: cats.join(","), conditions: diet });
      attempts.push({ categories: cats.join(",") });
    }
  }

  if (type === "Activity") {
    const cats = (p.activities || [])
      .map((id) => (free ? ACTIVITIES[id].free : ACTIVITIES[id].categories))
      .filter(Boolean);
    if (cats.length > 0) attempts.push({ categories: cats.join(",") });
  }

  const base = baseCategories(vibe, type, free);
  if (base) {
    if (isFood && diet) attempts.push({ categories: base, conditions: diet });
    attempts.push({ categories: base });
  }
  return attempts;
}

// Category words that should never appear for this kind of stop.
function excludedFor(vibe, type, prefs) {
  const always = ["adult", "nightclub", "casino", "gambling", "brothel"];
  let list;
  if (type === "Warm-up" && vibe === "Fancy") {
    list = always;
  } else {
    list = [...always, "pub", "bar"];
    if (type === "Dinner") list = [...list, "fast_food"];
  }
  if (type === "Dinner" || type === "Fuel up") {
    const avoid = ((prefs && prefs.avoid) || []).map((id) => CUISINES[id].part);
    list = [...list, ...avoid];
  }
  return list;
}

function hasExcluded(categories, excluded) {
  return categories.some((c) =>
    String(c)
      .split(".")
      .some((part) => excluded.includes(part))
  );
}

async function findPlaces(categories, point, excluded, conditions, radius = 5000) {
  let url =
    BASE +
    "/v2/places?categories=" +
    categories +
    "&filter=circle:" +
    point.lon +
    "," +
    point.lat +
    "," +
    radius +
    "&bias=proximity:" +
    point.lon +
    "," +
    point.lat +
    "&limit=30&apiKey=" +
    process.env.GEOAPIFY_KEY;
  if (conditions) url += "&conditions=" + conditions;

  const res = await fetch(url);
  if (!res.ok) {
    console.error("Places search failed (" + res.status + ") for " + categories);
    return [];
  }

  const data = await res.json();
  return (data.features || [])
    .map((f) => f.properties)
    .filter((p) => p.name && !/^\d+$/.test(String(p.name).trim()))
    .filter((p) => !hasExcluded(p.categories || [], excluded))
    .map((p) => ({
      name: String(p.name),
      address: p.address_line2 || p.formatted || "",
      lat: p.lat,
      lon: p.lon,
    }));
}

// Try the most specific search first, then fall back to broader ones.
async function searchStop(vibe, type, free, prefs, point) {
  const excluded = excludedFor(vibe, type, prefs);
  const attempts = attemptsFor(vibe, type, free, prefs);
  for (const a of attempts) {
    try {
      const found = await findPlaces(a.categories, point, excluded, a.conditions);
      if (found.length > 0) return found;
    } catch (err) {
      console.error("Search attempt failed:", err.message);
    }
  }
  return [];
}

// Attach a real nearby venue to each stop where one is found.
async function addPlaces(stops, vibe, point, free, prefs) {
  const lists = await Promise.all(
    stops.map((s) =>
      searchStop(vibe, s.type, free, prefs, point).catch(() => [])
    )
  );
  const used = new Set();
  return stops.map((s, i) => {
    const options = lists[i].filter((p) => !used.has(p.name)).slice(0, 8);
    if (options.length === 0) return s;
    const pick = options[Math.floor(Math.random() * options.length)];
    used.add(pick.name);
    return { ...s, place: pick };
  });
}

module.exports = { geocode, addPlaces };