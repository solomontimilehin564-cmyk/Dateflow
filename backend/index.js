require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { buildPlan } = require("./planner");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/api/dates", require("./dates"));
app.use("/api/sessions", require("./sessions"));

app.get("/", (req, res) => {
  res.json({ message: "DateFlow API is running" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/plan", async (req, res) => {
  try {
    const result = await buildPlan(req.body || {});
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }
    res.json(result.plan);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Could not build the plan." });
  }
});

app.listen(PORT, () => {
  console.log("DateFlow API running on port " + PORT);
});