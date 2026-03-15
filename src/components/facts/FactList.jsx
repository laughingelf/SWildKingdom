import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const GROUPS = [
  "Mammals",
  "Birds",
  "Reptiles",
  "Amphibians",
  "Fish",
  "Insects",
  "Arachnids",
  "Marine Life",
];

function getSelectedGroupFromUrl() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const group = (params.get("group") || "").trim();
  return GROUPS.includes(group) ? group : null;
}

export default function FactsList() {
  const [facts, setFacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const selectedGroup = useMemo(() => getSelectedGroupFromUrl(), []);

  async function loadPublished() {
    setLoading(true);
    setError("");

    let query = supabase
      .from("facts")
      .select("id,title,fact,category,animal_group,created_at")
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (selectedGroup) query = query.eq("animal_group", selectedGroup);

    const { data, error } = await query;

    if (error) setError(error.message);
    else setFacts(data ?? []);

    setLoading(false);
  }

  useEffect(() => {
    loadPublished();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pageTitle = selectedGroup ? `${selectedGroup} facts` : "All facts";
  const subText = selectedGroup
    ? `Pick another group or browse the latest published facts in ${selectedGroup}.`
    : "Browse the latest published wildlife facts written by Sawyer.";

  return (
    <section className="factsSection" aria-label="Facts">
      <header className="head">
        <div>
          <p className="kicker">Facts</p>
          <h1 className="title">{pageTitle}</h1>
          <p className="sub">{subText}</p>
        </div>

        {selectedGroup ? (
          <a className="all" href="/facts">
            All facts →
          </a>
        ) : (
          <a className="all" href="/" title="Back home">
            Home →
          </a>
        )}
      </header>

      {/* Filter bar (same “card” system) */}
      <div className="filterCard" role="region" aria-label="Filter facts by group">
        <div className="filterTop">
          <span className="filterLabel">Filter by group</span>
          {selectedGroup ? (
            <a className="clear" href="/facts">
              Clear →
            </a>
          ) : (
            <span className="hint">Showing all</span>
          )}
        </div>

        <nav className="pillRow" aria-label="Animal group filters">
          <a
            href="/facts"
            className={`pillLink ${!selectedGroup ? "active" : ""}`}
            aria-current={!selectedGroup ? "page" : undefined}
          >
            All
          </a>

          {GROUPS.map((g) => (
            <a
              key={g}
              href={`/facts?group=${encodeURIComponent(g)}`}
              className={`pillLink ${selectedGroup === g ? "active" : ""}`}
              aria-current={selectedGroup === g ? "page" : undefined}
            >
              {g}
            </a>
          ))}
        </nav>
      </div>

      {/* States */}
      {loading ? (
        <div className="stateCard">Loading facts…</div>
      ) : error ? (
        <div className="stateCard error">
          <p className="errText">{error}</p>
          <button className="btn" onClick={loadPublished}>
            Try again
          </button>
        </div>
      ) : facts.length === 0 ? (
        <div className="stateCard">
          {selectedGroup
            ? `No published facts in ${selectedGroup} yet.`
            : "No facts published yet. Go to the admin page and publish one."}
        </div>
      ) : (
        <div className="factsGrid">
          {facts.map((f) => (
            <article key={f.id} className="card factCard">
              <div className="cardTop">
                <div className="pillStack">
                  <span className="pill">{f.category}</span>
                  {f.animal_group ? <span className="pill pillAlt">{f.animal_group}</span> : null}
                </div>
              </div>

              <h2 className="factTitle">{f.title}</h2>

              {/* keeps cards clean like your FeaturedFacts */}
              <p className="factBody">{f.fact}</p>

              <span className="go">Read more →</span>
            </article>
          ))}
        </div>
      )}

      <style>{`
        /* IMPORTANT:
           This component assumes your global CSS defines:
           --border, --bg-card, --text-main, --text-muted, --primary, --primary-dark
        */

        .factsSection { padding: 1.25rem 0 0.25rem; }

        .head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 0.9rem;
        }

        .kicker {
          margin: 0 0 0.35rem;
          font-weight: 900;
          font-size: 0.78rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: color-mix(in oklab, var(--text-muted) 70%, var(--primary) 30%);
        }

        .title { margin: 0; font-size: 1.8rem; letter-spacing: -0.02em; }
        .sub {
          margin: 0.5rem 0 0;
          color: var(--text-muted);
          line-height: 1.6;
          max-width: 70ch;
        }

        .all {
          text-decoration: none;
          font-weight: 900;
          color: var(--primary-dark);
          white-space: nowrap;
        }
        .all:hover { text-decoration: underline; }

        /* Filter uses same “card” language as ExploreWildlife */
        .filterCard {
          border: 1px solid var(--border);
          border-radius: 22px;
          background: var(--bg-card);
          padding: 1.05rem;
          box-shadow: 0 18px 60px rgba(0,0,0,.05);
          margin: 0.25rem 0 1.1rem;
        }

        .filterTop {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 0.75rem;
        }

        .filterLabel {
          font-weight: 900;
          font-size: 0.78rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: color-mix(in oklab, var(--text-muted) 75%, var(--primary) 25%);
        }

        .clear {
          text-decoration: none;
          font-weight: 900;
          color: var(--primary-dark);
          white-space: nowrap;
        }
        .clear:hover { text-decoration: underline; }

        .hint {
          color: var(--text-muted);
          font-size: 0.9rem;
          white-space: nowrap;
        }

        .pillRow {
          display: flex;
          flex-wrap: wrap;
          gap: 0.55rem;
        }

        .pillLink {
          display: inline-flex;
          width: fit-content;
          font-size: 0.75rem;
          font-weight: 900;
          padding: 0.35rem 0.65rem;
          border-radius: 999px;
          border: 1px solid color-mix(in oklab, var(--primary) 24%, var(--border) 76%);
          background: rgba(255,255,255,.85);
          color: var(--primary-dark);
          text-decoration: none;
          transition: transform 140ms ease, box-shadow 140ms ease, background 140ms ease;
        }

        .pillLink:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 30px rgba(0,0,0,.08);
          background: rgba(255,255,255,.95);
        }

        .pillLink.active {
          background: color-mix(in oklab, var(--primary) 10%, white 90%);
          border-color: color-mix(in oklab, var(--primary) 40%, var(--border) 60%);
        }

        /* Facts grid should match FeaturedFacts: 3-up on desktop */
        .factsGrid {
          display: grid;
          gap: 0.9rem;
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        /* Reuse your existing card look */
        .card {
          border: 1px solid var(--border);
          border-radius: 22px;
          background: var(--bg-card);
          padding: 1.15rem;
          box-shadow: 0 18px 60px rgba(0,0,0,.05);
          display: grid;
          gap: 0.65rem;
          transition: transform 140ms ease, box-shadow 140ms ease;
          color: var(--text-main);
          text-decoration: none;
        }

        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 24px 70px rgba(0,0,0,.08);
        }

        .cardTop {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.75rem;
        }

        .pillStack {
          display: inline-flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          align-items: center;
        }

        .pill {
          display: inline-flex;
          width: fit-content;
          font-size: 0.75rem;
          font-weight: 900;
          padding: 0.25rem 0.55rem;
          border-radius: 999px;
          border: 1px solid color-mix(in oklab, var(--primary) 30%, var(--border) 70%);
          background: rgba(255,255,255,.85);
          color: var(--primary-dark);
        }

        .pillAlt {
          border-color: color-mix(in oklab, var(--primary) 18%, var(--border) 82%);
          color: color-mix(in oklab, var(--primary-dark) 85%, var(--text-muted) 15%);
        }

        .factTitle {
          margin: 0;
          font-size: 1.05rem;
          letter-spacing: -0.01em;
          line-height: 1.25;
        }

        /* clamp like editorial cards (keeps grid tidy) */
        .factBody {
          margin: 0;
          color: var(--text-muted);
          line-height: 1.65;
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .go {
          width: fit-content;
          font-weight: 900;
          color: var(--primary-dark);
        }

        .stateCard {
          border: 1px solid var(--border);
          border-radius: 22px;
          background: var(--bg-card);
          padding: 1.05rem;
          box-shadow: 0 18px 60px rgba(0,0,0,.05);
          color: var(--text-main);
        }

        .stateCard.error {
          border-color: color-mix(in oklab, crimson 35%, var(--border) 65%);
        }

        .errText { margin: 0 0 0.75rem; color: crimson; font-weight: 700; }

        .btn {
          appearance: none;
          border: 1px solid var(--border);
          background: var(--primary-dark);
          color: white;
          font-weight: 900;
          padding: 0.55rem 0.75rem;
          border-radius: 14px;
          cursor: pointer;
        }

        @media (max-width: 980px) {
          .head { align-items: flex-start; flex-direction: column; }
          .factsGrid { grid-template-columns: 1fr; }
        }

        @media (max-width: 1200px) {
          .factsGrid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
      `}</style>
    </section>
  );
}