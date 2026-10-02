import { useEffect, useState } from "react";
import "./App.css";

const VIBES = ["Romantic", "Adventurous", "Chill", "Fancy", "Spontaneous"];
const API_URL = import.meta.env.VITE_API_URL;

const CURRENCIES = {
  USD: { label: "Dollar ($)", locale: "en-US", min: 10, max: 500, step: 10, start: 100 },
  NGN: { label: "Naira (₦)", locale: "en-NG", min: 10000, max: 500000, step: 10000, start: 100000 },
};

const EMOJI = {
  "Warm-up": "🌅",
  "Fuel up": "🌮",
  Dinner: "🍝",
  Activity: "🎨",
  Dessert: "🍰",
  Finale: "✨",
};

function formatMoney(amount, currency) {
  return new Intl.NumberFormat(CURRENCIES[currency].locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatTime(startTime, offsetMinutes) {
  const [h, m] = startTime.split(":").map(Number);
  const d = new Date(2000, 0, 1, h, m + offsetMinutes);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function App() {
  const [currency, setCurrency] = useState("USD");
  const [budget, setBudget] = useState(CURRENCIES.USD.start);
  const [vibe, setVibe] = useState("Romantic");
  const [location, setLocation] = useState("");
  const [hours, setHours] = useState(3);
  const [startTime, setStartTime] = useState("18:00");
  const [plan, setPlan] = useState(null);
  const [shown, setShown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cur = CURRENCIES[currency];

  function chooseCurrency(code) {
    setCurrency(code);
    setBudget(CURRENCIES[code].start);
  }

  // Reveal timer: intro first, then one stop at a time, then the total.
  useEffect(() => {
    if (!plan || shown > plan.stops.length) return;
    const delay = shown === 0 ? 1500 : 1200;
    const timer = setTimeout(() => setShown((s) => s + 1), delay);
    return () => clearTimeout(timer);
  }, [plan, shown]);

  async function generate(surprise) {
    setLoading(true);
    setError("");
    setPlan(null);
    setShown(0);
    try {
      const res = await fetch(`${API_URL}/api/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budget, vibe, location, hours, surprise }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setPlan({ ...data, currency, startTime });
    } catch (err) {
      setError(err.message || "Could not reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    generate(false);
  }

  const total = plan ? plan.stops.reduce((sum, s) => sum + s.cost, 0) : 0;

  return (
    <main className="app">
      <h1>DateFlow</h1>
      <p className="tagline">Tell us your vibe. We'll handle the date.</p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="location">Where are you?</label>
        <input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City or neighborhood"
          required
        />

        <fieldset>
          <legend>Currency</legend>
          <div className="vibes">
            {Object.entries(CURRENCIES).map(([code, c]) => (
              <button
                key={code}
                type="button"
                className={code === currency ? "vibe active" : "vibe"}
                onClick={() => chooseCurrency(code)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </fieldset>

        <label htmlFor="budget">Budget: {formatMoney(budget, currency)}</label>
        <input
          id="budget"
          type="range"
          min={cur.min}
          max={cur.max}
          step={cur.step}
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
        />

        <label htmlFor="hours">Time available</label>
        <select
          id="hours"
          value={hours}
          onChange={(e) => setHours(Number(e.target.value))}
        >
          <option value={2}>2 hours</option>
          <option value={3}>3 hours</option>
          <option value={4}>4 hours</option>
          <option value={6}>6 hours</option>
          <option value={8}>Full day</option>
        </select>

        <label htmlFor="start">Start time</label>
        <input
          id="start"
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          required
        />

        <fieldset>
          <legend>Vibe</legend>
          <div className="vibes">
            {VIBES.map((v) => (
              <button
                key={v}
                type="button"
                className={v === vibe ? "vibe active" : "vibe"}
                onClick={() => setVibe(v)}
              >
                {v}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="actions">
          <button type="submit" className="primary" disabled={loading}>
            {loading ? "Planning..." : "Plan our date"}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => generate(true)}
            disabled={!location || loading}
          >
            Surprise me
          </button>
        </div>
      </form>

      {error && <p className="error">{error}</p>}

      {plan && (
        <section className="result" aria-live="polite">
          <h2 className="reveal-title">Your date is ready… 👀</h2>
          <p className="summary">
            {plan.vibe} in {plan.location}
          </p>

          <div className="timeline">
            {plan.stops.map((s, i) => {
              if (s.order > shown) return null;
              const offset = plan.stops
                .slice(0, i)
                .reduce((sum, p) => sum + p.minutes, 0);
              return (
                <div key={s.order}>
                  {i > 0 && <div className="arrow">↓</div>}
                  <div className="stop">
                    <div className="stop-emoji">{EMOJI[s.type] || "💕"}</div>
                    <div>
                      <small>Stop {s.order}</small>
                      <strong>{s.title}</strong>
                      <p>{s.note}</p>
                      <small>
                        {formatTime(plan.startTime, offset)} ·{" "}
                        {s.cost === 0 ? "Free" : formatMoney(s.cost, plan.currency)}
                      </small>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {shown > plan.stops.length && (
            <p className="total">
              {formatMoney(total, plan.currency)} estimated
            </p>
          )}
        </section>
      )}
    </main>
  );
}

export default App;