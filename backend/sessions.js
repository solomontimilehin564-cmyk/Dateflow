const express = require("express");
const crypto = require("crypto");
const { Pool } = require("pg");
const { buildPlan, VIBES } = require("./planner");
const { geocode } = require("./places");

const router = express.Router();

const CURRENCIES = ["USD", "NGN"];
const ID_RE = /^[\w-]{1,20}$/;

// Lower number = calmer, higher number = more adventurous.
const ENERGY = { Chill: 1, Romantic: 2, Fancy: 3, Spontaneous: 4, Adventurous: 5 };

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.on("error", (err) => console.error("Database error:", err.message));

pool
  .query(
    "CREATE TABLE IF NOT EXISTS sessions (" +
      "id TEXT PRIMARY KEY, " +
      "host_key TEXT NOT NULL, " +
      "setup JSONB NOT NULL, " +
      "answers_a JSONB, " +
      "answers_b JSONB, " +
      "plan JSONB, " +
      "created_at TIMESTAMPTZ DEFAULT NOW())"
  )
  .then(() => console.log("Sessions ready"))
  .catch((err) => console.error("Sessions setup failed:", err.message));

function cleanAnswers(raw) {
  if (!raw || typeof raw !== "object") return null;
  const vibe = raw.vibe;
  const adventure = Number(raw.adventure);
  const free = Boolean(raw.free);
  const budget = free ? 0 : Number(raw.budget);
  if (!VIBES.includes(vibe)) return null;
  if (!Number.isInteger(adventure) || adventure < 1 || adventure > 5) return null;
  if (!free && (!budget || budget < 0 || budget > 100000000)) return null;
  return { vibe, adventure, free, budget };
}

// Blend two sets of answers into one set of plan inputs.
function combine(a, b) {
  const free = a.free || b.free;
  const budget = free ? 0 : Math.min(a.budget, b.budget);
  const adventure = (a.adventure + b.adventure) / 2;

  let vibe = a.vibe;
  if (a.vibe !== b.vibe) {
    const distA = Math.abs(ENERGY[a.vibe] - adventure);
    const distB = Math.abs(ENERGY[b.vibe] - adventure);
    if (distB < distA) vibe = b.vibe;
    else if (distB === distA && Math.random() < 0.5) vibe = b.vibe;
  }

  return {
    budget,
    free,
    vibe,
    blend: {
      vibes: [a.vibe, b.vibe],
      vibe,
      adventure: Math.round(adventure * 10) / 10,
      free,
      budget,
    },
  };
}

// Once both people have answered, build and store the plan (only once).
async function ensurePlan(row) {
  if (row.plan || !row.answers_a || !row.answers_b) return row;

  const combined = combine(row.answers_a, row.answers_b);
  const s = row.setup;
  const result = await buildPlan({
    budget: combined.budget,
    free: combined.free,
    vibe: combined.vibe,
    location: s.location,
    hours: s.hours,
    surprise: s.surprise,
    stay: s.stay,
  });
  if (result.error) throw new Error(result.error);

  const plan = {
    ...result.plan,
    currency: s.currency,
    startTime: s.startTime,
    date: s.date,
    blend: combined.blend,
  };

  const saved = await pool.query(
    "UPDATE sessions SET plan = $1 WHERE id = $2 AND plan IS NULL RETURNING *",
    [JSON.stringify(plan), row.id]
  );
  if (saved.rows.length > 0) return saved.rows[0];

  const again = await pool.query("SELECT * FROM sessions WHERE id = $1", [row.id]);
  return again.rows[0];
}

// Raw answers are never sent to the browser. Only the status and the finished plan.
function publicView(row) {
  return {
    id: row.id,
    setup: row.setup,
    aDone: Boolean(row.answers_a),
    bDone: Boolean(row.answers_b),
    plan: row.plan,
  };
}

// Create a session
router.post("/", async (req, res) => {
  const b = req.body || {};
  const stay = Boolean(b.stay);
  const hours = Number(b.hours);

  if (!stay && (typeof b.location !== "string" || !b.location.trim())) {
    return res.status(400).json({ error: "Location is required." });
  }
  if (!hours || hours < 1 || hours > 12) {
    return res.status(400).json({ error: "Hours must be between 1 and 12." });
  }
  if (typeof b.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(b.date)) {
    return res.status(400).json({ error: "A valid date is required." });
  }
  if (typeof b.startTime !== "string" || !/^\d{2}:\d{2}$/.test(b.startTime)) {
    return res.status(400).json({ error: "A valid start time is required." });
  }
  if (!CURRENCIES.includes(b.currency)) {
    return res.status(400).json({ error: "Unknown currency." });
  }

  // Check the location now so a typo doesn't break the plan later.
  if (!stay && process.env.GEOAPIFY_KEY) {
    try {
      const point = await geocode(b.location);
      if (!point) {
        return res.status(400).json({
          error: "We couldn't find that location. Try a city name like Istanbul or Lagos.",
        });
      }
    } catch (err) {
      console.error("Location lookup failed:", err.message);
    }
  }

  const setup = {
    stay,
    location: stay ? "Home" : b.location.trim(),
    hours,
    date: b.date,
    startTime: b.startTime,
    currency: b.currency,
    surprise: Boolean(b.surprise),
  };

  try {
    const id = crypto.randomBytes(5).toString("base64url");
    const hostKey = crypto.randomBytes(16).toString("hex");
    await pool.query(
      "INSERT INTO sessions (id, host_key, setup) VALUES ($1, $2, $3)",
      [id, hostKey, JSON.stringify(setup)]
    );
    res.status(201).json({ id, hostKey });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Could not create the session." });
  }
});

// Check a session. Returns the plan once both people have answered.
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!ID_RE.test(id)) {
    return res.status(400).json({ error: "Invalid session link." });
  }
  try {
    const found = await pool.query("SELECT * FROM sessions WHERE id = $1", [id]);
    if (found.rows.length === 0) {
      return res.status(404).json({ error: "We couldn't find that session." });
    }
    const row = await ensurePlan(found.rows[0]);
    res.json(publicView(row));
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Could not load the session." });
  }
});

// Submit one person's private answers
router.post("/:id/answers", async (req, res) => {
  const { id } = req.params;
  if (!ID_RE.test(id)) {
    return res.status(400).json({ error: "Invalid session link." });
  }
  const body = req.body || {};
  const role = body.role;
  if (role !== "host" && role !== "guest") {
    return res.status(400).json({ error: "Unknown role." });
  }
  const answers = cleanAnswers(body.answers);
  if (!answers) {
    return res.status(400).json({ error: "Please answer every question." });
  }

  try {
    const found = await pool.query("SELECT * FROM sessions WHERE id = $1", [id]);
    if (found.rows.length === 0) {
      return res.status(404).json({ error: "We couldn't find that session." });
    }
    const row = found.rows[0];

    if (role === "host") {
      const given = Buffer.from(String(body.hostKey || ""));
      const real = Buffer.from(row.host_key);
      if (given.length !== real.length || !crypto.timingSafeEqual(given, real)) {
        return res.status(403).json({ error: "Only the person who created this session can do that." });
      }
    }

    const column = role === "host" ? "answers_a" : "answers_b";
    const updated = await pool.query(
      "UPDATE sessions SET " + column + " = $1 WHERE id = $2 AND " + column + " IS NULL RETURNING *",
      [JSON.stringify(answers), id]
    );
    if (updated.rowCount === 0) {
      return res.status(409).json({ error: "Those answers were already submitted." });
    }

    const row2 = await ensurePlan(updated.rows[0]);
    res.json(publicView(row2));
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Could not save your answers." });
  }
});

module.exports = router;