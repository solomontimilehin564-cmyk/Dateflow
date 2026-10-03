import { useEffect, useState } from "react";
import "./App.css";

const VIBES = ["Romantic", "Adventurous", "Chill", "Fancy", "Spontaneous"];
const API_URL = import.meta.env.VITE_API_URL;

const CURRENCIES = {
  USD: { label: "Dollar ($)", locale: "en-US", min: 10, max: 500, step: 10, start: 100 },
  NGN: { label: "Naira (₦)", locale: "en-NG", min: 10000, max: 500000, step: 10000, start: 100000 },
};

const ADVENTURE_LABELS = [
  "Very laid back",
  "Easy-going",
  "Up for some fun",
  "Adventurous",
  "All in",
];

const CUISINE_OPTIONS = [
  ["italian", "Italian"],
  ["turkish", "Turkish"],
  ["pizza", "Pizza"],
  ["burger", "Burgers"],
  ["seafood", "Seafood"],
  ["steak", "Steak"],
  ["kebab", "Kebab"],
  ["indian", "Indian"],
  ["chinese", "Chinese"],
  ["japanese", "Japanese"],
  ["mexican", "Mexican"],
  ["local", "Local / regional"],
];

const DIET_OPTIONS = [
  ["vegetarian", "Vegetarian"],
  ["halal", "Halal"],
];

const ACTIVITY_OPTIONS = [
  ["outdoors", "Outdoors"],
  ["culture", "Museums and art"],
  ["games", "Games and fun"],
  ["movies", "Movies"],
];

const LABELS = {};
[...CUISINE_OPTIONS, ...DIET_OPTIONS, ...ACTIVITY_OPTIONS].forEach((o) => {
  LABELS[o[0]] = o[1];
});

const EMPTY_PREFS = { cuisines: [], avoid: [], diet: [], activities: [] };

const EMOJI = {
  "Warm-up": "🌅",
  "Fuel up": "🌮",
  Dinner: "🍝",
  Activity: "🎨",
  Dessert: "🍰",
  Picnic: "🧺",
  Cook: "👩‍🍳",
  Drinks: "🍹",
  Game: "🎲",
  Movie: "🎬",
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

// Today's date as YYYY-MM-DD in the user's own time zone.
function todayString() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + mm + "-" + dd;
}

// "2026-10-03" -> "Saturday, October 3, 2026"
function formatDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function mapsUrl(place) {
  const query = encodeURIComponent(place.name + " " + place.address);
  return "https://www.google.com/maps/search/?api=1&query=" + query;
}

function sessionLink(id) {
  return window.location.origin + window.location.pathname + "?s=" + id;
}

function readHostKey(id) {
  try {
    return window.localStorage.getItem("dateflow_host_" + id);
  } catch {
    return null;
  }
}

function saveHostKey(id, key) {
  try {
    window.localStorage.setItem("dateflow_host_" + id, key);
  } catch {
    // Storage can be blocked. The session still works.
  }
}

async function postJson(path, body) {
  const res = await fetch(API_URL + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

function toggleIn(list, id) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

function namesOf(ids) {
  return ids.map((id) => LABELS[id] || id).join(", ");
}

function prefsLine(p) {
  if (!p) return "";
  const parts = [];
  if (p.cuisines.length) parts.push("Food: " + namesOf(p.cuisines));
  if (p.avoid.length) parts.push("Skipping: " + namesOf(p.avoid));
  if (p.diet.length) parts.push("Diet: " + namesOf(p.diet));
  if (p.activities.length) parts.push("Activities: " + namesOf(p.activities));
  let line = parts.join(" · ");
  if (line && p.diet.length) {
    line += ". Dietary needs are matched when the map has the info, so confirm with the venue.";
  }
  return line;
}

function PrefsPicker({ prefs, onChange }) {
  function toggle(group, id) {
    const next = { ...prefs, [group]: toggleIn(prefs[group], id) };
    if (group === "cuisines" && next.cuisines.includes(id)) {
      next.avoid = next.avoid.filter((x) => x !== id);
    }
    if (group === "avoid" && next.avoid.includes(id)) {
      next.cuisines = next.cuisines.filter((x) => x !== id);
    }
    onChange(next);
  }

  function chips(group, options, cls) {
    return (
      <div className="chips">
        {options.map((o) => {
          const on = prefs[group].includes(o[0]);
          return (
            <button
              key={o[0]}
              type="button"
              aria-pressed={on}
              className={on ? "chip " + cls : "chip"}
              onClick={() => toggle(group, o[0])}
            >
              {o[1]}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <details className="prefs">
      <summary>Food and activity preferences (optional)</summary>
      <p className="pref-title">Food you love</p>
      {chips("cuisines", CUISINE_OPTIONS, "on")}
      <p className="pref-title">Food to skip</p>
      {chips("avoid", CUISINE_OPTIONS, "skip")}
      <p className="pref-title">Dietary needs</p>
      {chips("diet", DIET_OPTIONS, "on")}
      <p className="pref-title">Activities you enjoy</p>
      {chips("activities", ACTIVITY_OPTIONS, "on")}
    </details>
  );
}

function App() {
  const [stay, setStay] = useState(false);
  const [together, setTogether] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [budget, setBudget] = useState(CURRENCIES.USD.start);
  const [free, setFree] = useState(false);
  const [vibe, setVibe] = useState("Romantic");
  const [adventure, setAdventure] = useState(3);
  const [prefs, setPrefs] = useState(EMPTY_PREFS);
  const [location, setLocation] = useState("");
  const [hours, setHours] = useState(3);
  const [date, setDate] = useState(todayString());
  const [startTime, setStartTime] = useState("18:00");
  const [plan, setPlan] = useState(null);
  const [shown, setShown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Couple session state
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [gVibe, setGVibe] = useState("Romantic");
  const [gAdventure, setGAdventure] = useState(3);
  const [gFree, setGFree] = useState(false);
  const [gBudget, setGBudget] = useState(null);
  const [gPrefs, setGPrefs] = useState(EMPTY_PREFS);

  const cur = CURRENCIES[currency];
  const setup = session ? session.setup : null;
  const gCur = setup ? CURRENCIES[setup.currency] : null;
  const gBudgetValue = gCur ? (gBudget === null ? gCur.start : gBudget) : 0;

  const needsGuestAnswers =
    session && !session.plan && role === "guest" && !session.bDone;
  const waiting =
    session &&
    !session.plan &&
    ((role === "host" && session.aDone) || (role === "guest" && session.bDone));

  function chooseCurrency(code) {
    setCurrency(code);
    setBudget(CURRENCIES[code].start);
  }

  // Open a shared link: ?s=ID is a couple session, ?d=ID is a saved date.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("s");
    const did = params.get("d");

    if (sid) {
      setLoading(true);
      fetch(API_URL + "/api/sessions/" + encodeURIComponent(sid))
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "We couldn't find that session.");
          setRole(readHostKey(sid) ? "host" : "guest");
          setSession(data);
          if (data.plan) {
            setPlan(data.plan);
            setShown(0);
          }
        })
        .catch((err) => setError(err.message || "Could not load that session."))
        .finally(() => setLoading(false));
      return;
    }

    if (did) {
      setLoading(true);
      fetch(API_URL + "/api/dates/" + encodeURIComponent(did))
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "We couldn't find that date.");
          setPlan(data);
          setShown(data.surprise ? 0 : data.stops.length + 1);
          setShareUrl(window.location.href);
        })
        .catch((err) => setError(err.message || "Could not load that date."))
        .finally(() => setLoading(false));
    }
  }, []);

  // While waiting for the other person, check for the finished plan.
  useEffect(() => {
    if (!session || session.plan) return;
    const answered = role === "host" ? session.aDone : session.bDone;
    if (!answered) return;
    const id = session.id;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(API_URL + "/api/sessions/" + encodeURIComponent(id));
        const data = await res.json();
        if (res.ok) {
          setSession(data);
          if (data.plan) {
            setPlan(data.plan);
            setShown(0);
            setShareUrl("");
          }
        }
      } catch {
        // Keep waiting.
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [session, role]);

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
      const data = await postJson("/api/plan", {
        budget: free ? 0 : budget,
        free: free,
        stay: stay,
        vibe: vibe,
        location: stay ? "Home" : location,
        hours: hours,
        surprise: surprise,
        prefs: stay ? EMPTY_PREFS : prefs,
      });
      setPlan({ ...data, currency: currency, startTime: startTime, date: date });
    } catch (err) {
      setError(err.message || "Could not reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function createSession(surprise) {
    setLoading(true);
    setError("");
    setPlan(null);
    setShown(0);
    setShareUrl("");
    try {
      const created = await postJson("/api/sessions", {
        stay: stay,
        location: stay ? "Home" : location,
        hours: hours,
        date: date,
        startTime: startTime,
        currency: currency,
        surprise: surprise,
      });
      saveHostKey(created.id, created.hostKey);
      const state = await postJson("/api/sessions/" + created.id + "/answers", {
        role: "host",
        hostKey: created.hostKey,
        answers: {
          budget: free ? 0 : budget,
          vibe: vibe,
          adventure: adventure,
          free: free,
          prefs: stay ? EMPTY_PREFS : prefs,
        },
      });
      window.history.pushState({}, "", "?s=" + created.id);
      setRole("host");
      setSession(state);
    } catch (err) {
      setError(err.message || "Could not start the session. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function submitGuest() {
    setLoading(true);
    setError("");
    try {
      const state = await postJson("/api/sessions/" + session.id + "/answers", {
        role: "guest",
        answers: {
          budget: gFree ? 0 : gBudgetValue,
          vibe: gVibe,
          adventure: gAdventure,
          free: gFree,
          prefs: setup.stay ? EMPTY_PREFS : gPrefs,
        },
      });
      setSession(state);
      if (state.plan) {
        setPlan(state.plan);
        setShown(0);
        setShareUrl("");
      }
    } catch (err) {
      setError(err.message || "Could not save your answers. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (together) createSession(false);
    else generate(false);
  }

  function resetAll() {
    setSession(null);
    setRole(null);
    setPlan(null);
    setShown(0);
    setShareUrl("");
    setError("");
    setLinkCopied(false);
    setGBudget(null);
    setGFree(false);
    setGPrefs(EMPTY_PREFS);
    window.history.pushState({}, "", window.location.pathname);
  }

  async function copyLink(url) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  async function copySessionLink() {
    try {
      await navigator.clipboard.writeText(sessionLink(session.id));
      setLinkCopied(true);
    } catch {
      setLinkCopied(false);
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
      const data = await postJson("/api/dates", plan);
      const url = window.location.origin + window.location.pathname + "?d=" + data.id;
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

  let summaryText = "";
  if (plan) {
    if (plan.surprise) {
      summaryText = plan.stay ? "A secret date at home" : "A secret date in " + plan.location;
    } else {
      summaryText = plan.stay ? plan.vibe + " at home" : plan.vibe + " in " + plan.location;
    }
  }

  let blendText = "";
  let tastesText = "";
  if (plan && plan.blend) {
    const b = plan.blend;
    blendText = "💞 Blended from " + b.vibes[0] + " + " + b.vibes[1];
    if (b.vibes[0] !== b.vibes[1]) blendText += " → " + b.vibe;
    blendText += b.free
      ? ". One of you wanted a free date, so it costs nothing."
      : ". Budget set to the lower of your two.";
    tastesText = prefsLine(b.prefs);
  }
  const showBlend = plan && plan.blend && (!plan.surprise || shown > plan.stops.length);

  return (
    <main className="app">
      <h1 className="brand">
        <img src="/logo.svg" alt="" />
        DateFlow
      </h1>
      <p className="tagline">Tell us your vibe. We'll handle the date.</p>

      {!session && (
        <form onSubmit={handleSubmit}>
          <fieldset>
            <legend>Where is the date?</legend>
            <div className="vibes">
              <button
                type="button"
                className={!stay ? "vibe active" : "vibe"}
                onClick={() => setStay(false)}
              >
                Go out
              </button>
              <button
                type="button"
                className={stay ? "vibe active" : "vibe"}
                onClick={() => setStay(true)}
              >
                Stay in
              </button>
            </div>
          </fieldset>

          {!stay && (
            <>
              <label htmlFor="location">Where are you?</label>
              <input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City or neighborhood"
                required
              />
            </>
          )}

          <fieldset>
            <legend>Who is planning?</legend>
            <div className="vibes">
              <button
                type="button"
                className={!together ? "vibe active" : "vibe"}
                onClick={() => setTogether(false)}
              >
                On my own
              </button>
              <button
                type="button"
                className={together ? "vibe active" : "vibe"}
                onClick={() => setTogether(true)}
              >
                With my partner
              </button>
            </div>
          </fieldset>

          {together && (
            <p className="hint">
              You answer privately, then send a link. Your partner answers too,
              and DateFlow blends both.
            </p>
          )}

          <div className="free-toggle">
            <input id="free" type="checkbox" checked={free} onChange={(e) => setFree(e.target.checked)} />
            <label htmlFor="free">
              <strong>Free date</strong>
              <small>
                {stay
                  ? "Uses only what you already have at home."
                  : "Parks, views, walks and picnics. Costs nothing."}
              </small>
            </label>
          </div>

          {(!free || together) && (
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
          )}

          {!free && (
            <>
              <label htmlFor="budget">
                Budget: {formatMoney(budget, currency)}
              </label>
              <input
                id="budget"
                type="range"
                min={cur.min}
                max={cur.max}
                step={cur.step}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
              />
            </>
          )}

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

          <label htmlFor="date">Date of the date</label>
          <input
            id="date"
            type="date"
            value={date}
            min={todayString()}
            onChange={(e) => setDate(e.target.value)}
            required
          />

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

          {together && (
            <>
              <label htmlFor="adventure">
                How adventurous do you feel? {ADVENTURE_LABELS[adventure - 1]}
              </label>
              <input
                id="adventure"
                type="range"
                min="1"
                max="5"
                step="1"
                value={adventure}
                onChange={(e) => setAdventure(Number(e.target.value))}
              />
            </>
          )}

          {!stay && <PrefsPicker prefs={prefs} onChange={setPrefs} />}

          <div className="actions">
            <button type="submit" className="primary" disabled={loading}>
              {loading ? "Working..." : together ? "Start our session" : "Plan our date"}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => (together ? createSession(true) : generate(true))}
              disabled={(!stay && !location) || loading}
            >
              {together ? "Surprise us" : "Surprise me"}
            </button>
          </div>
        </form>
      )}

      {needsGuestAnswers && setup && (
        <section className="result">
          <h2>You're invited to a DateFlow 💕</h2>
          <p className="summary">
            {setup.stay ? "At home" : "In " + setup.location} · {setup.hours} hours
          </p>
          <p className="when">
            📅 {formatDate(setup.date)} at {formatTime(setup.startTime, 0)}
          </p>
          <p className="hint">
            {setup.surprise ? "This one is a surprise date. " : ""}
            Your answers stay private until the plan is ready.
          </p>

          <div className="join-fields">
            <fieldset>
              <legend>Your vibe</legend>
              <div className="vibes">
                {VIBES.map((v) => (
                  <button
                    key={v}
                    type="button"
                    className={v === gVibe ? "vibe active" : "vibe"}
                    onClick={() => setGVibe(v)}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </fieldset>

            <label htmlFor="gadventure">
              How adventurous do you feel? {ADVENTURE_LABELS[gAdventure - 1]}
            </label>
            <input
              id="gadventure"
              type="range"
              min="1"
              max="5"
              step="1"
              value={gAdventure}
              onChange={(e) => setGAdventure(Number(e.target.value))}
            />

            <div className="free-toggle">
              <input id="gfree" type="checkbox" checked={gFree} onChange={(e) => setGFree(e.target.checked)} />
              <label htmlFor="gfree">
                <strong>I'd like it free</strong>
                <small>If either of you picks free, the date costs nothing.</small>
              </label>
            </div>

            {!gFree && (
              <>
                <label htmlFor="gbudget">
                  Your budget: {formatMoney(gBudgetValue, setup.currency)}
                </label>
                <input
                  id="gbudget"
                  type="range"
                  min={gCur.min}
                  max={gCur.max}
                  step={gCur.step}
                  value={gBudgetValue}
                  onChange={(e) => setGBudget(Number(e.target.value))}
                />
              </>
            )}

            {!setup.stay && <PrefsPicker prefs={gPrefs} onChange={setGPrefs} />}

            <button
              type="button"
              className="primary join-btn"
              onClick={submitGuest}
              disabled={loading}
            >
              {loading ? "Working..." : "Add my answers"}
            </button>
          </div>
        </section>
      )}

      {waiting && (
        <section className="result">
          <h2>Your answers are locked in 🔒</h2>
          <p className="summary">
            {role === "host"
              ? "Send this link to your partner. They answer the same questions, and DateFlow blends both."
              : "Waiting for the plan to be ready."}
          </p>
          <input
            className="share-link"
            readOnly
            value={sessionLink(session.id)}
            aria-label="Link for your partner"
            onFocus={(e) => e.target.select()}
          />
          <button type="button" className="share-btn" onClick={copySessionLink}>
            {linkCopied ? "Link copied ✓" : "Copy link"}
          </button>
          <p className="waiting">
            <span className="dot"></span>
            Waiting for your partner. We check every few seconds.
          </p>
          <button type="button" className="again-btn" onClick={resetAll}>
            Plan another date
          </button>
        </section>
      )}

      {session && !session.plan && !waiting && !needsGuestAnswers && (
        <section className="result">
          <h2>This session isn't ready yet</h2>
          <p className="summary">Ask the person who made it to start a new one.</p>
          <button type="button" className="again-btn" onClick={resetAll}>
            Plan another date
          </button>
        </section>
      )}

      {error && <p className="error">{error}</p>}

      {plan && (
        <section className="result" aria-live="polite">
          <h2 className="reveal-title">
            {plan.surprise ? "Your surprise date is ready 🎁" : "Your date is ready… 👀"}
          </h2>
          <p className="summary">
            {summaryText}
            {plan.free ? " · Free" : ""}
          </p>
          {plan.date && (
            <p className="when">
              📅 {formatDate(plan.date)}
              {plan.startTime ? " at " + formatTime(plan.startTime, 0) : ""}
            </p>
          )}

          {showBlend && <p className="blend">{blendText}</p>}
          {showBlend && tastesText && <p className="blend soft">{tastesText}</p>}

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
                      {s.place ? (
                        <>
                          <strong>{s.place.name}</strong>
                          <p>
                            {s.title}. {s.note}
                          </p>
                          <a
                            className="place-link"
                            href={mapsUrl(s.place)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open in Google Maps
                          </a>
                        </>
                      ) : (
                        <>
                          <strong>{s.title}</strong>
                          <p>{s.note}</p>
                        </>
                      )}
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
              {plan.free
                ? "Totally free 🎉"
                : formatMoney(total, plan.currency) + " estimated"}
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

          {session && (
            <button type="button" className="again-btn" onClick={resetAll}>
              Plan another date
            </button>
          )}
        </section>
      )}
    </main>
  );
}

export default App;