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
  const [shareUrl, setShareUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const cur = CURRENCIES[currency];

  function chooseCurrency(code) {
    setCurrency(code);
    setBudget(CURRENCIES[code].start);
  }

  // If the page was opened from a shared link (?d=ID), load that date.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("d");
    if (!id) return;
    setLoading(true);
    fetch(`${API_URL}/api/dates/${encodeURIComponent(id)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "We couldn't find that date.");
        setPlan(data);
        setShown(data.surprise ? 0 : data.stops.length + 1);
        setShareUrl(window.location.href);
      })
      .catch((err) => setError(err.message || "Could not load that date."))
      .finally(() => setLoading(false));
  }, []);

  // Normal mode: reveal automatically. Surprise mode: the couple taps to reveal.
  useEffect(() => {
    if (!plan || plan.surprise || shown > plan.stops.length) return;
    const delay = shown === 0 ? 1500 : 1200;
    const timer = setTimeout(() => setShown((s) => s + 1), delay);
    return () => clearTimeout(timer);
  }, [plan, shown]);

  async function generate(surprise) {
    setLoading(true);
    setError("");
    setPlan(null);
    setShown(0);
    setShareUrl("");
    setCopied(false);
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

  async function copyLink(url) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  async function saveAndShare() {
    if (shareUrl) {
      copyLink(shareUrl);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/dates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(plan),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save the date.");
      const url = `${window.location.origin}${window.location.pathname}?d=${data.id}`;
      setShareUrl(url);
      copyLink(url);
    } catch (err) {
      setError(err.message || "Could not save the date. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const total = plan ? plan.stops.reduce((sum, s) => sum + s.cost, 0) : 0;

  let nextLabel = "";
  if (plan && plan.surprise) {
    if (shown === 0) nextLabel = "Start our date";
    else if (shown < plan.stops.length) nextLabel = "We're done here. Next stop";
    else if (shown === plan.stops.length) nextLabel = "Show the total cost";
  }

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
          <h2 className="reveal-title">
            {plan.surprise ? "Your surprise date is ready 🎁" : "Your date is ready… 👀"}
          </h2>
          <p className="summary">
            {plan.surprise
              ? `A secret date in ${plan.location}`
              : `${plan.vibe} in ${plan.location}`}
          </p>

          {plan.surprise && shown === 0 && (
            <p className="teaser">
              No peeking. Each stop stays secret until you tap the button, so
              you both find out together.
            </p>
          )}

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

          {nextLabel && (
            <button
              type="button"
              className="next-btn"
              onClick={() => setShown((s) => s + 1)}
            >
              {nextLabel}
            </button>
          )}

          {shown > plan.stops.length && (
            <p className="total">
              {formatMoney(total, plan.currency)} estimated
            </p>
          )}

          <button
            type="button"
            className="share-btn"
            onClick={saveAndShare}
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : shareUrl
              ? copied
                ? "Link copied ✓"
                : "Copy link"
              : "Save and share this date"}
          </button>

          {shareUrl && (
            <input
              className="share-link"
              readOnly
              value={shareUrl}
              aria-label="Shareable link"
              onFocus={(e) => e.target.select()}
            />
          )}
        </section>
      )}
    </main>
  );
}

export default App;