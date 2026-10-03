// Food and activity options. "category" is the Geoapify search category,
// "part" is the word used to filter results when someone wants to skip it.
const CUISINES = {
  italian: { category: "catering.restaurant.italian", part: "italian" },
  turkish: { category: "catering.restaurant.turkish", part: "turkish" },
  pizza: { category: "catering.restaurant.pizza", part: "pizza" },
  burger: { category: "catering.restaurant.burger", part: "burger" },
  seafood: { category: "catering.restaurant.seafood", part: "seafood" },
  steak: { category: "catering.restaurant.steak_house", part: "steak_house" },
  kebab: { category: "catering.restaurant.kebab", part: "kebab" },
  indian: { category: "catering.restaurant.indian", part: "indian" },
  chinese: { category: "catering.restaurant.chinese", part: "chinese" },
  japanese: { category: "catering.restaurant.japanese", part: "japanese" },
  mexican: { category: "catering.restaurant.mexican", part: "mexican" },
  local: { category: "catering.restaurant.regional", part: "regional" },
};

// "free" is the version used for free dates (null means not free-friendly).
const ACTIVITIES = {
  outdoors: {
    categories: "leisure.park,tourism.attraction",
    free: "leisure.park,tourism.attraction",
  },
  culture: {
    categories: "entertainment.museum,entertainment.culture,tourism.sights",
    free: "tourism.sights,tourism.attraction",
  },
  games: {
    categories: "entertainment.escape_game,entertainment.bowling_alley",
    free: null,
  },
  movies: {
    categories: "entertainment.cinema",
    free: null,
  },
};

const DIETS = ["vegetarian", "halal"];

function pick(list, allowed) {
  if (!Array.isArray(list)) return [];
  return [...new Set(list.filter((x) => allowed.includes(x)))];
}

// Only known options get through. Anything else is dropped.
function cleanPrefs(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  const cuisines = pick(r.cuisines, Object.keys(CUISINES));
  const avoid = pick(r.avoid, Object.keys(CUISINES)).filter(
    (c) => !cuisines.includes(c)
  );
  return {
    cuisines: cuisines,
    avoid: avoid,
    diet: pick(r.diet, DIETS),
    activities: pick(r.activities, Object.keys(ACTIVITIES)),
  };
}

module.exports = { CUISINES, ACTIVITIES, DIETS, cleanPrefs };