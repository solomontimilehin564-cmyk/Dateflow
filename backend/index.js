require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { geocode, addPlaces } = require("./places");
const { FREE_PLANS } = require("./free");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/api/dates", require("./dates"));

// Each vibe has up to 5 stops. "share" is the fraction of the budget for that stop.
const PLANS = {
  Romantic: [
    { type: "Warm-up", title: "Golden-hour walk", note: "Find a scenic spot near you and stroll together.", share: 0 },
    { type: "Dinner", title: "Candlelit dinner", note: "A quiet restaurant with soft lighting and a table for two.", share: 0.55 },
    { type: "Dessert", title: "Shared dessert", note: "One dessert, two spoons.", share: 0.2 },
    { type: "Activity", title: "Rooftop or waterfront views", note: "End the night somewhere with a view.", share: 0.15 },
    { type: "Finale", title: "Stargazing", note: "Find a dark spot and look up.", share: 0.1 },
  ],
  Adventurous: [
    { type: "Fuel up", title: "Street food crawl", note: "Try something neither of you has eaten before.", share: 0.25 },
    { type: "Activity", title: "Outdoor challenge", note: "Hiking, kayaking, climbing or go-karts.", share: 0.4 },
    { type: "Activity", title: "Explore a new neighborhood", note: "Pick a part of town you've never been to.", share: 0.1 },
    { type: "Dinner", title: "Hole-in-the-wall dinner", note: "Find the local favorite.", share: 0.2 },
    { type: "Finale", title: "Night market or late-night snack", note: "Keep the energy going.", share: 0.05 },
  ],
  Chill: [
    { type: "Warm-up", title: "Coffee and a slow stroll", note: "No schedule, no rush.", share: 0.15 },
    { type: "Activity", title: "Park picnic or bookstore browse", note: "Bring a blanket or pick a book for each other.", share: 0.25 },
    { type: "Dinner", title: "Casual dinner", note: "Somewhere relaxed where you can talk.", share: 0.4 },
    { type: "Activity", title: "Movie or board game night", note: "Easy and low pressure.", share: 0.15 },
    { type: "Finale", title: "Ice cream walk", note: "Wind down with something sweet.", share: 0.05 },
  ],
  Fancy: [
    { type: "Warm-up", title: "Cocktails or mocktails", note: "Dress up and start at a stylish bar.", share: 0.2 },
    { type: "Dinner", title: "Fine dining", note: "A tasting menu or a top-rated restaurant. Book ahead.", share: 0.5 },
    { type: "Activity", title: "Live music, theater or gallery", note: "Something cultural after dinner.", share: 0.2 },
    { type: "Dessert", title: "Dessert and coffee", note: "An elegant place to end the evening.", share: 0.1 },
    { type: "Finale", title: "City lights walk", note: "A short walk in your best outfits.", share: 0 },
  ],
  Spontaneous: [
    { type: "Warm-up", title: "Pick a direction", note: "Choose a street and walk until something looks fun.", share: 0 },
    { type: "Activity", title: "Say yes to the first interesting thing", note: "A pop-up, a street show, a new shop.", share: 0.3 },
    { type: "Dinner", title: "Coin-flip dinner", note: "Flip a coin at every corner to choose where to eat.", share: 0.4 },
    { type: "Activity", title: "Photo challenge", note: "Take 5 photos of things that match a random theme.", share: 0.1 },
    { type: "Finale", title: "Late-night treat", note: "Whatever you both feel like.", share: 0.2 },
  ],
};

function stopCount(hours) {
  if (hours <= 2) return 2;
  if (hours <= 4) return 3;
  if (hours <= 6) return 4;
  return 5;
}

app.get("/", (req, res) => {
  res.json({ message: "DateFlow API is running" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/plan", async (req, res) => {
  const { budget, vibe, location, hours, surprise, free } = req.body;
  const isFree = Boolean(free);

  if (!location || typeof location !== "string") {
    return res.status(400).json({ error: "Location is required." });
  }
  if (!PLANS[vibe]) {
    return res.status(400).json({ error: "Unknown vibe." });
  }
  const budgetNum = isFree ? 0 : Number(budget);
  const hoursNum = Number(hours);
  if ((!isFree && !budgetNum) || budgetNum < 0 || !hoursNum || hoursNum < 1) {
    return res.status(400).json({ error: "Budget and hours must be positive numbers." });
  }

  // Look up the location. A failed lookup falls back to the template stops.
  let point = null;
  if (process.env.GEOAPIFY_KEY) {
    try {
      point = await geocode(location);
      if (!point) {
        return res.status(400).json({
          error: "We couldn't find that location. Try a city name like Istanbul or Lagos.",
        });
      }
    } catch (err) {
      console.error("Location lookup failed:", err.message);
    }
  }

  const source = isFree ? FREE_PLANS : PLANS;
  const chosen = source[vibe].slice(0, stopCount(hoursNum));
  const totalShare = chosen.reduce((sum, s) => sum + s.share, 0) || 1;
  const minutesPerStop = Math.round((hoursNum * 60) / chosen.length);

  let stops = chosen.map((s, i) => ({
    order: i + 1,
    type: s.type,
    title: s.title,
    note: s.note,
    minutes: minutesPerStop,
    cost: isFree ? 0 : Math.round((budgetNum * s.share) / totalShare),
  }));

  if (point) {
    try {
      stops = await addPlaces(stops, vibe, point, isFree);
    } catch (err) {
      console.error("Venue search failed:", err.message);
    }
  }

  res.json({
    vibe,
    location: location.trim(),
    budget: budgetNum,
    hours: hoursNum,
    surprise: Boolean(surprise),
    free: isFree,
    stops,
  });
});

app.listen(PORT, () => {
  console.log(`DateFlow API running on port ${PORT}`);
});