const BASE = "https://api.geoapify.com";

const geoCache = new Map();

// Turn a typed location into coordinates. Returns null if nothing matches.
async function geocode(text) {
  const cacheKey = text.trim().toLowerCase();
  if (geoCache.has(cacheKey)) return geoCache.get(cacheKey);

  const url = `${BASE}/v1/geocode/search?text=${encodeURIComponent(text)}&limit=1&format=json&apiKey=${process.env.GEOAPIFY_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding failed with status ${res.status}`);

  const data = await res.json();
  const first = data.results && data.results[0];
  const point = first ? { lat: first.lat, lon: first.lon } : null;
  geoCache.set(cacheKey, point);
  return point;
}

function categoriesFor(vibe, type) {
  if (type === "Warm-up" && vibe === "Fancy") return "catering.bar";
  const map = {
    "Warm-up": "leisure.park,tourism.attraction",
    "Fuel up": "catering.fast_food,catering.restaurant",
    Dinner: "catering.restaurant",
    Activity: "entertainment,tourism.attraction",
    Dessert: "catering.cafe,catering.ice_cream",
    Finale: "tourism.attraction,leisure.park",
  };
  return map[type] || "catering.restaurant";
}

async function findPlaces(categories, point, radius = 5000) {
  const url =
    `${BASE}/v2/places?categories=${categories}` +
    `&filter=circle:${point.lon},${point.lat},${radius}` +
    `&bias=proximity:${point.lon},${point.lat}` +
    `&limit=20&apiKey=${process.env.GEOAPIFY_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return [];

  const data = await res.json();
  return (data.features || [])
    .map((f) => f.properties)
    .filter((p) => p.name)
    .map((p) => ({
      name: p.name,
      address: p.address_line2 || p.formatted || "",
      lat: p.lat,
      lon: p.lon,
    }));
}

// Attach a real nearby venue to each stop where one is found.
async function addPlaces(stops, vibe, point) {
  const lists = await Promise.all(
    stops.map((s) =>
      findPlaces(categoriesFor(vibe, s.type), point).catch(() => [])
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