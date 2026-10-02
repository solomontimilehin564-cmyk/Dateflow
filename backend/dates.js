const express = require("express");
const crypto = require("crypto");
const { Pool } = require("pg");

const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.on("error", (err) => console.error("Database error:", err.message));

pool
  .query(
    `CREATE TABLE IF NOT EXISTS dates (
      id TEXT PRIMARY KEY,
      plan JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`
  )
  .then(() => console.log("Database ready"))
  .catch((err) => console.error("Database setup failed:", err.message));

// Save a plan and get back a short share ID
router.post("/", async (req, res) => {
  const plan = req.body;
  if (!plan || !Array.isArray(plan.stops) || plan.stops.length === 0) {
    return res.status(400).json({ error: "A plan with stops is required." });
  }
  try {
    const id = crypto.randomBytes(5).toString("base64url");
    await pool.query("INSERT INTO dates (id, plan) VALUES ($1, $2)", [
      id,
      JSON.stringify(plan),
    ]);
    res.status(201).json({ id });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Could not save the date." });
  }
});

// Load a saved plan by its share ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!/^[\w-]{1,20}$/.test(id)) {
    return res.status(400).json({ error: "Invalid date link." });
  }
  try {
    const result = await pool.query("SELECT plan FROM dates WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "We couldn't find that date." });
    }
    res.json(result.rows[0].plan);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Could not load the date." });
  }
});

module.exports = router;